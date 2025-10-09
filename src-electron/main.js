const { app, BrowserWindow, ipcMain, dialog } = require('electron')
const path = require('path')
const isDev = require('electron-is-dev')
const fs = require('fs')

let dbPath = path.join(app.getPath('userData'), 'barcodes.json')
let db = { products: [], lastId: 0, clients: [], clientProducts: [], labelTemplates: [] }

function initDB() {
  try {
    if (fs.existsSync(dbPath)) {
      const data = JSON.parse(fs.readFileSync(dbPath, 'utf8'))
      db = data
      
      // Initialize new data structures if they don't exist
      if (!db.clients) db.clients = []
      if (!db.clientProducts) db.clientProducts = []
      if (!db.labelTemplates) db.labelTemplates = []
      
      // Set up global variables from database
      clients = db.clients || []
      clientProducts = db.clientProducts || []
      labelTemplates = db.labelTemplates || []
      
      // Update next IDs based on existing data
      nextClientId = Math.max(...clients.map(c => c.id), 0) + 1
      nextClientProductId = Math.max(...clientProducts.map(cp => cp.id), 0) + 1
      nextTemplateId = Math.max(...labelTemplates.map(t => t.id), 0) + 1
    } else {
      saveDB()
    }
    
    return Promise.resolve()
  } catch (err) {
    console.error('Database initialization error:', err)
    return Promise.reject(err)
  }
}

function saveDB() {
  try {
    // Update database object with current state
    db.clients = clients
    db.clientProducts = clientProducts
    db.labelTemplates = labelTemplates
    
    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2))
  } catch (err) {
    console.error('Database save error:', err)
    throw err
  }
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1100,
    height: 720,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  if (isDev) {
    win.loadURL('http://localhost:5173')
    win.webContents.openDevTools()
  } else {
    // Try multiple possible paths for the index.html file
    const possiblePaths = [
      path.join(__dirname, '..', 'dist', 'index.html'),
      path.join(__dirname, 'dist', 'index.html'),
      path.join(process.resourcesPath, 'app', 'dist', 'index.html'),
      path.join(process.resourcesPath, 'dist', 'index.html')
    ]
    
    let indexPath = null
    for (const tryPath of possiblePaths) {
      if (fs.existsSync(tryPath)) {
        indexPath = tryPath
        break
      }
    }
    
    if (indexPath) {
      console.log('Loading index.html from:', indexPath)
      win.loadFile(indexPath)
    } else {
      console.error('Could not find index.html. Checked paths:')
      possiblePaths.forEach(p => console.error(' -', p, 'exists:', fs.existsSync(p)))
      console.error('__dirname:', __dirname)
      console.error('process.resourcesPath:', process.resourcesPath)
      
      // Load a simple error page
      win.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(`
        <!DOCTYPE html>
        <html>
          <head><title>Error</title></head>
          <body>
            <h1>Application Error</h1>
            <p>Could not load the application files.</p>
            <p>Paths checked:</p>
            <ul>${possiblePaths.map(p => '<li>' + p + '</li>').join('')}</ul>
          </body>
        </html>
      `))
    }
  }
}

app.whenReady().then(async () => {
  await initDB()
  createWindow()
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow() })
})

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit() })

// ----------------------
// IPC handlers exposed by preload  
// ----------------------

// Initialize data structures for new features
let clients = []
let clientProducts = []
let labelTemplates = []
let nextClientId = 1
let nextClientProductId = 1
let nextTemplateId = 1

// ============ PRODUCT MANAGEMENT ============
ipcMain.handle('db-get-all-products', async (event) => {
  try {
    return db.products.sort((a, b) => b.id - a.id)
  } catch (err) {
    throw err
  }
})

ipcMain.handle('db-search-products', async (event, query) => {
  try {
    if (!query) return db.products.sort((a, b) => b.id - a.id)
    
    const term = query.toLowerCase()
    return db.products.filter(p => 
      p.description.toLowerCase().includes(term) ||
      (p.sku && p.sku.toLowerCase().includes(term)) ||
      (p.barcode && p.barcode.toLowerCase().includes(term)) ||
      (p.name && p.name.toLowerCase().includes(term)) ||
      (p.category && p.category.toLowerCase().includes(term))
    ).sort((a, b) => b.id - a.id)
  } catch (err) {
    throw err
  }
})

ipcMain.handle('db-update-product', async (event, id, payload) => {
  try {
    const productIndex = db.products.findIndex(p => p.id === id)
    if (productIndex === -1) {
      throw new Error('Product not found')
    }
    
    db.products[productIndex] = {
      ...db.products[productIndex],
      ...payload,
      id: id, // Preserve ID
      updated_at: new Date().toISOString()
    }
    
    saveDB()
    return db.products[productIndex]
  } catch (err) {
    throw err
  }
})

ipcMain.handle('db-delete-product', async (event, id) => {
  try {
    const productIndex = db.products.findIndex(p => p.id === id)
    if (productIndex === -1) {
      throw new Error('Product not found')
    }
    
    const deletedProduct = db.products.splice(productIndex, 1)[0]
    
    // Also remove from client-product relationships
    clientProducts = clientProducts.filter(cp => cp.product_id !== id)
    
    saveDB()
    return deletedProduct
  } catch (err) {
    throw err
  }
})

// ============ CLIENT MANAGEMENT ============
ipcMain.handle('db-get-all-clients', async (event) => {
  try {
    return clients.sort((a, b) => b.id - a.id)
  } catch (err) {
    throw err
  }
})

ipcMain.handle('db-add-client', async (event, payload) => {
  try {
    // Check for existing by company name or email
    const existing = clients.find(c => 
      c.company_name.toLowerCase() === payload.companyName.toLowerCase() ||
      c.email.toLowerCase() === payload.email.toLowerCase()
    )
    
    if (existing) {
      throw new Error(`Client with company name "${payload.companyName}" or email "${payload.email}" already exists`)
    }
    
    const newClient = {
      id: nextClientId++,
      company_name: payload.companyName,
      contact_name: payload.contactName || '',
      email: payload.email,
      phone: payload.phone || '',
      address: payload.address || '',
      notes: payload.notes || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    clients.push(newClient)
    saveDB()
    return newClient
  } catch (err) {
    throw err
  }
})

ipcMain.handle('db-get-client', async (event, id) => {
  try {
    return clients.find(c => c.id === id) || null
  } catch (err) {
    throw err
  }
})

ipcMain.handle('db-update-client', async (event, id, payload) => {
  try {
    const clientIndex = clients.findIndex(c => c.id === id)
    if (clientIndex === -1) {
      throw new Error('Client not found')
    }
    
    clients[clientIndex] = {
      ...clients[clientIndex],
      ...payload,
      id: id,
      updated_at: new Date().toISOString()
    }
    
    saveDB()
    return clients[clientIndex]
  } catch (err) {
    throw err
  }
})

ipcMain.handle('db-delete-client', async (event, id) => {
  try {
    const clientIndex = clients.findIndex(c => c.id === id)
    if (clientIndex === -1) {
      throw new Error('Client not found')
    }
    
    const deletedClient = clients.splice(clientIndex, 1)[0]
    
    // Also remove client-product relationships
    clientProducts = clientProducts.filter(cp => cp.client_id !== id)
    
    saveDB()
    return deletedClient
  } catch (err) {
    throw err
  }
})

// ============ CLIENT-PRODUCT RELATIONSHIPS ============
ipcMain.handle('db-get-client-products', async (event, clientId) => {
  try {
    const clientProductList = clientProducts.filter(cp => cp.client_id === clientId)
    
    // Join with product and template data
    return clientProductList.map(cp => {
      const product = db.products.find(p => p.id === cp.product_id)
      const template = cp.template_id ? labelTemplates.find(t => t.id === cp.template_id) : null
      return {
        ...cp,
        product: product,
        template: template
      }
    })
  } catch (err) {
    throw err
  }
})

ipcMain.handle('db-add-client-product', async (event, { clientId, productId, orderFrequency, notes, templateId }) => {
  try {
    // Check if relationship already exists
    const existing = clientProducts.find(cp => 
      cp.client_id === clientId && cp.product_id === productId
    )
    
    if (existing) {
      throw new Error('This product is already assigned to this client')
    }
    
    const newClientProduct = {
      id: nextClientProductId++,
      client_id: clientId,
      product_id: productId,
      order_frequency: orderFrequency || 'As needed',
      last_ordered: null,
      notes: notes || '',
      template_id: templateId || null,
      template_config: null
    }
    
    clientProducts.push(newClientProduct)
    saveDB()
    return newClientProduct
  } catch (err) {
    throw err
  }
})

ipcMain.handle('db-remove-client-product', async (event, { clientId, productId }) => {
  try {
    const index = clientProducts.findIndex(cp => 
      cp.client_id === clientId && cp.product_id === productId
    )
    
    if (index === -1) {
      throw new Error('Client-product relationship not found')
    }
    
    const removed = clientProducts.splice(index, 1)[0]
    saveDB()
    return removed
  } catch (err) {
    throw err
  }
})

ipcMain.handle('db-update-client-product-template', async (event, { clientId, productId, templateId, templateConfig }) => {
  try {
    const clientProduct = clientProducts.find(cp => 
      cp.client_id === clientId && cp.product_id === productId
    )
    
    if (!clientProduct) {
      throw new Error('Client-product relationship not found')
    }
    
    clientProduct.template_id = templateId
    clientProduct.template_config = templateConfig || null
    
    saveDB()
    return clientProduct
  } catch (err) {
    throw err
  }
})

// ============ TEMPLATE MANAGEMENT ============
ipcMain.handle('db-get-all-templates', async (event) => {
  try {
    return labelTemplates.sort((a, b) => b.id - a.id)
  } catch (err) {
    throw err
  }
})

ipcMain.handle('db-save-template', async (event, payload) => {
  try {
    const newTemplate = {
      id: nextTemplateId++,
      name: payload.name,
      description: payload.description || '',
      template_data: payload.templateData,
      created_at: new Date().toISOString()
    }
    
    labelTemplates.push(newTemplate)
    saveDB()
    return newTemplate
  } catch (err) {
    throw err
  }
})

ipcMain.handle('db-get-template', async (event, id) => {
  try {
    return labelTemplates.find(t => t.id === id) || null
  } catch (err) {
    throw err
  }
})

ipcMain.handle('db-delete-template', async (event, id) => {
  try {
    const templateIndex = labelTemplates.findIndex(t => t.id === id)
    if (templateIndex === -1) {
      throw new Error('Template not found')
    }
    
    const deleted = labelTemplates.splice(templateIndex, 1)[0]
    
    // Remove template assignments from client products
    clientProducts.forEach(cp => {
      if (cp.template_id === id) {
        cp.template_id = null
        cp.template_config = null
      }
    })
    
    saveDB()
    return deleted
  } catch (err) {
    throw err
  }
})

// ============ LEGACY PRODUCT HANDLERS (Updated) ============
ipcMain.handle('db-add-product', async (event, payload) => {
  try {
    // Handle both old and new payload formats
    const description = payload.description || payload.name
    const sku = payload.sku || `SKU${Date.now()}`
    const barcodeType = payload.barcodeType || 'code128'
    const customBarcode = payload.customBarcode
    
    // Check for existing by SKU or exact description
    if (sku) {
      const existingBySku = db.products.find(p => p.sku === sku)
      if (existingBySku) return existingBySku
    }
    
    const existingByDesc = db.products.find(p => p.description === description || p.name === description)
    if (existingByDesc) return existingByDesc
    
    // Insert new product
    db.lastId++
    const id = db.lastId
    
    let barcodeVal = customBarcode || `PRD${String(id).padStart(8, '0')}`
    
    // Validate and normalize barcode data
    try {
      barcodeVal = validateBarcodeData(barcodeType, barcodeVal)
    } catch (validationError) {
      console.warn('Barcode validation warning:', validationError.message)
      // Use the original value if validation fails
    }
    
    const product = {
      id,
      name: description, // Support both name and description
      description,
      sku: sku || null,
      category: payload.category || '',
      price: parseFloat(payload.price) || 0,
      weight: payload.weight || '',
      dimensions: payload.dimensions || '',
      manufacturer: payload.manufacturer || '',
      barcode: barcodeVal,
      barcode_type: barcodeType,
      photo_path: payload.photoPath || null,
      image_path: payload.photoPath || null,
      notes: payload.notes || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    db.products.push(product)
    saveDB()
    
    return product
  } catch (err) {
    throw err
  }
})

ipcMain.handle('db-search', async (event, q) => {
  try {
    const term = q.toLowerCase()
    return db.products.filter(p => 
      p.description.toLowerCase().includes(term) ||
      (p.sku && p.sku.toLowerCase().includes(term)) ||
      (p.barcode && p.barcode.toLowerCase().includes(term))
    ).sort((a, b) => b.id - a.id).slice(0, 500)
  } catch (err) {
    throw err
  }
})

ipcMain.handle('db-get', async (event, id) => {
  try {
    return db.products.find(p => p.id === id) || null
  } catch (err) {
    throw err
  }
})

ipcMain.handle('fs-save-image', async (event, { base64, suggestedName }) => {
  const buffer = Buffer.from(base64.split(',')[1], 'base64')
  const folder = path.join(app.getPath('userData'), 'images')
  if (!fs.existsSync(folder)) fs.mkdirSync(folder, { recursive: true })
  const filePath = path.join(folder, suggestedName)
  fs.writeFileSync(filePath, buffer)
  return filePath
})

ipcMain.handle('dialog-show-save', async (event, { defaultName }) => {
  const win = BrowserWindow.getFocusedWindow()
  const res = await dialog.showSaveDialog(win, { defaultPath: defaultName, filters: [{ name: 'PNG', extensions: ['png'] }] })
  return res.filePath
})

ipcMain.handle('saveImageToDisk', async (event, { base64, suggestedName }) => {
  try {
    const win = BrowserWindow.getFocusedWindow()
    const res = await dialog.showSaveDialog(win, { 
      defaultPath: suggestedName, 
      filters: [{ name: 'PNG Images', extensions: ['png'] }] 
    })
    
    if (res.canceled || !res.filePath) {
      return { success: false, message: 'Save cancelled by user' }
    }

    const buffer = Buffer.from(base64.split(',')[1], 'base64')
    fs.writeFileSync(res.filePath, buffer)
    return { success: true, filePath: res.filePath }
  } catch (error) {
    console.error('Save image error:', error)
    return { success: false, message: error.message }
  }
})

ipcMain.handle('db-update-image-path', async (event, { id, imagePath }) => {
  try {
    const product = db.products.find(p => p.id === id)
    if (product) {
      product.image_path = imagePath
      saveDB()
      return product
    }
    return null
  } catch (err) {
    throw err
  }
})

ipcMain.handle('db-reset', async (event) => {
  try {
    db.products = []
    db.lastId = 0
    db.clients = []
    db.clientProducts = []
    db.labelTemplates = []
    
    // Reset global variables
    clients = []
    clientProducts = []
    labelTemplates = []
    nextClientId = 1
    nextClientProductId = 1
    nextTemplateId = 1
    
    saveDB()
    
    console.log('Database reset: All data deleted')
    return { success: true, message: 'Database reset successfully' }
  } catch (err) {
    throw err
  }
})

ipcMain.handle('db-backup', async (event) => {
  try {
    const backup = {
      timestamp: new Date().toISOString(),
      version: '2.0',
      products: db.products,
      clients: clients,
      clientProducts: clientProducts,
      labelTemplates: labelTemplates
    }
    
    return backup
  } catch (err) {
    throw err
  }
})

ipcMain.handle('db-restore', async (event, backupData) => {
  try {
    if (!backupData) {
      throw new Error('Invalid backup data')
    }
    
    // Clear existing data
    db.products = []
    db.lastId = 0
    clients = []
    clientProducts = []
    labelTemplates = []
    
    // Restore data (handle both v1 and v2 backups)
    if (backupData.products && Array.isArray(backupData.products)) {
      db.products = backupData.products
      db.lastId = backupData.products.length > 0 ? Math.max(...backupData.products.map(p => p.id)) : 0
    }
    
    if (backupData.clients && Array.isArray(backupData.clients)) {
      clients = backupData.clients
    }
    
    if (backupData.clientProducts && Array.isArray(backupData.clientProducts)) {
      clientProducts = backupData.clientProducts
    }
    
    if (backupData.labelTemplates && Array.isArray(backupData.labelTemplates)) {
      labelTemplates = backupData.labelTemplates
    }
    
    // Update next IDs
    nextClientId = clients.length > 0 ? Math.max(...clients.map(c => c.id)) + 1 : 1
    nextClientProductId = clientProducts.length > 0 ? Math.max(...clientProducts.map(cp => cp.id)) + 1 : 1
    nextTemplateId = labelTemplates.length > 0 ? Math.max(...labelTemplates.map(t => t.id)) + 1 : 1
    
    saveDB()
    
    return { 
      success: true, 
      message: `Database restored: ${db.products.length} products, ${clients.length} clients, ${labelTemplates.length} templates`,
      counts: {
        products: db.products.length,
        clients: clients.length,
        templates: labelTemplates.length
      }
    }
  } catch (err) {
    throw err
  }
})

ipcMain.handle('get-database-info', async (event) => {
  return {
    path: dbPath,
    exists: fs.existsSync(dbPath),
    size: fs.existsSync(dbPath) ? fs.statSync(dbPath).size : 0
  }
})

ipcMain.handle('list-barcode-types', () => {
  // Comprehensive list of barcode types supported by bwip-js
  return [
    // Linear barcodes
    'code128',     // Code 128 (most common)
    'code39',      // Code 39 
    'code93',      // Code 93
    'ean13',       // EAN-13 (13-digit)
    'ean8',        // EAN-8 (8-digit)
    'upc-a',       // UPC-A (12-digit)
    'upc-e',       // UPC-E (8-digit)
    'itf14',       // ITF-14 (14-digit)
    'itf',         // Interleaved 2 of 5
    'i25',         // Industrial 2 of 5
    'c25inter',    // Code 25 Interleaved
    'c25iata',     // Code 25 IATA
    'c25logic',    // Code 25 Logic
    'c25ind',      // Code 25 Industrial
    'msi',         // MSI Plessey
    'plessey',     // Plessey
    'telepen',     // Telepen
    'telepennumeric', // Telepen Numeric
    'codabar',     // Codabar
    'nw-7',        // NW-7 (same as Codabar)
    'monarch',     // Monarch
    'code11',      // Code 11
    'bc412',       // BC412
    'rationalizedCodabar', // Rationalized Codabar
    
    // 2D barcodes
    'qrcode',      // QR Code
    'pdf417',      // PDF417
    'datamatrix',  // Data Matrix
    'azteccode',   // Aztec Code
    'maxicode',    // MaxiCode
    'micropdf417', // MicroPDF417
    'microqr',     // Micro QR Code
    'dotcode',     // DotCode
    'hanxin',      // Han Xin Code
    'gridmatrix',  // Grid Matrix
    'codeone',     // Code One
    'ultracode',   // Ultracode
    
    // Postal barcodes
    'royalmail',   // Royal Mail 4-State
    'auspost',     // Australia Post
    'postnet',     // POSTNET
    'planet',      // PLANET
    'usps4cb',     // USPS 4-CB
    'japanpost',   // Japan Post
    'kix',         // KIX
    'daft',        // DAFT
    'flattermarken', // Flattermarken
    'onecode',     // USPS OneCode
    
    // GS1 barcodes
    'gs1-128',     // GS1-128
    'gs1-cc',      // GS1 Composite
    'gs1datamatrix', // GS1 Data Matrix
    'gs1qrcode',   // GS1 QR Code
    
    // Specialty
    'pharmacode',  // Pharmacode
    'pharmacode2', // Two-track Pharmacode
    'pzn',         // Pharmazentralnummer
    'code32',      // Italian Pharmacode
    'hibc128',     // HIBC Code 128
    'hibc39',      // HIBC Code 39
    'hibcdatamatrix', // HIBC Data Matrix
    'hibcpdf417',  // HIBC PDF417
    'hibcqrcode',  // HIBC QR Code
    'hibcmicropdf417', // HIBC MicroPDF417
    'hibccodablockf',  // HIBC Codablock F
    'hibcazteccode',   // HIBC Aztec Code
  ]
})

// Barcode validation function
function validateBarcodeData(type, data) {
  if (!data) return data
  
  const cleanData = String(data).trim()
  
  switch (type.toLowerCase()) {
    case 'ean13':
      // EAN-13 should be 12 or 13 digits
      const ean13 = cleanData.replace(/\D/g, '')
      if (ean13.length === 12) {
        return ean13 + calculateEAN13CheckDigit(ean13)
      } else if (ean13.length === 13) {
        return ean13
      }
      return cleanData
      
    case 'ean8':
      // EAN-8 should be 7 or 8 digits
      const ean8 = cleanData.replace(/\D/g, '')
      if (ean8.length === 7) {
        return ean8 + calculateEAN8CheckDigit(ean8)
      } else if (ean8.length === 8) {
        return ean8
      }
      return cleanData
      
    case 'upc-a':
      // UPC-A should be 11 or 12 digits
      const upca = cleanData.replace(/\D/g, '')
      if (upca.length === 11) {
        return upca + calculateUPCACheckDigit(upca)
      } else if (upca.length === 12) {
        return upca
      }
      return cleanData
      
    case 'code39':
      // Code 39 supports A-Z, 0-9, and special chars
      return cleanData.toUpperCase().replace(/[^A-Z0-9\-\.\s\$\/\+%]/g, '')
      
    case 'code128':
      // Code 128 supports full ASCII
      return cleanData
      
    case 'qrcode':
    case 'datamatrix':
      // 2D codes support full UTF-8
      return cleanData
      
    default:
      return cleanData
  }
}

function calculateEAN13CheckDigit(code12) {
  const digits = code12.split('').map(Number)
  let sum = 0
  for (let i = 0; i < 12; i++) {
    sum += digits[i] * (i % 2 === 0 ? 1 : 3)
  }
  return ((10 - (sum % 10)) % 10).toString()
}

function calculateEAN8CheckDigit(code7) {
  const digits = code7.split('').map(Number)
  let sum = 0
  for (let i = 0; i < 7; i++) {
    sum += digits[i] * (i % 2 === 0 ? 3 : 1)
  }
  return ((10 - (sum % 10)) % 10).toString()
}

function calculateUPCACheckDigit(code11) {
  const digits = code11.split('').map(Number)
  let sum = 0
  for (let i = 0; i < 11; i++) {
    sum += digits[i] * (i % 2 === 0 ? 3 : 1)
  }
  return ((10 - (sum % 10)) % 10).toString()
}
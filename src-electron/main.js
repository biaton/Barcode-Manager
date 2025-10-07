const { app, BrowserWindow, ipcMain, dialog } = require('electron')
const path = require('path')
const isDev = require('electron-is-dev')
const fs = require('fs')

let dbPath = path.join(app.getPath('userData'), 'barcodes.json')
let db = { products: [], lastId: 0 }

function initDB() {
  try {
    if (fs.existsSync(dbPath)) {
      const data = JSON.parse(fs.readFileSync(dbPath, 'utf8'))
      db = data
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

ipcMain.handle('db-add-product', async (event, { description, sku, barcodeType, customBarcode }) => {
  try {
    // Validate barcode type and data
    const type = barcodeType || 'code128'
    
    // Check for existing by SKU or exact description
    if (sku) {
      const existingBySku = db.products.find(p => p.sku === sku)
      if (existingBySku) return existingBySku
    }
    
    const existingByDesc = db.products.find(p => p.description === description)
    if (existingByDesc) return existingByDesc
    
    // Insert new product
    db.lastId++
    const id = db.lastId
    
    let barcodeVal = customBarcode || `PRD${String(id).padStart(8, '0')}`
    
    // Validate and normalize barcode data
    try {
      barcodeVal = validateBarcodeData(type, barcodeVal)
    } catch (validationError) {
      console.warn('Barcode validation warning:', validationError.message)
      // Use the original value if validation fails
    }
    
    const product = {
      id,
      description,
      sku: sku || null,
      barcode: barcodeVal,
      barcode_type: type,
      image_path: null,
      created_at: new Date().toISOString()
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
    saveDB()
    
    console.log('Database reset: All products deleted')
    return { success: true, message: 'Database reset successfully' }
  } catch (err) {
    throw err
  }
})

ipcMain.handle('db-backup', async (event) => {
  try {
    const backup = {
      timestamp: new Date().toISOString(),
      version: '1.0',
      products: db.products
    }
    
    return backup
  } catch (err) {
    throw err
  }
})

ipcMain.handle('db-restore', async (event, backupData) => {
  try {
    if (!backupData || !backupData.products || !Array.isArray(backupData.products)) {
      throw new Error('Invalid backup data format')
    }
    
    // Clear existing data and restore
    db.products = backupData.products
    db.lastId = backupData.products.length > 0 ? Math.max(...backupData.products.map(p => p.id)) : 0
    saveDB()
    
    return { 
      success: true, 
      message: `Database restored: ${backupData.products.length} products`, 
      count: backupData.products.length 
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
const { app, BrowserWindow, ipcMain, dialog } = require('electron')
const path = require('path')
const isDev = require('electron-is-dev')
const fs = require('fs')
const Database = require('better-sqlite3')

let dbPath = path.join(app.getPath('userData'), 'barcodes.db')
let db

function initDB() {
  try {
    const exists = fs.existsSync(dbPath)
    db = new Database(dbPath)
    
    if (!exists) {
      db.exec(`
        CREATE TABLE products (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          description TEXT NOT NULL,
          sku TEXT,
          barcode TEXT UNIQUE,
          barcode_type TEXT,
          image_path TEXT,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
      `)
    }
    
    // Prepare statements for better performance
    db.getProductBySku = db.prepare('SELECT * FROM products WHERE sku = ?')
    db.getProductByDescription = db.prepare('SELECT * FROM products WHERE description = ?')
    db.getProductById = db.prepare('SELECT * FROM products WHERE id = ?')
    db.insertProduct = db.prepare('INSERT INTO products (description, sku, barcode_type) VALUES (?, ?, ?)')
    db.updateBarcode = db.prepare('UPDATE products SET barcode = ? WHERE id = ?')
    db.searchProducts = db.prepare('SELECT * FROM products WHERE description LIKE ? OR sku LIKE ? OR barcode LIKE ? ORDER BY id DESC LIMIT 500')
    db.updateImagePath = db.prepare('UPDATE products SET image_path = ? WHERE id = ?')
    db.getAllProducts = db.prepare('SELECT * FROM products ORDER BY id')
    db.deleteAllProducts = db.prepare('DELETE FROM products')
    db.resetSequence = db.prepare('DELETE FROM sqlite_sequence WHERE name="products"')
    db.insertBackupProduct = db.prepare('INSERT INTO products (description, sku, barcode, barcode_type, image_path, created_at) VALUES (?, ?, ?, ?, ?, ?)')
    
    return Promise.resolve(db)
  } catch (err) {
    return Promise.reject(err)
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
    win.loadFile(path.join(__dirname, '..', 'dist', 'index.html'))
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
      const existingBySku = db.getProductBySku.get(sku)
      if (existingBySku) return existingBySku
    }
    
    const existingByDesc = db.getProductByDescription.get(description)
    if (existingByDesc) return existingByDesc
    
    // Insert new product
    const result = db.insertProduct.run(description, sku || null, type)
    const id = result.lastInsertRowid
    
    let barcodeVal = customBarcode || `PRD${String(id).padStart(8, '0')}`
    
    // Validate and normalize barcode data
    try {
      barcodeVal = validateBarcodeData(type, barcodeVal)
    } catch (validationError) {
      console.warn('Barcode validation warning:', validationError.message)
      // Use the original value if validation fails
    }
    
    db.updateBarcode.run(barcodeVal, id)
    
    return db.getProductById.get(id)
  } catch (err) {
    throw err
  }
})

ipcMain.handle('db-search', async (event, q) => {
  try {
    const term = `%${q}%`
    return db.searchProducts.all(term, term, term)
  } catch (err) {
    throw err
  }
})

ipcMain.handle('db-get', async (event, id) => {
  try {
    return db.getProductById.get(id)
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
    db.updateImagePath.run(imagePath, id)
    return db.getProductById.get(id)
  } catch (err) {
    throw err
  }
})

ipcMain.handle('db-reset', async (event) => {
  try {
    db.deleteAllProducts.run()
    
    // Reset auto-increment counter
    try {
      db.resetSequence.run()
    } catch (err) {
      console.warn('Could not reset auto-increment:', err.message)
    }
    
    console.log('Database reset: All products deleted')
    return { success: true, message: 'Database reset successfully' }
  } catch (err) {
    throw err
  }
})

ipcMain.handle('db-backup', async (event) => {
  try {
    const rows = db.getAllProducts.all()
    
    const backup = {
      timestamp: new Date().toISOString(),
      version: '1.0',
      products: rows
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
    
    // First clear existing data
    db.deleteAllProducts.run()
    
    // Reset auto-increment
    try {
      db.resetSequence.run()
    } catch (err) {
      console.warn('Could not reset auto-increment:', err.message)
    }
    
    // Insert backup data
    const insertMany = db.transaction((products) => {
      for (const product of products) {
        db.insertBackupProduct.run(
          product.description,
          product.sku,
          product.barcode,
          product.barcode_type,
          product.image_path,
          product.created_at
        )
      }
    })
    
    insertMany(backupData.products)
    
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
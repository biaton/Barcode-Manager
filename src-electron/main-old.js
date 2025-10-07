const { app, BrowserWindow, ipcMain, dialog } = require('electron')
const path = require('path')
const isDev = require('electron-is-dev')
const fs = require('fs')
const Database = require('better-sqlite3')

let dbPath = path.join(app.getPath('userData'), 'barcodes.db')
let db

function initDB() {
  return new Promise((resolve, reject) => {
    const exists = fs.existsSync(dbPath)
    try {
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
      resolve(db)
    } catch (err) {
      reject(err)
    }
  })
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
  return new Promise((resolve, reject) => {
    // Validate barcode type and data
    const type = barcodeType || 'code128'
    
    // Check for existing by SKU or exact description
    const checkBySku = sku ? 
      db.get('SELECT * FROM products WHERE sku = ?', [sku], (err, row) => {
        if (err) return reject(err)
        if (row) return resolve(row)
        
        // Check by description
        db.get('SELECT * FROM products WHERE description = ?', [description], (err, row) => {
          if (err) return reject(err)
          if (row) return resolve(row)
          
          // Insert new product
          insertProduct()
        })
      }) :
      db.get('SELECT * FROM products WHERE description = ?', [description], (err, row) => {
        if (err) return reject(err)
        if (row) return resolve(row)
        insertProduct()
      })
    
    function insertProduct() {
      db.run('INSERT INTO products (description, sku, barcode_type) VALUES (?, ?, ?)', 
        [description, sku || null, type], 
        function(err) {
          if (err) return reject(err)
          
          const id = this.lastID
          let barcodeVal = customBarcode || `PRD${String(id).padStart(8, '0')}`
          
          // Validate and normalize barcode data
          try {
            barcodeVal = validateBarcodeData(type, barcodeVal)
          } catch (validationError) {
            console.warn('Barcode validation warning:', validationError.message)
            // Use the original value if validation fails
          }
          
          db.run('UPDATE products SET barcode = ? WHERE id = ?', [barcodeVal, id], (err) => {
            if (err) return reject(err)
            
            db.get('SELECT * FROM products WHERE id = ?', [id], (err, row) => {
              if (err) return reject(err)
              resolve(row)
            })
          })
        })
    }
  })
})

ipcMain.handle('db-search', async (event, q) => {
  return new Promise((resolve, reject) => {
    const term = `%${q}%`
    db.all('SELECT * FROM products WHERE description LIKE ? OR sku LIKE ? OR barcode LIKE ? ORDER BY id DESC LIMIT 500', 
      [term, term, term], (err, rows) => {
        if (err) return reject(err)
        resolve(rows)
      })
  })
})

ipcMain.handle('db-get', async (event, id) => {
  return new Promise((resolve, reject) => {
    db.get('SELECT * FROM products WHERE id = ?', [id], (err, row) => {
      if (err) return reject(err)
      resolve(row)
    })
  })
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
  return new Promise((resolve, reject) => {
    db.run('UPDATE products SET image_path = ? WHERE id = ?', [imagePath, id], (err) => {
      if (err) return reject(err)
      
      db.get('SELECT * FROM products WHERE id = ?', [id], (err, row) => {
        if (err) return reject(err)
        resolve(row)
      })
    })
  })
})

ipcMain.handle('db-reset', async (event) => {
  return new Promise((resolve, reject) => {
    db.run('DELETE FROM products', (err) => {
      if (err) return reject(err)
      
      // Reset auto-increment counter
      db.run('DELETE FROM sqlite_sequence WHERE name="products"', (err) => {
        if (err) {
          console.warn('Could not reset auto-increment:', err.message)
        }
        console.log('Database reset: All products deleted')
        resolve({ success: true, message: 'Database reset successfully' })
      })
    })
  })
})

ipcMain.handle('db-backup', async (event) => {
  return new Promise((resolve, reject) => {
    db.all('SELECT * FROM products ORDER BY id', (err, rows) => {
      if (err) return reject(err)
      
      const backup = {
        timestamp: new Date().toISOString(),
        version: '1.0',
        products: rows
      }
      
      resolve(backup)
    })
  })
})

ipcMain.handle('db-restore', async (event, backupData) => {
  return new Promise((resolve, reject) => {
    if (!backupData || !backupData.products || !Array.isArray(backupData.products)) {
      return reject(new Error('Invalid backup data format'))
    }
    
    // First clear existing data
    db.run('DELETE FROM products', (err) => {
      if (err) return reject(err)
      
      // Reset auto-increment
      db.run('DELETE FROM sqlite_sequence WHERE name="products"', (err) => {
        if (err) console.warn('Could not reset auto-increment:', err.message)
        
        // Insert backup data
        const insertStmt = db.prepare('INSERT INTO products (description, sku, barcode, barcode_type, image_path, created_at) VALUES (?, ?, ?, ?, ?, ?)')
        
        let processed = 0
        const total = backupData.products.length
        
        if (total === 0) {
          insertStmt.finalize()
          return resolve({ success: true, message: 'Database restored (empty backup)', count: 0 })
        }
        
        backupData.products.forEach(product => {
          insertStmt.run([
            product.description,
            product.sku,
            product.barcode,
            product.barcode_type,
            product.image_path,
            product.created_at
          ], (err) => {
            if (err) {
              console.error('Error restoring product:', err)
            }
            
            processed++
            if (processed === total) {
              insertStmt.finalize()
              resolve({ success: true, message: `Database restored: ${processed} products`, count: processed })
            }
          })
        })
      })
    })
  })
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
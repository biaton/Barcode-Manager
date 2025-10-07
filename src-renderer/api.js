// Mock API for browser testing when window.api is not available
const mockProducts = [
  {
    id: 1,
    description: 'Sample Product 1',
    sku: 'SKU001',
    barcode: 'PRD00000001',
    barcode_type: 'code128',
    created_at: new Date().toISOString()
  },
  {
    id: 2,
    description: 'Sample Product 2',
    sku: 'SKU002',
    barcode: 'PRD00000002',
    barcode_type: 'ean13',
    created_at: new Date().toISOString()
  }
]

let nextId = 3

const mockAPI = {
  async addProduct(payload) {
    console.log('Mock API: Adding product:', payload)
    
    // Check for existing by SKU or description
    const existing = mockProducts.find(p => 
      (payload.sku && p.sku === payload.sku) || 
      p.description === payload.description
    )
    
    if (existing) {
      console.log('Mock API: Found existing product:', existing)
      return existing
    }
    
    const newProduct = {
      id: nextId++,
      description: payload.description,
      sku: payload.sku,
      barcode: payload.customBarcode || `PRD${String(nextId-1).padStart(8, '0')}`,
      barcode_type: payload.barcodeType || 'code128',
      created_at: new Date().toISOString()
    }
    
    console.log('Mock API: Creating new product:', newProduct)
    mockProducts.push(newProduct)
    console.log('Mock API: Total products now:', mockProducts.length)
    return newProduct
  },

  async search(query) {
    if (!query) return mockProducts
    
    const term = query.toLowerCase()
    return mockProducts.filter(p => 
      p.description.toLowerCase().includes(term) ||
      (p.sku && p.sku.toLowerCase().includes(term)) ||
      p.barcode.toLowerCase().includes(term)
    )
  },

  async getProduct(id) {
    return mockProducts.find(p => p.id === id)
  },

  async saveImageToDisk({ base64, suggestedName }) {
    // In browser, we'll trigger a download
    const link = document.createElement('a')
    link.href = base64
    link.download = suggestedName
    link.click()
    return `Downloaded: ${suggestedName}`
  },

  async showSaveDialog({ defaultName }) {
    // In browser, return the default name
    return defaultName
  },

  async updateImagePath({ id, imagePath }) {
    const product = mockProducts.find(p => p.id === id)
    if (product) {
      product.image_path = imagePath
    }
    return product
  },

  async listBarcodeTypes() {
    return [
      // Linear barcodes
      'code128', 'code39', 'code93', 'ean13', 'ean8', 'upc-a', 'upc-e', 
      'itf14', 'itf', 'i25', 'c25inter', 'c25iata', 'c25logic', 'c25ind',
      'msi', 'plessey', 'telepen', 'telepennumeric', 'codabar', 'nw-7',
      'monarch', 'code11', 'bc412', 'rationalizedCodabar',
      
      // 2D barcodes
      'qrcode', 'pdf417', 'datamatrix', 'azteccode', 'maxicode', 'micropdf417',
      'microqr', 'dotcode', 'hanxin', 'gridmatrix', 'codeone', 'ultracode',
      
      // Postal barcodes
      'royalmail', 'auspost', 'postnet', 'planet', 'usps4cb', 'japanpost',
      'kix', 'daft', 'flattermarken', 'onecode',
      
      // GS1 barcodes
      'gs1-128', 'gs1-cc', 'gs1datamatrix', 'gs1qrcode',
      
      // Specialty
      'pharmacode', 'pharmacode2', 'pzn', 'code32', 'hibc128', 'hibc39',
      'hibcdatamatrix', 'hibcpdf417', 'hibcqrcode', 'hibcmicropdf417',
      'hibccodablockf', 'hibcazteccode'
    ]
  },

  async resetDatabase() {
    console.log('Mock API: Resetting database')
    mockProducts.length = 0 // Clear array
    nextId = 1
    return { success: true, message: 'Database reset successfully' }
  },

  async backupDatabase() {
    return {
      timestamp: new Date().toISOString(),
      version: '1.0',
      products: [...mockProducts] // Copy array
    }
  },

  async restoreDatabase(backupData) {
    if (!backupData || !backupData.products) {
      throw new Error('Invalid backup data')
    }
    
    mockProducts.length = 0 // Clear current data
    mockProducts.push(...backupData.products) // Restore data
    nextId = Math.max(...mockProducts.map(p => p.id), 0) + 1
    
    return { 
      success: true, 
      message: `Database restored: ${backupData.products.length} products`,
      count: backupData.products.length 
    }
  },

  async getDatabaseInfo() {
    return {
      path: 'Browser Mock Database (in memory)',
      exists: true,
      size: JSON.stringify(mockProducts).length,
      isMock: true
    }
  }
}

// Create a safe API object that works in both browser and Electron
export const api = window.api || mockAPI

// Also expose it globally for easier debugging in browser
if (typeof window !== 'undefined' && !window.api) {
  window.api = mockAPI
}
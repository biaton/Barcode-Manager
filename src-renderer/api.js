// New comprehensive data model
const mockProducts = [
  {
    id: 1,
    name: 'Sample Product 1',
    sku: 'SKU001',
    description: 'This is a sample product for testing',
    category: 'Electronics',
    price: 29.99,
    weight: '2.5 kg',
    dimensions: '10x5x3 cm',
    manufacturer: 'Sample Corp',
    barcode: 'BRC157458901',
    barcode_type: 'code128',
    photo_path: null,
    notes: 'Sample notes about the product',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 2,
    name: 'Sample Product 2',
    sku: 'SKU002', 
    description: 'Another sample product',
    category: 'Home & Garden',
    price: 15.50,
    weight: '1.0 kg',
    dimensions: '15x10x2 cm',
    manufacturer: 'Home Inc',
    barcode: 'BRC157458902',
    barcode_type: 'ean13',
    photo_path: null,
    notes: 'Additional product information',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
]

const mockClients = [
  {
    id: 1,
    company_name: 'ABC Corporation',
    contact_name: 'John Smith',
    email: 'john@abc-corp.com',
    phone: '+1-555-0123',
    address: '123 Business St, City, State 12345',
    notes: 'Regular client, orders monthly',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
]

const mockClientProducts = [
  {
    id: 1,
    client_id: 1,
    product_id: 1,
    order_frequency: 'Monthly',
    last_ordered: new Date().toISOString(),
    notes: 'Client always orders this product',
    template_id: null, // Associated label template
    template_config: null // Custom template configuration for this client-product combination
  }
]

const mockLabelTemplates = [
  {
    id: 1,
    name: 'Standard Product Label',
    description: 'Default template for product labels',
    template_data: {
      width: 400,
      height: 300,
      companyName: 'AIM Inc.',
      includeQR: true,
      includePhoto: false,
      customFields: [
        { label: 'SKU:', show: true },
        { label: 'Price:', show: true },
        { label: 'Weight:', show: false }
      ]
    },
    created_at: new Date().toISOString()
  }
]

let nextProductId = 3
let nextClientId = 2
let nextClientProductId = 2
let nextTemplateId = 2

const mockAPI = {
  // ============ PRODUCT MANAGEMENT ============
    async addProduct(payload) {
    console.log('Mock API: Adding product:', payload)
    
    // Handle both old and new payload formats for compatibility
    const name = payload.name || payload.description
    const sku = payload.sku || `SKU${Date.now()}`
    
    // Check for existing by SKU
    const existing = mockProducts.find(p => p.sku === sku)
    if (existing) {
      console.log('Mock API: Found existing product:', existing)
      return existing // Return existing instead of throwing error for compatibility
    }
    
    // Use provided barcode or generate default
    const barcode = payload.customBarcode || `BRC${Date.now()}${String(nextProductId).padStart(3, '0')}`
    
    const newProduct = {
      id: nextProductId++,
      name: name,
      sku: sku,
      description: payload.description || name || '',
      category: payload.category || '',
      price: parseFloat(payload.price) || 0,
      weight: payload.weight || '',
      dimensions: payload.dimensions || '',
      manufacturer: payload.manufacturer || '',
      barcode: barcode,
      barcode_type: payload.barcodeType || 'code128',
      photo_path: payload.photoPath || null,
      image_path: payload.photoPath || null, // Legacy support
      notes: payload.notes || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    console.log('Mock API: Creating new product:', newProduct)
    mockProducts.push(newProduct)
    return newProduct
  },  async updateProduct(id, payload) {
    const productIndex = mockProducts.findIndex(p => p.id === id)
    if (productIndex === -1) {
      throw new Error('Product not found')
    }
    
    mockProducts[productIndex] = {
      ...mockProducts[productIndex],
      ...payload,
      id: id, // Preserve ID
      updated_at: new Date().toISOString()
    }
    
    return mockProducts[productIndex]
  },

  async deleteProduct(id) {
    const productIndex = mockProducts.findIndex(p => p.id === id)
    if (productIndex === -1) {
      throw new Error('Product not found')
    }
    
    const deletedProduct = mockProducts.splice(productIndex, 1)[0]
    
    // Also remove from client-product relationships
    const clientProductsToRemove = mockClientProducts.filter(cp => cp.product_id === id)
    clientProductsToRemove.forEach(cp => {
      const index = mockClientProducts.findIndex(item => item.id === cp.id)
      if (index > -1) mockClientProducts.splice(index, 1)
    })
    
    return deletedProduct
  },

  async searchProducts(query) {
    if (!query) return mockProducts
    
    const term = query.toLowerCase()
    return mockProducts.filter(p => 
      p.name.toLowerCase().includes(term) ||
      p.description.toLowerCase().includes(term) ||
      (p.sku && p.sku.toLowerCase().includes(term)) ||
      p.barcode.toLowerCase().includes(term) ||
      (p.category && p.category.toLowerCase().includes(term))
    )
  },

  async getAllProducts() {
    return [...mockProducts]
  },

  async getProduct(id) {
    return mockProducts.find(p => p.id === id)
  },

  // ============ CLIENT MANAGEMENT ============
  async addClient(payload) {
    console.log('Mock API: Adding client:', payload)
    
    // Check for existing by company name or email
    const existing = mockClients.find(c => 
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
    
    console.log('Mock API: Creating new client:', newClient)
    mockClients.push(newClient)
    return newClient
  },

  async getAllClients() {
    return [...mockClients]
  },

  async getClient(id) {
    return mockClients.find(c => c.id === id)
  },

  async updateClient(id, payload) {
    const clientIndex = mockClients.findIndex(c => c.id === id)
    if (clientIndex === -1) {
      throw new Error('Client not found')
    }
    
    mockClients[clientIndex] = {
      ...mockClients[clientIndex],
      ...payload,
      id: id,
      updated_at: new Date().toISOString()
    }
    
    return mockClients[clientIndex]
  },

  async deleteClient(id) {
    const clientIndex = mockClients.findIndex(c => c.id === id)
    if (clientIndex === -1) {
      throw new Error('Client not found')
    }
    
    const deletedClient = mockClients.splice(clientIndex, 1)[0]
    
    // Also remove client-product relationships
    const clientProductsToRemove = mockClientProducts.filter(cp => cp.client_id === id)
    clientProductsToRemove.forEach(cp => {
      const index = mockClientProducts.findIndex(item => item.id === cp.id)
      if (index > -1) mockClientProducts.splice(index, 1)
    })
    
    return deletedClient
  },

  // ============ CLIENT-PRODUCT RELATIONSHIPS ============
  async addClientProduct(clientId, productId, orderFrequency, notes, templateId = null) {
    // Check if relationship already exists
    const existing = mockClientProducts.find(cp => 
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
      template_id: templateId,
      template_config: null
    }
    
    mockClientProducts.push(newClientProduct)
    return newClientProduct
  },

  async updateClientProductTemplate(clientId, productId, templateId, templateConfig = null) {
    const clientProduct = mockClientProducts.find(cp => 
      cp.client_id === clientId && cp.product_id === productId
    )
    
    if (!clientProduct) {
      throw new Error('Client-product relationship not found')
    }
    
    clientProduct.template_id = templateId
    clientProduct.template_config = templateConfig
    
    return clientProduct
  },

  async getClientProducts(clientId) {
    const clientProducts = mockClientProducts.filter(cp => cp.client_id === clientId)
    
    // Join with product and template data
    return clientProducts.map(cp => {
      const product = mockProducts.find(p => p.id === cp.product_id)
      const template = cp.template_id ? mockLabelTemplates.find(t => t.id === cp.template_id) : null
      return {
        ...cp,
        product: product,
        template: template
      }
    })
  },

  async removeClientProduct(clientId, productId) {
    const index = mockClientProducts.findIndex(cp => 
      cp.client_id === clientId && cp.product_id === productId
    )
    
    if (index === -1) {
      throw new Error('Client-product relationship not found')
    }
    
    return mockClientProducts.splice(index, 1)[0]
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

  // ============ BACKWARD COMPATIBILITY ============
  async search(query) {
    // For backward compatibility with existing code
    return this.searchProducts(query)
  },
  
  async getProduct(id) {
    return mockProducts.find(p => p.id === id)
  },

  async addProduct_Legacy(payload) {
    // Legacy method for old product form
    return this.addProduct({
      name: payload.description,
      sku: payload.sku,
      description: payload.description,
      barcodeType: payload.barcodeType,
      customBarcode: payload.customBarcode
    })
  },

  // ============ DATABASE MANAGEMENT ============
  async resetDatabase() {
    console.log('Mock API: Resetting database')
    mockProducts.length = 0
    mockClients.length = 0
    mockClientProducts.length = 0
    mockLabelTemplates.length = 0
    nextProductId = 1
    nextClientId = 1
    nextClientProductId = 1
    nextTemplateId = 1
    return { success: true, message: 'Database reset successfully' }
  },

  async backupDatabase() {
    return {
      timestamp: new Date().toISOString(),
      version: '2.0',
      products: [...mockProducts],
      clients: [...mockClients],
      clientProducts: [...mockClientProducts],
      labelTemplates: [...mockLabelTemplates]
    }
  },

  async restoreDatabase(backupData) {
    if (!backupData) {
      throw new Error('Invalid backup data')
    }
    
    // Clear current data
    mockProducts.length = 0
    mockClients.length = 0
    mockClientProducts.length = 0
    mockLabelTemplates.length = 0
    
    // Restore data (handle both v1 and v2 backups)
    if (backupData.products) mockProducts.push(...backupData.products)
    if (backupData.clients) mockClients.push(...backupData.clients)
    if (backupData.clientProducts) mockClientProducts.push(...backupData.clientProducts)
    if (backupData.labelTemplates) mockLabelTemplates.push(...backupData.labelTemplates)
    
    // Update next IDs
    nextProductId = Math.max(...mockProducts.map(p => p.id), 0) + 1
    nextClientId = Math.max(...mockClients.map(c => c.id), 0) + 1
    nextClientProductId = Math.max(...mockClientProducts.map(cp => cp.id), 0) + 1
    nextTemplateId = Math.max(...mockLabelTemplates.map(t => t.id), 0) + 1
    
    return { 
      success: true, 
      message: `Database restored: ${mockProducts.length} products, ${mockClients.length} clients, ${mockLabelTemplates.length} templates`,
      counts: {
        products: mockProducts.length,
        clients: mockClients.length,
        templates: mockLabelTemplates.length
      }
    }
  },

  // ============ LABEL TEMPLATE MANAGEMENT ============
  async saveTemplate(payload) {
    console.log('Mock API: Saving template:', payload)
    
    const newTemplate = {
      id: nextTemplateId++,
      name: payload.name,
      description: payload.description || '',
      template_data: payload.templateData,
      created_at: new Date().toISOString()
    }
    
    mockLabelTemplates.push(newTemplate)
    return newTemplate
  },

  async getAllTemplates() {
    return [...mockLabelTemplates]
  },

  async getTemplate(id) {
    return mockLabelTemplates.find(t => t.id === id)
  },

  async deleteTemplate(id) {
    const templateIndex = mockLabelTemplates.findIndex(t => t.id === id)
    if (templateIndex === -1) {
      throw new Error('Template not found')
    }
    
    return mockLabelTemplates.splice(templateIndex, 1)[0]
  },

  async getDatabaseInfo() {
    const totalData = {
      products: mockProducts,
      clients: mockClients,
      clientProducts: mockClientProducts,
      templates: mockLabelTemplates
    }
    
    return {
      path: 'Browser Mock Database (in memory)',
      exists: true,
      size: JSON.stringify(totalData).length,
      counts: {
        products: mockProducts.length,
        clients: mockClients.length,
        clientProducts: mockClientProducts.length,
        templates: mockLabelTemplates.length
      },
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
const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('api', {
  // Product Management
  addProduct: (payload) => ipcRenderer.invoke('db-add-product', payload),
  getAllProducts: () => ipcRenderer.invoke('db-get-all-products'),
  searchProducts: (query) => ipcRenderer.invoke('db-search-products', query),
  getProduct: (id) => ipcRenderer.invoke('db-get', id),
  updateProduct: (id, payload) => ipcRenderer.invoke('db-update-product', id, payload),
  deleteProduct: (id) => ipcRenderer.invoke('db-delete-product', id),
  
  // Legacy compatibility
  search: (q) => ipcRenderer.invoke('db-search', q),
  
  // Client Management
  getAllClients: () => ipcRenderer.invoke('db-get-all-clients'),
  addClient: (payload) => ipcRenderer.invoke('db-add-client', payload),
  getClient: (id) => ipcRenderer.invoke('db-get-client', id),
  updateClient: (id, payload) => ipcRenderer.invoke('db-update-client', id, payload),
  deleteClient: (id) => ipcRenderer.invoke('db-delete-client', id),
  
  // Client-Product Relationships
  getClientProducts: (clientId) => ipcRenderer.invoke('db-get-client-products', clientId),
  addClientProduct: (clientId, productId, orderFrequency, notes, templateId) => 
    ipcRenderer.invoke('db-add-client-product', { clientId, productId, orderFrequency, notes, templateId }),
  removeClientProduct: (clientId, productId) => 
    ipcRenderer.invoke('db-remove-client-product', { clientId, productId }),
  updateClientProductTemplate: (clientId, productId, templateId, templateConfig) => 
    ipcRenderer.invoke('db-update-client-product-template', { clientId, productId, templateId, templateConfig }),
  
  // Template Management
  getAllTemplates: () => ipcRenderer.invoke('db-get-all-templates'),
  saveTemplate: (payload) => ipcRenderer.invoke('db-save-template', payload),
  getTemplate: (id) => ipcRenderer.invoke('db-get-template', id),
  deleteTemplate: (id) => ipcRenderer.invoke('db-delete-template', id),
  
  // File operations
  saveImageToDisk: (payload) => ipcRenderer.invoke('saveImageToDisk', payload),
  showSaveDialog: (payload) => ipcRenderer.invoke('dialog-show-save', payload),
  updateImagePath: (payload) => ipcRenderer.invoke('db-update-image-path', payload),
  
  // Barcode operations
  listBarcodeTypes: () => ipcRenderer.invoke('list-barcode-types'),
  
  // Database management
  resetDatabase: () => ipcRenderer.invoke('db-reset'),
  backupDatabase: () => ipcRenderer.invoke('db-backup'),
  restoreDatabase: (backupData) => ipcRenderer.invoke('db-restore', backupData),
  getDatabaseInfo: () => ipcRenderer.invoke('get-database-info')
})
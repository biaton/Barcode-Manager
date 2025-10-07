const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('api', {
  addProduct: (payload) => ipcRenderer.invoke('db-add-product', payload),
  search: (q) => ipcRenderer.invoke('db-search', q),
  getProduct: (id) => ipcRenderer.invoke('db-get', id),
  saveImageToDisk: (payload) => ipcRenderer.invoke('fs-save-image', payload),
  showSaveDialog: (payload) => ipcRenderer.invoke('dialog-show-save', payload),
  updateImagePath: (payload) => ipcRenderer.invoke('db-update-image-path', payload),
  listBarcodeTypes: () => ipcRenderer.invoke('list-barcode-types'),
  
  // Database management
  resetDatabase: () => ipcRenderer.invoke('db-reset'),
  backupDatabase: () => ipcRenderer.invoke('db-backup'),
  restoreDatabase: (backupData) => ipcRenderer.invoke('db-restore', backupData),
  getDatabaseInfo: () => ipcRenderer.invoke('get-database-info')
})
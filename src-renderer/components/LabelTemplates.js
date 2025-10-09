// Label templates for different use cases
export const labelTemplates = {
  standard: {
    name: 'Standard Product Label',
    width: 400,
    height: 300,
    title: 'Product Label',
    subtitle: '',
    companyName: 'AIM Inc.',
    customFields: [
      { label: 'Item Details:', value: '' },
      { label: 'Qty Per Case:', value: '' },
      { label: 'Qty Per Pallet:', value: 'N/A' }
    ]
  },
  
  warehouse: {
    name: 'Warehouse Case Label',
    width: 420,
    height: 280,
    title: 'Warehouse Case',
    subtitle: '',
    companyName: 'Warehouse Solutions Inc.',
    customFields: [
      { label: 'Item Details:', value: '' },
      { label: 'Qty Per Case:', value: '15' },
      { label: 'Qty Per Pallet:', value: 'N/A' },
      { label: 'Storage Location:', value: '' },
      { label: 'Expiry Date:', value: '' }
    ]
  },
  
  shipping: {
    name: 'Shipping Label',
    width: 450,
    height: 320,
    title: 'Shipping Label',
    subtitle: '',
    companyName: 'Express Logistics',
    customFields: [
      { label: 'From:', value: '' },
      { label: 'To:', value: '' },
      { label: 'Weight:', value: '' },
      { label: 'Dimensions:', value: '' },
      { label: 'Tracking Number:', value: '' }
    ]
  },
  
  retail: {
    name: 'Retail Price Label',
    width: 350,
    height: 250,
    title: 'Price Label',
    subtitle: '',
    companyName: 'Retail Store',
    customFields: [
      { label: 'Product Name:', value: '' },
      { label: 'Price:', value: '' },
      { label: 'Size/Weight:', value: '' },
      { label: 'Brand:', value: '' }
    ]
  },
  
  inventory: {
    name: 'Inventory Asset Label',
    width: 380,
    height: 280,
    title: 'Asset Label',
    subtitle: '',
    companyName: 'Asset Management Co.',
    customFields: [
      { label: 'Asset ID:', value: '' },
      { label: 'Department:', value: '' },
      { label: 'Purchase Date:', value: '' },
      { label: 'Responsible:', value: '' },
      { label: 'Next Audit:', value: '' }
    ]
  },
  
  pharmaceutical: {
    name: 'Pharmaceutical Label',
    width: 400,
    height: 340,
    title: 'Pharmaceutical Product',
    subtitle: '',
    companyName: 'PharmaCorp Ltd.',
    customFields: [
      { label: 'Product Name:', value: '' },
      { label: 'Batch Number:', value: '' },
      { label: 'Exp Date:', value: '' },
      { label: 'Lot Number:', value: '' },
      { label: 'NDC Number:', value: '' },
      { label: 'Manufacturer:', value: '' }
    ]
  },
  
  food: {
    name: 'Food Product Label',
    width: 400,
    height: 320,
    title: 'Food Product',
    subtitle: '',
    companyName: 'Fresh Foods Ltd.',
    customFields: [
      { label: 'Product Name:', value: '' },
      { label: 'Best Before:', value: '' },
      { label: 'Batch Code:', value: '' },
      { label: 'Allergens:', value: '' },
      { label: 'Storage Temp:', value: '' }
    ]
  }
}

// Printer paper sizes (in mm and inches)
export const paperSizes = {
  '4x3': { 
    name: '4" x 3" (Standard)', 
    widthMm: 101.6, 
    heightMm: 76.2,
    widthPx: 400, 
    heightPx: 300 
  },
  '4x6': { 
    name: '4" x 6" (Shipping)', 
    widthMm: 101.6, 
    heightMm: 152.4,
    widthPx: 400, 
    heightPx: 600 
  },
  '2x1': { 
    name: '2" x 1" (Small)', 
    widthMm: 50.8, 
    heightMm: 25.4,
    widthPx: 200, 
    heightPx: 100 
  },
  '3x2': { 
    name: '3" x 2" (Medium)', 
    widthMm: 76.2, 
    heightMm: 50.8,
    widthPx: 300, 
    heightPx: 200 
  },
  custom: { 
    name: 'Custom Size', 
    widthMm: 0, 
    heightMm: 0,
    widthPx: 400, 
    heightPx: 300 
  }
}

// Common barcode types for different industries
export const industryBarcodes = {
  retail: ['ean13', 'upc-a', 'code128'],
  warehouse: ['code128', 'code39', 'itf14'],
  pharmaceutical: ['code128', 'datamatrix', 'gs1-128'],
  food: ['ean13', 'upc-a', 'code128', 'gs1-128'],
  automotive: ['code39', 'code128', 'datamatrix'],
  electronics: ['qrcode', 'datamatrix', 'code128']
}
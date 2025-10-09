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
  // Standard sizes
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
  
  // BLP-410 Thermal Printer Optimized Sizes (203 DPI, Max width: 108mm)
  'blp410_100x60': {
    name: 'BLP-410: 100x60mm (Standard Product)',
    widthMm: 100,
    heightMm: 60,
    widthPx: 800, // 203 DPI: 100mm = ~800px
    heightPx: 472, // 203 DPI: 60mm = ~472px
    dpi: 203,
    printer: 'BLP-410'
  },
  'blp410_80x40': {
    name: 'BLP-410: 80x40mm (Compact)',
    widthMm: 80,
    heightMm: 40,
    widthPx: 630,
    heightPx: 315,
    dpi: 203,
    printer: 'BLP-410'
  },
  'blp410_50x25': {
    name: 'BLP-410: 50x25mm (Small Items)',
    widthMm: 50,
    heightMm: 25,
    widthPx: 394,
    heightPx: 197,
    dpi: 203,
    printer: 'BLP-410'
  },
  'blp410_108x50': {
    name: 'BLP-410: 108x50mm (Max Width)',
    widthMm: 108,
    heightMm: 50,
    widthPx: 850,
    heightPx: 394,
    dpi: 203,
    printer: 'BLP-410'
  },
  'blp410_continuous': {
    name: 'BLP-410: Continuous (Variable Length)',
    widthMm: 100,
    heightMm: 0, // Variable
    widthPx: 800,
    heightPx: 0, // Will be calculated
    dpi: 203,
    printer: 'BLP-410',
    continuous: true
  },
  
  custom: { 
    name: 'Custom Size', 
    widthMm: 0, 
    heightMm: 0,
    widthPx: 400, 
    heightPx: 300 
  }
}

// Printer configurations
export const printerConfigs = {
  'BLP-410': {
    name: 'BLP-410 Thermal Printer',
    type: 'thermal',
    dpi: 203,
    maxWidthMm: 108,
    maxWidthInches: 4.25,
    maxLengthMm: 2286,
    maxLengthInches: 90,
    minWidthMm: 20,
    minLengthMm: 10,
    supportedFormats: ['BMP', 'PCX'],
    rotationAngles: [0, 90, 180, 270],
    paperTypes: ['continuous', 'gap', 'folding', 'punched'],
    ribbonTypes: ['thermal_transfer', 'thermal_direct'],
    interface: ['USB 2.0', 'Parallel', 'RS-232'],
    specifications: {
      printSpeed: '2-6 inches/sec',
      headLifeCycle: '50 km',
      resolution: '203 dots/inch (8dots/mm)',
      powerInput: '+24VDC/2.0A',
      operatingTemp: '5°C ~ 45°C',
      operatingHumidity: '25% ~ 85% RH'
    }
  },
  'generic': {
    name: 'Generic Printer',
    type: 'generic',
    dpi: 300,
    maxWidthMm: 210,
    maxLengthMm: 297,
    supportedFormats: ['PNG', 'PDF', 'JPG'],
    rotationAngles: [0, 90, 180, 270]
  }
}

// Paper type configurations for thermal printers
export const paperTypes = {
  continuous: {
    name: 'Continuous Paper',
    description: 'Roll paper without gaps or perforations',
    gapSpacing: 0,
    recommended: 'For variable length labels'
  },
  gap: {
    name: 'Gap Paper',
    description: 'Labels with gaps between them',
    gapSpacing: 2, // minimum 2mm
    recommended: 'Most common for product labels'
  },
  folding: {
    name: 'Paper Folding',
    description: 'Fanfold paper with perforations',
    gapSpacing: 0,
    recommended: 'For high-volume printing'
  },
  punched: {
    name: 'Punched Paper',
    description: 'Paper with holes for tractor feed',
    gapSpacing: 0,
    recommended: 'For industrial applications'
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

// Export format configurations
export const exportFormats = {
  PNG: {
    name: 'PNG Image',
    extension: 'png',
    mimeType: 'image/png',
    description: 'High quality raster image',
    dpiOptions: [150, 203, 300, 600]
  },
  BMP: {
    name: 'BMP Image (BLP-410 Compatible)',
    extension: 'bmp',
    mimeType: 'image/bmp',
    description: 'Windows Bitmap - Thermal printer compatible',
    dpiOptions: [203],
    thermalOptimized: true
  },
  PCX: {
    name: 'PCX Image (BLP-410 Compatible)',
    extension: 'pcx',
    mimeType: 'image/pcx',
    description: 'PC Paintbrush - Thermal printer compatible',
    dpiOptions: [203],
    thermalOptimized: true
  },
  PDF: {
    name: 'PDF Document',
    extension: 'pdf',
    mimeType: 'application/pdf',
    description: 'Scalable vector format',
    dpiOptions: [150, 300, 600]
  }
}
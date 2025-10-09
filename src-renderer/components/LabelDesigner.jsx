import React, { useState, useRef, useEffect } from 'react'
import bwipjs from 'bwip-js'
import { labelTemplates, paperSizes, industryBarcodes } from './LabelTemplates'
import { api } from '../api'

const LabelDesigner = () => {
  const canvasRef = useRef(null)
  const [labelConfig, setLabelConfig] = useState({
    width: 400,
    height: 300,
    companyName: 'Barcode Manager',
    title: 'Sample Product',
    subtitle: '',
    barcode: 'L-WBSCASE',
    barcodeType: 'code128',
    logo: null,
    qrCode: '',
    qrCodeEnabled: false,
    productPhoto: null,
    photoEnabled: false,
    customFields: [
      { label: 'Item Details:', value: '' },
      { label: 'Qty Per Case:', value: '15' },
      { label: 'Qty Per Pallet:', value: 'N/A' }
    ],
    fontSettings: {
      companyFont: { family: 'Arial', size: 18, weight: 'bold', color: '#000000' },
      titleFont: { family: 'Arial', size: 20, weight: 'bold', color: '#000000' },
      subtitleFont: { family: 'Arial', size: 14, weight: 'normal', color: '#000000' },
      fieldFont: { family: 'Arial', size: 12, weight: 'normal', color: '#000000' },
      barcodeTextFont: { family: 'Arial', size: 14, weight: 'bold', color: '#000000' }
    },
    styleSettings: {
      backgroundColor: '#FFFFFF',
      borderColor: '#000000',
      borderWidth: 2,
      borderStyle: 'solid',
      padding: 20,
      textAlign: 'left',
      lineSpacing: 25
    },
    barcodeSettings: {
      width: 200,
      height: 50,
      showText: true
    },
    qrCodeSettings: {
      width: 100,
      height: 100,
      position: 'right'
    },
    photoSettings: {
      width: 80,
      height: 80,
      position: 'left'
    }
  })

  const [selectedTemplate, setSelectedTemplate] = useState('standard')
  const [selectedPaperSize, setSelectedPaperSize] = useState('4x3')
  const [products, setProducts] = useState([])
  const [selectedProduct, setSelectedProduct] = useState('')
  const [templates, setTemplates] = useState([])
  const [showTemplateSave, setShowTemplateSave] = useState(false)
  const [templateName, setTemplateName] = useState('')
  const [templateDescription, setTemplateDescription] = useState('')

  // Helper functions
  const updateFontSetting = (fontType, property, value) => {
    setLabelConfig(prev => ({
      ...prev,
      fontSettings: {
        ...prev.fontSettings,
        [fontType]: {
          ...prev.fontSettings[fontType],
          [property]: value
        }
      }
    }))
  }

  const updateStyleSetting = (property, value) => {
    setLabelConfig(prev => ({
      ...prev,
      styleSettings: {
        ...prev.styleSettings,
        [property]: value
      }
    }))
  }

  const updateBarcodeSettings = (property, value) => {
    setLabelConfig(prev => ({
      ...prev,
      barcodeSettings: {
        ...prev.barcodeSettings,
        [property]: value
      }
    }))
  }

  const updateQrCodeSettings = (property, value) => {
    setLabelConfig(prev => ({
      ...prev,
      qrCodeSettings: {
        ...prev.qrCodeSettings,
        [property]: value
      }
    }))
  }

  const updatePhotoSettings = (property, value) => {
    setLabelConfig(prev => ({
      ...prev,
      photoSettings: {
        ...prev.photoSettings,
        [property]: value
      }
    }))
  }

  const addCustomField = () => {
    setLabelConfig(prev => ({
      ...prev,
      customFields: [...prev.customFields, { label: '', value: '' }]
    }))
  }

  const updateCustomField = (index, field, value) => {
    setLabelConfig(prev => ({
      ...prev,
      customFields: prev.customFields.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }))
  }

  const removeCustomField = (index) => {
    setLabelConfig(prev => ({
      ...prev,
      customFields: prev.customFields.filter((_, i) => i !== index)
    }))
  }

  // Generate barcode
  const generateBarcode = async (text, type, settings = {}) => {
    try {
      const canvas = document.createElement('canvas')
      const barcodeWidth = settings.width || 200
      const barcodeHeight = settings.height || 50
      
      bwipjs.toCanvas(canvas, {
        bcid: type,
        text: text,
        width: Math.round(barcodeWidth / 10),
        height: Math.round(barcodeHeight / 2),
        includetext: false,
        textxalign: 'center',
        backgroundcolor: 'FFFFFF',
        color: '000000'
      })
      return canvas
    } catch (error) {
      console.error('Barcode generation error:', error)
      return null
    }
  }

  // Render label
  const renderLabel = async () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    const { width, height } = labelConfig
    const { fontSettings, styleSettings } = labelConfig
    
    canvas.width = width
    canvas.height = height

    // Clear canvas with background
    ctx.fillStyle = styleSettings.backgroundColor
    ctx.fillRect(0, 0, width, height)

    // Apply border
    if (styleSettings.borderColor !== '#ffffff') {
      ctx.strokeStyle = styleSettings.borderColor
      ctx.lineWidth = styleSettings.borderWidth
      if (styleSettings.borderStyle === 'dashed') {
        ctx.setLineDash([5, 5])
      }
      ctx.strokeRect(0, 0, width, height)
      ctx.setLineDash([])
    }

    let currentY = styleSettings.padding + 10

    // Draw company name
    if (labelConfig.companyName) {
      const companyFont = fontSettings.companyFont
      ctx.fillStyle = companyFont.color
      ctx.font = `${companyFont.weight} ${companyFont.size}px ${companyFont.family}`
      ctx.textAlign = 'left'
      ctx.fillText(labelConfig.companyName, styleSettings.padding, currentY)
      currentY += companyFont.size + 15
    }

    // Draw title
    const titleFont = fontSettings.titleFont
    ctx.fillStyle = titleFont.color
    ctx.font = `${titleFont.weight} ${titleFont.size}px ${titleFont.family}`
    ctx.textAlign = styleSettings.textAlign
    const titleX = styleSettings.textAlign === 'center' ? width / 2 : styleSettings.padding
    ctx.fillText(labelConfig.title, titleX, currentY + titleFont.size)
    currentY += titleFont.size + 15

    // Draw subtitle if available
    if (labelConfig.subtitle) {
      const subtitleFont = fontSettings.subtitleFont
      ctx.fillStyle = subtitleFont.color
      ctx.font = `${subtitleFont.weight} ${subtitleFont.size}px ${subtitleFont.family}`
      const subtitleX = styleSettings.textAlign === 'center' ? width / 2 : styleSettings.padding
      ctx.fillText(labelConfig.subtitle, subtitleX, currentY + subtitleFont.size)
      currentY += subtitleFont.size + 15
    }

    // Draw custom fields
    const fieldFont = fontSettings.fieldFont
    ctx.fillStyle = fieldFont.color
    ctx.font = `${fieldFont.weight} ${fieldFont.size}px ${fieldFont.family}`
    ctx.textAlign = 'left'
    
    labelConfig.customFields.forEach(field => {
      if (field.label && field.value) {
        ctx.fillText(field.label, styleSettings.padding, currentY + fieldFont.size)
        ctx.fillText(field.value, styleSettings.padding + 120, currentY + fieldFont.size)
        currentY += styleSettings.lineSpacing
      }
    })

    currentY += 20

    // Draw product photo if enabled
    if (labelConfig.photoEnabled && labelConfig.productPhoto) {
      try {
        const img = new Image()
        img.onload = () => {
          const photoSettings = labelConfig.photoSettings
          let photoX = styleSettings.padding
          
          if (photoSettings.position === 'right') {
            photoX = width - photoSettings.width - styleSettings.padding
          } else if (photoSettings.position === 'center') {
            photoX = (width - photoSettings.width) / 2
          }
          
          ctx.drawImage(img, photoX, currentY, photoSettings.width, photoSettings.height)
        }
        img.src = labelConfig.productPhoto
        currentY += labelConfig.photoSettings.height + 15
      } catch (error) {
        console.error('Error loading product photo:', error)
      }
    }

    // Generate and draw QR code if enabled
    if (labelConfig.qrCodeEnabled && labelConfig.qrCode) {
      try {
        const qrCanvas = await generateBarcode(labelConfig.qrCode, 'qrcode', labelConfig.qrCodeSettings)
        if (qrCanvas) {
          const qrSettings = labelConfig.qrCodeSettings
          let qrX = styleSettings.padding
          
          if (qrSettings.position === 'right') {
            qrX = width - qrSettings.width - styleSettings.padding
          } else if (qrSettings.position === 'center') {
            qrX = (width - qrSettings.width) / 2
          }
          
          ctx.drawImage(qrCanvas, qrX, currentY, qrSettings.width, qrSettings.height)
          currentY += qrSettings.height + 15
        }
      } catch (error) {
        console.error('Error generating QR code:', error)
      }
    }

    // Generate and draw barcode
    if (labelConfig.barcode) {
      const barcodeCanvas = await generateBarcode(labelConfig.barcode, labelConfig.barcodeType, labelConfig.barcodeSettings)
      if (barcodeCanvas) {
        const targetWidth = labelConfig.barcodeSettings.width
        const targetHeight = labelConfig.barcodeSettings.height
        const barcodeX = (width - targetWidth) / 2
        
        ctx.drawImage(barcodeCanvas, barcodeX, currentY, targetWidth, targetHeight)
        currentY += targetHeight + 10
        
        // Draw barcode text if enabled
        if (labelConfig.barcodeSettings.showText) {
          const barcodeFont = fontSettings.barcodeTextFont || { family: 'Arial', size: 14, weight: 'bold', color: '#000000' }
          ctx.fillStyle = barcodeFont.color
          ctx.font = `${barcodeFont.weight} ${barcodeFont.size}px ${barcodeFont.family}`
          ctx.textAlign = 'center'
          ctx.fillText(labelConfig.barcode, width / 2, currentY)
          currentY += 20
        }
      }
    }
  }

  // Load functions
  const loadProducts = async () => {
    try {
      const data = await api.getAllProducts()
      setProducts(data)
    } catch (error) {
      console.error('Error loading products:', error)
    }
  }

  const loadTemplates = async () => {
    try {
      const data = await api.getAllTemplates()
      setTemplates(data)
    } catch (error) {
      console.error('Error loading templates:', error)
    }
  }

  const exportLabel = async () => {
    const canvas = canvasRef.current
    if (!canvas) return

    try {
      canvas.toBlob(async (blob) => {
        const base64 = await new Promise(resolve => {
          const reader = new FileReader()
          reader.onload = () => resolve(reader.result)
          reader.readAsDataURL(blob)
        })
        
        const fileName = `label_${labelConfig.barcode || 'custom'}_${Date.now()}.png`
        
        try {
          // For mock API, we'll create a download link
          const link = document.createElement('a')
          link.download = fileName
          link.href = base64
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
          alert(`Label exported as ${fileName}`)
        } catch (error) {
          console.error('Export error:', error)
          alert('Error exporting label')
        }
      }, 'image/png')
    } catch (error) {
      console.error('Export error:', error)
      alert('Error creating label')
    }
  }

  // Product functions
  const loadProductData = async (productId) => {
    if (!productId) {
      setSelectedProduct('')
      return
    }
    
    try {
      const product = products.find(p => p.id === parseInt(productId))
      if (product) {
        setLabelConfig(prev => ({
          ...prev,
          title: product.name,
          subtitle: `SKU: ${product.sku}`,
          barcode: product.barcode || product.sku,
          barcodeType: product.barcode_type || 'code128',
          productPhoto: product.photo_path || product.image_path || null,
          photoEnabled: !!(product.photo_path || product.image_path),
          qrCode: product.sku, // Use SKU for QR code by default
          customFields: [
            { label: 'Product:', value: product.name },
            { label: 'SKU:', value: product.sku },
            { label: 'Category:', value: product.category || '' },
            { label: 'Price:', value: product.price ? `$${product.price.toFixed(2)}` : '' },
            { label: 'Weight:', value: product.weight || '' },
            { label: 'Manufacturer:', value: product.manufacturer || '' }
          ].filter(field => field.value)
        }))
        setSelectedProduct(productId)
      }
    } catch (error) {
      console.error('Error loading product:', error)
    }
  }

  // Template functions
  const loadTemplate = (templateKey) => {
    if (labelTemplates[templateKey]) {
      const template = labelTemplates[templateKey]
      setLabelConfig(prev => ({
        ...prev,
        ...template,
        companyName: prev.companyName || 'Barcode Manager', // Keep current company name
        title: template.title || prev.title || 'Sample Product',
        subtitle: template.subtitle || prev.subtitle || '',
        barcode: template.barcode || prev.barcode || 'SAMPLE-CODE',
        barcodeType: template.barcodeType || prev.barcodeType || 'code128',
        customFields: template.customFields || prev.customFields || [],
        fontSettings: {
          ...prev.fontSettings,
          ...template.fontSettings
        },
        styleSettings: {
          ...prev.styleSettings,
          ...template.styleSettings
        },
        barcodeSettings: {
          ...prev.barcodeSettings,
          ...template.barcodeSettings
        }
      }))
      setSelectedTemplate(templateKey)
    }
  }

  const loadSavedTemplate = async (templateId) => {
    if (!templateId) return
    try {
      const template = templates.find(t => t.id === parseInt(templateId))
      if (template) {
        // Handle both direct template and template_data formats
        const templateData = template.template_data || template
        
        setLabelConfig(prev => ({
          ...prev,
          width: templateData.width || prev.width,
          height: templateData.height || prev.height,
          companyName: templateData.companyName || prev.companyName || 'Barcode Manager',
          title: templateData.title || prev.title || 'Sample Product',
          subtitle: templateData.subtitle || prev.subtitle || '',
          barcode: templateData.barcode || prev.barcode || 'SAMPLE-CODE',
          barcodeType: templateData.barcodeType || prev.barcodeType || 'code128',
          customFields: templateData.customFields || prev.customFields || [],
          fontSettings: {
            ...prev.fontSettings,
            ...(templateData.fontSettings || {})
          },
          styleSettings: {
            ...prev.styleSettings,
            ...(templateData.styleSettings || {})
          },
          barcodeSettings: {
            ...prev.barcodeSettings,
            ...(templateData.barcodeSettings || {})
          }
        }))
      }
    } catch (error) {
      console.error('Error loading template:', error)
    }
  }

  const setPaperSize = (sizeKey) => {
    if (paperSizes[sizeKey]) {
      const size = paperSizes[sizeKey]
      // Use widthPx and heightPx from paperSizes, with fallbacks
      const newWidth = size.widthPx || size.width || 400
      const newHeight = size.heightPx || size.height || 300
      
      setLabelConfig(prev => ({
        ...prev,
        width: newWidth,
        height: newHeight
      }))
      setSelectedPaperSize(sizeKey)
    }
  }

  const printLabel = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    try {
      // Create a new window for printing
      const printWindow = window.open('', '_blank')
      
      // Convert canvas to image
      const dataUrl = canvas.toDataURL('image/png')
      
      // Create print content
      printWindow.document.write(`
        <html>
          <head>
            <title>Print Label</title>
            <style>
              body { margin: 0; padding: 20px; display: flex; justify-content: center; align-items: center; min-height: 100vh; }
              img { max-width: 100%; height: auto; border: 1px solid #ccc; }
              @media print { body { padding: 0; } }
            </style>
          </head>
          <body>
            <img src="${dataUrl}" alt="Label" />
            <script>window.onload = function() { window.print(); window.close(); }</script>
          </body>
        </html>
      `)
      
      printWindow.document.close()
    } catch (error) {
      console.error('Print error:', error)
      alert('Error printing label')
    }
  }

  const saveTemplate = async () => {
    if (!templateName.trim()) {
      alert('Please enter a template name')
      return
    }

    try {
      const payload = {
        name: templateName,
        description: templateDescription,
        templateData: {
          ...labelConfig
        }
      }
      
      await api.saveTemplate(payload)
      alert('Template saved successfully!')
      setShowTemplateSave(false)
      setTemplateName('')
      setTemplateDescription('')
      loadTemplates()
    } catch (error) {
      console.error('Error saving template:', error)
      alert('Error saving template')
    }
  }

  useEffect(() => {
    loadProducts()
    loadTemplates()
  }, [])

  useEffect(() => {
    renderLabel()
  }, [labelConfig])

  return (
    <>
    <div className="h-full bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      {/* Modern Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Label Designer
            </h2>
            <p className="text-gray-600 mt-1">Create professional labels with advanced customization</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={printLabel}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              🖨️ Print
            </button>
            <button
              onClick={exportLabel}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              📥 Export PNG
            </button>
          </div>
        </div>
      </div>

      {/* Main Layout */}
      <div className="grid grid-cols-12 gap-6 h-[calc(100vh-200px)]">
        
        {/* Settings Sidebar */}
        <div className="col-span-4 space-y-4 overflow-y-auto pr-2">
        
          {/* Quick Templates */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center mb-4">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                <span className="text-purple-600">🎨</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Templates</h3>
            </div>
            
            <div className="space-y-3">
              <select
                value={selectedTemplate}
                onChange={(e) => loadTemplate(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
              >
                {Object.entries(labelTemplates).map(([key, template]) => (
                  <option key={key} value={key}>{template.name}</option>
                ))}
              </select>
              
              <select
                value={selectedPaperSize}
                onChange={(e) => setPaperSize(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
              >
                {Object.entries(paperSizes).map(([key, size]) => (
                  <option key={key} value={key}>{size.name}</option>
                ))}
              </select>
              
              {templates.length > 0 && (
                <select
                  value=""
                  onChange={(e) => loadSavedTemplate(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                >
                  <option value="">Load Saved Template...</option>
                  {templates.map((template) => (
                    <option key={template.id} value={template.id}>{template.name}</option>
                  ))}
                </select>
              )}

              <button
                onClick={() => setShowTemplateSave(!showTemplateSave)}
                className="w-full px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
              >
                💾 Save as Template
              </button>
            </div>
          </div>

          {/* Content Settings */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center mb-4">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                <span className="text-blue-600">📝</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Content</h3>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Company Name</label>
                <input
                  type="text"
                  value={labelConfig.companyName || ''}
                  onChange={(e) => setLabelConfig(prev => ({ ...prev, companyName: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="Your Company Name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Product Title</label>
                <input
                  type="text"
                  value={labelConfig.title || ''}
                  onChange={(e) => setLabelConfig(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="Product Name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Subtitle</label>
                <input
                  type="text"
                  value={labelConfig.subtitle || ''}
                  onChange={(e) => setLabelConfig(prev => ({ ...prev, subtitle: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="SKU or additional info"
                />
              </div>

              {/* Product Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Load Product Data</label>
                <select
                  value={selectedProduct}
                  onChange={(e) => loadProductData(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                >
                  <option value="">Select a product...</option>
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name} - {product.sku}
                    </option>
                  ))}
                </select>
              </div>

              {/* Custom Fields */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-gray-700">Custom Fields</label>
                  <button
                    onClick={() => addCustomField()}
                    className="px-2 py-1 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded text-xs font-medium transition-colors"
                  >
                    + Add
                  </button>
                </div>
                
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {labelConfig.customFields.map((field, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="text"
                        value={field.label || ''}
                        onChange={(e) => updateCustomField(index, 'label', e.target.value)}
                        placeholder="Label"
                        className="w-20 px-2 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <input
                        type="text"
                        value={field.value || ''}
                        onChange={(e) => updateCustomField(index, 'value', e.target.value)}
                        placeholder="Value"
                        className="flex-1 min-w-0 px-2 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <button
                        onClick={() => removeCustomField(index)}
                        className="w-8 h-8 flex items-center justify-center bg-red-100 hover:bg-red-200 text-red-700 rounded-md text-sm font-medium transition-colors flex-shrink-0"
                        title="Remove field"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Barcode Settings */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center mb-4">
              <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center mr-3">
                <span className="text-orange-600">📊</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Barcode</h3>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Barcode Value</label>
                <textarea
                  value={labelConfig.barcode || ''}
                  onChange={(e) => setLabelConfig(prev => ({ ...prev, barcode: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors resize-y min-h-[42px]"
                  placeholder="Enter barcode value"
                  rows="1"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Barcode Type</label>
                <select
                  value={labelConfig.barcodeType}
                  onChange={(e) => setLabelConfig(prev => ({ ...prev, barcodeType: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                >
                  <option value="code128">Code 128</option>
                  <option value="ean13">EAN-13</option>
                  <option value="upca">UPC-A</option>
                  <option value="qrcode">QR Code</option>
                  <option value="pdf417">PDF417</option>
                </select>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Width</label>
                  <input
                    type="number"
                    min="100"
                    max="400"
                    value={labelConfig.barcodeSettings.width}
                    onChange={(e) => updateBarcodeSettings('width', parseInt(e.target.value))}
                    className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Height</label>
                  <input
                    type="number"
                    min="30"
                    max="100"
                    value={labelConfig.barcodeSettings.height}
                    onChange={(e) => updateBarcodeSettings('height', parseInt(e.target.value))}
                    className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-orange-500"
                  />
                </div>
                <div className="flex items-end">
                  <label className="flex items-center pb-1.5">
                    <input
                      type="checkbox"
                      checked={labelConfig.barcodeSettings.showText}
                      onChange={(e) => updateBarcodeSettings('showText', e.target.checked)}
                      className="mr-1"
                    />
                    <span className="text-xs font-medium text-gray-700">Text</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* QR Code Settings */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center mb-4">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                <span className="text-purple-600">🔳</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">QR Code</h3>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="qrEnabled"
                  checked={labelConfig.qrCodeEnabled}
                  onChange={(e) => setLabelConfig(prev => ({ ...prev, qrCodeEnabled: e.target.checked }))}
                  className="rounded"
                />
                <label htmlFor="qrEnabled" className="text-sm font-medium text-gray-700">Enable QR Code</label>
              </div>
              
              {labelConfig.qrCodeEnabled && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">QR Code Data</label>
                    <textarea
                      value={labelConfig.qrCode || ''}
                      onChange={(e) => setLabelConfig(prev => ({ ...prev, qrCode: e.target.value }))}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors resize-y min-h-[42px]"
                      placeholder="Enter QR code data (URL, text, etc.)"
                      rows="2"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Width</label>
                      <input
                        type="number"
                        min="50"
                        max="200"
                        value={labelConfig.qrCodeSettings.width}
                        onChange={(e) => updateQrCodeSettings('width', parseInt(e.target.value))}
                        className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Height</label>
                      <input
                        type="number"
                        min="50"
                        max="200"
                        value={labelConfig.qrCodeSettings.height}
                        onChange={(e) => updateQrCodeSettings('height', parseInt(e.target.value))}
                        className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Position</label>
                      <select
                        value={labelConfig.qrCodeSettings.position}
                        onChange={(e) => updateQrCodeSettings('position', e.target.value)}
                        className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-purple-500"
                      >
                        <option value="left">Left</option>
                        <option value="center">Center</option>
                        <option value="right">Right</option>
                      </select>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Product Photo Settings */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center mb-4">
              <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center mr-3">
                <span className="text-indigo-600">🖼️</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Product Photo</h3>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="photoEnabled"
                  checked={labelConfig.photoEnabled}
                  onChange={(e) => setLabelConfig(prev => ({ ...prev, photoEnabled: e.target.checked }))}
                  className="rounded"
                />
                <label htmlFor="photoEnabled" className="text-sm font-medium text-gray-700">Enable Product Photo</label>
              </div>
              
              {labelConfig.photoEnabled && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Photo Upload</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files[0]
                        if (file) {
                          const reader = new FileReader()
                          reader.onload = (event) => {
                            setLabelConfig(prev => ({ ...prev, productPhoto: event.target.result }))
                          }
                          reader.readAsDataURL(file)
                        }
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                    {labelConfig.productPhoto && (
                      <div className="mt-2">
                        <img 
                          src={labelConfig.productPhoto} 
                          alt="Product preview" 
                          className="w-16 h-16 object-cover rounded border"
                        />
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Width</label>
                      <input
                        type="number"
                        min="50"
                        max="200"
                        value={labelConfig.photoSettings.width}
                        onChange={(e) => updatePhotoSettings('width', parseInt(e.target.value))}
                        className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Height</label>
                      <input
                        type="number"
                        min="50"
                        max="200"
                        value={labelConfig.photoSettings.height}
                        onChange={(e) => updatePhotoSettings('height', parseInt(e.target.value))}
                        className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Position</label>
                      <select
                        value={labelConfig.photoSettings.position}
                        onChange={(e) => updatePhotoSettings('position', e.target.value)}
                        className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-indigo-500"
                      >
                        <option value="left">Left</option>
                        <option value="center">Center</option>
                        <option value="right">Right</option>
                      </select>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Typography Settings */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center mb-4">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                <span className="text-green-600">🅰️</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Typography</h3>
            </div>
            
            <div className="space-y-4">
              {/* Title Font */}
              <div className="border border-gray-200 rounded-lg p-3">
                <h4 className="text-sm font-medium text-gray-800 mb-3">Title Font</h4>
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={labelConfig.fontSettings.titleFont.family}
                    onChange={(e) => updateFontSetting('titleFont', 'family', e.target.value)}
                    className="px-2 py-1 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-green-500"
                  >
                    <option value="Arial">Arial</option>
                    <option value="Times New Roman">Times New Roman</option>
                    <option value="Courier New">Courier New</option>
                    <option value="Helvetica">Helvetica</option>
                    <option value="Georgia">Georgia</option>
                    <option value="Verdana">Verdana</option>
                  </select>
                  
                  <input
                    type="number"
                    min="8"
                    max="72"
                    value={labelConfig.fontSettings.titleFont.size}
                    onChange={(e) => updateFontSetting('titleFont', 'size', parseInt(e.target.value))}
                    className="px-2 py-1 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-green-500"
                    placeholder="Size"
                  />
                  
                  <select
                    value={labelConfig.fontSettings.titleFont.weight}
                    onChange={(e) => updateFontSetting('titleFont', 'weight', e.target.value)}
                    className="px-2 py-1 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-green-500"
                  >
                    <option value="normal">Normal</option>
                    <option value="bold">Bold</option>
                    <option value="lighter">Light</option>
                    <option value="bolder">Extra Bold</option>
                  </select>
                  
                  <input
                    type="color"
                    value={labelConfig.fontSettings.titleFont.color}
                    onChange={(e) => updateFontSetting('titleFont', 'color', e.target.value)}
                    className="w-full h-8 border border-gray-300 rounded cursor-pointer"
                  />
                </div>
              </div>

              {/* Subtitle Font */}
              <div className="border border-gray-200 rounded-lg p-3">
                <h4 className="text-sm font-medium text-gray-800 mb-3">Subtitle Font</h4>
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={labelConfig.fontSettings.subtitleFont.family}
                    onChange={(e) => updateFontSetting('subtitleFont', 'family', e.target.value)}
                    className="px-2 py-1 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-green-500"
                  >
                    <option value="Arial">Arial</option>
                    <option value="Times New Roman">Times New Roman</option>
                    <option value="Courier New">Courier New</option>
                    <option value="Helvetica">Helvetica</option>
                    <option value="Georgia">Georgia</option>
                    <option value="Verdana">Verdana</option>
                  </select>
                  
                  <input
                    type="number"
                    min="6"
                    max="48"
                    value={labelConfig.fontSettings.subtitleFont.size}
                    onChange={(e) => updateFontSetting('subtitleFont', 'size', parseInt(e.target.value))}
                    className="px-2 py-1 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-green-500"
                  />
                  
                  <select
                    value={labelConfig.fontSettings.subtitleFont.weight}
                    onChange={(e) => updateFontSetting('subtitleFont', 'weight', e.target.value)}
                    className="px-2 py-1 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-green-500"
                  >
                    <option value="normal">Normal</option>
                    <option value="bold">Bold</option>
                    <option value="lighter">Light</option>
                    <option value="bolder">Extra Bold</option>
                  </select>
                  
                  <input
                    type="color"
                    value={labelConfig.fontSettings.subtitleFont.color}
                    onChange={(e) => updateFontSetting('subtitleFont', 'color', e.target.value)}
                    className="w-full h-8 border border-gray-300 rounded cursor-pointer"
                  />
                </div>
              </div>

              {/* Field Font */}
              <div className="border border-gray-200 rounded-lg p-3">
                <h4 className="text-sm font-medium text-gray-800 mb-3">Field Font</h4>
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={labelConfig.fontSettings.fieldFont.family}
                    onChange={(e) => updateFontSetting('fieldFont', 'family', e.target.value)}
                    className="px-2 py-1 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-green-500"
                  >
                    <option value="Arial">Arial</option>
                    <option value="Times New Roman">Times New Roman</option>
                    <option value="Courier New">Courier New</option>
                    <option value="Helvetica">Helvetica</option>
                    <option value="Georgia">Georgia</option>
                    <option value="Verdana">Verdana</option>
                  </select>
                  
                  <input
                    type="number"
                    min="6"
                    max="24"
                    value={labelConfig.fontSettings.fieldFont.size}
                    onChange={(e) => updateFontSetting('fieldFont', 'size', parseInt(e.target.value))}
                    className="px-2 py-1 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-green-500"
                  />
                  
                  <select
                    value={labelConfig.fontSettings.fieldFont.weight}
                    onChange={(e) => updateFontSetting('fieldFont', 'weight', e.target.value)}
                    className="px-2 py-1 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-green-500"
                  >
                    <option value="normal">Normal</option>
                    <option value="bold">Bold</option>
                    <option value="lighter">Light</option>
                    <option value="bolder">Extra Bold</option>
                  </select>
                  
                  <input
                    type="color"
                    value={labelConfig.fontSettings.fieldFont.color}
                    onChange={(e) => updateFontSetting('fieldFont', 'color', e.target.value)}
                    className="w-full h-8 border border-gray-300 rounded cursor-pointer"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Style Settings */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center mb-4">
              <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center mr-3">
                <span className="text-red-600">🎨</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Styling</h3>
            </div>
            
            <div className="space-y-4">
              {/* Label Dimensions */}
              <div className="border border-gray-200 rounded-lg p-3">
                <h4 className="text-sm font-medium text-gray-800 mb-3">Label Size</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Width (px)</label>
                    <input
                      type="number"
                      value={labelConfig.width || 400}
                      onChange={(e) => setLabelConfig(prev => ({ ...prev, width: parseInt(e.target.value) || 400 }))}
                      className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-red-500"
                      min="200"
                      max="800"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Height (px)</label>
                    <input
                      type="number"
                      value={labelConfig.height || 300}
                      onChange={(e) => setLabelConfig(prev => ({ ...prev, height: parseInt(e.target.value) || 300 }))}
                      className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-red-500"
                      min="150"
                      max="600"
                    />
                  </div>
                </div>
              </div>

              {/* Colors */}
              <div className="border border-gray-200 rounded-lg p-3">
                <h4 className="text-sm font-medium text-gray-800 mb-3">Colors</h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Background Color</label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={labelConfig.styleSettings.backgroundColor}
                        onChange={(e) => updateStyleSetting('backgroundColor', e.target.value)}
                        className="w-12 h-8 border border-gray-300 rounded cursor-pointer"
                      />
                      <input
                        type="text"
                        value={labelConfig.styleSettings.backgroundColor}
                        onChange={(e) => updateStyleSetting('backgroundColor', e.target.value)}
                        className="flex-1 px-2 py-1 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-red-500"
                        placeholder="#FFFFFF"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Border Color</label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={labelConfig.styleSettings.borderColor}
                        onChange={(e) => updateStyleSetting('borderColor', e.target.value)}
                        className="w-12 h-8 border border-gray-300 rounded cursor-pointer"
                      />
                      <input
                        type="text"
                        value={labelConfig.styleSettings.borderColor}
                        onChange={(e) => updateStyleSetting('borderColor', e.target.value)}
                        className="flex-1 px-2 py-1 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-red-500"
                        placeholder="#000000"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Border & Spacing */}
              <div className="border border-gray-200 rounded-lg p-3">
                <h4 className="text-sm font-medium text-gray-800 mb-3">Border & Spacing</h4>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Border Width</label>
                      <input
                        type="number"
                        min="0"
                        max="10"
                        value={labelConfig.styleSettings.borderWidth}
                        onChange={(e) => updateStyleSetting('borderWidth', parseInt(e.target.value))}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-red-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Padding</label>
                      <input
                        type="number"
                        min="5"
                        max="50"
                        value={labelConfig.styleSettings.padding}
                        onChange={(e) => updateStyleSetting('padding', parseInt(e.target.value))}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-red-500"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Line Spacing</label>
                    <input
                      type="number"
                      min="12"
                      max="40"
                      value={labelConfig.styleSettings.lineSpacing}
                      onChange={(e) => updateStyleSetting('lineSpacing', parseInt(e.target.value))}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-red-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Text Alignment</label>
                    <select
                      value={labelConfig.styleSettings.textAlign}
                      onChange={(e) => updateStyleSetting('textAlign', e.target.value)}
                      className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-red-500"
                    >
                      <option value="left">Left</option>
                      <option value="center">Center</option>
                      <option value="right">Right</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Preview Panel */}
        <div className="col-span-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 h-full flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center mr-3">
                  <span className="text-gray-600">👁️</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Live Preview</h3>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-sm text-gray-500">
                  {labelConfig.width} × {labelConfig.height} px
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setLabelConfig(prev => ({ ...prev, width: prev.width * 1.1, height: prev.height * 1.1 }))}
                    className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
                    title="Zoom In"
                  >
                    🔍+
                  </button>
                  <button
                    onClick={() => setLabelConfig(prev => ({ ...prev, width: Math.max(200, prev.width * 0.9), height: Math.max(150, prev.height * 0.9) }))}
                    className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
                    title="Zoom Out"
                  >
                    🔍-
                  </button>
                </div>
              </div>
            </div>
            
            {/* Preview Container */}
            <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border-2 border-dashed border-gray-300 p-4">
              <div className="relative">
                <canvas
                  ref={canvasRef}
                  className="max-w-full max-h-full border-2 border-gray-300 bg-white shadow-xl rounded-lg"
                  style={{ maxWidth: '100%', height: 'auto' }}
                />
                {/* Ruler guides */}
                <div className="absolute -top-4 left-0 right-0 h-3 bg-gray-200 rounded-t flex items-center justify-center text-xs text-gray-500">
                  {labelConfig.width}px
                </div>
                <div className="absolute -left-4 top-0 bottom-0 w-3 bg-gray-200 rounded-l flex items-center justify-center text-xs text-gray-500 transform -rotate-90">
                  {labelConfig.height}px
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="mt-6 flex gap-3 pt-4 border-t border-gray-200">
              <button
                onClick={() => {
                  setLabelConfig(prev => ({ ...prev, barcode: `SAMPLE-${Date.now()}` }))
                }}
                className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors"
              >
                🎲 Random Barcode
              </button>
              
              <button
                onClick={() => {
                  const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD']
                  const randomColor = colors[Math.floor(Math.random() * colors.length)]
                  updateStyleSetting('backgroundColor', randomColor)
                }}
                className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors"
              >
                🎨 Random Color
              </button>
              
              <button
                onClick={() => {
                  setLabelConfig(prev => ({ 
                    ...prev, 
                    qrCodeEnabled: true,
                    qrCode: `https://example.com/product/${prev.barcode || 'sample'}` 
                  }))
                }}
                className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors"
              >
                🔳 Add QR Code
              </button>
              
              <button
                onClick={() => {
                  setLabelConfig(prev => ({ 
                    ...prev, 
                    photoEnabled: !prev.photoEnabled 
                  }))
                }}
                className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors"
              >
                🖼️ Toggle Photo
              </button>

              <div className="flex-1"></div>

              <div className="flex gap-2">
                <button
                  onClick={printLabel}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  🖨️ Print
                </button>
                <button
                  onClick={exportLabel}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  💾 Export
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>

    {/* Template Save Modal */}
    {showTemplateSave && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-96 max-w-[90vw]">
            <h3 className="text-lg font-semibold mb-4">Save Template</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Template Name</label>
                <input
                  type="text"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter template name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={templateDescription}
                  onChange={(e) => setTemplateDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Template description"
                  rows="3"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowTemplateSave(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={saveTemplate}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  Save Template
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default LabelDesigner
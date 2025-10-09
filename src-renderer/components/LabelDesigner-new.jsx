import React, { useState, useRef, useEffect } from 'react'
import bwipjs from 'bwip-js'
import { labelTemplates, paperSizes, industryBarcodes } from './LabelTemplates'

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
      const data = await window.api.getProducts()
      setProducts(data)
    } catch (error) {
      console.error('Error loading products:', error)
    }
  }

  const loadTemplates = async () => {
    try {
      const data = await window.api.getTemplates()
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
          await window.api.saveImageToDisk({
            base64: base64,
            suggestedName: fileName
          })
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

  const saveTemplate = async () => {
    if (!templateName.trim()) {
      alert('Please enter a template name')
      return
    }

    try {
      const template = {
        name: templateName,
        description: templateDescription,
        ...labelConfig,
        createdAt: new Date().toISOString()
      }
      
      await window.api.saveTemplate(template)
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
                onChange={(e) => setSelectedTemplate(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
              >
                {Object.entries(labelTemplates).map(([key, template]) => (
                  <option key={key} value={key}>{template.name}</option>
                ))}
              </select>
              
              <select
                value={selectedPaperSize}
                onChange={(e) => setSelectedPaperSize(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
              >
                {Object.entries(paperSizes).map(([key, size]) => (
                  <option key={key} value={key}>{size.name}</option>
                ))}
              </select>

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
                  value={labelConfig.companyName}
                  onChange={(e) => setLabelConfig(prev => ({ ...prev, companyName: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="Your Company Name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Product Title</label>
                <input
                  type="text"
                  value={labelConfig.title}
                  onChange={(e) => setLabelConfig(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="Product Name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Subtitle</label>
                <input
                  type="text"
                  value={labelConfig.subtitle}
                  onChange={(e) => setLabelConfig(prev => ({ ...prev, subtitle: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="SKU or additional info"
                />
              </div>

              {/* Custom Fields */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-gray-700">Custom Fields</label>
                  <button
                    onClick={addCustomField}
                    className="px-2 py-1 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded text-xs font-medium transition-colors"
                  >
                    + Add
                  </button>
                </div>
                
                <div className="space-y-2">
                  {labelConfig.customFields.map((field, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="text"
                        value={field.label}
                        onChange={(e) => updateCustomField(index, 'label', e.target.value)}
                        placeholder="Label"
                        className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500"
                      />
                      <input
                        type="text"
                        value={field.value}
                        onChange={(e) => updateCustomField(index, 'value', e.target.value)}
                        placeholder="Value"
                        className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500"
                      />
                      <button
                        onClick={() => removeCustomField(index)}
                        className="px-2 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded text-sm font-medium transition-colors"
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
                <input
                  type="text"
                  value={labelConfig.barcode}
                  onChange={(e) => setLabelConfig(prev => ({ ...prev, barcode: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                  placeholder="Enter barcode value"
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

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Width</label>
                  <input
                    type="number"
                    min="100"
                    max="400"
                    value={labelConfig.barcodeSettings.width}
                    onChange={(e) => updateBarcodeSettings('width', parseInt(e.target.value))}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Height</label>
                  <input
                    type="number"
                    min="30"
                    max="100"
                    value={labelConfig.barcodeSettings.height}
                    onChange={(e) => updateBarcodeSettings('height', parseInt(e.target.value))}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-orange-500"
                  />
                </div>
              </div>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={labelConfig.barcodeSettings.showText}
                  onChange={(e) => updateBarcodeSettings('showText', e.target.checked)}
                  className="mr-2"
                />
                <span className="text-sm font-medium text-gray-700">Show barcode text</span>
              </label>
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
            
            {/* Font controls would go here - abbreviated for space */}
            <div className="text-sm text-gray-500">
              Font family, size, weight, and color controls for title, subtitle, and field text
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
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Width (px)</label>
                  <input
                    type="number"
                    value={labelConfig.width}
                    onChange={(e) => setLabelConfig(prev => ({ ...prev, width: parseInt(e.target.value) }))}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-red-500"
                    min="200"
                    max="600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Height (px)</label>
                  <input
                    type="number"
                    value={labelConfig.height}
                    onChange={(e) => setLabelConfig(prev => ({ ...prev, height: parseInt(e.target.value) }))}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-red-500"
                    min="150"
                    max="400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Background Color</label>
                <input
                  type="color"
                  value={labelConfig.styleSettings.backgroundColor}
                  onChange={(e) => updateStyleSetting('backgroundColor', e.target.value)}
                  className="w-full h-10 border border-gray-300 rounded cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Border Color</label>
                <input
                  type="color"
                  value={labelConfig.styleSettings.borderColor}
                  onChange={(e) => updateStyleSetting('borderColor', e.target.value)}
                  className="w-full h-10 border border-gray-300 rounded cursor-pointer"
                />
              </div>
            </div>
          </div>

        </div>

        {/* Preview Panel */}
        <div className="col-span-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 h-full">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center mr-3">
                  <span className="text-gray-600">👁️</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Live Preview</h3>
              </div>
              <div className="text-sm text-gray-500">
                {labelConfig.width} × {labelConfig.height} px
              </div>
            </div>
            
            <div className="flex items-center justify-center h-[calc(100%-80px)] bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
              <canvas
                ref={canvasRef}
                className="max-w-full max-h-full border border-gray-400 bg-white shadow-lg rounded"
                style={{ maxWidth: '100%', height: 'auto' }}
              />
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
    </div>
  )
}

export default LabelDesigner
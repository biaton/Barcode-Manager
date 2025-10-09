import React, { useState, useEffect } from 'react'
import { api } from '../api'

const ClientDatabase = () => {
  const [clients, setClients] = useState([])
  const [products, setProducts] = useState([])
  const [templates, setTemplates] = useState([])
  const [selectedClient, setSelectedClient] = useState(null)
  const [clientProducts, setClientProducts] = useState([])
  const [showClientForm, setShowClientForm] = useState(false)
  const [showProductAssign, setShowProductAssign] = useState(false)
  const [showTemplateAssign, setShowTemplateAssign] = useState(false)
  const [selectedClientProduct, setSelectedClientProduct] = useState(null)
  const [message, setMessage] = useState('')

  // Client form state
  const [clientFormData, setClientFormData] = useState({
    companyName: '',
    contactName: '',
    email: '',
    phone: '',
    address: '',
    notes: ''
  })

  // Product assignment state
  const [assignFormData, setAssignFormData] = useState({
    productId: '',
    orderFrequency: 'As needed',
    notes: ''
  })

  useEffect(() => {
    loadClients()
    loadProducts()
    loadTemplates()
  }, [])

  useEffect(() => {
    if (selectedClient) {
      loadClientProducts()
    }
  }, [selectedClient])

  const loadClients = async () => {
    try {
      const clientList = await api.getAllClients()
      setClients(clientList)
    } catch (error) {
      console.error('Error loading clients:', error)
      showMessage('Error loading clients: ' + error.message, 'error')
    }
  }

  const loadProducts = async () => {
    try {
      const productList = await api.getAllProducts()
      setProducts(productList)
    } catch (error) {
      console.error('Error loading products:', error)
      showMessage('Error loading products: ' + error.message, 'error')
    }
  }

  const loadTemplates = async () => {
    try {
      const templateList = await api.getAllTemplates()
      setTemplates(templateList)
    } catch (error) {
      console.error('Error loading templates:', error)
      showMessage('Error loading templates: ' + error.message, 'error')
    }
  }

  const loadClientProducts = async () => {
    if (!selectedClient) return
    
    try {
      const clientProductList = await api.getClientProducts(selectedClient.id)
      setClientProducts(clientProductList)
    } catch (error) {
      console.error('Error loading client products:', error)
      showMessage('Error loading client products: ' + error.message, 'error')
    }
  }

  const showMessage = (text, type = 'success') => {
    setMessage({ text, type })
    setTimeout(() => setMessage(''), 3000)
  }

  const handleClientInputChange = (field, value) => {
    setClientFormData(prev => ({ ...prev, [field]: value }))
  }

  const resetClientForm = () => {
    setClientFormData({
      companyName: '',
      contactName: '',
      email: '',
      phone: '',
      address: '',
      notes: ''
    })
    setShowClientForm(false)
  }

  const handleClientSubmit = async (e) => {
    e.preventDefault()
    
    if (!clientFormData.companyName.trim()) {
      showMessage('Company name is required', 'error')
      return
    }
    
    if (!clientFormData.email.trim()) {
      showMessage('Email is required', 'error')
      return
    }

    try {
      const newClient = await api.addClient(clientFormData)
      console.log('Client created:', newClient)
      
      showMessage(`Client "${newClient.company_name}" created successfully`, 'success')
      resetClientForm()
      loadClients()
      
    } catch (error) {
      console.error('Error creating client:', error)
      showMessage('Error creating client: ' + error.message, 'error')
    }
  }

  const selectClient = (client) => {
    setSelectedClient(client)
    setShowProductAssign(false)
  }

  const deleteClient = async (clientId) => {
    if (!confirm('Are you sure you want to delete this client? This will also remove all their product assignments.')) {
      return
    }
    
    try {
      await api.deleteClient(clientId)
      showMessage('Client deleted successfully', 'success')
      if (selectedClient?.id === clientId) {
        setSelectedClient(null)
        setClientProducts([])
      }
      loadClients()
    } catch (error) {
      console.error('Error deleting client:', error)
      showMessage('Error deleting client: ' + error.message, 'error')
    }
  }

  const handleProductAssign = async (e) => {
    e.preventDefault()
    
    if (!assignFormData.productId) {
      showMessage('Please select a product', 'error')
      return
    }

    try {
      await api.addClientProduct(
        selectedClient.id,
        parseInt(assignFormData.productId),
        assignFormData.orderFrequency,
        assignFormData.notes
      )
      
      showMessage('Product assigned to client successfully', 'success')
      setAssignFormData({
        productId: '',
        orderFrequency: 'As needed',
        notes: ''
      })
      setShowProductAssign(false)
      loadClientProducts()
      
    } catch (error) {
      console.error('Error assigning product:', error)
      showMessage('Error assigning product: ' + error.message, 'error')
    }
  }

  const removeProductFromClient = async (productId) => {
    if (!confirm('Are you sure you want to remove this product from the client?')) {
      return
    }
    
    try {
      await api.removeClientProduct(selectedClient.id, productId)
      showMessage('Product removed from client successfully', 'success')
      loadClientProducts()
    } catch (error) {
      console.error('Error removing product:', error)
      showMessage('Error removing product: ' + error.message, 'error')
    }
  }

  const assignTemplate = async (templateId) => {
    if (!selectedClientProduct) return
    
    try {
      await api.updateClientProductTemplate(
        selectedClientProduct.client_id,
        selectedClientProduct.product_id,
        templateId
      )
      
      showMessage('Template assigned successfully', 'success')
      setShowTemplateAssign(false)
      setSelectedClientProduct(null)
      loadClientProducts()
      
    } catch (error) {
      console.error('Error assigning template:', error)
      showMessage('Error assigning template: ' + error.message, 'error')
    }
  }

  const removeTemplate = async (clientProduct) => {
    if (!confirm('Are you sure you want to remove the template assignment?')) {
      return
    }
    
    try {
      await api.updateClientProductTemplate(
        clientProduct.client_id,
        clientProduct.product_id,
        null
      )
      
      showMessage('Template removed successfully', 'success')
      loadClientProducts()
      
    } catch (error) {
      console.error('Error removing template:', error)
      showMessage('Error removing template: ' + error.message, 'error')
    }
  }

  const printClientProductLabel = async (clientProduct) => {
    if (!clientProduct.product || !clientProduct.template) {
      showMessage('Product or template not found', 'error')
      return
    }

    try {
      // Generate label using the assigned template and product data
      const labelData = await generateLabelForClientProduct(clientProduct)
      
      // Create a temporary canvas to render the label
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      
      // Set canvas size based on template
      const templateData = clientProduct.template.template_data
      canvas.width = templateData.width || 400
      canvas.height = templateData.height || 300
      
      // Render the label using template configuration
      await renderLabelFromTemplate(canvas, labelData, templateData)
      
      // Open print dialog
      const printWindow = window.open('', '_blank')
      const printCanvas = document.createElement('canvas')
      const printCtx = printCanvas.getContext('2d')
      
      // Set print size (4" x 3" at 203 DPI for thermal printers)
      const dpi = 203
      const widthInches = 4
      const heightInches = 3
      
      printCanvas.width = widthInches * dpi
      printCanvas.height = heightInches * dpi
      
      // Scale and draw
      const scaleX = printCanvas.width / canvas.width
      const scaleY = printCanvas.height / canvas.height
      printCtx.scale(scaleX, scaleY)
      printCtx.drawImage(canvas, 0, 0)
      
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Print Label - ${clientProduct.product.name}</title>
            <style>
              @media print {
                body { margin: 0; padding: 0; }
                img { width: 4in; height: 3in; }
              }
              body { 
                font-family: Arial, sans-serif; 
                text-align: center; 
                padding: 20px; 
              }
              .info { 
                margin-bottom: 20px; 
                font-size: 14px; 
                color: #666; 
              }
              @media print {
                .info { display: none; }
              }
            </style>
          </head>
          <body>
            <div class="info">
              <h3>Label Preview</h3>
              <p>Client: ${selectedClient.company_name}</p>
              <p>Product: ${clientProduct.product.name} (${clientProduct.product.sku})</p>
              <p>Template: ${clientProduct.template.name}</p>
            </div>
            <img src="${printCanvas.toDataURL()}" alt="Product Label" />
            <script>
              window.onload = function() {
                setTimeout(function() {
                  window.print();
                }, 500);
              };
              window.onafterprint = function() {
                window.close();
              };
            </script>
          </body>
        </html>
      `)
      
      showMessage(`Label sent to printer for ${clientProduct.product.name}`, 'success')
      
    } catch (error) {
      console.error('Error printing label:', error)
      showMessage('Error printing label: ' + error.message, 'error')
    }
  }

  const generateLabelForClientProduct = async (clientProduct) => {
    const product = clientProduct.product
    const client = selectedClient
    
    return {
      companyName: client.company_name,
      title: product.name,
      subtitle: `SKU: ${product.sku}`,
      barcode: product.barcode,
      barcodeType: product.barcode_type || 'code128',
      customFields: [
        { label: 'Client:', value: client.company_name },
        { label: 'Product:', value: product.name },
        { label: 'SKU:', value: product.sku },
        { label: 'Category:', value: product.category || 'N/A' },
        { label: 'Price:', value: product.price ? `$${product.price.toFixed(2)}` : 'N/A' },
        { label: 'Weight:', value: product.weight || 'N/A' },
        { label: 'Manufacturer:', value: product.manufacturer || 'N/A' },
        { label: 'Order Frequency:', value: clientProduct.order_frequency },
        { label: 'Printed:', value: new Date().toLocaleDateString() }
      ].filter(field => field.value && field.value !== 'N/A')
    }
  }

  const renderLabelFromTemplate = async (canvas, labelData, templateData) => {
    const ctx = canvas.getContext('2d')
    const { width, height } = templateData

    // Clear canvas with white background
    ctx.fillStyle = '#FFFFFF'
    ctx.fillRect(0, 0, width, height)
    
    // Add border
    ctx.strokeStyle = '#000000'
    ctx.lineWidth = 2
    ctx.strokeRect(1, 1, width - 2, height - 2)

    let currentY = 20

    // Draw company name
    ctx.fillStyle = '#000000'
    ctx.font = 'bold 18px Arial'
    ctx.textAlign = 'left'
    ctx.fillText(labelData.companyName, 20, currentY)
    currentY += 30

    // Use font settings from template or defaults
    const fontSettings = templateData.fontSettings || {
      titleFont: { family: 'Arial', size: 20, weight: 'bold', color: '#000000' },
      subtitleFont: { family: 'Arial', size: 14, weight: 'normal', color: '#000000' },
      fieldFont: { family: 'Arial', size: 12, weight: 'normal', color: '#000000' }
    }
    const styleSettings = templateData.styleSettings || {
      textAlign: 'center',
      padding: 20,
      lineSpacing: 25
    }
    const barcodeSettings = templateData.barcodeSettings || {
      width: 200,
      height: 50,
      showText: true
    }

    // Draw title
    const titleFont = fontSettings.titleFont
    ctx.fillStyle = titleFont.color
    ctx.font = `${titleFont.weight} ${titleFont.size}px ${titleFont.family}`
    ctx.textAlign = styleSettings.textAlign
    const titleX = styleSettings.textAlign === 'center' ? width / 2 : styleSettings.padding
    ctx.fillText(labelData.title, titleX, currentY)
    currentY += titleFont.size + 5

    // Draw subtitle
    if (labelData.subtitle) {
      const subtitleFont = fontSettings.subtitleFont
      ctx.fillStyle = subtitleFont.color
      ctx.font = `${subtitleFont.weight} ${subtitleFont.size}px ${subtitleFont.family}`
      const subtitleX = styleSettings.textAlign === 'center' ? width / 2 : styleSettings.padding
      ctx.fillText(labelData.subtitle, subtitleX, currentY)
      currentY += subtitleFont.size + 5
    }

    // Draw custom fields
    const fieldFont = fontSettings.fieldFont
    ctx.fillStyle = fieldFont.color
    ctx.font = `${fieldFont.weight} ${fieldFont.size}px ${fieldFont.family}`
    ctx.textAlign = 'left'
    
    labelData.customFields.forEach(field => {
      if (field.label && field.value) {
        ctx.fillText(field.label, styleSettings.padding, currentY)
        ctx.fillText(field.value, styleSettings.padding + 100, currentY)
        currentY += styleSettings.lineSpacing
      }
    })

    currentY += 15

    // Generate and draw barcode
    if (labelData.barcode) {
      try {
        const barcodeCanvas = await generateBarcodeCanvas(labelData.barcode, labelData.barcodeType, barcodeSettings)
        if (barcodeCanvas) {
          const targetWidth = barcodeSettings.width
          const targetHeight = barcodeSettings.height
          const barcodeX = (width - targetWidth) / 2
          
          ctx.drawImage(barcodeCanvas, barcodeX, currentY, targetWidth, targetHeight)
          currentY += targetHeight + 15
          
          // Draw barcode text if enabled
          if (barcodeSettings.showText) {
            const barcodeFont = fontSettings.barcodeTextFont || { family: 'Arial', size: 14, weight: 'bold', color: '#000000' }
            ctx.fillStyle = barcodeFont.color
            ctx.font = `${barcodeFont.weight} ${barcodeFont.size}px ${barcodeFont.family}`
            ctx.textAlign = 'center'
            ctx.fillText(labelData.barcode, width / 2, currentY)
            currentY += 20
          }
        }
      } catch (error) {
        console.error('Error generating barcode for print:', error)
      }
    }
  }

  const generateBarcodeCanvas = async (text, type, settings = { width: 200, height: 50 }) => {
    try {
      // Dynamically import bwip-js if available
      if (typeof window.bwipjs !== 'undefined') {
        const canvas = document.createElement('canvas')
        await window.bwipjs.toCanvas(canvas, {
          bcid: type,
          text: text,
          width: Math.round(settings.width / 10),
          height: Math.round(settings.height / 2),
          includetext: false,
          textxalign: 'center',
          backgroundcolor: 'FFFFFF',
          color: '000000'
        })
        return canvas
      }
      
      // Fallback: create a simple text representation
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      canvas.width = 200
      canvas.height = 60
      
      ctx.fillStyle = '#FFFFFF'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      
      ctx.fillStyle = '#000000'
      ctx.strokeStyle = '#000000'
      ctx.lineWidth = 1
      
      // Draw simple barcode lines
      for (let i = 0; i < text.length; i++) {
        const x = 10 + (i * 8)
        const height = (text.charCodeAt(i) % 3) + 2
        ctx.fillRect(x, 10, 2, height * 8)
      }
      
      return canvas
      
    } catch (error) {
      console.error('Barcode generation error:', error)
      return null
    }
  }

  const printAllClientProducts = async () => {
    const productsWithTemplates = clientProducts.filter(cp => cp.template)
    
    if (productsWithTemplates.length === 0) {
      showMessage('No products with templates to print', 'error')
      return
    }

    if (!confirm(`Print labels for ${productsWithTemplates.length} products?`)) {
      return
    }

    try {
      // Create a single print document with all labels
      const printWindow = window.open('', '_blank')
      let htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Bulk Print Labels - ${selectedClient.company_name}</title>
            <style>
              @media print {
                body { margin: 0; padding: 0; }
                .label { 
                  width: 4in; 
                  height: 3in; 
                  page-break-after: always;
                  margin-bottom: 0.5in;
                }
                .info { display: none; }
              }
              body { 
                font-family: Arial, sans-serif; 
                padding: 20px; 
              }
              .info { 
                margin-bottom: 20px; 
                font-size: 14px; 
                color: #666; 
                text-align: center;
              }
              .label {
                border: 1px solid #ddd;
                margin-bottom: 20px;
                display: flex;
                align-items: center;
                justify-content: center;
              }
            </style>
          </head>
          <body>
            <div class="info">
              <h3>Bulk Label Print</h3>
              <p>Client: ${selectedClient.company_name}</p>
              <p>Products: ${productsWithTemplates.length} labels</p>
              <p>Date: ${new Date().toLocaleDateString()}</p>
            </div>
      `

      // Generate each label
      for (const cp of productsWithTemplates) {
        const labelData = await generateLabelForClientProduct(cp)
        const canvas = document.createElement('canvas')
        const templateData = cp.template.template_data
        
        canvas.width = templateData.width || 400
        canvas.height = templateData.height || 300
        
        await renderLabelFromTemplate(canvas, labelData, templateData)
        
        htmlContent += `
          <div class="label">
            <img src="${canvas.toDataURL()}" alt="Label for ${cp.product.name}" style="max-width: 100%; height: auto;" />
          </div>
        `
      }

      htmlContent += `
            <script>
              window.onload = function() {
                setTimeout(function() {
                  window.print();
                }, 1000);
              };
              window.onafterprint = function() {
                window.close();
              };
            </script>
          </body>
        </html>
      `

      printWindow.document.write(htmlContent)
      
      showMessage(`${productsWithTemplates.length} labels sent to printer`, 'success')
      
    } catch (error) {
      console.error('Error bulk printing labels:', error)
      showMessage('Error bulk printing labels: ' + error.message, 'error')
    }
  }

  // Get available products (not already assigned to selected client)
  const availableProducts = products.filter(product => 
    !clientProducts.some(cp => cp.product_id === product.id)
  )

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Client Database</h2>
          <button
            onClick={() => setShowClientForm(!showClientForm)}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {showClientForm ? 'Cancel' : '+ Add Client'}
          </button>
        </div>

        {/* Message Display */}
        {message && (
          <div className={`mb-4 p-4 rounded-lg ${
            message.type === 'error' 
              ? 'bg-red-50 border border-red-200 text-red-700' 
              : 'bg-green-50 border border-green-200 text-green-700'
          }`}>
            {message.text}
          </div>
        )}

        {/* Client Form */}
        {showClientForm && (
          <div className="mb-8 p-6 bg-gray-50 rounded-lg">
            <h3 className="text-lg font-semibold mb-4">Add New Client</h3>
            <form onSubmit={handleClientSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Company Name *</label>
                <input
                  type="text"
                  value={clientFormData.companyName}
                  onChange={(e) => handleClientInputChange('companyName', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter company name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contact Name</label>
                <input
                  type="text"
                  value={clientFormData.contactName}
                  onChange={(e) => handleClientInputChange('contactName', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Primary contact person"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input
                  type="email"
                  value={clientFormData.email}
                  onChange={(e) => handleClientInputChange('email', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="company@example.com"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="tel"
                  value={clientFormData.phone}
                  onChange={(e) => handleClientInputChange('phone', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="+1-555-0123"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <textarea
                  value={clientFormData.address}
                  onChange={(e) => handleClientInputChange('address', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Company address"
                  rows="2"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  value={clientFormData.notes}
                  onChange={(e) => handleClientInputChange('notes', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Additional notes about the client"
                  rows="2"
                />
              </div>

              <div className="md:col-span-2 flex justify-end gap-3 mt-4">
                <button
                  type="button"
                  onClick={resetClientForm}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  Add Client
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Main Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Client List */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Clients</h3>
            <div className="bg-white border rounded-lg overflow-hidden max-h-96 overflow-y-auto">
              {clients.length > 0 ? (
                <div className="divide-y">
                  {clients.map(client => (
                    <div
                      key={client.id}
                      onClick={() => selectClient(client)}
                      className={`p-4 cursor-pointer hover:bg-blue-50 ${
                        selectedClient?.id === client.id ? 'bg-blue-100 border-l-4 border-blue-500' : ''
                      }`}
                    >
                      <div className="font-medium text-gray-900">{client.company_name}</div>
                      <div className="text-sm text-gray-600">{client.contact_name}</div>
                      <div className="text-sm text-gray-500">{client.email}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-gray-500">
                  No clients yet. Add your first client!
                </div>
              )}
            </div>
          </div>

          {/* Client Details & Product Assignment */}
          <div className="lg:col-span-2">
            {selectedClient ? (
              <div className="space-y-6">
                {/* Client Information */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-lg font-semibold">Client Information</h3>
                    <button
                      onClick={() => deleteClient(selectedClient.id)}
                      className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500"
                    >
                      Delete Client
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-600">Company:</span>
                      <p>{selectedClient.company_name}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Contact:</span>
                      <p>{selectedClient.contact_name || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Email:</span>
                      <p>{selectedClient.email}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Phone:</span>
                      <p>{selectedClient.phone || 'N/A'}</p>
                    </div>
                    {selectedClient.address && (
                      <div className="md:col-span-2">
                        <span className="font-medium text-gray-600">Address:</span>
                        <p>{selectedClient.address}</p>
                      </div>
                    )}
                    {selectedClient.notes && (
                      <div className="md:col-span-2">
                        <span className="font-medium text-gray-600">Notes:</span>
                        <p>{selectedClient.notes}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Client Products */}
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">Client Products</h3>
                    <div className="flex gap-2">
                      {clientProducts.some(cp => cp.template) && (
                        <button
                          onClick={() => printAllClientProducts()}
                          className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-500"
                          title="Print all products with templates"
                        >
                          🖨️ Print All
                        </button>
                      )}
                      <button
                        onClick={() => setShowProductAssign(!showProductAssign)}
                        className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500"
                        disabled={availableProducts.length === 0}
                      >
                        {showProductAssign ? 'Cancel' : '+ Assign Product'}
                      </button>
                    </div>
                  </div>

                  {/* Product Assignment Form */}
                  {showProductAssign && (
                    <div className="mb-4 p-4 bg-blue-50 rounded-lg">
                      <h4 className="font-medium mb-3">Assign Product to Client</h4>
                      <form onSubmit={handleProductAssign} className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Product</label>
                          <select
                            value={assignFormData.productId}
                            onChange={(e) => setAssignFormData(prev => ({ ...prev, productId: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                          >
                            <option value="">Select a product...</option>
                            {availableProducts.map(product => (
                              <option key={product.id} value={product.id}>
                                {product.name} ({product.sku})
                              </option>
                            ))}
                          </select>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Order Frequency</label>
                          <select
                            value={assignFormData.orderFrequency}
                            onChange={(e) => setAssignFormData(prev => ({ ...prev, orderFrequency: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="As needed">As needed</option>
                            <option value="Weekly">Weekly</option>
                            <option value="Monthly">Monthly</option>
                            <option value="Quarterly">Quarterly</option>
                            <option value="Annually">Annually</option>
                          </select>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                          <input
                            type="text"
                            value={assignFormData.notes}
                            onChange={(e) => setAssignFormData(prev => ({ ...prev, notes: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Optional notes"
                          />
                        </div>
                        
                        <div className="md:col-span-3 flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setShowProductAssign(false)}
                            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
                          >
                            Assign Product
                          </button>
                        </div>
                      </form>
                    </div>
                  )}

                  {/* Template Assignment Modal */}
                  {showTemplateAssign && selectedClientProduct && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                      <div className="bg-white rounded-lg p-6 w-96 max-w-full">
                        <h3 className="text-lg font-semibold mb-4">Assign Label Template</h3>
                        <p className="text-sm text-gray-600 mb-4">
                          Select a template for <strong>{selectedClientProduct.product?.name}</strong>
                        </p>
                        
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                          {templates.map(template => (
                            <button
                              key={template.id}
                              onClick={() => assignTemplate(template.id)}
                              className="w-full text-left p-3 border rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors"
                            >
                              <div className="font-medium">{template.name}</div>
                              {template.description && (
                                <div className="text-sm text-gray-500">{template.description}</div>
                              )}
                            </button>
                          ))}
                        </div>
                        
                        <div className="mt-4 flex justify-end gap-2">
                          <button
                            onClick={() => {
                              setShowTemplateAssign(false)
                              setSelectedClientProduct(null)
                            }}
                            className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Products List */}
                  <div className="bg-white border rounded-lg overflow-hidden">
                    {clientProducts.length > 0 ? (
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left font-medium text-gray-700">Product</th>
                            <th className="px-4 py-3 text-left font-medium text-gray-700">SKU</th>
                            <th className="px-4 py-3 text-left font-medium text-gray-700">Frequency</th>
                            <th className="px-4 py-3 text-left font-medium text-gray-700">Label Template</th>
                            <th className="px-4 py-3 text-left font-medium text-gray-700">Status</th>
                            <th className="px-4 py-3 text-left font-medium text-gray-700">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {clientProducts.map(cp => (
                            <tr key={cp.id} className="hover:bg-gray-50">
                              <td className="px-4 py-3">{cp.product?.name || 'Unknown Product'}</td>
                              <td className="px-4 py-3 font-mono text-xs">{cp.product?.sku || 'N/A'}</td>
                              <td className="px-4 py-3">{cp.order_frequency}</td>
                              <td className="px-4 py-3">
                                {cp.template ? (
                                  <div className="flex items-center gap-2">
                                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                                      {cp.template.name}
                                    </span>
                                    <button
                                      onClick={() => removeTemplate(cp)}
                                      className="text-red-500 hover:text-red-700 text-xs"
                                    >
                                      ×
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => {
                                      setSelectedClientProduct(cp)
                                      setShowTemplateAssign(true)
                                    }}
                                    className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs hover:bg-blue-200"
                                    disabled={templates.length === 0}
                                  >
                                    {templates.length === 0 ? 'No templates' : 'Assign Template'}
                                  </button>
                                )}
                              </td>
                              <td className="px-4 py-3">
                                {cp.template ? (
                                  <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs flex items-center gap-1">
                                    ✅ Ready to Print
                                  </span>
                                ) : (
                                  <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                                    ⏳ No Template
                                  </span>
                                )}
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex gap-1 flex-wrap">
                                  {cp.template && (
                                    <>
                                      <button
                                        onClick={() => printClientProductLabel(cp)}
                                        className="px-2 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600 flex items-center gap-1"
                                        title={`Print label using ${cp.template.name} template`}
                                      >
                                        🖨️ Print
                                      </button>
                                      <button
                                        onClick={() => {
                                          setSelectedClientProduct(cp)
                                          setShowTemplateAssign(true)
                                        }}
                                        className="px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
                                      >
                                        Change
                                      </button>
                                    </>
                                  )}
                                  <button
                                    onClick={() => removeProductFromClient(cp.product_id)}
                                    className="px-2 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600"
                                  >
                                    Remove
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <div className="p-8 text-center text-gray-500">
                        No products assigned to this client yet.
                        {availableProducts.length > 0 && (
                          <div className="mt-2">
                            <button
                              onClick={() => setShowProductAssign(true)}
                              className="text-blue-500 hover:text-blue-600"
                            >
                              Assign a product
                            </button>
                          </div>
                        )}
                        {templates.length === 0 && (
                          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded text-sm">
                            💡 <strong>Tip:</strong> Create label templates in the Label Designer to assign them to client products for consistent labeling.
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-500 py-12">
                <p>Select a client to view details and manage their products</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ClientDatabase
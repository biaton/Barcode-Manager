import React, { useState, useEffect } from 'react'
import { api } from '../api'

const ProductManager = () => {
  const [products, setProducts] = useState([])
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [message, setMessage] = useState('')

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    description: '',
    category: '',
    price: '',
    weight: '',
    dimensions: '',
    manufacturer: '',
    barcodeType: 'code128',
    notes: ''
  })
  const [photoFile, setPhotoFile] = useState(null)
  const [photoPreview, setPhotoPreview] = useState('')

  // Load products on component mount
  useEffect(() => {
    loadProducts()
  }, [])

  const loadProducts = async () => {
    try {
      const productList = await api.getAllProducts()
      setProducts(productList)
    } catch (error) {
      console.error('Error loading products:', error)
      showMessage('Error loading products: ' + error.message, 'error')
    }
  }

  const showMessage = (text, type = 'success') => {
    setMessage({ text, type })
    setTimeout(() => setMessage(''), 3000)
  }

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handlePhotoUpload = (event) => {
    const file = event.target.files[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        showMessage('Photo file size must be less than 5MB', 'error')
        return
      }
      
      if (!file.type.startsWith('image/')) {
        showMessage('Please select a valid image file', 'error')
        return
      }
      
      setPhotoFile(file)
      
      // Create preview
      const reader = new FileReader()
      reader.onload = (e) => {
        setPhotoPreview(e.target.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      sku: '',
      description: '',
      category: '',
      price: '',
      weight: '',
      dimensions: '',
      manufacturer: '',
      barcodeType: 'code128',
      notes: ''
    })
    setPhotoFile(null)
    setPhotoPreview('')
    setShowForm(false)
  }

  const validateBarcodeRequirements = (barcodeType) => {
    const requirements = {
      'ean13': 'EAN-13 requires exactly 12 digits (13th digit is auto-generated). Only numbers allowed.',
      'ean8': 'EAN-8 requires exactly 7 digits (8th digit is auto-generated). Only numbers allowed.',
      'upc-a': 'UPC-A requires exactly 11 digits (12th digit is auto-generated). Only numbers allowed.',
      'upc-e': 'UPC-E requires 6-8 digits. Only numbers allowed.',
      'itf14': 'ITF-14 requires exactly 13 digits (14th digit is auto-generated). Only numbers allowed.',
      'code39': 'Code 39 supports uppercase letters A-Z, digits 0-9, and symbols: space $ % * + - . /',
      'code128': 'Code 128 supports all ASCII characters (letters, numbers, symbols).',
      'qrcode': 'QR Code supports any text, numbers, symbols, and special characters.'
    }
    
    return requirements[barcodeType] || 'This barcode type supports alphanumeric characters.'
  }

  const generateValidBarcode = (barcodeType) => {
    const timestamp = Date.now().toString().slice(-8) // Last 8 digits of timestamp
    
    switch (barcodeType) {
      case 'ean13':
        // Generate 12 digits for EAN-13 (13th is check digit)
        return timestamp.padStart(12, '1').substring(0, 12)
      
      case 'ean8':
        // Generate 7 digits for EAN-8 (8th is check digit)
        return timestamp.substring(0, 7).padStart(7, '1')
      
      case 'upc-a':
        // Generate 11 digits for UPC-A (12th is check digit)
        return timestamp.padStart(11, '1').substring(0, 11)
      
      case 'upc-e':
        // Generate 6 digits for UPC-E
        return timestamp.substring(0, 6).padStart(6, '1')
      
      case 'itf14':
        // Generate 13 digits for ITF-14 (14th is check digit)
        return timestamp.padStart(13, '1').substring(0, 13)
      
      case 'code39':
        // Generate alphanumeric code for Code 39
        return `PRD${timestamp.substring(0, 6)}`
      
      case 'qrcode':
        // QR codes can contain any data
        return `QR-${formData.name.substring(0, 10).toUpperCase()}-${timestamp.substring(0, 6)}`
      
      case 'code128':
      default:
        // Default Code 128 format
        return `BRC${timestamp}`
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      showMessage('Product name is required', 'error')
      return
    }
    
    if (!formData.sku.trim()) {
      showMessage('SKU is required', 'error')
      return
    }

    try {
      let photoPath = null
      
      // Handle photo upload if file is selected
      if (photoFile) {
        // In a real app, you'd upload to server/storage
        // For now, we'll simulate with base64
        photoPath = photoPreview // Store base64 for demo
      }

      // Generate a valid barcode based on the selected type
      const validBarcode = generateValidBarcode(formData.barcodeType)

      const payload = {
        ...formData,
        price: parseFloat(formData.price) || 0,
        customBarcode: validBarcode, // Pass the generated barcode
        photoPath
      }

      const newProduct = await api.addProduct(payload)
      console.log('Product created:', newProduct)
      
      showMessage(`Product "${newProduct.name}" created successfully with barcode: ${newProduct.barcode}`, 'success')
      resetForm()
      loadProducts()
      
    } catch (error) {
      console.error('Error creating product:', error)
      showMessage('Error creating product: ' + error.message, 'error')
    }
  }

  const handleSearch = async () => {
    try {
      const results = await api.searchProducts(searchTerm)
      setProducts(results)
    } catch (error) {
      console.error('Error searching products:', error)
      showMessage('Error searching products: ' + error.message, 'error')
    }
  }

  const selectProduct = (product) => {
    setSelectedProduct(product)
  }

  const deleteProduct = async (productId) => {
    if (!confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
      return
    }
    
    try {
      await api.deleteProduct(productId)
      showMessage('Product deleted successfully', 'success')
      setSelectedProduct(null)
      loadProducts()
    } catch (error) {
      console.error('Error deleting product:', error)
      showMessage('Error deleting product: ' + error.message, 'error')
    }
  }

  const filteredProducts = products.filter(product => 
    !searchTerm || 
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Product Manager</h2>
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {showForm ? 'Cancel' : '+ Add Product'}
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

        {/* Product Form */}
        {showForm && (
          <div className="mb-8 p-6 bg-gray-50 rounded-lg">
            <h3 className="text-lg font-semibold mb-4">Add New Product</h3>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Basic Information */}
              <div className="md:col-span-2">
                <h4 className="font-medium text-gray-700 mb-3">Basic Information</h4>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Product Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter product name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">SKU *</label>
                <input
                  type="text"
                  value={formData.sku}
                  onChange={(e) => handleInputChange('sku', e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter SKU"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter product description"
                  rows="3"
                />
              </div>

              {/* Product Details */}
              <div className="md:col-span-2">
                <h4 className="font-medium text-gray-700 mb-3 mt-4">Product Details</h4>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => handleInputChange('category', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Electronics, Home & Garden"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Price ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => handleInputChange('price', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Weight</label>
                <input
                  type="text"
                  value={formData.weight}
                  onChange={(e) => handleInputChange('weight', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., 2.5 kg, 500g"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Dimensions</label>
                <input
                  type="text"
                  value={formData.dimensions}
                  onChange={(e) => handleInputChange('dimensions', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., 15x10x5 cm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Manufacturer</label>
                <input
                  type="text"
                  value={formData.manufacturer}
                  onChange={(e) => handleInputChange('manufacturer', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter manufacturer name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Barcode Type</label>
                <select
                  value={formData.barcodeType}
                  onChange={(e) => handleInputChange('barcodeType', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="code128">Code 128 (Alphanumeric)</option>
                  <option value="code39">Code 39 (A-Z, 0-9, symbols)</option>
                  <option value="ean13">EAN-13 (12 digits + check)</option>
                  <option value="ean8">EAN-8 (7 digits + check)</option>
                  <option value="upc-a">UPC-A (11 digits + check)</option>
                  <option value="upc-e">UPC-E (6-8 digits)</option>
                  <option value="itf14">ITF-14 (13 digits + check)</option>
                  <option value="qrcode">QR Code (Any text)</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  {validateBarcodeRequirements(formData.barcodeType)}
                </p>
              </div>

              {/* Photo Upload */}
              <div className="md:col-span-2">
                <h4 className="font-medium text-gray-700 mb-3 mt-4">Product Photo</h4>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Upload Photo (Optional)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {photoPreview && (
                  <div className="mt-3">
                    <img 
                      src={photoPreview} 
                      alt="Preview" 
                      className="w-32 h-32 object-cover border rounded-lg"
                    />
                  </div>
                )}
              </div>

              {/* Notes */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Additional notes about the product"
                  rows="2"
                />
              </div>

              {/* Submit Button */}
              <div className="md:col-span-2 flex justify-end gap-3 mt-4">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  🔄 Generate Barcode & Save Product
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Search and Product List */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Product List */}
          <div className="lg:col-span-2">
            <div className="flex gap-3 mb-4">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Search products by name, SKU, or category..."
              />
              <button
                onClick={handleSearch}
                className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Search
              </button>
              <button
                onClick={() => { setSearchTerm(''); loadProducts(); }}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Clear
              </button>
            </div>

            <div className="bg-white border rounded-lg overflow-hidden max-h-96 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-gray-700">Name</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700">SKU</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700">Category</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700">Price</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700">Barcode</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map(product => (
                    <tr
                      key={product.id}
                      onClick={() => selectProduct(product)}
                      className={`cursor-pointer hover:bg-blue-50 ${
                        selectedProduct?.id === product.id ? 'bg-blue-100' : ''
                      }`}
                    >
                      <td className="px-4 py-3">{product.name}</td>
                      <td className="px-4 py-3 font-mono text-xs">{product.sku}</td>
                      <td className="px-4 py-3">{product.category || '-'}</td>
                      <td className="px-4 py-3">${product.price?.toFixed(2) || '0.00'}</td>
                      <td className="px-4 py-3 font-mono text-xs">{product.barcode}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {filteredProducts.length === 0 && (
                <div className="p-8 text-center text-gray-500">
                  {searchTerm ? 'No products found matching your search.' : 'No products yet. Add your first product!'}
                </div>
              )}
            </div>
          </div>

          {/* Product Details */}
          <div>
            <div className="bg-white border rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-4">Product Details</h3>
              
              {selectedProduct ? (
                <div className="space-y-3">
                  {selectedProduct.photo_path && (
                    <div className="mb-4">
                      <img 
                        src={selectedProduct.photo_path} 
                        alt={selectedProduct.name}
                        className="w-full h-32 object-cover rounded-lg border"
                      />
                    </div>
                  )}
                  
                  <div>
                    <span className="text-sm font-medium text-gray-600">Name:</span>
                    <p className="text-sm">{selectedProduct.name}</p>
                  </div>
                  
                  <div>
                    <span className="text-sm font-medium text-gray-600">SKU:</span>
                    <p className="text-sm font-mono">{selectedProduct.sku}</p>
                  </div>
                  
                  <div>
                    <span className="text-sm font-medium text-gray-600">Barcode:</span>
                    <p className="text-sm font-mono">{selectedProduct.barcode}</p>
                  </div>
                  
                  {selectedProduct.description && (
                    <div>
                      <span className="text-sm font-medium text-gray-600">Description:</span>
                      <p className="text-sm">{selectedProduct.description}</p>
                    </div>
                  )}
                  
                  {selectedProduct.category && (
                    <div>
                      <span className="text-sm font-medium text-gray-600">Category:</span>
                      <p className="text-sm">{selectedProduct.category}</p>
                    </div>
                  )}
                  
                  <div>
                    <span className="text-sm font-medium text-gray-600">Price:</span>
                    <p className="text-sm">${selectedProduct.price?.toFixed(2) || '0.00'}</p>
                  </div>
                  
                  {selectedProduct.weight && (
                    <div>
                      <span className="text-sm font-medium text-gray-600">Weight:</span>
                      <p className="text-sm">{selectedProduct.weight}</p>
                    </div>
                  )}
                  
                  {selectedProduct.dimensions && (
                    <div>
                      <span className="text-sm font-medium text-gray-600">Dimensions:</span>
                      <p className="text-sm">{selectedProduct.dimensions}</p>
                    </div>
                  )}
                  
                  {selectedProduct.manufacturer && (
                    <div>
                      <span className="text-sm font-medium text-gray-600">Manufacturer:</span>
                      <p className="text-sm">{selectedProduct.manufacturer}</p>
                    </div>
                  )}
                  
                  {selectedProduct.notes && (
                    <div>
                      <span className="text-sm font-medium text-gray-600">Notes:</span>
                      <p className="text-sm">{selectedProduct.notes}</p>
                    </div>
                  )}
                  
                  <div>
                    <span className="text-sm font-medium text-gray-600">Created:</span>
                    <p className="text-sm">{new Date(selectedProduct.created_at).toLocaleDateString()}</p>
                  </div>

                  <div className="pt-4 border-t">
                    <button
                      onClick={() => deleteProduct(selectedProduct.id)}
                      className="w-full px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500"
                    >
                      Delete Product
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500 text-sm">Select a product to view details</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProductManager
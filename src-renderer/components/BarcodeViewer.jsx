import React, { useEffect, useRef, useState } from 'react'
import bwipjs from 'bwip-js'
import { api } from '../api'

export default function BarcodeViewer({ product, onUpdated }) {
  const canvasRef = useRef(null)
  const [message, setMessage] = useState('Select a product to view')

  useEffect(() => {
    if (!product) return setMessage('Select a product to view')
    renderBarcode()
  }, [product])

  async function renderBarcode() {
    if (!product) return
    const canvas = canvasRef.current
    try {
      const barcodeType = product.barcode_type || 'code128'
      
      // Use custom_barcode if available, otherwise fall back to SKU/barcode
      let barcodeText = ''
      if (product.custom_barcode && product.custom_barcode.trim() !== '') {
        barcodeText = String(product.custom_barcode).trim()
      } else if (product.sku && product.sku.trim() !== '') {
        barcodeText = String(product.sku).trim()
      } else {
        barcodeText = String(product.barcode || '').trim()
      }
      
      if (!barcodeText) {
        setMessage('No barcode data available')
        return
      }
      
      // Get the correct bcid first
      const bcid = getBcidForType(barcodeType)
      
      // Validate and prepare barcode data based on type
      try {
        barcodeText = prepareTextForBarcodeType(bcid, barcodeText)
      } catch (validationError) {
        console.warn('Barcode validation warning:', validationError.message)
        // Continue with original text for most types, but handle QR specially
        if (bcid === 'qrcode' && !barcodeText) {
          barcodeText = 'ERROR: Invalid QR Code text'
        }
      }
      
      // Configure base options
      const options = {
        bcid: bcid,
        text: barcodeText,
        backgroundcolor: 'FFFFFF'
      }
      
      // Configure options based on barcode type category
      configureBarcodeOptions(options, barcodeType, barcodeText)
      
      // bwip-js draws directly to canvas
      await bwipjs.toCanvas(canvas, options)
      setMessage('')
    } catch (err) {
      const errorMsg = String(err).replace('Error: ', '')
      setMessage('Cannot render barcode: ' + errorMsg)
      console.error('Barcode rendering error:', err)
      
      // Clear the canvas on error
      const ctx = canvas.getContext('2d')
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.fillStyle = '#f8f9fa'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.fillStyle = '#6b7280'
      ctx.font = '14px Arial'
      ctx.textAlign = 'center'
      ctx.fillText('Barcode Error', canvas.width / 2, canvas.height / 2)
    }
  }
  
  function prepareTextForBarcodeType(bcid, text) {
    // Ensure we always have a string and handle null/undefined
    let cleanText = text
    if (typeof cleanText !== 'string') {
      cleanText = String(cleanText || '')
    }
    cleanText = cleanText.trim()
    
    // If text is empty, provide reasonable defaults
    if (!cleanText) {
      if (bcid === 'qrcode') return 'Sample QR Code'
      if (['ean13', 'ean8', 'upc-a', 'upc-e'].includes(bcid)) return '123456789012'
      return 'SAMPLE'
    }
    
    switch (bcid) {
      case 'ean13':
        // EAN-13 needs exactly 12 digits (13th is check digit auto-generated)
        const ean13Text = cleanText.replace(/\D/g, '') // Remove non-digits
        if (ean13Text.length === 0) return '123456789012'
        if (ean13Text.length <= 12) return ean13Text.padStart(12, '0')
        return ean13Text.substring(0, 12)
        
      case 'ean8':
        // EAN-8 needs exactly 7 digits
        const ean8Text = cleanText.replace(/\D/g, '')
        if (ean8Text.length === 0) return '1234567'
        if (ean8Text.length <= 7) return ean8Text.padStart(7, '0')
        return ean8Text.substring(0, 7)
        
      case 'upc-a':
        // UPC-A needs exactly 11 digits
        const upcaText = cleanText.replace(/\D/g, '')
        if (upcaText.length === 0) return '12345678901'
        if (upcaText.length <= 11) return upcaText.padStart(11, '0')
        return upcaText.substring(0, 11)
        
      case 'upc-e':
        // UPC-E needs 6-8 digits
        const upceText = cleanText.replace(/\D/g, '')
        if (upceText.length === 0) return '123456'
        if (upceText.length <= 8) return upceText
        return upceText.substring(0, 8)
        
      case 'code39':
        // Code 39: uppercase letters, digits, and limited symbols
        let code39Text = cleanText.toUpperCase().replace(/[^A-Z0-9 $%*+\-./:]/g, '')
        if (code39Text.length === 0) return 'CODE39'
        return code39Text
        
      case 'qrcode':
        // QR codes can handle any text, but ensure it's not empty
        return cleanText || 'Sample QR Code'
        
      case 'pdf417':
      case 'datamatrix':
      case 'azteccode':
      case 'maxicode':
        // 2D codes can handle most text
        return cleanText || 'Sample Text'
        
      case 'postnet':
      case 'planet':
        // Postal codes need only digits
        const postalText = cleanText.replace(/\D/g, '')
        return postalText || '12345'
        
      default:
        // Linear barcodes - handle most ASCII
        return cleanText || 'SAMPLE'
    }
  }
  
  function getBcidForType(type) {
    // Map common aliases and user-friendly names to correct bwip-js bcid values
    const bcidMap = {
      // QR Code variations
      'qr': 'qrcode',
      'qr-code': 'qrcode',
      
      // Aztec variations  
      'aztec': 'azteccode',
      
      // Data Matrix (already correct)
      'datamatrix': 'datamatrix',
      
      // PDF417 (already correct)
      'pdf417': 'pdf417',
      
      // MaxiCode (already correct)
      'maxicode': 'maxicode',
      
      // Other 2D codes
      'micropdf417': 'micropdf417',
      'microqr': 'microqr',
      
      // Common linear barcode aliases
      'code-128': 'code128',
      'code-39': 'code39',
      'code-93': 'code93',
      'ean-13': 'ean13',
      'ean-8': 'ean8',
      'upc-a': 'upca',
      'upc-e': 'upce'
    }
    
    return bcidMap[type.toLowerCase()] || type
  }
  
  function configureBarcodeOptions(options, barcodeType, barcodeText) {
    try {
      const bcid = options.bcid || barcodeType
      
      // 2D barcodes
      if (bcid === 'qrcode') {
        options.eclevel = 'M' // Error correction level (L, M, Q, H)
        options.scale = 4
        // Remove linear barcode options that don't apply
        delete options.height
        delete options.includetext
        delete options.textxalign
      } else if (bcid === 'azteccode') {
        options.eclevel = 23 // Error correction percentage (1-99)
        options.scale = 4
        delete options.height
        delete options.includetext
        delete options.textxalign
      } else if (bcid === 'pdf417') {
        options.columns = 6
        options.eclevel = 2 // Error correction level (0-8)
        options.scale = 3
        delete options.height
        delete options.includetext
        delete options.textxalign
      } else if (bcid === 'datamatrix') {
        options.scale = 4
        delete options.height
        delete options.includetext
        delete options.textxalign
      } else if (bcid === 'maxicode') {
        options.scale = 4
        delete options.height
        delete options.includetext
        delete options.textxalign
      } else if (['micropdf417', 'microqr'].includes(bcid)) {
        options.scale = 4
        delete options.height
        delete options.includetext
        delete options.textxalign
      } 
      // Postal barcodes
      else if (['postnet', 'planet', 'royalmail', 'auspost', 'japanpost', 'kix', 'daft', 'onecode', 'usps4cb'].includes(bcid)) {
        options.scale = 2
        options.height = 8
        options.includetext = false // Postal codes typically don't show human-readable text
      }
      // Linear barcodes
      else {
        options.height = 10
        options.includetext = true
        options.textxalign = 'center'
        options.scale = 3
        
        // Special cases for specific linear barcodes
        if (['pharmacode', 'pharmacode2'].includes(bcid)) {
          options.includetext = false // Pharmacode doesn't show text
          options.height = 8
        } else if (bcid === 'code39') {
          // Code 39 may need asterisks for start/stop characters (bwip-js usually adds them automatically)
          // Let bwip-js handle the asterisks
        } else if (bcid === 'itf14') {
          options.height = 12 // ITF-14 is typically taller
          options.guardwhitespace = true // Add quiet zones
        }
      }
    } catch (error) {
      console.warn('Error configuring barcode options:', error)
      // Fallback to basic linear barcode configuration
      options.height = 10
      options.includetext = true
      options.textxalign = 'center'
      options.scale = 3
    }
  }

  async function generateBarcode() {
    if (!product) return alert('Select product')
    
    try {
      setMessage('Generating barcode...')
      const updatedProduct = await api.generateBarcode(product.id)
      setMessage('Barcode generated successfully!')
      onUpdated && onUpdated()
      
      // Clear message after delay
      setTimeout(() => setMessage(''), 2000)
    } catch (error) {
      console.error('Error generating barcode:', error)
      setMessage('Error generating barcode: ' + error.message)
    }
  }

  async function exportPNG() {
    if (!product) return alert('Select product')
    const canvas = canvasRef.current
    const dataUrl = canvas.toDataURL('image/png')

    try {
      // Let main process suggest a save path or save in app userData images folder
      const displayBarcode = product.custom_barcode || product.sku || product.barcode
      const suggested = `${displayBarcode}.png`
      const picked = await api.showSaveDialog({ defaultName: suggested })
      if (!picked) return
      
      // save image bytes via main
      const savedPath = await api.saveImageToDisk({ base64: dataUrl, suggestedName: suggested })
      await api.updateImagePath({ id: product.id, imagePath: savedPath })
      onUpdated && onUpdated()
      alert('Saved to ' + savedPath)
    } catch (error) {
      console.error('Error exporting PNG:', error)
      alert('Error exporting PNG: ' + error.message)
    }
  }

  return (
    <div>
      <h2 className="text-lg font-medium">Product Preview</h2>
      {!product ? (
        <div className="mt-4 text-sm text-slate-500">{message}</div>
      ) : (
        <div className="mt-3">
          <div className="border rounded p-3 bg-white">
            <div className="text-sm mb-2"><strong>ID:</strong> {product.id}</div>
            <div className="text-sm mb-2"><strong>Description:</strong> {product.description}</div>
            <div className="text-sm mb-2"><strong>SKU:</strong> {product.sku || 'N/A'}</div>
            <div className="text-sm mb-2">
              <strong>Generated Barcode:</strong> {product.custom_barcode || 'Not generated'}
            </div>
            <div className="text-sm mb-4">
              <strong>Display Barcode:</strong> {product.custom_barcode || product.sku || product.barcode} 
              <span className="ml-2 px-2 py-1 bg-gray-100 rounded text-xs">
                {product.barcode_type?.toUpperCase() || 'CODE128'}
              </span>
            </div>
            
            <div className="flex justify-center mb-4">
              <canvas 
                ref={canvasRef} 
                width={400} 
                height={200} 
                className="bg-white border border-gray-200 rounded shadow-sm max-w-full" 
                style={{maxWidth: '100%', height: 'auto'}}
              />
            </div>
            
            {message && (
              <div className="mb-4 p-2 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                {message}
              </div>
            )}
            
            <div className="flex gap-2 flex-wrap">
              <button 
                onClick={generateBarcode}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded transition-colors"
                disabled={!product}
              >
                Generate Barcode
              </button>
              <button 
                onClick={exportPNG} 
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
                disabled={!!message}
              >
                Export PNG
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
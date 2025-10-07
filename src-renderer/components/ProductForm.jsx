import React, { useEffect, useState } from 'react'
import { api } from '../api'

export default function ProductForm({ onAdd }) {
  const [desc, setDesc] = useState('')
  const [sku, setSku] = useState('')
  const [barcodeType, setBarcodeType] = useState('code128')
  const [customCode, setCustomCode] = useState('')
  const [types, setTypes] = useState([])

  useEffect(() => { 
    api.listBarcodeTypes().then(t => setTypes(t)).catch(err => {
      console.error('Error loading barcode types:', err)
      setTypes(['code128', 'code39', 'ean13', 'qr']) // fallback types
    })
  }, [])

  function submit(e) {
    e.preventDefault()
    if (!desc.trim()) return alert('Enter a description')
    
    const payload = { 
      description: desc.trim(), 
      sku: sku.trim() || null, 
      barcodeType, 
      customBarcode: customCode.trim() || null 
    }
    
    console.log('ProductForm: Submitting payload:', payload)
    onAdd(payload)
    
    // Clear form
    setDesc('')
    setSku('')
    setCustomCode('')
  }

  return (
    <form onSubmit={submit} className="mt-3 grid grid-cols-3 gap-3">
      <input className="col-span-2 border rounded p-2" placeholder="Product description" value={desc} onChange={e => setDesc(e.target.value)} />
      <input className="border rounded p-2" placeholder="SKU (optional)" value={sku} onChange={e => setSku(e.target.value)} />

      <select value={barcodeType} onChange={e => setBarcodeType(e.target.value)} className="border rounded p-2">
        {types.map(t => {
          // Add friendly display names for common types
          const friendlyNames = {
            'code128': 'Code 128 (General)',
            'code39': 'Code 39',
            'code93': 'Code 93',
            'ean13': 'EAN-13 (13-digit)',
            'ean8': 'EAN-8 (8-digit)', 
            'upc-a': 'UPC-A (12-digit)',
            'upc-e': 'UPC-E (8-digit)',
            'qrcode': 'QR Code',
            'pdf417': 'PDF417',
            'datamatrix': 'Data Matrix',
            'azteccode': 'Aztec Code',
            'itf14': 'ITF-14 (14-digit)',
            'postnet': 'POSTNET (US Postal)',
            'royalmail': 'Royal Mail 4-State'
          }
          const displayName = friendlyNames[t] || t.toUpperCase()
          return <option key={t} value={t}>{displayName}</option>
        })}
      </select>

      <input className="col-span-2 border rounded p-2" placeholder="Custom barcode value (optional)" value={customCode} onChange={e => setCustomCode(e.target.value)} />

      <button className="col-span-3 mt-2 bg-slate-800 text-white p-2 rounded">Add / Get Barcode</button>
    </form>
  )
}
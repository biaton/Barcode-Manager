import React, { useEffect, useState, useRef } from 'react'
import ProductForm from './components/ProductForm'
import ProductList from './components/ProductList'
import BarcodeViewer from './components/BarcodeViewer'
import DatabaseManager from './components/DatabaseManager'
import NetworkInfo from './components/NetworkInfo'
import DatabaseStatus from './components/DatabaseStatus'
import { api } from './api'

export default function App() {
  const [products, setProducts] = useState([])
  const [selected, setSelected] = useState(null)

  useEffect(() => { refresh() }, [])

  async function refresh() {
    try {
      const rows = await api.search('')
      setProducts(rows)
    } catch (error) {
      console.error('Error refreshing products:', error)
      setProducts([])
    }
  }

  async function onAdd(payload) {
    try {
      console.log('Adding product with payload:', payload)
      const added = await api.addProduct(payload)
      console.log('Product added:', added)
      await refresh()
      setSelected(added)
      // Show success feedback
      if (added) {
        console.log('✅ Product saved successfully:', added.description)
      }
    } catch (error) {
      console.error('Error adding product:', error)
      alert('Error adding product: ' + error.message)
    }
  }

  async function onSearch(q) {
    try {
      if (!q) return refresh()
      const res = await api.search(q)
      setProducts(res)
    } catch (error) {
      console.error('Error searching products:', error)
      setProducts([])
    }
  }

  async function onSelect(id) {
    try {
      const p = await api.getProduct(id)
      setSelected(p)
    } catch (error) {
      console.error('Error getting product:', error)
    }
  }

  return (
    <div className="h-full p-6 bg-slate-50">
      <div className="max-w-7xl mx-auto bg-white rounded-2xl shadow p-6 grid grid-cols-3 gap-6">
        <div className="col-span-2">
          <div className="flex justify-between items-center mb-2">
            <h1 className="text-2xl font-semibold">Barcode Manager</h1>
            <div className="flex gap-2">
              <NetworkInfo />
              <DatabaseManager onDatabaseChanged={() => refresh()} />
            </div>
          </div>
          <div className="flex justify-between items-center">
            <p className="text-sm text-slate-500">Create unique barcodes, reuse existing, export PNGs.</p>
            <DatabaseStatus />
          </div>

          <div className="mt-4">
            <ProductForm onAdd={onAdd} />
          </div>

          <div className="mt-6">
            <input placeholder="Search description, SKU or barcode" onChange={e => onSearch(e.target.value)} className="w-full border p-2 rounded" />
            <ProductList products={products} onSelect={onSelect} />
          </div>
        </div>

        <div>
          <BarcodeViewer product={selected} onUpdated={() => refresh()} />
        </div>
      </div>
    </div>
  )
}
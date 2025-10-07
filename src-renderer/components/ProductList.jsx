import React from 'react'

export default function ProductList({ products, onSelect }) {
  return (
    <div className="mt-3 border rounded max-h-64 overflow-auto">
      <table className="w-full text-sm">
        <thead className="bg-slate-100 sticky top-0">
          <tr><th className="p-2 text-left">ID</th><th className="p-2 text-left">Description</th><th className="p-2">Barcode</th></tr>
        </thead>
        <tbody>
          {products.map(p => (
            <tr key={p.id} className="hover:bg-slate-50 cursor-pointer" onClick={() => onSelect(p.id)}>
              <td className="p-2 text-xs">{p.id}</td>
              <td className="p-2">{p.description}</td>
              <td className="p-2 text-xs">{p.barcode}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
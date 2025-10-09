import React, { useEffect, useState, useRef } from 'react'
import ProductManager from './components/ProductManager'
import ClientDatabase from './components/ClientDatabase'
import LabelDesigner from './components/LabelDesigner'
import DatabaseManager from './components/DatabaseManager'
import NetworkInfo from './components/NetworkInfo'
import DatabaseStatus from './components/DatabaseStatus'
import { api } from './api'

export default function App() {
  const [activeTab, setActiveTab] = useState('products') // 'products', 'clients', 'designer'
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  // Function to trigger refresh in child components
  const triggerRefresh = () => {
    setRefreshTrigger(prev => prev + 1)
  }

  return (
    <div className="h-full min-h-screen p-6 bg-slate-50">
      <div className="max-w-7xl mx-auto bg-white rounded-2xl shadow overflow-hidden">
        {/* App Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold">Barcode Manager</h1>
              <p className="text-blue-100 text-sm">Complete product and label management system</p>
            </div>
            <div className="flex gap-2">
              <NetworkInfo />
              <DatabaseManager onDatabaseChanged={triggerRefresh} />
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200 bg-gray-50">
          <nav className="flex">
            <button
              onClick={() => setActiveTab('products')}
              className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'products'
                  ? 'border-blue-500 text-blue-600 bg-white'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:bg-white/50'
              }`}
            >
              📦 Product Manager
            </button>
            <button
              onClick={() => setActiveTab('clients')}
              className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'clients'
                  ? 'border-blue-500 text-blue-600 bg-white'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:bg-white/50'
              }`}
            >
              👥 Client Database
            </button>
            <button
              onClick={() => setActiveTab('designer')}
              className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'designer'
                  ? 'border-blue-500 text-blue-600 bg-white'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:bg-white/50'
              }`}
            >
              🏷️ Label Designer
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6 bg-gray-50 min-h-screen">
          {activeTab === 'products' && (
            <ProductManager key={refreshTrigger} />
          )}
          
          {activeTab === 'clients' && (
            <ClientDatabase key={refreshTrigger} />
          )}
          
          {activeTab === 'designer' && (
            <LabelDesigner key={refreshTrigger} />
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-100 border-t p-4 text-center">
          <div className="flex justify-between items-center text-sm text-gray-600">
            <DatabaseStatus />
            <span>Barcode Manager Pro - Complete Product & Label Management</span>
          </div>
        </div>
      </div>
    </div>
  )
}
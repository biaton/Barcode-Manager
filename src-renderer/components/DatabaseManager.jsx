import React, { useState } from 'react'
import { api } from '../api'

export default function DatabaseManager({ onDatabaseChanged }) {
  const [isOpen, setIsOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  async function resetDatabase() {
    if (!confirm('Are you sure you want to delete all products? This action cannot be undone.')) {
      return
    }
    
    setIsLoading(true)
    try {
      const result = await api.resetDatabase()
      setMessage(`✅ ${result.message}`)
      onDatabaseChanged && onDatabaseChanged()
    } catch (error) {
      setMessage(`❌ Error: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  async function backupDatabase() {
    setIsLoading(true)
    try {
      const backup = await api.backupDatabase()
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      
      const link = document.createElement('a')
      link.href = url
      link.download = `barcode-backup-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      
      setMessage(`✅ Backup downloaded: ${backup.products.length} products`)
    } catch (error) {
      setMessage(`❌ Error: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  function handleFileUpload(event) {
    const file = event.target.files[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = async (e) => {
      setIsLoading(true)
      try {
        const backupData = JSON.parse(e.target.result)
        const result = await api.restoreDatabase(backupData)
        setMessage(`✅ ${result.message}`)
        onDatabaseChanged && onDatabaseChanged()
      } catch (error) {
        setMessage(`❌ Error: ${error.message}`)
      } finally {
        setIsLoading(false)
        event.target.value = '' // Reset file input
      }
    }
    reader.readAsText(file)
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="px-3 py-1 text-sm bg-gray-600 hover:bg-gray-700 text-white rounded transition-colors"
      >
        Database
      </button>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-96 max-w-full">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Database Management</h3>
          <button
            onClick={() => setIsOpen(false)}
            className="text-gray-500 hover:text-gray-700 text-xl font-bold"
          >
            ×
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">Backup & Restore</h4>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={backupDatabase}
                disabled={isLoading}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white rounded transition-colors"
              >
                {isLoading ? 'Creating...' : 'Download Backup'}
              </button>
              
              <label className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded cursor-pointer transition-colors">
                {isLoading ? 'Restoring...' : 'Upload Backup'}
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileUpload}
                  disabled={isLoading}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          <div>
            <h4 className="font-medium mb-2">Reset Database</h4>
            <button
              onClick={resetDatabase}
              disabled={isLoading}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white rounded transition-colors"
            >
              {isLoading ? 'Resetting...' : 'Reset All Data'}
            </button>
            <p className="text-sm text-gray-600 mt-1">
              ⚠️ This will permanently delete all products
            </p>
          </div>

          {message && (
            <div className="p-3 bg-gray-50 border rounded">
              <p className="text-sm">{message}</p>
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={() => setIsOpen(false)}
            className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-700 rounded transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
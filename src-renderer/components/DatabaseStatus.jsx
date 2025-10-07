import React, { useState, useEffect } from 'react'
import { api } from '../api'

export default function DatabaseStatus() {
  const [dbInfo, setDbInfo] = useState(null)
  const [showDetails, setShowDetails] = useState(false)

  useEffect(() => {
    loadDatabaseInfo()
  }, [])

  async function loadDatabaseInfo() {
    try {
      const info = await api.getDatabaseInfo()
      setDbInfo(info)
    } catch (error) {
      console.error('Error loading database info:', error)
      setDbInfo({ error: error.message })
    }
  }

  if (!dbInfo) {
    return (
      <div className="text-xs text-gray-500">
        Loading DB info...
      </div>
    )
  }

  const isMock = dbInfo.isMock || dbInfo.path?.includes('Mock')
  const statusColor = isMock ? 'text-orange-600' : 'text-green-600'
  const statusIcon = isMock ? '⚠️' : '✅'
  const statusText = isMock ? 'Mock DB (Browser)' : 'SQLite DB (Electron)'

  return (
    <div className="text-xs">
      <button
        onClick={() => setShowDetails(!showDetails)}
        className={`${statusColor} hover:underline flex items-center gap-1`}
        title="Click for database details"
      >
        <span>{statusIcon}</span>
        <span>{statusText}</span>
      </button>

      {showDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Database Status</h3>
              <button
                onClick={() => setShowDetails(false)}
                className="text-gray-500 hover:text-gray-700 text-xl font-bold"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Current Database</h4>
                <div className="bg-gray-50 p-3 rounded border">
                  <div className="text-sm space-y-2">
                    <div>
                      <strong>Type:</strong> {isMock ? 'Browser Mock (In-Memory)' : 'SQLite Database'}
                    </div>
                    <div>
                      <strong>Location:</strong> 
                      <code className="ml-2 bg-gray-200 px-2 py-1 rounded text-xs break-all">
                        {dbInfo.path}
                      </code>
                    </div>
                    <div>
                      <strong>Size:</strong> {isMock ? `${dbInfo.size} bytes (JSON)` : `${(dbInfo.size / 1024).toFixed(1)} KB`}
                    </div>
                    <div>
                      <strong>Status:</strong> {dbInfo.exists ? 'Exists' : 'Not Found'}
                    </div>
                  </div>
                </div>
              </div>

              {isMock ? (
                <div className="bg-orange-50 p-3 rounded border border-orange-200">
                  <h4 className="font-medium text-orange-800 mb-2">⚠️ You're in Browser Mode</h4>
                  <div className="text-sm text-orange-700 space-y-1">
                    <p>• Data is stored in browser memory only</p>
                    <p>• Refreshing the page will lose all data</p>
                    <p>• To use persistent SQLite database:</p>
                    <ol className="ml-4 mt-2 space-y-1">
                      <li>1. Stop the current dev server</li>
                      <li>2. Run: <code className="bg-orange-100 px-1 rounded">npm run dev</code></li>
                      <li>3. Wait for Electron app to open</li>
                      <li>4. Use the Electron app (not browser tab)</li>
                    </ol>
                  </div>
                </div>
              ) : (
                <div className="bg-green-50 p-3 rounded border border-green-200">
                  <h4 className="font-medium text-green-800 mb-2">✅ SQLite Database Active</h4>
                  <div className="text-sm text-green-700">
                    <p>• Data is persistently saved to disk</p>
                    <p>• Survives app restarts and reboots</p>
                    <p>• Located in your user data folder</p>
                  </div>
                </div>
              )}

              <div>
                <button
                  onClick={() => {
                    loadDatabaseInfo()
                    setShowDetails(false)
                  }}
                  className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm mr-2"
                >
                  Refresh Status
                </button>
                {!isMock && (
                  <button
                    onClick={() => {
                      // Copy path to clipboard if possible
                      if (navigator.clipboard) {
                        navigator.clipboard.writeText(dbInfo.path)
                        alert('Database path copied to clipboard!')
                      } else {
                        alert(`Database location:\n${dbInfo.path}`)
                      }
                    }}
                    className="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white rounded text-sm"
                  >
                    Copy Path
                  </button>
                )}
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowDetails(false)}
                className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-700 rounded transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
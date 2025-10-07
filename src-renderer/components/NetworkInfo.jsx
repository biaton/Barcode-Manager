import React, { useState, useEffect } from 'react'

export default function NetworkInfo() {
  const [networkIP, setNetworkIP] = useState('localhost')
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Try to get the local IP address (this is approximate)
    const getLocalIP = async () => {
      try {
        // This is a simple way to get network info in the browser
        // In production, you might want to get this from the main process
        const connection = new RTCPeerConnection({iceServers:[]})
        connection.createDataChannel('')
        connection.createOffer().then(offer => connection.setLocalDescription(offer))
        
        connection.onicecandidate = (event) => {
          if (event.candidate) {
            const candidate = event.candidate.candidate
            const ipMatch = candidate.match(/(\d+\.\d+\.\d+\.\d+)/)
            if (ipMatch) {
              setNetworkIP(ipMatch[1])
              connection.close()
            }
          }
        }
      } catch (error) {
        console.log('Could not determine local IP:', error)
      }
    }

    getLocalIP()
  }, [])

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="px-3 py-1 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors ml-2"
        title="Network Access Info"
      >
        🌐 Network
      </button>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-96 max-w-full">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Network Access</h3>
          <button
            onClick={() => setIsVisible(false)}
            className="text-gray-500 hover:text-gray-700 text-xl font-bold"
          >
            ×
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">Development Server URLs</h4>
            <div className="bg-gray-50 p-3 rounded border">
              <div className="text-sm space-y-1">
                <div>
                  <strong>Local:</strong> 
                  <code className="ml-2 bg-gray-200 px-2 py-1 rounded">http://localhost:5173</code>
                </div>
                <div>
                  <strong>Network:</strong> 
                  <code className="ml-2 bg-gray-200 px-2 py-1 rounded">http://{networkIP}:5173</code>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-medium mb-2">Access Instructions</h4>
            <div className="text-sm text-gray-600 space-y-2">
              <p>• <strong>Local:</strong> Access from this computer using localhost</p>
              <p>• <strong>Network:</strong> Access from other devices on the same network using the network IP</p>
              <p>• <strong>Mobile:</strong> Use the network URL on your phone/tablet</p>
              <p>• <strong>Firewall:</strong> Ensure Windows Firewall allows port 5173</p>
            </div>
          </div>

          <div className="bg-blue-50 p-3 rounded border border-blue-200">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> Network access is only available in development mode. 
              The Electron app runs locally but the web interface can be accessed remotely.
            </p>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={() => setIsVisible(false)}
            className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-700 rounded transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
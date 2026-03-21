import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client.js'
import { bootstrap } from '@/lib/bootstrap.js'
import App from '@/App.jsx'
import '@/index.css'

// Bootstrap the app before rendering
bootstrap().then(result => {
  console.log('Bootstrap result:', result);
  
  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <QueryClientProvider client={queryClientInstance}>
        <App />
      </QueryClientProvider>
    </React.StrictMode>
  )
}).catch(error => {
  console.error('Bootstrap failed:', error);
  
  // Still render the app even if bootstrap fails
  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <QueryClientProvider client={queryClientInstance}>
        <App />
      </QueryClientProvider>
    </React.StrictMode>
  )
})

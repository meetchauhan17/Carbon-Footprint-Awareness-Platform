import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import { CarbonProvider } from './context/CarbonContext.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <CarbonProvider>
        <App />
      </CarbonProvider>
    </BrowserRouter>
  </React.StrictMode>
)

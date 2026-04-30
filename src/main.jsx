import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { CMSProvider } from './cms.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <CMSProvider>
      <App />
    </CMSProvider>
  </StrictMode>,
)

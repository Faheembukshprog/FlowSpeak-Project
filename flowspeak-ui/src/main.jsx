import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { LeakFreeTelemetryProvider } from './contexts/TelemetryContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <LeakFreeTelemetryProvider>
      <App />
    </LeakFreeTelemetryProvider>
  </StrictMode>,
)

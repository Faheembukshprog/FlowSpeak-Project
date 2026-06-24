import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import LandingPage from './pages/LandingPage.jsx'
import ChatPage from './pages/ChatPage.jsx'
import TransactionsPage from './pages/TransactionsPage.jsx'
import AdminPage from './pages/AdminPage.jsx'
import MainLayout from './layouts/MainLayout.jsx'
import { LeakFreeTelemetryProvider } from './contexts/TelemetryContext.jsx'
import { AppStateProvider } from './state/AppStateContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route
          path="/app/advanced"
          element={
            <LeakFreeTelemetryProvider>
              <App />
            </LeakFreeTelemetryProvider>
          }
        />
        <Route
          path="/app/*"
          element={
            <AppStateProvider>
              <LeakFreeTelemetryProvider>
                <MainLayout />
              </LeakFreeTelemetryProvider>
            </AppStateProvider>
          }
        >
          <Route index element={<ChatPage />} />
          <Route path="transactions" element={<TransactionsPage />} />
          <Route path="admin" element={<AdminPage />} />
          <Route path="*" element={<Navigate to="/app" replace />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)

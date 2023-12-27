import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
declare global {
  interface Window {
    signingContainerId: string
  }
}
ReactDOM.createRoot(document.getElementById(window.signingContainerId || 'root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

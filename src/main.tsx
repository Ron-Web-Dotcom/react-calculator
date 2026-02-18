/**
 * Entry point for the React application.
 * Initializes the root element and renders the main App component within a StrictMode wrapper.
 */

import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

// Create the root element using the 'root' ID defined in index.html
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
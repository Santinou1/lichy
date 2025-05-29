import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/index.css'
import App from './App.jsx'
import UserProvider from './UserProvider.jsx'
import { disableNumberInputArrowKeys } from './utils/inputUtils.js'

// Disable arrow keys for number inputs
disableNumberInputArrowKeys();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <UserProvider>
      <App />
    </UserProvider>
    
  </StrictMode>,
)

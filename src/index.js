import { createRoot } from 'react-dom/client'
import React from 'react'

import App from './app'

import './style/classic'

const container = document.getElementById('app')
const root = createRoot(container)

if (ENV === `dev`) {
  root.render(<React.StrictMode>
    <App />
  </React.StrictMode>)
} else {
  root.render(<App />)
}

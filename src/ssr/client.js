import React from 'react'
import { hydrateRoot } from 'react-dom/client'

import { clientRouter } from '../router'
import App from '../app'

const container = document.getElementById('app')
hydrateRoot(container, <App>{clientRouter()}</App>)

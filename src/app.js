import { RouterProvider, createBrowserRouter } from 'react-router-dom'
import { Helmet, HelmetProvider } from 'react-helmet-async'

import Layout from './layout'
import { ThemeProvider } from './context/useTheme'
import { NodeSocketProvider } from './context/useNodeSocket'
import { SettingsProvider } from './context/useSettings'
import { OverlayProvider } from './context/useOverlay'

import Block from './pages/block'
import Blocks from './pages/blocks'
import Home from './pages/home'
import NotFound from './pages/notFound'
import Transaction from './pages/transaction'
import DAG from './pages/dag'
import MemPool from './pages/memPool'

const router = createBrowserRouter([
  {
    children: [
      {
        element: <Layout />,
        children: [
          {
            path: '/',
            element: <Home />,
          },
          {
            path: '/blocks',
            element: <Blocks />,
          },
          {
            path: '/blocks/:id',
            element: <Block />
          },
          {
            path: '/mempool',
            element: <MemPool />
          },
          {
            path: `/txs/:hash`,
            element: <Transaction />
          },
          {
            path: '*',
            element: <NotFound />
          }
        ]
      },
      {
        path: `/dag`,
        element: <DAG />
      }
    ]
  }
])

function App() {
  return <ThemeProvider>
    <HelmetProvider>
      <Helmet titleTemplate="%s · Xelis Explorer" />
      <SettingsProvider>
        <NodeSocketProvider>
          <OverlayProvider>
            <RouterProvider router={router} />
          </OverlayProvider>
        </NodeSocketProvider>
      </SettingsProvider>
    </HelmetProvider>
  </ThemeProvider>
}

export default App

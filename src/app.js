import { RouterProvider, createBrowserRouter } from 'react-router-dom'
import { Helmet, HelmetProvider } from 'react-helmet-async'
import { NodeSocketProvider } from '@xelis/sdk/react/context'

import { ThemeProvider } from './context/useTheme'
import useSettings, { SettingsProvider } from './context/useSettings'
import { OverlayProvider } from './context/useOverlay'
import Layout from './layout'
import Block from './pages/block'
import Blocks from './pages/blocks'
import Home from './pages/home'
import NotFound from './pages/notFound'
import Transaction from './pages/transaction'
import DAG from './pages/dag'
import MemPool from './pages/memPool'
import Settings from './pages/settings'

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
            path: `/settings`,
            element: <Settings />
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

function Routes() {
  const { settings } = useSettings()
  const endpoint = settings['node_ws_endpoint']

  return <NodeSocketProvider endpoint={endpoint}>
    <OverlayProvider>
      <RouterProvider router={router} />
    </OverlayProvider>
  </NodeSocketProvider>
}

function App() {
  return <HelmetProvider>
    <Helmet titleTemplate="%s · Xelis Explorer" />
    <SettingsProvider>
      <ThemeProvider>
        <Routes />
      </ThemeProvider>
    </SettingsProvider>
  </HelmetProvider>
}

export default App

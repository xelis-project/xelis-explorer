import { RouterProvider, createBrowserRouter } from 'react-router-dom'
import { Helmet } from 'react-helmet'

import Layout from './layout'
import { ThemeProvider } from './context/useTheme'
import { NodeSocketProvider } from './context/useNodeSocket'
import { SettingsProvider } from './context/useSettings'

import Block from './pages/block'
import Blocks from './pages/blocks'
import Home from './pages/home'
import NotFound from './pages/notFound'
import TxPool from './pages/txPool'
import Transaction from './pages/transaction'
import DAG from './pages/dag'

const router = createBrowserRouter([
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
        path: '/block/:id',
        element: <Block />
      },
      {
        path: '/txpool',
        element: <TxPool />
      },
      {
        path: `/tx/:hash`,
        element: <Transaction />
      },
      {
        path: `/dag`,
        element: <DAG />
      },
      {
        path: '*',
        element: <NotFound />
      }
    ]
  }
])

function App() {
  return <ThemeProvider>
    <Helmet titleTemplate="%s · Xelis Explorer" />
    <SettingsProvider>
      <NodeSocketProvider>
        <RouterProvider router={router} />
      </NodeSocketProvider>
    </SettingsProvider>
  </ThemeProvider>
}

export default App

import { NodeSocketProvider } from '@xelis/sdk/react/daemon'
import { Outlet } from 'react-router-dom'

import App from './app'
import Layout from './layout'

import Block from './pages/block'
import Blocks from './pages/blocks'
import Home from './pages/home'
import NotFound from './pages/notFound'
import Transaction from './pages/transaction'
import DAG from './pages/dag'
import MemPool from './pages/memPool'
import Settings from './pages/settings'
import Account from './pages/account'
import Accounts from './pages/accounts'
import Peers from './pages/peers'
import MiningCalculator from './pages/miningCalculator'
import HeightBlocks from './pages/heightBlocks'

import { defaultSettings, settingsKeys } from './settings'
import useSettings from './hooks/useSettings'

export function SubApp() {
  const { settings } = useSettings()
  const endpoint = settings[settingsKeys.NODE_WS_ENDPOINT]

  return <NodeSocketProvider endpoint={endpoint}>
    <Outlet />
  </NodeSocketProvider>
}

const routes = [
  {
    element: <App title="XELIS Explorer" defaultSettings={defaultSettings}>
      <SubApp />
    </App>,
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
            path: '/height/:height',
            element: <HeightBlocks />,
          },
          {
            path: '/blocks/:id',
            element: <Block />
          },
          {
            path: '/accounts',
            element: <Accounts />
          },
          {
            path: '/accounts/:addr',
            element: <Account />
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
            path: `/peers`,
            element: <Peers />
          },
          {
            path: `/mining-calculator`,
            element: <MiningCalculator />
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
]

export default routes

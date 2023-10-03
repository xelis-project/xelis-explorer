import { createBrowserRouter, createMemoryRouter, RouterProvider } from 'react-router-dom'

import Layout from './layout/layout'

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

const routes = [
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

export const ServerRouter = (props) => {
  const { path } = props
  return <RouterProvider router={createMemoryRouter(routes, {
    initialEntries: [path]
  })} />
}

export const ClientRouter = () => {
  return <RouterProvider router={createBrowserRouter(routes)} />
}

import { RouterProvider, createBrowserRouter } from 'react-router-dom'
import Block from './pages/block'
import Blocks from './pages/blocks'
import Home from './pages/home'
import Layout from './layout'
import NotFound from './pages/notFound'
import { ThemeProvider } from './context/useTheme'
import { NodeSocketProvider } from './context/useNodeSocket'

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
        path: '/blocks/:id',
        element: <Block />
      },
      {
        path: '*',
        element: <NotFound />
      }
    ]
  }
])

function App() {
  return <ThemeProvider defaultTheme="dark">
    <NodeSocketProvider>
      <RouterProvider router={router} />
    </NodeSocketProvider>
  </ThemeProvider>
}

export default App

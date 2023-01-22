import { Outlet } from 'react-router'
import Header from './components/header'

function Layout() {
  return <div className="layout">
    <Header />
    <Outlet />
  </div>
}

export default Layout

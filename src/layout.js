import { Outlet } from 'react-router'
import Header from './components/header'
import Footer from './components/footer'
import EnvAlert from './components/envAlert'

function Layout() {
  return <div className="layout">
    <EnvAlert />
    <Header />
    <Outlet />
    <Footer />
  </div>
}

export default Layout

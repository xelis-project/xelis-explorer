import { useCallback, useMemo, useState } from 'react'
import { NavLink } from 'react-router-dom'
import useTheme from '../../context/useTheme'
import Button from '../button'
import { Link } from 'react-router-dom'
import Icon from '../icon'

function useMenuLinks() {
  return useMemo(() => {
    const isActive = ({ isActive }) => {
      if (isActive) return `header-nav-item header-nav-item-active`
      return `header-nav-item`
    }

    return [
      { path: `/`, title: `Home`, className: isActive },
      { path: `/blocks`, title: `Blocks`, className: isActive },
      { path: `/txpool`, title: `Tx Pool`, className: isActive }
    ]
  }, [])
}

function ToggleThemeButton(props) {
  const { theme, setTheme } = useTheme()

  const toggleTheme = useCallback(() => {
    if (theme === `dark`) setTheme(`light`)
    else setTheme(`dark`)
  }, [theme])

  const icon = useMemo(() => {
    const map = {
      'light': 'moon',
      'dark': 'sun'
    }
    return map[theme]
  }, [theme])

  return <Button icon={icon} size={1} title="Toggle Theme" onClick={toggleTheme} {...props} />
}

function Header() {
  const links = useMenuLinks()

  const [menuOpen, setMenuOpen] = useState(false)

  return <div className="header">
    <Link to="/" className="header-logo" />
    <div className="header-dropdown">
      <div className="header-menu-button" onClick={() => setMenuOpen(!menuOpen)}>
        <Icon name="menu" />Menu
      </div>
      <div className={`header-nav ${!menuOpen && `closed`}`}>
        {links.map((item) => {
          return <NavLink key={item.path} to={item.path}
            className={item.className}>
            {item.title}
          </NavLink>
        })}
        <div className="header-nav-icons">
          <Button icon="options" size={1.2} title="Settings" className="header-nav-item" style={{ height: 20 }} />
          <ToggleThemeButton className="header-nav-item" />
        </div>
      </div>
    </div>
  </div>
}

export default Header

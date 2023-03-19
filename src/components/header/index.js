import { useEffect, useMemo, useRef, useState } from 'react'
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
      { path: `/indexed/txs`, title: `Txs`, className: isActive },
      { path: `/txpool`, title: `Tx Pool`, className: isActive },
      { path: `/dag`, title: `DAG`, className: isActive },
      { path: `/stats`, title: `Stats`, className: isActive }
    ]
  }, [])
}

export function ToggleThemeButton(props) {
  const { theme, toggleTheme } = useTheme()

  const icon = useMemo(() => {
    const map = {
      'light': 'moon',
      'dark': 'sun'
    }
    return map[theme]
  }, [theme])

  return <Button icon={icon} title="Toggle Theme" onClick={toggleTheme} {...props} />
}

function Header(props) {
  const links = useMenuLinks()
  const headerMenuRef = useRef()

  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const clickOutside = (e) => {
      if (!headerMenuRef.current.contains(e.target)) {
        setMenuOpen(false)
      }
    }

    window.addEventListener(`click`, clickOutside)

    return () => {
      window.removeEventListener(`click`, clickOutside)
    }
  }, [menuOpen])

  const className = `header ${props.className || ``}`

  return <div className={className} {...props}>
    <Link to="/" className="header-logo" />
    <div className="header-dropdown">
      <div ref={headerMenuRef} className="header-menu-button" onClick={() => setMenuOpen(!menuOpen)}>
        <Icon name="menu" />Menu
      </div>
      <div className={`header-nav ${menuOpen ? `` : `closed`}`}>
        {links.map((item) => {
          return <NavLink key={item.path} to={item.path}
            className={item.className}>
            {item.title}
          </NavLink>
        })}
        <div className="header-nav-icons">
          <Button icon="options" title="Settings" className="header-nav-item" style={{ height: 20 }} />
          <ToggleThemeButton className="header-nav-item" />
        </div>
      </div>
    </div>
  </div>
}

export default Header

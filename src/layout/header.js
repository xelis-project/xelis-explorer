import { useEffect, useMemo, useRef, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { css } from 'goober'
import { Link } from 'react-router-dom'
import Icon from 'g45-react/components/fontawesome_icon'

import useTheme from '../hooks/useTheme'
import theme from '../style/theme'
import { scaleOnHover } from '../style/animate'
import { useLang } from 'g45-react/hooks/useLang'
import { LangDropdown, ThemeDropdown } from '../pages/settings'

const headerStyle = {
  container: css`
    display: flex;
    justify-content: space-between;
    align-items: center;
    position: relative;
    padding-top: 2em;
  `,
  logo: css`
    display: flex;
    gap: .5em;
    font-size: 1.2em;
    align-items: center;
    text-decoration: none;
    color: var(--text-color);
    font-weight: bold;

    > :nth-child(1) {
      width: 30px;
      height: 30px;
      display: block;
      background-size: contain;
      background-repeat: no-repeat;
      background-image: ${theme.apply({ xelis: `url('/public/img/white_background_black_logo.svg')`, light: `url('/public/img/black_background_white_logo.svg')`, dark: `url('/public/img/white_background_black_logo.svg')`, })};
    }
  `
}

const menuStyle = {
  button: css`
    padding: 0.4em 0.5em;
    background: #00000029;
    border-radius: 0.5em;
    display: flex;
    cursor: pointer;
    border: none;
    color: var(--text-color);
    font-size: 1.5em;
    ${scaleOnHover({ scale: `.94` })};
  `,
  container: css`
    --header-nav-active-color: ${theme.apply({ xelis: '#172926', light: '#dddddd', dark: '#212121' })};

    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    padding: 1em;
    display: flex;
    flex-direction: column;
    background-color: ${theme.apply({ xelis: `rgb(29 59 55 / 80%)`, light: `rgb(250 250 250 / 80%)`, dark: `rgb(16 16 16 / 80%)` })};
    gap: .25em;
    z-index: 1;
    font-size: 1.2em;
    opacity: 0;
    transform: translateY(-100%);
    transition: all .25s;
    backdrop-filter: blur(5px);
    box-shadow: 0px -10px 20px 0px rgb(28 28 28 / 50%);
    border-bottom-left-radius: .5em;
    border-bottom-right-radius: .5em;

    ${theme.query.minDesktop} {
      max-width: 225px;
      position: absolute;
      right: 0;
      left: inherit;
    }

    &[data-open="true"] {
      transform: translateY(0);
      opacity: 1;
    }

    > :nth-child(1) > a {
      text-decoration: none;
      color: var(--header-nav-color);
      user-select: none;
      cursor: pointer;
      padding: 0.5em 0.7em;
      display: flex;
      gap: 0.5em;
      align-items: center;
      justify-content: space-between;
      border-radius: 5px;
  
      &:hover, &.active {
        background-color: var(--header-nav-active-color);
      }
    }

    > :nth-child(2) {
      display: flex;
      gap: .5em;
      margin-top: 1em;
      flex-direction: column;
    }
  `
}

function useMenuLinks() {
  const { t } = useLang()

  return useMemo(() => {
    const isActive = ({ isActive }) => {
      if (isActive) return `item active`
      return `item`
    }

    return [
      { path: `/`, title: t(`Home`), className: isActive, icon: 'house' },
      { path: `/blocks`, title: t(`Blocks`), className: isActive, icon: 'boxes-stacked' },
      { path: `/mempool`, title: t(`Mempool`), className: isActive, icon: 'square-poll-horizontal' },
      { path: `/dag`, title: `DAG`, className: isActive, icon: 'network-wired' },
      { path: `/accounts`, title: t(`Accounts`), className: isActive, icon: 'user-group' },
      { path: `/peers`, title: t(`Peers`), className: isActive, icon: 'ethernet' },
      { path: `/settings`, title: t(`Settings`), className: isActive, icon: 'gear' }
    ]
  }, [t])
}

function Header(props) {
  const links = useMenuLinks()
  const menuRef = useRef()
  const location = useLocation()

  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const clickOutside = (e) => {
      if (!menuRef.current.contains(e.target)) {
        setMenuOpen(false)
      }
    }

    window.addEventListener(`click`, clickOutside)

    return () => {
      window.removeEventListener(`click`, clickOutside)
    }
  }, [menuOpen])

  useEffect(() => {
    setMenuOpen(false)
  }, [location])

  return <div className={headerStyle.container} {...props}>
    <Link to="/" className={headerStyle.logo}>
      <div>{/* LOGO */}</div>
      <div>XELIS</div>
    </Link>
    <div ref={menuRef}>
      <button className={menuStyle.button} aria-label="Menu" onClick={() => setMenuOpen(!menuOpen)}>
        <Icon name="bars" />
      </button>
      <div data-open={menuOpen} className={menuStyle.container}>
        <div>
          {links.map((item) => {
            return <NavLink key={item.path} to={item.path}>
              <div>{item.title}</div>
              <Icon name={item.icon} />
            </NavLink>
          })}
        </div>
        <div>
          <LangDropdown size={0.9} />
          <ThemeDropdown size={0.9} />
        </div>
      </div>
    </div>
  </div>
}

export default Header

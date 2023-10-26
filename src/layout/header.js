import { useEffect, useMemo, useRef, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { css } from 'goober'
import { Link } from 'react-router-dom'

import useTheme from '../context/useTheme'
import Icon from '../components/icon'
import theme from '../style/theme'
import { scaleOnHover } from '../style/animate'

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
    cursor: pointer;
    border: none;
    background: transparent;
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
    background-color: var(--bg-color);
    gap: .25em;
    z-index: 1;
    font-size: 1.2em;
    opacity: 0;
    transform: translateY(-100%);
    transition: all .25s;
    box-shadow: 0px -10px 20px 0px rgb(28 28 28 / 50%);

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
      margin-top: .5em;
  
      ${theme.query.minDesktop} {
        justify-content: space-evenly;
      }
  
      button {
        font-weight: bold;
        border: none;
        padding: .5em .7em;
        cursor: pointer;
        color: var(--bg-color);
        background-color: var(--text-color);
        transition: .25s all;
        border-radius: 5px;
        ${scaleOnHover({ scale: .93 })}
      }
    }
  `
}

function useMenuLinks() {
  return useMemo(() => {
    const isActive = ({ isActive }) => {
      if (isActive) return `item active`
      return `item`
    }

    return [
      { path: `/`, title: `Home`, className: isActive, icon: 'house' },
      { path: `/blocks`, title: `Blocks`, className: isActive, icon: 'boxes-stacked' },
      { path: `/mempool`, title: `Mempool`, className: isActive, icon: 'square-poll-horizontal' },
      { path: `/dag`, title: `DAG`, className: isActive, icon: 'network-wired' },
      { path: `/accounts`, title: `Accounts`, className: isActive, icon: 'user-group' },
      { path: `/peers`, title: `Peers`, className: isActive, icon: 'ethernet' },
      { path: `/settings`, title: `Settings`, className: isActive, icon: 'gear' }
    ]
  }, [])
}

function Header(props) {
  const links = useMenuLinks()
  const headerMenuRef = useRef()

  const [menuOpen, setMenuOpen] = useState(false)
  const { setTheme } = useTheme()

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

  return <div className={headerStyle.container} {...props}>
    <Link to="/" className={headerStyle.logo}>
      <div>{/* LOGO */}</div>
      <div>XELIS</div>
    </Link>
    <div>
      <button ref={headerMenuRef} className={menuStyle.button} aria-label="Menu" onClick={() => setMenuOpen(!menuOpen)}>
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
          <button onClick={() => setTheme('xelis')}>Default</button>
          <button onClick={() => setTheme('dark')}>Dark</button>
          <button onClick={() => setTheme('light')}>Light</button>
        </div>
      </div>
    </div>
  </div>
}

export default Header

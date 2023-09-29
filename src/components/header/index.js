import { useEffect, useMemo, useRef, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { css } from 'goober'
import { Link } from 'react-router-dom'

import useTheme from '../../context/useTheme'
import Icon from '../icon'
import theme from '../../style/theme'

const style = {
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

    .logo {
      width: 30px;
      height: 30px;
      display: block;
      background-size: contain;
      background-repeat: no-repeat;
      background-image: ${theme.apply({
    xelis: `url('/img/white_background_black_logo.svg')`,
    light: `url('/img/black_background_white_logo.svg')`,
    dark: `url('/img/white_background_black_logo.svg')`,
  })};
    }
  `,
  menu: css`
    --header-nav-active-color: ${theme.apply({ xelis: '#172926', light: '#ffffff', dark: '#0a0a0a' })};

    .button {
      cursor: pointer;
      border: none;
      background: transparent;
      height: 20px;
      color: var(--text-color);
      --ggs: 1.3;
    }

    .container {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      padding: 1em;
      display: flex;
      flex-direction: column;
      background-color: var(--bg-color);
      gap: .5em;
      z-index: 1;
      font-size: 1.2em;
      transition: all .25s;
      transform: translateY(0);
      opacity: 1;
      box-shadow: 0px -10px 20px 0px rgb(28 28 28 / 50%);

      ${theme.query.minDesktop} {
        max-width: 225px;
        position: absolute;
        right: 0;
        left: inherit;
      }

      &.closed {
        opacity: 0;
        transform: translateY(-100%);
      }

      .item {
        text-decoration: none;
        color: var(--header-nav-color);
        user-select: none;
        cursor: pointer;
        background-color: var(--bg-color);
        padding: .5em;
        display: flex;
        gap: .5em;
        align-items: center;
      }
    
      .item:hover {
        background-color: var(--header-nav-active-color);
      }
    
      .item-active {
        background-color: var(--header-nav-active-color);
      }
    }
  `,
  themeButtons: css`
    display: flex;
    gap: .5em;
    margin-top: .5em;

    ${theme.query.minDesktop} {
      justify-content: space-evenly;
    }

    button {
      border: none;
      padding: .5em .7em;
      cursor: pointer;
      color: var(--bg-color);
      background-color: var(--text-color);
      transition: .25s all;

      &:hover {
        border-radius: 5px;
      }
    }
  `
}

function useMenuLinks() {
  return useMemo(() => {
    const isActive = ({ isActive }) => {
      if (isActive) return `item item-active`
      return `item`
    }

    return [
      { path: `/`, title: `Home`, className: isActive, icon: 'home-alt' },
      { path: `/blocks`, title: `Blocks`, className: isActive, icon: 'shape-hexagon' },
      { path: `/mempool`, title: `Mempool`, className: isActive, icon: 'calendar-due' },
      { path: `/dag`, title: `DAG`, className: isActive, icon: 'layout-pin' },
      { path: `/settings`, title: `Settings`, className: isActive, icon: 'options' }
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

  return <div className={style.container} {...props}>
    <Link to="/" className={style.logo}>
      <span className="logo" />
      <span>XELIS</span>
    </Link>
    <div className={style.menu}>
      <button className="button" ref={headerMenuRef} onClick={() => setMenuOpen(!menuOpen)}>
        <Icon name="menu" />
      </button>
      <div className={`container ${menuOpen ? `` : `closed`}`}>
        {links.map((item) => {
          return <NavLink key={item.path} to={item.path}
            className={item.className}>
            <Icon name={item.icon} />
            {item.title}
          </NavLink>
        })}
        <div className={style.themeButtons}>
          <button onClick={() => setTheme('light')}>Light</button>
          <button onClick={() => setTheme('dark')}>Dark</button>
          <button onClick={() => setTheme('xelis')}>XELIS</button>
        </div>
      </div>
    </div>
  </div>
}

export default Header

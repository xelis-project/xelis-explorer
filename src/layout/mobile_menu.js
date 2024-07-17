import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import Icon from 'g45-react/components/fontawesome_icon'
import { css } from 'goober'

import LangDropdown from '../pages/settings/lang_dropdown'
import ThemeDropdown from '../pages/settings/theme_dropdown'
import theme from '../style/theme'
import { style as headerStyle } from './header'

const style = {
  container: css`
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    padding: 3em 1.5em;
    display: flex;
    flex-direction: column;
    gap: .25em;
    z-index: 100;
    font-size: 1.2em;
    opacity: 0;
    transform: translateY(-100%);
    transition: all .25s;
    backdrop-filter: blur(${theme.apply({ xelis: `40px`, light: `30px`, dark: `40px` })});
    height: 100%;
    bottom: 0;

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
  `,
  bottomButtons: css`
    display: flex;
    gap: .5em;
    margin-top: 1em;
    flex-direction: column;
  `,
  menuButton: css`
    padding: 0.4em 0.5em;
    background: #00000029;
    border-radius: 0.5em;
    display: flex;
    cursor: pointer;
    border: none;
    color: var(--text-color);
    font-size: 1.5em;

    &:hover {
      transform: scale(.95);
    }
  `,
  closeButton: css`
    position: fixed;
    top: .5em;
    right: .5em;
    border-radius: 0.5em;
    background: none;
    display: flex;
    cursor: pointer;
    border: none;
    color: var(--text-color);
    font-size: 2em;
    transition: .1s transform;
    opacity: .6;

    &:hover {
      opacity: 1;
      transform: scale(.95);
    }
  `,
  links: css`
    display: flex;
    flex-direction: column;
    gap: 1.5em;

    > a {
      text-decoration: none;
      user-select: none;
      cursor: pointer;
      display: flex;
      gap: .5em;
      align-items: center;
      border-radius: .5em;
      color: var(--text-color);
      opacity: .6;
      font-size: 1.2em;
  
      &:hover, &.active {
        opacity: 1;
      }
    }
  `,
  menu: css`
    display: flex;
    justify-content: space-between;
    padding: 1.5em;
  `
}

function MobileMenu(props) {
  const { title, links = [] } = props

  const location = useLocation()

  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    setMenuOpen(false)
  }, [location])

  return <>
    <div className={style.menu}>
      <Link to="/" className={headerStyle.logo.container}>
        <div className={headerStyle.logo.image}></div>
        <div>{title}</div>
      </Link>
      <button className={style.menuButton} aria-label="Menu" onClick={() => setMenuOpen(true)}>
        <Icon name="bars" />
      </button>
    </div>
    <div data-open={menuOpen} className={style.container}>
      <button className={style.closeButton} aria-label="Close" onClick={() => setMenuOpen(false)}>
        <Icon name="close" />
      </button>
      <div className={style.links}>
        {links.map((item) => {
          const { title, path, icon } = item
          return <NavLink key={path} to={path}>
            <div>{title}</div>
            {icon}
          </NavLink>
        })}
      </div>
    </div>
  </>
}

export default MobileMenu
import { useEffect, useRef, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import Icon from 'g45-react/components/fontawesome_icon'
import { css } from 'goober'

import LangDropdown from '../pages/settings/lang_dropdown'
import ThemeDropdown from '../pages/settings/theme_dropdown'
import { scaleOnHover } from '../style/animate'
import theme from '../style/theme'

const style = {
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
    z-index: 3;
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
  `,
  bottomButtons: css`
    display: flex;
    gap: .5em;
    margin-top: 1em;
    flex-direction: column;
  `,
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
  links: css`
    display: flex;
    flex-direction: column;
    gap: .25em;

    > a {
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
  `
}

function MobileMenu(props) {
  const { links = [] } = props

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

  return <div ref={menuRef}>
    <button className={style.button} aria-label="Menu" onClick={() => setMenuOpen(!menuOpen)}>
      <Icon name="bars" />
    </button>
    <div data-open={menuOpen} className={style.container}>
      <div className={style.links}>
        {links.map((item) => {
          const { title, path, icon } = item
          return <NavLink key={path} to={path}>
            <div>{title}</div>
            {icon}
          </NavLink>
        })}
      </div>
      <div className={style.bottomButtons}>
        <LangDropdown size={0.9} />
        <ThemeDropdown size={0.9} />
      </div>
    </div>
  </div>
}

export default MobileMenu
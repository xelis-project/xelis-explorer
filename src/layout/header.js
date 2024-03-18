import { css } from 'goober'
import { Link, NavLink } from 'react-router-dom'

import theme from '../style/theme'
import MobileMenu from './mobile_menu'

const style = {
  container: css`
    display: flex;
    justify-content: space-between;
    align-items: start;
    position: relative;
    padding-top: 4em;
    gap: 2em;

    .menu {
      display: flex;
      gap: .5em;
      justify-content: center;
      width: 100%;
      flex-wrap: wrap;

      ${theme.query.maxDesktop} {
        display: none;
      }

      > a {
        display: flex;
        gap: .5em;
        text-decoration: none;
        align-items: center;
        background-color: var(--stats-bg-color);
        color: var(--text-color);
        border-radius: .5em;
        padding: .6em .8em;
        opacity: .7;
        transition: all .1s;

        &.active, &:hover {
          opacity: 1;
        }
      }
    }

    .mobile-menu {
      ${theme.query.minDesktop} {
        display: none;
      }
    }
  `,
  logo: css`
    display: flex;
    gap: .5em;
    font-size: 1.2em;
    align-items: center;
    text-decoration: none;
    color: var(--text-color);
    font-weight: bold;

    ${theme.query.minDesktop} {
      display: none;
    }

    .logo {
      width: 30px;
      height: 30px;
      display: block;
      background-size: contain;
      background-repeat: no-repeat;
      background-image: ${theme.apply({ xelis: `url('public/img/white_background_black_logo.svg')`, light: `url('public/img/black_background_white_logo.svg')`, dark: `url('public/img/white_background_black_logo.svg')`, })};
    }
  `
}

function Header(props) {
  const { title, links, ...restProps } = props

  return <div className={style.container} {...restProps}>
    <Link to="/" className={style.logo}>
      <div className="logo"></div>
      <div>{title}</div>
    </Link>
    <div className="menu">
      {links.map((item) => {
        const { title, path, icon } = item
        return <NavLink key={path} to={path}>
          <div>{title}</div>
          {icon}
        </NavLink>
      })}
    </div>
    <div className="mobile-menu">
      <MobileMenu links={links} />
    </div>
  </div>
}

export default Header

import { css } from 'goober'
import { Link, NavLink } from 'react-router-dom'

import theme from '../style/theme'
import MobileMenu from './mobile_menu'

import logoBlackUrl from '../../assets/black_background_white_logo.svg'
import logoWhiteUrl from '../../assets/white_background_black_logo.svg'

export const logoBgUrl = theme.apply({
  xelis: `url('${logoWhiteUrl}')`,
  light: `url('${logoBlackUrl}')`,
  dark: `url('${logoWhiteUrl}')`,
})

const style = {
  container: css`
    display: flex;
    justify-content: space-between;
    align-items: start;
    position: relative;
    gap: 2em;
  `,
  menu: css`
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
      background-color: var(--content-bg-color);
      color: var(--text-color);
      border-radius: .5em;
      padding: .6em .8em;
      opacity: .7;
      transition: all .1s;
      font-size: 1.1em;

      &:hover {
        opacity: 1;
        transform: translate(0, 2px);
      }

      &.active {
        opacity: 1;
      }
    }
  `,
  mobileMenu: css`
    ${theme.query.minDesktop} {
      display: none;
    }
  `,
  logo: {
    container: css`
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
    `,
    image: css`
      width: 30px;
      height: 30px;
      display: block;
      background-size: contain;
      background-repeat: no-repeat;
      background-image: ${logoBgUrl};
    `
  }
}

function Header(props) {
  const { title, links, className, ...restProps } = props

  return <div className={`${style.container} ${className}`} {...restProps}>
    <Link to="/" className={style.logo.container}>
      <div className={style.logo.image}></div>
      <div>{title}</div>
    </Link>
    <div className={style.menu}>
      {links.map((item) => {
        const { title, path, icon } = item
        return <NavLink key={path} to={path}>
          <div>{title}</div>
          {icon}
        </NavLink>
      })}
    </div>
    <div className={style.mobileMenu}>
      <MobileMenu links={links} />
    </div>
  </div>
}

export default Header

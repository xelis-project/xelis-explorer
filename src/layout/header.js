import { css } from 'goober'
import { Link, NavLink } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'

import theme from '../style/theme'
import MobileMenu from './mobile_menu'
import layoutStyle from '../style/layout'

import logoBlackUrl from '../../assets/black_background_white_logo.svg'
import logoWhiteUrl from '../../assets/white_background_black_logo.svg'

export const logoBgUrl = theme.apply({
  xelis: `url('${logoWhiteUrl}')`,
  light: `url('${logoBlackUrl}')`,
  dark: `url('${logoWhiteUrl}')`,
})

export const style = {
  header: css`
    padding: 1.5em 0;
    position: sticky;
    top: 0;
    z-index: 10;
    transition: .25s all;
    
    > div {
      display: flex;
      justify-content: space-between;
      align-items: start;
      gap: 1.5em;
    }

    ${theme.query.maxDesktop} {
      display: none;
    }
  `,
  headerBg: css`
    background-color: ${theme.apply({ xelis: `rgb(25 41 41 / 50%)`, light: `rgb(255 255 255 / 0%)`, dark: `rgb(0 0 0 / 40%)` })};
    backdrop-filter: blur(${theme.apply({ xelis: `40px`, light: `20px`, dark: `40px` })});
  `,
  list: css`
    display: flex;
    gap: .75em;
    flex-wrap: wrap;
    justify-content: flex-end;

    > a {
      display: flex;
      gap: .5em;
      text-decoration: none;
      align-items: center;
      background-color: rgb(255 255 255 / 10%);
      color: var(--text-color);
      opacity: .7;
      border-radius: .5em;
      padding: .6em .8em;
      transition: all .1s;
      font-size: 1em;

      &:hover {
        background-color: rgb(255 255 255 / 20%);
        opacity: 1;
        transform: scale(.96);
      }

      &.active {
        background-color: rgb(255 255 255 / 20%);
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
  const { title, links, ...restProps } = props
  const [headerClass, setHeaderClass] = useState(style.header)

  useEffect(() => {
    const onScroll = () => {
      if (document.body.scrollTop > 0) {
        setHeaderClass(`${style.header} ${style.headerBg}`)
      } else {
        setHeaderClass(style.header)
      }
    }

    onScroll()
    document.body.addEventListener(`scroll`, onScroll)
    return () => {
      document.body.removeEventListener(`scroll`, onScroll)
    }
  }, [])

  return <>
    <div className={headerClass} {...restProps}>
      <div className={layoutStyle.pageMaxWidth}>
        <Link to="/" className={style.logo.container}>
          <div className={style.logo.image}></div>
          <div>{title}</div>
        </Link>
        <div className={style.list}>
          {links.map((item) => {
            const { title, path, icon } = item
            return <NavLink key={path} to={path}>
              <div>{title}</div>
              {icon}
            </NavLink>
          })}
        </div>
      </div>
    </div>
    <div className={style.mobileMenu}>
      <MobileMenu title={title} links={links} />
    </div>
  </>
}

export default Header

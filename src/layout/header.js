import { css } from 'goober'
import { Link } from 'react-router-dom'

import theme from '../style/theme'

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

    > :nth-child(1) {
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
  const { title, menu, ...restProps } = props

  return <div className={style.container} {...restProps}>
    <Link to="/" className={style.logo}>
      <div>{/* LOGO */}</div>
      <div>{title}</div>
    </Link>
    {menu}
  </div>
}

export default Header

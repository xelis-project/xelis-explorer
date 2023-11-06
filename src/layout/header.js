import { useMemo } from 'react'
import { css } from 'goober'
import { Link } from 'react-router-dom'
import { useLang } from 'g45-react/hooks/useLang'
import Icon from 'g45-react/components/fontawesome_icon'

import theme from '../style/theme'
import Menu from './menu'

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
      background-image: ${theme.apply({ xelis: `url('/public/img/white_background_black_logo.svg')`, light: `url('/public/img/black_background_white_logo.svg')`, dark: `url('/public/img/white_background_black_logo.svg')`, })};
    }
  `
}

function Header(props) {
  const { t } = useLang()

  const links = useMemo(() => {
    return [
      { path: `/`, title: t(`Home`), icon: <Icon name="house" /> },
      { path: `/blocks`, title: t(`Blocks`), icon: <Icon name="boxes-stacked" /> },
      { path: `/mempool`, title: t(`Mempool`), icon: <Icon name="square-poll-horizontal" /> },
      { path: `/dag`, title: `DAG`, icon: <Icon name="network-wired" /> },
      { path: `/accounts`, title: t(`Accounts`), icon: <Icon name="user-group" /> },
      { path: `/peers`, title: t(`Peers`), icon: <Icon name="ethernet" /> },
      { path: `/settings`, title: t(`Settings`), icon: <Icon name="gear" /> }
    ]
  }, [t])

  return <div className={style.container} {...props}>
    <Link to="/" className={style.logo}>
      <div>{/* LOGO */}</div>
      <div>XELIS</div>
    </Link>
    <Menu links={links} />
  </div>
}

export default Header

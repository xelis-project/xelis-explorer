import { Outlet, useLocation } from 'react-router'
import { css } from 'goober'
import { useMemo, useRef } from 'react'
import { useLang } from 'g45-react/hooks/useLang'
import Icon from 'g45-react/components/fontawesome_icon'

import Header from './header'
import Footer from './footer'
import NodeStatus from '../layout/node_status'
import theme from '../style/theme'
import { opacity } from '../style/animate'
import packageJSON from '../../package.json'
import Menu from './menu'

export const style = {
  /*
  // Static version
  background: css`
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-image: ${theme.apply({ xelis: `url('public/img/bg_xelis.jpg')`, dark: `url('public/img/bg_xelis_dark.jpg')`, light: `url('public/img/bg_xelis_light.jpg')` })};
    background-repeat: no-repeat;
    background-size: cover;
    background-position: top center;
    z-index: -1;
  `,
  */
  bg: css`
    .darker {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: black;
      opacity: 0.1;
    }

    .noise {
      position: absolute;
      width: 100%;
      height: 100%;
      background-image: url(public/img/noise.jpg);
      opacity: 0.06;
    }

    .circle {
      position: absolute;
      border-radius: 50%;
      top: -34.4444444444vh;
      left: -12.2395833333vw;
      width: 79.21875vw;
      height: 120vw;
      max-height: 100%;
      background: ${theme.apply({
    light: 'linear-gradient(180deg, rgb(203 203 203 / 28%) 0%, rgba(0,0,0,0) 100%)',
    dark: 'linear-gradient(180deg, rgb(59 59 59 / 15%) 0%, rgba(0,0,0,0) 100%)',
    xelis: `linear-gradient(180deg, rgb(0 139 170 / 15%) 0%, rgba(0,0,0,0) 100%)`
  })};
    }

    .mid-light {
      position: absolute;
      border-radius: 50%;
      top: 26.4444444444vh;
      left: 47.0833333333vw;
      width: 50vw;
      height: 59.8888888889vh;
      background: ${theme.apply({ light: 'rgb(221 221 221 / 60%)', dark: 'rgb(107 107 107 / 50%)', xelis: `rgb(0 170 129 / 80%)` })};
      filter: blur(12.7604166667vw);
    }

    .top-light {
      position: absolute;
      border-radius: 50%;
      top: -19.6666666667vh;
      left: 18.125vw;
      width: 91.25vw;
      height: 65.8888888889vh;
      background: ${theme.apply({ light: 'rgb(213 213 213 / 40%)', dark: 'rgb(49 49 49 / 40%)', xelis: `rgb(0 170 150 / 40%)` })};
      filter: blur(12.7604166667vw);
    }

    .right-light {
      position: absolute;
      border-radius: 50%;
      top: 0;
      left: 65.2604166667vw;
      width: 57.4479166667vw;
      height: 100%;
      background: ${theme.apply({ light: 'rgb(165 165 165 / 70%)', dark: 'rgb(22 22 22 / 70%)', xelis: `rgb(5 124 132 / 70%)` })};
      filter: blur(11.9791666667vw);
    }
  `,
  container: css`
    position: relative;
    height: 100%;

    .layout-max-width {
      margin: 0 auto;
      max-width: 1200px;
      width: 100%;
      padding: 0 1em;

      ${theme.query.minMobile} {
        padding: 0 2em;
      }
  
      ${theme.query.minLarge} {
        max-width: 1400px;
      }
    }
  `,
  layoutFlex: css`
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    height: 100%;
    position: relative;
    z-index: 1;

    [data-opacity="true"] {
      ${opacity()}
    }
  `,
}

function Layout() {
  const location = useLocation()
  const firstLocation = useRef(location)
  const { t } = useLang()

  const firstLoad = firstLocation.current.key === location.key

  const footerProps = useMemo(() => {
    return {
      title: t('XELIS Explorer'),
      description: t(`The explorer allows to track and verify transactions on the XELIS network. You can search for specific transactions and monitor the overall health of the network.`),
      version: `v${packageJSON.version}`,
      links: [
        { href: `https://xelis.io`, title: t('Home'), icon: <Icon name="home" /> },
        { href: STATS_LINK, title: t('Statistics'), icon: <Icon name="chart-simple" /> },
        { href: `https://docs.xelis.io`, title: t('Documentation'), icon: <Icon name="book" /> },
        { href: `https://github.com/xelis-project`, title: `GitHub`, icon: <Icon name="github" type="brands" /> },
        { href: `https://discord.gg/z543umPUdj`, title: `Discord`, icon: <Icon name="discord" type="brands" /> },
      ],
      pages: [
        { link: `/`, title: t('Home') },
        { link: `/blocks`, title: t('Blocks') },
        { link: `/mempool`, title: t('Mempool') },
        { link: `/dag`, title: t('DAG') },
        { link: `/accounts`, title: t('Accounts') },
        { link: `/peers`, title: t('Peers') },
        { link: `/settings`, title: t('Settings') },
      ]
    }
  }, [t])

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

  return <>
    <div className={style.container}>
      <div className={style.bg}>
        <div className="noise" />
        <div className="circle" />
        <div className="mid-light" />
        <div className="top-light" />
        <div className="right-light" />
        <div className="darker" />
      </div>
      <NodeStatus />
      <div className={style.layoutFlex}>
        <div className="layout-max-width">
          <Header title={t(`Explorer`)} menu={<Menu links={links} />} />
          <div data-opacity={!firstLoad} key={location.key}> {/* Keep location key to re-trigger page transition animation */}
            <Outlet />
          </div>
        </div>
        <Footer {...footerProps} />
      </div>
    </div>
  </>
}

export default Layout

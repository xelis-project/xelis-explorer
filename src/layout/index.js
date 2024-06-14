import { Outlet, useLocation } from 'react-router'
import { useMemo, useRef } from 'react'
import { useLang } from 'g45-react/hooks/useLang'
import Icon from 'g45-react/components/fontawesome_icon'
import { css } from 'goober'
import { Helmet } from 'react-helmet-async'
import { preloadSVG, preloadIMG } from 'g45-react/utils/preload'

import Header from './header'
import Footer from './footer'
import NodeStatus from './node_status'
import packageJSON from '../../package.json'
import Background from './background'
import layoutStyle from '../style/layout'

import noiseUrl from '../../assets/noise.jpg'
import logoBlackUrl from '../../assets/black_background_white_logo.svg'
import logoWhiteUrl from '../../assets/white_background_black_logo.svg'
import faviconUrl from '../../assets/favicon.ico'

export const favicon = () => {
  return <link rel="icon" href={faviconUrl} sizes="any" />
}

export const PreloadAssets = () => {
  return <Helmet>
    {preloadSVG(logoBlackUrl)}
    {preloadSVG(logoWhiteUrl)}
    {preloadIMG(noiseUrl)}
  </Helmet>
}

const style = {
  header: css`
    padding-top: 4em;
  `
}

function Layout() {
  const location = useLocation()
  const firstLocation = useRef(location)
  const { t } = useLang()

  const firstLoad = firstLocation.current.key === location.key

  const links = useMemo(() => {
    return [
      { path: `/`, title: t(`Home`), icon: <Icon name="house" /> },
      { path: `/blocks`, title: t(`Blocks`), icon: <Icon name="boxes-stacked" /> },
      { path: `/mempool`, title: t(`Mempool`), icon: <Icon name="square-poll-horizontal" /> },
      { path: `/dag`, title: `DAG`, icon: <Icon name="network-wired" /> },
      { path: `/accounts`, title: t(`Accounts`), icon: <Icon name="user-group" /> },
      { path: `/peers`, title: t(`Peers`), icon: <Icon name="ethernet" /> },
      { path: `/mining-calculator`, title: t('Mining Calculator'), icon: <Icon name="calculator" /> },
      { path: `/settings`, title: t(`Settings`), icon: <Icon name="gear" /> }
    ]
  }, [t])

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
      pages: links
    }
  }, [t, links])

  return <>
    <div className={layoutStyle.container}>
      <Background />
      <NodeStatus />
      <div className={layoutStyle.pageFlex}>
        <div className={layoutStyle.pageMaxWidth}>
          <Header title={t(`Explorer`)} links={links} className={style.header} />
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

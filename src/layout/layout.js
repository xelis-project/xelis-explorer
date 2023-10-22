import { Outlet, useLocation } from 'react-router'
import { css } from 'goober'

import Header from './header'
import Footer from './footer'
import NodeStatus from '../layout/node_status'
import theme from '../style/theme'
import { opacity } from '../style/animate'

export const style = {
  background: css`
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-image: ${theme.apply({ xelis: `url('/public/img/bg_xelis.jpg')`, dark: `url('/public/img/bg_xelis_dark.jpg')`, light: `url('/public/img/bg_xelis_light.jpg')` })};
    background-repeat: no-repeat;
    background-size: cover;
    background-position: top center;
    z-index: -1;
  `,
  // Lagging when resizing so I converted to jpg
  /*
  background: css`
    .bg {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: ${theme.apply({ light: 'white', dark: 'black', xelis: `black` })};
    }

    .noise {
      position: fixed;
      width: 200%;
      height: 200vh;
      background-image: url('/public/img/noise.jpg');
      filter: blur(0px);
      opacity: 0.05;
    }

    .bgl {
      position: fixed;
      border-radius: 50%;
      top: -34.4444444444vh;
      left: -12.2395833333vw;
      width: 79.21875vw;
      height: 169vh;
      background: ${theme.apply({ light: 'rgb(203 203 203 / 28%)', dark: 'rgb(59 59 59 / 10%)', xelis: `rgba(0,139,170,.1)` })};
    }
    
    .bgc {
      position: fixed;
      border-radius: 50%;
      top: 26.4444444444vh;
      left: 47.0833333333vw;
      width: 28.0729166667vw;
      height: 59.8888888889vh;
      background: ${theme.apply({ light: 'rgb(221 221 221 / 60%)', dark: 'rgb(107 107 107 / 50%)', xelis: `#00aa81` })};
      filter: blur(12.7604166667vw);
    }

    .bgt {
      position: fixed;
      border-radius: 50%;
      top: -19.6666666667vh;
      left: 18.125vw;
      width: 91.25vw;
      height: 65.8888888889vh;
      background: ${theme.apply({ light: 'rgb(213 213 213 / 80%)', dark: 'rgb(49 49 49 / 80%)', xelis: `rgba(0,170,150,.8)` })};
      filter: blur(12.7604166667vw);
    }

    .bgbr {
      position: fixed;
      border-radius: 50%;
      top: 46.3333333333vh;
      left: 65.2604166667vw;
      width: 57.4479166667vw;
      height: 122.5555555556vh;
      background: ${theme.apply({ light: 'rgb(165 165 165 / 70%)', dark: 'rgb(22 22 22 / 70%)', xelis: `rgba(5,124,132,.7)` })};
      filter: blur(11.9791666667vw);
    }
  `,*/
  container: css`
    position: relative;
    height: 100%;

    .layout-max-width {
      margin: 0 auto;
      max-width: 1000px;
      width: 100%;
      padding: 0 2em;
  
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

    [data-page="opacity"] {
      ${opacity()}
    }
  `,
  nodeStatus: css`
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
    z-index: 1;
    margin-top: 1em;
    transition: .25s all;

    ${theme.query.maxMobile} {
      margin-top:-2px;

      > div > :nth-child(1) {
        border-radius: 10px;
        border-top-left-radius: 0;
        border-top-right-radius: 0;
        transform: scale(.9);
      }
    }
  `
}

function Layout() {
  const location = useLocation()

  return <>
    <div className={style.background}>
      <div className="bg" />
      {/*
        <div className="noise" />
        <div className="bg bgl" />
        <div className="bg bgc" />
        <div className="bg bgt" />
        <div className="bg bgbr" />
      */}
    </div>
    <div className={style.container}>
      <div className={style.nodeStatus}>
        <NodeStatus />
      </div>
      <div className={style.layoutFlex}>
        <div className="layout-max-width">
          <Header />
          <div data-page="opacity" key={location.key}> {/* Keep location key to re-trigger page transition animation */}
            <Outlet />
          </div>
        </div>
        <Footer />
      </div>
    </div>
  </>
}

export default Layout

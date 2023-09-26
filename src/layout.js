import { Outlet } from 'react-router'
import { css, glob } from 'goober'

import Header from './components/header'
import Footer from './components/footer'
import NodeStatus from './components/nodeStatus'
import theme from './theme'

glob`
  html, body {
    background: var(--bg-color);
    color: var(--text-color);
    transition: all .25s;
  }
`

const style = {
  background: css`
    position: fixed;
    top: -10px;
    left: -10px;
    right: -10px;
    bottom: -10px;
    background: ${theme.apply({ xelis: `url('/img/bg_xelis.jpeg')` })};
    background-position: center;
    background-repeat: no-repeat;
    background-size: cover;
    filter: blur(5px);
  `,
  container: css`
    margin: 0 auto;
    max-width: 1000px;
    padding: 0 2em;
    position: relative;

    .node-status {
      position: absolute;
      left: 50%;
      transform: translateX(-50%);
      margin-top: 1em;
    }
  `
}

function Layout() {
  return <>
    <div className={style.background} />
    <div className={style.container}>
      <div className="node-status">
        <NodeStatus />
      </div>
      <Header />
      <Outlet />
      <Footer />
    </div>
  </>
}

export default Layout

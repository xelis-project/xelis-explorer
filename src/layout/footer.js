import { css } from 'goober'
import { Link } from 'react-router-dom'

import packageJSON from '../../package.json'
import theme from '../style/theme'
import useTheme from '../context/useTheme'
import { scaleOnHover } from '../style/animate'
import Icon from '../components/icon'

const style = {
  container: css`
    padding: 2em 0;
    background-color: ${theme.apply({ xelis: `rgb(14 30 32 / 40%)`, dark: `rgb(0 0 0 / 10%)`, light: `rgb(255 255 255 / 10%)` })};
    margin-top: 5em;

    a {
      text-decoration: none;
    }

    > div {
      display: grid;
      gap: 2em;
      grid-template-columns: 1fr;

      ${theme.query.minMobile} {
        grid-template-columns: 1fr 1fr;
      }

      ${theme.query.minDesktop} {
        grid-template-columns: 3fr 1fr 1fr 1fr;
      }

      > div {
        > :nth-child(1) {
          font-weight: bold;
          font-size: 1.2em;
          margin-bottom: 1em;
          border-bottom: 3px solid var(--table-th-bg-color);
          padding-bottom: .5em;
        }
      }

      > :nth-child(1) {
        flex: .7;

        > :nth-child(2) {
          color: var(--muted-color);
          display: flex;
          gap: .5em;
          flex-direction: column;
        }
      }

      > :nth-child(2) {
        > :nth-child(2) {
          display: grid;
          gap: .5em;
          grid-template-columns: 1fr 1fr;
        }
      }

      > :nth-child(3) {
        > :nth-child(2) {
          display: flex;
          gap: .5em;
          flex-wrap: wrap;
          flex-direction: row;
        }
      }

      > :nth-child(4) {
        > :nth-child(2) {
          display: flex;
          gap: .5em;
          flex-direction: column;

          > div {
            display: flex;
            gap: .5em;
            align-items: center;
          }
        }
      }
      
      button {
        font-weight: bold;
        border: none;
        padding: .5em .7em;
        cursor: pointer;
        color: var(--bg-color);
        background-color: var(--text-color);
        transition: .25s all;
        border-radius: 5px;
        text-align:left;
        ${scaleOnHover({ scale: .93 })}
      }
    }
  `
}

function Footer() {
  const { setTheme } = useTheme()

  return <div className={style.container}>
    <div className="layout-max-width">
      <div>
        <div>XELIS Explorer</div>
        <div>
          The explorer allows to track and verify transactions on the XELIS network.
          You can search for specific transactions and monitor the overall health of the network.
          <div>v{packageJSON.version}</div>
        </div>
      </div>
      <div>
        <div>PAGES</div>
        <div>
          <Link to="/blocks">Blocks</Link>
          <Link to="/mempool">Mempool</Link>
          <Link to="/dag">DAG</Link>
          <Link to="/accounts">Accounts</Link>
          <Link to="/peers">Peers</Link>
          <Link to="/settings">Settings</Link>
        </div>
      </div>
      <div>
        <div>THEME</div>
        <div>
          <button onClick={() => setTheme('xelis')}>Default</button>
          <button onClick={() => setTheme('dark')}>Dark</button>
          <button onClick={() => setTheme('light')}>Light</button>
        </div>
      </div>
      <div>
        <div>LINKS</div>
        <div>
          <div>
            <a href="https://xelis.io" target="_blank">Home</a>
            <Icon name="home" />
          </div>
          <div>
            <a href="https://stats.xelis.io" target="_blank">Statistics</a>
            <Icon name="chart-simple" />
          </div>
          <div>
            <a href="https://docs.xelis.io" target="_blank">Documentation</a>
            <Icon name="book" />
          </div>
          <div>
            <a href="https://github.com/xelis-project" target="_blank">GitHub</a>
            <Icon name="github" type="brands" />
          </div>
          <div>
            <a href="https://discord.gg/z543umPUdj" target="_blank">Discord</a>
            <Icon name="discord" type="brands" />
          </div>
        </div>
      </div>
    </div>
  </div>
}

export default Footer

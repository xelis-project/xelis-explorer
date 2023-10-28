import { css } from 'goober'
import { Link } from 'react-router-dom'
import Icon from 'g45-react/components/fontawesome_icon'
import { useLang } from 'g45-react/hooks/useLang'

import packageJSON from '../../package.json'
import theme from '../style/theme'
import useTheme from '../hooks/useTheme'
import { scaleOnHover } from '../style/animate'

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
  const { t } = useLang()

  return <div className={style.container}>
    <div className="layout-max-width">
      <div>
        <div>{t('XELIS Explorer')}</div>
        <div>
          {t(`The explorer allows to track and verify transactions on the XELIS network.
          You can search for specific transactions and monitor the overall health of the network.`)}
          <div>v{packageJSON.version}</div>
        </div>
      </div>
      <div>
        <div>{t('PAGES')}</div>
        <div>
          <Link to="/blocks">{t('Blocks')}</Link>
          <Link to="/mempool">{t('Mempool')}</Link>
          <Link to="/dag">{t('DAG')}</Link>
          <Link to="/accounts">{t('Accounts')}</Link>
          <Link to="/peers">{t('Peers')}</Link>
          <Link to="/settings">{t('Settings')}</Link>
        </div>
      </div>
      <div>
        <div>{t('THEME')}</div>
        <div>
          <button onClick={() => setTheme('xelis')}>{t('Default')}</button>
          <button onClick={() => setTheme('dark')}>{t('Dark')}</button>
          <button onClick={() => setTheme('light')}>{t('Light')}</button>
        </div>
      </div>
      <div>
        <div>{t('LINKS')}</div>
        <div>
          <div>
            <a href="https://xelis.io" target="_blank">{t('Home')}</a>
            <Icon name="home" />
          </div>
          <div>
            <a href="https://stats.xelis.io" target="_blank">{t('Statistics')}</a>
            <Icon name="chart-simple" />
          </div>
          <div>
            <a href="https://docs.xelis.io" target="_blank">{t('Documentation')}</a>
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

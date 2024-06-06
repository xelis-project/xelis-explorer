import { css } from 'goober'
import { Link } from 'react-router-dom'
import { useLang } from 'g45-react/hooks/useLang'

import theme from '../style/theme'
import useTheme from '../hooks/useTheme'
import { scaleOnHover } from '../style/animate'
import layoutStyle from '../style/layout'

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
          margin-bottom: .5em;
          position: relative;
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
        border-radius: .5em;
        text-align:left;
        ${scaleOnHover({ scale: .93 })}
      }
    }
  `
}

function Footer(props) {
  const { title, description, version, pages = [], links = [] } = props

  const { setTheme } = useTheme()
  const { t } = useLang()

  return <div className={style.container}>
    <div className={layoutStyle.maxWidth}>
      <div>
        <div>{title}</div>
        <div>
          {description}
          <div>{version}</div>
        </div>
      </div>
      <div>
        <div>{t('PAGES')}</div>
        <div>
          {pages.map((page) => {
            const { link, title } = page
            return <Link key={link} to={link}>{title}</Link>
          })}
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
          {links.map((link) => {
            const { href, title, icon } = link

            return <div key={href}>
              <a href={href} target="_blank">{title}</a>
              {icon}
            </div>
          })}
        </div>
      </div>
    </div>
  </div>
}

export default Footer

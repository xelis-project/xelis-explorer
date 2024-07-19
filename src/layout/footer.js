import { css } from 'goober'
import { Link } from 'react-router-dom'
import { useLang } from 'g45-react/hooks/useLang'
import Icon from 'g45-react/components/fontawesome_icon'

import theme from '../style/theme'
import useTheme from '../hooks/useTheme'
import layoutStyle from '../style/layout'
import { logoBgUrl } from './header'

const opacity = theme.apply({
  xelis: `.6`,
  light: `.8`,
  dark: `.6`,
})

const style = {
  container: css`
    padding: 2em 0;
    background-color: var(--content-bg-color);
    margin-top: 5em;

    ${theme.query.minDesktop} {
      padding: 5em 0;
    }
  `,
  content: css`
    display: flex;
    gap: 2em;
    flex-direction: column;
    
    ${theme.query.minDesktop} {
      flex-direction: row;
      gap: 5em;
      flex-wrap: wrap;
    }

    @media only screen and (min-width: 1100px) {
      flex-wrap: nowrap;
    }
  `,
  title: css`
    font-weight: bold;
    font-size: 1.5em;
    margin-bottom: .75em;
    position: relative;
    display: flex;
    gap: .5em;
    align-items: center;
  `,
  logo: css`
    width: 30px;
    height: 30px;
    display: block;
    background-size: contain;
    background-repeat: no-repeat;
    background-image: ${logoBgUrl};
  `,
  description: css`
    margin-bottom: .5em;
    opacity: ${opacity};
  `,
  version: css`
    border: 2px solid var(--text-color);
    display: inline-flex;
    padding: .5em 1em;
    border-radius: .5em;
    margin-top: 1em;
    font-weight: bold;
    opacity: ${opacity};
  `,
  buttons: css`
    display: flex;
    gap: .6em;
    flex-direction: column;
    
    button {
      border: 2px solid transparent;
      padding: .7em;
      cursor: pointer;
      color: var(--text-color);
      background-color: ${theme.apply({ xelis: `rgb(241 241 241 / 6%)`, dark: `rgb(241 241 241 / 6%)`, light: `rgb(8 8 8 / 6%)` })};
      border-radius: .5em;
      text-align: left;
      min-width: 130px;
      transition: all .25s;
      display: flex;
      gap: .5em;
      align-items: center;
      justify-content: space-between;
      font-size: inherit;
      opacity: ${opacity};

      &:hover {
        opacity: 1 !important;
      }

      &[data-active="true"] {
        border: 2px solid var(--text-color);
        opacity: .8;
      }

      ${theme.query.minDesktop} {
        padding: .4em .8em;
      }
    }
  `,
  pages: css`
    display: flex;
    gap: .5em;
    flex-direction: column;
    
    ${theme.query.minDesktop} {
      display: grid;
      grid-template-columns: auto auto;
      column-gap: 2em;
      row-gap: .5em;
    }
  `,
  links: css`
    display: flex;
    gap: .5em;
    flex-direction: column;
  `,
  hyperlinks: css`
    a {
      color: var(--text-color);
      transition: all .25s;
      opacity: ${opacity};
      padding: .75em;
      border-radius: .5em;
      text-decoration: none;
      display: flex;
      justify-content: space-between;
      align-items: center;
      background-color: ${theme.apply({ xelis: `rgb(241 241 241 / 6%)`, dark: `rgb(241 241 241 / 6%)`, light: `rgb(8 8 8 / 6%)` })};

      &:hover {
        opacity: 1;
      }

      ${theme.query.minDesktop} {
        background: none;
        gap: .5em;
        padding: 0;
        justify-content: start;
        white-space: nowrap;
      }
    }
  `
}

function Footer(props) {
  const { title, description, version, pages = [], links = [] } = props

  const { setTheme, theme: currentTheme } = useTheme()
  const { t } = useLang()

  return <div className={style.container}>
    <div className={layoutStyle.pageMaxWidth}>
      <div className={style.content}>
        <div>
          <div className={style.title}>
            <div className={style.logo}></div>
            {title}
          </div>
          <div>
            <div className={style.description}>{description}</div>
            <div className={style.version}>{version}</div>
          </div>
        </div>
        <div>
          <div className={style.title}>{t('PAGES')}</div>
          <div className={`${style.pages} ${style.hyperlinks}`}>
            {pages.map((page) => {
              const { path, title, icon } = page
              return <Link key={path} to={path}>
                <div>{title}</div>
                <div>{icon}</div>
              </Link>
            })}
          </div>
        </div>
        <div>
          <div className={style.title}>{t('THEME')}</div>
          <div className={style.buttons}>
            <button onClick={() => setTheme('xelis')} data-active={currentTheme === `xelis`}>
              {t('Default')}<Icon name="palette" />
            </button>
            <button onClick={() => setTheme('dark')} data-active={currentTheme === `dark`}>
              {t('Dark')}<Icon name="moon" />
            </button>
            <button onClick={() => setTheme('light')} data-active={currentTheme === `light`}>
              {t('Light')}<Icon name="sun" />
            </button>
          </div>
        </div>
        <div>
          <div className={style.title}>{t('LINKS')}</div>
          <div className={`${style.links} ${style.hyperlinks}`}>
            {links.map((link) => {
              const { href, title, icon } = link

              return <a key={href} href={href} target="_blank">
                <div>{title}</div>
                <div>{icon}</div>
              </a>
            })}
          </div>
        </div>
      </div>
    </div>
  </div>
}

export default Footer

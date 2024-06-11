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
  `,
  content: css`
    display: flex;
    gap: 2em;
    flex-direction: column;
    
    ${theme.query.minDesktop} {
      flex-direction: row;
    }
  `,
  sectionTitle: css`
    font-weight: bold;
    font-size: 1.2em;
    margin-bottom: 1em;
    position: relative;
  `,
  description: css`
    margin-bottom: .5em;
  `,
  version: css`
    color: var(--muted-color);
  `,
  buttons: css`
    display: flex;
    gap: .5em;
    flex-direction: column;
    
    button {
      font-weight: bold;
      border: none;
      padding: .7em;
      cursor: pointer;
      color: var(--bg-color);
      background-color: var(--text-color);
      transition: .1s transform;
      border-radius: .5em;
      font-size: .9em;
      text-align: left;
      min-width: 120px;
      ${scaleOnHover()};

      ${theme.query.minDesktop} {
        padding: .45em .6em;
      }
    }
  `,
  pages: css`
    display: flex;
    gap: .5em;
    flex-direction: column;
    
    ${theme.query.minDesktop} {
      display: grid;
      grid-template-columns: 1fr 1fr;
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
      i {
        color: var(--text-color);
      }

      ${theme.query.maxDesktop} {
        background: #00000073;
        padding: .75em;
        border-radius: .5em;
        font-size: 1.1em;
        text-decoration: none;
        color: white;
        display: flex;
        justify-content: space-between;
        opacity: .6;

        &:hover {
          opacity: 1;
        }
      }

      ${theme.query.minDesktop} {
        text-decoration: none;
        display: flex;
        gap: .5em;
        justify-content: start;
        white-space: nowrap;
      }
    }
  `
}

function Footer(props) {
  const { title, description, version, pages = [], links = [] } = props

  const { setTheme } = useTheme()
  const { t } = useLang()

  return <div className={style.container}>
    <div className={`${style.content} ${layoutStyle.pageMaxWidth}`}>
      <div>
        <div className={style.sectionTitle}>{title}</div>
        <div>
          <div className={style.description}>{description}</div>
          <div className={style.version}>{version}</div>
        </div>
      </div>
      <div>
        <div className={style.sectionTitle}>{t('PAGES')}</div>
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
        <div className={style.sectionTitle}>{t('THEME')}</div>
        <div className={style.buttons}>
          <button onClick={() => setTheme('xelis')}>{t('Default')}</button>
          <button onClick={() => setTheme('dark')}>{t('Dark')}</button>
          <button onClick={() => setTheme('light')}>{t('Light')}</button>
        </div>
      </div>
      <div>
        <div className={style.sectionTitle}>{t('LINKS')}</div>
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
}

export default Footer

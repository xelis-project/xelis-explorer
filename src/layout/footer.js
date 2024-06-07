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

const style2 = {
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
        ${scaleOnHover({ scale: .93 })};
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

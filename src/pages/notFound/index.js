import { css } from 'goober'
import { Helmet } from 'react-helmet-async'
import useServer from 'g45-react/hooks/useServer'
import { useLang } from 'g45-react/hooks/useLang'

import Button from '../../components/button'
import { scaleOnHover } from '../../style/animate'

const style = {
  container: css`
    margin: 5em auto;
    display: flex;
    flex-direction: column;
    max-width: 250px;
    align-items: center;
    text-align: center;

    h1 {
      font-size: 7em;
      
      &::after {
        content: '';
        height: .025em;
        width: 100%;
        border-radius: .5em;
        background-color: var(--text-color);
        display: block;
      }
    }

    h2 {
      font-size: 1.7em;
      margin-top: .5em;
    }

    p {
      margin: 1em 0 2em 0;
      color: var(--muted-color);
    }

    a {
      border-radius: 1em;
      background-color: var(--text-color);
      color: var(--bg-color);
      padding: .6em 1em;
      display: flex;
      align-items: center;
      gap: .5em;
      border: none;
      cursor: pointer;
      text-decoration: none;
      ${scaleOnHover}
    }
  `
}

function NotFound() {
  const server = useServer()
  const { t } = useLang()

  if (server) {
    server.statusCode = 404
  }

  return <div className={style.container}>
    <Helmet>
      <title>{t('404 | Page not found')}</title>
      <meta name="description" content={t('The page you are looking for does not exists or was deleted.')} />
    </Helmet>
    <h1>404</h1>
    <h2>{t('Page not found')}</h2>
    <p>{t('The page you are looking for does not exists or was deleted.')}</p>
    <Button link="/" icon="arrow-right" iconLocation="right">
      {t('Go to homepage')}
    </Button>
  </div>
}

export default NotFound

import { Helmet } from 'react-helmet-async'
import useServer from 'g45-react/hooks/useServer'
import { useLang } from 'g45-react/hooks/useLang'

import Button from '../../components/button'

import style from './style'

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
    <h1 className={style.title}>404</h1>
    <h2 className={style.subtitle}>{t('Page not found')}</h2>
    <p className={style.description}>{t('The page you are looking for does not exists or was deleted.')}</p>
    <Button link="/" icon="arrow-right" iconLocation="right" className={style.goHome}>
      {t('Go to homepage')}
    </Button>
  </div>
}

export default NotFound

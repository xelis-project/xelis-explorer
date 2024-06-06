import { css } from 'goober'
import { Helmet } from 'react-helmet-async'

const style = {
  title: css`
    margin: 1em 0 .5em 0;
    font-weight: bold;
    font-size: 2em;
  `,
  subtitle: css`
    color: var(--muted-color);
    font-size: .5em;
    margin-top: .2em;
    font-weight: normal;
  `
}

function PageTitle(props) {
  const { title, subtitle, metaTitle, metaDescription } = props

  return <div>
    <Helmet>
      <title>{metaTitle ? metaTitle : title}</title>
      <meta name="description" content={metaDescription} />
    </Helmet>
    <h1 className={style.title}>
      {title}
      {subtitle && <div className={style.subtitle}>{subtitle}</div>}
    </h1>
  </div>
}

export default PageTitle

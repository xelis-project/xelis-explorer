import { css } from 'goober'
import packageJSON from '../../../package.json'

const style = {
  container: css`
    margin: 1em 0 3em 0;
    color: var(--muted-color);
  `
}

function Footer() {
  return <div className={style.container}>
    Xelis Explorer v{packageJSON.version} by g45t345rt | {ENV}
  </div>
}

export default Footer

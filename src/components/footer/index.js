import packageJSON from '../../../package.json'

import './footer.css'

function Footer() {
  return <div className="footer">
    v{packageJSON.version} - Official Xelis Explorer by g45t345rt
  </div>
}

export default Footer

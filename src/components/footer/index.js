import packageJSON from '../../../package.json'

function Footer() {
  return <div className="footer">
    v{packageJSON.version} - Xelis Explorer by g45t345rt
  </div>
}

export default Footer

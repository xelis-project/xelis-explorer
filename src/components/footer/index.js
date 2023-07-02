import packageJSON from '../../../package.json'

function Footer() {
  return <div className="footer">
    XELIS Explorer v{packageJSON.version} by g45t345rt
  </div>
}

export default Footer

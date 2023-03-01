import packageJSON from '../../../package.json'

function Footer() {
  return <div className="footer">
    Xelis Explorer v{packageJSON.version} by g45t345rt
  </div>
}

export default Footer

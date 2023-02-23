import packageJSON from '../../../package.json'

function EnvAlert() {
  if (ENV === `mainnet`) return null

  return <div className="env-alert">
    <span className="env-alert-badge">ENV</span>
    <span>{ENV} - v{packageJSON.version}</span>
  </div>
}

export default EnvAlert

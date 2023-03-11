import to from 'await-to-js'
import { useCallback, useEffect, useState } from 'react'
import packageJSON from '../../../package.json'
import useNodeSocket from '../../context/useNodeSocket'
import DotLoading from '../dotLoading'

export function NodeConnection() {
  const [info, setInfo] = useState({})
  const { connected, loading, err, sendMethod } = useNodeSocket()

  const load = useCallback(async () => {
    if (connected) {
      const [err, info] = await to(sendMethod(`get_info`))
      if (err) return console.log(err)
      setInfo(info)
    }
  }, [sendMethod, connected])

  useEffect(() => {
    load()
  }, [load])

  return <div className="node-connection">
    {loading && <>
      <div className="node-connection-status loading" />
      <div>Connecting to remote node<DotLoading /></div>
    </>}
    {connected && <>
      <div className="node-connection-status alive" />
      <div>Connected to remote node (version: {info.version} | network: {info.network})</div>
    </>}
    {err && <>
      <div className="node-connection-status error" />
      <div>Remote node connection: {err.message}</div>
    </>}
    {!loading && !connected && !err && <>
      <div className="node-connection-status error" />
      <div>Disconnected from remote node</div>
    </>}
  </div>
}

function EnvAlert() {
  if (ENV === `mainnet`) return null
  const isMainnet = ENV === `mainnet`

  return <div className="env-alert">
    {!isMainnet && <span>{ENV} - explorer v{packageJSON.version} |</span>}
    <NodeConnection />
  </div>
}

export default EnvAlert

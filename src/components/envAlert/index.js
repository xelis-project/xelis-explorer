import to from 'await-to-js'
import { useCallback, useEffect, useState } from 'react'
import packageJSON from '../../../package.json'
import useNodeSocket from '../../context/useNodeSocket'
import DotLoading from '../dotLoading'

export function NodeConnection() {
  const [info, setInfo] = useState({})
  const nodeSocket = useNodeSocket()
  const [err, setErr] = useState()
  const [loadingInfo, setLoadingInfo] = useState(false)

  const load = useCallback(async () => {
    if (!nodeSocket.connected) return

    setLoadingInfo(true)
    const [err, info] = await to(nodeSocket.sendMethod(`get_info`))
    setLoadingInfo(false)
    if (err) return setErr(err)
    setInfo(info)
  }, [nodeSocket.connected])

  useEffect(() => {
    load()
  }, [load])

  return <div className="node-connection">
    {(nodeSocket.loading || loadingInfo) && <>
      <div className="node-connection-status loading" />
      <div>Connecting to remote node<DotLoading /></div>
    </>}
    {nodeSocket.connected && !loadingInfo && <>
      <div className="node-connection-status alive" />
      <div>Connected to remote node (version: {info.version} | network: {info.network})</div>
    </>}
    {err && <>
      <div className="node-connection-status error" />
      <div>Remote node connection: {err.message}</div>
    </>}
    {!nodeSocket.loading && !nodeSocket.connected && !err && <>
      <div className="node-connection-status error" />
      <div>Can't connect to remote node.</div>
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

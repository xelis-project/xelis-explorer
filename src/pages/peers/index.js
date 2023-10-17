import { useEffect, useCallback, useState } from 'react'
import useNodeSocket from '@xelis/sdk/react/daemon'
import to from 'await-to-js'
import TableFlex from '../../components/tableFlex'
import { Helmet } from 'react-helmet-async'
import { css } from 'goober'
import { reduceText } from '../../utils'

const style = {
  container: css`
    h1 {
      margin: 1.5em 0 .5em 0;
      font-weight: bold;
      font-size: 2em;

      div {
        color: var(--muted-color);
        font-size: .5em;
        margin-top: .2em;
        font-weight: normal;
      }
    }
  `
}

const getIP = (peer) => {
  const addr = (peer.addr || '').split(':') // TODO ipv4 only need to support ipv6
  return addr[0]
}

function Peers() {
  const nodeSocket = useNodeSocket()
  const [loading, setLoading] = useState(true)
  const [peers, setPeers] = useState([])
  const [geoLocation, setGeoLocation] = useState({})
  const [err, setErr] = useState()

  const loadPeers = useCallback(async () => {
    if (nodeSocket.readyState !== WebSocket.OPEN) return

    const resErr = (err) => {
      setLoading(false)
      setErr(err)
    }

    const [err, result] = await to(nodeSocket.daemon.getPeers())
    if (err) return resErr(err)

    setPeers(result)
    setLoading(false)
  }, [nodeSocket])

  const loadGeoLocation = useCallback(async () => {
    if (peers.length === 0) return

    const ips = peers.map((peer) => getIP(peer))
    const query = `?ips=${ips.join(`,`)}`

    const [err, res] = await to(fetch(`https://geoip.xelis.io${query}`))
    if (err) return console.log(err)

    const data = await res.json()
    setGeoLocation(data)
  }, [peers])

  useEffect(() => {
    loadPeers()
  }, [loadPeers])

  useEffect(() => {
    loadGeoLocation()
  }, [loadGeoLocation])

  return <div className={style.container}>
    <Helmet>
      <title>Peers</title>
    </Helmet>
    <h1>
      Peers
      <div>{peers.length} beautiful peers</div>
    </h1>
    <TableFlex loading={loading} err={err} data={peers} emptyText="No peers"
      rowKey="id"
      headers={[
        {
          key: 'addr',
          title: 'Address',
          render: (value) => {
            return value
          }
        },
        {
          key: 'location',
          title: 'Location',
          render: (_, item) => {
            const ip = getIP(item)
            const data = geoLocation[ip]
            if (data && data.country && data.region) {
              return `${data.country} / ${data.region}`
            }
            return `--`
          }
        },
        {
          key: 'tag',
          title: 'Tag',
          render: (value) => {
            if (value) return reduceText(value, 20, 0)
            return `--`
          }
        },
        {
          key: 'topoheight',
          title: 'Topoheight',
          render: (value) => {
            return value
          }
        },
        {
          key: 'pruned_topoheight',
          title: 'Pruned Topoheight',
          render: (value) => {
            return value || `--`
          }
        },
        {
          key: 'version',
          title: 'Version',
          render: (value) => {
            return value
          }
        },
      ]}
    />
  </div>
}

export default Peers
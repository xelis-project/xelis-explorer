import { useEffect, useCallback, useState } from 'react'
import useNodeSocket from '@xelis/sdk/react/daemon'
import to from 'await-to-js'
import { Helmet } from 'react-helmet-async'
import { css } from 'goober'
import 'leaflet/dist/leaflet.css'

import TableFlex from '../../components/tableFlex'
import { parseAddressWithPort, reduceText } from '../../utils'
import DotLoading from '../../components/dotLoading'

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
  `,
  map: css`
    margin-bottom: 2em;

    .leaflet-container {
      width: 100%; 
      height: 40em; 
      outline: none;
      background-color: var(--bg-color);
    }
  `
}

function Peers() {
  const nodeSocket = useNodeSocket()
  const [loading, setLoading] = useState(true)
  const [peers, setPeers] = useState([])
  const [geoLoading, setGeoLoading] = useState(true)
  const [geoLocation, setGeoLocation] = useState({})
  const [err, setErr] = useState()

  const loadPeers = useCallback(async () => {
    if (nodeSocket.readyState !== WebSocket.OPEN) return
    setLoading(true)

    const resErr = (err) => {
      setLoading(false)
      setErr(err)
    }

    const [err, result] = await to(nodeSocket.daemon.getPeers())
    if (err) return resErr(err)

    setPeers(result.map((peer) => {
      const addr = parseAddressWithPort(peer.addr)
      if (addr) peer.ip = addr.ip
      return peer
    }))
    setLoading(false)
  }, [nodeSocket])

  const loadGeoLocation = useCallback(async () => {
    if (peers.length === 0) return
    setGeoLoading(true)

    const ips = peers.map((peer) => peer.ip)
    const query = `?ips=${ips.join(`,`)}`

    const [err, res] = await to(fetch(`https://geoip.xelis.io${query}`))
    if (err) {
      setGeoLoading(false)
      console.log(err)
    }

    const data = await res.json()
    setGeoLocation(data)
    setGeoLoading(false)
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
    <Map peers={peers} geoLocation={geoLocation} />
    <Table loading={loading} err={err} peers={peers} geoLocation={geoLocation} geoLoading={geoLoading} />
  </div>
}

export default Peers

function Table(props) {
  const { loading, err, peers, geoLocation, geoLoading } = props

  return <TableFlex loading={loading} err={err} data={peers} emptyText="No peers"
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
          const data = geoLocation[item.ip]
          if (data && data.country && data.region) {
            return `${data.country} / ${data.region}`
          }

          if (geoLoading) {
            return <DotLoading />
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
}

function Map(props) {
  const { peers, geoLocation } = props

  const [leaflet, setLeaflet] = useState()
  const [map, setMap] = useState()

  useEffect(() => {
    const load = async () => {
      // load here (client side only) to avoid ssr loading leaflet
      const react = await import('react-leaflet')
      // const { Simple }  = await import('leaflet/src/geo/crs/CRS.Simple')
      setLeaflet({ react })
    }

    load()
  }, [])

  useEffect(() => {
    if (!leaflet) return

    const { MapContainer, TileLayer, CircleMarker, Popup } = leaflet.react

    // other providers https://leaflet-extras.github.io/leaflet-providers/preview/
    const map = <MapContainer minZoom={2} zoom={2} preferCanvas center={[0, 0]}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      />
      {peers.map((peer) => {
        const { ip } = peer
        const location = geoLocation[ip]
        if (!location) return null

        const { latitude, longitude } = location
        return <CircleMarker key={ip} radius={10} center={[latitude, longitude]}
          color="green"
        >
          <Popup>
            <div>{peer.addr}</div>
            <div>{location.country} / {location.region}</div>
          </Popup>
        </CircleMarker>
      })}
    </MapContainer>

    setMap(map)
  }, [leaflet, peers, geoLocation])

  return <div className={style.map}>
    {map}
  </div>
}
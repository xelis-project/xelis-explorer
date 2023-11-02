import { useEffect, useCallback, useState } from 'react'
import useNodeSocket, { useNodeSocketSubscribe } from '@xelis/sdk/react/daemon'
import { RPCEvent } from '@xelis/sdk/daemon/types'
import to from 'await-to-js'
import { css } from 'goober'
import 'leaflet/dist/leaflet.css'
import { useLang } from 'g45-react/hooks/useLang'
import Age from 'g45-react/components/age'

import TableFlex from '../../components/tableFlex'
import { fetchGeoLocation, parseAddressWithPort, reduceText } from '../../utils'
import DotLoading from '../../components/dotLoading'
import useTheme from '../../hooks/useTheme'
import Switch from '../../components/switch'
import { useRef } from 'react'
import PageTitle from '../../layout/page_title'
import FlagIcon from '../../components/flagIcon'

const style = {
  container: css`
    .fly-to-button {
      background: var(--text-color);
      color: var(--bg-color);
      border: none;
      border-radius: 15px;
      padding: 0.3em 0.6em;
      font-weight: bold;
      cursor: pointer;
      margin-left: 1em;
    }
  `,
  map: css`
    position: relative;
    margin-bottom: 2em;

    .leaflet-container {
      width: 100%; 
      height: 40em; 
      outline: none;
      background-color: var(--bg-color);
      border-radius: .5em;
    }

    .leaflet-popup-content {
      > :nth-child(1) {
        font-weight: bold;
        padding-bottom: .5em;
      }

      > :nth-child(2), > :nth-child(3) {
        font-size: .9em;
      }
    }
  `,
  mapControls: css`
    position: absolute;
    right: 0;
    z-index: 99999;
    padding: 1em;
    display: flex;
    gap: .5em;
    flex-direction: column;

    > div {
      display: flex;
      gap: 0.5em;
      align-items: center;
      font-weight: bold;
      font-size: .9em;
      justify-content: right;
    }

    button {
      background: var(--text-color);
      color: var(--bg-color);
      border: none;
      border-radius: 15px;
      padding: 0.3em 0.6em;
      font-weight: bold;
      cursor: pointer;
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
  const { t } = useLang()

  const loadPeers = useCallback(async () => {
    if (nodeSocket.readyState !== WebSocket.OPEN) return
    setLoading(true)
    setErr(null)

    const resErr = (err) => {
      setLoading(false)
      setErr(err)
    }

    const [err, result] = await to(nodeSocket.daemon.getPeers())
    if (err) return resErr(err)

    const peers = result.map((peer) => {
      const addr = parseAddressWithPort(peer.addr)
      if (addr) peer.ip = addr.ip
      return peer
    })

    setPeers(peers)
    setLoading(false)

    // max 50 ips per fetch
    setGeoLoading(true)
    const batch = 50
    let geoLocation = {}
    const ipList = peers.map((p) => p.ip)
    for (let i = 0; i < ipList.length; i += batch) {
      const ips = ipList.slice(i, batch)
      const [err, data] = await to(fetchGeoLocation(ips))
      if (err) console.log(err)
      geoLocation = { ...geoLocation, ...data }
    }

    setGeoLoading(false)
    setGeoLocation(geoLocation)
  }, [nodeSocket])

  useEffect(() => {
    loadPeers()
  }, [loadPeers])

  useNodeSocketSubscribe({
    event: RPCEvent.PeerConnected,
    onData: async (_, peer) => {
      const addr = parseAddressWithPort(peer.addr)
      const [err, data] = await to(fetchGeoLocation([addr.ip]))
      if (err) console.log(err)

      peer.ip = addr.ip
      setGeoLocation((geo) => ({ ...geo, ...data }))
      setPeers((peers) => {
        const exists = peers.find((p) => p.addr === peer.addr)
        if (!exists) return [...peers, peer]
        return peers
      })
    }
  }, [])

  useNodeSocketSubscribe({
    event: RPCEvent.PeerStateUpdated,
    onData: async (_, peer) => {
      setPeers((peers) => {
        return peers.map(p => {
          if (p.id === peer.id) return { ...p, ...peer } // merge to keep ip variable
          return p
        })
      })
    }
  }, [])

  const mapRef = useRef()

  return <div className={style.container}>
    <PageTitle title={t('Peers')} subtitle={t('{} beautiful peers', [peers.length])}
      metaDescription={t('Map with list of network peers. Monitor connected peers, network status and geo location.')} />
    <Map mapRef={mapRef} peers={peers} geoLocation={geoLocation} />
    <Table loading={loading} err={err} peers={peers} geoLocation={geoLocation} geoLoading={geoLoading} mapRef={mapRef} />
  </div>
}

export default Peers

function Table(props) {
  const { loading, err, peers, geoLocation, geoLoading, mapRef } = props

  const { t } = useLang()

  return <TableFlex loading={loading} err={err} data={peers} emptyText={t('No peers')}
    rowKey="id"
    headers={[
      {
        key: 'addr',
        title: t('Address'),
        render: (value) => {
          return value
        }
      },
      {
        key: 'location',
        title: t('Location'),
        render: (_, item) => {
          const data = geoLocation[item.ip]
          if (data && data.country && data.region) {
            const code = (data.country_code || 'xx').toLowerCase()
            return <div>
              <FlagIcon code={code} />&nbsp;&nbsp;
              <span>{data.country} / {data.region}</span>
              <button className="fly-to-button" onClick={() => {
                const position = [data.latitude, data.longitude]
                mapRef.current.flyTo(position, 6)
              }}>Fly To</button>
            </div>
          }

          if (geoLoading) {
            return <DotLoading />
          }

          return `--`
        }
      },
      {
        key: 'peers',
        title: t('Peers'),
        render: (value) => {
          return (value || []).length
        }
      },
      {
        key: 'tag',
        title: t('Tag'),
        render: (value) => {
          if (value) return reduceText(value, 20, 0)
          return `--`
        }
      },
      {
        key: 'height',
        title: t('Height'),
        render: (value) => {
          return value
        }
      },
      {
        key: 'topoheight',
        title: t('Topo'),
        render: (value) => {
          return value
        }
      },
      {
        key: 'pruned_topoheight',
        title: t('Pruned Topo'),
        render: (value) => {
          return value || `--`
        }
      },
      {
        key: 'last_ping',
        title: t('Last Ping'),
        render: (value) => {
          return <Age timestamp={value * 1000} update />
        }
      },
      {
        key: 'version',
        title: t('Version'),
        render: (value) => {
          return value
        }
      },
    ]}
  />
}

function MapControls(props) {
  const { controls, setControls, mapRef } = props
  const { showConnections, showPeers } = controls

  const { t } = useLang()

  const setControlValue = useCallback((key, value) => {
    setControls((controls) => {
      return { ...controls, [key]: value }
    })
  }, [setControls])

  const reset = useCallback(() => {
    mapRef.current.setView([0, 0], 2)
  }, [])

  return <div className={style.mapControls}>
    <div>
      {t('Peers')}
      <Switch checked={showPeers} onChange={(checked) => setControlValue('showPeers', checked)} />
    </div>
    <div>
      {t('Connections')}
      <Switch checked={showConnections} onChange={(checked) => setControlValue('showConnections', checked)} />
    </div>
    <div>
      <button onClick={reset}>{t('Reset')}</button>
    </div>
  </div>
}

function Map(props) {
  const { mapRef, peers, geoLocation } = props

  const { theme } = useTheme()
  const [leaflet, setLeaflet] = useState()
  const [mapContainer, setMapContainer] = useState()
  const [controls, setControls] = useState({ showConnections: true, showPeers: true })

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

    const { MapContainer, TileLayer, CircleMarker, Popup, Polyline } = leaflet.react

    let tileLayerUrl = `https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png`
    if (theme === `light`) {
      tileLayerUrl = `https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png`
    }

    const connectionLines = {}
    const peerDots = {}
    peers.forEach((peer) => {
      const peerLocation = geoLocation[peer.ip]
      if (!peerLocation) return

      const dotPosition = [peerLocation.latitude, peerLocation.longitude]
      const dotKey = (peerLocation.latitude + peerLocation.longitude).toFixed(4)

      if (peerDots[dotKey]) {
        // another peer with the same location
        peerDots[dotKey].peers.push(peer)
      } else {
        peerDots[dotKey] = { peers: [peer], location: peerLocation, position: dotPosition }
      }

      // handle sub peers
      peer.peers.forEach((pAddr) => {
        const addr = parseAddressWithPort(pAddr)
        const subPeerLocation = geoLocation[addr.ip]
        if (!subPeerLocation) return
        const linePositions = [[peerLocation.latitude, peerLocation.longitude], [subPeerLocation.latitude, subPeerLocation.longitude]]
        const lineKey = (peerLocation.latitude + peerLocation.longitude + subPeerLocation.latitude + subPeerLocation.longitude).toFixed(4)

        // keep only one line and overwrite if key exists
        connectionLines[lineKey] = linePositions
      })
    })

    // other providers https://leaflet-extras.github.io/leaflet-providers/preview/
    const mapContainer = <MapContainer minZoom={2} zoom={2} preferCanvas center={[0, 0]} ref={mapRef}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        url={tileLayerUrl}
      />
      <>
        {controls.showPeers && <>
          {Object.keys(peerDots).map((key) => {
            const { peers, position, location } = peerDots[key]
            return <CircleMarker key={key} radius={6} pathOptions={{ opacity: 1, weight: 3 }} center={position} color="green">
              <Popup>
                <div>{location.country} / {location.region}</div>
                {peers.map((peer) => {
                  return <div key={peer.addr}>{peer.addr} {peer.tag ? `(${peer.tag})` : ``}</div>
                })}
              </Popup>
            </CircleMarker>
          })}
        </>}
        {controls.showConnections && <>
          {Object.keys(connectionLines).map((key) => {
            const positions = connectionLines[key]
            return <Polyline key={key} pathOptions={{ color: `green`, opacity: 0.5, weight: 2, dashArray: `0 6 0` }} positions={positions} />
          })}
        </>}
      </>
    </MapContainer>

    setMapContainer(mapContainer)
  }, [leaflet, peers, geoLocation, theme, controls])

  return <div className={style.map}>
    {mapContainer && <MapControls controls={controls} setControls={setControls} mapRef={mapRef} />}
    {mapContainer}
  </div>
}
import { useEffect, useCallback, useState, useRef } from 'react'
import useNodeSocket, { useNodeSocketSubscribe } from '@xelis/sdk/react/daemon'
import { RPCEvent } from '@xelis/sdk/daemon/types'
import to from 'await-to-js'
import { css } from 'goober'
import 'leaflet/dist/leaflet.css'
import { useLang } from 'g45-react/hooks/useLang'
import Age from 'g45-react/components/age'
import Icon from 'g45-react/components/fontawesome_icon'
import TWEEN from '@tweenjs/tween.js'

import TableFlex from '../../components/tableFlex'
import { fetchGeoLocation, parseAddressWithPort, reduceText } from '../../utils'
import DotLoading from '../../components/dotLoading'
import useTheme from '../../hooks/useTheme'
import Switch from '../../components/switch'
import PageTitle from '../../layout/page_title'
import FlagIcon from '../../components/flagIcon'
import { scaleOnHover } from '../../style/animate'
import theme from '../../style/theme'

const style = {
  container: css`
    > :nth-child(2) {
      background: var(--table-td-bg-color);
      padding: 1em;
      border-radius: 0.5em;
      border-bottom-left-radius: 0;
      border-bottom-right-radius: 0;
      font-size: .9em;
      display: flex;
      gap: .5em;
    }

    > :nth-child(3) {
      display: flex;
      flex-direction: column;
      gap: 1em;
  
      h2 {
        font-size: 1.2em;
        font-weight: bold;
      }
    }
  `,
  tableRowLocation: css`
    display: flex;
    gap: .5em;
    align-items: center;

    ${theme.query.maxMobile} {
      flex-wrap: wrap;
    }

    button {
      background: var(--text-color);
      color: var(--bg-color);
      border: none;
      border-radius: 15px;
      padding: 0.3em 0.6em;
      font-weight: bold;
      cursor: pointer;
      ${scaleOnHover()}
    }
  `,
  map: css`
    position: relative;
    z-index: 0;
    width: 100%; 
    height: 15em;
    background-color: var(--bg-color);
    border-radius: .5em;
    border-top-left-radius: 0;
    border-top-right-radius: 0;
    
    ${theme.query.minDesktop} {
      height: 30em;
    }

    .leaflet-container {
      outline: none;
      width: 100%; 
      height: 100%;
      background-color: var(--bg-color);
      border-radius: .5em;
      border-top-left-radius: 0;
      border-top-right-radius: 0;
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
  `,
  mapLoad: css`
    position: absolute;
    display: flex;
    width: 100%;
    justify-content: center;
    align-items: center;
    height: 100%;
    top: 0;
    z-index: 999;

    > div {
      background-color: black;
      padding: .5em;
      border-radius: .5em;
      display: flex;
      gap: .25em;

      > div {
        width: .5em;
        height: 1.5em;
        background-color: white;
        border-radius: .5em;
        animation-name: scale;
        animation-duration: .75s;
        animation-iteration-count: infinite;
      }

      > :nth-child(1) {
        animation-delay: 0;
      }

      > :nth-child(2) {
        animation-delay: .25s;
      }

      > :nth-child(3) {
        animation-delay: .5s;
      }

      @keyframes scale {
        0% {
          transform: scaleY(1);
        }
        20% {
          transform: scaleY(.8);
        }
        40% {
          transform: scaleY(1);
        }
      }
    }
  `
}

function Peers() {
  const nodeSocket = useNodeSocket()
  const [peersLoading, setPeersLoading] = useState(true)
  const [peers, setPeers] = useState([])
  const [geoLoading, setGeoLoading] = useState(true)
  const [geoLocation, setGeoLocation] = useState({})
  const [err, setErr] = useState()
  const { t } = useLang()

  const loadPeers = useCallback(async () => {
    if (nodeSocket.readyState !== WebSocket.OPEN) return
    setPeersLoading(true)
    setErr(null)

    const resErr = (err) => {
      setPeersLoading(false)
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
    setPeersLoading(false)

    // max 50 ips per fetch
    setGeoLoading(true)
    const batch = 50
    let geoLocation = {}

    const ipList = []
    for (let i in peers) {
      const peer = peers[i]
      ipList.push(peer.ip)

      for (let addr in peer.peers) {
        const { ip } = parseAddressWithPort(addr)
        if (ipList.indexOf(ip) === -1) ipList.push(ip)
      }
    }

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
    event: RPCEvent.PeerDisconnected,
    onData: async (_, peer) => {
      setPeers((peers) => {
        return peers.filter(p => p.id !== peer.id)
      })
    }
  }, [])

  useNodeSocketSubscribe({
    event: RPCEvent.PeerStateUpdated,
    onData: async (_, peer) => {
      setPeers((peers) => {
        return peers.map(p => {
          if (p.id === peer.id) {
            return { ...p, ...peer } // merge to keep ip variable
          }

          return p
        })
      })
    }
  }, [])

  useEffect(() => {
    // make sure tween package is updated on request animation
    let animationFrameId
    const animate = () => {
      requestAnimationFrame(animate)
      TWEEN.update()
    }
    requestAnimationFrame(animate)

    return () => {
      cancelAnimationFrame(animationFrameId)
    }
  }, [])

  const mapRef = useRef()

  return <div className={style.container}>
    <PageTitle title={t('Peers')} subtitle={t('{} beautiful peers', [peers.length])}
      metaDescription={t('Map with list of network peers. Monitor connected peers, network status and geo location.')} />
    <div>
      <Icon name="warning" />{t(`This map does not represent the entire XELIS network.`)}
    </div>
    <div>
      <MapPeers mapRef={mapRef} peers={peers} geoLocation={geoLocation} peersLoading={peersLoading} geoLoading={geoLoading} />
      <h2>{t(`Connected Node`)}</h2>
      <ConnectedNodeTable />
      <h2>{t(`Peer List`)}</h2>
      <TablePeers peersLoading={peersLoading} err={err} peers={peers} geoLocation={geoLocation} geoLoading={geoLoading} mapRef={mapRef} />
    </div>
  </div>
}

export default Peers

function TablePeers(props) {
  const { peersLoading, err, peers, geoLocation, geoLoading, mapRef } = props

  const { t } = useLang()

  const flyTo = useCallback((data) => {
    const position = [data.latitude, data.longitude]
    mapRef.current.flyTo(position, 6)
    document.body.scrollTop = 0
  }, [])

  return <div className={style.peerList}>
    <TableFlex keepTableDisplay loading={peersLoading} err={err} data={peers} emptyText={t('No peers')}
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
              return <div className={style.tableRowLocation}>
                <FlagIcon code={code} />
                <span>{data.country} / {data.region}</span>
                <button onClick={() => flyTo(data)}>Fly To</button>
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
            return Object.keys(value || {}).length
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
  </div>
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
    mapRef.current.setView([0, 0], 1)
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

function PeerDot(props) {
  const { peerDot, leaflet, visible } = props
  const { peers, position, location } = peerDot
  const { CircleMarker, Popup } = leaflet.react

  const [dotRadius, setDotRadius] = useState(6)

  useEffect(() => {
    new TWEEN.Tween({ x: 3 })
      .to({ x: 6 }, 1500)
      .easing(TWEEN.Easing.Elastic.Out)
      .onUpdate((v) => {
        setDotRadius(v.x)
      })
      .start()
  }, [peerDot.lastPing])

  return <CircleMarker radius={dotRadius} pathOptions={{
    opacity: visible ? 1 : 0, fillOpacity: visible ? .3 : 0,
    weight: 1, color: `green`
  }} center={position}>
    <Popup>
      <div>{location.country} / {location.region}</div>
      {peers.map((peer) => {
        const peerCount = Object.keys(peer.peers || {}).length
        return <div key={peer.addr}>{peer.addr} {`(${peerCount}P)`}</div>
      })}
    </Popup>
  </CircleMarker>
}

function PeerConnection(props) {
  const { positions, leaflet, visible } = props
  const { Polyline } = leaflet.react

  const [lineOpacity, setLineOpacity] = useState()

  useEffect(() => {
    new TWEEN.Tween({ x: 0 })
      .to({ x: .4 }, 2000)
      .easing(TWEEN.Easing.Linear.None)
      .onUpdate((v) => {
        setLineOpacity(v.x)
      })
      .yoyo(true)
      .repeat(Infinity)
      .start()
  }, [])

  const opacity = visible ? lineOpacity : 0

  return <Polyline pathOptions={{ color: `green`, opacity, weight: 2, dashArray: `0 4 0` }} positions={positions} />
}

function MapPeers(props) {
  const { mapRef, peers, geoLocation, peersLoading, geoLoading } = props

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

    const { MapContainer, TileLayer } = leaflet.react

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
        if (peer.last_ping < peerDots[dotKey].lastPing) {
          peerDots[dotKey].lastPing = peer.last_ping
        }

        peerDots[dotKey].peers.push(peer)
      } else {
        peerDots[dotKey] = { peers: [peer], location: peerLocation, position: dotPosition, lastPing: peer.last_ping }
      }

      // handle sub peers and create connection line if direction is Both
      for (const ip in peer.peers) {
        const direction = peer.peers[ip]
        if (direction !== `Both`) continue
        const addr = parseAddressWithPort(ip)
        const subPeerLocation = geoLocation[addr.ip]
        if (!subPeerLocation) continue
        const linePositions = [[peerLocation.latitude, peerLocation.longitude], [subPeerLocation.latitude, subPeerLocation.longitude]]
        const lineKey = (peerLocation.latitude + peerLocation.longitude + subPeerLocation.latitude + subPeerLocation.longitude).toFixed(4)

        // keep only one line and overwrite if key exists
        connectionLines[lineKey] = linePositions
      }
    })

    // other providers https://leaflet-extras.github.io/leaflet-providers/preview/
    const mapContainer = <MapContainer minZoom={1} zoom={1} preferCanvas center={[0, 0]} ref={mapRef}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        url={tileLayerUrl}
      />
      {Object.keys(peerDots).map((key) => {
        return <PeerDot key={key} peerDot={peerDots[key]} visible={controls.showPeers} leaflet={leaflet} />
      })}
      {Object.keys(connectionLines).map((key) => {
        const positions = connectionLines[key]
        return <PeerConnection key={key} positions={positions} visible={controls.showConnections} leaflet={leaflet} />
      })}
    </MapContainer>

    setMapContainer(mapContainer)
  }, [leaflet, peers, geoLocation, theme, controls])

  return <div className={style.map}>
    {mapContainer && <MapControls controls={controls} setControls={setControls} mapRef={mapRef} />}
    {mapContainer}
    <MapLoad peersLoading={peersLoading} geoLoading={geoLoading} />
  </div>
}

function MapLoad(props) {
  const { peersLoading, geoLoading } = props
  return (peersLoading || geoLoading) && <div className={style.mapLoad}>
    <div>
      <div />
      <div />
      <div />
    </div>
  </div>
}

function ConnectedNodeTable() {
  const nodeSocket = useNodeSocket()
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState()
  const [data, setData] = useState([])
  const { t } = useLang()

  const loadP2PStatus = useCallback(async ({ showLoading = true } = {}) => {
    if (nodeSocket.readyState !== WebSocket.OPEN) return

    setErr(null)
    if (showLoading) setLoading(true)

    const resErr = (err) => {
      setErr(err)
      setLoading(false)
    }

    const [err, res] = await to(nodeSocket.daemon.p2pStatus())
    if (err) return resErr(err)

    const [err2, res2] = await to(nodeSocket.daemon.getInfo())
    if (err2) return resErr(err)

    setLoading(false)
    setData([{ ...res, ...res2 }])
  }, [nodeSocket])

  useEffect(() => {
    loadP2PStatus()
  }, [loadP2PStatus])

  useNodeSocketSubscribe({
    event: RPCEvent.NewBlock,
    onData: () => loadP2PStatus({ showLoading: false })
  }, [loadP2PStatus])

  return <TableFlex keepTableDisplay loading={loading} err={err} data={data} emptyText={t('Not connected')}
    rowKey="peer_id"
    headers={[
      {
        key: 'peer_id',
        title: t('Peer ID'),
        render: (value) => {
          return value
        }
      },
      {
        key: 'peer_count',
        title: t('Peers'),
        render: (value, item) => {
          return `${value || 0} (${item.max_peers || 0} max)`
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
        key: 'network',
        title: t('Network'),
        render: (value) => {
          return value
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
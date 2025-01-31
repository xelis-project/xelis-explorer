import { useEffect, useCallback, useState, useRef, useMemo } from 'react'
import useNodeSocket, { useNodeSocketSubscribe } from '@xelis/sdk/react/daemon'
import { RPCEvent } from '@xelis/sdk/daemon/types'
import to from 'await-to-js'

import 'leaflet/dist/leaflet.css'
import { useLang } from 'g45-react/hooks/useLang'
import Age from 'g45-react/components/age'
import Icon from 'g45-react/components/fontawesome_icon'
import TWEEN from '@tweenjs/tween.js'

import Chart from '../../components/chart'
import TableFlex from '../../components/tableFlex'
import Table from '../../components/table'
import { fetchGeoLocation, groupBy, parseAddressWithPort, reduceText } from '../../utils'
import DotLoading from '../../components/dotLoading'
import useTheme from '../../hooks/useTheme'
import Switch from '../../components/switch'
import PageTitle from '../../layout/page_title'
import FlagIcon from '../../components/flagIcon'
import Dropdown from '../../components/dropdown'
import MapLoad from './mapLoad'
import style from './style'

function useNetworkData() {
  const nodeSocket = useNodeSocket()
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState()
  const [data, setData] = useState({})

  const loadP2PStatus = useCallback(async ({ showLoading = true } = {}) => {
    if (nodeSocket.readyState !== WebSocket.OPEN) return

    setErr(null)
    if (showLoading) setLoading(true)

    const resErr = (err) => {
      setErr(err)
      setLoading(false)
    }

    const [err, status] = await to(nodeSocket.daemon.methods.p2pStatus())
    if (err) return resErr(err)

    const [err2, info] = await to(nodeSocket.daemon.methods.getInfo())
    if (err2) return resErr(err)

    setLoading(false)
    setData({ ...status, ...info })
  }, [nodeSocket.readyState])

  useEffect(() => {
    loadP2PStatus()
  }, [loadP2PStatus])

  useNodeSocketSubscribe({
    event: RPCEvent.NewBlock,
    onData: () => loadP2PStatus({ showLoading: false })
  }, [loadP2PStatus])

  return { data, loading, err }
}

function Peers() {
  const nodeSocket = useNodeSocket()
  const [peersLoading, setPeersLoading] = useState(true)
  const peersStateRef = useRef({})
  const [peers, setPeers] = useState([])
  const [geoLoading, setGeoLoading] = useState(true)
  const [geoLocation, setGeoLocation] = useState({})
  const [err, setErr] = useState()
  const { t } = useLang()
  const networkData = useNetworkData()

  const loadPeers = useCallback(async () => {
    if (nodeSocket.readyState !== WebSocket.OPEN) return
    setPeersLoading(true)
    setErr(null)

    const resErr = (err) => {
      setPeersLoading(false)
      setErr(err)
    }

    const [err, result] = await to(nodeSocket.daemon.methods.getPeers())
    if (err) return resErr(err)

    const peers = result.peers.map((peer) => {
      const addr = parseAddressWithPort(peer.addr)
      if (addr) peer.ip = addr.ip
      return peer
    })

    setPeers(peers)
    setPeersLoading(false)

    // max 25 ips per fetch
    setGeoLoading(true)
    const batch = 25
    let geoLocation = {}

    const ipList = peers.map((peer) => {
      return peer.ip
    })

    let fetches = Math.ceil(ipList.length / batch)

    const fetchIps = async (ips) => {
      const [err, data] = await to(fetchGeoLocation(ips))
      fetches--
      if (fetches <= 0) setGeoLoading(false)
      if (err) console.log(err)

      geoLocation = { ...geoLocation, ...data }
      setGeoLocation(geoLocation)
    }

    for (let i = 0; i < ipList.length; i += batch) {
      const ips = ipList.slice(i, i + batch)
      fetchIps(ips) // don't away so we can fetch multiple at a time
    }
  }, [nodeSocket.readyState])

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
        const exists = peers.find((p) => p.id === peer.id)
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

  // this is kind of expensive... maybe a disable feature needed
  useNodeSocketSubscribe({
    event: RPCEvent.PeerStateUpdated,
    onData: async (_, peer) => {
      peersStateRef.current[peer.id] = peer

      // this was lagging... too much setState -_-
      // I am now storing inside a ref and batch setState every 3s - check useEffect below
      /*setPeers((peers) => {
        return peers.map(p => {
          if (p.id === peer.id) {
            return { ...p, ...peer } // merge to keep ip variable
          }

          return p
        })
      })*/
    }
  }, [])

  useEffect(() => {
    setInterval(() => {
      setPeers((peers) => {
        return peers.map((peer) => {
          const peerState = peersStateRef.current[peer.id]
          if (peerState) {
            Reflect.deleteProperty(peersStateRef.current, peerState.id)
            return { ...peer, ...peerState } // merge to keep ip variable
          }

          return peer
        })
      })
    }, 3000)
  }, [])

  useEffect(() => {
    // make sure tween package is updated on request animation
    let animationFrameId
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate)
      TWEEN.update()
    }
    animationFrameId = requestAnimationFrame(animate)

    return () => {
      cancelAnimationFrame(animationFrameId)
    }
  }, [])

  const formattedPeers = useMemo(() => {
    return peers.map((peer) => {
      const data = geoLocation[peer.ip]
      peer.location = data
      peer.location_text = data ? `${data.country_code}_${data.country}` : ``
      peer.total_peers = Object.keys(peer.peers || {}).length
      return peer
    })
  }, [peers, geoLocation])

  const mapRef = useRef()

  return <div className={style.container}>
    <PageTitle title={t('Peers')} subtitle={t('{} nodes', [peers.length])}
      metaDescription={t('Map with list of network peers. Monitor connected peers, network status and geo location.')} />
    <div>
      <Icon name="warning" />{t(`This map does not represent the entire XELIS network.`)}
    </div>
    <div>
      <MapPeers mapRef={mapRef} peers={peers} geoLocation={geoLocation} peersLoading={peersLoading} geoLoading={geoLoading} />
      <h2>{t(`Connected Node`)}</h2>
      <ConnectedNodeTable networkData={networkData} />
      <h2>{t(`Stats`)}</h2>
      <PeersStats peers={peers} geoLocation={geoLocation} geoLoading={geoLoading} />
      <h2>{t(`Peer List`)}</h2>
      <TablePeers peersLoading={peersLoading} err={err} peers={formattedPeers} geoLocation={geoLocation} geoLoading={geoLoading} mapRef={mapRef} networkData={networkData} />
    </div>
  </div>
}

export default Peers

function TablePeers(props) {
  const { networkData, peersLoading, err, peers, geoLoading, mapRef } = props

  const { t } = useLang()
  const [filterIP, setFilterIP] = useState(``)
  const [groupKey, setGroupKey] = useState(``)
  const [sort, setSort] = useState({ key: `connected_on`, direction: `desc`, type: `number` })

  const flyTo = useCallback((data) => {
    const position = [data.latitude, data.longitude]
    mapRef.current.flyTo(position, 6)
    document.body.scrollTop = 0
  }, [])

  const onFilterIP = useCallback((e) => {
    setFilterIP(e.target.value)
  }, [])

  const sortedPeers = useMemo(() => {
    return Object.assign([], peers).sort((a, b) => {
      if (sort.type === `string`) {
        const v1 = a[sort.key] || ``
        const v2 = b[sort.key] || ``

        if (sort.direction === `asc`) {
          return (v2).localeCompare(v1)
        }

        return (v1).localeCompare(v2)
      }

      if (sort.type === `number`) {
        const v1 = a[sort.key] || 0
        const v2 = b[sort.key] || 0

        if (sort.direction === `asc`) {
          return v2 - v1
        }

        return v1 - v2
      }
    })
  }, [sort, peers])

  const filteredPeers = useMemo(() => {
    return sortedPeers.filter((p) => {
      if (filterIP.length > 0) {
        if (p.addr) return p.addr.includes(filterIP)
        return false
      }
      return true
    })
  }, [sortedPeers, filterIP])

  const groupPeers = useMemo(() => {
    if (!groupKey) return filteredPeers

    const group = groupBy(filteredPeers, (p) => {
      if (groupKey === `country`) {
        if (p.location) return `${p.location.country_code}_${p.location.country}`
        return `xx_Unknown`
      }

      return p[groupKey]
    })

    let items = []
    group.forEach((value, key) => {
      items.push({ key, groupHeader: true, count: value.length })
      items = [...items, ...value]
    })

    return items
  }, [groupKey, filteredPeers])

  const peerStats = useMemo(() => {
    const stats = [0, 0, 0, 0, 0] // synced, desync, fullLedger, prunedLedger, sameVersion

    peers.forEach((peer) => {
      if (peer.height >= networkData.data.stableheight) stats[0]++
      else stats[1]++

      if (peer.pruned_topoheight) stats[3]++
      else stats[2]++

      if (networkData.data.version === peer.version) stats[4]++
    })

    return stats
  }, [peers, networkData])

  const groupItems = useMemo(() => {
    return [
      { key: ``, text: t(`None`) },
      { key: `country`, text: t(`Country`) },
      { key: `version`, text: t(`Version`) },
      { key: `height`, text: t(`Height`) },
    ]
  }, [t])

  // Quick fix to avoid lag and display only 100 peers
  // TODO: virtual scrolling for better perf
  const list = groupPeers.slice(0, 100)

  return <div className={style.peerList}>
    <div className={style.peerStats}>
      <div>
        <div>Sync</div>
        <div>{peerStats[0]}</div>
      </div>
      <div>
        <div>Desync</div>
        <div>{peerStats[1]}</div>
      </div>
      <div>
        <div>Full Ledger</div>
        <div>{peerStats[2]}</div>
      </div>
      <div>
        <div>Pruned Ledger</div>
        <div>{peerStats[3]}</div>
      </div>
      <div>
        <div>Same version ({networkData.data.version})</div>
        <div>{peerStats[4]}</div>
      </div>
    </div>
    <div className={style.peerInput}>
      <input type="text" onChange={onFilterIP} placeholder={t(`Type to filter peers by address.`)} />
      <div>
        <div>Group by</div>
        <Dropdown items={groupItems} onChange={({ key }) => setGroupKey(key)} value={groupKey} />
      </div>
    </div>
    <Table
      headers={[
        { key: `addr`, text: t(`Address`), sort: true, type: `string` },
        { key: `location_text`, text: t(`Location`), sort: true, type: `string` },
        { key: `total_peers`, text: t(`Peers`), sort: true, type: `number` },
        { key: `tag`, text: t(`Tag`), sort: true, type: `string` },
        { key: `height`, text: t(`Height`), sort: true, type: `number` },
        { key: `topoheight`, text: t(`Topo Height`), sort: true, type: `number` },
        { key: `pruned_topoheight`, text: t(`Pruned Topo`), sort: true, type: `number` },
        { key: `connected_on`, text: t(`Since`), sort: true, type: `number` },
        { key: `last_ping`, text: t(`Last Ping`), sort: true, type: `number` },
        { key: `version`, text: t(`Version`), sort: true, type: `string` },
      ]}
      sortState={sort}
      onSort={(header) => {
        let direction = `desc`
        if (sort.key === header.key) {
          direction = sort.direction === `desc` ? `asc` : `desc`
        }

        setSort({ key: header.key, direction, type: header.type })
      }}
      loading={peersLoading} err={err} list={list} emptyText={t('No peers')} colSpan={10}
      onItem={(item) => {
        if (item.groupHeader) {
          const key = item.key
          let text = <span>{key} ({item.count})</span>

          if (groupKey === `country`) {
            const values = key.split(`_`)
            const country_code = values[0]
            const country = values[1]
            text = <>
              <FlagIcon code={country_code.toLowerCase()} />
              <span>{country} ({item.count})</span>
            </>
          }

          return <tr key={key}>
            <td style={{ color: `var(--text-color)` }} colSpan={10}>
              <div className={style.tableRowLocation}>
                {text}
              </div>
            </td>
          </tr>
        }

        let location = `--`
        if (geoLoading) location = <DotLoading />

        const data = item.location
        if (data) {
          const code = (data.country_code || 'xx').toLowerCase()

          if (groupKey == `country`) {
            location = <div className={style.tableRowLocation}>
              <div>{data.region}</div>
              <button onClick={() => flyTo(data)}>Fly To</button>
            </div>
          } else {
            location = <div className={style.tableRowLocation}>
              <FlagIcon code={code} />
              <div>{data.country}{data.region && ` / ${data.region}`}</div>
              <button onClick={() => flyTo(data)}>Fly To</button>
            </div>
          }
        }

        const tag = item.tag ? reduceText(item.tag, 20, 0) : `--`

        return <tr key={item.id}>
          <td>{item.addr}</td>
          <td>{location}</td>
          <td>{item.total_peers}</td>
          <td>{tag}</td>
          <td>{item.height.toLocaleString()}</td>
          <td>{item.topoheight.toLocaleString()}</td>
          <td>{item.pruned_topoheight ? item.pruned_topoheight.toLocaleString() : `--`}</td>
          <td>
            <Age timestamp={item.connected_on * 1000} update />
          </td>
          <td>
            <Age timestamp={item.last_ping * 1000} update />
          </td>
          <td>{item.version}</td>
        </tr>
      }}
    />
  </div>
}

function MapControls(props) {
  const { controls, setControls, mapRef } = props
  const { showCluster, showPeers, showPulse } = controls

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
      {t('Cluster')}
      <Switch checked={showCluster} onChange={(checked) => setControlValue('showCluster', checked)} />
    </div>
    <div>
      {t('Pulse')}
      <Switch checked={showPulse} onChange={(checked) => setControlValue('showPulse', checked)} />
    </div>
    <div>
      <button onClick={reset}>{t('Reset')}</button>
    </div>
  </div>
}

function PeerDot(props) {
  const { peerDot, leaflet, visible, cluster, animate = true } = props
  const { peers, position, location, type } = peerDot
  const { CircleMarker2, Popup } = leaflet.react

  const [dotRadius, setDotRadius] = useState(6)
  const tweenRef = useRef()
  const { t } = useLang()

  useEffect(() => {
    const startSize = 3
    const endSize = 6
    tweenRef.current = new TWEEN.Tween({ x: startSize })
      .to({ x: endSize }, 1500)
      .easing(TWEEN.Easing.Elastic.Out)
      .onUpdate((v) => {
        setDotRadius(v.x)
      })
  }, [])

  useEffect(() => {
    if (tweenRef.current && animate) {
      tweenRef.current.start()
    }
  }, [animate, peerDot.lastPing])

  const pathOptions = useMemo(() => {
    let options = {}
    switch (type) {
      case `peer`:
        options = { opacity: 1, fillOpacity: .3, weight: 2, color: `green` }
        break
      //case `sub_peer`:
      // options = { opacity: .2, fillOpacity: .1, weight: 2, color: `yellow` }
      // break
    }

    if (!visible) {
      options.opacity = 0
      options.fillOpacity = 0
    }

    return options
  }, [type, visible])

  // check if position array is valid
  if (!Array.isArray(position) && position.length !== 2) return null
  if (typeof position[0] !== 'number') return null // latitude
  if (typeof position[1] !== 'number') return null // longitude

  return <>
    {!cluster && <CircleMarker2 radius={dotRadius} pathOptions={pathOptions} center={position}>
      <Popup>
        <div>{location.country} / {location.region}</div>
        <div>
          {peers.map((peer) => {
            /*if (type === `sub_peer`) {
              return <div key={peer.addr}>{peer.addr}</div>
            }*/

            const peerCount = Object.keys(peer.peers || {}).length
            return <div key={peer.addr}>{peer.addr} {`(${peerCount}P)`}</div>
          })}
        </div>
      </Popup>
    </CircleMarker2>}
    {cluster && <>
      {peers.map((peer) => {
        return <CircleMarker2 key={peer.addr} radius={dotRadius} pathOptions={pathOptions} center={position}>
          <Popup>
            <div>{location.country} / {location.region}</div>
            <div>
              <div>{t(`Address`)}: {peer.addr}</div>
              <div>{t(`Version`)}: {peer.version}</div>
              <div>{t(`Connected`)}: <Age timestamp={peer.connected_on * 1000} /></div>
            </div>
          </Popup>
        </CircleMarker2>
      })}
    </>}
  </>
}

function MapPeers(props) {
  const { mapRef, peers, geoLocation, peersLoading, geoLoading } = props

  const { theme } = useTheme()
  const [leaflet, setLeaflet] = useState()
  const [mapContainer, setMapContainer] = useState()
  const [controls, setControls] = useState({ showPeers: true, showPulse: true, showCluster: true })

  useEffect(() => {
    const load = async () => {
      const markerCluster = await import('./markerCluster')
      const circleMarker = await import('./circleMarker')
      // load here (client side only) to avoid ssr loading leaflet
      const react = await import('react-leaflet')
      // const { Simple }  = await import('leaflet/src/geo/crs/CRS.Simple')
      react.MarkerClusterGroup = markerCluster.default
      react.CircleMarker2 = circleMarker.default // overwrite
      setLeaflet({ react })
    }

    load()
  }, [])

  useEffect(() => {
    if (!leaflet) return

    const { MapContainer, TileLayer, MarkerClusterGroup, CircleMarker2 } = leaflet.react

    let tileLayerUrl = `https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png`
    if (theme === `light`) {
      tileLayerUrl = `https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png`
    }

    const peerDots = {}

    function appendDotPeer(props) {
      const { peer, peerLocation, type } = props
      const dotKey = `${peerLocation.latitude}_${peerLocation.longitude}`
      if (peerDots[dotKey]) {
        if (peer.last_ping < peerDots[dotKey].lastPing) {
          peerDots[dotKey].lastPing = peer.last_ping
        }

        // another peer with the same location
        if (!peerDots[dotKey].peers.find(p => p.addr === peer.addr)) {
          peerDots[dotKey].peers.push(peer)
        }
      } else {
        const dotPosition = [peerLocation.latitude, peerLocation.longitude]
        peerDots[dotKey] = { peers: [peer], location: peerLocation, position: dotPosition, lastPing: peer.last_ping, type }
      }
    }

    // important use two loop to populate peers first and then add subpeers
    peers.forEach((peer) => {
      const peerLocation = geoLocation[peer.ip]
      if (!peerLocation) return

      appendDotPeer({ peer, peerLocation, type: `peer` })
    })

    // other providers https://leaflet-extras.github.io/leaflet-providers/preview/
    const mapContainer = <MapContainer minZoom={1} zoom={2} center={[0, 0]} ref={mapRef} preferCanvas>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        url={tileLayerUrl}
      />
      {controls.showCluster && <MarkerClusterGroup showCoverageOnHover={false} chunkedLoading>
        {Object.keys(peerDots).map((key) => {
          return <PeerDot key={key} peerDot={peerDots[key]} visible={controls.showPeers} leaflet={leaflet}
            cluster={controls.showCluster} animate={controls.showPulse} />
        })}
      </MarkerClusterGroup>}
      {!controls.showCluster && <>
        {Object.keys(peerDots).map((key) => {
          return <PeerDot key={key} peerDot={peerDots[key]} visible={controls.showPeers} leaflet={leaflet}
            cluster={controls.showCluster} animate={controls.showPulse} />
        })}
      </>}
    </MapContainer>

    setMapContainer(mapContainer)
  }, [leaflet, peers, geoLocation, theme, controls])

  return <div className={style.map}>
    {mapContainer && <MapControls controls={controls} setControls={setControls} mapRef={mapRef} />}
    {mapContainer}
    <MapLoad loading={peersLoading || geoLoading} />
  </div>
}

function ConnectedNodeTable(props) {
  const { networkData } = props
  const { err, loading } = networkData
  const { t } = useLang()

  const data = useMemo(() => {
    if (Object.keys(networkData.data).length > 0) return [networkData.data]
    return []
  }, [networkData])

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
        title: t('Topo Height'),
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

function PeersStats(props) {
  const { peers, geoLoading, geoLocation } = props
  const { theme: currentTheme } = useTheme()
  const { t } = useLang()

  const data = useMemo(() => {
    let versionData = { labels: [], data: [] }
    let heightData = { labels: [], data: [] }
    let continentData = { labels: [], data: [] }
    let countryData = { labels: [], data: [] }

    const evaluate = (data, value) => {
      if (!value) return

      let index = data.labels.indexOf(value)
      if (index === -1) {
        data.labels.push(value)
        index = data.labels.length - 1
      }

      if (data.data[index]) {
        data.data[index]++
      } else {
        data.data.push(1)
      }
    }

    const sortMax = (data, max) => {
      const values = data.data.map((v, i) => ({ label: data.labels[i], value: v }))
      values.sort((a, b) => b.value - a.value)
      const filtered = values.slice(0, max)

      const newData = { labels: [], data: [] }
      filtered.forEach((item) => {
        newData.labels.push(item.label)
        newData.data.push(item.value)
      })
      return newData
    }

    peers.forEach((peer) => {
      evaluate(versionData, peer.version)
      evaluate(heightData, peer.height)

      const data = geoLocation[peer.ip]
      const continent = data ? data.continent : ''
      const country = data ? data.country : ''
      evaluate(continentData, continent)
      evaluate(countryData, country)
    })

    continentData = sortMax(continentData, 10)
    countryData = sortMax(countryData, 10)
    versionData = sortMax(versionData, 5)
    heightData = sortMax(heightData, 5)

    return { versionData, heightData, continentData, countryData }
  }, [peers])

  const barOptions = useMemo(() => {
    return {
      animation: false,
      //responsive: false,
      //maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false,
        },
      },
      scales: {
        y: {
          grid: {
            display: false,
          },
          ticks: {
            color: currentTheme === 'light' ? `#1c1c1c` : `#f1f1f1`,
          },
        },
        x: {
          grid: {
            display: false,
          },
          ticks: {
            color: currentTheme === 'light' ? `#1c1c1c` : `#f1f1f1`,
          }
        }
      }
    }
  }, [currentTheme])

  const pieOptions = useMemo(() => {
    return {
      animation: false,
      //responsive: false,
      //maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: 'bottom',
        },
      }
    }
  }, [])

  const continentData = useMemo(() => {
    return {
      labels: data.continentData.labels,
      datasets: [{
        data: data.continentData.data,
        borderWidth: 0,
        backgroundColor: currentTheme === 'light' ? `#1c1c1c` : `#f1f1f1`,
      }],
    }
  }, [data.continentData, currentTheme])

  const countryData = useMemo(() => {
    return {
      labels: data.countryData.labels,
      datasets: [{
        data: data.countryData.data,
        borderWidth: 0,
        backgroundColor: currentTheme === 'light' ? `#1c1c1c` : `#f1f1f1`,
      }],
    }
  }, [data.countryData, currentTheme])

  const heightData = useMemo(() => {
    return {
      labels: data.heightData.labels,
      datasets: [{
        data: data.heightData.data,
        borderWidth: 0,
      }]
    }
  }, [data.heightData])

  const versionData = useMemo(() => {
    return {
      labels: data.versionData.labels,
      datasets: [{
        data: data.versionData.data,
        borderWidth: 0,
      }]
    }
  }, [data.versionData])

  return <div className={style.chart}>
    <div>
      <div>{t(`Nodes by Continent`)}</div>
      {!geoLoading && <Chart type="bar" options={barOptions} data={continentData} />}
    </div>
    <div>
      <div>{t(`Nodes by Country`)}</div>
      {!geoLoading && <Chart type="bar" options={barOptions} data={countryData} />}
    </div>
    <div>
      <div>{t(`Nodes by Height`)}</div>
      <Chart type="doughnut" options={pieOptions} data={heightData} />
    </div>
    <div>
      <div>{t(`Nodes by Version`)}</div>
      <Chart type="pie" options={pieOptions} data={versionData} />
    </div>
  </div>
}
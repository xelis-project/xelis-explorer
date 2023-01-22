import Button from '../../components/button'
import { Link } from 'react-router-dom'

import './explorer-search.css'
import './home-stats.css'
import './recent-blocks.css'
import './node-connection.css'

function ExplorerSearch() {
  return <div className="explorer-search">
    <div className="explorer-search-title">Xelis Explorer</div>
    <div className="explorer-search-form">
      <input type="text" placeholder="Search block, transaction or address" />
      <Button icon="chevron-right-r" iconLocation="right">Search</Button>
    </div>
  </div>
}

function NodeConnection() {
  return <div className="node-connection">
    <div className="node-connection-status alive" />
    <div>connected to remote node</div>
  </div>
}

function RecentBlocks() {
  const blocks = [
    { height: 4, value: `10 txs | 1 mb` },
    { height: 3, value: `5 txs | 50 kb` },
    { height: 2, value: `35 txs | 2 mb` },
    { height: 1, value: `1 txs | 100 kb` },
    { height: 0, value: `23 txs | 4 mb` },
  ]

  return <div className="recent-blocks">
    <div className="recent-blocks-title">Recent Blocks</div>
    <div className="recent-blocks-items">
      {blocks.map((item) => {
        return <Link to={`/blocks/${item.height}`} key={item.height} className="recent-blocks-item">
          <div className="recent-blocks-item-status" />
          <div className="recent-blocks-item-title">Block #{item.height}</div>
          <div className="recent-blocks-item-value">{item.value}</div>
        </Link>
      })}
    </div>
  </div>
}

function Stats() {
  const stats = [
    { title: `Hash rate`, value: `100 MH/s` },
    { title: `Total txs`, value: `34.44 M` },
    { title: `TPS`, value: `10.5` },
    { title: `Difficulty`, value: `4534454` },
    { title: `Total supply`, value: `145230` },
    { title: `Tx pool`, value: `5 tx` },
    { title: `Avg block size`, value: `10 bytes` },
    { title: `Avg block time`, value: `18s` },
    { title: `Blockchain size`, value: `1.5 GB` },
  ]

  return <div className="home-stats">
    <div className="home-stats-title">Realtime Stats</div>
    <div className="home-stats-items">
      {stats.map((item) => {
        return <div key={item.title} className="home-stats-item">
          <div className="home-stats-item-title">{item.title}</div>
          <div className="home-stats-item-value">{item.value}</div>
        </div>
      })}
    </div>
  </div>
}

function Home() {
  return <div>
    <ExplorerSearch />
    <NodeConnection />
    <RecentBlocks />
    <Stats />
  </div>
}

export default Home

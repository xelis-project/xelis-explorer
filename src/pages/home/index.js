import { Helmet } from 'react-helmet-async'

import { ExplorerSearch } from './explorer_search'
import { RecentBlocks } from './recent_blocks'
import { NetworkStats } from './network_stats'

function Home() {
  return <div>
    <Helmet>
      <title>Home</title>
    </Helmet>
    <ExplorerSearch />
    <RecentBlocks />
  </div>
}

export default Home

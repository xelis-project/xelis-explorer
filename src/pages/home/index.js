import { Helmet } from 'react-helmet-async'

import { ExplorerSearch } from './explorer_search'
import { RecentBlocks } from './recent_blocks'
import { Stats } from './stats'

function Home() {
  return <div>
    <Helmet>
      <title>Home</title>
    </Helmet>
    <ExplorerSearch />
    <RecentBlocks />
    <Stats />
  </div>
}

export default Home

import { Helmet } from 'react-helmet-async'
import { Outlet } from 'react-router'
import Button from '../../components/button'

function Stats() {
  return <div>
    <Helmet>
      <title>Stats</title>
    </Helmet>
    <h1>Statistics</h1>
    <div className="stats-buttons">
      <Button link="/stats/chart" icon="chart" className="button">
        Chart
      </Button>
      <Button link="/stats" icon="view-list" className="button">
        Table
      </Button>
    </div>
    <Outlet />
  </div>
}

export default Stats
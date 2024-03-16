import { useMemo } from 'react'
import { css } from 'goober'
//import { Link } from 'react-router-dom'
import { useLang } from 'g45-react/hooks/useLang'
import prettyMs from 'pretty-ms'

import { formatHashRate, formatSize, formatXelis, reduceText } from '../../utils'
//import Hashicon from '../../components/hashicon'
import Chart from '../../components/chart'
import theme from '../../style/theme'

const style = {
  container: css`
    .title {
      margin-bottom: 1em;
      font-weight: bold;
      font-size: 1.5em;
  
      > div {
        font-size: .6em;
        opacity: .7;
        font-weight: normal;
        margin-top: 5px;
      }
    }

    .recent-stats {
      display: flex;
      gap: 1em;
      margin-bottom: 1em;
      padding-bottom: 1em;
      overflow: auto;

      > div {
        padding: 1em;
        background-color: var(--stats-bg-color);
        min-width: 9em;
        flex-shrink: 0;
        border-radius: .5em;

        > :nth-child(1) {
          color: var(--muted-color);
          font-size: .9em;
          margin-bottom: .5em;
        }

        > :nth-child(2) {
          font-size: 1.6em;
        }
      }
    }

    .charts {
      display: flex;
      gap: 2em;
      flex-direction: column;

      ${theme.query.minDesktop} {
        flex-direction: row;
      }

      > div {
        flex: 1;
      }

      > :nth-child(2) {
        display: flex;
        gap: 2em;
        flex-direction: column;
      }

      .chart-container {
        padding: 2em;
        border-radius: .5em;
        background-color: var(--stats-bg-color);

        > :nth-child(1) {
          margin-bottom: 1em;
        }
      }
    }

    .miners-distribution {
      display: flex;
      flex-direction: column;
      border-left: .3em solid var(--block-border-color);
      background-color: var(--stats-bg-color);
      border-radius: .25em;

      > div {
        display: flex;
        align-items: center;

        > :nth-child(1) {
          padding: .7em;
          min-width: 140px;
          background-color: var(--block-bg-color);
          display: flex;
          align-items: center;
          gap: .5em;
        }

        > :nth-child(2) {
          flex: 1;

          > div {
            padding: .7em;
            color: white;
            overflow: hidden;
            font-weight: bold;
            white-space: nowrap;
            transition: all .25s;
            border-top-right-radius: .25em;
            border-bottom-right-radius: .25em;
          }
        }
      }
    }
  `
}

const defaultStats = {
  txs: 0, size: 0, fees: 0, miners: {}, reward: 0,
}

export function RecentStats(props) {
  const { blocks } = props

  const { t } = useLang()

  const stats = useMemo(() => {
    let stats = Object.assign({}, defaultStats)
    let miners = {}
    blocks.forEach(block => {
      if (Object.keys(block).length == 0) return

      stats.txs += (block.txs_hashes || 0).length
      stats.size += block.total_size_in_bytes || 0
      stats.fees += block.total_fees || 0
      stats.reward += block.reward || 0

      if (!miners[block.miner]) {
        miners[block.miner] = 1
      } else {
        miners[block.miner]++
      }
    })

    return { ...stats, miners }
  }, [blocks])

  return <div className={style.container}>
    <div className="title">
      {t('Recent Stats')}
      <div>Last {blocks.length} blocks</div>
    </div>
    <div className="recent-stats">
      <div>
        <div>{t('Txs')}</div>
        <div>{stats.txs}</div>
      </div>
      <div>
        <div>{t('Size')}</div>
        <div>{formatSize(stats.size)}</div>
      </div>
      <div>
        <div>{t('Fees')}</div>
        <div>{formatXelis(stats.fees, { withSuffix: false })}</div>
      </div>
      <div>
        <div>{t('Reward')}</div>
        <div>{formatXelis(stats.reward, { withSuffix: false })}</div>
      </div>
    </div>
    <div className="charts">
      <MinersDistributionChart miners={stats.miners} />
      <div>
        <HashrateChart blocks={blocks} />
        <BlockTimesChart blocks={blocks} />
      </div>
    </div>
  </div>
}

function MinersDistributionChart(props) {
  const { miners } = props

  const { t } = useLang()

  const options = useMemo(() => {
    return {
      animation: false,
      //responsive: false,
      //maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: 'left',
        },
        tooltip: {
          callbacks: {
            label: function (ctx) {
              return t(`{} blocks`, [ctx.raw])
            }
          }
        },
      }
    }
  }, [])

  const data = useMemo(() => {
    const labels = []
    const data = []

    Object.entries(miners).forEach(([miner, minedBlock]) => {
      labels.push(reduceText(miner))
      data.push(minedBlock)
    })

    return {
      labels,
      datasets: [
        {
          data,
          borderWidth: 0,
        }
      ]
    }
  }, [miners])

  return <div className="chart-container">
    <div>{t(`Miners Distribution`)}</div>
    <Chart type="doughnut" options={options} data={data} />
  </div>
}

function HashrateChart(props) {
  const { blocks } = props

  const { t } = useLang()

  const options = useMemo(() => {
    return {
      animation: false,
      //responsive: false,
      //maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          callbacks: {
            label: function (ctx) {
              return formatHashRate(parseInt(ctx.raw) / 15)
            }
          }
        }
      },
      scales: {
        y: {
          ticks: {
            callback: (value) => formatHashRate(parseInt(value) / 15),
          }
        }
      }
    }
  }, [])

  const data = useMemo(() => {
    const labels = []
    const data = []

    const sortedBlocks = Object.assign([], blocks).sort((a, b) => a.topoheight - b.topoheight)
    sortedBlocks.forEach((block) => {
      labels.push(block.topoheight)
      data.push(block.difficulty)
    })

    return {
      labels,
      datasets: [
        {
          data,
          borderWidth: 3,
          tension: 0.4,
          fill: `start`
        }
      ]
    }
  }, [blocks])

  return <div className="chart-container">
    <div>{t(`Hashrates`)}</div>
    <Chart type="line" options={options} data={data} />
  </div>
}

function BlockTimesChart(props) {
  const { blocks } = props

  const { t } = useLang()

  const options = useMemo(() => {
    return {
      animation: false,
      //responsive: false,
      //maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          callbacks: {
            label: function (ctx) {
              return prettyMs(ctx.raw)
            }
          }
        }
      },
      scales: {
        y: {
          ticks: {
            callback: (value) => prettyMs(value),
          }
        }
      }
    }
  }, [])

  const data = useMemo(() => {
    const labels = []
    const data = []

    const sortedBlocks = Object.assign([], blocks).sort((a, b) => a.topoheight - b.topoheight)
    for (let i = 0; i < sortedBlocks.length; i++) {
      const block = sortedBlocks[i]
      const nextBlock = sortedBlocks[i + 1]
      if (nextBlock) {
        const blocktime = Math.max(0, nextBlock.timestamp - block.timestamp)
        labels.push(block.topoheight)
        data.push(blocktime)
      }
    }

    return {
      labels,
      datasets: [
        {
          data,
        }
      ]
    }
  }, [blocks])

  return <div className="chart-container">
    <div>{t(`Blocks Time`)}</div>
    <Chart type="bar" options={options} data={data} />
  </div>
}

/*
const colors = [
  'rgba(231, 90, 57, 0.4)', 'rgba(42, 187, 211, 0.4)', 'rgba(109, 255, 187, 0.4)', 'rgba(46, 36, 155, 0.4)',
  'rgba(171, 186, 40, 0.4)', 'rgba(109, 255, 220, 0.4)', 'rgba(216, 26, 89, 0.4)', 'rgba(79, 247, 164, 0.4)',
  'rgba(242, 204, 0, 0.4)', 'rgba(35, 170, 120, 0.4)', 'rgba(19, 116, 239, 0.4)', 'rgba(66, 170, 178, 0.4)',
  'rgba(147, 237, 104, 0.4)', 'rgba(127, 237, 87, 0.4)', 'rgba(206, 98, 7, 0.4)', 'rgba(38, 100, 119, 0.4)',
  'rgba(32, 164, 247, 0.4)', 'rgba(193, 119, 36, 0.4)', 'rgba(90, 3, 127, 0.4)', 'rgba(72, 165, 28, 0.4)',
]

function MinersDistribution(props) {
  const { miners } = props

  const distribution = useMemo(() => {
    const values = Object.entries(miners).map(([miner, minedBlock]) => {
      return { miner, minedBlock }
    })

    values.sort((a, b) => b.minedBlock - a.minedBlock)
    return values
  }, [miners])

  return <div className="miners-distributions">
    {distribution.map((item, index) => {
      const percentage = (item.minedBlock * 100 / distribution[0].minedBlock).toFixed(2)
      return <div key={item.miner}>
        <div title={item.miner}>
          <Hashicon value={item.miner} size={20} />
          <Link to={`/accounts/${item.miner}`}>{reduceText(item.miner, 0, 5)}</Link>
        </div>
        <div>
          <div title={`${item.minedBlock} mined blocks`}
            style={{ width: `${percentage}%`, backgroundColor: colors[index] }}>
            {item.minedBlock}
          </div>
        </div>
      </div>
    })}
  </div>
}*/
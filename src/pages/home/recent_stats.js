import { useMemo } from 'react'
import { css } from 'goober'
import { useLang } from 'g45-react/hooks/useLang'
import prettyMs from 'pretty-ms'

import { formatHashRate, formatSize, formatXelis } from '../../utils'
import Chart from '../../components/chart'
import theme from '../../style/theme'
import { formatMiner } from '../../utils/pools'

const style = {
  container: css`
    .title {
      margin-bottom: 1em;
      font-weight: bold;
      font-size: 1.5em;
  
      > div {
        font-size: .7em;
        font-weight: normal;
        margin-top: 5px;
        color: var(--muted-color);
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
          color: var(--muted-color);
          margin-bottom: .5em;
        }

        > :nth-child(2) {
          font-size: 1.5em;
          margin-bottom: .5em;
        }

        > :nth-child(4) {
          font-size: 1em;
          margin-top: .5em;
          color: var(--muted-color);
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
  const { blocks, info } = props

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
        <HashrateChart blocks={blocks} info={info} />
        <BlockTimesChart blocks={blocks} info={info} />
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
      layout: {
        padding: 20,
      },
      plugins: {
        legend: {
          display: true,
          position: 'bottom',
          labels: {
            padding: 15
          }
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

    const minerList = Object.entries(miners).sort((a, b) => b[1] - a[1])

    minerList.forEach(([miner, minedBlock]) => {
      labels.push(formatMiner(miner))
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
    <div>{t(`Mining Distribution`)}</div>
    <div>{t(`{} miners on the last 20 blocks`, [Object.keys(miners).length])}</div>
    <Chart type="doughnut" options={options} data={data} />
  </div>
}

function HashrateChart(props) {
  const { blocks, info } = props

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
              return formatHashRate(ctx.raw)
            }
          }
        }
      },
      scales: {
        y: {
          ticks: {
            callback: (value) => formatHashRate(value),
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

    // add last fake block to show current diff
    labels.push(info.topoheight + 1)
    data.push(info.difficulty)

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
  }, [blocks, info])

  return <div className="chart-container">
    <div>{t(`Hashrate`)}</div>
    <div>{formatHashRate(info.difficulty)}</div>
    <Chart type="line" options={options} data={data} />
    <div>
      {t(`
      Drastic swings in the nethash are caused by the Kalman Filter. 
      For a more accurate representation of nethash and additional information about the filter, check the links below.
      `)}
      <br /><br />
      <a href="https://stats.xelis.io/mining" target="_blank">{t(`Average Nethash`)}</a>&nbsp;&nbsp;
      <a href="https://docs.xelis.io/features/difficulty-adjustment" target="_blank">{t(`Difficulty adjustment`)}</a>
    </div>
  </div>
}

function BlockTimesChart(props) {
  const { blocks, info } = props

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
    <div>{t(`Block Time`)}</div>
    <div>{t(`{} avg`, [prettyMs(info.average_block_time || 0, { compact: true })])}</div>
    <Chart type="bar" options={options} data={data} />
  </div>
}

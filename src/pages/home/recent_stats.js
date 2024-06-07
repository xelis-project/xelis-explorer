import { useMemo } from 'react'
import { css } from 'goober'
import { useLang } from 'g45-react/hooks/useLang'
import prettyMs from 'pretty-ms'

import { formatHashRate, formatSize, formatXelis } from '../../utils'
import Chart from '../../components/chart'
import theme from '../../style/theme'
import { formatMiner } from '../../utils/pools'

const style = {
  title: css`
    margin-bottom: 1em;
    font-weight: bold;
    font-size: 1.5em;
  `,
  subtitle: css`
    font-size: .7em;
    font-weight: normal;
    margin-top: 5px;
    color: var(--muted-color);
  `,
  box: {
    container: css`
      background-color: var(--stats-bg-color);
      border-radius: .5em;
      padding: 1em;
      min-width: 150px;
      min-width: 9em;
      flex-shrink: 0;
      display: flex;
      flex-direction: column;
      gap: .5em;
    `,
    title: css`
      color: var(--muted-color);
      font-size: 1em;
    `,
    value: css`
      font-size: 1.6em;
    `,
    content: css`
      margin-top: .5em;
      display: flex;
    `
  },
  stats: css`
    display: flex;
    gap: 1em;
    overflow: auto;
    padding-bottom: 1em;
    margin-bottom: 1em;
  `,
  charts: css`
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

      > div {
        flex: 1;
      }
    }
  `
}

function Box(props) {
  const { title, value, children } = props
  return <div className={style.box.container}>
    <div className={style.box.title}>{title}</div>
    <div className={style.box.value}>{value}</div>
    {children}
  </div>
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

      stats.txs += (block.txs_hashes || []).length
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

  return <div>
    <div className={style.title}>
      {t('Recent Stats')}
      <div className={style.subtitle}>Last {blocks.length} blocks</div>
    </div>
    <div className={style.stats}>
      <Box title={t(`Txs`)} value={stats.txs} />
      <Box title={t(`Size`)} value={formatSize(stats.size)} />
      <Box title={t(`Fees`)} value={formatXelis(stats.fees, { withSuffix: false })} />
      <Box title={t(`Reward`)} value={formatXelis(stats.reward, { withSuffix: false })} />
    </div>
    <div className={style.charts}>
      <MinersDistributionChart miners={stats.miners} numBlocks={blocks.length} />
      <div>
        <HashrateChart blocks={blocks} info={info} />
        <BlockTimesChart blocks={blocks} info={info} />
      </div>
    </div>
  </div>
}

function MinersDistributionChart(props) {
  const { miners, numBlocks } = props

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

  const value = t(`{} miners on the last {} blocks`, [Object.keys(miners).length, numBlocks])

  return <Box title={t(`Mining Distribution`)} value={value}>
    <Chart type="doughnut" options={options} data={data} />
  </Box>
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

  return <Box title={t(`Hashrate`)} value={formatHashRate(info.difficulty)}>
    <Chart type="line" options={options} data={data} />
    <div>
      {t(`
      Drastic swings in the nethash are caused by the Kalman Filter. 
      For a more accurate representation of nethash and additional information about the filter, check the links below.
      `)}
    </div>
    <div>
      <a href="https://stats.xelis.io/mining" target="_blank">{t(`Average Nethash`)}</a>&nbsp;&nbsp;
      <a href="https://docs.xelis.io/features/difficulty-adjustment" target="_blank">{t(`Difficulty adjustment`)}</a>
    </div>
  </Box>
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

  const value = t(`{} avg`, [prettyMs(info.average_block_time || 0, { compact: true })])

  return <Box title={t(`Block Time`)} value={value}>
    <Chart type="bar" options={options} data={data} />
  </Box>
}

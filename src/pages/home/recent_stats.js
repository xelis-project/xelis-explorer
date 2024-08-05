import { useMemo } from 'react'
import { css } from 'goober'
import { useLang } from 'g45-react/hooks/useLang'
import prettyMs from 'pretty-ms'
import useLocale from 'g45-react/hooks/useLocale'

import { formatHashRate, formatSize, formatXelis } from '../../utils'
import Chart from '../../components/chart'
import theme from '../../style/theme'
import { formatMiner } from '../../utils/known_addrs'
import useTheme from '../../hooks/useTheme'
import { getBlockColor } from '../dag/blockColor'
import { getBlockType } from '../dag'

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
      background-color: var(--content-bg-color);
      border-radius: .75em;
      padding: 1.5em;
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
    `,
    description: css`
      color: var(--muted-color);
      font-size: .9em;
    `
  },
  stats: css`
    display: flex;
    gap: 1.5em;
    overflow: auto;
    padding-bottom: 1em;
    margin-bottom: 1em;
  `,
  blockTypes: css`
    display: grid;
    row-gap: .25em;
    column-gap: 1.5em;
    grid-template-columns: 1fr 1fr;
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
    {value && <div className={style.box.value}>{value}</div>}
    {children}
  </div>
}

const defaultStats = {
  txs: 0, size: 0, fees: 0, miners: {}, reward: 0, blockTypes: {}
}

export function RecentStats(props) {
  const { blocks, info } = props

  const { t } = useLang()
  const locale = useLocale()
  const { theme: currentTheme } = useTheme()

  const stats = useMemo(() => {
    let stats = Object.assign({}, defaultStats)
    let miners = {}
    let blockTypes = { 'Normal': 0, 'Sync': 0, 'Side': 0, 'Orphaned': 0 }

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


      const blockType = getBlockType(blocks, block, info.stableheight)
      blockTypes[blockType]++
    })

    return { ...stats, miners, blockTypes }
  }, [blocks, info])

  return <div>
    <div className={style.title}>
      {t('Recent Stats')}
      <div className={style.subtitle}>Last {blocks.length} blocks</div>
    </div>
    <div className={style.stats}>
      <Box title={t(`Txs`)} value={stats.txs} />
      <Box title={t(`Size`)} value={formatSize(stats.size, { locale })} />
      {/* Commenting out because fee is not supplied by the node and is always zero */}
      {/*<Box title={t(`Fees`)} value={formatXelis(stats.fees, { withSuffix: false, locale })} />*/}
      <Box title={t(`Reward`)} value={formatXelis(stats.reward, { withSuffix: false, locale })} />
      <Box title={t(`Block Types`)}>
        <div className={style.blockTypes}>
          <div style={{ color: getBlockColor(currentTheme, `Normal`) }}>
            {t(`Normal`)} ({stats.blockTypes[`Normal`]})
          </div>
          <div style={{ color: getBlockColor(currentTheme, `Sync`) }}>
            {t(`Sync`)} ({stats.blockTypes[`Sync`]})
          </div>
          <div style={{ color: getBlockColor(currentTheme, `Side`) }}>
            {t(`Side`)} ({stats.blockTypes[`Side`]})
          </div>
          <div style={{ color: getBlockColor(currentTheme, `Orphaned`) }}>
            {t(`Orphaned`)} ({stats.blockTypes[`Orphaned`]})
          </div>
        </div>
      </Box>
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
  const locale = useLocale()
  const { theme: currentTheme } = useTheme()

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
              return formatHashRate(ctx.raw, { locale })
            }
          }
        }
      },
      scales: {
        y: {
          grid: {
            display: false,
          },
          ticks: {
            color: currentTheme === 'light' ? `#1c1c1c` : `#f1f1f1`,
            callback: (value) => formatHashRate(value, { locale }),
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
          backgroundColor: `transparent`,
          borderWidth: 4,
          tension: .3,
          pointRadius: 0,
          borderColor: currentTheme === 'light' ? `#1c1c1c` : `#f1f1f1`,
        }
      ]
    }
  }, [blocks, info, currentTheme])

  return <Box title={t(`Hashrate`)} value={formatHashRate(info.difficulty, { locale })}>
    <Chart type="line" options={options} data={data} />
    <div className={style.box.description}>
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
  const { theme: currentTheme } = useTheme()

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
          grid: {
            display: false,
          },
          ticks: {
            callback: (value) => prettyMs(value),
            color: currentTheme === 'light' ? `#1c1c1c` : `#f1f1f1`,
          }
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
      datasets: [{
        data,
        tension: .3,
        borderWidth: 0,
        backgroundColor: currentTheme === 'light' ? `#1c1c1c` : `#f1f1f1`,
      }]
    }
  }, [blocks, currentTheme])

  const value = t(`{} avg`, [prettyMs(info.average_block_time || 0, { compact: true })])

  return <Box title={t(`Block Time`)} value={value}>
    <Chart type="bar" options={options} data={data} />
  </Box>
}

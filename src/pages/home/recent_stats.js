import { useMemo } from 'react'
import { css } from 'goober'
import { Link } from 'react-router-dom'
import { useLang } from 'g45-react/hooks/useLang'

import { formatSize, formatXelis, reduceText } from '../../utils'

const style = {
  container: css`
    > :nth-child(1), > :nth-child(3) {
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

    > :nth-child(2) {
      display: flex;
      gap: 1em;
      margin-bottom: 1em;
      padding-bottom: 1em;
      overflow: auto;

      > div {
        padding: 1em;
        border-left: .3em solid var(--block-border-color);
        background-color: var(--block-bg-color);
        min-width: 9em;
        border-radius: .25em;

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

    > :nth-child(4) {
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
          min-width: 100px;
          background-color: var(--block-bg-color);
        }

        > :nth-child(2) {
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
    <div>
      {t('Recent Stats')}
      <div>Last {blocks.length} blocks</div>
    </div>
    <div>
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
    <div>
      {t('Miners Distribution')}
      <div>Last {blocks.length} blocks</div>
    </div>
    <MinersDistribution miners={stats.miners} />
  </div>
}

const colors = [
  'rgba(221, 90, 57, 0.4)', 'rgba(42, 177, 211, 0.4)', 'rgba(109, 255, 177, 0.4)', 'rgba(36, 34, 155, 0.4)',
  'rgba(161, 186, 40, 0.4)', 'rgba(99, 255, 210, 0.4)', 'rgba(206, 26, 89, 0.4)', 'rgba(69, 247, 164, 0.4)',
  'rgba(232, 204, 0, 0.4)', 'rgba(25, 160, 120, 0.4)', 'rgba(9, 116, 239, 0.4)', 'rgba(62, 170, 178, 0.4)',
  'rgba(137, 237, 104, 0.4)', 'rgba(117, 237, 87, 0.4)', 'rgba(196, 98, 7, 0.4)', 'rgba(28, 100, 119, 0.4)',
  'rgba(22, 164, 247, 0.4)', 'rgba(183, 119, 36, 0.4)', 'rgba(80, 3, 127, 0.4)', 'rgba(62, 165, 28, 0.4)',
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

  return <div>
    {distribution.map((item, index) => {
      const percentage = item.minedBlock * 100 / distribution[0].minedBlock
      return <div key={item.miner}>
        <div title={item.miner}>
          <Link to={`/accounts/${item.miner}`}>{reduceText(item.miner, 0, 5)}</Link>
        </div>
        <div title={`${item.minedBlock} mined blocks`}
          style={{ width: `${percentage}%`, backgroundColor: colors[index] }}>
          {item.minedBlock}
        </div>
      </div>
    })}
  </div>
}
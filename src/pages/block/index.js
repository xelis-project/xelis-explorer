import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router'
import to from 'await-to-js'
import { Link } from 'react-router-dom'
import { useNodeSocket } from '@xelis/sdk/react/daemon'
import { usePageLoad } from 'g45-react/hooks/usePageLoad'
import { useServerData } from 'g45-react/hooks/useServerData'
import Age from 'g45-react/components/age'
import { useLang } from 'g45-react/hooks/useLang'

import { displayError, isHash, formatSize, formatXelis, formatBlock, reduceText, formatDifficulty } from '../../utils'
import PageLoading from '../../components/pageLoading'
import Button from '../../components/button'
import Transactions from './txs'
import TableFlex from '../../components/tableFlex'
import { daemonRPC } from '../../hooks/nodeRPC'
import PageTitle from '../../layout/page_title'
import Hashicon from '../../components/hashicon'
import { getBlockColor } from '../dag/blockColor'
import useTheme from '../../hooks/useTheme'
import { pools } from '../../utils/pools'

import style from './style'

function loadBlock_SSR({ id }) {
  const defaultResult = { loaded: false, err: null, block: {}, topoheight: 0 }
  return useServerData(`func:loadBlock(${id})`, async () => {
    const result = Object.assign({}, defaultResult)

    const [err1, res2] = await to(daemonRPC.getTopoHeight())
    result.err = err1 ? err1.message : null
    if (err1) return result

    result.topoheight = res2.result

    if (isHash(id)) {
      const [err1, res1] = await to(daemonRPC.getBlockByHash({
        hash: id
      }))
      result.err = err1 ? err1.message : null
      if (err1) return result

      result.block = res1.result
    } else {
      const [err1, res1] = await to(daemonRPC.getBlockAtTopoHeight({
        topoheight: parseInt(id)
      }))
      result.err = err1 ? err1.message : null
      if (err1) return result

      result.block = res1.result
    }

    result.loaded = true
    return result
  }, defaultResult)
}

function Block() {
  const { id } = useParams()

  const nodeSocket = useNodeSocket()

  const { firstPageLoad } = usePageLoad()
  const serverResult = loadBlock_SSR({ id })
  const { t } = useLang()

  const [err, setErr] = useState(serverResult.err)
  const [loading, setLoading] = useState(false)
  const [block, setBlock] = useState(serverResult.block)
  const [topoheight, setTopoheight] = useState(serverResult.topoheight)
  const { theme: currentTheme } = useTheme()

  const loadBlock = useCallback(async () => {
    if (nodeSocket.readyState !== WebSocket.OPEN) return

    setErr(null)
    setLoading(true)

    const resErr = (err) => {
      setErr(err)
      setLoading(false)
    }

    const [err, topoheight] = await to(nodeSocket.daemon.methods.getTopoHeight())
    if (err) return resErr(err)
    setTopoheight(topoheight)

    if (isHash(id)) {
      const [err, block] = await to(nodeSocket.daemon.methods.getBlockByHash({
        hash: id
      }))
      if (err) return resErr(err)
      setBlock(block)
    } else {
      const [err, block] = await to(nodeSocket.daemon.methods.getBlockAtTopoHeight({
        topoheight: parseInt(id)
      }))
      if (err) return resErr(err)
      setBlock(block)
    }

    setLoading(false)
  }, [id, nodeSocket.readyState])

  useEffect(() => {
    if (firstPageLoad && serverResult.loaded) return
    if (serverResult.err) return
    loadBlock()
  }, [loadBlock, firstPageLoad])

  const formattedBlock = useMemo(() => {
    if (!block) return {}
    return formatBlock(block, topoheight)
  }, [block, topoheight])

  const description = useMemo(() => {
    if (!block.hash) {
      return t(`Block is invalid.`)
    }

    return `
      ${t('Block {} ({}) with {} confirmations.', [block.topoheight, reduceText(block.hash), formattedBlock.confirmations])}
      ${t('The block reward was {} and mined by {}.', [formattedBlock.reward, formattedBlock.miner])}
      ${t('It contains {} transactions.', [(block.txs_hashes || 0).length])}
    `
  }, [block, formattedBlock, t])

  return <div>
    <PageLoading loading={loading} />
    <div>
      <PageTitle title={t('Block {}', [reduceText(block.hash || '')])}
        metaDescription={description}
      />
      {err && <div className={style.err}>{displayError(err)}</div>}
      {!err && <div className={style.header.container}>
        <div>
          {!loading && <>
            {t('This block was mined by {}. It currently has {} confirmations. The miner of this block earned {}.',
              [formattedBlock.miner, formattedBlock.confirmations, formattedBlock.reward])}
          </>}
        </div>
        <div className={style.header.buttons}>
          <Button link={`/dag?height=${block.height}`} icon="network-wired">DAG</Button>
          {formattedBlock.hasPreviousBlock && <Button link={`/blocks/${block.topoheight - 1}`} icon="arrow-left">
            <div>{t('Previous Block')}</div>
          </Button>}
          {formattedBlock.hasNextBlock && <Button link={`/blocks/${block.topoheight + 1}`} icon="arrow-right" iconLocation="right">
            <div>{t('Next Block')}</div>
          </Button>}
        </div>
      </div>}
      <TableFlex
        rowKey="hash"
        headers={[
          {
            key: 'hash',
            title: t('Hash'),
            render: (value, item) => {
              if (!value) return `--`
              return value
            }
          },
          {
            key: 'block_type',
            title: t('Block type'),
            render: (value, item) => {
              if (value) {
                const color = getBlockColor(currentTheme, value)
                return <div style={{ color }}>{value}</div>
              }

              return `--`
            }
          },
          {
            key: 'timestamp',
            title: t('Timestamp'),
            render: (_, item) => {
              if (item.timestamp != null) {
                return `${formattedBlock.date} (${item.timestamp})`
              }

              return `--`
            }
          },
          {
            key: 'age',
            title: t('Age'),
            render: (_, item) => {
              if (item.timestamp) {
                return <Age timestamp={item.timestamp} update format={{ secondsDecimalDigits: 0 }} />
              }

              return `--`
            }
          },
          {
            key: 'confirmations',
            title: t('Confirmations'),
            render: (value, item) => {
              if (item.hash) {
                return formattedBlock.confirmations.toLocaleString()
              }

              return `--`
            }
          },
          {
            key: 'topoheight',
            title: t('Topo Height'),
            render: (value, item) => {
              if (value != null) return value.toLocaleString()
              return `--`
            }
          },
          {
            key: 'height',
            title: t('Height'),
            render: (value, item) => {
              if (value != null) return value.toLocaleString()
              return `--`
            }
          },
          {
            key: 'miner',
            title: t('Miner'),
            render: (value) => {
              if (!value) return `--`

              return <div className={style.miner}>
                <Hashicon value={value} size={25} />
                <Link to={`/accounts/${value}`}>
                  {value}
                </Link>
                {pools[value] && <div className={style.minerName}>
                  {pools[value]}
                </div>}
              </div>
            }
          },
          /*
          // always return 0 because I'm not using include_txs
          {
            key: 'total_fees',
            title: t('Fees'),
            render: (value, item) => {
              // total_fees can be undefined even if block is valid - use hash to check instead
              if (item.hash) return formatXelis(value || 0)
              return `--`
            }
          },
          */
          {
            key: 'miner_reward',
            title: t('Miner Reward'),
            render: (value) => {
              if (value) {
                return formatXelis(value)
              }

              return `--`
            }
          },
          {
            key: 'dev_reward',
            title: t('Dev Reward'),
            render: (value) => {
              if (value) {
                return formatXelis(value)
              }

              return `--`
            }
          },
          {
            key: 'supply',
            title: t('Supply'),
            render: (value) => {
              if (value) {
                return formatXelis(value)
              }

              return `--`
            }
          },
          {
            key: 'txs_hashes',
            title: t('Txs'),
            render: (value) => value ? value.length : `--`
          },
          {
            key: 'difficulty',
            title: t('Difficulty'),
            render: (value) => {
              if (value) {
                return <div title={value}>
                  {formatDifficulty(value)}
                </div>
              }

              return `--`
            }
          },
          {
            key: 'cumulative_difficulty',
            title: t('Cumulative Difficulty'),
            render: (value) => {
              if (value) {
                return <div title={value}>
                  {formatDifficulty(value)}
                </div>
              }

              return `--`
            }
          },
          {
            key: 'nonce',
            title: t(`Nonce`),
            render: (value) => value ? value : `--`
          },
          {
            key: 'extra_nonce',
            title: t(`Extra Nonce`),
            render: (value) => value ? value : `--`
          },
          {
            key: 'hash_rate',
            title: t('Hash Rate'),
            render: (_, item) => {
              if (item.hash) {
                return formattedBlock.hashRate
              }

              return `--`
            }
          },
          {
            key: 'total_size_in_bytes',
            title: t('Size'),
            render: (value) => formatSize(value) || `--`
          },
          {
            key: 'tips',
            title: t('Tips'),
            render: (value) => {
              if (!value) return `--`

              const tips = value || []
              if (tips.length === 0) return 'No tips. This is most likely the genesis block.'

              return <div className="tips">
                {tips.map((tip, index) => {
                  return <div key={tip}>
                    {index + 1}. <Link to={`/blocks/${tip}`}>{tip}</Link>
                  </div>
                })}
              </div>
            }
          },
          {
            key: `version`,
            title: t(`Version`),
            render: (value) => value || `--`
          }
        ]}
        data={[block]}
      />
      <Transactions block={block} />
    </div>
  </div>
}

export default Block

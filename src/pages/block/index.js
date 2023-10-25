import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router'
import { Helmet } from 'react-helmet-async'
import to from 'await-to-js'
import { Link } from 'react-router-dom'
import { css } from 'goober'
import { useNodeSocket } from '@xelis/sdk/react/daemon'

import { displayError, formatHashRate, formatSize, formatXelis, formattedBlock, reduceText } from '../../utils'
import PageLoading from '../../components/pageLoading'
import Button from '../../components/button'
import Transactions from './txs'
import theme from '../../style/theme'
import { scaleOnHover } from '../../style/animate'
import TableFlex from '../../components/tableFlex'
import Age from '../../components/age'
import { useServerData } from '../../context/useServerData'
import { daemonRPC } from '../../ssr/nodeRPC'
import { usePageLoad } from '../../context/usePageLoad'

const style = {
  container: css`
    h1 {
      margin: 1.5em 0 .5em 0;
      font-weight: bold;
      font-size: 2em;
    }

    .error {
      padding: 1em;
      color: white;
      font-weight: bold;
      background-color: var(--error-color);
    }

    .controls {
      display: flex;
      flex-direction: column;
      margin-bottom: 2em;
      gap: 1em;

      > :nth-child(1) {
        line-height: 1.3em;
      }

      ${theme.query.minDesktop} {
        flex-direction: row;
        align-items: start;
        justify-content: space-between;
      }

      .buttons {
        display: flex;
        gap: 1em;

        a {
          border-radius: 30px;
          background-color: var(--text-color);
          color: var(--bg-color);
          padding: .5em 1em;
          display: flex;
          gap: .5em;
          align-items: center;
          text-wrap: nowrap;
          text-decoration: none;
          ${scaleOnHover}

          ${theme.query.maxDesktop} {
            > div {
              display: none;
            }
          }
        }
      }
    }
  `
}

function isHash(id) {
  return (/[a-z]/i.test(id))
}

function loadBlock_SSR({ id }) {
  const defaultResult = { loaded: false, err: null, block: {}, topoheight: 0 }
  return useServerData(`func:loadBlock(${id})`, async () => {
    const result = Object.assign({}, defaultResult)

    const [err1, res2] = await to(daemonRPC.getTopoHeight())
    result.err = err1
    if (err1) return result

    result.topoheight = res2.result

    if (isHash(id)) {
      const [err1, res1] = await to(daemonRPC.getBlockByHash({
        hash: id
      }))
      result.err = err1
      if (err1) return result

      result.block = res1.result
    } else {
      const [err1, res1] = await to(daemonRPC.getBlockAtTopoHeight({
        topoheight: parseInt(id)
      }))
      result.err = err1
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

  const [err, setErr] = useState()
  const [loading, setLoading] = useState(false)
  const [block, setBlock] = useState(serverResult.block)
  const [topoheight, setTopoheight] = useState(serverResult.topoheight)

  const loadBlock = useCallback(async () => {
    if (nodeSocket.readyState !== WebSocket.OPEN) return

    setErr(null)
    setLoading(true)

    const resErr = (err) => {
      setErr(err)
      setLoading(false)
    }

    const [err, topoheight] = await to(nodeSocket.daemon.getTopoHeight())
    if (err) return resErr(err)
    setTopoheight(topoheight)

    if (isHash(id)) {
      const [err, block] = await to(nodeSocket.daemon.getBlockByHash({
        hash: id
      }))
      if (err) return resErr(err)
      setBlock(block)
    } else {
      const [err, block] = await to(nodeSocket.daemon.getBlockAtTopoHeight({
        topoheight: parseInt(id)
      }))
      if (err) return resErr(err)
      setBlock(block)
    }

    setLoading(false)
  }, [id, nodeSocket])

  useEffect(() => {
    if (firstPageLoad && serverResult.loaded) return
    loadBlock()
  }, [loadBlock, firstPageLoad])

  const formatBlock = useMemo(() => {
    if (!block) return {}
    return formattedBlock(block, topoheight || 0)
  }, [block, topoheight])

  const description = useMemo(() => {
    return `
      Block ${block.topoheight} (${reduceText(block.hash)}) with ${formatBlock.confirmations} confirmations.
      The block reward was ${formatBlock.reward} and mined by ${formatBlock.miner}.
      It contains ${(block.txs_hashes || 0).length} transactions.
    `
  }, [block, formatBlock])

  return <div className={style.container}>
    <PageLoading loading={loading} />
    <div>
      <Helmet>
        <title>Block {(block.topoheight || ``).toString()}</title>
        <meta name="description" content={description} />
      </Helmet>
      <h1>Block {block.topoheight}</h1>
      {err && <div className="error">{displayError(err)}</div>}
      {!err && <div className="controls">
        <div>
          This block was mined by <strong>{formatBlock.miner}</strong>.
          It currently has <strong>{formatBlock.confirmations} confirmations</strong>.
          The miner of this block earned <strong>{formatBlock.reward}</strong>.
        </div>
        <div className="buttons">
          <Button link={`/dag?height=${block.height}`} icon="network-wired">DAG</Button>
          {formatBlock.hasPreviousBlock && <Button link={`/blocks/${block.topoheight - 1}`} icon="arrow-left">
            <div>Previous Block</div>
          </Button>}
          {formatBlock.hasNextBlock && <Button link={`/blocks/${block.topoheight + 1}`} icon="arrow-right" iconLocation="right">
            <div>Next Block</div>
          </Button>}
        </div>
      </div>}
      <TableFlex
        rowKey="hash"
        headers={[
          {
            key: 'hash',
            title: 'Hash',
          },
          {
            key: 'block_type',
            title: 'Block type',
          },
          {
            key: 'timestamp',
            title: 'Timestamp',
            //render: (value) => value && `${formatBlock.date} (${block.timestamp})`
          },
          {
            key: 'age',
            title: 'Age',
            render: (_, item) => {
              return <Age ssrId="blockAge" timestamp={item.timestamp} update format={{ secondsDecimalDigits: 0 }} />
            }
          },
          {
            key: 'confirmations',
            title: 'Confirmations',
            render: (value, item) => {
              if (formatBlock.confirmations >= 0) return formatBlock.confirmations
              return ``
            }
          },
          {
            key: 'topoheight',
            title: 'Topoheight',
          },
          {
            key: 'height',
            title: 'Height',
          },
          {
            key: 'miner',
            title: 'Miner',
            render: (value) => {
              return <Link to={`/accounts/${value}`}>{value}</Link>
            }
          },
          {
            key: 'total_fees',
            title: 'Fees',
            render: (value, item) => {
              // total_fees can be undefined even if block is valid - use hash to check instead
              if (item.hash) return formatXelis(value || 0)
              return ``
            }
          },
          {
            key: 'reward',
            title: 'Reward',
            render: (value) => value && formatXelis(value)
          },
          {
            key: 'txs_hashes',
            title: 'Txs',
            render: (value) => value ? value.length : ``
          },
          {
            key: 'difficulty',
            title: 'Difficulty',
            render: (value, item) => value && <>
              <span>{value} </span>
              <span title="Cumulative Difficulty">
                ({item.cumulative_difficulty})
              </span>
            </>,
          },
          {
            key: 'hash_rate',
            title: 'Hash Rate',
            render: (value, item) => item.difficulty && formatHashRate(item.difficulty / 15)
          },
          {
            key: 'total_size_in_bytes',
            title: 'Size',
            render: (value) => formatSize(value)
          },
          {
            key: 'tips',
            title: 'Tips',
            render: (value) => {
              const tips = value || []
              if (tips.length === 0) return 'No tips. This is most likely the genesis block.'

              return <>
                {tips.map((tip, index) => {
                  return <div key={tip}>
                    {index + 1}. <Link to={`/blocks/${tip}`}>{tip}</Link>
                  </div>
                })}
              </>
            }
          },
        ]}
        data={[block]}
      />
      <Transactions block={block} />
    </div>
  </div>
}

export default Block

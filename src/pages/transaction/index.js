import React, { useCallback, useEffect, useState, useMemo } from 'react'
import { useParams } from 'react-router'
import to from 'await-to-js'
import { Link } from 'react-router-dom'
import { useNodeSocket } from '@xelis/sdk/react/daemon'
import { css } from 'goober'
import { usePageLoad } from 'g45-react/hooks/usePageLoad'
import { useServerData } from 'g45-react/hooks/useServerData'
import { useLang } from 'g45-react/hooks/useLang'

import Table from '../../components/table'
import { formatXelis, reduceText, displayError, formatSize } from '../../utils'
import PageLoading from '../../components/pageLoading'
import TableFlex from '../../components/tableFlex'
import { daemonRPC } from '../../hooks/nodeRPC'
import PageTitle from '../../layout/page_title'
import Hashicon from '../../components/hashicon'
import { getBlockColor } from '../dag/blockColor'
import useTheme from '../../hooks/useTheme'
import EncryptedAmountModal from '../account/encrypted_amount_modal'

const style = {
  container: css`
    h2 {
      margin: 1em 0 .5em 0;
      font-weight: bold;
      font-size: 1.5em;
    }

    .error {
      padding: 1em;
      color: white;
      font-weight: bold;
      background-color: var(--error-color);
    }

    .addr {
      display: flex;
      gap: .5em;
      align-items: center;
    }

    .reference {
      display: flex;
      flex-direction: column;
      gap: .5em;
    }

    .discarded {
      color: var(--error-color);
    }

    .not-executed-yet {
      color: var(--warning-color);
    }
  `
}

function loadTransaction_SSR({ hash }) {
  const defaultResult = { loaded: false, err: null, tx: {} }
  return useServerData(`func:loadTransaction(${hash})`, async () => {
    const result = Object.assign({}, defaultResult)
    const [err, res] = await to(daemonRPC.getTransaction(hash))
    result.err = err ? err.message : null
    if (err) return result

    result.tx = res.result
    result.loaded = true
    return result
  }, defaultResult)
}

function Transaction() {
  const { hash } = useParams()

  const nodeSocket = useNodeSocket()
  const { t } = useLang()

  const { firstPageLoad } = usePageLoad()
  const serverResult = loadTransaction_SSR({ hash })

  const [err, setErr] = useState()
  const [loading, setLoading] = useState()
  const [tx, setTx] = useState(serverResult.tx)

  const loadTx = useCallback(async () => {
    if (nodeSocket.readyState !== WebSocket.OPEN) return

    setErr(null)
    setLoading(true)

    const resErr = (err) => {
      setErr(err)
      setLoading(false)
    }

    const [err, data] = await to(nodeSocket.daemon.methods.getTransaction(hash))
    if (err) return resErr(err)

    setTx(data)
    setLoading(false)
  }, [hash, nodeSocket.readyState])

  useEffect(() => {
    if (firstPageLoad && serverResult.loaded) return
    if (serverResult.err) return
    loadTx()
  }, [loadTx])

  let transfers = []
  if (tx.data && tx.data.transfers) transfers = tx.data.transfers

  let burns = []
  if (tx.data && tx.data.burn) burns = [tx.data.burn]

  const description = useMemo(() => {
    return `
      ${t('Transaction {}.', [tx.hash || `?`])}
      ${t('Signed by {}.', [reduceText(tx.source || `?`, 0, 7)])}
      ${tx.executed_in_block ? t('Executed in block {}.', [reduceText(tx.executed_in_block)]) : t('Discarded or not executed yet.')}
    `
  }, [tx, t])

  return <div className={style.container}>
    <PageLoading loading={loading} />
    <PageTitle title={t('Transaction {}', [reduceText(tx.hash || ``, 4, 4)])}
      metaTitle={t('Transaction {}', [tx.hash || ''])}
      metaDescription={description} />
    {err && <div className="error">{displayError(err)}</div>}
    <div>
      <TableFlex
        headers={[
          {
            key: 'hash',
            title: t('Hash'),
          },
          {
            key: 'source',
            title: t('Signer'),
            render: (value) => {
              return <div className="addr">
                <Hashicon value={value} size={25} />
                <Link to={`/accounts/${value}`}>
                  {value}
                </Link>
              </div>
            }
          },
          {
            key: 'in_mempool',
            title: t('In Mempool'),
            render: (value) => {
              if (value === true) return t(`Yes`)
              if (value === false) return t(`No`)
              return ``
            }
          },
          {
            key: 'signature',
            title: t('Signature'),
          },
          {
            key: 'ref',
            title: t('Reference'),
            render: (_, item) => {
              const { hash, topoheight } = item.reference || {}

              return <div>
                <Link to={`/blocks/${hash}`}>
                  {hash}
                </Link>&nbsp;
                {topoheight && <span title={t(`The topoheight was set to this block hash when building the transaction. It may be incorrect due to DAG reorg.`)}>
                  ({topoheight.toLocaleString()})
                </span>}
              </div>
            }
          },
          {
            key: 'fee',
            title: t('Fee'),
            render: (value) => value && formatXelis(value)
          },
          {
            key: 'nonce',
            title: t('Nonce'),
          },
          {
            key: 'executed_in_block',
            title: t('Executed In'),
            render: (value, item) => {
              if (value) return <Link to={`/blocks/${value}`}>{value}</Link>
              if (item.in_mempool) return <div className="not-executed-yet">{t(`Not executed yet.`)}</div>
              return <div className="discarded">{t('Discarded / not executed.')}</div>
            }
          },
        ]}
        data={[tx]}
        rowKey="hash"
      />
      <Transfers transfers={transfers} />
      <Burns burns={burns} />
      <InBlocks tx={tx} />
    </div>
  </div>
}

function Transfers(props) {
  const { transfers } = props

  const { t } = useLang()

  const formatExtraData = useCallback((extraData) => {
    // format extra_data int array to hexadecimal
    const hexData = (extraData || []).map((value) => `${value.toString(16)}`).join(``)
    return reduceText(hexData, 0, 20)
  }, [])

  return <div>
    <h2>{t('Transfers')}</h2>
    <Table
      headers={[t(`Asset`), t(`Amount`), t(`Recipient`), t(`Extra Data`)]}
      list={transfers} emptyText={t('No transfers')} colSpan={4}
      onItem={(item, index) => {
        const { commitment, asset, extra_data, destination } = item
        return <React.Fragment key={index}>
          <tr key={index}>
            <td>{reduceText(asset)}</td>
            <td>
              <EncryptedAmountModal title={t(`Amount`)} commitment={commitment} />
            </td>
            <td>
              <div className="addr">
                <Hashicon value={destination} size={25} />
                <Link to={`/accounts/${destination}`}>
                  {reduceText(destination, 0, 7)}
                </Link>
              </div>
            </td>
            <td>
              {extra_data ? formatExtraData(extra_data) : `--`}
            </td>
          </tr>
        </React.Fragment>
      }}
    />
  </div>
}

function Burns(props) {
  const { burns } = props

  const { t } = useLang()

  return <div>
    <h2>{t('Burns')}</h2>
    <Table
      headers={[t(`Asset`), t(`Amount`)]}
      list={burns} emptyText={t('No burns')} colSpan={2}
      onItem={(item, index) => {
        const { amount, asset } = item
        return <tr key={index}>
          <td>{reduceText(asset)}</td>
          <td>{formatXelis(amount)}</td> {/* We assume it's native asset for now */}
        </tr>
      }}
    />
  </div>
}

function InBlocks(props) {
  const { tx } = props

  const { t } = useLang()
  const nodeSocket = useNodeSocket()
  const [err, setErr] = useState()
  const [loading, setLoading] = useState()
  const [blocks, setBlocks] = useState([])
  const { theme: currentTheme } = useTheme()

  const loadTxBlocks = useCallback(async () => {
    if (nodeSocket.readyState !== WebSocket.OPEN) return


    setLoading(true)
    setErr(null)

    const resErr = () => {
      setLoading(false)
      setErr(err)
    }

    const blocks = []
    for (let i = 0; i < (tx.blocks || []).length; i++) {
      const hash = tx.blocks[i]
      const [err, data] = await to(nodeSocket.daemon.methods.getBlockByHash({
        hash: hash
      }))
      if (err) return resErr(err)
      blocks.push(data)
    }

    setLoading(false)
    setBlocks(blocks)
  }, [tx, nodeSocket.readyState])

  useEffect(() => {
    loadTxBlocks()
  }, [loadTxBlocks])

  return <div>
    <h2>{t('In Blocks')}</h2>
    <Table
      headers={[t(`Topo Height`), t(`Hash`), t(`Type`), t(`Size`), t(`Fees`), t(`Timestamp`), t(`Txs`)]}
      list={blocks} loading={loading} err={err} emptyText={t('No blocks')} colSpan={7}
      onItem={(item, index) => {
        const size = formatSize(item.total_size_in_bytes)
        const time = new Date(item.timestamp).toLocaleString()
        const txCount = item.txs_hashes.length.toLocaleString()
        return <tr key={item.hash}>
          <td>
            {item.topoheight ? <Link to={`/blocks/${item.topoheight}`}>
              {item.topoheight.toLocaleString()}
            </Link> : `--`}
          </td>
          <td><Link to={`/blocks/${item.hash}`}>{reduceText(item.hash)}</Link></td>
          <td style={{ color: getBlockColor(currentTheme, item.block_type) }}>{item.block_type}</td>
          <td>{size}</td>
          <td>{formatXelis(item.total_fees)}</td>
          <td>{time}</td>
          <td>{txCount}</td>
        </tr>
      }}
    />
  </div>
}

export default Transaction

import React, { useCallback, useEffect, useState, useMemo } from 'react'
import { useParams } from 'react-router'
import to from 'await-to-js'
import { Link } from 'react-router-dom'
import { useNodeSocket } from '@xelis/sdk/react/daemon'
import { usePageLoad } from 'g45-react/hooks/usePageLoad'
import { useServerData } from 'g45-react/hooks/useServerData'
import { useLang } from 'g45-react/hooks/useLang'
import useLocale from 'g45-react/hooks/useLocale'

import Table from '../../components/table'
import { formatXelis, reduceText, displayError, formatSize, formatAssetName } from '../../utils'
import PageLoading from '../../components/pageLoading'
import TableFlex from '../../components/tableFlex'
import { daemonRPC } from '../../node_rpc'
import PageTitle from '../../layout/page_title'
import Hashicon from '../../components/hashicon'
import { getBlockColor } from '../dag/blockColor'
import useTheme from '../../hooks/useTheme'
import EncryptedAmountModal from '../account/encrypted_amount_modal'
import { formatAddr } from '../../utils/known_addrs'

import style from './style'

function loadTransaction_SSR({ hash }) {
  const defaultResult = { loaded: false, err: null, tx: {} }
  return useServerData(`func:loadTransaction(${hash})`, async () => {
    const result = Object.assign({}, defaultResult)
    const [err, tx] = await to(daemonRPC.getTransaction(hash))
    result.err = err ? err.message : null
    if (err) return result

    result.tx = tx
    result.loaded = true
    return result
  }, defaultResult)
}

function Transaction() {
  const { hash } = useParams()

  const nodeSocket = useNodeSocket()
  const { t } = useLang()
  const locale = useLocale()

  const { firstPageLoad } = usePageLoad()
  const serverResult = loadTransaction_SSR({ hash })

  const [err, setErr] = useState(serverResult.err)
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

  const description = useMemo(() => {
    return `
      ${t('Transaction {}.', [tx.hash || `?`])}
      ${t('Signed by {}.', [reduceText(tx.source || `?`, 0, 7)])}
      ${tx.executed_in_block ? t('Executed in block {}.', [reduceText(tx.executed_in_block)]) : t('Discarded or not executed yet.')}
    `
  }, [tx, t])

  return <div>
    <PageLoading loading={loading} />
    <PageTitle title={t('Transaction {}', [reduceText(tx.hash || ``, 4, 4)])}
      metaTitle={t('Transaction {}', [tx.hash || ''])}
      metaDescription={description} />
    {err && <div className={style.error}>{displayError(err)}</div>}
    <div>
      <TableFlex
        headers={[
          {
            key: 'hash',
            title: t('Hash'),
            render: (value) => value || `--`
          },
          {
            key: 'source',
            title: t('Signer'),
            render: (value) => {
              if (value) {
                return <div className={style.addr}>
                  <Hashicon value={value} size={25} />
                  <Link to={`/accounts/${value}`}>
                    {value}
                  </Link>
                </div>
              }

              return `--`
            }
          },
          {
            key: 'in_mempool',
            title: t('In Mempool'),
            render: (value) => {
              if (value === true) return t(`Yes`)
              if (value === false) return t(`No`)
              return `--`
            }
          },
          {
            key: 'signature',
            title: t('Signature'),
            render: (value) => value || `--`
          },
          {
            key: 'ref_hash',
            title: t('Ref (hash)'),
            render: (_, item) => {
              if (!item.reference) return `--`
              const { hash } = item.reference
              if (!hash) return `--`

              return <Link to={`/blocks/${hash}`}>
                {hash}
              </Link>
            }
          },
          {
            key: 'ref_topo',
            title: t('Ref (topo)'),
            render: (_, item) => {
              if (!item.reference) return `--`
              const { topoheight } = item.reference
              if (!topoheight) return `--`

              return <Link to={`/blocks/${topoheight}`} title={t(`The topoheight was set to this block hash when building the transaction. It may be incorrect due to DAG reorg.`)}>
                {topoheight.toLocaleString(locale)}
              </Link>
            }
          },
          {
            key: 'fee',
            title: t('Fee'),
            render: (value) => value ? formatXelis(value) : `--`
          },
          {
            key: 'size',
            title: t('Size'),
            render: (value) => value ? formatSize(value) : `--`
          },
          {
            key: 'nonce',
            title: t('Nonce'),
            render: (value) => value != null ? value : `--`
          },
          {
            key: 'version',
            title: t(`Version`),
            render: (value) => value || `--`
          },
          {
            key: 'executed_in_block',
            title: t('Executed In'),
            render: (value, item) => {
              if (value) return <Link to={`/blocks/${value}`}>{value}</Link>
              if (item.in_mempool) return <div className={style.notExecutedYet}>{t(`Not executed yet.`)}</div>
              return <div className={style.discarded}>{t('Discarded / not executed.')}</div>
            }
          },
        ]}
        data={[tx]}
        rowKey="hash"
      />
      <MultiSig tx={tx} />
      <MultiSigSetup tx={tx} />
      <Transfers tx={tx} />
      <Burn tx={tx} />
      <InBlocks tx={tx} />
    </div>
  </div>
}

function Transfers(props) {
  const { tx } = props

  const { t } = useLang()

  const formatExtraData = useCallback((extraData) => {
    // format extra_data int array to hexadecimal
    const hexData = (extraData || []).map((value) => `${value.toString(16)}`).join(``)
    return reduceText(hexData, 0, 20)
  }, [])

  let transfers = []
  if (tx.data && tx.data.transfers) transfers = tx.data.transfers
  if (transfers.length === 0) return null // completely hide if empty

  return <div>
    <h2 className={style.title}>{t('Transfers ({})', [transfers.length])}</h2>
    <Table
      headers={[t(`Asset`), t(`Amount`), t(`Recipient`), t(`Extra Data`)]}
      list={transfers} emptyText={t('No transfers')} colSpan={4}
      onItem={(item, index) => {
        const { commitment, asset, extra_data, destination } = item
        return <React.Fragment key={index}>
          <tr key={index}>
            <td>{formatAssetName(asset)}</td>
            <td>
              <EncryptedAmountModal title={t(`Amount`)} commitment={commitment} />
            </td>
            <td>
              <div className={style.addr}>
                <Hashicon value={destination} size={25} />
                <Link to={`/accounts/${destination}`}>
                  {formatAddr(destination, 0, 7)}
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

function Burn(props) {
  const { tx } = props

  const { t } = useLang()

  let burns = []
  if (tx.data && tx.data.burn) burns = [tx.data.burn]
  if (burns.length === 0) return null // completely hide if empty

  return <div>
    <h2 className={style.title}>{t('Burn')}</h2>
    <Table
      headers={[t(`Asset`), t(`Amount`)]}
      list={burns} emptyText={t('No burn')} colSpan={2}
      onItem={(item, index) => {
        const { amount, asset } = item
        return <tr key={index}>
          <td>{formatAssetName(asset)}</td>
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
    <h2 className={style.title}>{t('In Blocks')}</h2>
    <Table
      headers={[t(`Topo Height`), t(`Hash`), t(`Type`), t(`Size`), t(`Fees`), t(`Txs`)]}
      list={blocks} loading={loading} err={err} emptyText={t('No blocks')} colSpan={7}
      onItem={(item, index) => {
        const size = formatSize(item.total_size_in_bytes)
        const txCount = (item.txs_hashes || []).length.toLocaleString()
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
          <td>{txCount}</td>
        </tr>
      }}
    />
  </div>
}

function MultiSig(props) {
  const { tx } = props
  const { t } = useLang()

  if (!tx.multisig) return
  const signatures = tx.multisig.signatures || []

  return <div>
    <h2 className={style.title}>{t('MultiSig')}</h2>
    <Table
      headers={[`#`, t(`Signature`)]}
      list={signatures} emptyText={t('No signatures')} colSpan={2}
      onItem={(sig) => {
        const { id, signature } = sig
        return <tr key={id}>
          <td>{id}</td>
          <td>{signature}</td>
        </tr>
      }}
    />
  </div>
}

function MultiSigSetup(props) {
  const { tx } = props
  const { t } = useLang()

  let multi_sig = tx.data ? tx.data.multi_sig : null
  if (!multi_sig) return


  return <div>
    <h2 className={style.title}>{t('MultiSig Setup')}</h2>
    <TableFlex
      data={[{
        treshold: multi_sig.threshold,
        participants: (multi_sig.participants || []).length
      }]}
      headers={[
        {
          key: 'treshold',
          title: t('Min Threshold')
        },
        {
          key: 'participants',
          title: t('Participants')
        },
      ]}
    /><br />
    <Table
      headers={[`#`, t(`Address`)]}
      list={multi_sig.participants} emptyText={t('No participants')} colSpan={2}
      onItem={(addr, index) => {
        let sAddr = addr.join('')
        return <tr key={sAddr}>
          <td>{index}</td>
          <td>{sAddr}</td>
        </tr>
      }}
    />
  </div>
}

export default Transaction

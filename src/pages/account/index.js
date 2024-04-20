import { useParams } from 'react-router'
import useNodeSocket, { useNodeSocketSubscribe } from '@xelis/sdk/react/daemon'
import { useState, useCallback, useEffect, useMemo } from 'react'
import to from 'await-to-js'
import { css } from 'goober'
import { Link } from 'react-router-dom'
import Age from 'g45-react/components/age'
import Icon from 'g45-react/components/fontawesome_icon'
import { useLang } from 'g45-react/hooks/useLang'

import TableFlex from '../../components/tableFlex'
import { XELIS_ASSET, XELIS_ASSET_DATA, formatAsset, formatXelis, reduceText } from '../../utils'
import theme from '../../style/theme'
import Dropdown from '../../components/dropdown'
import Button from '../../components/button'
import PageTitle from '../../layout/page_title'
import useQueryString from 'g45-react/hooks/useQueryString'
import Hashicon from '../../components/hashicon'
import { scaleOnHover } from '../../style/animate'
import AddressQRCodeModal from './addr_qrcode_modal'
import EncryptedAmountModal from './encrypted_amount_modal'
import { RPCEvent } from '@xelis/sdk/daemon/types'

const style = {
  container: css`
    h2 {
      margin: 0 0 .5em 0;
      font-weight: bold;
      font-size: 1.5em;
    }

    .page-content {
      display: flex;
      gap: 1em;
      flex-direction: column;

      ${theme.query.minDesktop} {
        flex-direction: row;
      }
    }

    .account {
      flex: 1;
      min-width: 250px;
    }

    .history-table {
      flex: 3;

      > div > :nth-child(2) {
        margin-top: .5em;
        display: flex;
        gap: .5em;

        button {
          display: flex;
          gap: .5em;
          align-items: center;
          border-radius: 25px;
          border: thin solid var(--text-color);
          transition: .1s all;
          background: none;
          color: var(--text-color);
          cursor: pointer;
          padding: 0.5em 1em;
          font-weight: bold;
        }
      }
    }

    .from-to {
      display: flex;
      gap: .5em;
      align-items: center;
    }
  `,
  account: css`
    display: flex;
    gap: 1em;
    flex-direction: column;
    background-color: var(--table-td-bg-color);
    padding: 1em;
    border-top: .3em solid var(--table-th-bg-color);
    border-radius: .5em;

    .top-content {
      display: flex;
      gap: 1em;
      flex-direction: column;
      position: relative;
    }

    .hashicon {
      padding: 1em;
      border-radius: 50%;
      background-color: #333333;
      display: flex;
      justify-content: center;
      margin: 0 auto;
    }

    .addr {
      max-width: 300px;
      margin: 0 auto;
      word-break: break-all;
      text-align: center;
      font-size: 1.3em;
    }

    .buttons {
      position: absolute;
      right: 0;

      button {
        display: flex;
        gap: .5em;
        align-items: center;
        background: transparent;
        border: thin solid var(--text-color);
        border-radius: 0.5em;
        padding: 0.25em;
        color: var(--text-color);
        font-size: 1em;
        cursor: pointer;
        ${scaleOnHover()}
      }
    }

    .item {
      display: flex;
      gap: .5em;
      flex-direction: column;

      .subtitle {
        color: var(--muted-color);
        font-size: 1em;
      }

      .value {
        font-size: 1.4em;
      }

      .subvalue {
        font-size: .8em;
        margin-top: 0.25em;
      }
    }
  `
}

/*
// removed ssr for the time being

function loadAccount_SSR({ addr }) {
  const defaultResult = { loaded: false, err: null, account: {} }
  return useServerData(`func:loadAccount(${addr})`, async () => {
    const result = Object.assign({}, defaultResult)
    const [err, res] = await to(daemonRPC.getLastBalance({
      address: addr,
      asset: XELIS_ASSET,
    }))
    result.err = err
    if (err) return result

    const [err2, res2] = await to(daemonRPC.getNonce({
      address: addr,
    }))
    result.err = err2
    if (err2) return result2

    result.account = { addr, balance: res.result, nonce: res2.result }
    result.loaded = true
    return result
  }, defaultResult)
}
*/

function Account() {
  const { addr } = useParams()

  const nodeSocket = useNodeSocket()
  const { t } = useLang()

  //const serverResult = loadAccount_SSR({ addr })

  const [qrCodeVisible, setQRCodeVisible] = useState(false)
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState()
  const [account, setAccount] = useState({})
  const [accountAssets, setAccountAssets] = useState([XELIS_ASSET])
  const [asset, setAsset] = useState(XELIS_ASSET)
  const [assetData, setAssetData] = useState(XELIS_ASSET_DATA)
  const [reloadHistory, setReloadHistory] = useState()

  const loadAccount = useCallback(async () => {
    if (nodeSocket.readyState !== WebSocket.OPEN) return

    setErr(null)
    setLoading(true)

    const resErr = (err) => {
      setErr(err)
      setLoading(false)
    }

    const [err, result] = await to(nodeSocket.daemon.methods.getBalance({
      address: addr,
      asset: asset,
    }))
    if (err) return resErr(err)

    const [err2, result2] = await to(nodeSocket.daemon.methods.getNonce({
      address: addr,
    }))
    if (err2) return resErr(err2)

    const [err3, result3] = await to(nodeSocket.daemon.methods.getBlockAtTopoHeight({
      topoheight: result.topoheight,
      include_txs: false
    }))
    if (err3) return resErr(err3)

    const [err4, result4] = await to(nodeSocket.daemon.methods.getAccountAssets(addr))
    if (err4) return resErr(err4)

    // we don't need to fetch asset decimals if it's xelis - we have it hardcoded
    if (asset !== XELIS_ASSET) {
      const [err5, result5] = await to(nodeSocket.daemon.methods.getAsset({ asset }))
      if (err5) return resErr(err5)
      setAssetData(result5)
    }

    setAccount({
      addr,
      balance: result.version,
      nonce: result2.nonce,
      topoheight: result.topoheight,
      timestamp: result3.timestamp
    })
    setAccountAssets(result4)

    setLoading(false)
  }, [asset, addr, nodeSocket.readyState])

  useEffect(() => {
    //if (firstPageLoad && serverResult.loaded) return
    loadAccount()
  }, [loadAccount])

  useNodeSocketSubscribe({
    event: RPCEvent.NewBlock,
    onData: async () => {
      const [err, balance] = await to(nodeSocket.daemon.methods.getBalance({
        address: addr,
        asset: asset,
      }))
      if (err) return console.log(err)

      if (balance.topoheight > account.topoheight) {
        // reload
        loadAccount()
        setReloadHistory(Date.now)
      }
    }
  }, [account])

  const onAssetChange = useCallback((item) => {
    setAsset(item.key)
  }, [])

  const dropdownAssets = useMemo(() => {
    return accountAssets.map((asset) => {
      return {
        key: asset,
        text: `${reduceText(asset)}${asset === XELIS_ASSET ? ` (XEL)` : ``}`
      }
    })
  }, [accountAssets])

  const description = useMemo(() => {
    return t(`Account history of {}.`, [addr])
  }, [addr, t])

  const balance = account.balance || {}
  const finalBalance = balance.final_balance || {}
  const commitment = finalBalance.commitment || []

  return <div className={style.container}>
    <PageTitle title={t('Account {}', [reduceText(addr)])}
      metaTitle={t('Account {}', [addr || ''])}
      metaDescription={description} />
    <div className="page-content">
      <div className="account">
        <div className={style.account}>
          <div className="top-content">
            <div className="buttons">
              <button onClick={() => setQRCodeVisible(true)}>
                <Icon name="qrcode" />
              </button>
            </div>
            <div className="hashicon">
              <Hashicon value={addr} size={50} />
            </div>
            <div className="addr">
              {addr}
            </div>
          </div>
          <div className="item">
            <div className="subtitle">{t('Asset')}</div>
            <div className="value">
              <Dropdown items={dropdownAssets} onChange={onAssetChange}
                size={.8} value={XELIS_ASSET} />
            </div>
          </div>
          <div className="item">
            <div className="subtitle">{t('Balance')}</div>
            <div className="value">
              <EncryptedAmountModal title={t(`Balance`)} commitment={commitment} />
            </div>
          </div>
          <div className="item">
            <div className="subtitle">{t('Last Activity')}</div>
            <div className="value">
              {account.topoheight ? <>
                <div>
                  <Age timestamp={account.timestamp} update format={{ compact: false, secondsDecimalDigits: 0 }} />
                </div>
                <div className="subvalue">
                  <Link to={`/blocks/${account.topoheight}`}>
                    {account.topoheight.toLocaleString()}
                  </Link>
                </div>
              </> : `--`}
            </div>
          </div>
          <div className="item">
            <div className="subtitle">{t('Nonce')}</div>
            <div className="value">{account.nonce >= 0 ? account.nonce : `--`}</div>
          </div>
        </div>
      </div>
      <div className="history-table">
        <History reloadHistory={reloadHistory} addr={addr} asset={asset} assetData={assetData} />
      </div>
    </div>
    <AddressQRCodeModal addr={addr} visible={qrCodeVisible} setVisible={setQRCodeVisible} />
  </div>
}

export default Account

/*
function loadAccountHistory_SSR() {
  const defaultResult = { err: null, history: [], loaded: false }
  return useServerData(`func:loadAccountHistory`, async () => {
    let result = Object.assign({}, defaultResult)

    const [err, res] = await to(daemonRPC.getAccountHistory({
      address
    }))
    result.err = err
    if (err) return result

    result.history = res.result
    result.loaded = true
    return result
  }, [])
}
*/

function History(props) {
  const { asset, assetData, addr, reloadHistory } = props

  const nodeSocket = useNodeSocket()

  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState()
  const [history, setHistory] = useState([])
  const { t } = useLang()

  const [query, setQuery] = useQueryString()

  const [pageState, _setPageState] = useState(() => {
    if (query.max_topo) {
      const maxTopo = parseInt(query.max_topo)
      return { page: 0, pages: [maxTopo] }
    }
    return { page: -1, pages: [] }
  })

  const setPageState = useCallback((value) => {
    _setPageState(value)

    const { pages } = value
    if (pages.length > 0) {
      const lastTopo = pages[pages.length - 1]
      setQuery({ max_topo: lastTopo })
    } else {
      setQuery({})
    }
  }, [])

  const loadHistory = useCallback(async () => {
    if (nodeSocket.readyState !== WebSocket.OPEN) return

    setLoading(true)
    setErr(null)
    const resErr = (err) => {
      setErr(err)
      setLoading(false)
    }

    const params = {
      address: addr,
      asset: asset,
    }

    const { pages, page } = pageState
    if (pages[page]) {
      params.maximum_topoheight = pages[page]
    }

    const [err1, result1] = await to(nodeSocket.daemon.methods.hasBalance({
      address: addr,
      asset: asset,
    }))
    if (err1) return resErr(err1)
    
    if (result1.exist) {
      const [err2, result2] = await to(nodeSocket.daemon.methods.getAccountHistory(params))
      if (err2) return resErr(err2)
  
      setHistory(result2)
    } else {
      setHistory([])
    }

    setLoading(false)
  }, [reloadHistory, asset, addr, nodeSocket.readyState, pageState]) // reload if acount balance topoheight changed

  useEffect(() => {
    loadHistory()
  }, [loadHistory])

  const getType = useCallback((item) => {
    if (item.mining) return `MINING`
    if (item.burn) return `BURN`
    if (item.outgoing) return `OUTGOING`
    if (item.incoming) return `INCOMING`
    if (item.dev_fee) return `DEV_FEE`
    return ``
  }, [])

  return <div>
    <TableFlex loading={loading} err={err} rowKey={(item, index) => {
      return `${item.hash}_${index}`
    }}
      emptyText={t('No history')} keepTableDisplay
      headers={[
        {
          key: "topoheight",
          title: t('Topo Height'),
          render: (value) => {
            return <Link to={`/blocks/${value}`}>
              {value.toLocaleString()}
            </Link>
          }
        },
        {
          key: "hash",
          title: t('Hash'),
          render: (value, item) => {
            let link = ``
            const itemType = getType(item)

            if (itemType === 'INCOMING' || itemType === 'OUTGOING' || itemType === 'BURN') {
              link = `/txs/${value}`
            }

            if (itemType === 'MINING') {
              link = `/blocks/${value}`
            }

            return <Link to={link}>
              {reduceText(value)}
            </Link>
          }
        },
        {
          key: "type",
          title: t('Type'),
          render: (_, item) => {
            const itemType = getType(item)
            switch (itemType) {
              case "OUTGOING":
                return <><Icon name="arrow-up" />&nbsp;&nbsp;{t(`SEND`)}</>
              case "INCOMING":
                return <><Icon name="arrow-down" />&nbsp;&nbsp;{t(`RECEIVE`)}</>
              case "MINING":
                return <><Icon name="microchip" />&nbsp;&nbsp;{t(`MINING`)}</>
              case "DEV_FEE":
                return <><Icon name="wallet" />&nbsp;&nbsp;{t(`DEV FEE`)}</>
              case "BURN":
                return <><Icon name="fire" />&nbsp;&nbsp;{t(`BURN`)}</>
              default:
                return null
            }
          }
        },
        {
          key: "from_to",
          title: t('From / To'),
          render: (_, item) => {
            const itemType = getType(item)
            switch (itemType) {
              case "INCOMING":
                const { from } = item.incoming
                return <div className="from-to">
                  <Hashicon value={from} size={25} />
                  <Link to={`/accounts/${from}`}>
                    {reduceText(from, 0, 7)}
                  </Link>
                </div>
              case "OUTGOING":
                const { to } = item.outgoing
                return <div className="from-to">
                  <Hashicon value={to} size={25} />
                  <Link to={`/accounts/${to}`}>
                    {reduceText(to, 0, 7)}
                  </Link>
                </div>
              case "MINING":
              case "DEV_FEE":
                return `Coinbase`
              default:
                return `--`
            }
          }
        },
        {
          key: "amount",
          title: t('Amount'),
          render: (_, item) => {
            const itemType = getType(item)
            const { decimals } = assetData
            switch (itemType) {
              case "OUTGOING":
                return <><Icon name="lock" />&nbsp;&nbsp;{t(`ENCRYPTED`)}</>
              case "INCOMING":
                return <><Icon name="lock" />&nbsp;&nbsp;{t(`ENCRYPTED`)}</>
              case "MINING":
                const { mining } = item
                return formatXelis(mining.reward)
              case "DEV_FEE":
                const { dev_fee } = item
                return formatXelis(dev_fee.reward)
              case "BURN":
                const { burn } = item
                return formatAsset(burn.amount, decimals)
              default:
                return null
            }
          }
        },
        {
          key: "block_timestamp",
          title: t('Age'),
          render: (value) => {
            return <Age timestamp={value} update />
          }
        }
      ]} data={history} />
    <div>
      {pageState.pages.length > 0 && <Button icon="arrow-left" onClick={() => {
        const newPageState = Object.assign({}, pageState)
        newPageState.pages.pop()
        newPageState.page--

        setPageState(newPageState)
      }}>
        {t('Previous')}
      </Button>}
      <Button icon="arrow-right" iconLocation="right" onClick={() => {
        const newPageState = Object.assign({}, pageState)
        const item = history[history.length - 1]
        newPageState.pages.push(item.topoheight - 1)
        newPageState.page++

        setPageState(newPageState)
      }}>
        {t('Next')}
      </Button>
    </div>
  </div>
}
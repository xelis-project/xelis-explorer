import { useParams } from 'react-router'
import useNodeSocket, { useNodeSocketSubscribe } from '@xelis/sdk/react/daemon'
import React, { useState, useCallback, useEffect, useMemo } from 'react'
import to from 'await-to-js'
import { Link } from 'react-router-dom'
import Age from 'g45-react/components/age'
import Icon from 'g45-react/components/fontawesome_icon'
import { useLang } from 'g45-react/hooks/useLang'
import { RPCEvent } from '@xelis/sdk/daemon/types'
import useQueryString from 'g45-react/hooks/useQueryString'

import TableFlex from '../../components/tableFlex'
import { XELIS_ASSET, XELIS_ASSET_DATA, formatAsset, formatXelis, groupBy, reduceText } from '../../utils'
import Dropdown from '../../components/dropdown'
import Button from '../../components/button'
import PageTitle from '../../layout/page_title'
import Hashicon from '../../components/hashicon'
import AddressQRCodeModal from './addr_qrcode_modal'
import EncryptedAmountModal from './encrypted_amount_modal'
import { addrs, formatAddr } from '../../utils/known_addrs'

import style from './style'
import Table from '../../components/table'

/*
// removed ssr for the time being

function loadAccount_SSR({ addr }) {
  const defaultResult = { loaded: false, err: null, account: {} }
  return useServerData(`func:loadAccount(${addr})`, async () => {
    const result = Object.assign({}, defaultResult)
    const [err, balance] = await to(daemonRPC.getLastBalance({
      address: addr,
      asset: XELIS_ASSET,
    }))
    result.err = err
    if (err) return result

    const [err2, nonce] = await to(daemonRPC.getNonce({
      address: addr,
    }))
    result.err = err2
    if (err2) return result2

    result.account = { addr, balance, nonce }
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
  //const [addr, setAddr] = useState(paramAddr)
  const [qrCodeVisible, setQRCodeVisible] = useState(false)
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState()
  const [account, setAccount] = useState({})
  const [accountAssets, setAccountAssets] = useState([XELIS_ASSET])
  const [asset, setAsset] = useState(XELIS_ASSET)
  const [assetData, setAssetData] = useState(XELIS_ASSET_DATA)
  const [direction, setDirection] = useState(``)
  const [integrated, setIntegrated] = useState()

  const loadAccount = useCallback(async () => {
    if (nodeSocket.readyState !== WebSocket.OPEN) return

    setErr(null)
    setLoading(true)

    const resErr = (err) => {
      setErr(err)
      setLoading(false)
    }

    const [err, valid] = await to(nodeSocket.daemon.methods.validateAddress({
      address: addr,
      allow_integrated: true
    }))
    if (err) return resErr(err)

    if (valid.is_integrated) {
      const [err, integrated] = await to(nodeSocket.daemon.methods.splitAddress({
        address: addr,
      }))
      if (err) return resErr(err)
      setIntegrated(integrated)
    }

    const [err1, result] = await to(nodeSocket.daemon.methods.getBalance({
      address: addr,
      asset: asset,
    }))
    //console.log(err1)
    if (err1) return resErr(err1)

    const [err2, result2] = await to(nodeSocket.daemon.methods.getNonce({
      address: addr,
    }))
    if (err2) return resErr(err2)

    const [err3, result3] = await to(nodeSocket.daemon.methods.getBlockAtTopoheight({
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

    const [err6, result6] = await to(nodeSocket.daemon.methods.getAccountRegistrationTopoheight(addr))
    if (err6) return resErr(err6)

    const [err7, result7] = await to(nodeSocket.daemon.methods.getBlockAtTopoheight({
      topoheight: result6,
      include_txs: false
    }))
    if (err7) return resErr(err7)

    setAccount({
      addr,
      balance: result.version,
      nonce: result2.nonce,
      topoheight: result.topoheight,
      timestamp: result3.timestamp,
      registered: {
        topoheight: result6,
        timestamp: result7.timestamp
      }
    })
    setAccountAssets(result4)

    setLoading(false)
  }, [asset, addr, nodeSocket.readyState])

  useEffect(() => {
    //if (firstPageLoad && serverResult.loaded) return
    loadAccount()
  }, [loadAccount])

  const description = useMemo(() => {
    return t(`Account history of {}.`, [addr])
  }, [addr, t])

  const entity = addrs[addr]

  return <div>
    <PageTitle title={t('Account {}', [reduceText(addr)])}
      metaTitle={t('Account {}', [addr || ''])}
      metaDescription={description} />
    {integrated && <div className={style.account.topInfo}>
      <Icon name="warning" />
      <div>
        {t(`This is an integrated address of`)}<br />
        <Link to={`/accounts/${integrated.address}`} className={style.account.infoBreak}>
          {integrated.address}
        </Link>
        <div className={style.account.topSubInfo}>
          {t(`Note that all wallet transactions are shown, not just those for this integrated address. The wallet owner is the only one who can determine the transactions for this specific integrated address.`)}
        </div>
      </div>
    </div>}
    {entity && <div className={style.account.topInfo}>
      <Icon name="tag" />
      <div>
        {t(`This is a known address owned by ${entity.name}.`)}<br />
        {entity.link && <>{t(`You can visit the website at `)}<a href={entity.link} target="_blank">{entity.link}</a>.</>}
      </div>
    </div>}
    <div className={style.account.container}>
      <div className={style.account.left}>
        <AccountInfo account={account} addr={addr} setAsset={setAsset} asset={asset}
          direction={direction} setDirection={setDirection} accountAssets={accountAssets} setQRCodeVisible={setQRCodeVisible} />
      </div>
      <div className={style.account.right}>
        <History addr={addr} asset={asset} assetData={assetData}
          account={account} loadAccount={loadAccount} direction={direction} />
      </div>
    </div>
    <AddressQRCodeModal addr={addr} visible={qrCodeVisible} setVisible={setQRCodeVisible} />
  </div>
}

export default Account

function AccountInfo(props) {
  const { account, addr, accountAssets, setQRCodeVisible, asset, setAsset, setDirection, direction } = props

  const { t } = useLang()

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

  const dropdownDirectionItems = useMemo(() => {
    return [{
      key: ``,
      text: <><Icon name="arrows-up-down" />&nbsp;&nbsp;{t(`All Directions`)}</>
    }, {
      key: `outgoing_flow`,
      text: <><Icon name="arrow-up" />&nbsp;&nbsp;{t(`Outgoing`)}</>
    },
    {
      key: `incoming_flow`,
      text: <><Icon name="arrow-down" />&nbsp;&nbsp;{t(`Incoming`)}</>
    }]
  }, [])

  const onDirectionChange = useCallback((item) => {
    setDirection(item.key)
  }, [])

  const balance = account.balance || {}
  const finalBalance = balance.final_balance || {}
  const commitment = finalBalance.commitment || []

  return <div className={style.account.leftBg}>
    <div className={style.accountDetails.container}>
      <div className={style.accountDetails.qrCode}>
        <button onClick={() => setQRCodeVisible(true)}>
          <Icon name="qrcode" />
        </button>
      </div>
      <div className={style.accountDetails.hashicon}>
        <Hashicon value={addr} size={50} />
      </div>
      <div className={style.accountDetails.addr}>
        {addr}
      </div>
    </div>
    <div className={style.account.item.container}>
      <div className={style.account.item.title}>{t('Asset')}</div>
      <div className={style.account.item.value}>
        <Dropdown items={dropdownAssets} onChange={onAssetChange} value={asset} />
      </div>
    </div>
    <div className={style.account.item.container}>
      <div className={style.account.item.title}>{t('Direction')}</div>
      <div className={style.account.item.value}>
        <Dropdown items={dropdownDirectionItems} onChange={onDirectionChange} value={direction} />
      </div>
    </div>
    <div className={style.account.item.container}>
      <div className={style.account.item.title}>{t('Balance')}</div>
      <div className={style.account.item.value}>
        <EncryptedAmountModal title={t(`Balance`)} commitment={commitment} />
      </div>
    </div>
    <div className={style.account.item.container}>
      <div className={style.account.item.title}>{t('Last Activity')}</div>
      <div className={style.account.item.value}>
        {account.topoheight ? <>
          <div>
            <Age timestamp={account.timestamp} update format={{ compact: false, secondsDecimalDigits: 0 }} />
          </div>
          <div className={style.account.item.subvalue}>
            <Link to={`/blocks/${account.topoheight}`}>
              {account.topoheight.toLocaleString()}
            </Link>
          </div>
        </> : `--`}
      </div>
    </div>
    <div className={style.account.item.container}>
      <div className={style.account.item.title}>{t('Nonce')}</div>
      <div className={style.account.item.value}>{account.nonce >= 0 ? account.nonce : `--`}</div>
    </div>
    <div className={style.account.item.container}>
      <div className={style.account.item.title}>{t('Registered')}</div>
      <div className={style.account.item.value}>
        {account.registered ? <>
          <div>
            {new Date(account.registered.timestamp).toLocaleString()}
          </div>
          <div className={style.account.item.subvalue}>
            <Link to={`/blocks/${account.registered.topoheight}`}>
              {account.registered.topoheight.toLocaleString()}
            </Link>
          </div>
        </> : `--`}
      </div>
    </div>
  </div>
}

/*
function loadAccountHistory_SSR() {
  const defaultResult = { err: null, history: [], loaded: false }
  return useServerData(`func:loadAccountHistory`, async () => {
    let result = Object.assign({}, defaultResult)

    const [err, history] = await to(daemonRPC.getAccountHistory({
      address
    }))
    result.err = err
    if (err) return result

    result.history = history
    result.loaded = true
    return result
  }, [])
}
*/

function History(props) {
  const { asset, assetData, addr, account, loadAccount, direction } = props

  const nodeSocket = useNodeSocket()

  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState()
  const [history, setHistory] = useState([])
  const { t } = useLang()

  const [query, setQuery] = useQueryString({})

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

    switch (direction) {
      case `incoming_flow`:
        params.outgoing_flow = false
        params.incoming_flow = true
        break
      case `outgoing_flow`:
        params.outgoing_flow = true
        params.incoming_flow = false
        break
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

      // group same hash meaning in the same tx
      const group = groupBy(result2, (x) => x.hash)
      setHistory([...group])
    } else {
      setHistory([])
    }

    setLoading(false)
  }, [asset, addr, nodeSocket.readyState, pageState, direction]) // reload if acount balance topoheight changed

  useEffect(() => {
    loadHistory()
  }, [loadHistory])

  useNodeSocketSubscribe({
    event: RPCEvent.NewBlock,
    onData: async () => {
      const [err, balance] = await to(nodeSocket.daemon.methods.getBalance({
        address: addr,
        asset: asset,
      }))
      if (err) return console.log(err)

      if (balance.topoheight > account.topoheight) {
        loadAccount()

        if (pageState.page < 0) {
          loadHistory()
        }
      }
    }
  }, [account, pageState, loadAccount, loadHistory])

  const getType = useCallback((item) => {
    if (item.mining) return `MINING`
    if (item.burn) return `BURN`
    if (item.outgoing) return `OUTGOING`
    if (item.incoming) return `INCOMING`
    if (item.dev_fee) return `DEV_FEE`
    if (item.invoke_contract) return `INVOKE_CONTRACT`
    if (`deploy_contract` in item) return `DEPLOY_CONTRACT`
    if (item.multi_sig) return `MULTI_SIG`
    return ``
  }, [])


  const lastTopoheight = useMemo(() => {
    const item = history[history.length - 1]
    if (item && item.length > 0) return item[1][0].topoheight
  }, [history])

  const getLink = useCallback((item) => {
    const hType = getType(item)

    switch (hType) {
      case 'INCOMING':
      case 'OUTGOING':
      case 'BURN':
      case 'MULTI_SIG':
        return `/txs/${item.hash}`
      case 'MINING':
        return `/blocks/${item.hash}`
    }
  }, [])

  const displayType = useCallback((item) => {
    const hType = getType(item)
    switch (hType) {
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
      case "INVOKE_CONTRACT":
        return <><Icon name="file-contract" />&nbsp;&nbsp;{t(`INVOKE CONTRACT`)}</>
      case "DEPLOY_CONTRACT":
        return <><Icon name="upload" />&nbsp;&nbsp;{t(`DEPLOY CONTRACT`)}</>
      case "MULTI_SIG":
        return <><Icon name="pen" />&nbsp;&nbsp;{t(`MULTI SIG`)}</>
      default:
        return null
    }
  }, [])

  const displayTransfer = useCallback((item) => {
    const hType = getType(item)
    switch (hType) {
      case "INCOMING":
        const { from } = item.incoming
        return <div className={style.account.fromTo}>
          <Hashicon value={from} size={25} />
          <Link to={`/accounts/${from}`}>
            {formatAddr(from)}
          </Link>
        </div>
      case "OUTGOING":
        const { to } = item.outgoing
        return <div className={style.account.fromTo}>
          <Hashicon value={to} size={25} />
          <Link to={`/accounts/${to}`}>
            {formatAddr(to)}
          </Link>
        </div>
      case "MINING":
      case "DEV_FEE":
        return `Coinbase`
      case "MULTI_SIG":
        return `${(item.multi_sig.participants || []).length} participants`
      default:
        return `--`
    }
  }, [])

  const displayAmount = useCallback((item) => {
    const hType = getType(item)
    const { decimals } = assetData
    switch (hType) {
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
        return formatAsset({ value: burn.amount, decimals })
      default:
        return `--`
    }
  }, [assetData])

  const [showTransfers, setShowTransfers] = useState([])
  const toggleTransfer = useCallback((hash) => {
    if (showTransfers.indexOf(hash) === -1) {
      setShowTransfers([...showTransfers, hash])
    } else {
      setShowTransfers(showTransfers.filter(h => h !== hash))
    }
  }, [showTransfers])

  return <div>
    <Table list={history} emptyText={t('No history')} loading={loading} err={err}
      headers={[t(`Topo Height`), t(`Hash`), t(`Type`), t(`Transfers`), t(`Amount`), t(`Age`)]} colSpan={6}
      onItem={(item) => {
        const hash = item[0]
        const list = item[1]
        const value = list[0]
        const { topoheight, block_timestamp } = list[0]
        const visibleTransfers = showTransfers.indexOf(hash) !== -1

        return <React.Fragment key={hash}>
          <tr>
            <td>
              <Link to={`/blocks/${topoheight}`}>
                {topoheight.toLocaleString()}
              </Link>
            </td>
            <td>
              <Link to={getLink(value)}>
                {reduceText(hash)}
              </Link>
            </td>
            <td>
              {displayType(value)}
            </td>
            <td>
              {list.length === 1 && displayTransfer(value)}
              {list.length > 1 && <button className={style.transfers.button} onClick={() => toggleTransfer(hash)}>
                {t(`{} transfers`, [list.length])}
                <Icon name={visibleTransfers ? `arrow-up` : `arrow-down`} />
              </button>}
            </td>
            <td>
              {displayAmount(value)}
            </td>
            <td>
              <Age timestamp={block_timestamp} update />
            </td>
          </tr>
          {list.length > 1 && <TransferRows items={list} visible={visibleTransfers} />}
        </React.Fragment>
      }}
    />
    <div className={style.pagination}>
      {pageState.pages.length > 0 && <Button icon="arrow-left" onClick={() => {
        const newPageState = Object.assign({}, pageState)
        newPageState.pages.pop()
        newPageState.page--

        setPageState(newPageState)
      }}>
        {t('Previous')}
      </Button>}
      {((account.registered && lastTopoheight && lastTopoheight > account.registered.topoheight)) &&
        <Button icon="arrow-right" iconLocation="right" onClick={() => {
          const newPageState = Object.assign({}, pageState)
          newPageState.pages.push(lastTopoheight - 1)
          newPageState.page++

          setPageState(newPageState)
        }}>
          {t('Next')}
        </Button>
      }
    </div>
  </div>
}

function TransferRows(props) {
  const { items, visible } = props

  const getAddr = useCallback((item) => {
    if (item.incoming) return item.incoming.from
    if (item.outgoing) return item.outgoing.to
  }, [])

  return <tr className={style.transfers.rows} data-visible={visible}>
    <td colSpan={6}>
      <div className={style.transfers.container}>
        <table>
          <tbody>
            {items.map((item, index) => {
              const addr = getAddr(item)
              return <tr key={index}>
                <td>{index}</td>
                <td>
                  {visible && <Hashicon value={addr} size={25} />}
                </td>
                <td>
                  <Link to={`/accounts/${addr}`}>{addr}</Link>
                </td>
              </tr>
            })}
          </tbody>
        </table>
      </div>
    </td>
  </tr>
}
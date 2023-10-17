import { Helmet } from 'react-helmet-async'
import { useParams } from 'react-router'
import useNodeSocket from '@xelis/sdk/react/daemon'
import { useState, useCallback, useEffect, useRef } from 'react'
import to from 'await-to-js'
import { css } from 'goober'
import { Link } from 'react-router-dom'

import TableFlex from '../../components/tableFlex'
import { XELIS_ASSET, formatAsset, formatXelis, reduceText } from '../../utils'
import Age from '../../components/age'
import { useServerData } from '../../context/useServerData'
import { daemonRPC } from '../../ssr/nodeRPC'
import { usePageLoad } from '../../context/usePageLoad'
import Icon from '../../components/icon'
import theme from '../../style/theme'
import Button from '../../components/button'

const style = {
  container: css`
    h1 {
      margin: 1.5em 0 .5em 0;
      font-weight: bold;
      font-size: 2em;
    }

    h2 {
      margin: 0 0 .5em 0;
      font-weight: bold;
      font-size: 1.5em;
    }

    select {
      width: 100%;
      padding: 0.5em;
      border: none;
      border-radius: 10px;
      font-size: .7em;
      outline: none;
      cursor: pointer;
    }

    .page {
      display: flex;
      gap: 1em;
      flex-direction: column;

      ${theme.query.minDesktop} {
        flex-direction: row;
      }

      > :nth-child(1) {
        flex: 1;
        min-width: 200px;

        > div {
          display: flex;
          gap: 1em;
          flex-direction: column;

          background-color: var(--table-td-bg-color);
          padding: 1em;
          border-top: 3px solid var(--table-th-bg-color);
          > div {
            display: flex;
            gap: .5em;
            flex-direction: column;

            > :nth-child(1) {
              color: var(--muted-color);
              font-size: 1em;
            }
  
            > :nth-child(2) {
              font-size: 1.4em;
            }
          }
        }
      }

      > :nth-child(2) {
        overflow: auto;
        flex: 3;
      }

      .pager {
        display: flex;
        gap: .5em;
        margin-top: .5em;

        > button {
          display: flex;
          gap: .5em;
          align-items: center;
          border-radius: 25px;
          border: none;
          background-color: var(--text-color);
          cursor: pointer;
          padding: 0.5em 1em;
          font-weight: bold;
        }
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

  const { firstPageLoad } = usePageLoad()
  //const serverResult = loadAccount_SSR({ addr })

  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState()
  const [account, setAccount] = useState({})
  const [accountAssets, setAccountAssets] = useState([])
  const [asset, setAsset] = useState(XELIS_ASSET)

  const loadAccount = useCallback(async () => {
    if (nodeSocket.readyState !== WebSocket.OPEN) return

    setErr(null)
    setLoading(true)

    const resErr = (err) => {
      setErr(err)
      setLoading(false)
    }

    const [err, result] = await to(nodeSocket.daemon.getLastBalance({
      address: addr,
      asset: asset,
    }))
    if (err) return resErr(err)

    const [err2, result2] = await to(nodeSocket.daemon.getNonce({
      address: addr,
    }))
    if (err2) return resErr(err2)


    const [err3, result3] = await to(nodeSocket.daemon.getAccountAssets(addr))
    if (err3) return resErr(err3)

    setAccount({ addr, balance: result, nonce: result2 })
    setAccountAssets(result3)
    setLoading(false)
  }, [asset, addr, nodeSocket])

  useEffect(() => {
    //if (firstPageLoad && serverResult.loaded) return
    loadAccount()
  }, [loadAccount])

  const onAssetChange = useCallback((e) => {
    const newAsset = e.target.value
    setAsset(newAsset)
  }, [])

  const balance = account.balance ? account.balance.balance.balance : 0
  const nonce = account.nonce ? account.nonce.nonce : `--`

  return <div className={style.container}>
    <Helmet>
      <title>Account {addr || ''}</title>
    </Helmet>
    <h1>Account {reduceText(addr)}</h1>
    <div className="page">
      <div>
        <div>
          <div>
            <div>Address</div>
            <div style={{ wordBreak: `break-all` }}>{addr}</div>
          </div>
          <div>
            <div>Assets</div>
            <div>
              <select onChange={onAssetChange} value={asset}>
                {accountAssets.map((asset) => {
                  return <option value={asset} key={asset}>
                    {`${reduceText(asset)}${asset === XELIS_ASSET ? ` (XEL)` : ``}`}
                  </option>
                })}
              </select>
            </div>
          </div>
          <div>
            <div>Balance</div>
            <div>{formatXelis(balance)}</div>
          </div>
          <div>
            <div>Nonce</div>
            <div>{nonce}</div>
          </div>
        </div>
      </div>
      <div>
        <History addr={addr} asset={asset} />
      </div>
    </div>
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
  const { asset, addr } = props

  const nodeSocket = useNodeSocket()

  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState()
  const [history, setHistory] = useState([])

  const loadData = useCallback(async () => {
    if (nodeSocket.readyState !== WebSocket.OPEN) return

    setLoading(true)
    setErr(null)
    const resErr = (err) => {
      setErr(err)
      setLoading(false)
    }

    const [err, result] = await to(nodeSocket.daemon.getAccountHistory({
      address: addr,
      asset: asset,
    }))
    if (err) return resErr(err)

    setHistory(result)
    setLoading(false)
  }, [asset, addr, nodeSocket])

  useEffect(() => {
    loadData()
  }, [loadData])

  const getType = useCallback((item) => {
    if (item.mining) return `MINING`
    if (item.burn) return `BURN`
    if (item.outgoing) return `OUTGOING`
    if (item.incoming) return `INCOMING`
    return ``
  }, [])


  return <div>
    <TableFlex loading={loading} err={err} rowKey={(item, index) => {
      return `${item.hash}_${index}`
    }}
      emptyText="No history" keepTableDisplay
      headers={[
        {
          key: "topoheight",
          title: "Topo Height",
          render: (value) => {
            return <Link to={`/blocks/${value}`}>
              {value}
            </Link>
          }
        },
        {
          key: "hash",
          title: "Hash",
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
          title: "Type",
          render: (_, item) => {
            const itemType = getType(item)
            switch (itemType) {
              case "OUTGOING":
                return <><Icon name="arrow-up" />&nbsp;&nbsp;SEND</>
              case "INCOMING":
                return <><Icon name="arrow-down" />&nbsp;&nbsp;RECEIVE</>
              case "MINING":
                return <><Icon name="microchip" />&nbsp;&nbsp;MINING</>
              case "BURN":
                return <><Icon name="fire" />&nbsp;&nbsp;BURN</>
              default:
                return null
            }
          }
        },
        {
          key: "amount",
          title: "Amount",
          render: (_, item) => {
            const itemType = getType(item)
            const { outgoing, incoming, mining, burn } = item
            switch (itemType) {
              case "OUTGOING":
                return formatAsset(outgoing.amount, asset)
              case "INCOMING":
                return formatAsset(incoming.amount, asset)
              case "MINING":
                return formatAsset(mining.reward, asset)
              case "BURN":
                return formatAsset(burn.amount, asset)
              default:
                return null
            }
          }
        },
        {
          key: "from",
          title: "From",
          render: (_, item) => {
            const itemType = getType(item)
            switch (itemType) {
              case "INCOMING":
              /*return <Link to={`/accounts/${item.recipient}`}>
                {reduceText(item.from)}
              </Link>*/
              case "MINING":
                return `Coinbase`
              default:
                return `--`
            }
          }
        },
        {
          key: "block_timestamp",
          title: "Age",
          render: (value) => {
            return <Age timestamp={value} update />
          }
        }
      ]} data={history} />
  </div>
}
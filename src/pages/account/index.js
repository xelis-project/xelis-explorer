import { useParams } from 'react-router'
import useNodeSocket from '@xelis/sdk/react/daemon'
import { useState, useCallback, useEffect, useMemo } from 'react'
import to from 'await-to-js'
import { css } from 'goober'
import { Link } from 'react-router-dom'
import { usePageLoad } from 'g45-react/hooks/usePageLoad'
import Age from 'g45-react/components/age'
import Icon from 'g45-react/components/fontawesome_icon'
import { useLang } from 'g45-react/hooks/useLang'

import TableFlex from '../../components/tableFlex'
import { XELIS_ASSET, formatAsset, formatXelis, reduceText } from '../../utils'
import theme from '../../style/theme'
import Dropdown from '../../components/dropdown'
import Button from '../../components/button'
import PageTitle from '../../layout/page_title'

const style = {
  container: css`
    h2 {
      margin: 0 0 .5em 0;
      font-weight: bold;
      font-size: 1.5em;
    }

    > :nth-child(2) {
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
          border-top: .3em solid var(--table-th-bg-color);
          border-radius: .5em;

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

        > :nth-child(2) {
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

  const { firstPageLoad } = usePageLoad()
  //const serverResult = loadAccount_SSR({ addr })

  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState()
  const [account, setAccount] = useState({})
  const [accountAssets, setAccountAssets] = useState([XELIS_ASSET])
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

  const balance = account.balance ? account.balance.balance.balance : 0
  const nonce = account.nonce ? account.nonce.nonce : `--`

  const description = useMemo(() => {
    return t(`Account history of {}.`, [addr])
  }, [addr, t])

  return <div className={style.container}>
    <PageTitle title={t('Account {}', [reduceText(addr)])}
      metaTitle={t('Account {}', [addr || ''])}
      metaDescription={description} />
    <div>
      <div>
        <div>
          <div>
            <div>{t('Address')}</div>
            <div style={{ wordBreak: `break-all` }}>{addr}</div>
          </div>
          <div>
            <div>{t('Assets')}</div>
            <div>
              <Dropdown items={dropdownAssets} onChange={onAssetChange}
                size={.8} value={XELIS_ASSET} />
            </div>
          </div>
          <div>
            <div>{t('Balance')}</div>
            <div>{formatXelis(balance)}</div>
          </div>
          <div>
            <div>{t('Nonce')}</div>
            <div>{nonce}</div>
          </div>
        </div>
      </div>
      <History addr={addr} asset={asset} />
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

  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState()
  const [history, setHistory] = useState([])
  const { t } = useLang()

  const [pages, setPages] = useState([])
  const [page, setPage] = useState(-1)

  const loadData = useCallback(async () => {
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

    if (pages[page]) {
      params.maximum_topoheight = pages[page]
    }

    const [err, result] = await to(nodeSocket.daemon.getAccountHistory(params))
    if (err) return resErr(err)

    setHistory(result)
    setLoading(false)
  }, [asset, addr, nodeSocket.readyState, pages, page])

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
      emptyText={t('No history')} keepTableDisplay
      headers={[
        {
          key: "topoheight",
          title: t('Topo'),
          render: (value) => {
            return <Link to={`/blocks/${value}`}>
              {value}
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
          title: t('Amount'),
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
          title: t('From'),
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
          title: t('Age'),
          render: (value) => {
            return <Age timestamp={value} update />
          }
        }
      ]} data={history} />
    <div>
      {pages.length > 0 && <Button icon="arrow-left" onClick={() => {
        const newPage = page - 1
        if (newPage < 0) {
          setPages([])
          setPage(-1)
        } else {
          setPage(newPage)
        }
      }}>
        {t('Previous')}
      </Button>}
      <Button icon="arrow-right" iconLocation="right" onClick={() => {
        const item = history[history.length - 1]
        setPages([...pages, item.topoheight - 1])
        setPage(page + 1)
      }}>
        {t('Next')}
      </Button>
    </div>
  </div>
}
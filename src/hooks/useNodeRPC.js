import { useCallback } from 'react'

const useNodeRPC = () => {
  const rpcPost = useCallback(async (method, params) => {
    try {
      const res = await fetch(NODE_RPC_ENDPOINT, {
        method: `POST`,
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: method,
          id: 1,
          params,
        })
      })

      if (res.ok) {
        const data = await res.json()
        return Promise.resolve(data.result)
      } else {
        return Promise.reject(new Error(`${res.status} - ${res.statusText}`))
      }
    } catch (err) {
      return Promise.reject(err)
    }
  }, [])

  const getHeight = useCallback(() => {
    return rpcPost(`get_height`)
  }, [])

  const getTopoHeight = useCallback(() => {
    return rpcPost(`get_topoheight`)
  }, [])

  const getBlockTemplate = useCallback((address) => {
    return rpcPost(`get_block_template`, { address })
  }, [])

  const getBlockAtTopoHeight = useCallback((topoheight) => {
    return rpcPost(`get_block_at_topoheight`, { topoheight })
  }, [])

  const getBlocksAtHeight = useCallback((height) => {
    return rpcPost(`get_blocks_at_height`, { height })
  }, [])

  const getBlockByHash = useCallback((hash) => {
    return rpcPost(`get_block_by_hash`, { hash })
  }, [])

  const getTopBlock = useCallback(() => {
    return rpcPost(`get_top_block`, { include_txs: false })
  }, [])

  const getNonce = useCallback((address) => {
    return rpcPost(`get_nonce`, { address })
  }, [])

  const getBalance = useCallback((address, asset) => {
    return rpcPost(`get_balance`, { address, asset })
  }, [])

  const getAssets = useCallback(() => {
    return rpcPost(`get_assets`)
  }, [])

  const countTransactions = useCallback(() => {
    return rpcPost(`count_transactions`)
  }, [])

  const getTips = useCallback(() => {
    return rpcPost(`get_tips`)
  }, [])

  const p2pStatus = useCallback(() => {
    return rpcPost(`p2p_status`)
  }, [])

  const getInfo = useCallback(() => {
    return rpcPost(`get_info`)
  }, [])

  const getBlocksRangeByHeight = useCallback((start, end) => {
    return rpcPost(`get_blocks_range_by_height`, {
      start_height: start,
      end_height: end
    })
  }, [])

  const getBlocksRangeByTopoheight = useCallback((start, end) => {
    return rpcPost(`get_blocks_range_by_topoheight`, {
      start_topoheight: start,
      end_topoheight: end
    })
  }, [])

  const getMemPool = useCallback(() => {
    return rpcPost(`get_mempool`)
  }, [])

  const getTransaction = useCallback((hash) => {
    return rpcPost(`get_transaction`, { hash })
  }, [])

  const getTransactions = useCallback((hashes) => {
    return rpcPost(`get_transactions`, { tx_hashes: hashes })
  }, [])

  return {
    getTopBlock, getHeight, getTopoHeight, getBlockTemplate,
    getBlockAtTopoHeight, getBlockByHash, getBlocksAtHeight,
    getNonce, getBalance, getAssets, countTransactions,
    getTips, p2pStatus, getInfo, getBlocksRangeByHeight,
    getBlocksRangeByTopoheight, getMemPool,
    getTransaction, getTransactions
  }
}

export default useNodeRPC

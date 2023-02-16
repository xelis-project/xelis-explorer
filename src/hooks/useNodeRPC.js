import { useCallback, useEffect, useRef, useState } from 'react'

const useNodeRPC = () => {
  const rpcFetch = useCallback(async (method, params) => {
    const res = await fetch(NODE_RPC_ENDPOINT, {
      method: `POST`,
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: method,
        id: 1,
        params,
      })
    })

    const data = await res.json()
    return data.result
  }, [])

  const getHeight = useCallback(() => {
    return rpcFetch(`get_height`)
  }, [])

  const getTopoHeight = useCallback(() => {
    return rpcFetch(`get_topoheight`)
  }, [])

  const getBlockTemplate = useCallback((address) => {
    return rpcFetch(`get_block_template`, { address })
  }, [])

  const getBlockAtTopoHeight = useCallback((topoheight) => {
    return rpcFetch(`get_block_at_topoheight`, { topoheight })
  }, [])

  const getBlocksAtHeight = useCallback((height) => {
    return rpcFetch(`get_blocks_at_height`, { height })
  }, [])

  const getBlockByHash = useCallback((hash) => {
    return rpcFetch(`get_block_by_hash`, { hash })
  }, [])

  const getTopBlock = useCallback(() => {
    return rpcFetch(`get_top_block`, { include_txs: false })
  }, [])

  const getNonce = useCallback((address) => {
    return rpcFetch(`get_nonce`, { address })
  }, [])

  const getBalance = useCallback((address, asset) => {
    return rpcFetch(`get_balance`, { address, asset })
  }, [])

  const getAssets = useCallback(() => {
    return rpcFetch(`get_assets`)
  }, [])

  const countTransactions = useCallback(() => {
    return rpcFetch(`count_transactions`)
  }, [])

  const getTips = useCallback(() => {
    return rpcFetch(`get_tips`)
  }, [])

  const p2pStatus = useCallback(() => {
    return rpcFetch(`p2p_status`)
  }, [])

  const getInfo = useCallback(() => {
    return rpcFetch(`get_info`)
  }, [])

  return {
    getTopBlock, getHeight, getTopoHeight, getBlockTemplate,
    getBlockAtTopoHeight, getBlockByHash, getBlocksAtHeight,
    getNonce, getBalance, getAssets, countTransactions,
    getTips, p2pStatus, getInfo
  }
}

export default useNodeRPC

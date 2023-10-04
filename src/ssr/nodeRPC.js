import DaemonRPC from '@xelis/sdk/daemon/rpc'

import { settingsKeys, defaultSettings } from '../context/useSettings'

const endpoint = defaultSettings[settingsKeys.NODE_RPC_ENDPOINT]
export const daemonRPC = new DaemonRPC(endpoint)

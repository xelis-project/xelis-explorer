import DaemonRPC from '@xelis/sdk/daemon/rpc'

import { settingsKeys, defaultSettings } from './settings'

const endpoint = defaultSettings[settingsKeys.NODE_RPC_ENDPOINT]
export const daemonRPC = new DaemonRPC(endpoint)

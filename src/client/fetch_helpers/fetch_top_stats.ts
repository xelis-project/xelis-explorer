import { DiskSize, GetInfoResult, P2PStatusResult, RPCMethod } from "@xelis/sdk/daemon/types";
import { XelisNode } from "../app/xelis_node";

export type TopStatsInfo = GetInfoResult & {
    stable_topoheight: number;
};

export interface TopStatsData {
    info: TopStatsInfo;
    size: DiskSize;
    p2p_status: P2PStatusResult;
    account_count: number;
    asset_count: number;
    contract_count: number;
    tx_count: number;
}

export const fetch_top_stats = async (node: XelisNode) => {
    const requests = [
        { method: RPCMethod.GetInfo },
        { method: RPCMethod.GetSizeOnDisk },
        { method: RPCMethod.P2PStatus },
        { method: RPCMethod.CountAccounts },
        { method: RPCMethod.CountAssets },
        { method: RPCMethod.CountContracts },
        { method: RPCMethod.CountTransactions }
    ];

    const res = await node.rpc.batchRequest(requests);
    const top_stats = {} as TopStatsData;
    res.forEach((result, i) => {
        if (result instanceof Error) {
            throw result;
        }

        switch (i) {
            case 0:
                top_stats.info = result as TopStatsInfo;
                break;
            case 1:
                top_stats.size = result as DiskSize;
                break;
            case 2:
                top_stats.p2p_status = result as P2PStatusResult;
                break;
            case 3:
                top_stats.account_count = result as number;
                break;
            case 4:
                top_stats.asset_count = result as number;
                break;
            case 5:
                top_stats.contract_count = result as number;
                break;
            case 6:
                top_stats.tx_count = result as number;
                break;
        }
    });

    return top_stats;
}

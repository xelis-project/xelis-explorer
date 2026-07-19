import { RPCRequest, } from "@xelis/sdk/rpc/types";
import { XelisNode } from "../app/xelis_node";
import { Block, RPCMethod as DaemonRPCMethod, GetContractBalanceParams, GetContractBalanceResult, GetContractModuleResult, TransactionResponse } from "@xelis/sdk/daemon/types";

export interface ContractInfo {
    transaction: TransactionResponse;
    module: GetContractModuleResult;
    balance?: GetContractBalanceResult;
    block: Block;
}

const contract_balances_request_size = 20;

export const fetch_contract_balances = async (contract: string, assets: string[]) => {
    const node = XelisNode.instance();

    const balances = [] as GetContractBalanceResult[];

    for (let i = 0; i < assets.length; i += contract_balances_request_size) {
        const assets_chunk = assets.slice(i, i + contract_balances_request_size);
        const requests = [] as RPCRequest[];

        assets_chunk.forEach((asset) => {
            requests.push({
                method: DaemonRPCMethod.GetContractBalance,
                params: {
                    contract,
                    asset
                } as GetContractBalanceParams
            });
        });

        const res = await node.rpc.batchRequest(requests);
        res.forEach((result, j) => {
            if (result instanceof Error) {
                throw result;
            }

            balances[i + j] = result as GetContractBalanceResult;
        });
    }

    return balances;
}

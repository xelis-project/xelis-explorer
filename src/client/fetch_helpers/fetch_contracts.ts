import { RPCRequest, } from "@xelis/sdk/rpc/types";
import { XelisNode } from "../app/xelis_node";
import { Block, RPCMethod as DaemonRPCMethod, GetBlockByHashParams, GetContractBalanceParams, GetContractBalanceResult, GetContractModuleParams, GetContractModuleResult, Transaction, TransactionResponse } from "@xelis/sdk/daemon/types";
import { XELIS_ASSET } from "@xelis/sdk/config";

export interface ContractInfo {
    transaction: TransactionResponse;
    module: GetContractModuleResult;
    balance?: GetContractBalanceResult;
    block?: Block;
}

export const fetch_contracts = async (contracts: string[]) => {
    const node = XelisNode.instance();

    if (contracts.length > 10) {
        throw "limit of 10 contracts";
    }

    const contracts_info = [] as ContractInfo[];

    {
        const requests = [] as RPCRequest[];
        contracts.forEach((contract) => {
            requests.push({
                method: DaemonRPCMethod.GetTransaction,
                params: { hash: contract }
            });

            requests.push({
                method: DaemonRPCMethod.GetContractBalance,
                params: { contract, asset: XELIS_ASSET } as GetContractBalanceParams
            });
        });

        const res = await node.rpc.batchRequest(requests);
        let contract_index = 0;
        res.forEach((result, i) => {
            const data_index = i % 2;
            switch (data_index) {
                // GetTransaction
                case 0:
                    if (result instanceof Error) {
                        throw result;
                    }

                    contracts_info[contract_index] = {
                        transaction: result
                    } as ContractInfo;

                    break;
                // GetContractBalance (XEL)
                case 1:
                    if (result instanceof Error) {
                        // API returns an error if the contract does not have a balance
                        contracts_info[contract_index].balance = undefined;
                    } else {
                        contracts_info[contract_index].balance = result as GetContractBalanceResult;
                    }

                    contract_index++;
                    break;
                default:
                    throw "should not hit";
            }
        });
    }

    {
        const requests = [] as RPCRequest[];

        contracts_info.forEach((info) => {
            if (info.transaction.executed_in_block) {
                requests.push({
                    method: DaemonRPCMethod.GetBlockByHash,
                    params: { hash: info.transaction.executed_in_block } as GetBlockByHashParams
                });
            }
        });

        if (requests.length > 0) {
            const block_contracts = contracts_info.filter((info) => info.transaction.executed_in_block);
            const res = await node.rpc.batchRequest(requests);
            res.forEach((result, i) => {
                // The request list only contains contracts with an executed
                // block, so it cannot be indexed directly into contracts_info.
                const contract_info = block_contracts[i];
                if (!contract_info || result instanceof Error) return;

                contract_info.block = result as Block;
            });
        }
    }


    return contracts_info;
}

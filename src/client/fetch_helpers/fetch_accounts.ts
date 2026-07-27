import { RPCMethod as DaemonRPCMethod, GetBalanceParams, GetBalanceResult, GetNonceParams, GetNonceResult } from "@xelis/sdk/daemon/types";
import { XelisNode } from "../app/xelis_node";
import { RPCRequest } from "@xelis/sdk/rpc/types";
import { XELIS_ASSET } from "@xelis/sdk/config";

interface AccountInfo {
    addr: string;
    registration_topo: number;
    balance: GetBalanceResult;
    nonce: GetNonceResult;
}

export const fetch_accounts = async (addrs: string[]) => {
    const node = XelisNode.instance();
    const batch_size = 20;
    const requests_per_account = 3;
    const addresses_per_batch = Math.floor(batch_size / requests_per_account);
    const accounts = [] as AccountInfo[];

    for (let i = 0; i < addrs.length; i += addresses_per_batch) {
        const batch_addrs = addrs.slice(i, i + addresses_per_batch);
        const requests = [] as RPCRequest[];

        batch_addrs.forEach((address) => {
            requests.push({
                method: DaemonRPCMethod.GetAccountRegistrationTopoheight,
                params: { address }
            });

            requests.push({
                method: DaemonRPCMethod.GetBalance,
                params: { address, asset: XELIS_ASSET } as GetBalanceParams
            });

            requests.push({
                method: DaemonRPCMethod.GetNonce,
                params: { address } as GetNonceParams
            });
        });

        const res = await node.rpc.batchRequest(requests);
        let account_index = 0;

        res.forEach((result, request_index) => {
            if (result instanceof Error) {
                throw result;
            }

            const data_index = request_index % requests_per_account;
            switch(data_index) {
                case 0:
                    accounts.push({
                        addr: batch_addrs[account_index],
                        registration_topo: result
                    } as AccountInfo);
                    break;
                case 1:
                    accounts[accounts.length - 1].balance = result as GetBalanceResult;
                    break;
                case 2:
                    accounts[accounts.length - 1].nonce = result as GetNonceResult;
                    account_index++;
                    break;
                default:
                    throw "should not hit";
            }
        });
    }

    return accounts;
}

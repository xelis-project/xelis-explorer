import { Context } from "hono";
import { Page } from "../page";
import { ServerApp } from "../../../server";
import { XelisNode } from "../../app/xelis_node";
import DaemonRPC from '@xelis/sdk/daemon/rpc';
import { Master } from "../../components/master/master";
import { TransactionInfo } from "./components/info/info";
import { TransactionExtra } from "./components/extra/extra";
import { TransactionInBlocks } from "./components/in_blocks/in_blocks";
import { Block, RPCEvent as DaemonRPCEvent, RPCMethod as DaemonRPCMethod, GetBlockByHashParams, TransactionExecuted, TransactionResponse } from "@xelis/sdk/daemon/types";
import { NotFoundPage } from "../not_found/not_found";
import { RPCRequest } from "@xelis/sdk/rpc/types";
import { TransactionTransfers } from "./components/transfers/transfers";
import { TransactionBurn } from "./components/burn/burn";
import { TransactionDeployContract } from "./components/deploy_contract/deploy_contract";
import { TransactionInvokeContract } from "./components/invoke_contract/invoke_contract";
import { TransactionContractLogs } from "./components/contract_logs/contract_logs";
import { TransactionMultiSig } from "./components/multisig/multisig";
import { TransactionMempoolAlert } from "./components/mempool_alert/mempool_alert";
import { localization } from "../../localization/localization";
import { Container } from "../../components/container/container";
import { reduce_text } from "../../utils/reduce_text";

import './transaction.css';

interface TransactionPageServerData {
    transaction?: TransactionResponse;
    in_blocks: Block[];
}

export class TransactionPage extends Page {
    static pathname = "/tx/:id";

    static get_pattern_id = (href: string) => {
        const pattern_result = this.exec_pattern(href);
        if (pattern_result) {
            const id = pattern_result.pathname.groups.id;
            return id;
        }
    }

    static async load_server_data(daemon: DaemonRPC, tx_hash: string) {
        const server_data = { transaction: undefined, in_blocks: [] } as TransactionPageServerData;

        server_data.transaction = await daemon.getTransaction(tx_hash);

        {
            const tx_blocks = server_data.transaction.blocks;
            if (tx_blocks && tx_blocks.length > 0) {
                const requests = [] as RPCRequest[];
                tx_blocks.forEach((block_hash) => {
                    requests.push({
                        method: DaemonRPCMethod.GetBlockByHash,
                        params: { hash: block_hash } as GetBlockByHashParams
                    });
                });

                const res = await daemon.batchRequest(requests);
                res.forEach((result) => {
                    if (result instanceof Error) {
                        throw result;
                    } else {
                        server_data.in_blocks.push(result as Block);
                    }
                });
            }
        }

        return server_data;
    }

    static async handle_server(c: Context<ServerApp>) {
        let id = TransactionPage.get_pattern_id(c.req.url);
        if (!id) {
            this.status = 404;
            return;
        }

        this.server_data = undefined;

        const daemon = new DaemonRPC(c.get(`node_endpoint`));

        const tx_hash = id;
        this.title = localization.get_text(`Transaction {}`, [reduce_text(tx_hash)]);
        this.description = localization.get_text(`Transaction details of {}`, [tx_hash]);

        try {
            this.server_data = await this.load_server_data(daemon, tx_hash);
        } catch {
            this.status = 404;
        }
    }

    master: Master;
    page_data: {
        server_data?: TransactionPageServerData;
    };
    sub_container_1: HTMLDivElement;
    transaction_mempool_alert: TransactionMempoolAlert;
    transaction_info: TransactionInfo;
    transaction_extra: TransactionExtra;
    transaction_in_blocks: TransactionInBlocks;
    transaction_type_container: HTMLDivElement;

    constructor() {
        super();

        this.page_data = {};
        this.master = new Master();
        this.master.content.classList.add(`xe-transaction`);
        this.element.appendChild(this.master.element);

        const container_1 = document.createElement(`div`);
        container_1.classList.add(`xe-transaction-container-1`);
        this.master.content.appendChild(container_1);

        this.sub_container_1 = document.createElement(`div`);
        this.sub_container_1.classList.add(`xe-transaction-sub-container-1`);
        container_1.appendChild(this.sub_container_1);


        this.transaction_mempool_alert = new TransactionMempoolAlert();

        this.transaction_info = new TransactionInfo();
        this.sub_container_1.appendChild(this.transaction_info.container.element);
        this.transaction_extra = new TransactionExtra();
        this.sub_container_1.appendChild(this.transaction_extra.container.element);
        this.transaction_in_blocks = new TransactionInBlocks();
        //this.sub_container_1.appendChild(this.transaction_in_blocks.container.element);

        this.transaction_type_container = document.createElement(`div`);
        this.transaction_type_container.classList.add(`xe-transaction-sub-container-2`);
        container_1.appendChild(this.transaction_type_container);
    }

    async load_transaction() {
        const { server_data, consumed } = TransactionPage.consume_server_data<TransactionPageServerData>();
        const id = TransactionPage.get_pattern_id(window.location.href);

        this.page_data = {
            server_data
        };

        try {
            if (!consumed && id) {
                const tx_hash = id;
                this.set_window_title(`Transaction ${reduce_text(tx_hash)}`);

                const node = XelisNode.instance();
                this.page_data.server_data = await TransactionPage.load_server_data(node.rpc, tx_hash);
            }
        } catch {

        }
    }

    set_loading(loading: boolean) {
        this.transaction_info.set_loading(loading);
        this.transaction_extra.set_loading(loading);
        //this.transaction_in_blocks.set_loading(loading);
    }

    update_interval_1000_id?: number;
    update_interval_1000 = () => {
        this.transaction_in_blocks.block_items.forEach((block_item) => {
            if (block_item.data) {
                block_item.set_age(block_item.data.timestamp);
            }
        });
    }

    on_transaction_executed = async (transaction_executed?: TransactionExecuted, err?: Error) => {
        console.log("transaction_executed", transaction_executed);

        const { server_data } = this.page_data;

        if (server_data && server_data.transaction && transaction_executed) {
            const tx_hash = server_data.transaction.hash;
            if (transaction_executed.tx_hash === tx_hash) {
                this.transaction_mempool_alert.container.element.remove();

                // reload data
                await this.load_transaction();
                const { server_data } = this.page_data;
                if (server_data && server_data.transaction) {
                    this.set_page(server_data.transaction, server_data.in_blocks);
                }

                this.clear_node_events();
            }
        }
    }

    clear_node_events() {
        const node = XelisNode.instance();
        node.ws.methods.removeListener(DaemonRPCEvent.TransactionExecuted, null, this.on_transaction_executed);
    }

    async listen_node_events() {
        const node = XelisNode.instance();
        node.ws.methods.addListener(DaemonRPCEvent.TransactionExecuted, null, this.on_transaction_executed);
    }

    async set_page(transaction: TransactionResponse, in_blocks: Block[]) {
        this.transaction_info.set(transaction);
        this.transaction_extra.set(transaction);

        if (in_blocks.length > 0) {
            this.transaction_in_blocks.set(in_blocks, transaction.executed_in_block);
            this.sub_container_1.appendChild(this.transaction_in_blocks.container.element);
        }

        this.transaction_type_container.replaceChildren();
        if (transaction.data.transfers) {
            const transaction_transfers = new TransactionTransfers();
            transaction_transfers.set(transaction.data.transfers);
            this.transaction_type_container.appendChild(transaction_transfers.container.element);
        }

        if (transaction.data.burn) {
            const transaction_burn = new TransactionBurn(transaction.data.burn);
            this.transaction_type_container.appendChild(transaction_burn.container.element);
        }

        if (transaction.data.multi_sig) {
            const transaction_multisig = new TransactionMultiSig(transaction.data.multi_sig);
            this.transaction_type_container.appendChild(transaction_multisig.container.element);
        }

        if (transaction.data.deploy_contract) {
            const transaction_deploy_contract = new TransactionDeployContract(transaction.hash, transaction.data.deploy_contract);
            this.transaction_type_container.appendChild(transaction_deploy_contract.container.element);

            if (transaction.data.deploy_contract.invoke) {
                try {
                    const node = XelisNode.instance();
                    const contract_logs = await node.rpc.getContractLogs({
                        caller: transaction.hash
                    });

                    const transaction_contract_logs = new TransactionContractLogs(contract_logs);
                    this.transaction_type_container.appendChild(transaction_contract_logs.container.element);
                } catch (e) {
                    const container = new Container();
                    container.element.innerHTML = `${e}`
                    this.transaction_type_container.appendChild(container.element);
                }
            }
        }

        if (transaction.data.invoke_contract) {
            const transaction_invoke_contract = new TransactionInvokeContract(transaction.data.invoke_contract);
            this.transaction_type_container.appendChild(transaction_invoke_contract.container.element);

            try {
                const node = XelisNode.instance();
                const contract_logs = await node.rpc.getContractLogs({
                    caller: transaction.hash
                });

                const transaction_contract_logs = new TransactionContractLogs(contract_logs);
                this.transaction_type_container.appendChild(transaction_contract_logs.container.element);
            } catch (e) {
                const container = new Container();
                container.element.innerHTML = `${e}`
                this.transaction_type_container.appendChild(container.element);
            }
        }
    }

    async load(parent: HTMLElement) {
        super.load(parent);

        this.transaction_in_blocks.container.element.remove();
        this.transaction_type_container.replaceChildren();
        this.set_loading(true);
        await this.load_transaction();
        this.set_loading(false);

        const { server_data } = this.page_data;
        if (server_data && server_data.transaction) {
            this.set_element(this.master.element);

            const { transaction, in_blocks } = server_data;
            if (transaction.in_mempool) {
                this.sub_container_1.insertBefore(this.transaction_mempool_alert.container.element, this.transaction_info.container.element);
                this.listen_node_events();
            }

            this.set_page(transaction, in_blocks);
            this.update_interval_1000_id = window.setInterval(this.update_interval_1000, 1000);
        } else {
            this.set_element(NotFoundPage.instance().element);
        }
    }

    unload() {
        super.unload();
        this.clear_node_events();
        window.clearInterval(this.update_interval_1000_id);
        this.master.unload();
    }
}
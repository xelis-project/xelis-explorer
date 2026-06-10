import { Block, RPCEvent as DaemonRPCEvent, MempoolTransactionSummary, Transaction, TransactionResponse } from "@xelis/sdk/daemon/types";
import { XelisNode } from "../../app/xelis_node";
import { Master } from "../../components/master/master";
import { TxBlock } from "../../components/tx_item/tx_item";
import { fetch_blocks } from "../../fetch_helpers/fetch_blocks";
import { Page } from "../page";
import { MempoolChart } from "./components/chart/chart";
import { MempoolTxsList } from "./components/list/list";
import { MempoolSearch } from "./components/search/search";
import { MempoolSummary } from "./components/summary/summary";
import { Box } from "../../components/box/box";
import { ServerApp } from "../../../server";
import { Context } from "hono";
import { localization } from "../../localization/localization";

import './mempool.css';

export class MempoolPage extends Page {
    static pathname = "/mempool";

    static async handle_server(c: Context<ServerApp>) {
        this.title = localization.get_text(`Mempool`);
        this.description = localization.get_text(`Monitor memory pool, view pending transactions and network congestion.`);
    }

    master: Master;

    mempool_summary: MempoolSummary;
    mempool_chart: MempoolChart;
    mempool_txs_list: MempoolTxsList;
    mempool_search: MempoolSearch;

    page_data: {
        top_block?: Block;
        blocks: Block[];
        mempool_txs: Transaction[];
    }

    constructor() {
        super();

        this.page_data = {
            blocks: [],
            mempool_txs: []
        };

        this.master = new Master();
        this.master.content.classList.add(`xe-mempool`);
        this.element.appendChild(this.master.element);

        const container_1 = document.createElement(`div`);
        container_1.classList.add(`xe-mempool-container-1`);
        this.master.content.appendChild(container_1);

        const sub_container_1 = document.createElement(`div`);
        container_1.appendChild(sub_container_1);

        this.mempool_summary = new MempoolSummary();
        sub_container_1.appendChild(this.mempool_summary.container.element);

        this.mempool_chart = new MempoolChart();
        sub_container_1.appendChild(this.mempool_chart.container.element);

        const sub_container_2 = document.createElement(`div`);
        container_1.appendChild(sub_container_2);

        this.mempool_search = new MempoolSearch();
        sub_container_2.appendChild(this.mempool_search.container.element);
        this.mempool_txs_list = new MempoolTxsList();
        sub_container_2.appendChild(this.mempool_txs_list.container.element);
    }

    update_interval_1000_id?: number;
    update_interval_1000 = () => {
        this.mempool_txs_list.tx_items.forEach(tx_item => {
            if (tx_item.data) {
                tx_item.set_age(tx_item.data.block.timestamp);
            }
        });
    }

    update_interval_100_id?: number;
    update_interval_100 = () => {
        if (this.page_data.top_block) {
            this.mempool_summary.mempool_info.set_timer(this.page_data.top_block.timestamp);
        }
    }

    on_transaction_added_in_mempool = async (new_tx?: MempoolTransactionSummary, err?: Error) => {
        if (new_tx) {
            const top_block = this.page_data.top_block;

            if (top_block) {
                const timestamp = new_tx.first_seen * 1000;
                const future_block = { height: top_block.height + 1, timestamp } as Block;

                const node = XelisNode.instance();
                const tx = await node.ws.methods.getTransaction(new_tx.hash);

                this.page_data.mempool_txs.push(tx);

                const tx_block = { tx: tx, block: future_block } as TxBlock;
                this.mempool_txs_list.set_empty(false);
                this.mempool_txs_list.prepend_tx(tx_block);
                this.mempool_summary.set(this.page_data.mempool_txs, top_block);
            }
        }
    }

    on_new_block = async (new_block?: Block, err?: Error) => {
        if (new_block) {
            this.page_data.blocks.shift();
            this.page_data.blocks.push(new_block);

            this.page_data.mempool_txs = [];
            this.page_data.top_block = new_block;
            this.mempool_txs_list.set_empty(true);
            this.mempool_chart.blocks_txs.set(this.page_data.blocks);
            this.mempool_summary.set(this.page_data.mempool_txs, new_block);
        }
    }

    clear_node_events() {
        const node = XelisNode.instance();
        node.ws.methods.removeListener(DaemonRPCEvent.TransactionAddedInMempool, null, this.on_transaction_added_in_mempool);
        node.ws.methods.removeListener(DaemonRPCEvent.NewBlock, null, this.on_new_block);
    }

    async listen_node_events() {
        const node = XelisNode.instance();
        node.ws.methods.addListener(DaemonRPCEvent.TransactionAddedInMempool, null, this.on_transaction_added_in_mempool);
        node.ws.methods.addListener(DaemonRPCEvent.NewBlock, null, this.on_new_block);
    }

    async load(parent: HTMLElement) {
        super.load(parent);
        this.set_window_title(localization.get_text(`Mempool`));

        this.mempool_chart.blocks_txs.load();
        Box.boxes_loading(this.mempool_chart.container.element, true);
        Box.boxes_loading(this.mempool_summary.container.element, true);
        Box.list_loading(this.mempool_txs_list.container.element, 5, `5rem`);
        this.listen_node_events();

        const node = XelisNode.instance();

        const top_block = await node.rpc.getTopBlock();
        this.page_data.top_block = top_block;

        const mempool_txs = await node.rpc.getMemPool();
        this.page_data.mempool_txs = mempool_txs.transactions;

        const txs_block = mempool_txs.transactions.map((tx) => {
            const timestamp = (tx.first_seen || 0) * 1000;
            return { tx: tx as Transaction, block: { height: top_block.height + 1, timestamp } } as TxBlock;
        });

        const blocks = await fetch_blocks(top_block.height, 25);
        this.page_data.blocks = blocks;

        this.mempool_summary.set(this.page_data.mempool_txs, top_block);

        this.mempool_txs_list.set(txs_block);
        if (this.page_data.mempool_txs.length === 0) this.mempool_txs_list.set_empty(true);
        this.mempool_chart.blocks_txs.set(blocks);

        Box.boxes_loading(this.mempool_summary.container.element, false);
        Box.boxes_loading(this.mempool_chart.container.element, false);
        this.update_interval_1000_id = window.setInterval(this.update_interval_1000, 1000);
        this.update_interval_100_id = window.setInterval(this.update_interval_100, 100);
    }

    unload() {
        super.unload();

        this.mempool_chart.blocks_txs.unload();
        this.clear_node_events();
        window.clearInterval(this.update_interval_1000_id);
        window.clearInterval(this.update_interval_100_id);
        this.master.unload();
    }
}
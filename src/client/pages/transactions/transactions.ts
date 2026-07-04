import { Page } from "../page";
import { Master } from "../../components/master/master";
import { XelisNode } from "../../app/xelis_node";
import { Table } from "../../components/table/table";
import { Container } from "../../components/container/container";
import { TxRow } from "./tx_row/tx_row";
import { BlockType, RPCEvent as DaemonRPCEvent, GetInfoResult, TransactionExecuted, TransactionResponse } from "@xelis/sdk/daemon/types";
import { fetch_blocks } from "../../fetch_helpers/fetch_blocks";
import { fetch_blocks_txs } from "../../fetch_helpers/fetch_blocks_txs";
import { localization } from "../../localization/localization";
import { Context } from "hono";
import { ServerApp } from "../../../server";
import { PrevNextPager } from "../../components/prev_next_pager/prev_next_pager";

import './transactions.css';

export class TransactionsPage extends Page {
    static pathname = "/transactions";

    static async handle_server(c: Context<ServerApp>) {
        this.title = localization.get_text(`Transactions`);
        this.description = localization.get_text(`List of recent executed transactions.`);
    }

    master: Master;

    container_table: Container;
    table: Table;
    prev_next_pager: PrevNextPager;

    tx_rows: TxRow[];
    page_data: {
        info?: GetInfoResult;
    }

    constructor() {
        super();

        this.tx_rows = [];
        this.page_data = {};

        this.master = new Master();
        this.element.appendChild(this.master.element);
        this.master.content.classList.add(`xe-transactions`);

        this.container_table = new Container();
        this.container_table.element.classList.add(`xe-transactions-table`, `scrollbar-1`, `scrollbar-1-bottom`);
        this.master.content.appendChild(this.container_table.element);

        this.table = new Table();
        this.table.set_clickable();
        this.container_table.element.appendChild(this.table.element);

        const titles = [
            localization.get_text(`HEIGHT`),
            localization.get_text(`HASH`),
            localization.get_text(`TYPE`),
            localization.get_text(`SIGNER`),
            localization.get_text(`SIZE`),
            localization.get_text(`FEE`),
            localization.get_text(`EXECUTED IN`),
            localization.get_text(`AGE`)
        ];
        this.table.set_head_row(titles);

        this.prev_next_pager = new PrevNextPager();
        this.prev_next_pager.load_func = () => this.load_transactions();
        this.container_table.element.appendChild(this.prev_next_pager.element);
    }

    update_interval_1000_id?: number;
    update_interval_1000 = () => {
        this.tx_rows.forEach(tx_row => {
            if (tx_row.block) {
                tx_row.set_age(tx_row.block.timestamp);
            }
        });
    }

    on_transaction_executed = async (transaction_executed?: TransactionExecuted, err?: Error) => {
        if (this.is_txs_pager_active()) return;
        console.log("transaction_executed", transaction_executed);

        if (transaction_executed) {
            const node = XelisNode.instance();
            const transaction = await node.ws.methods.getTransaction(transaction_executed.tx_hash);
            const block = await node.ws.methods.getBlockByHash({ hash: transaction_executed.block_hash });

            const new_tx_row = new TxRow();
            new_tx_row.set(block, transaction);
            this.table.prepend_row(new_tx_row);
            new_tx_row.animate_prepend();

            if (this.prev_next_pager.pager_max && this.prev_next_pager.pager_next &&
                block.height > this.prev_next_pager.pager_max) {
                this.prev_next_pager.pager_max = block.height;
                this.prev_next_pager.pager_current = block.height;
                this.prev_next_pager.pager_next++;
                this.prev_next_pager.render();

                // remove txs for specific height
                for (let i = 0; i < this.tx_rows.length; i++) {
                    const tx_row = this.tx_rows[i];
                    if (tx_row.block && tx_row.block.height < this.prev_next_pager.pager_next) {
                        this.tx_rows.splice(i, 1);
                        tx_row.unload();
                    }
                }
            }
        }
    }

    is_txs_pager_active() {
        return this.prev_next_pager.pager_numbers.length > 0;
    }

    clear_node_events() {
        const node = XelisNode.instance();
        node.ws.methods.removeListener(DaemonRPCEvent.TransactionExecuted, null, this.on_transaction_executed);
    }

    async listen_node_events() {
        const node = XelisNode.instance();
        node.ws.methods.addListener(DaemonRPCEvent.TransactionExecuted, null, this.on_transaction_executed);
    }

    async load_transactions() {
        const { info } = this.page_data;
        if (!info) return;

        this.table.clear();
        this.table.set_loading(20);

        this.prev_next_pager.pager_max = info.height;
        this.prev_next_pager.pager_min = 0;

        const end_height = this.prev_next_pager.get_next() || info.height;
        let blocks = await fetch_blocks(end_height, 100);
        // filter side block out (they might contain a duplicated tx)
        blocks = blocks.filter(b => b.block_type !== BlockType.Side);
        await fetch_blocks_txs(blocks);

        this.tx_rows = [];
        this.table.clear();
        blocks.forEach((block) => {
            if (block.transactions) {
                block.transactions.forEach((tx) => {
                    const tx_row = new TxRow();
                    tx_row.set(block, tx as TransactionResponse);
                    this.table.prepend_row(tx_row);
                    this.tx_rows.push(tx_row);
                });
            }
        });

        if (this.table.rows.length === 0) {
            const text = localization.get_text(`No transactions from {} to {}.`, [end_height.toLocaleString(), (this.prev_next_pager.pager_next || 0).toLocaleString()]);
            this.table.add_empty_row().set_empty(text);
        } else {
            this.prev_next_pager.pager_current = blocks[blocks.length - 1].height;
            this.prev_next_pager.pager_next = blocks[0].height - 1;
            this.prev_next_pager.render();
        }
    }

    async load(parent: HTMLElement) {
        super.load(parent);
        this.set_window_title(localization.get_text(`Transactions`));
        this.listen_node_events();
        const node = XelisNode.instance();

        const info = await node.rpc.getInfo();
        this.page_data.info = info;

        await this.load_transactions();

        this.update_interval_1000_id = window.setInterval(this.update_interval_1000, 1000);
    }

    unload() {
        super.unload();
        this.clear_node_events();
        window.clearInterval(this.update_interval_1000_id);
        this.master.unload();
    }
}

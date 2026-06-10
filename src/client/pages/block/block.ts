import { Context } from "hono";
import { ServerApp } from "../../../server";
import { Page } from "../page";
import { Block, GetInfoResult, RPCEvent as DaemonRPCEvent } from "@xelis/sdk/daemon/types";
import DaemonRPC from '@xelis/sdk/daemon/rpc';
import { NotFoundPage } from "../not_found/not_found";
import { Master } from "../../components/master/master";
import { XelisNode } from "../../app/xelis_node";
import { BlockInfo } from "./components/info/info";
import { BlockMiner } from "./components/miner/miner";
import { BlockHashrate } from "./components/hashrate/hashrate";
import { BlockExtra } from "./components/extra/extra";
import { BlockTxs } from "./components/txs/txs";
import { BlockGraph } from "./components/graph/graph";
import { localization } from "../../localization/localization";
import { BlockRewards } from './components/rewards/rewards';
import { BlockFees } from "./components/fees/fees";
import { BlockNextBlockBtns } from "./components/next_block_btns/next_block_btns";
import { reduce_text } from "../../utils/reduce_text";

import './block.css';

export interface BlockPageServerData {
    block: Block;
}

export class BlockPage extends Page {
    static pathname = "/block/:id";

    static get_pattern_id = (href: string) => {
        const pattern_result = this.exec_pattern(href);
        if (pattern_result) {
            const id = pattern_result.pathname.groups.id;
            return id;
        }
    }

    static async handle_server(c: Context<ServerApp>) {
        let block_hash = this.get_pattern_id(c.req.url);
        this.server_data = undefined;

        if (!block_hash) {
            this.status = 404;
            return;
        }

        const daemon = new DaemonRPC(c.get(`node_endpoint`));
        this.title = localization.get_text(`Block {}`, [reduce_text(block_hash)]);
        this.description = localization.get_text(`Block details of {}`, [block_hash]);

        try {
            const block = await daemon.getBlockByHash({
                hash: block_hash
            });
            this.server_data = { block } as BlockPageServerData;
        } catch {
            this.status = 404;
        }
    }

    page_data: {
        block?: Block;
    }
    master: Master;
    block_info: BlockInfo;
    block_miner: BlockMiner;
    block_hashrate: BlockHashrate;
    block_extra: BlockExtra;
    block_graph: BlockGraph;
    block_txs: BlockTxs;
    block_rewards: BlockRewards;
    block_fees: BlockFees;
    block_next_block_btns: BlockNextBlockBtns;

    constructor() {
        super();
        this.page_data = {};
        this.master = new Master();
        this.master.content.classList.add(`xe-block`);
        this.element.appendChild(this.master.element);

        const container_1 = document.createElement(`div`);
        container_1.classList.add(`xe-block-container-1`);
        this.master.content.appendChild(container_1);

        const sub_container_1 = document.createElement(`div`);
        container_1.appendChild(sub_container_1);

        this.block_next_block_btns = new BlockNextBlockBtns();
        sub_container_1.appendChild(this.block_next_block_btns.element);

        this.block_info = new BlockInfo();
        sub_container_1.appendChild(this.block_info.container.element);
        this.block_miner = new BlockMiner();
        sub_container_1.appendChild(this.block_miner.container.element);
        this.block_rewards = new BlockRewards();
        sub_container_1.appendChild(this.block_rewards.container.element);
        this.block_hashrate = new BlockHashrate();
        sub_container_1.appendChild(this.block_hashrate.container.element);
        this.block_fees = new BlockFees();
        sub_container_1.appendChild(this.block_fees.container.element);
        this.block_extra = new BlockExtra();
        sub_container_1.appendChild(this.block_extra.container.element);

        const sub_container_2 = document.createElement(`div`);
        container_1.appendChild(sub_container_2);

        this.block_graph = new BlockGraph();
        sub_container_2.appendChild(this.block_graph.container.element);

        this.block_txs = new BlockTxs();
        this.master.content.appendChild(this.block_txs.container.element);
        this.master.element.appendChild(this.block_txs.tx_data_hover.element);
    }

    async load_block() {
        const { server_data, consumed } = BlockPage.consume_server_data<BlockPageServerData>();
        const id = BlockPage.get_pattern_id(window.location.href);

        this.page_data = {
            block: server_data ? server_data.block : undefined
        };

        try {
            if (!consumed && id) {
                const block_hash = id;
                this.set_window_title(`Block ${reduce_text(block_hash)}`);

                const node = XelisNode.instance();

                if (!this.page_data.block) {
                    this.page_data.block = await node.rpc.getBlockByHash({
                        hash: block_hash
                    });
                }
            }
        } catch {

        }
    }

    update_interval_1000_id?: number;
    update_interval_1000 = () => {
        this.block_info.set_last_update();
    }

    on_new_block = async (new_block?: Block, err?: Error) => {
        console.log("new_block", new_block);

        const node = XelisNode.instance();

        const { block } = this.page_data;
        if (block && new_block) {
            this.block_info.set_confirmations(block.height, new_block.height);
            this.block_info.set_last_update();

            const stable_height = await node.ws.methods.getStableHeight();

            if (block.height >= stable_height) {
                this.page_data.block = await node.ws.methods.getBlockByHash({
                    hash: block.hash
                });

                const info = await node.ws.methods.getInfo();
                this.set(this.page_data.block, info);
            }

            if (block.height <= stable_height) {
                this.block_graph.dag.set_live(false);
            }
        }
    }

    clear_node_events() {
        const node = XelisNode.instance();
        node.ws.methods.removeListener(DaemonRPCEvent.NewBlock, null, this.on_new_block);
    }

    async listen_node_events() {
        const node = XelisNode.instance();
        node.ws.methods.addListener(DaemonRPCEvent.NewBlock, null, this.on_new_block);
    }

    set_loading(loading: boolean) {
        this.block_miner.set_loading(loading);
        this.block_hashrate.set_loading(loading);
        this.block_info.set_loading(loading);
        this.block_extra.set_loading(loading);
        this.block_graph.set_loading(loading);
        if (loading) this.block_txs.table.set_loading(5);
    }

    async set(block: Block, info: GetInfoResult) {
        this.block_info.set(block, info);
        this.block_miner.set(block);
        this.block_hashrate.set(block);
        this.block_extra.set(block);
        this.block_txs.load(block);
        this.block_rewards.set(block);
        this.block_fees.set(block);
        this.block_next_block_btns.set(info, block.topoheight);
    }

    async set_dag(block: Block, info: GetInfoResult) {
        await this.block_graph.set(block);

        this.block_graph.dag.overlay_loading.set_loading(false);
        this.block_graph.dag.update_size();

        this.block_graph.dag.lock_block_height = undefined;
        if (block.height > info.stableheight) {
            this.block_graph.dag.lock_block_height = block.height;
            this.block_graph.dag.move_to_height(block.height, true);
            await this.block_graph.dag.set_live(true);
        } else {
            await this.block_graph.dag.set_live(false);
            await this.block_graph.dag.load_blocks(block.height);
        }

        this.block_graph.dag.highlight_block(block);
    }

    async load(parent: HTMLElement) {
        super.load(parent);

        this.listen_node_events();

        this.set_loading(true);
        this.block_graph.dag.overlay_loading.set_loading(true);

        await this.load_block();

        const node = XelisNode.instance();
        const info = await node.rpc.getInfo();

        this.set_loading(false);

        const { block } = this.page_data;
        if (block) {
            this.set_element(this.master.element);
            this.set(block, info);
            this.set_dag(block, info);
            this.update_interval_1000_id = window.setInterval(this.update_interval_1000, 1000);
        } else {
            this.set_element(NotFoundPage.instance().element);
        }
    }

    unload() {
        super.unload();
        this.clear_node_events();
        this.block_graph.dag.unload();
        this.block_txs.tx_data_hover.hide();
        window.clearInterval(this.update_interval_1000_id);
        this.master.unload();
    }
}
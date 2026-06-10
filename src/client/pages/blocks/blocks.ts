import { Page } from "../page";
import { Master } from "../../components/master/master";
import { XelisNode } from "../../app/xelis_node";
import { Table } from "../../components/table/table";
import { Container } from "../../components/container/container";
import { BlockRow } from "./block_row/block_row";
import { Block, BlockOrdered, BlockOrphaned, BlockType, RPCEvent as DaemonRPCEvent, GetInfoResult } from "@xelis/sdk/daemon/types";
import { fetch_blocks } from "../../fetch_helpers/fetch_blocks";
import { localization } from "../../localization/localization";
import { Context } from "hono";
import { ServerApp } from "../../../server";
import { PrevNextPager } from "../../components/prev_next_pager/prev_next_pager";

import './blocks.css';

export class BlocksPage extends Page {
    static pathname = "/blocks";

    static async handle_server(c: Context<ServerApp>) {
        this.title = localization.get_text(`Blocks`);
        this.description = localization.get_text(`List of mined blocks.`);
    }

    master: Master;

    container_table: Container;
    table: Table;
    prev_next_pager: PrevNextPager;

    block_rows: BlockRow[];
    page_data: {
        info?: GetInfoResult;
    }

    constructor() {
        super();

        this.block_rows = [];
        this.page_data = {};
        this.master = new Master();
        this.element.appendChild(this.master.element);
        this.master.content.classList.add(`xe-blocks`);

        this.container_table = new Container();
        this.container_table.element.classList.add(`xe-blocks-table`, `scrollbar-1`, `scrollbar-1-bottom`);
        this.master.content.appendChild(this.container_table.element);

        this.table = new Table();
        this.table.set_clickable();
        this.container_table.element.appendChild(this.table.element);

        const titles = [
            localization.get_text(`TOPOHEIGHT`),
            localization.get_text(`HEIGHT`),
            localization.get_text(`BLOCK`),
            localization.get_text(`POOL / MINER`),
            localization.get_text(`SIZE`),
            localization.get_text(`TX COUNT`),
            localization.get_text(`HASH`),
            localization.get_text(`REWARD`),
            localization.get_text(`HASHRATE`),
            localization.get_text(`AGE`),
        ];
        this.table.set_head_row(titles);

        this.prev_next_pager = new PrevNextPager();
        this.prev_next_pager.load_func = () => this.load_blocks();
        this.container_table.element.appendChild(this.prev_next_pager.element);
    }

    update_interval_1000_id?: number;
    update_interval_1000 = () => {
        this.block_rows.forEach(block_row => {
            if (block_row.data) {
                block_row.set_age(block_row.data.timestamp);
            }
        });
    }

    on_new_block = async (new_block?: Block, err?: Error) => {
        if (this.is_blocks_pager_active()) return;
        console.log("new_block", new_block);

        const { info } = this.page_data;

        if (new_block && info) {
            if (this.prev_next_pager.pager_max && this.prev_next_pager.pager_next &&
                new_block.height > this.prev_next_pager.pager_max) {
                this.prev_next_pager.pager_max = new_block.height;
                this.prev_next_pager.pager_current = new_block.height;
                this.prev_next_pager.pager_next++;
                this.prev_next_pager.render();
            }

            const block_row = new BlockRow();
            block_row.set(new_block, info.block_time_target);
            this.table.prepend_row(block_row.element);
            this.block_rows.unshift(block_row);
            this.block_rows.pop();
            block_row.animate_prepend();
            this.table.remove_last();
        }

        const node = XelisNode.instance();
        const stable_height = await node.ws.methods.getStableHeight();

        // normal blocks become sync under stableheight if they don't have any side blocks
        // the node does not emit an event for this case
        {
            const side_block_heights = this.block_rows.filter(b => {
                if (b.data && b.data.block_type === BlockType.Side) {
                    return b;
                }
            }).map(b => b.data!.height);

            this.block_rows.forEach((block_row) => {
                const block = block_row.data;
                if (block &&
                    block.height <= stable_height
                    && block.block_type === BlockType.Normal
                    && side_block_heights.indexOf(block.height) === -1
                ) {
                    block.block_type = BlockType.Sync;
                    block_row.set_type(BlockType.Sync);
                    block_row.animate_update();
                }
            });
        }
    }

    on_block_ordered = async (block_ordered?: BlockOrdered | undefined, err?: Error) => {
        console.log("block_ordered", block_ordered);
        if (block_ordered) {
            const block_row = this.block_rows.find(b => b.data && b.data.hash === block_ordered.block_hash);
            if (block_row && block_row.data && this.page_data.info) {
                // refetch block instead of using data from block_ordered
                // block can pass from orphaned to normal, sync
                // other attributes can also change
                const node = XelisNode.instance();
                const block = await node.ws.methods.getBlockByHash({ hash: block_ordered.block_hash });
                const { block_time_target } = this.page_data.info;
                block_row.set(block, block_time_target);
                block_row.animate_update();
            }
        }
    }

    on_block_orphaned = (block_orphaned?: BlockOrphaned | undefined, err?: Error) => {
        console.log("block_orphaned", block_orphaned);
        if (block_orphaned) {
            const block_row = this.block_rows.find(b => b.data && b.data.hash === block_orphaned.block_hash);
            if (block_row && block_row.data) {
                const new_block_type = BlockType.Orphaned;
                block_row.data.block_type = new_block_type;
                block_row.set_type(new_block_type);
                block_row.animate_update();
            }
        }
    }

    clear_node_events() {
        const node = XelisNode.instance();
        node.ws.methods.removeListener(DaemonRPCEvent.BlockOrdered, null, this.on_block_ordered);
        node.ws.methods.removeListener(DaemonRPCEvent.BlockOrphaned, null, this.on_block_orphaned);
        node.ws.methods.removeListener(DaemonRPCEvent.NewBlock, null, this.on_new_block);
    }

    async listen_node_events() {
        const node = XelisNode.instance();
        node.ws.methods.addListener(DaemonRPCEvent.BlockOrdered, null, this.on_block_ordered);
        node.ws.methods.addListener(DaemonRPCEvent.BlockOrphaned, null, this.on_block_orphaned);
        node.ws.methods.addListener(DaemonRPCEvent.NewBlock, null, this.on_new_block);
    }

    is_blocks_pager_active() {
        return this.prev_next_pager.pager_numbers.length > 0;
    }

    async load_blocks() {
        const { info } = this.page_data;
        if (!info) return;

        this.prev_next_pager.pager_max = info.height;
        this.prev_next_pager.pager_min = 0;

        this.table.set_loading(20);
        this.table.body_element.replaceChildren();

        const node = XelisNode.instance();
        const end_topo = this.prev_next_pager.get_next();
        const blocks = await node.rpc.getBlocksRangeByHeight({
            end_height: end_topo,
            start_height: end_topo - 20
        });
        this.table.body_element.replaceChildren();

        blocks.forEach((block) => {
            const block_row = new BlockRow();
            block_row.set(block, info.block_time_target);
            this.table.prepend_row(block_row.element);
            this.block_rows.push(block_row);
        });

        this.prev_next_pager.pager_current = blocks[blocks.length - 1].height;
        this.prev_next_pager.pager_next = blocks[0].height - 1;
        this.prev_next_pager.render();
    }

    async load(parent: HTMLElement) {
        super.load(parent);
        this.set_window_title(localization.get_text(`Blocks`));

        this.listen_node_events();
        const node = XelisNode.instance();

        this.table.set_loading(100);

        const info = await node.rpc.getInfo();
        this.page_data.info = info;

        await this.load_blocks();
        /*
        const blocks = await fetch_blocks(info.height, 100);

        this.table.body_element.replaceChildren();
        blocks.forEach((block) => {
            const block_row = new BlockRow();
            block_row.set(block, info.block_time_target);
            this.table.prepend_row(block_row.element);
            this.block_rows.push(block_row);
        });*/
        this.update_interval_1000_id = window.setInterval(this.update_interval_1000, 1000);
    }

    unload() {
        super.unload();
        this.clear_node_events();
        window.clearInterval(this.update_interval_1000_id);
        this.master.unload();
    }
}
import { Context } from "hono";
import { Page } from "../page";
import { ServerApp } from "../../../server";
import { XelisNode } from "../../app/xelis_node";
import DaemonRPC from '@xelis/sdk/daemon/rpc';
import { Block } from "@xelis/sdk/daemon/types";
import { NotFoundPage } from "../not_found/not_found";
import { Master } from "../../components/master/master";
import { Container } from "../../components/container/container";
import { Table } from "../../components/table/table";
import { BlockRow } from "./block_row/block_row";
import { localization } from "../../localization/localization";

import './block_height.css';

export interface BlockHeightServerData {
    blocks: Block[];
}

export class BlockHeightPage extends Page {
    static pathname = "/height/:id";

    static get_pattern_id = (href: string) => {
        const pattern_result = this.exec_pattern(href);
        if (pattern_result) {
            const id = pattern_result.pathname.groups.id;
            return id;
        }
    }

    static async handle_server(c: Context<ServerApp>) {
        let id = BlockHeightPage.get_pattern_id(c.req.url);
        if (!id) {
            this.status = 404;
            return;
        }

        this.server_data = undefined;

        const daemon = new DaemonRPC(c.get(`node_endpoint`));

        const block_height = parseInt(id);
        this.title = localization.get_text(`Block Height {}`, [block_height.toLocaleString()]);
        this.description = localization.get_text(`List of blocks at height {}`, [block_height.toLocaleString()]);

        try {
            const blocks = await daemon.getBlocksAtHeight({
                height: block_height
            });
            this.server_data = { blocks } as BlockHeightServerData;
        } catch {
            this.status = 404;
        }
    }

    page_data: {
        blocks: Block[]
    }

    master: Master;
    container_table: Container;
    block_rows: BlockRow[];
    table: Table;

    constructor() {
        super();

        this.block_rows = [];
        this.page_data = {
            blocks: []
        };

        this.master = new Master();
        this.element.appendChild(this.master.element);
        this.master.content.classList.add(`xe-block-height`);

        this.container_table = new Container();
        this.container_table.element.classList.add(`xe-block-height-table`);
        this.master.content.appendChild(this.container_table.element);

        this.table = new Table();
        this.table.set_clickable();
        this.container_table.element.appendChild(this.table.element);

        const titles = [
            localization.get_text(`HASH`),
            localization.get_text(`TOPOHEIGHT`),
            localization.get_text(`BLOCK`),
            localization.get_text(`TX COUNT`),
            localization.get_text(`SIZE`),
            localization.get_text(`REWARD`),
            localization.get_text(`POOL / MINER`),
            localization.get_text(`AGE`)
        ];
        this.table.set_head_row(titles);
    }

    async load_blocks() {
        const { server_data, consumed } = BlockHeightPage.consume_server_data<BlockHeightServerData>();
        const id = BlockHeightPage.get_pattern_id(window.location.href);

        this.block_rows = [];
        this.page_data = {
            blocks: server_data ? server_data.blocks : []
        }

        try {
            if (!consumed && id) {
                const block_height = parseInt(id);
                this.set_window_title(`Block Height ${block_height.toLocaleString()}`);

                const node = XelisNode.instance();

                if (this.page_data.blocks.length === 0) {
                    this.page_data.blocks = await node.rpc.getBlocksAtHeight({
                        height: block_height
                    });
                }
            }
        } catch {

        }
    }

    update_interval_1000_id?: number;
    update_interval_1000 = () => {
        this.block_rows.forEach(block_row => {
            if (block_row.data) block_row.set_age(block_row.data.timestamp);
        });
    }

    async load(parent: HTMLElement) {
        super.load(parent);

        this.table.set_loading(5);
        await this.load_blocks();

        const { blocks } = this.page_data;

        if (blocks.length > 0) {
            this.set_element(this.master.element);

            this.table.body_element.replaceChildren();
            blocks.forEach((block) => {
                const block_row = new BlockRow();
                block_row.set(block);
                this.block_rows.push(block_row);
                this.table.prepend_row(block_row.element);
            });
        } else {
            this.set_element(NotFoundPage.instance().element);
        }

        this.update_interval_1000_id = window.setInterval(this.update_interval_1000, 1000);
    }

    unload() {
        super.unload();
        window.clearInterval(this.update_interval_1000_id);
        this.master.unload();
    }
}
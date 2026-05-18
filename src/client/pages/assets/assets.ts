import { Page } from "../page";
import { Master } from "../../components/master/master";
import { Table } from "../../components/table/table";
import { Container } from "../../components/container/container";
import { AssetRow } from "./asset_row/asset_row";
import { GetInfoResult } from "@xelis/sdk/daemon/types";
import { fetch_contracts } from "../../fetch_helpers/fetch_contracts";
import { localization } from "../../localization/localization";
import { ServerApp } from "../../../server";
import { Context } from "hono";
import { XelisNode } from "../../app/xelis_node";
import { Pagination } from "../../components/pagination/pagination";

import './assets.css';

export class AssetsPage extends Page {
    static pathname = "/assets";

    static async handle_server(c: Context<ServerApp>) {
        this.title = localization.get_text(`Assets`);
        this.description = localization.get_text(`List of all registered assets.`);
    }

    master: Master;

    container_table: Container;
    table: Table;
    pagination: Pagination;

    asset_rows: AssetRow[];
    page_data: {
        info?: GetInfoResult;
    }

    constructor() {
        super();

        this.asset_rows = [];
        this.page_data = {};

        this.master = new Master();
        this.element.appendChild(this.master.element);
        this.master.content.classList.add(`xe-assets`);

        this.container_table = new Container();
        this.container_table.element.classList.add(`xe-assets-table`, `scrollbar-1`, `scrollbar-1-bottom`);
        this.master.content.appendChild(this.container_table.element);

        this.table = new Table();
        this.table.set_clickable();
        this.container_table.element.appendChild(this.table.element);

        const titles = [
            localization.get_text(`HASH`),
            localization.get_text(`NAME`),
            localization.get_text(`TICKER`),
            localization.get_text(`MAX SUPPLY`),
            localization.get_text(`OWNER`),
            localization.get_text(`TOPOHEIGHT`),
            localization.get_text(`DECIMALS`),
        ];
        this.table.set_head_row(titles);

        this.pagination = new Pagination();
        this.pagination.current_page = 1;
        this.pagination.sibling_count = 2;
        this.pagination.page_size = 6;

        this.pagination.add_listener(`page_change`, (page) => {
            this.load_assets();
        });

        this.master.content.appendChild(this.pagination.element);
    }

    async load_assets() {
        this.table.body_element.replaceChildren();
        this.table.set_loading(this.pagination.page_size);

        const xelis_node = XelisNode.instance();

        const total_assets = await xelis_node.rpc.countAssets();
        this.pagination.total_items = total_assets;
        this.pagination.render();

        const maximum = this.pagination.page_size;
        const skip = (this.pagination.current_page - 1) * maximum;
        const assets = await xelis_node.rpc.getAssets({ skip, maximum });

        const asset_rows = [] as AssetRow[];
        for (let i = 0; i < assets.length; i++) {
            const asset_row = new AssetRow();
            asset_row.set(assets[i]);
            asset_rows.push(asset_row);
        }

        this.table.body_element.replaceChildren();
        asset_rows.forEach((row) => {
            this.table.prepend_row(row.element);
        });

        if (this.table.body_element.children.length === 0) {
            this.table.set_empty(localization.get_text(`No assets`));
        }
    }

    async load(parent: HTMLElement) {
        super.load(parent);
        this.set_window_title(`Assets`);
        this.load_assets();
    }

    unload() {
        super.unload();
    }
}
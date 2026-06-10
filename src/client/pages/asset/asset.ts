import { Context } from "hono";
import { Page } from "../page";
import { ServerApp } from "../../../server";
import { XelisNode } from "../../app/xelis_node";
import DaemonRPC from '@xelis/sdk/daemon/rpc';
import { Master } from "../../components/master/master";
import { AssetWithData, Block, GetAssetSupplyResult } from "@xelis/sdk/daemon/types";
import { NotFoundPage } from "../not_found/not_found";
import { localization } from "../../localization/localization";
import { reduce_text } from "../../utils/reduce_text";
import { AssetMaxSupply } from "./components/max_supply/max_supply";
import { AssetInfo } from "./components/asset_info/asset_info";
import { AssetOwner } from "./components/asset_owner/asset_owner";

import './asset.css';
import { AssetSupply } from "./components/supply/supply";

interface AssetPageServerData {
    asset: AssetWithData;
    block: Block;
    supply: GetAssetSupplyResult;
}

export class AssetPage extends Page {
    static pathname = "/asset/:id";

    static get_pattern_id = (href: string) => {
        const pattern_result = this.exec_pattern(href);
        if (pattern_result) {
            const id = pattern_result.pathname.groups.id;
            return id;
        }
    }

    static async load_server_data(daemon: DaemonRPC, asset_hash: string) {
        const server_data = {} as AssetPageServerData;

        const asset = await daemon.getAsset({ asset: asset_hash });
        server_data.asset = asset as AssetWithData;

        const asset_supply = await daemon.getAssetSupply({ asset: asset_hash });
        server_data.supply = asset_supply;

        const block = await daemon.getBlockAtTopoheight({ topoheight: asset.topoheight });
        server_data.block = block;

        return server_data;
    }

    static async handle_server(c: Context<ServerApp>) {
        let id = AssetPage.get_pattern_id(c.req.url);
        if (!id) {
            this.status = 404;
            return;
        }

        this.server_data = undefined;

        const daemon = new DaemonRPC(c.get(`node_endpoint`));

        const asset_hash = id;
        this.title = localization.get_text(`Asset {}`, [reduce_text(asset_hash)]);
        this.description = localization.get_text(`Asset details of {}`, [asset_hash]);

        try {
            this.server_data = await this.load_server_data(daemon, asset_hash);
        } catch {
            this.status = 404;
        }
    }

    master: Master;
    asset_info: AssetInfo;
    asset_supply: AssetSupply;
    asset_max_supply: AssetMaxSupply;
    asset_owner: AssetOwner;

    page_data: {
        server_data?: AssetPageServerData;
    };

    constructor() {
        super();
        this.page_data = {};

        this.master = new Master();
        this.master.content.classList.add(`xe-asset`);
        this.element.appendChild(this.master.element);

        const sub_container_1 = document.createElement(`div`);
        this.master.content.appendChild(sub_container_1);

        this.asset_info = new AssetInfo();
        sub_container_1.appendChild(this.asset_info.container.element);

        const sub_container_2 = document.createElement(`div`);
        this.master.content.appendChild(sub_container_2);

        this.asset_supply = new AssetSupply();
        sub_container_2.appendChild(this.asset_supply.container.element);

        this.asset_max_supply = new AssetMaxSupply();
        sub_container_2.appendChild(this.asset_max_supply.container.element);

        this.asset_owner = new AssetOwner();
        sub_container_2.appendChild(this.asset_owner.container.element);
    }

    async load_asset() {
        const { server_data, consumed } = AssetPage.consume_server_data<AssetPageServerData>();
        const id = AssetPage.get_pattern_id(window.location.href);

        this.page_data = {
            server_data
        };

        try {
            if (!consumed && id) {
                const contract_hash = id;
                this.set_window_title(`Asset ${reduce_text(contract_hash)}`);

                const node = XelisNode.instance();
                this.page_data.server_data = await AssetPage.load_server_data(node.rpc, contract_hash);
            }
        } catch {

        }
    }

    set_loading(loading: boolean) {
        this.asset_info.set_loading(loading);
        this.asset_supply.set_loading(loading);
        this.asset_max_supply.set_loading(loading);
        this.asset_owner.set_loading(loading);
    }

    async load(parent: HTMLElement) {
        super.load(parent);

        this.set_loading(true);
        await this.load_asset();
        this.set_loading(false);

        const { server_data } = this.page_data;
        if (server_data) {
            this.set_element(this.master.element);

            this.asset_info.set(server_data.asset, server_data.block);
            this.asset_supply.set(server_data.asset, server_data.supply);
            this.asset_max_supply.set(server_data.asset);
            this.asset_owner.set(server_data.asset);
        } else {
            this.set_element(NotFoundPage.instance().element);
        }
    }

    unload() {
        super.unload();
        this.master.unload();
    }
}
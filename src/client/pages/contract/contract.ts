import { Context } from "hono";
import { Page } from "../page";
import { ServerApp } from "../../../server";
import { XelisNode } from "../../app/xelis_node";
import DaemonRPC from '@xelis/sdk/daemon/rpc';
import { Master } from "../../components/master/master";
import { RPCMethod as DaemonRPCMethod, GetContractModuleParams, GetContractModuleResult, TransactionResponse } from "@xelis/sdk/daemon/types";
import { RPCRequest } from "@xelis/sdk/rpc/types";
import { NotFoundPage } from "../not_found/not_found";
import { localization } from "../../localization/localization";
import { ContractInfo } from "./components/info/info";
import { ContractAssets } from "./components/assets/assets";
import { ContractStorageEntries } from "./components/storage/storage";
import { reduce_text } from "../../utils/reduce_text";

import './contract.css';

interface ContractPageServerData {
    contract: string;
    contract_module?: GetContractModuleResult;
}

export class ContractPage extends Page {
    static pathname = "/contract/:id";

    static get_pattern_id = (href: string) => {
        const pattern_result = this.exec_pattern(href);
        if (pattern_result) {
            const id = pattern_result.pathname.groups.id;
            return id;
        }
    }

    static async load_server_data(daemon: DaemonRPC, contract_hash: string) {
        const server_data = { contract: contract_hash } as ContractPageServerData;
        server_data.contract_module = await daemon.getContractModule({ contract: contract_hash });

        return server_data;
    }

    static async handle_server(c: Context<ServerApp>) {
        let id = ContractPage.get_pattern_id(c.req.url);
        if (!id) {
            this.status = 404;
            return;
        }

        this.server_data = undefined;

        const daemon = new DaemonRPC(c.get(`node_endpoint`));

        const contract_hash = id;
        this.title = localization.get_text(`Contract {}`, [reduce_text(contract_hash)]);
        this.description = localization.get_text(`Contract details of {}`, [contract_hash]);

        try {
            this.server_data = await this.load_server_data(daemon, contract_hash);
        } catch {
            this.status = 404;
        }
    }

    master: Master;
    page_data: {
        server_data?: ContractPageServerData;
    };
    contract_info: ContractInfo;
    contract_assets: ContractAssets;
    contract_storage_entries: ContractStorageEntries;

    constructor() {
        super();
        this.page_data = {};

        this.master = new Master();
        this.master.content.classList.add(`xe-contract`);
        this.element.appendChild(this.master.element);

        const sub_container_1 = document.createElement(`div`);
        this.master.content.appendChild(sub_container_1);

        this.contract_info = new ContractInfo();
        sub_container_1.appendChild(this.contract_info.container.element);

        const sub_container_2 = document.createElement(`div`);
        this.master.content.appendChild(sub_container_2);

        this.contract_assets = new ContractAssets();
        sub_container_2.appendChild(this.contract_assets.container.element);

        this.contract_storage_entries = new ContractStorageEntries();
        sub_container_2.appendChild(this.contract_storage_entries.container.element);
    }

    async load_contract() {
        const { server_data, consumed } = ContractPage.consume_server_data<ContractPageServerData>();
        const id = ContractPage.get_pattern_id(window.location.href);

        this.page_data = {
            server_data
        };

        try {
            if (!consumed && id) {
                const contract_hash = id;
                this.set_window_title(`Contract ${reduce_text(contract_hash)}`);

                const node = XelisNode.instance();
                this.page_data.server_data = await ContractPage.load_server_data(node.rpc, contract_hash);
            }
        } catch {

        }
    }

    async load(parent: HTMLElement) {
        super.load(parent);

        this.contract_info.set_loading(true);
        this.contract_assets.set_loading();
        await this.load_contract();
        this.contract_info.set_loading(false);

        const { server_data } = this.page_data;
        if (server_data && server_data.contract_module) {
            this.set_element(this.master.element);

            const contract_hash = server_data.contract;
            this.contract_info.set(contract_hash, server_data.contract_module);
            this.contract_assets.load(contract_hash);
            await this.contract_storage_entries.load(contract_hash);

            const params = new URLSearchParams(window.location.search);
            const storage_key_param = params.get(`storageKey`);
            if (storage_key_param) {
                const storage_key_topo_param = params.get(`storageKeyTopo`);
                this.contract_storage_entries.show_history_for_param(storage_key_param, storage_key_topo_param);
            }
        } else {
            this.set_element(NotFoundPage.instance().element);
        }
    }

    unload() {
        super.unload();
    }
}
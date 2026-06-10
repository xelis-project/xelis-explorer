import { Page } from "../page";
import { Master } from "../../components/master/master";
import { Table } from "../../components/table/table";
import { Container } from "../../components/container/container";
import { ContractRow } from "./contract_row/contract_row";
import { GetInfoResult } from "@xelis/sdk/daemon/types";
import { get_contracts } from "../../data/contracts";
import { fetch_contracts } from "../../fetch_helpers/fetch_contracts";
import { localization } from "../../localization/localization";
import { ServerApp } from "../../../server";
import { Context } from "hono";
import { XelisNode } from "../../app/xelis_node";
import { Pagination } from "../../components/pagination/pagination";

import './contracts.css';

export class ContractsPage extends Page {
    static pathname = "/contracts";

    static async handle_server(c: Context<ServerApp>) {
        this.title = localization.get_text(`Contracts`);
        this.description = localization.get_text(`List of all deployed smart contracts.`);
    }

    master: Master;

    container_table: Container;
    table: Table;
    pagination: Pagination;

    contract_rows: ContractRow[];
    page_data: {
        info?: GetInfoResult;
    }

    constructor() {
        super();

        this.contract_rows = [];
        this.page_data = {};

        this.master = new Master();
        this.element.appendChild(this.master.element);
        this.master.content.classList.add(`xe-contracts`);

        this.container_table = new Container();
        this.container_table.element.classList.add(`xe-contracts-table`, `scrollbar-1`, `scrollbar-1-bottom`);
        this.master.content.appendChild(this.container_table.element);

        this.table = new Table();
        this.table.set_clickable();
        this.container_table.element.appendChild(this.table.element);

        const titles = [
            localization.get_text(`HASH`),
            localization.get_text(`BALANCE`),
            localization.get_text(`TOPOHEIGHT (BALANCE)`),
            localization.get_text(`REGISTERED`)
        ];
        this.table.set_head_row(titles);

        this.pagination = new Pagination();
        this.pagination.current_page = 1;
        this.pagination.sibling_count = 2;
        this.pagination.page_size = 6;

        this.pagination.add_listener(`page_change`, (page) => {
            this.load_contracts();
        });

        this.master.content.appendChild(this.pagination.element);
    }

    async load_contracts() {
        this.table.body_element.replaceChildren();
        this.table.set_loading(10);

        const xelis_node = XelisNode.instance();

        const total_contracts = await xelis_node.rpc.countContracts();
        this.pagination.total_items = total_contracts;
        this.pagination.render();

        const maximum = this.pagination.page_size;
        const skip = (this.pagination.current_page - 1) * maximum;
        const contracts = await xelis_node.rpc.getContracts({ skip, maximum });

        const contract_rows = [] as ContractRow[];
        for (let i = 0; i < contracts.length; i += 10) {
            const contract_batch = contracts.slice(i, i + 10);
            const contracts_info = await fetch_contracts(contract_batch);

            contracts_info.forEach((contract_info, a) => {
                const hash = contract_batch[a];
                //const contract = contracts[hash];

                const contract_row = new ContractRow();
                contract_row.set(``, contract_info);
                contract_rows.push(contract_row);
            });
        }

        this.table.body_element.replaceChildren();
        contract_rows.forEach((row) => {
            this.table.prepend_row(row.element);
        });

        if (this.table.body_element.children.length === 0) {
            this.table.set_empty(localization.get_text(`No contracts`));
        }
    }

    async load(parent: HTMLElement) {
        super.load(parent);
        this.set_window_title(`Contracts`);
        this.load_contracts();
    }

    unload() {
        super.unload();
        this.master.unload();
    }
}
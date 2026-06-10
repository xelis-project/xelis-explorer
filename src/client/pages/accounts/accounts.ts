import { Page } from "../page";
import { Master } from "../../components/master/master";
import { Table } from "../../components/table/table";
import { Container } from "../../components/container/container";
import { AccountRow, AccountRowData } from "./account_row/account_row";
import { fetch_accounts } from "../../fetch_helpers/fetch_accounts";
import { localization } from "../../localization/localization";
import { ServerApp } from "../../../server";
import { Context } from "hono";
import { XelisNode } from "../../app/xelis_node";
import { Pagination } from "../../components/pagination/pagination";

import './accounts.css';

export class AccountsPage extends Page {
    static pathname = "/accounts";

    static async handle_server(c: Context<ServerApp>) {
        this.title = localization.get_text(`Accounts`);
        this.description = localization.get_text(`List of all the registered accounts.`);
    }

    master: Master;
    container_table: Container;
    table: Table;
    pagination: Pagination;

    account_rows: AccountRow[];

    constructor() {
        super();

        this.account_rows = [];

        this.master = new Master();
        this.element.appendChild(this.master.element);
        this.master.content.classList.add(`xe-accounts`);

        const titles = [
            localization.get_text(`ADDRESS`),
            localization.get_text(`REGISTRATION TOPO`),
            localization.get_text(`IN TOPO`),
            localization.get_text(`OUT TOPO`),
            localization.get_text(`BALANCE`)
        ];

        const links_content = document.createElement(`div`);
        links_content.classList.add(`xe-accounts-links`);
        this.master.content.appendChild(links_content);

        const all_accounts_link = document.createElement(`a`);
        all_accounts_link.href = `/known-accounts`;
        all_accounts_link.innerHTML = localization.get_text(`KNOWN ACCOUNTS`);
        links_content.appendChild(all_accounts_link);

        this.container_table = new Container();
        this.container_table.element.classList.add(`xe-accounts-table`, `scrollbar-1`, `scrollbar-1-bottom`);
        this.master.content.appendChild(this.container_table.element);

        this.table = new Table();
        this.table.set_clickable();
        this.container_table.element.appendChild(this.table.element);
        this.table.set_head_row(titles);

        this.pagination = new Pagination();
        this.pagination.current_page = 1;
        this.pagination.sibling_count = 2;
        this.pagination.page_size = 6;

        this.pagination.add_listener(`page_change`, (page) => {
            this.load_accounts();
        });

        this.master.content.appendChild(this.pagination.element);
    }

    async load_accounts() {
        this.table.body_element.replaceChildren();
        this.table.set_loading(this.pagination.page_size);

        const xelis_node = XelisNode.instance();

        const total_accounts = await xelis_node.rpc.countAccounts();
        this.pagination.total_items = total_accounts;
        this.pagination.render();

        const maximum = this.pagination.page_size;
        const skip = (this.pagination.current_page - 1) * maximum;
        const addresses = await xelis_node.rpc.getAccounts({ skip, maximum });
        const accounts = await fetch_accounts(addresses);

        this.table.body_element.replaceChildren();

        if (accounts.length > 0) {
            accounts.forEach((account_data) => {
                const row = new AccountRow();
                row.set({
                    addr: account_data.addr,
                    in_topo: account_data.balance.topoheight,
                    out_topo: account_data.nonce.topoheight,
                    registration_topo: account_data.registration_topo,
                });
                row.set_link(`/account/${account_data.addr}`);
                this.table.prepend_row(row.element);
            });
        } else {
            this.table.set_empty(localization.get_text(`No addresses`));
        }
    }

    async load(parent: HTMLElement) {
        super.load(parent);
        this.set_window_title(localization.get_text(`Accounts`));
        this.load_accounts();
    }

    unload() {
        super.unload();
        this.master.unload();
    }
}
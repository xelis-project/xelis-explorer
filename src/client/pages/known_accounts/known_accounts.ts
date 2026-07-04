import { Page } from "../page";
import { Master } from "../../components/master/master";
import { Table } from "../../components/table/table";
import { Container } from "../../components/container/container";
import { AccountRow, AccountRowData } from "./account_row/account_row";
import { get_addresses } from "../../data/addresses";
import { fetch_accounts } from "../../fetch_helpers/fetch_accounts";
import { localization } from "../../localization/localization";
import { ServerApp } from "../../../server";
import { Context } from "hono";

import './known_accounts.css';

export class KnownAccountsPage extends Page {
    static pathname = "/known-accounts";

    static async handle_server(c: Context<ServerApp>) {
        this.title = localization.get_text(`Known Accounts`);
        this.description = localization.get_text(`List of popular/known accounts.`);
    }

    master: Master;

    misc_container_table: Container;
    misc_table: Table;

    pool_container_table: Container;
    pool_table: Table;

    exchange_container_table: Container;
    exchange_table: Table;

    account_rows: AccountRow[];

    constructor() {
        super();

        this.account_rows = [];

        this.master = new Master();
        this.element.appendChild(this.master.element);
        this.master.content.classList.add(`xe-known-accounts`);

        const titles = [
            localization.get_text(`NAME`),
            localization.get_text(`ADDRESS`),
            localization.get_text(`LINK`),
            localization.get_text(`REGISTRATION TOPO`),
            localization.get_text(`IN TOPO`),
            localization.get_text(`OUT TOPO`),
            localization.get_text(`BALANCE`)
        ];

        const links_content = document.createElement(`div`);
        links_content.classList.add(`xe-known-accounts-links`);
        this.master.content.appendChild(links_content);

        const all_accounts_link = document.createElement(`a`);
        all_accounts_link.href = `/accounts`;
        all_accounts_link.innerHTML = localization.get_text(`ALL ACCOUNTS`);
        links_content.appendChild(all_accounts_link);

        // misc table
        this.misc_container_table = new Container();
        this.misc_container_table.element.classList.add(`xe-known-accounts-table`, `scrollbar-1`, `scrollbar-1-bottom`);
        this.master.content.appendChild(this.misc_container_table.element);

        const misc_title_element = document.createElement(`div`);
        misc_title_element.innerHTML = localization.get_text(`Miscellaneous`);
        this.misc_container_table.element.appendChild(misc_title_element);

        this.misc_table = new Table();
        this.misc_table.set_clickable();
        this.misc_container_table.element.appendChild(this.misc_table.element);
        this.misc_table.set_head_row(titles);

        // exchange table
        this.exchange_container_table = new Container();
        this.exchange_container_table.element.classList.add(`xe-known-accounts-table`, `scrollbar-1`, `scrollbar-1-bottom`);
        this.master.content.appendChild(this.exchange_container_table.element);

        const exchange_title_element = document.createElement(`div`);
        exchange_title_element.innerHTML = localization.get_text(`Exchanges`);
        this.exchange_container_table.element.appendChild(exchange_title_element);

        this.exchange_table = new Table();
        this.exchange_table.set_clickable();
        this.exchange_container_table.element.appendChild(this.exchange_table.element);
        this.exchange_table.set_head_row(titles);

        // pool table
        this.pool_container_table = new Container();
        this.pool_container_table.element.classList.add(`xe-known-accounts-table`, `scrollbar-1`, `scrollbar-1-bottom`);
        this.master.content.appendChild(this.pool_container_table.element);

        const pool_title_element = document.createElement(`div`);
        pool_title_element.innerHTML = localization.get_text(`Pools`);
        this.pool_container_table.element.appendChild(pool_title_element);

        this.pool_table = new Table();
        this.pool_table.set_clickable();
        this.pool_container_table.element.appendChild(this.pool_table.element);
        this.pool_table.set_head_row(titles);
    }

    async load_account_table(table: Table, addr_list: string[]) {
        let accounts = [] as AccountRowData[];
        const addresses = get_addresses();

        for (let i = 0; i < addr_list.length; i += 6) {
            const addr_batch = addr_list.slice(i, i + 6);
            const accounts_info = await fetch_accounts(addr_batch);
            accounts_info.forEach((account_info, a) => {
                const addr = addr_batch[a];
                const addr_info = addresses[addr];

                accounts.push({
                    addr: addr,
                    in_topo: account_info.balance.topoheight,
                    out_topo: account_info.nonce.topoheight,
                    name: addr_info.name,
                    registration_topo: account_info.registration_topo,
                    link: addr_info.link
                });
            });
        }
        table.clear();

        if (accounts.length > 0) {
            accounts.forEach((account_data) => {
                const row = new AccountRow();
                row.set(account_data);
                table.prepend_row(row);
            });
        } else {
            table.add_empty_row().set_empty(localization.get_text(`No addresses`));
        }
    }

    async load(parent: HTMLElement) {
        super.load(parent);
        this.set_window_title(localization.get_text(`Known Accounts`));

        const miscellaneous = get_addresses("miscellaneous");
        const exchanges = get_addresses("exchange");
        const pools = get_addresses("pool");

        const misc_addr_keys = Object.keys(miscellaneous);
        const exchange_addr_keys = Object.keys(exchanges);
        const pool_addr_keys = Object.keys(pools);

        this.misc_table.set_loading(misc_addr_keys.length);
        this.exchange_table.set_loading(exchange_addr_keys.length);
        this.pool_table.set_loading(pool_addr_keys.length);

        this.load_account_table(this.misc_table, misc_addr_keys);
        this.load_account_table(this.exchange_table, exchange_addr_keys);
        this.load_account_table(this.pool_table, pool_addr_keys);
    }

    unload() {
        super.unload();
        this.master.unload();
    }
}
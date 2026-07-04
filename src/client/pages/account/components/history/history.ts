import { Container } from '../../../../components/container/container';
import { localization } from '../../../../localization/localization';
import { Table } from '../../../../components/table/table';
import { Select } from '../../../../components/select/select';
import { XelisNode } from '../../../../app/xelis_node';
import { HistoryRow } from './history_row/history_row';
import { AssetWithData } from '@xelis/sdk/daemon/types';
import icons from '../../../../assets/svg/icons';
import { AccountServerData } from '../../account';
import { format_hash } from '../../../../utils/format_hash';
import { PrevNextPager } from '../../../../components/prev_next_pager/prev_next_pager';

import './history.css';

export class AccountHistory {
    container: Container;
    table: Table;
    flow_filter_select: Select;
    asset_filter_select: Select;
    controls_container: HTMLDivElement;

    account_server_data?: AccountServerData;
    filter_asset?: string;
    filter_direction?: string;
    prev_next_pager: PrevNextPager;

    history_rows: HistoryRow[];

    constructor() {
        this.history_rows = [];

        this.container = new Container();
        this.container.element.classList.add(`xe-account-history`);

        const titles = [
            localization.get_text(`TOPOHEIGHT`),
            localization.get_text(`HASH`),
            localization.get_text(`ACTION`),
            localization.get_text(`ACCOUNT`),
            localization.get_text(`AMOUNT`),
            localization.get_text(`AGE`)
        ];

        const top_container = document.createElement(`div`);
        this.container.element.appendChild(top_container);

        const title_element = document.createElement(`div`);
        title_element.innerHTML = localization.get_text(`HISTORY`);
        top_container.appendChild(title_element);

        this.controls_container = document.createElement(`div`);
        top_container.appendChild(this.controls_container);

        const flow_filters = {
            "all": `<span class="all">${icons.dual_arrow()}</span>` + localization.get_text(`All Directions`),
            "incoming": `<span class="incoming">${icons.arrow()}</span>` + localization.get_text(`Incoming`),
            "outgoing": `<span class="outgoing">${icons.arrow()}</span>` + localization.get_text(`Outgoing`)
        } as Record<string, string>;

        this.flow_filter_select = new Select();
        this.flow_filter_select.element.classList.add(`xe-account-history-flow-filters`);
        Object.keys(flow_filters).forEach((key) => {
            this.flow_filter_select.add_item(key, flow_filters[key]);
        });
        this.flow_filter_select.set_value(flow_filters[`all`]);

        this.flow_filter_select.add_listener(`change`, (key) => {
            this.filter_direction = key;
            this.prev_next_pager.pager_numbers = [];
            this.prev_next_pager.pager_max = undefined;
            this.load_history();
        });

        this.controls_container.appendChild(this.flow_filter_select.element);

        this.asset_filter_select = new Select();
        this.asset_filter_select.add_listener(`change`, (key) => {
            this.filter_asset = key;
            this.prev_next_pager.pager_numbers = [];
            this.prev_next_pager.pager_max = undefined;
            this.load_history();
        });

        const table_container = document.createElement(`div`);
        table_container.classList.add(`xe-account-history-table`, `scrollbar-1`, `scrollbar-1-rounded`)
        this.container.element.appendChild(table_container);

        this.table = new Table();
        this.table.element.classList.add();
        this.table.set_clickable();
        table_container.appendChild(this.table.element);
        this.table.set_head_row(titles);

        this.prev_next_pager = new PrevNextPager();
        this.prev_next_pager.load_func = () => this.load_history();
        this.container.element.appendChild(this.prev_next_pager.element);
    }

    set_filter_assets(assets: AssetWithData[]) {
        this.asset_filter_select.element.remove();
        this.asset_filter_select.clear();

        const asset = assets[0];
        this.asset_filter_select.set_value(`${asset.name} (${format_hash(asset.asset)})`);
        this.filter_asset = asset.asset;

        assets.forEach((asset) => {
            this.asset_filter_select.add_item(asset.asset, `${asset.name} (${format_hash(asset.asset)})`);
        });
        this.controls_container.appendChild(this.asset_filter_select.element);
    }


    async set(data: AccountServerData, assets: AssetWithData[]) {
        this.account_server_data = data;

        this.set_filter_assets(assets);
        //const last_topo = 0; // this.account_server_data.balance.topoheight;
        const first_topo = this.account_server_data.registration_topoheight;
        //this.prev_next_pager.pager_max = last_topo;
        this.prev_next_pager.pager_min = first_topo;
        await this.load_history();
    }

    async load_history() {
        if (!this.account_server_data) return;
        if (!this.filter_asset) return;

        this.history_rows = [];
        const node = XelisNode.instance();

        let incoming = true;
        let outgoing = true;
        switch (this.filter_direction) {
            case "incoming":
                outgoing = false;
                break;
            case "outgoing":
                incoming = false;
                break;
        }

        const max_topo = this.prev_next_pager.get_next();
        const history = await node.rpc.getAccountHistory({
            address: this.account_server_data.address,
            asset: this.filter_asset,
            incoming_flow: incoming,
            outgoing_flow: outgoing,
            maximum_topoheight: max_topo,
        });
        this.table.clear();

        if (history.length === 0) {
            this.table.add_empty_row().set_empty(localization.get_text(`No history. Check whether any filtering options are applied.`));
        }

        history.sort((a, b) => a.block_timestamp - b.block_timestamp);
        history.forEach((item) => {
            const history_row = new HistoryRow();
            history_row.set(item);
            this.history_rows.push(history_row);

            this.table.prepend_row(history_row);
        });

        const first_item = history[history.length - 1];
        if (!this.prev_next_pager.pager_max) {
            this.prev_next_pager.pager_max = first_item.topoheight;
        }

        this.prev_next_pager.pager_current = first_item.topoheight;
        this.prev_next_pager.pager_next = history[0].topoheight - 1;
        this.prev_next_pager.render();
    }
}
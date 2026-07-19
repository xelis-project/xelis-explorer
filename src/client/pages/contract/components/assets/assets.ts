import { GetContractBalanceResult } from '@xelis/sdk/daemon/types';
import { XelisNode } from '../../../../app/xelis_node';
import { Container } from '../../../../components/container/container';
import { fetch_contract_balances } from '../../../../fetch_helpers/fetch_contract_balances';
import { format_hash } from '../../../../utils/format_hash';
import { Box } from '../../../../components/box/box';
import { localization } from '../../../../localization/localization';
import { ws_format_asset } from '../../../../utils/ws_format_asset';
import icons from '../../../../assets/svg/icons';

import './assets.css';

export class ContractAssets {
    container: Container;
    list_element: HTMLElement;

    constructor() {
        this.container = new Container();
        this.container.element.classList.add(`xe-contract-assets`);

        const title_element = document.createElement(`div`);
        title_element.innerHTML = localization.get_text(`BALANCES`);
        this.container.element.appendChild(title_element);

        this.list_element = document.createElement(`div`);
        this.list_element.classList.add(`xe-contract-assets-list`, `scrollbar-1`, `scrollbar-1-right`);
        this.container.element.appendChild(this.list_element);
    }

    async add_item(asset: string, balance: GetContractBalanceResult) {
        const box = new Box();
        const node = XelisNode.instance();

        const container = document.createElement(`div`);
        box.element.appendChild(container);

        const asset_element = document.createElement(`div`);
        container.appendChild(asset_element);
        asset_element.innerHTML = `<a href="/asset/${asset}">${format_hash(asset)}</a>`;

        const topo_element = document.createElement(`div`);
        container.appendChild(topo_element);
        topo_element.innerHTML = `${balance.topoheight.toLocaleString()} (${balance.previous_topoheight ? balance.previous_topoheight.toLocaleString() : `--`})`;

        const balance_element = document.createElement(`div`);
        box.element.appendChild(balance_element);
        const asset_amount_string = await ws_format_asset(node.ws, asset, balance.data);
        balance_element.innerHTML = asset_amount_string;

        this.list_element.appendChild(box.element);
    }

    set_loading() {
        this.list_element.replaceChildren();
        Box.list_loading(this.list_element, 5, `1rem`);
    }

    async load(contract_hash: string) {
        const node = XelisNode.instance();

        const assets = await node.rpc.getContractAssets({
            contract: contract_hash
        });

        const balances = await fetch_contract_balances(contract_hash, assets);

        this.list_element.replaceChildren();

        if (balances.length === 0) {
            const empty_element = document.createElement(`div`);
            empty_element.classList.add(`xe-contract-assets-empty`);
            empty_element.innerHTML = `
                ${icons.empty_box()}
                <div>${localization.get_text(`No balance for this contract`)}</div>
                <div style="font-size: 1.3rem; opacity: 0.7; margin-top: 0.5rem;">${localization.get_text(`This contract has no balance yet`)}</div>
            `;
            this.list_element.appendChild(empty_element);
        } else {
            balances.forEach((balance, i) => {
                const asset = assets[i];
                this.add_item(asset, balance);
            });
        }
    }
}

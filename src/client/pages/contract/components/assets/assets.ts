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
    pagination_element: HTMLElement;
    info_element: HTMLElement;

    private contract_hash?: string;
    private page_size = 20;
    private current_page = 0;
    private has_next_page = false;
    private total_assets_shown = 0;

    constructor() {
        this.container = new Container();
        this.container.element.classList.add(`xe-contract-assets`);

        const title_element = document.createElement(`div`);
        title_element.innerHTML = localization.get_text(`BALANCES`);
        this.container.element.appendChild(title_element);

        this.list_element = document.createElement(`div`);
        this.list_element.classList.add(`xe-contract-assets-list`, `scrollbar-1`, `scrollbar-1-right`);
        this.container.element.appendChild(this.list_element);

        this.info_element = document.createElement(`div`);
        this.info_element.classList.add(`xe-contract-assets-info`);
        this.container.element.appendChild(this.info_element);

        this.pagination_element = document.createElement(`div`);
        this.pagination_element.classList.add(`xe-contract-assets-pagination`);
        this.container.element.insertBefore(this.pagination_element, this.list_element);

        this.render_pagination();
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
        Box.list_loading(this.list_element, this.page_size, `1rem`);
        Box.content_loading(this.pagination_element, true);
    }

    private render_pagination() {
        this.pagination_element.replaceChildren();

        const first_button = document.createElement(`button`);
        first_button.classList.add(`xe-contract-assets-pagination-btn`);
        first_button.innerHTML = icons.page_end();
        first_button.title = localization.get_text(`First page`);
        first_button.disabled = this.current_page === 0;
        first_button.onclick = () => this.goto_page(0);
        this.pagination_element.appendChild(first_button);

        const previous_button = document.createElement(`button`);
        previous_button.classList.add(`xe-contract-assets-pagination-btn`);
        previous_button.innerHTML = icons.page_next();
        previous_button.title = localization.get_text(`Previous page`);
        previous_button.disabled = this.current_page === 0;
        previous_button.onclick = () => this.goto_page(this.current_page - 1);
        this.pagination_element.appendChild(previous_button);

        const page_indicator = document.createElement(`div`);
        page_indicator.classList.add(`xe-contract-assets-page-indicator`);
        page_indicator.innerText = localization.get_text(`Page {}`, [(this.current_page + 1).toLocaleString()]);
        this.pagination_element.appendChild(page_indicator);

        const next_button = document.createElement(`button`);
        next_button.classList.add(`xe-contract-assets-pagination-btn`);
        next_button.innerHTML = icons.page_next();
        next_button.style.rotate = `180deg`;
        next_button.title = localization.get_text(`Next page`);
        next_button.disabled = !this.has_next_page;
        next_button.onclick = () => this.goto_page(this.current_page + 1);
        this.pagination_element.appendChild(next_button);

        if (this.total_assets_shown > 0) {
            const start = this.current_page * this.page_size + 1;
            const end = start + this.total_assets_shown - 1;
            this.info_element.innerHTML = localization.get_text(`Showing {}-{} entries`, [
                start.toLocaleString(),
                end.toLocaleString()
            ]);
            if (this.has_next_page) {
                this.info_element.innerHTML += ` ${localization.get_text(`(more available)`)}`;
            }
        } else {
            this.info_element.innerHTML = ``;
        }
    }

    private async goto_page(page: number) {
        if (!this.contract_hash || page < 0) {
            return;
        }
        this.current_page = page;
        this.render_pagination();
        await this.load_assets(this.contract_hash, page);
    }

    private async load_assets(contract_hash: string, page: number) {
        const node = XelisNode.instance();
        const skip = page * this.page_size;
        const maximum = this.page_size;

        this.list_element.replaceChildren();
        this.set_loading();

        try {
            const assets = await node.rpc.getContractAssets({
                contract: contract_hash,
                skip,
                maximum
            });

            const balances = await fetch_contract_balances(contract_hash, assets);

            this.total_assets_shown = assets.length;
            this.has_next_page = assets.length === maximum;
            this.render_pagination();

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
                for (let i = 0; i < balances.length; i++) {
                    await this.add_item(assets[i], balances[i]);
                }
            }
            Box.content_loading(this.pagination_element, false);
        } catch (e) {
            console.error(`Failed to load contract balances for ${contract_hash}:`, e);
            this.list_element.replaceChildren();
            this.total_assets_shown = 0;
            this.has_next_page = false;
            this.render_pagination();
            Box.content_loading(this.pagination_element, false);
        }
    }

    async load(contract_hash: string) {
        this.contract_hash = contract_hash;
        this.current_page = 0;
        this.has_next_page = false;
        this.total_assets_shown = 0;
        this.render_pagination();
        await this.load_assets(contract_hash, this.current_page);
    }
}

import { AccountHistory, TransactionData } from "@xelis/sdk/daemon/types";
import prettyMilliseconds from "pretty-ms";
import { Row } from "../../../../../components/table/row";
import { format_hash } from "../../../../../utils/format_hash";
import { localization } from "../../../../../localization/localization";
import { XelisNode } from "../../../../../app/xelis_node";
import { ws_format_asset } from "../../../../../utils/ws_format_asset";
import { hashicon } from "@emeraldpay/hashicon";
import { format_address } from "../../../../../utils/format_address";
import { format_xel } from "../../../../../utils/format_xel";

import './history_row.css';
import icons from "../../../../../assets/svg/icons";

export class HistoryRow extends Row {
    data?: AccountHistory;

    constructor() {
        super(6);

        this.value_cells[2].classList.add(`xe-account-history-action`);
        this.value_cells[3].classList.add(`xe-account-history-account`);
        this.value_cells[4].classList.add(`xe-account-history-amount`);
    }

    set(account_history: AccountHistory) {
        this.data = account_history;
        this.set_topoheight(account_history.topoheight);
        this.set_hash(account_history);
        this.set_type(account_history);
        this.set_age(account_history.block_timestamp);
    }

    set_topoheight(height: number) {
        this.value_cells[0].innerHTML = `<a href="/topo/${height}">${height.toLocaleString()}</a>`;
    }

    set_hash(account_history: AccountHistory) {
        const { hash } = account_history;
        let link = `/tx/${hash}`;
        if (account_history.mining || account_history.dev_fee) {
            link = `/block/${hash}`;
        }

        this.value_cells[1].innerHTML = `<a href="${link}">${format_hash(hash)}</a>`;
    }

    async set_type(history: AccountHistory) {
        if (history.incoming) {
            const addr = history.incoming.from;
            this.value_cells[2].innerHTML = `<span class="receive">${icons.arrow()}</span> ${localization.get_text(`RECEIVE`)}`;

            const to_icon = hashicon(addr, { size: 25 }) as HTMLCanvasElement;
            this.value_cells[3].appendChild(to_icon);
            const addr_text = document.createElement(`div`);
            addr_text.innerHTML = `<a href="/account/${addr}">${format_address(addr)}</a>`;
            this.value_cells[3].appendChild(addr_text);

            this.value_cells[4].innerHTML = icons.lock() + localization.get_text(`ENCRYPTED`);
        }

        if (history.outgoing) {
            const addr = history.outgoing.to;
            this.value_cells[2].innerHTML = icons.arrow() + localization.get_text(`SEND`);

            const to_icon = hashicon(addr, { size: 25 }) as HTMLCanvasElement;
            this.value_cells[3].appendChild(to_icon);
            const addr_text = document.createElement(`div`);
            addr_text.innerHTML = `<a href="/account/${addr}">${format_address(addr)}</a>`;
            this.value_cells[3].appendChild(addr_text);

            this.value_cells[4].innerHTML = icons.lock() + localization.get_text(`ENCRYPTED`);
        }

        if (history.dev_fee) {
            const xel_amount = format_xel(history.dev_fee.reward, true);
            this.value_cells[2].innerHTML = icons.wallet() + localization.get_text(`DEV FEE`);
            this.value_cells[3].innerHTML = localization.get_text(`COINBASE`);
            this.value_cells[4].innerHTML = xel_amount;
        }

        if (history.mining) {
            const xel_amount = format_xel(history.mining.reward, true);
            this.value_cells[2].innerHTML = icons.compute() + localization.get_text(`MINING`);
            this.value_cells[3].innerHTML = localization.get_text(`COINBASE`);
            this.value_cells[4].innerHTML = xel_amount;
        }

        if (history.burn) {
            const node = XelisNode.instance();
            const { amount, asset } = history.burn;
            this.value_cells[2].innerHTML = icons.burn() + localization.get_text(`BURN`);
            this.value_cells[3].innerHTML = localization.get_text(`COINBASE`);
            this.value_cells[4].innerHTML = await ws_format_asset(node.ws, asset, amount);
        }

        // deploy contract is an empty object, we have to check condition with Reflect
        if (Reflect.has(history, `deploy_contract`)) {
            this.value_cells[2].innerHTML = icons.contract() + localization.get_text(`DEPLOY CONTRACT`);
            this.value_cells[3].innerHTML = localization.get_text(`COINBASE`);
            this.value_cells[4].innerHTML = `--`;
        }

        if (history.invoke_contract) {
            const contract_hash = format_hash(history.invoke_contract.contract);
            this.value_cells[2].innerHTML = icons.contract() + localization.get_text(`INVOKE CONTRACT`);
            this.value_cells[3].innerHTML = `<a href="/tx/${contract_hash}>${format_hash(contract_hash)}</a>`;
            this.value_cells[4].innerHTML = `--`;
        }

        if (history.multi_sig) {
            const state = `${history.multi_sig.participants.length} / ${history.multi_sig.threshold}`;
            this.value_cells[2].innerHTML = localization.get_text(`MULTISIG`);
            this.value_cells[3].innerHTML = state;
            this.value_cells[4].innerHTML = `--`;
        }

        if (history.from_contract) {
            const node = XelisNode.instance();
            const { contract, asset, amount } = history.from_contract;
            this.value_cells[2].innerHTML = icons.contract() + localization.get_text(`FROM CONTRACT`);
            this.value_cells[3].innerHTML = `<a href="/contract/${contract}">${format_hash(contract)}</a>`;
            this.value_cells[4].innerHTML = await ws_format_asset(node.ws, asset, amount);
        }
    }

    set_age(timestamp: number) {
        const time_ago = Date.now() - timestamp;
        if (time_ago > 60 * 1000 * 60) {
            this.value_cells[5].innerHTML = prettyMilliseconds(time_ago, { compact: true });
            return;
        }

        this.value_cells[5].innerHTML = prettyMilliseconds(time_ago, { colonNotation: true, secondsDecimalDigits: 0 });
    }

    unload(): void {
        this.data = undefined;
        super.unload();
    }
}
import { Transfer } from "@xelis/sdk/daemon/types";
import { Box } from "../../../../components/box/box";
import { hashicon } from '@emeraldpay/hashicon';
import { format_address } from "../../../../utils/format_address";
import prettyBytes from "pretty-bytes";
import { get_assets } from "../../../../data/assets";
import { format_hash } from "../../../../utils/format_hash";

import './transfer_item.css';

export class TransactionTransferItem {
    box: Box;

    recipient_element: HTMLAnchorElement;
    extra_data: HTMLDivElement;
    asset_element: HTMLDivElement;
    commitment_element: HTMLDivElement;

    constructor() {
        this.box = new Box();
        this.box.element.classList.add(`xe-transaction-transfer-item`);

        const container_1 = document.createElement(`div`);
        this.box.element.appendChild(container_1);

        this.recipient_element = document.createElement(`a`);
        this.recipient_element.classList.add(`xe-transaction-transfer-item-recipient`);
        container_1.appendChild(this.recipient_element);
        this.asset_element = document.createElement(`div`);
        this.asset_element.classList.add(`xe-transaction-transfer-item-asset`);
        container_1.appendChild(this.asset_element);

        const container_2 = document.createElement(`div`);
        this.box.element.appendChild(container_2);

        this.extra_data = document.createElement(`div`);
        this.extra_data.classList.add(`xe-transaction-transfer-item-extra-data`);
        container_2.appendChild(this.extra_data);
        this.commitment_element = document.createElement(`div`);
        this.commitment_element.classList.add(`xe-transaction-transfer-item-commitment`);
        container_2.appendChild(this.commitment_element);
    }

    set(transfer: Transfer) {
        this.set_recipient(transfer.destination);
        this.set_asset(transfer.asset);
        this.set_commitment(transfer.commitment);
        this.set_extra_data(transfer.extra_data);
    }

    set_recipient(addr: string) {
        const recipient_icon = hashicon(addr, { size: 25 }) as HTMLCanvasElement;
        this.recipient_element.replaceChildren();
        this.recipient_element.href = `/account/${addr}`;
        this.recipient_element.appendChild(recipient_icon);
        const recipient_text = document.createElement(`div`);
        recipient_text.innerHTML = format_address(addr);
        this.recipient_element.appendChild(recipient_text);
    }

    set_asset(asset_hash: string) {
        const assets = get_assets();
        const asset = assets[asset_hash];

        this.asset_element.innerHTML = `
            <div>ASSET</div>
            <div>${format_hash(asset_hash)}${asset ? ` (${asset.ticker})` : ``}</div>
        `;
    }

    set_extra_data(extra_data?: number[]) {
        const extra_data_size = (extra_data || []).length;
        const hex_extra_data = (extra_data || []).map((v) => (v as number).toString(16)).join(``);
        this.extra_data.innerHTML = `
            <div>EXTRA DATA</div>
            <div>${extra_data ? `(${prettyBytes(extra_data_size)}) ${hex_extra_data.slice(0, 20)}...` : `--`}</div>
        `;
    }

    set_commitment(commitment: number[]) {
        const hex_commitment = commitment.map((v) => v.toString(16)).join(``);
        this.commitment_element.innerHTML = `
            <div>COMMITMENT</div>
            <div>...${hex_commitment.slice(hex_commitment.length - 20, hex_commitment.length)}</div>
        `;
    }
}

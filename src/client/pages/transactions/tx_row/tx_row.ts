import { Block, Transaction, TransactionData, TransactionResponse } from "@xelis/sdk/daemon/types";
import { format_address } from "../../../utils/format_address";
import { hashicon } from "@emeraldpay/hashicon";
import prettyBytes from "pretty-bytes";
import { format_xel } from "../../../utils/format_xel";
import prettyMilliseconds from "pretty-ms";
import { Row } from "../../../components/table/row";
import { format_hash } from "../../../utils/format_hash";
import { localization } from "../../../localization/localization";
import { XelisNode } from "../../../app/xelis_node";
import { ws_format_asset } from "../../../utils/ws_format_asset";

import './tx_row.css';

export class TxRow extends Row {
    block?: Block;
    tx?: Transaction;

    constructor() {
        super(8);
    }

    set(block: Block, transaction: TransactionResponse) {
        this.block = block;
        this.tx = transaction;
        
        this.set_height(block.height);
        this.set_hash(transaction.hash);
        this.set_type(transaction.data);
        this.set_signer(transaction.source);
        this.set_size(transaction.size);
        this.set_fee(transaction.fee);
        this.set_executed_in_block(transaction.executed_in_block);
        this.set_age(block.timestamp);
        this.set_link(`/tx/${transaction.hash}`);
    }

    set_height(height: number) {
        this.value_cells[0].innerHTML = `${height.toLocaleString()}`;
    }

    set_hash(hash: string) {
        this.value_cells[1].innerHTML = format_hash(hash);
    }

    async set_type(data: TransactionData) {
        const node = XelisNode.instance();

        let value = ``;
        if (data.burn) {
            const asset_amount_string = await ws_format_asset(node.ws, data.burn.asset, data.burn.amount);
            value = localization.get_text(`Burn {}`, [asset_amount_string]);
        } else if (data.deploy_contract) {
            value = localization.get_text(`Deploy Contract`);
        } else if (data.invoke_contract) {
            value = localization.get_text(`Invoke Contract ({})`, [format_hash(data.invoke_contract.contract)]);
        } else if (data.multi_sig) {
            value = localization.get_text(`Multi Sig {} / {}`, [
                data.multi_sig.participants.length.toLocaleString(),
                data.multi_sig.threshold.toLocaleString()
            ]);
        } else if (data.transfers) {
            const transfer_count = data.transfers.length;
            value = localization.get_text(`{} transfers`, [transfer_count.toLocaleString()]);
        }

        this.value_cells[2].innerHTML = value;
    }

    set_signer(signer: string) {
        const container = document.createElement(`div`);
        container.classList.add(`xe-blocks-table-miner`);

        const signer_icon = hashicon(signer, { size: 25 }) as HTMLCanvasElement;
        container.appendChild(signer_icon);

        const signer_addr = document.createElement(`div`);
        signer_addr.innerHTML = format_address(signer);
        container.appendChild(signer_addr);

        this.value_cells[3].replaceChildren();
        this.value_cells[3].appendChild(container);
    }

    set_size(size_in_bytes: number) {
        this.value_cells[4].innerHTML = prettyBytes(size_in_bytes);
    }

    set_fee(fee: number) {
        this.value_cells[5].innerHTML = format_xel(fee, true);
    }

    set_executed_in_block(executed_in_block?: string) {
        this.value_cells[6].innerHTML = executed_in_block ? format_hash(executed_in_block) : `--`;
    }

    set_age(timestamp: number) {
        this.value_cells[7].innerHTML = prettyMilliseconds(Date.now() - timestamp, { colonNotation: true, secondsDecimalDigits: 0 });
    }

    unload(): void {
        this.block = undefined;
        this.tx = undefined;
        super.unload();
    }
}
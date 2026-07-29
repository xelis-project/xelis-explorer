import { format_address } from "../../../../utils/format_address";
import { hashicon } from '@emeraldpay/hashicon';
import { format_xel } from "../../../../utils/format_xel";
import { Transaction, TransactionData } from "@xelis/sdk/daemon/types";
import prettyBytes from "pretty-bytes";
import { Row } from "../../../../components/table/row";
import { format_hash } from "../../../../utils/format_hash";
import { localization } from "../../../../localization/localization";
import { XelisNode } from "../../../../app/xelis_node";
import { ws_format_asset } from "../../../../utils/ws_format_asset";

export class TxRow extends Row {
    constructor() {
        super(5);
        this.element.classList.add(`xe-blocks-tx-row`);
    }

    set(tx: Transaction) {
        this.set_hash(tx.hash);
        this.set_fee(tx.fee);
        this.set_signer(tx.source);
        this.set_type(tx.data);
        this.set_size(tx.size);
        this.set_link(`/tx/${tx.hash}`);
    }

    set_hash(hash: string) {
        this.value_cells[0].innerHTML = `${format_hash(hash)}`;
    }

    async set_type(data: TransactionData) {
        const node = XelisNode.instance();
        
        let value = ``;
        if (data.burn) {
            const asset_amount_string = await ws_format_asset(node.ws, data.burn.asset, data.burn.amount);
            value = `Burn ${asset_amount_string}`;
        } else if (data.deploy_contract) {
            value = `Deploy Contract`;
        } else if (data.invoke_contract) {
            value = `Invoke Contract (${format_hash(data.invoke_contract.contract)})`;
        } else if (data.multi_sig) {
            value = `Multi Sig ${data.multi_sig.participants.length} / ${data.multi_sig.threshold}`;
        } else if (data.transfers) {
            const transfer_count = data.transfers.length;
            value = localization.get_text(`{} transfers`, [transfer_count.toLocaleString()]);
        }

        this.value_cells[1].innerHTML = value;
    }

    set_signer(signer: string) {
        const container = document.createElement(`div`);
        container.classList.add(`xe-table-miner`);

        const signer_icon = hashicon(signer, { size: 25 }) as HTMLCanvasElement;
        container.appendChild(signer_icon);

        const signer_addr = document.createElement(`div`);
        signer_addr.innerHTML = format_address(signer);
        container.appendChild(signer_addr);

        this.value_cells[2].replaceChildren();
        this.value_cells[2].appendChild(container);
    }

    set_size(size_in_bytes: number) {
        this.value_cells[3].innerHTML = `${prettyBytes(size_in_bytes)}`;
    }

    set_fee(fee: number) {
        this.value_cells[4].innerHTML = `${format_xel(fee, true)}`;
    }
}

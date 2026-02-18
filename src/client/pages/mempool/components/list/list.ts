import { localization } from "../../../../localization/localization";
import icons from "../../../../assets/svg/icons";
import { Container } from "../../../../components/container/container";
import { TxBlock, TxItem } from "../../../../components/tx_item/tx_item";

import './list.css';

export class MempoolTxsList {
    container: Container;
    empty_element: HTMLDivElement;
    tx_items: TxItem[];

    constructor() {
        this.tx_items = [];
        this.container = new Container();
        this.container.element.classList.add(`xe-mempool-txs-list`, `scrollbar-1`, `scrollbar-1-right`);

        this.empty_element = document.createElement(`div`);
        this.empty_element.classList.add(`xe-mempool-txs-list-empty`);
        this.empty_element.innerHTML = `${icons.exchange()}<div>${localization.get_text(`No transactions in mempool`)}</div>`;
    }

    set_empty(empty: boolean) {
        if (empty) {
            this.container.element.replaceChildren();
            this.tx_items = [];
            this.container.element.appendChild(this.empty_element);
        } else {
            this.empty_element.remove();
        }
    }

    prepend_tx(tx_block: TxBlock) {
        const tx_item = new TxItem(`/tx/${tx_block.tx.hash}`);
        tx_item.set(tx_block);

        // do not append if tx is already in the list
        const exists = this.tx_items.find(x => {
            if (x.data) return x.data.tx.hash === tx_block.tx.hash
        });
        if (exists) return;

        this.tx_items.unshift(tx_item);
        this.container.element.insertBefore(tx_item.box.element, this.container.element.firstChild);
    }

    set(txs_block: TxBlock[]) {
        this.tx_items = [];
        this.container.element.replaceChildren();
        txs_block.forEach((tx_block) => {
            this.prepend_tx(tx_block);
        });
    }

    filter_tx_hashes = undefined as string[] | undefined;
    is_in_filter(tx_item: TxItem) {
        if (this.filter_tx_hashes) {
            const data = tx_item.data;
            if (data && this.filter_tx_hashes && this.filter_tx_hashes.length > 0) {
                return this.filter_tx_hashes.indexOf(data.tx.hash) !== -1;
            }

            return false;
        }

        return true;
    }

    update_filter() {
        this.tx_items.forEach((tx_item) => {
            const parent_element = tx_item.box.element.parentElement;
            if (!this.is_in_filter(tx_item)) {
                tx_item.box.element.remove();
            } else if (!parent_element) {
                this.container.element.insertBefore(tx_item.box.element, this.container.element.firstChild);
            }
        });
    }
}
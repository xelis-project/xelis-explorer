import { Block } from "@xelis/sdk/daemon/types";
import { Container } from "../../../../components/container/container";
import { Table } from "../../../../components/table/table";
import { TxRow } from "../tx_row/tx_row";
import { localization } from "../../../../localization/localization";
import { TxDataHover } from "../../../../components/tx_data_hover/tx_data_hover";
import { fetch_block_txs } from "../../../../fetch_helpers/fetch_block_txs";

import './txs.css';

export class BlockTxs {
    container: Container;
    table: Table;
    tx_data_hover: TxDataHover;

    tx_rows: TxRow[] = [];
    tx_data_hover_timeout?: number;

    constructor() {
        this.container = new Container();
        this.container.element.classList.add(`xe-block-txs`);

        this.tx_data_hover = new TxDataHover();
        //this.container.element.appendChild(this.tx_data_hover.element);

        this.table = new Table();
        this.table.set_clickable();
        this.container.element.appendChild(this.table.element);

        const titles = [
            localization.get_text(`HASH`),
            localization.get_text(`TYPE`),
            localization.get_text(`SIGNER`),
            localization.get_text(`SIZE`),
            localization.get_text(`FEE`)
        ];
        this.table.set_head_row(titles);
    }

    async load(block: Block) {
        await fetch_block_txs(block);

        this.table.clear();
        if (block.transactions && block.transactions.length > 0) {
            block.transactions.forEach((tx) => {
                const tx_row = new TxRow();
                tx_row.set(tx);

                tx_row.element.addEventListener(`mouseenter`, (e) => {
                    if (this.tx_data_hover.visible) return;
                    window.clearInterval(this.tx_data_hover_timeout);
                    this.tx_data_hover_timeout = window.setTimeout(() => {
                        this.tx_data_hover.set_pos(e.pageX + 300, e.pageY - (this.tx_data_hover.element.clientHeight / 2));
                        this.tx_data_hover.show(tx.data);
                    }, 500);
                });

                tx_row.element.addEventListener(`mouseleave`, (e) => {
                    window.clearInterval(this.tx_data_hover_timeout);
                    if (!this.tx_data_hover.element.contains(e.relatedTarget as Node)) {
                        this.tx_data_hover.hide();
                    }
                });

                this.table.prepend_row(tx_row);
                this.tx_rows.push(tx_row);
            });
        } else {
            this.table.add_empty_row().set_empty(localization.get_text(`No transactions`));
        }
    }

    unload() {
        window.clearInterval(this.tx_data_hover_timeout);
        this.tx_rows.forEach(row => row.unload());
        this.tx_rows = [];
    }
}
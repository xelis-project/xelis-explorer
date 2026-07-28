import { localization } from "../../../../localization/localization";
import { Container } from "../../../../components/container/container";
import { TextInput } from "../../../../components/text_input/text_input";
import { MempoolPage } from "../../mempool";
import { App } from "../../../../app/app";

import './search.css';

export class MempoolSearch {
    container: Container;
    text_input: TextInput;

    constructor() {
        this.container = new Container();
        this.container.element.classList.add(`xe-mempool-search`);

        const form = document.createElement(`form`);
        this.container.element.appendChild(form);

        this.text_input = new TextInput();
        this.text_input.element.name = `mempool_search_input`;
        this.text_input.element.placeholder = localization.get_text(`Search transaction (account address or tx hash)`);
        form.appendChild(this.text_input.element);

        let search_timeout_id: number | undefined;
        form.addEventListener(`input`, (e) => {
            if (search_timeout_id) window.clearTimeout(search_timeout_id);

            search_timeout_id = window.setTimeout(() => {
                this.search();
            }, 500);
        });

        form.addEventListener(`submit`, (e) => {
            e.preventDefault();
            if (search_timeout_id) window.clearTimeout(search_timeout_id);
            this.search();
        });
    }

    async search() {
        const value = this.text_input.element.value;
        const { mempool_txs_list } = App.instance().current_page as MempoolPage;

        if (value.length > 0) {
            let filter_tx_hashes = [] as string[];

            mempool_txs_list.tx_items.forEach((tx_item) => {
                if (tx_item.data) {
                    const { tx } = tx_item.data;
                    if (tx.hash === value) {
                        filter_tx_hashes.push(tx.hash);
                        return;
                    }

                    if (tx.source === value) {
                        filter_tx_hashes.push(tx.hash);
                        return;
                    }
                }
            });

            mempool_txs_list.filter_tx_hashes = filter_tx_hashes;
        } else {
            mempool_txs_list.filter_tx_hashes = undefined;
        }

        mempool_txs_list.update_filter();
    }
}

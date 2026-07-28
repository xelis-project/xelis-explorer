import { localization } from "../../../../localization/localization";
import { Container } from "../../../../components/container/container";
import { TextInput } from "../../../../components/text_input/text_input";
import { PeersPage } from "../../peers";
import { App } from "../../../../app/app";

import './search.css';

export class PeersSearch {
    container: Container;
    text_input: TextInput;

    constructor() {
        this.container = new Container();
        this.container.element.classList.add(`xe-peers-search`);

        const form = document.createElement(`form`);
        this.container.element.appendChild(form);

        this.text_input = new TextInput();
        this.text_input.element.name = `peers_search_input`;
        this.text_input.element.placeholder = localization.get_text(`Search ip, version, country, city or tag`);
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
        const value = this.text_input.element.value.toLowerCase();
        const { peers_list } = App.instance().current_page as PeersPage;

        if (value.length > 0) {
            const filter_peer_ids = [] as string[];

            peers_list.peer_items.forEach((peer_item) => {
                const data = peer_item.data;

                if (data) {
                    const addr = data.peer.addr;
                    if (addr.toLowerCase().indexOf(value) !== -1) {
                        filter_peer_ids.push(data.peer.id);
                        return;
                    }

                    const version = data.peer.version;
                    if (version.toLowerCase().indexOf(value) !== -1) {
                        filter_peer_ids.push(data.peer.id);
                        return;
                    }

                    const tag = data.peer.tag;
                    if (tag && tag.toLowerCase().indexOf(value) !== -1) {
                        filter_peer_ids.push(data.peer.id);
                        return;
                    }

                    if (data.geo_location.success) {
                        const country = data.geo_location.country;
                        if (country.toLowerCase().indexOf(value) !== -1) {
                            filter_peer_ids.push(data.peer.id);
                            return;
                        }

                        const city = data.geo_location.city;
                        if (city.toLowerCase().indexOf(value) !== -1) {
                            filter_peer_ids.push(data.peer.id);
                            return;
                        }
                    }
                }
            });

            peers_list.filter_peer_ids = filter_peer_ids;
        } else {
            peers_list.filter_peer_ids = undefined;
        }

        peers_list.update_filter();
    }
}

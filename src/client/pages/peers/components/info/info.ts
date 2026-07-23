import { Peer } from "@xelis/sdk/daemon/types";
import { Container } from "../../../../components/container/container";
import { Box } from "../../../../components/box/box";
import { localization } from "../../../../localization/localization";

import './info.css';

export class PeersInfo {
    container: Container

    total_element: HTMLDivElement;
    sync_element: HTMLDivElement;
    desync_element: HTMLDivElement;
    full_ledger_element: HTMLDivElement;
    pruned_ledger_element: HTMLDivElement;

    constructor() {
        this.container = new Container();
        this.container.element.classList.add(`xe-peers-info`);

        this.total_element = document.createElement(`div`);
        this.container.element.appendChild(this.total_element);
        this.sync_element = document.createElement(`div`);
        this.container.element.appendChild(this.sync_element);
        this.desync_element = document.createElement(`div`);
        this.container.element.appendChild(this.desync_element);
        this.full_ledger_element = document.createElement(`div`);
        this.container.element.appendChild(this.full_ledger_element);
        this.pruned_ledger_element = document.createElement(`div`);
        this.container.element.appendChild(this.pruned_ledger_element);
    }

    set_loading(loading: boolean) {
        Box.content_loading(this.total_element, loading, `1rem`);
        Box.content_loading(this.sync_element, loading, `1rem`);
        Box.content_loading(this.desync_element, loading, `1rem`);
        Box.content_loading(this.full_ledger_element, loading, `1rem`);
        Box.content_loading(this.pruned_ledger_element, loading, `1rem`);
    }

    set(peers: Peer[], height: number, total_count: number) {
        let sync_count = 0;
        let desync_count = 0;
        let full_ledger_count = 0;
        let pruned_ledger_count = 0;

        peers.forEach((peer) => {
            if (peer.height === height) {
                sync_count++;
            } else {
                desync_count++;
            }

            if (peer.pruned_topoheight) {
                pruned_ledger_count++;
            } else {
                full_ledger_count++;
            }
        });

        this.set_sync(sync_count);
        this.set_total(total_count);
        this.set_desync(desync_count);
        this.set_full_ledger(full_ledger_count);
        this.set_pruned_ledger(pruned_ledger_count);
    }

    set_sync(value: number) {
        this.sync_element.innerHTML = `
            <div>${localization.get_text(`SYNC`)}</div>
            <div>${value}</div>
        `;
    }

    set_total(value: number) {
        this.total_element.innerHTML = `
            <div>${localization.get_text(`TOTAL`)}</div>
            <div>${value}</div>
        `;
    }

    set_desync(value: number) {
        this.desync_element.innerHTML = `
            <div>${localization.get_text(`DESYNC`)}</div>
            <div>${value}</div>
        `;
    }

    set_full_ledger(value: number) {
        this.full_ledger_element.innerHTML = `
            <div>${localization.get_text(`FULL LEDGER`)}</div>
            <div>${value}</div>
        `;
    }

    set_pruned_ledger(value: number) {
        this.pruned_ledger_element.innerHTML = `
            <div>${localization.get_text(`PRUNED LEDGER`)}</div>
            <div>${value}</div>
        `;
    }
}
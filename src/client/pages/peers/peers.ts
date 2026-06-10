import { XelisNode } from "../../app/xelis_node";
import { Master } from "../../components/master/master";
import { PeersMap } from "./components/map/map";
import { Page } from "../page";
import { PeersInfo } from "./components/info/info";
import { PeersSearch } from "./components/search/search";
import { PeersList } from "./components/list/list";
import { PeersChart } from "./components/chart/chart";
import { Box } from "../../components/box/box";
import { ServerApp } from "../../../server";
import { Context } from "hono";
import { localization } from "../../localization/localization";

import './peers.css';

export class PeersPage extends Page {
    static pathname = "/peers";

    static async handle_server(c: Context<ServerApp>) {
        this.title = localization.get_text(`Peers`);
        this.description = localization.get_text(`Map with list of network peers. Monitor connected peers, network status and geo location.`);
    }

    master: Master;

    peers_map: PeersMap;
    peers_chart: PeersChart;

    peers_info: PeersInfo;
    peers_search: PeersSearch;
    peers_list: PeersList;
    peer_count: number;

    constructor() {
        super();
        this.peer_count = 0;
        this.master = new Master();
        this.master.content.classList.add(`xe-peers`);
        this.element.appendChild(this.master.element);

        const container_1 = document.createElement(`div`);
        container_1.classList.add(`xe-peers-container-1`);
        this.master.content.appendChild(container_1);

        const sub_container_1 = document.createElement(`div`);
        container_1.appendChild(sub_container_1);

        this.peers_map = new PeersMap();
        sub_container_1.appendChild(this.peers_map.container.element);

        this.peers_chart = new PeersChart();
        sub_container_1.appendChild(this.peers_chart.container.element);

        const sub_container_2 = document.createElement(`div`);
        container_1.appendChild(sub_container_2);

        this.peers_info = new PeersInfo();
        sub_container_2.appendChild(this.peers_info.container.element);

        this.peers_search = new PeersSearch();
        sub_container_2.appendChild(this.peers_search.container.element);

        this.peers_list = new PeersList();
        sub_container_2.appendChild(this.peers_list.container.element);
    }

    // we use interval updated instead of websocket peer state change events otherwise it's too much
    update_interval_5000_id?: number;
    update_interval_5000 = async () => {
        const node = XelisNode.instance();
        const info = await node.ws.methods.getInfo();
        const peers_result = await node.ws.methods.getPeers();
        const { peers } = peers_result;

        peers.forEach(peer => {
            for (let i = 0; i < this.peers_list.peer_items.length; i++) {
                const peer_item = this.peers_list.peer_items[i];
                if (peer_item.data && peer_item.data.peer.id === peer.id) {
                    peer_item.data.peer = peer;
                    this.peers_list.peer_items[i] = peer_item;
                    break;
                }
            }
        });

        const new_peers = peers.filter(peer => {
            const peer_item = this.peers_list.peer_items.find(p => {
                return p.data && p.data.peer.id === peer.id;
            });
            if (!peer_item) return true;
            return false;
        });

        let peers_locations = this.peers_list.peer_items.map(item => item.data!);
        // remove old locations
        peers_locations = peers_locations.filter(item => {
            const peer = peers.find(p => p.id === item.peer.id);
            if (peer) return true;
            return false;
        });

        // only fetch new peers
        if (new_peers.length > 0) {
            const new_peers_locations = await this.peers_map.map.fetch_peers_locations(new_peers);
            peers_locations = [...peers_locations, ...new_peers_locations];
        }

        this.peers_info.set(peers, info.height);
        this.peers_list.set(peers_locations);
        this.peers_map.map.set(peers_locations);

        this.peers_chart.nodes_by_version.set(peers);
        this.peers_chart.nodes_by_height.set(peers);
        this.peers_chart.nodes_by_country.set(peers_locations);
    }

    async load(parent: HTMLElement) {
        super.load(parent);
        this.set_window_title(localization.get_text(`Peers`));

        this.peers_chart.nodes_by_height.load();
        this.peers_chart.nodes_by_country.load();
        this.peers_chart.nodes_by_version.load();

        const node = XelisNode.instance();

        this.peers_map.map.overlay_loading.set_loading(true);
        Box.boxes_loading(this.peers_chart.container.element, true);
        Box.list_loading(this.peers_list.element_content, 20, `8rem`);
        this.peers_info.set_loading(true);

        const info = await node.rpc.getInfo();
        const peers_result = await node.rpc.getPeers();
        const { peers } = peers_result;

        this.peer_count = peers.length;
        const peers_locations = await this.peers_map.map.fetch_peers_locations(peers);
        await this.peers_map.map.set(peers_locations);
        this.peers_map.map.overlay_loading.set_loading(false);
        Box.boxes_loading(this.peers_chart.container.element, false);
        this.peers_info.set_loading(false);

        this.peers_info.set(peers, info.height);
        this.peers_list.set(peers_locations);

        this.peers_chart.nodes_by_version.set(peers);
        this.peers_chart.nodes_by_height.set(peers);
        this.peers_chart.nodes_by_country.set(peers_locations);

        this.update_interval_5000_id = window.setInterval(this.update_interval_5000, 5000);
    }

    unload() {
        super.unload();
        this.peers_chart.nodes_by_height.unload();
        this.peers_chart.nodes_by_country.unload();
        this.peers_chart.nodes_by_version.unload();
        window.clearInterval(this.update_interval_5000_id);
        this.master.unload();
    }
}
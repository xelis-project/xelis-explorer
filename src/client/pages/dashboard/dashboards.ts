import { Page } from "../page";
import { DashboardBlocks } from "./components/blocks/blocks";
import { Master } from "../../components/master/master";
import { DashboardSearch } from "./components/search/search";
import { DashboardTopStats } from "./components/top_stats/top_stats";
import { DashboardChartSection2 } from "./components/chart_section_2/chart_section_2";
import { DashboardTxs } from "./components/txs/txs";
import { BlockOrdered, BlockOrphaned, BlockType, RPCEvent as DaemonRPCEvent, DiskSize, GetInfoResult, P2PStatusResult, Peer, RPCMethod } from '@xelis/sdk/daemon/types';
import { Block, MempoolTransactionSummary } from "@xelis/sdk/daemon/types";
import { TxBlock } from "../../components/tx_item/tx_item";
import { XelisNode } from "../../app/xelis_node";
import { DashboardPeers } from "./components/peers/peers";
import { DashboardDAG } from "./components/dag/dag";
import { fetch_blocks } from "../../fetch_helpers/fetch_blocks";
import { fetch_blocks_txs } from "../../fetch_helpers/fetch_blocks_txs";
import { parse_addr } from "../../utils/parse_addr";
import { fetch_geo_location } from "../../utils/fetch_geo_location";
import { PeerLocation } from "../../components/peers_map/peers_map";
import { Box } from "../../components/box/box";
import { DashboardChartSection1 } from "./components/chart_section_1/chart_section_1";
import { localization } from "../../localization/localization";
import { ServerApp } from "../../../server";
import { Context } from "hono";
import { fetch_top_stats } from "../../fetch_helpers/fetch_top_stats";

import './dashboard.css';

export class DashboardPage extends Page {
    static pathname = "/";

    static async handle_server(c: Context<ServerApp>) {
        this.title = localization.get_text(`Dashboard`);
        this.description = localization.get_text(`Dive into the XELIS Explorer. Navigate the blockchain, verify transactions, and access specific metadata.`);
    }

    dashboard_top_stats: DashboardTopStats;
    dashboard_blocks: DashboardBlocks;
    dashboard_txs: DashboardTxs;
    dashboard_search: DashboardSearch;
    dashboard_chart_section_1: DashboardChartSection1;
    dashboard_chart_section_2: DashboardChartSection2;
    dashboard_peers: DashboardPeers;
    dashboard_dag: DashboardDAG;

    page_data: {
        info?: GetInfoResult;
        size?: DiskSize;
        p2p_status?: P2PStatusResult;
        blocks: Block[];
        txs_blocks: TxBlock[];
    }

    master: Master;

    constructor() {
        super();

        this.page_data = {
            blocks: [],
            txs_blocks: []
        };

        this.master = new Master();
        this.element.appendChild(this.master.element);

        this.master.content.classList.add(`xe-dashboard`);

        this.dashboard_search = new DashboardSearch();
        this.master.content.appendChild(this.dashboard_search.container.element);

        this.dashboard_top_stats = new DashboardTopStats();
        this.master.content.appendChild(this.dashboard_top_stats.element);

        const container_1 = document.createElement(`div`);
        container_1.classList.add(`xe-dashboard-container-1`);
        this.master.content.appendChild(container_1);

        const sub_container_1 = document.createElement(`div`);
        container_1.appendChild(sub_container_1);

        this.dashboard_chart_section_1 = new DashboardChartSection1();
        sub_container_1.appendChild(this.dashboard_chart_section_1.container.element);

        this.dashboard_chart_section_2 = new DashboardChartSection2();
        sub_container_1.appendChild(this.dashboard_chart_section_2.container.element);

        this.dashboard_peers = new DashboardPeers();
        sub_container_1.appendChild(this.dashboard_peers.container.element);

        this.dashboard_dag = new DashboardDAG();
        sub_container_1.appendChild(this.dashboard_dag.container.element);

        const sub_container_2 = document.createElement(`div`);
        container_1.appendChild(sub_container_2);

        this.dashboard_blocks = new DashboardBlocks();
        sub_container_2.appendChild(this.dashboard_blocks.container.element);

        this.dashboard_txs = new DashboardTxs();
        sub_container_2.appendChild(this.dashboard_txs.container.element);
    }

    update_interval_1000_id?: number;
    update_interval_1000 = () => {
        this.dashboard_blocks.block_items.forEach((block_item) => {
            if (block_item.data) {
                block_item.set_age(block_item.data.timestamp);
            }
        });

        this.dashboard_txs.tx_items.forEach((tx_item) => {
            if (tx_item.data) {
                tx_item.set_age(tx_item.data.block.timestamp);
            }
        });

        this.dashboard_top_stats.set_last_update();
    }

    on_new_block = async (new_block?: Block, err?: Error) => {
        console.log("new_block", new_block);

        if (new_block) {
            const node = XelisNode.instance();
            const block_item = this.dashboard_blocks.block_items.find(b => b.data && b.data.hash === new_block.hash);
            if (!block_item) {
                this.dashboard_blocks.block_items.forEach((block_item) => {
                    block_item.animate_down();
                });
                const new_block_item = this.dashboard_blocks.prepend_block(new_block);
                new_block_item.box.element.style.setProperty(`opacity`, `0`);
                setTimeout(() => {
                    new_block_item.box.element.style.setProperty(`opacity`, `1`);
                    new_block_item.animate_prepend();
                }, 350);
                const last_block = this.dashboard_blocks.remove_last_block();
                if (last_block && last_block.data) {
                    this.dashboard_txs.remove_block_txs(last_block.data.hash);
                }

                // don't add txs from side block to avoid duplicate 
                if (new_block.block_type === BlockType.Normal) {
                    // using txs_hashes instead of transactions, transactions array is empty for now
                    new_block.txs_hashes.forEach(async (tx_hash) => {
                        const tx = await node.ws.methods.getTransaction(tx_hash);
                        this.dashboard_txs.prepend_tx({ block: new_block, tx });
                    });
                }

                this.page_data.blocks = this.dashboard_blocks.block_items.map(x => x.data!);
                await this.load_top_stats();
                const { info, blocks } = this.page_data;
                this.dashboard_chart_section_1.blocks_txs.set(blocks);
                this.dashboard_chart_section_2.pools.set(blocks);
                if (info) {
                    this.dashboard_chart_section_2.hashrate.set(info, blocks);
                    this.dashboard_chart_section_2.block_time.set(info, blocks);
                }
            } else {
                block_item.set(new_block);
                block_item.animate_update();
            }

            const stable_height = await node.ws.methods.getStableHeight();

            // normal blocks become sync under stableheight
            // the node does not emit an event for this case
            const side_block_heights = this.dashboard_blocks.block_items.filter(b => {
                if (b.data && b.data.block_type === BlockType.Side) {
                    return b;
                }
            }).map(b => b.data!.height);

            this.dashboard_blocks.block_items.forEach((block_item) => {
                const block = block_item.data;
                if (block &&
                    block.height <= stable_height
                    && block.block_type === BlockType.Normal
                    && side_block_heights.indexOf(block.height) === -1
                ) {
                    block.block_type = BlockType.Sync;
                    block_item.set_type(BlockType.Sync);
                    block_item.animate_update();
                }
            });
        }
    }

    on_transaction_added_in_mempool = (new_tx?: MempoolTransactionSummary, err?: Error) => {
        const info = this.page_data.info;
        if (info && new_tx) {
            info.mempool_size += 1;
            this.dashboard_top_stats.set_mempool(info.mempool_size);
        }
    }

    on_block_ordered = async (block_ordered?: BlockOrdered | undefined, err?: Error) => {
        console.log("block_ordered", block_ordered);
        if (block_ordered) {
            const block_item = this.dashboard_blocks.block_items.find(b => b.data && b.data.hash === block_ordered.block_hash);
            if (block_item && block_item.data) {
                // refetch block instead of using data from block_ordered
                // block can pass from orphaned to normal, sync
                // other attributes can also change
                const node = XelisNode.instance();
                const block = await node.ws.methods.getBlockByHash({ hash: block_ordered.block_hash });
                block_item.set(block);
                block_item.animate_update();
            }
        }
    }

    on_block_orphaned = (block_orphaned?: BlockOrphaned | undefined, err?: Error) => {
        console.log("block_orphaned", block_orphaned);
        if (block_orphaned) {
            const block_item = this.dashboard_blocks.block_items.find(b => b.data && b.data.hash === block_orphaned.block_hash);
            if (block_item && block_item.data) {
                const new_block_type = BlockType.Orphaned;
                block_item.data.block_type = new_block_type;
                block_item.set_type(new_block_type);
                block_item.animate_update();
            }
        }
    }

    on_peer_connected = async (new_peer?: Peer, err?: Error) => {
        console.log("peer_connected");
        const p2p_status = this.page_data.p2p_status;
        if (p2p_status) {
            p2p_status.peer_count += 1;
            this.dashboard_top_stats.set_peer_count(p2p_status.peer_count);
        }

        if (new_peer) {
            const addr = parse_addr(new_peer.addr);
            const res = await fetch_geo_location([addr.ip]);
            const geo_location = res[addr.ip];

            const peer_location = { peer: new_peer, geo_location } as PeerLocation;
            this.dashboard_peers.peers_map.add_peer_marker(peer_location);
        }
    }

    on_peer_disconnected = (peer?: Peer, err?: Error) => {
        console.log("peer_disconnected");
        const p2p_status = this.page_data.p2p_status;
        if (p2p_status) {
            p2p_status.peer_count -= 1;
            this.dashboard_top_stats.set_peer_count(p2p_status.peer_count);
        }

        if (peer) {
            this.dashboard_peers.peers_map.remove_peer_marker(peer.id);
        }
    }

    clear_node_events() {
        const node = XelisNode.instance();
        node.ws.methods.removeListener(DaemonRPCEvent.BlockOrdered, null, this.on_block_ordered);
        node.ws.methods.removeListener(DaemonRPCEvent.BlockOrphaned, null, this.on_block_orphaned);
        node.ws.methods.removeListener(DaemonRPCEvent.NewBlock, null, this.on_new_block);
        node.ws.methods.removeListener(DaemonRPCEvent.TransactionAddedInMempool, null, this.on_transaction_added_in_mempool);
        node.ws.methods.removeListener(DaemonRPCEvent.PeerConnected, null, this.on_peer_connected);
        node.ws.methods.removeListener(DaemonRPCEvent.PeerDisconnected, null, this.on_peer_disconnected);
    }

    async listen_node_events() {
        const node = XelisNode.instance();
        node.ws.methods.addListener(DaemonRPCEvent.BlockOrdered, null, this.on_block_ordered);
        node.ws.methods.addListener(DaemonRPCEvent.BlockOrphaned, null, this.on_block_orphaned);
        node.ws.methods.addListener(DaemonRPCEvent.NewBlock, null, this.on_new_block);
        node.ws.methods.addListener(DaemonRPCEvent.TransactionAddedInMempool, null, this.on_transaction_added_in_mempool);
        node.ws.methods.addListener(DaemonRPCEvent.PeerConnected, null, this.on_peer_connected);
        node.ws.methods.addListener(DaemonRPCEvent.PeerDisconnected, null, this.on_peer_disconnected);
    }

    async load_top_stats() {
        const node = XelisNode.instance();
        const top_stats = await fetch_top_stats(node);

        this.dashboard_top_stats.load(top_stats);
        this.page_data.info = top_stats.info;
        this.page_data.size = top_stats.size;
        this.page_data.p2p_status = top_stats.p2p_status;

        this.dashboard_chart_section_2.hashrate.set_hashrate(top_stats.info);
    }

    async load_blocks() {
        const info = this.page_data.info;
        if (!info) return;

        const blocks = await fetch_blocks(info.height, 100);

        this.page_data.blocks = blocks;
        this.dashboard_chart_section_1.blocks_txs.set(blocks);
        this.dashboard_chart_section_2.hashrate.set(info, blocks);
        this.dashboard_chart_section_2.block_time.set(info, blocks);
        this.dashboard_chart_section_2.pools.set(blocks);
        this.dashboard_blocks.set(blocks);
    }

    async load_blocks_txs() {
        let blocks = this.page_data.blocks;
        if (!blocks) return;

        // filter side block out (they might contain a duplicated tx)
        blocks = blocks.filter(b => b.block_type !== BlockType.Side);
        await fetch_blocks_txs(blocks);

        const txs_blocks: TxBlock[] = [];
        blocks.forEach((block) => {
            if (block.transactions) {
                block.transactions.forEach((tx) => {
                    txs_blocks.push({ block, tx });
                });
            }
        });

        this.page_data.txs_blocks = txs_blocks;
        this.dashboard_txs.set(txs_blocks);
    }

    async load_peers() {
        const node = XelisNode.instance();
        this.dashboard_peers.peers_map.overlay_loading.set_loading(true);
        const peers_result = await node.rpc.getPeers();
        const peers_locations = await this.dashboard_peers.peers_map.fetch_peers_locations(peers_result.peers);
        await this.dashboard_peers.peers_map.set(peers_locations);
        this.dashboard_peers.peers_map.overlay_loading.set_loading(false);
    }

    async load(parent: HTMLElement) {
        super.load(parent);

        this.set_window_title(localization.get_text(`Dashboard`));


        // the chart load ordering is important
        // loading pool chart first define the width for the others
        this.dashboard_chart_section_2.pools.load();
        this.dashboard_chart_section_2.hashrate.load();
        this.dashboard_chart_section_1.blocks_txs.load();
        this.dashboard_chart_section_2.block_time.load();

        this.listen_node_events();

        Box.boxes_loading(this.dashboard_top_stats.container.element, true);
        Box.list_loading(this.dashboard_blocks.element_content, 20, `5rem`);
        Box.list_loading(this.dashboard_txs.element_content, 20, `5rem`);
        Box.boxes_loading(this.dashboard_chart_section_1.container.element, true);
        Box.boxes_loading(this.dashboard_chart_section_2.container.element, true);

        this.dashboard_dag.load();
        this.load_peers();

        await this.load_top_stats();

        Box.boxes_loading(this.dashboard_top_stats.container.element, false);

        await this.load_blocks();
        this.load_blocks_txs();

        Box.boxes_loading(this.dashboard_chart_section_1.container.element, false);
        Box.boxes_loading(this.dashboard_chart_section_2.container.element, false);

        this.update_interval_1000_id = window.setInterval(this.update_interval_1000, 1000);
    }

    unload() {
        super.unload();
        this.clear_node_events();
        window.clearInterval(this.update_interval_1000_id);
        this.dashboard_chart_section_1.blocks_txs.unload();
        this.dashboard_chart_section_2.block_time.unload();
        this.dashboard_chart_section_2.hashrate.unload();
        this.dashboard_chart_section_2.pools.unload();

        this.dashboard_dag.unload();
    }
}
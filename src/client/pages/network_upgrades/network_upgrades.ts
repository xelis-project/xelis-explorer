import { Page } from "../page";
import { Master } from "../../components/master/master";
import { localization } from "../../localization/localization";
import { ServerApp } from "../../../server";
import { Context } from "hono";
import { XelisNode } from "../../app/xelis_node";
import { Container } from "../../components/container/container";
import { Table } from "../../components/table/table";
import { UpgradeRow } from "./upgrade_row/upgrade_row";
import { NextUpgrade } from "./next_upgrade/next_upgrade";
import { Block, RPCEvent as DaemonRPCEvent, HardFork } from '@xelis/sdk/daemon/types';

import './network_upgrades.css';

export class NetworkUpgradesPage extends Page {
	static pathname = "/network-upgrades"

	static async handle_server(c: Context<ServerApp>) {
		this.title = localization.get_text(`Network Upgrades`);
		this.description = localization.get_text(`List of network upgrades with version histories, changelogs and countdown about upcoming release.`);
	}

	master: Master;
	table: Table;
	next_upgrade: NextUpgrade;
	last_hard_fork?: HardFork;

	constructor() {
		super();

		this.master = new Master();
		this.master.content.classList.add(`xe-network-upgrades`);
		this.element.appendChild(this.master.element);

		this.next_upgrade = new NextUpgrade();
		this.master.content.appendChild(this.next_upgrade.element);

		const table_container = new Container();
		table_container.element.classList.add(`xe-network-upgrades-table`, `scrollbar-1`, `scrollbar-1-bottom`);
		this.master.content.appendChild(table_container.element);

		this.table = new Table();
		table_container.element.appendChild(this.table.element);

		const titles = [
			localization.get_text(`UPGRADE CHANGELOG`),
			localization.get_text(`ONLINE HEIGHT`),
			localization.get_text(`UPGRADE VERSION`),
			localization.get_text(`NODE REQUIREMENT`),
			localization.get_text(`ONLINE DATE`),
		];
		this.table.set_head_row(titles);
	}

	update_interval_1000_id?: number;
	update_interval_1000 = () => {
		this.next_upgrade.countdown.render();
	}

	on_new_block = async (new_block?: Block, err?: Error) => {
		console.log("new_block", new_block);

		if (new_block && this.last_hard_fork) {
			this.next_upgrade.set(this.last_hard_fork, new_block);
		}
	}

	clear_node_events() {
		const node = XelisNode.instance();
		node.ws.methods.removeListener(DaemonRPCEvent.NewBlock, null, this.on_new_block);
	}

	async listen_node_events() {
		const node = XelisNode.instance();
		node.ws.methods.addListener(DaemonRPCEvent.NewBlock, null, this.on_new_block);
	}

	async load(parent: HTMLElement) {
		super.load(parent);
		this.set_window_title(localization.get_text(`Network Upgrades`));

		this.table.clear();
		this.table.set_loading(5);

		const node = XelisNode.instance();
		const hard_forks = await node.rpc.getHardForks();
		const top_block = await node.rpc.getTopBlock();

		this.table.clear();

		this.last_hard_fork = hard_forks[hard_forks.length - 1];
		if (top_block.height < this.last_hard_fork.height) {
			this.next_upgrade.set(this.last_hard_fork, top_block);
			this.update_interval_1000_id = window.setInterval(this.update_interval_1000, 1000);
			this.listen_node_events();
		}

		hard_forks.forEach(hard_fork => {
			const upgrade_row = new UpgradeRow();
			upgrade_row.set(hard_fork, top_block);
			this.table.prepend_row(upgrade_row);
		});

	}

	unload() {
		super.unload();
		window.clearInterval(this.update_interval_1000_id);
		this.clear_node_events();
		this.master.unload();
	}
}
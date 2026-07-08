import { Block, HardFork } from "@xelis/sdk/daemon/types";
import { Container } from "../../../components/container/container";
import { Countdown } from "../../../components/countdown/countdown";
import { localization } from "../../../localization/localization";
import { get_block_time_by_version } from "../../../utils/get_block_time";

import './next_upgrade.css';

export class NextUpgrade {
	element: HTMLDivElement;

	container: Container;
	countdown: Countdown;

	changelog_element: HTMLDivElement;
	details_element: HTMLDivElement;

	constructor() {
		this.element = document.createElement(`div`);
		this.element.classList.add(`xe-next-upgrade`);

		this.container = new Container();

		const text_element = document.createElement(`div`);
		text_element.innerHTML = localization.get_text(`An upgrade is planned for the near future.`);
		this.container.element.appendChild(text_element);

		this.changelog_element = document.createElement(`div`);
		this.container.element.appendChild(this.changelog_element);

		this.details_element = document.createElement(`div`);
		this.container.element.appendChild(this.details_element);

		this.countdown = new Countdown();
		this.container.element.appendChild(this.countdown.element);
	}

	set(hard_fork: HardFork, top_block: Block) {
		let block_time = get_block_time_by_version(hard_fork.version);
		const target_timestamp = Date.now() + ((hard_fork.height - top_block.height) * block_time);
		this.element.replaceChildren();
		this.element.appendChild(this.container.element);
		this.countdown.set(target_timestamp);

		const date = new Date(target_timestamp);
		const current_height = top_block.height;
		const block_left = hard_fork.height - current_height;

		this.changelog_element.innerHTML = hard_fork.changelog;

		this.details_element.innerHTML = `
			<div><span>HEIGHT:</span> ${current_height.toLocaleString()} / ${hard_fork.height.toLocaleString()} (${block_left.toLocaleString()})</div>
			<div><span>LOCAL:</span> ${date.toLocaleString()}</div>
			<div><span>UTC:</span> ${date.toUTCString()}</div>
			<div><span>UNIX:</span> ${target_timestamp}</div>
		`;
	}
}
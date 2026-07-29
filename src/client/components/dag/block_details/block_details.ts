import { Block } from '@xelis/sdk/daemon/types';
import { format_xel } from '../../../utils/format_xel';
import prettyBytes from 'pretty-bytes';
import { format_hashrate } from '../../../utils/format_hashrate';
import { format_diff } from '../../../utils/format_diff';
import { hashicon } from '@emeraldpay/hashicon';
import { format_address } from '../../../utils/format_address';
import { localization } from '../../../localization/localization';

import './block_details.css';

export class DAGBlockDetails {
    element: HTMLDivElement;
    visible: boolean;

    block_link: HTMLAnchorElement;
    element_hash: HTMLDivElement;
    element_block_type: HTMLDivElement;
    element_timestamp: HTMLDivElement;
    element_version: HTMLDivElement;
    element_topoheight: HTMLDivElement;
    element_height: HTMLDivElement;
    element_miner: HTMLDivElement;
    element_total_fees: HTMLDivElement;
    element_total_fees_burned: HTMLDivElement;
    element_reward: HTMLDivElement;
    element_supply: HTMLDivElement;
    element_tx_count: HTMLDivElement;
    element_diff: HTMLDivElement;
    element_hashrate: HTMLDivElement;
    element_size: HTMLDivElement;
    element_nonce: HTMLDivElement;
    element_tips: HTMLDivElement;
    element_extra_nonce: HTMLDivElement;

    constructor() {
        this.visible = false;

        this.element = document.createElement(`div`);
        this.element.classList.add(`xe-dag-block-details`, `scrollbar-1`, `scrollbar-1-right`);

        this.block_link = document.createElement(`a`);
        this.element.appendChild(this.block_link);

        this.element_hash = document.createElement(`div`);
        this.element.appendChild(this.element_hash);

        this.element_block_type = document.createElement(`div`);
        this.element.appendChild(this.element_block_type);

        this.element_version = document.createElement(`div`);
        this.element.appendChild(this.element_version);

        this.element_timestamp = document.createElement(`div`);
        this.element.appendChild(this.element_timestamp);

        this.element_topoheight = document.createElement(`div`);
        this.element.appendChild(this.element_topoheight);

        this.element_height = document.createElement(`div`);
        this.element.appendChild(this.element_height);

        this.element_miner = document.createElement(`div`);
        this.element.appendChild(this.element_miner);

        this.element_total_fees = document.createElement(`div`);
        this.element.appendChild(this.element_total_fees);

        this.element_total_fees_burned = document.createElement(`div`);
        this.element.appendChild(this.element_total_fees_burned);

        this.element_reward = document.createElement(`div`);
        this.element.appendChild(this.element_reward);

        this.element_supply = document.createElement(`div`);
        this.element.appendChild(this.element_supply);

        this.element_tx_count = document.createElement(`div`);
        this.element.appendChild(this.element_tx_count);

        this.element_diff = document.createElement(`div`);
        this.element.appendChild(this.element_diff);

        this.element_hashrate = document.createElement(`div`);
        this.element.appendChild(this.element_hashrate);

        this.element_size = document.createElement(`div`);
        this.element.appendChild(this.element_size);

        this.element_nonce = document.createElement(`div`);
        this.element.appendChild(this.element_nonce);

        this.element_extra_nonce = document.createElement(`div`);
        this.element.appendChild(this.element_extra_nonce);

        this.element_tips = document.createElement(`div`);
        this.element_tips.classList.add(`xe-dag-block-details-tips`);
        this.element.appendChild(this.element_tips);

        this.element.addEventListener(`click`, (e) => {
            e.stopImmediatePropagation();
        });
    }

    async show() {
        //if (this.visible) return;
        this.visible = true;
        this.element.style.visibility = `visible`;
        const { animate } = await import(`animejs`);
        animate(this.element, {
            translateY: [`-5%`, `0`],
            opacity: [0, 1],
            duration: 500
        });
    }

    async hide() {
        if (!this.visible) return;
        this.visible = false;

        const { animate } = await import(`animejs`);
        animate(this.element, {
            translateY: [`0`, `-5%`],
            opacity: [1, 0],
            duration: 250,
            onComplete: () => {
                this.element.style.visibility = `hidden`;
            }
        });
    }

    set_position(x: number, y: number) {
        this.element.style.top = `${y}px`;
        this.element.style.left = `${x}px`;
    }

    set(block: Block) {
        this.block_link.href = `/block/${block.hash}`;
        this.block_link.innerHTML = localization.get_text(`BLOCK ${block.topoheight !== undefined ? block.topoheight.toLocaleString() : `????`}`);
        this.set_hash(block.hash);
        this.set_block_type(block.block_type);
        this.set_miner(block.miner);
        this.set_topoheight(block.topoheight);
        this.set_height(block.height);
        this.set_total_fees(block.total_fees);
        this.set_total_fees_burned(block.total_fees_burned);
        this.set_reward(block.reward);
        this.set_tx_count(block.txs_hashes.length);
        this.set_supply(block.supply);
        this.set_size(block.total_size_in_bytes);
        this.set_nonce(block.nonce);
        this.set_diff(parseInt(block.difficulty));
        this.set_hashrate(block);
        this.set_tips(block.tips);
        this.set_timestamp(block.timestamp);
        this.set_version(block.version);
        this.set_extra_nonce(block.extra_nonce);
    }

    set_item(element: HTMLDivElement, title: string, value: HTMLElement | string) {
        const title_element = document.createElement(`div`);
        title_element.innerHTML = title;
        const value_element = document.createElement(`div`);
        if (typeof value === `string`) {
            value_element.innerHTML = value;
        } else {
            value_element.appendChild(value);
        }

        element.replaceChildren();
        element.appendChild(title_element);
        element.appendChild(value_element);
    }

    set_version(version: number) {
        this.set_item(this.element_version, localization.get_text(`VERSION`), version.toLocaleString());
    }

    set_hash(hash: string) {
        this.set_item(this.element_hash, localization.get_text(`HASH`), hash);
    }

    set_block_type(block_type: string) {
        this.set_item(this.element_block_type, localization.get_text(`TYPE`), block_type);
    }

    set_timestamp(timestamp: number) {
        this.set_item(this.element_timestamp, localization.get_text(`TIMESTAMP`), `
            <div>${localization.get_text(`LOCAL`)}: ${new Date(timestamp).toLocaleString()}</div>
            <div>UNIX: ${timestamp}</div>
            <div>UTC: ${new Date(timestamp).toUTCString()}</div>
        `);
    }

    set_topoheight(topoheight?: number) {
        this.set_item(this.element_topoheight, localization.get_text(`TOPOHEIGHT`), topoheight ? topoheight.toLocaleString() : `--`);
    }

    set_height(height: number) {
        this.set_item(this.element_height, localization.get_text(`HEIGHT`), height.toLocaleString());
    }

    set_miner(miner: string) {
        const container = document.createElement(`div`);
        container.classList.add(`xe-table-miner`);

        const miner_icon = hashicon(miner, { size: 25 }) as HTMLCanvasElement;
        container.appendChild(miner_icon);

        const miner_addr = document.createElement(`div`);
        miner_addr.innerHTML = format_address(miner);
        container.appendChild(miner_addr);

        this.set_item(this.element_miner, localization.get_text(`MINER`), container);
    }

    set_total_fees(fees?: number) {
        this.set_item(this.element_total_fees, localization.get_text(`TOTAL FEES`), fees ? format_xel(fees, true) : `--`);
    }

    set_total_fees_burned(fees_burned?: number) {
        this.set_item(this.element_total_fees_burned, localization.get_text(`TOTAL FEES BURNED`), fees_burned ? format_xel(fees_burned, true) : `--`);
    }

    set_reward(reward?: number) {
        this.set_item(this.element_reward, localization.get_text(`REWARD`), reward ? format_xel(reward, true) : `--`);
    }

    set_supply(supply?: number) {
        this.set_item(this.element_supply, localization.get_text(`SUPPLY`), supply ? format_xel(supply, true) : `--`);
    }

    set_tx_count(tx_count: number) {
        this.set_item(this.element_tx_count, localization.get_text(`TXS`), tx_count.toLocaleString());
    }

    set_diff(difficulty: number) {
        this.set_item(this.element_diff, localization.get_text(`DIFF`), format_diff(difficulty));
    }

    set_hashrate(block: Block) {
        this.set_item(this.element_hashrate, localization.get_text(`HASHRATE`), format_hashrate(parseInt(block.difficulty), block.version));
    }

    set_size(size_in_bytes: number) {
        this.set_item(this.element_size, localization.get_text(`SIZE`), prettyBytes(size_in_bytes));
    }

    set_nonce(nonce: number) {
        this.set_item(this.element_nonce, localization.get_text(`NONCE`), `${nonce}`);
    }

    set_extra_nonce(extra_nonce: string) {
        this.set_item(this.element_extra_nonce, localization.get_text(`EXTRA NONCE`), extra_nonce);
    }

    set_tips(tips: string[]) {
        const value = tips.map((tip, i) => {
            return `<div>${i}: ${tip}</div>`;
        }).join(``);
        this.set_item(this.element_tips, localization.get_text(`TIPS`), value);
    }
}

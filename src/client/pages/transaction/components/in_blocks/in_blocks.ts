import { Block } from '@xelis/sdk/daemon/types';
import { Container } from '../../../../components/container/container';
import { BlockItem } from '../../../../components/block_item/block_item';
import { Box } from '../../../../components/box/box';
import { localization } from '../../../../localization/localization';
import { update_scrollbar_padding } from '../../../../utils/update_scrollbar_padding';

import './in_blocks.css';

export class TransactionInBlocks {
    container: Container;

    title_element: HTMLDivElement;
    legend_element: HTMLDivElement;

    block_items: BlockItem[];
    blocks_element: HTMLDivElement;
    remove_scrollbar_padding_listener: () => void;

    constructor() {
        this.block_items = [];
        this.container = new Container();
        this.container.element.classList.add(`xe-transaction-in-blocks`);

        const container_1 = document.createElement(`div`);
        this.container.element.appendChild(container_1);

        this.title_element = document.createElement(`div`);
        container_1.appendChild(this.title_element);
        this.title_element.innerHTML = localization.get_text(`IN BLOCKS`);

        this.legend_element = document.createElement(`div`);
        container_1.appendChild(this.legend_element);

        this.blocks_element = document.createElement(`div`);
        this.blocks_element.classList.add(`scrollbar-1`, `scrollbar-1-right`);
        this.container.element.appendChild(this.blocks_element);

        this.remove_scrollbar_padding_listener = update_scrollbar_padding(this.blocks_element);
    }

    set_loading(loading: boolean) {
        if (loading) {
            Box.list_loading(this.blocks_element, 1, `3rem`);
        } else {
            this.blocks_element.replaceChildren();
        }
    }

    append_block(block: Block, executed_in_block?: string) {
        const block_item = new BlockItem(`/block/${block.hash}`);
        block_item.set(block);
        this.block_items.push(block_item);

        if (block.hash === executed_in_block) {
            block_item.box.element.style.border = `.2rem solid #02ffcf`;
        }

        this.blocks_element.appendChild(block_item.box.element);
    }

    set_legend(executed_in_block?: string) {
        if (executed_in_block) {
            this.legend_element.className = `xe-transaction-in-blocks-legend executed`;
            this.legend_element.innerHTML = `<div></div><div>${localization.get_text(`EXECUTED IN BLOCK`)}</div>`;
        } else {
            this.legend_element.className = `xe-transaction-in-blocks-legend failed`;
            this.legend_element.innerHTML = `<div></div><div>${localization.get_text(`NOT EXECUTED`)}</div>`;
        }
    }

    set(blocks: Block[], executed_in_block?: string) {
        this.block_items = [];
        this.blocks_element.replaceChildren();
        blocks.forEach((block) => {
            this.append_block(block, executed_in_block);
        });
        this.set_legend(executed_in_block);
    }
}
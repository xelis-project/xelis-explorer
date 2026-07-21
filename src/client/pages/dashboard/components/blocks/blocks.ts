import { Block } from "@xelis/sdk/daemon/types";
import { Container } from "../../../../components/container/container";
import { BlockItem } from "../../../../components/block_item/block_item";
import { localization } from "../../../../localization/localization";
import { update_scrollbar_padding } from "../../../../utils/update_scrollbar_padding";

import "./blocks.css";

export class DashboardBlocks {
    container: Container;
    block_items: BlockItem[];

    element_title: HTMLDivElement;
    element_content: HTMLDivElement;
    remove_scrollbar_padding_listener: () => void;

    constructor() {
        this.container = new Container();
        this.container.element.classList.add(`xe-dashboard-blocks`);

        this.block_items = [];
        this.element_title = document.createElement(`div`);
        this.element_title.classList.add(`xe-dashboard-blocks-title`);
        this.element_title.innerHTML = localization.get_text(`BLOCKS`);
        this.container.element.appendChild(this.element_title);

        this.element_content = document.createElement(`div`);
        this.element_content.classList.add(`xe-dashboard-blocks-list`, `scrollbar-1`, `scrollbar-1-right`);
        this.container.element.appendChild(this.element_content);

        this.remove_scrollbar_padding_listener = update_scrollbar_padding(this.element_content);
    }

    set(blocks: Block[]) {
        this.block_items = [];
        this.element_content.replaceChildren();
        blocks.forEach(block => this.prepend_block(block));
    }

    prepend_block(block: Block) {
        const block_item = new BlockItem(`/block/${block.hash}`);
        block_item.set(block);

        this.block_items.unshift(block_item);
        this.element_content.insertBefore(block_item.box.element, this.element_content.firstChild);
        return block_item;
    }

    remove_last_block() {
        const last_block_item = this.block_items.pop();
        if (last_block_item) {
            last_block_item.box.element.remove();
        }
        return last_block_item;
    }
}

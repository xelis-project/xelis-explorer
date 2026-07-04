export class Row {
    element: HTMLTableRowElement;
    cells: HTMLTableCellElement[];
    value_cells: HTMLDivElement[];

    constructor(cell_count: number) {
        this.element = document.createElement(`tr`);

        this.cells = [];
        this.value_cells = [];
        for (let i = 0; i < cell_count; i++) {
            const cell = document.createElement(`td`);
            this.element.appendChild(cell);

            const value_cell = document.createElement(`div`);
            cell.appendChild(value_cell);

            this.value_cells.push(value_cell);
            this.cells.push(cell);
        }
    }

    set_link(href: string) {
        this.cells.forEach((cell, i) => {
            cell.replaceChildren();

            const link = document.createElement(`a`);
            link.href = href;
            link.appendChild(this.value_cells[i]);

            cell.appendChild(link);
        });
    }

    async animate_prepend() {
        const { animate, utils } = await import("animejs");
        animate(this.element, {
            translateX: [`100%`, 0],
            duration: 750,
            onComplete: utils.cleanInlineStyles
        });
    }

    async animate_update() {
        const { animate, eases, utils } = await import("animejs");
        animate(this.element, {
            scale: [`100%`, `98%`, `100%`],
            duration: 1000,
            ease: eases.inBack(3),
            onComplete: utils.cleanInlineStyles
        });
    }

    async animate_down() {
        const { animate, eases, utils } = await import("animejs");
        animate(this.element, {
            translateY: [`-100%`, `0`],
            duration: 500,
            ease: eases.linear,
            onComplete: utils.cleanInlineStyles
        });
    }

    set_empty(text: string) {
        const td = this.value_cells[0];
        if (td) td.innerHTML = `<div>${text}</div>`;
    }

    unload() {
        this.element.remove();
        this.cells = [];
        this.value_cells = [];
        this.element = null as any;
    }
}
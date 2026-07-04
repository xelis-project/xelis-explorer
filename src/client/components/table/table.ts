import './table.css';
import { Row } from '../../components/table/row';

export class Table {
    element: HTMLTableElement;
    head_element: HTMLTableSectionElement;
    body_element: HTMLTableSectionElement;
    rows: Row[] = [];

    constructor() {
        this.element = document.createElement(`table`);
        this.element.classList.add(`xe-table`);

        this.head_element = document.createElement(`thead`);
        this.element.appendChild(this.head_element);

        this.body_element = document.createElement(`tbody`);
        this.element.appendChild(this.body_element);
    }

    set_head_row(titles: string[]) {
        this.head_element.replaceChildren();
        const row = document.createElement(`tr`);
        this.head_element.appendChild(row);
        titles.forEach(title => {
            const col = document.createElement(`th`);
            col.innerHTML = title;
            row.appendChild(col);
        });
    }

    prepend_row(row: Row) {
        this.body_element.insertBefore(row.element, this.body_element.firstChild);
        this.rows.unshift(row);
    }

    set_loading(count: number) {
        this.element.classList.add(`xe-table-loading`);
        for (let i = 0; i < count; i++) {
            this.add_empty_row();
        }
    }

    clear() {
        this.rows.forEach(r => r.unload());
        this.rows = [];
        this.body_element.replaceChildren();
        this.element.classList.remove(`xe-table-loading`);
    }

    add_empty_row() {
        const headers = this.head_element.querySelectorAll(`tr th`);
        const row = new Row(1);
        row.element.cells[0].colSpan = headers.length;
        this.body_element.appendChild(row.element);
        this.rows.push(row);
        return row;
    }

    set_empty(text: string) {
        this.body_element.replaceChildren();
        const empty_row = this.add_empty_row();
        empty_row.set_empty(text);
    }

    set_clickable() {
        this.element.classList.add(`xe-table-clickable`);
    }

    remove_last() {
        const last_row = this.rows.pop();
        if (last_row) last_row.unload();
    }
}
import { EventEmitter } from "../../utils/event_emitter";

import './select.css';

interface SelectEventMap {
    change: string;
}

export class Select extends EventEmitter<SelectEventMap> {
    element: HTMLElement;
    btn_element: HTMLElement;
    list_element: HTMLElement;
    on_document_click = (e: MouseEvent) => {
        const target = e.target as HTMLElement;
        if (!this.list_element.classList.contains(`open`)) return;

        if (!this.element.contains(target)) {
            this.close();
        }
    };

    constructor() {
        super();

        this.element = document.createElement(`div`);
        this.element.classList.add(`xe-select`);

        this.btn_element = document.createElement(`button`);
        this.btn_element.addEventListener(`click`, () => {
            this.toggle();
        });
        this.element.appendChild(this.btn_element);

        this.list_element = document.createElement(`div`);
        this.list_element.classList.add(`xe-select-list`, `scrollbar-1`, `scrollbar-1-right`);
        this.element.appendChild(this.list_element);
    }

    toggle() {
        if (this.list_element.classList.contains(`open`)) {
            this.close();
        } else {
            this.open();
        }
    }

    open() {
        this.list_element.classList.add(`open`);
        document.addEventListener(`click`, this.on_document_click);
    }

    close() {
        this.list_element.classList.remove(`open`);
        document.removeEventListener(`click`, this.on_document_click);
    }

    set_value(html: string) {
        this.btn_element.innerHTML = html;
    }

    add_item(key: string, html: string) {
        const item = document.createElement(`div`);
        item.innerHTML = html;
        item.addEventListener(`click`, () => {
            this.set_value(html);
            this.emit(`change`, key);
            this.close();
        });
        this.list_element.appendChild(item);
    }

    clear() {
        this.close();
        this.list_element.replaceChildren();
    }
}

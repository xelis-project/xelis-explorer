import { Context } from "hono";
import { ServerApp } from "../../server";
import { ContentfulStatusCode } from "hono/utils/http-status";

export class Page {
    element: HTMLDivElement;
    private child_pages: Page[] = [];
    private abort_controller = new AbortController();

    get signal() {
        return this.abort_controller.signal;
    }

    static pathname: string = "";
    static title: string = "";
    static description: string = "";
    static status: ContentfulStatusCode = 200;
    static server_data: any;

    static get_pattern() {
        return new URLPattern({ pathname: this.pathname });
    }

    static test_pattern(href: string) {
        const pattern = this.get_pattern();
        return pattern.test(new URL(href));
    }

    static exec_pattern(href: string) {
        const pattern = this.get_pattern();
        return pattern.exec(new URL(href));
    }

    static async handle_server(c: Context<ServerApp>) {
        return;
    }

    static serialize_server_data(data: any) {
        return `<script>window["SSR_${this.pathname}"] = ${JSON.stringify(data)};</script>`;
    }

    static consume_server_data<T>(): { server_data?: T, consumed: boolean } {
        const key = `SSR_${this.pathname}`;
        if (key in window) {
            const server_data = window[key as any] as T;
            Reflect.deleteProperty(window, key); // remove data as it might be outdated when returning to page
            return { server_data, consumed: true };
        }

        return { server_data: undefined, consumed: false };
    }

    constructor() {
        this.element = document.createElement(`div`);
        this.element.classList.add(`xe-page`);
    }

    set_window_title(title: string) {
        document.title = `${title} - XELIS Explorer`;
    }

    async load(parent: HTMLElement) {
        parent.appendChild(this.element);
    }

    unload() {
        this.abort_controller.abort();
        this.child_pages.forEach(page => page.unload());
        this.child_pages = [];
        this.element.remove();
    }

    set_page_element(page: Page) {
        this.child_pages.push(page);
        this.set_element(page.element);
    }

    set_element(element: HTMLElement) {
        if (!this.element.contains(element)) {
            this.element.replaceChildren();
            this.element.appendChild(element);
        }
    }
}

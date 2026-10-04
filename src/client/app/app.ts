import { Page } from "../pages/page";
import { match_route } from "./router";
import { Singleton } from "../utils/singleton";
import { EventEmitter } from "../utils/event_emitter";
import { TopLoadingBar } from "../components/top_loading_bar/top_loading_bar";
import { NodeStatus } from "../components/node_status/node_status";
import { Notification } from "../components/notification/notification";

import "reset-css/reset.css";
import "urlpattern-polyfill"; // URLPattern is a new web API we use polyfill for now
import 'flag-icons/css/flag-icons.css';

import './global.css';

interface AppEventMap {
    page_load: void;
}

export class App extends Singleton {
    events: EventEmitter<AppEventMap>;
    root!: HTMLElement;
    current_page?: Page;

    top_loading_bar: TopLoadingBar;
    node_status: NodeStatus;
    notification: Notification;

    load_page_timeout?: number;
    navigation_generation = 0;

    constructor() {
        super();
        this.events = new EventEmitter();
        this.top_loading_bar = new TopLoadingBar();
        this.node_status = new NodeStatus();
        this.notification = new Notification();
    }

    load(root: HTMLElement) {
        this.root = root;
        this.root.classList.add(`xe-app`);

        this.root.appendChild(this.top_loading_bar.element);
        this.root.appendChild(this.node_status.element);
        this.root.appendChild(this.notification.element);

        this.load_page();
        this.register_events();
    }

    go_to(url: string) {
        const next_url = new URL(url, window.location.href);
        // Match the server's trimTrailingSlash redirect before client routing.
        if (next_url.pathname !== `/` && next_url.pathname.endsWith(`/`)) {
            next_url.pathname = next_url.pathname.slice(0, -1);
        }
        window.history.pushState(null, ``, next_url.href);
        this.load_page();
    }

    set_window_title(title: string) {
        document.title = title;
    }

    load_page() {
        const generation = ++this.navigation_generation;
        const switch_page = async () => {
            // Release the current page before waiting for the next route chunk.
            // This keeps the old page from holding resources during navigation.
            this.current_page?.unload();
            this.current_page = undefined;

            const url = new URL(window.location.href);
            const page_type = await match_route(url);
            if (generation !== this.navigation_generation) return;

            const page = new page_type();
            this.current_page = page;

            this.top_loading_bar.start();
            await page.load(this.root);
            if (generation !== this.navigation_generation) return;
            if (this.current_page === page) {
                this.top_loading_bar.end();
                this.events.emit("page_load");
            }
        }

        // avoid spamming page load by clicking anchors rapidly causing loading/render glitches
        window.clearTimeout(this.load_page_timeout);
        this.load_page_timeout = window.setTimeout(() => {
            switch_page();
        }, 100);
    }

    on_pop_state = (_e: PopStateEvent) => {
        this.load_page();
    }

    on_click = (e: PointerEvent) => {
        // Leave modified clicks and other browsing contexts to the browser.
        if (e.defaultPrevented || e.button !== 0 || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;
        if (!(e.target instanceof Element)) return;

        const link = e.target.closest(`a[href]`);
        if (!(link instanceof HTMLAnchorElement)) return;
        if (link.hasAttribute(`download`) || (link.target && link.target.toLowerCase() !== `_self`)) return;

        const url = new URL(link.href);
        if (url.origin !== window.location.origin || ![`http:`, `https:`].includes(url.protocol)) return;

        e.preventDefault();
        this.go_to(url.href);
    }

    register_events() {
        window.addEventListener(`popstate`, this.on_pop_state);
        window.addEventListener(`click`, this.on_click);
    }
}

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

import '../vars.css';
import './fonts.css';
import './app.css';
import './scrollbars.css';

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
        window.history.pushState(null, ``, url);
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
        // intercept link click recursively
        const check_parent_link = (element: HTMLElement) => {
            if (element.parentElement) {
                if (element instanceof HTMLAnchorElement) {
                    const link = element as HTMLAnchorElement;
                    if (link.target !== `_blank`) {
                        e.preventDefault();
                        this.go_to(element.href);
                    }
                } else {
                    check_parent_link(element.parentElement);
                }
            }
        }

        if (e.target instanceof HTMLElement) {
            check_parent_link(e.target);
        }
    }

    register_events() {
        window.addEventListener(`popstate`, this.on_pop_state);
        window.addEventListener(`click`, this.on_click);
    }
}

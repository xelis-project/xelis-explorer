import { App } from '../../app/app';
import { localization } from '../../localization/localization';
import icons from '../../assets/svg/icons';
import { svg_xelis_logo } from '../../assets/svg/xelis';

import './header.css';

interface LinkDef {
    text: string;
    icon: string;
}

interface MenuCategoryDef {
    text: string;
    icon: string;
    links: Record<string, LinkDef>;
}

export const get_menu_links = () => {
    let links = {
        "/": { text: localization.get_text(`DASHBOARD`), icon: icons.dashboard() },
        "/blocks": { text: localization.get_text(`BLOCKS`), icon: icons.blocks() },
        "/transactions": { text: localization.get_text(`TRANSACTIONS`), icon: icons.exchange() },
        "/known-accounts": { text: localization.get_text(`ACCOUNTS`), icon: icons.user_circle() },
        "/contracts": { text: localization.get_text(`CONTRACTS`), icon: icons.contract() },
        "/assets": { text: localization.get_text(`ASSETS`), icon: icons.tokens() },
        "/mempool": { text: localization.get_text(`MEMPOOL`), icon: icons.compute() },
        "/dag": { text: localization.get_text(`DAG`), icon: icons.block_graph() },
        "/peers": { text: localization.get_text(`PEERS`), icon: icons.network() },
        "/network-upgrades": { text: localization.get_text(`NETWORK UPGRADES`), icon: icons.upgrade() },
        "/settings": { text: localization.get_text(`SETTINGS`), icon: icons.cog() },
    } as Record<string, LinkDef>;

    return links;
}

export const get_menu_groups = () => {
    const menu_links = get_menu_links();

    const groups = [
        {
            text: localization.get_text(`CHAIN`),
            icon: icons.blocks(),
            links: {
                "/blocks": menu_links["/blocks"],
                "/transactions": menu_links["/transactions"],
                "/mempool": menu_links["/mempool"],
                "/dag": menu_links["/dag"],
            },
        },
        {
            text: localization.get_text(`REGISTRY`),
            icon: icons.tokens(),
            links: {
                "/known-accounts": menu_links["/known-accounts"],
                "/contracts": menu_links["/contracts"],
                "/assets": menu_links["/assets"],
            },
        },
        {
            text: localization.get_text(`NETWORK`),
            icon: icons.network(),
            links: {
                "/peers": menu_links["/peers"],
                "/network-upgrades": menu_links["/network-upgrades"],
            },
        },
    ] as MenuCategoryDef[];

    return {
        dashboard: menu_links["/"],
        groups,
        settings: menu_links["/settings"],
    };
}

export class Header {
    element: HTMLDivElement;
    links_element: HTMLDivElement;
    mobile_menu_button: HTMLButtonElement;

    constructor() {
        this.element = document.createElement(`div`);
        this.element.classList.add(`xe-header`);

        const left_element = document.createElement(`div`);
        left_element.classList.add(`xe-header-left`);
        this.element.appendChild(left_element);

        const logo = document.createElement(`a`);
        logo.href = `/`;
        logo.classList.add(`xe-header-logo`);
        logo.innerHTML = `${svg_xelis_logo()} XELIS EXPLORER`;
        left_element.appendChild(logo);

        const text = document.createElement(`div`);
        text.classList.add(`xe-header-text`);
        text.innerHTML = localization.get_text(`Track and verify transactions on the XELIS network.`);
        left_element.appendChild(text);

        this.mobile_menu_button = document.createElement(`button`);
        this.mobile_menu_button.classList.add(`xe-header-mobile-menu-button`);
        this.mobile_menu_button.innerHTML = `${icons.menu()}`;
        this.element.appendChild(this.mobile_menu_button);

        this.mobile_menu_button.addEventListener(`click`, async () => {
            this.links_element.classList.add(`open`);
        });

        this.links_element = document.createElement(`div`);
        this.links_element.classList.add(`xe-header-links`);

        window.addEventListener(`click`, this.on_mobile_menu_outside_click);

        this.element.appendChild(this.links_element);

        this.render_menu_links();

        const app = App.instance();
        app.events.add_listener("page_load", this.highlight_menu_link);
    }

    render_menu_links() {
        const menu_groups = get_menu_groups();

        if (menu_groups.dashboard) {
            this.links_element.appendChild(this.create_menu_link("/", menu_groups.dashboard));
        }

        menu_groups.groups.forEach((group) => {
            const category = document.createElement(`details`);
            category.classList.add(`xe-header-link-category`);

            const summary = document.createElement(`summary`);
            summary.innerHTML = `${group.icon}<span>${group.text}</span>`;
            category.appendChild(summary);
            this.bind_desktop_category_dropdown(category, summary);

            const dropdown = document.createElement(`div`);
            dropdown.classList.add(`xe-header-link-dropdown`);
            category.appendChild(dropdown);

            Object.keys(group.links).forEach((key) => {
                const link_def = group.links[key];
                const link = this.create_menu_link(key, link_def);
                dropdown.appendChild(link);
            });

            this.links_element.appendChild(category);
        });

        if (menu_groups.settings) {
            const settings_link = this.create_menu_link("/settings", menu_groups.settings);
            settings_link.classList.add(`xe-header-settings-link`);
            this.links_element.appendChild(settings_link);
        }
    }

    bind_desktop_category_dropdown(category: HTMLDetailsElement, summary: HTMLElement) {
        let close_timeout: number | undefined;

        const clear_close_timeout = () => {
            if (close_timeout === undefined) return;

            window.clearTimeout(close_timeout);
            close_timeout = undefined;
        };

        const open_on_desktop = () => {
            if (this.is_mobile_nav()) return;

            clear_close_timeout();
            this.close_other_desktop_categories(category);
            category.open = true;
        };

        const close_on_desktop = () => {
            if (this.is_mobile_nav()) return;

            category.open = false;
        };

        const schedule_close_on_desktop = () => {
            if (this.is_mobile_nav()) return;

            clear_close_timeout();
            close_timeout = window.setTimeout(close_on_desktop, 95);
        };

        category.addEventListener(`mouseenter`, open_on_desktop);
        category.addEventListener(`mouseleave`, schedule_close_on_desktop);
        category.addEventListener(`focusin`, open_on_desktop);
        category.addEventListener(`focusout`, (e) => {
            const next_target = e.relatedTarget as Node | null;
            if (!next_target || !category.contains(next_target)) schedule_close_on_desktop();
        });

        summary.addEventListener(`click`, (e) => {
            if (this.is_mobile_nav()) return;
            e.preventDefault();
            open_on_desktop();
        });
    }

    close_other_desktop_categories(current_category: HTMLDetailsElement) {
        this.links_element.querySelectorAll(`.xe-header-link-category`).forEach((category) => {
            if (category === current_category) return;
            (category as HTMLDetailsElement).open = false;
        });
    }

    is_mobile_nav() {
        return window.matchMedia(`(max-width: 900px)`).matches;
    }

    create_menu_link(href: string, link_def: LinkDef) {
        const link = document.createElement(`a`);
        link.href = href;
        const text = link_def.text;
        link.innerHTML = `${link_def.icon}<span>${text}</span>`;

        link.addEventListener(`click`, () => {
            this.close_mobile_menu();
        });

        return link;
    }

    highlight_menu_link = () => {
        const anchors = this.links_element.querySelectorAll(`a`);
        for (let i = 0; i < anchors.length; i++) {
            const link = anchors[i] as HTMLAnchorElement;
            link.classList.remove(`active`);

            const link_url = new URL(link.href);
            const current_url = new URL(window.location.href);
            if (link_url.pathname === current_url.pathname) {
                link.classList.add(`active`);
            }
        }

        this.links_element.querySelectorAll(`.xe-header-link-category`).forEach((category) => {
            category.classList.remove(`active`);
            const active_link = category.querySelector(`a.active`);
            if (active_link) category.classList.add(`active`);
        });
    }

    on_mobile_menu_outside_click = (e: MouseEvent) => {
        const target = e.target as HTMLElement;

        if (!this.links_element.classList.contains(`open`)) return;
        if (this.mobile_menu_button.contains(target)) return;
        if (this.links_element.contains(target) && target !== this.links_element) return;

        this.close_mobile_menu();
    }

    close_mobile_menu() {
        if (!this.links_element.classList.contains(`open`)) return;

        this.links_element.classList.remove(`open`);
        this.links_element.classList.add(`close`);
        setTimeout(() => this.links_element.classList.remove(`close`), 250);
    }

    unload() {
        window.removeEventListener(`click`, this.on_mobile_menu_outside_click);
    }
}

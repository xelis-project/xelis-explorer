import { ContentfulStatusCode } from "hono/utils/http-status";
import { Page } from "../page";
import { Master } from "../../components/master/master";
import { localization } from "../../localization/localization";
import { ServerApp } from "../../../server";
import { Context } from "hono";

import './not_found.css';

export class NotFoundPage extends Page {
    static status: ContentfulStatusCode = 404;

    static async handle_server(c: Context<ServerApp>) {
        this.title = localization.get_text(`Page Not Found`);
        this.description = localization.get_text(`The interface you are looking for does not exists or was deleted.`);
    }

    master: Master;

    constructor() {
        super();

        this.master = new Master();
        this.master.content.classList.add(`xe-not-found`);
        this.element.appendChild(this.master.element);

        const back_404 = document.createElement(`div`);
        back_404.innerHTML = `404`;
        back_404.classList.add(`xe-not-found-back-404`);
        this.master.content.appendChild(back_404);

        const container = document.createElement(`div`);
        container.classList.add(`xe-not-found-container`);
        this.master.content.appendChild(container);

        const xelis_mascot = document.createElement(`img`);
        xelis_mascot.src = `/images/xelite_confused.png`;
        container.appendChild(xelis_mascot);

        const sub_container = document.createElement(`div`);
        container.appendChild(sub_container);

        const title_element = document.createElement(`div`);
        title_element.innerHTML = localization.get_text(`INTERFACE NOT FOUND`);
        sub_container.appendChild(title_element);

        const description_element = document.createElement(`div`);
        description_element.innerHTML = localization.get_text(`The interface you are looking for does not exists or was deleted.`);
        sub_container.appendChild(description_element);
    }

    async load(parent: HTMLElement) {
        super.load(parent);
        this.set_window_title(localization.get_text(`Page Not Found`));
    }

    unload(): void {
        super.unload();
        this.master.unload();
    }
}
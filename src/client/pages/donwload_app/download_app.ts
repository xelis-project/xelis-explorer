import { Page } from "../page";
import { Master } from "../../components/master/master";
import { localization } from "../../localization/localization";
import { ServerApp } from "../../../server";
import { Context } from "hono";

import './download_app.css';
import icons from "../../assets/svg/icons";

export class DownloadAppPage extends Page {
    static pathname = "/download-app";

    static async handle_server(c: Context<ServerApp>) {
        this.title = localization.get_text(`Download App`);
        this.description = localization.get_text(`Download the XELIS Explorer as a standalone application.`);
    }

    master: Master;

    constructor() {
        super();

        this.master = new Master();
        this.master.content.classList.add(`xe-download-app`);
        this.element.appendChild(this.master.element);

        this.master.content.innerHTML = `
            <div class="xe-download-app-title">The XELIS Explorer as a standalone app.</div>
            <a href="https://github.com/xelis-project/xelis-explorer-v2/releases" target="_blank" class="xe-download-app-btn">
                ${icons.download_window()}
                ${localization.get_text(`DOWNLOAD NOW`)}
            </a>
            <div class="xe-download-app-images">
                <img alt="" src="/images/xelis_standalone_app_1.png" />
                <img alt="" src="/images/xelis_standalone_app_2.png" />
            </div>
        `;
    }

    async load(parent: HTMLElement) {
        super.load(parent);
        this.set_window_title(localization.get_text(`Download App`));
    }
}
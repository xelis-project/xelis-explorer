import { Page } from "../page";
import { Master } from "../../components/master/master";
import { Container } from "../../components/container/container";
import { SettingsItem } from "./settings_item/settings_item";
import { localization } from "../../localization/localization";
import { Select } from "../../components/select/select";
import { Settings, SettingsHashFormat, SettingsMenuType } from "../../app/settings";
import { get_supported_languages, validate_lang_key } from "../../localization/supported_languages";
import { Context } from "hono";
import { ServerApp } from "../../../server";
import DaemonRPC from '@xelis/sdk/daemon/rpc';
import DaemonWS from '@xelis/sdk/daemon/websocket';
import icons from "../../assets/svg/icons";
import packageJSON from '../../../../package.json';
import { isTauri } from '@tauri-apps/api/core';

import './settings.css';

export class SettingsPage extends Page {
    static pathname = "/settings";

    static async handle_server(c: Context<ServerApp>) {
        this.title = localization.get_text(`Settings`);
        this.description = localization.get_text(`Set your preferences, manage connections and other controls.`);
    }

    master: Master;

    constructor() {
        super();

        const settings = Settings.instance();

        this.master = new Master();
        this.master.content.classList.add(`xe-settings`);
        this.element.appendChild(this.master.element);

        const container = new Container();
        this.master.content.appendChild(container.element);

        function append_line() {
            const line = document.createElement(`div`);
            line.classList.add(`xe-settings-line`);
            container.element.appendChild(line);
        }

        // language setting

        const language_item = new SettingsItem();
        language_item.title_element.innerHTML = localization.get_text(`LANGUAGE`);
        language_item.description_element.innerHTML = localization.get_text(`Choose desired language.`);
        container.element.appendChild(language_item.element);

        const language_select = new Select();
        get_supported_languages().forEach((lang) => {
            language_select.add_item(lang.key, `
                <i class="fi fi-${lang.flag}"></i>
                <div>${lang.title.toUpperCase()}</div>
            `);

            if (settings.language === lang.key) {
                language_select.set_value(`
                   <i class="fi fi-${lang.flag}"></i>
                    <div>${lang.title.toUpperCase()}</div>
                `);
            }
        });

        language_select.add_listener(`change`, (key) => {
            settings.language = validate_lang_key(key);
            settings.save();
            location.reload();
        });

        language_item.input_element.appendChild(language_select.element);

        append_line();

        // node connection setting (http)

        const http_node_connection_item = new SettingsItem();
        http_node_connection_item.title_element.innerHTML = localization.get_text(`HTTP NODE CONNECTION`);
        http_node_connection_item.description_element.innerHTML = localization.get_text(`Specify the URL of your own node. The explorer will use it to fetch initial data and perform other requests.`);
        container.element.appendChild(http_node_connection_item.element);

        const http_connection_input = document.createElement(`input`);
        http_connection_input.type = `text`;
        http_connection_input.classList.add(`xe-settings-text`);
        http_connection_input.style.width = `20rem`
        http_connection_input.value = settings.node_http_connection;

        const http_connection_save = document.createElement(`button`);
        http_connection_save.classList.add(`xe-settings-btn`);
        http_connection_save.innerHTML = icons.save();
        http_connection_save.title = localization.get_text(`Change and save the new node connection.`);

        http_connection_save.addEventListener(`click`, async (e) => {
            try {
                const new_endpoint = http_connection_input.value;
                const daemon = new DaemonRPC(new_endpoint);
                const info = await daemon.getInfo();
                alert(localization.get_text(`Connection successful. Node: {} - {}`, [info.network, info.version]));

                settings.node_http_connection = new_endpoint;
                settings.save();
            } catch (e) {
                alert(e);
            }
        });

        const http_connection_reset = document.createElement(`button`);
        http_connection_reset.classList.add(`xe-settings-btn`);
        http_connection_reset.innerHTML = icons.reset();
        http_connection_reset.title = localization.get_text(`Reset to default seed node.`);

        http_connection_reset.addEventListener(`click`, () => {
            const yes = window.confirm(localization.get_text(`Are you sure you want to reset the http node connection?`));
            if (!yes) return;

            settings.clear_node_http_connection();
            location.reload();
        });

        http_node_connection_item.input_element.classList.add(`xe-settings-item-input`);
        http_node_connection_item.input_element.appendChild(http_connection_input);
        http_node_connection_item.input_element.appendChild(http_connection_save);
        http_node_connection_item.input_element.appendChild(http_connection_reset);

        append_line();

        // node connection setting (websocket)

        const ws_node_connection_item = new SettingsItem();
        ws_node_connection_item.title_element.innerHTML = localization.get_text(`WEBSOCKET NODE CONNECTION`);
        ws_node_connection_item.description_element.innerHTML = localization.get_text(`Specify the WebSocket endpoint of your own node. The explorer uses this connection to receive live updates.`);
        container.element.appendChild(ws_node_connection_item.element);

        const ws_connection_input = document.createElement(`input`);
        ws_connection_input.type = `text`;
        ws_connection_input.classList.add(`xe-settings-text`);
        ws_connection_input.style.width = `20rem`
        ws_connection_input.value = settings.node_ws_connection;

        const ws_connection_save = document.createElement(`button`);
        ws_connection_save.classList.add(`xe-settings-btn`);
        ws_connection_save.innerHTML = icons.save();
        ws_connection_save.title = localization.get_text(`Change and save the new node connection.`);

        ws_connection_save.addEventListener(`click`, () => {
            try {
                const new_endpoint = ws_connection_input.value;
                const daemon = new DaemonWS(new_endpoint);
                daemon.socket.addEventListener(`open`, async () => {
                    const info = await daemon.methods.getInfo();
                    alert(localization.get_text(`Connection successful. Node {} - {}`, [info.network, info.version]));
                    daemon.socket.close();

                    settings.node_ws_connection = new_endpoint;
                    settings.save();
                });
                daemon.socket.addEventListener(`error`, (e) => {
                    alert(localization.get_text(`An error occurred while trying to connect.`));
                });
            } catch (e) {
                alert(e);
            }
        });

        const ws_connection_reset = document.createElement(`button`);
        ws_connection_reset.classList.add(`xe-settings-btn`);
        ws_connection_reset.innerHTML = icons.reset();
        ws_connection_reset.title = localization.get_text(`Reset to default seed node.`);

        ws_connection_reset.addEventListener(`click`, () => {
            const yes = window.confirm(localization.get_text(`Are you sure you want to reset the websocket node connection?`));
            if (!yes) return;

            settings.del_storage_item(`node_ws_connection`);
            location.reload();
        });

        ws_node_connection_item.input_element.classList.add(`xe-settings-item-input`);
        ws_node_connection_item.input_element.appendChild(ws_connection_input);
        ws_node_connection_item.input_element.appendChild(ws_connection_save);
        ws_node_connection_item.input_element.appendChild(ws_connection_reset);

        append_line();

        // hash format setting

        const hash_format_item = new SettingsItem();
        hash_format_item.title_element.innerHTML = localization.get_text(`HASH FORMAT`);
        hash_format_item.description_element.innerHTML = localization.get_text(`Choose desired hash truncation format.`);
        container.element.appendChild(hash_format_item.element);

        const hash_formats = {
            "front": localization.get_text(`FRONT ({})`, [`...00000000`]),
            "middle": localization.get_text(`MIDDLE ({})`, [`0000...0000`]),
            "back": localization.get_text(`BACK ({})`, [`00000000...`]),
        } as Record<string, string>;

        const hash_format_select = new Select();
        Object.keys(hash_formats).forEach((key) => {
            hash_format_select.add_item(key, hash_formats[key]);
        });
        hash_format_select.set_value(hash_formats[settings.hash_format]);

        hash_format_select.add_listener(`change`, (key) => {
            if (key) {
                settings.hash_format = key as SettingsHashFormat;
                settings.save();
            }
        });

        hash_format_item.input_element.appendChild(hash_format_select.element);

        append_line();

        // menu type setting

        const menu_type_item = new SettingsItem();
        menu_type_item.title_element.innerHTML = localization.get_text(`MENU TYPE`);
        menu_type_item.description_element.innerHTML = localization.get_text(`Display standard header menu or collapsed menu.`);
        container.element.appendChild(menu_type_item.element);

        const menu_types = {
            "header_menu": localization.get_text("HEADER MENU"),
            "collapsed_menu": localization.get_text("COLLAPSED MENU (RIGHT)"),
            "collapsed_menu_left": localization.get_text("COLLAPSED MENU (LEFT)")
        } as Record<string, string>;

        const menu_type_select = new Select();
        Object.keys(menu_types).forEach((key) => {
            menu_type_select.add_item(key, menu_types[key]);
        });

        menu_type_select.set_value(menu_types[settings.menu_type]);

        menu_type_select.add_listener(`change`, (key) => {
            if (key) {
                settings.menu_type = key as SettingsMenuType;
                settings.save();
                location.reload();
            }
        });

        menu_type_item.input_element.appendChild(menu_type_select.element);

        append_line();

        if (!isTauri()) {
            const download_app_item = new SettingsItem();
            download_app_item.title_element.innerHTML = localization.get_text(`DOWNLOAD APP`);
            download_app_item.description_element.innerHTML = localization.get_text(`Get the standalone desktop application.`);
            container.element.appendChild(download_app_item.element);

            const download_app_link = document.createElement(`a`);
            download_app_link.classList.add(`xe-settings-btn`);
            download_app_link.href = `/download-app`;
            download_app_link.innerHTML = `${icons.download_window()}${localization.get_text(`OPEN DOWNLOAD PAGE`)}`;
            download_app_item.input_element.appendChild(download_app_link);

            append_line();
        }

        // display explorer app version

        const settings_item = new SettingsItem();
        settings_item.title_element.innerHTML = localization.get_text(`APP VERSION`);
        settings_item.description_element.innerHTML = localization.get_text(`The current version running.`);
        settings_item.input_element.innerHTML = `v${packageJSON.version}`;
        container.element.appendChild(settings_item.element);
    }

    async load(parent: HTMLElement) {
        super.load(parent);
        this.set_window_title(localization.get_text(`Settings`));
    }

    unload(): void {
        super.unload();
        this.master.unload();
    }
}

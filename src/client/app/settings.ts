import { Singleton } from "../utils/singleton";
import { Locale, localization } from "../localization/localization";
import Cookies from 'js-cookie';
import { validate_lang_key } from "../localization/supported_languages";

export type SettingsHashFormat = "front" | "middle" | "back";
export const hash_formats = ["front", "middle", "back"];

export type SettingsMenuType = "header_menu" | "collapsed_menu" | "collapsed_menu_left";
export const menu_types = ["header_menu", "collapsed_menu", "collapsed_menu_left"];

export function valid_menu_types(value: string) {
    return menu_types.indexOf(value) !== -1;
}

export class Settings extends Singleton {
    static local_storage_prefix = `settings`;

    language: Locale;
    hash_format: SettingsHashFormat;
    menu_type: SettingsMenuType;
    node_http_connection: string;
    node_ws_connection: string;

    constructor() {
        super();

        // language
        this.language = validate_lang_key(Cookies.get(`language`) || document.documentElement.lang);
        localization.locale = this.language;

        // hash format
        const hash_format = this.get_storage_item(`hash_format`);
        if (hash_format && hash_formats.indexOf(hash_format) !== -1) {
            this.hash_format = hash_format as SettingsHashFormat;
        } else {
            this.hash_format = "middle";
        }

        // menu type
        const menu_type = this.get_storage_item(`menu_type`);
        if (menu_type && menu_types.indexOf(menu_type) !== -1) {
            this.menu_type = menu_type as SettingsMenuType;
        } else {
            this.menu_type = "header_menu";
        }

        // http node connection
        const node_http_connection = Cookies.get(`node`);
        if (node_http_connection) {
            this.node_http_connection = node_http_connection;
        } else {
            this.node_http_connection = import.meta.env.VITE_XELIS_NODE_RPC;
        }

        // ws node connection
        const node_ws_connection = this.get_storage_item(`node_ws_connection`);
        if (node_ws_connection) {
            this.node_ws_connection = node_ws_connection;
        } else {
            this.node_ws_connection = import.meta.env.VITE_XELIS_NODE_WS;
        }
    }

    get_storage_item(key: string) {
        return localStorage.getItem(`${Settings.local_storage_prefix}.${key}`);
    }

    set_storage_item(key: string, value: any) {
        localStorage.setItem(`${Settings.local_storage_prefix}.${key}`, value);
    }

    del_storage_item(key: string) {
        localStorage.removeItem(`${Settings.local_storage_prefix}.${key}`);
    }

    clear_node_http_connection() {
        Cookies.remove(`node`, {
            path: '/',
            sameSite: 'Strict',
            secure: true,
            expires: 31536000
        });
    }

    save() {
        Cookies.set(`language`, this.language, {
            path: '/',
            sameSite: 'Strict',
            secure: true,
            expires: 365
        });

        this.set_storage_item(`hash_format`, this.hash_format);
        this.set_storage_item(`menu_type`, this.menu_type);

        Cookies.set(`node`, this.node_http_connection, {
            path: '/',
            sameSite: 'Strict',
            secure: true,
            expires: 31536000
        });

        this.set_storage_item(`node_ws_connection`, this.node_ws_connection);
    }
}

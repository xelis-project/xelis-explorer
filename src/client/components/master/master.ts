import { Settings } from "../../app/settings";
import { Background } from "../background/background";
import { CollapsedMenu } from "../collapsed_menu/collapsed_menu";
import { Header } from "../header/header";

import './master.css';

export class Master {
    element: HTMLDivElement;

    background: Background;
    header: Header;
    collapsed_menu: CollapsedMenu;

    layout: HTMLDivElement;
    content: HTMLDivElement;

    constructor() {
        this.element = document.createElement(`div`);
        this.element.classList.add(`xe-master`);

        const settings = Settings.instance();

        this.background = new Background();
        this.element.appendChild(this.background.element);

        this.collapsed_menu = new CollapsedMenu();
        switch (settings.menu_type) {
            case "collapsed_menu":
                this.element.appendChild(this.collapsed_menu.element);
                break;
            case "collapsed_menu_left":
                this.element.appendChild(this.collapsed_menu.element);
                this.collapsed_menu.set_position("left");
                break;
        }

        this.layout = document.createElement(`div`);
        this.layout.classList.add(`xe-master-layout`);
        this.element.appendChild(this.layout);

        this.header = new Header();
        if (settings.menu_type === `header_menu`) {
            this.layout.appendChild(this.header.element);
        }

        this.content = document.createElement(`div`);
        this.content.classList.add(`xe-master-content`);
        this.layout.appendChild(this.content);
    }

    unload() {
        this.header.unload();
    }
}
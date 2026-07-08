import icons from "../../../../assets/svg/icons";
import { Container } from "../../../../components/container/container";
import { localization } from "../../../../localization/localization";

import './balance.css';

export class AccountBalance {
    container: Container;

    constructor() {
        this.container = new Container();
        this.container.element.classList.add(`xe-account-balance`);

        const bg = document.createElement(`div`);
        bg.classList.add(`xe-account-balance-bg`);
        this.container.element.appendChild(bg);

        const icon = document.createElement(`div`);
        icon.innerHTML = icons.question_mark_shield();
        bg.appendChild(icon);

        const text = document.createElement(`div`);
        text.classList.add(`xe-account-balance-text`);
        text.innerHTML = localization.get_text(`BALANCE ENCRYPTED`);
        this.container.element.appendChild(text);
    }
}

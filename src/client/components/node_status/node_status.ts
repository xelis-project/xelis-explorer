import icons from '../../assets/svg/icons';
import { XelisNode } from '../../app/xelis_node';
import { localization } from '../../localization/localization';

import './node_status.css';

export class NodeStatus {
    element: HTMLDivElement;

    constructor() {
        this.element = document.createElement(`div`);
        this.element.classList.add(`xe-node-status`);

        const node = XelisNode.instance();

        const reconnect_element = document.createElement(`div`);
        reconnect_element.classList.add(`xe-node-status-reconnect`);

        const reconnect_container = document.createElement(`div`);
        reconnect_element.appendChild(reconnect_container);

        const reconnect_text_element = document.createElement(`div`);
        reconnect_container.appendChild(reconnect_text_element);

        const controls_container = document.createElement(`div`);
        reconnect_container.appendChild(controls_container);

        const reconnect_button_element = document.createElement(`button`);
        reconnect_button_element.classList.add(`xe-node-status-reconnect-btn`);
        reconnect_button_element.innerHTML = `${icons.connect()} ${localization.get_text(`RECONNECT`)}`;
        reconnect_button_element.addEventListener(`click`, () => {
            location.reload();
        });
        controls_container.appendChild(reconnect_button_element);

        const settings_button_element = document.createElement(`a`);
        settings_button_element.classList.add(`xe-node-status-reconnect-btn`);
        settings_button_element.innerHTML = `${icons.cog()} ${localization.get_text(`SETTINGS`)}`;
        settings_button_element.href = `/settings`;
        controls_container.appendChild(settings_button_element);

        const hide_button_element = document.createElement(`button`);
        hide_button_element.classList.add(`xe-node-status-reconnect-hide`);
        hide_button_element.title = localization.get_text(`Hide alert.`);
        hide_button_element.innerHTML = `${icons.caret_down()}`;
        hide_button_element.addEventListener(`click`, () => {
            import('animejs').then(({ animate }) => animate(reconnect_element, {
                translateY: [0, `-100%`],
                duration: 500,
                onComplete: () => {
                    reconnect_element.remove();
                }
            }));
        });
        reconnect_container.appendChild(hide_button_element);

        node.ws.socket.addEventListener(`open`, (e) => {
            console.log(`OPEN: `, e);
        });

        node.ws.socket.addEventListener(`error`, (e) => {
            console.log(`ERROR: `, e);

            if (!this.element.contains(reconnect_button_element)) {
                reconnect_text_element.innerHTML = localization.get_text(`An error occured with the node websocket connection.`);
                this.element.appendChild(reconnect_element);
            }
        });

        node.ws.socket.addEventListener(`close`, (e) => {
            console.log(`CLOSE: `, e);

            if (!this.element.contains(reconnect_button_element)) {
                reconnect_text_element.innerHTML = localization.get_text(`The node websocket connection closed.`);
                this.element.appendChild(reconnect_element);
            }
        });
    }
}

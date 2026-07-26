import { JsonViewer } from '../../../../components/json_viewer/json_viewer';
import { localization } from '../../../../localization/localization';
import icons from '../../../../assets/svg/icons';

import './json_viewer_list_modal.css';

export class JsonViewerListModal {
    element: HTMLDivElement;
    private title_element: HTMLDivElement;
    private viewer: JsonViewer;

    constructor() {
        this.element = document.createElement(`div`);
        this.element.classList.add(`xe-json-viewer-list-modal`);

        const overlay = document.createElement(`div`);
        overlay.classList.add(`xe-json-viewer-list-modal-overlay`);
        overlay.addEventListener(`click`, () => this.hide());
        this.element.appendChild(overlay);

        const content = document.createElement(`div`);
        content.classList.add(`xe-json-viewer-list-modal-content`);
        this.element.appendChild(content);

        const actions = document.createElement(`div`);
        actions.classList.add(`xe-json-viewer-list-modal-actions`);
        content.appendChild(actions);

        const close_button = document.createElement(`button`);
        close_button.classList.add(`xe-json-viewer-list-modal-close`);
        close_button.innerHTML = icons.close();
        close_button.addEventListener(`click`, () => this.hide());
        actions.appendChild(close_button);

        const expand_button = document.createElement(`button`);
        expand_button.classList.add(`xe-json-viewer-list-modal-expand`);
        expand_button.innerHTML = localization.get_text(`EXPAND`);
        expand_button.addEventListener(`click`, () => this.viewer.element.expandAll());
        actions.insertBefore(expand_button, close_button);

        const minimize_button = document.createElement(`button`);
        minimize_button.classList.add(`xe-json-viewer-list-modal-minimize`);
        minimize_button.innerHTML = localization.get_text(`MINIMIZE`);
        minimize_button.addEventListener(`click`, () => this.viewer.element.collapseAll());
        actions.insertBefore(minimize_button, close_button);

        this.title_element = document.createElement(`div`);
        this.title_element.classList.add(`xe-json-viewer-list-modal-title`);
        content.appendChild(this.title_element);

        const value_container = document.createElement(`div`);
        value_container.classList.add(`xe-json-viewer-list-modal-value`, `scrollbar-1`, `scrollbar-1-right`);
        this.viewer = new JsonViewer();
        value_container.appendChild(this.viewer.element);
        content.appendChild(value_container);

        document.body.appendChild(this.element);
    }

    show(title: string, data: any[]) {
        this.title_element.innerHTML = localization.get_text(title);
        this.viewer.set_data(JSON.parse(JSON.stringify(data)));
        this.element.classList.add(`visible`);
    }

    hide() {
        this.element.classList.remove(`visible`);
    }
}

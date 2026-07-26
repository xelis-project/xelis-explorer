import { Box } from "../../../../components/box/box";
import { JsonViewer } from "../../../../components/json_viewer/json_viewer";

import './json_viewer_box.css';

export class JsonViewerBox {
    box: Box;
    json_viewer: JsonViewer;

    constructor(data?: any) {
        this.box = new Box();
        this.box.element.classList.add(`xe-json-viewer-box`, `scrollbar-1`, `scrollbar-1-right`);
        this.json_viewer = new JsonViewer();
        if (data !== undefined) this.json_viewer.set_data(JSON.parse(JSON.stringify(data)));
        this.box.element.appendChild(this.json_viewer.element);
    }

    set_data(data: any) {
        this.json_viewer.set_data(JSON.parse(JSON.stringify(data)));
    }
}

export function append_json_viewer_boxes(parent: HTMLElement, data: any[]) {
    data.forEach(item => {
        const json_viewer_box = new JsonViewerBox(item);
        parent.appendChild(json_viewer_box.box.element);
    });
}

export function create_json_viewer_container(data: any[]) {
    const container = new Box();
    container.element.classList.add(`xe-json-viewer-container`, `scrollbar-1`, `scrollbar-1-right`);
    append_json_viewer_boxes(container.element, data);
    return container;
}

import { JsonViewer as JsonViewerElement } from '@alenaksu/json-viewer/JsonViewer.js';

import './json_viewer.css';

export class JsonViewer {
    element: JsonViewerElement;

    constructor() {
        this.element = document.createElement(`json-viewer`);
    }

    set_data(data: any) {
        // Register the custom element before assigning its property. Keeping
        // this lazy also avoids loading a browser-only widget during SSR.
        void import('@alenaksu/json-viewer').then(() => {
            this.element.data = data;
        });
    }
}

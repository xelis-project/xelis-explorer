import { JsonViewer as JsonViewerElement } from '@alenaksu/json-viewer/JsonViewer.js';

import './json_viewer.css';

export class JsonViewer {
    element: JsonViewerElement;
    private expansion_observer?: MutationObserver;

    constructor() {
        this.element = document.createElement(`json-viewer`);
    }

    set_data(data: any) {
        // Register the custom element before assigning its property. Keeping
        // this lazy also avoids loading a browser-only widget during SSR.
        void import('@alenaksu/json-viewer').then(async () => {
            this.element.data = data;
            await this.element.updateComplete;

            const root = this.element.shadowRoot;
            if (!root) return;

            const update_expansion = () => {
                this.element.classList.toggle(`xe-json-viewer-expanded`,
                    root.querySelector(`[aria-expanded="true"]`) !== null);
            };

            if (!this.expansion_observer) {
                // Observe the rendered state to cover clicks, keyboard navigation,
                // and the modal's Expand/Minimize buttons alike.
                this.expansion_observer = new MutationObserver(update_expansion);
                this.expansion_observer.observe(root, {
                    subtree: true,
                    childList: true,
                    attributes: true,
                    attributeFilter: [`aria-expanded`],
                });
            }
            update_expansion();
        });
    }
}

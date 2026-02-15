import { XelisNode } from '../../../../app/xelis_node';
import { JsonViewer } from '../../../../components/json_viewer/json_viewer';
import { localization } from '../../../../localization/localization';
import icons from '../../../../assets/svg/icons';
import { RPCMethod, GetInfoResult, GetContractDataResult } from '@xelis/sdk/daemon/types';

import './storage_history_modal.css';

type StorageHistoryEntry = {
    topoheight: number;
    previous_topoheight?: number;
    value: unknown;
};

export class StorageHistoryModal {
    element: HTMLDivElement;
    overlay: HTMLDivElement;
    content: HTMLDivElement;
    visible: boolean = false;

    private contract_hash?: string;
    private storage_key?: any;
    private history_entries: StorageHistoryEntry[] = [];
    private current_history_index: number = 0;
    private opened_from_param: boolean = false;

    constructor() {
        this.element = document.createElement(`div`);
        this.element.classList.add(`xe-storage-history-modal`);
        this.element.style.visibility = `hidden`;

        this.overlay = document.createElement(`div`);
        this.overlay.classList.add(`xe-storage-history-modal-overlay`);
        this.overlay.addEventListener(`click`, () => this.hide());
        this.element.appendChild(this.overlay);

        this.content = document.createElement(`div`);
        this.content.classList.add(`xe-storage-history-modal-content`);
        this.element.appendChild(this.content);

        // Close button
        const close_button = document.createElement(`button`);
        close_button.classList.add(`xe-storage-history-modal-close`);
        close_button.innerHTML = icons.close();
        close_button.addEventListener(`click`, () => this.hide());
        this.content.appendChild(close_button);

        // Title
        const title = document.createElement(`div`);
        title.classList.add(`xe-storage-history-modal-title`);
        this.content.appendChild(title);

        // Key display
        const key_display = document.createElement(`div`);
        key_display.classList.add(`xe-storage-history-modal-key`);
        this.content.appendChild(key_display);

        // History navigation
        const nav = document.createElement(`div`);
        nav.classList.add(`xe-storage-history-modal-nav`);
        this.content.appendChild(nav);

        const prev_button = document.createElement(`button`);
        prev_button.innerText = localization.get_text(`Previous`);
        prev_button.classList.add(`xe-storage-history-modal-nav-prev`);
        prev_button.addEventListener(`click`, () => this.navigate_history(1));
        nav.appendChild(prev_button);

        const history_indicator = document.createElement(`div`);
        history_indicator.classList.add(`xe-storage-history-modal-nav-indicator`);
        nav.appendChild(history_indicator);

        const next_button = document.createElement(`button`);
        next_button.innerText = localization.get_text(`Next`);
        next_button.classList.add(`xe-storage-history-modal-nav-next`);
        next_button.addEventListener(`click`, async () => {
            if (this.opened_from_param) {
                await this.go_to_latest();
            } else {
                await this.navigate_history(-1);
            }
        });
        nav.appendChild(next_button);

        // Value display
        const value_container = document.createElement(`div`);
        value_container.classList.add(`xe-storage-history-modal-value`);
        this.content.appendChild(value_container);

        // Store references for updates
        (this.content as any).__title = title;
        (this.content as any).__key_display = key_display;
        (this.content as any).__history_indicator = history_indicator;
        (this.content as any).__value_container = value_container;
        (this.content as any).__prev_button = prev_button;
        (this.content as any).__next_button = next_button;

        document.body.appendChild(this.element);
    }

    private async navigate_history(delta: number) {
        const new_index = this.current_history_index + delta;
        if (new_index < 0) {
            return;
        }

        if (new_index < this.history_entries.length) {
            this.current_history_index = new_index;
            this.update_display();
            return;
        }

        if (new_index === this.history_entries.length) {
            const current = this.history_entries[this.history_entries.length - 1];
            const previous_topoheight = current?.previous_topoheight;
            if (previous_topoheight === null || previous_topoheight === undefined) {
                return;
            }

            if (!this.contract_hash || !this.storage_key) {
                return;
            }

            const existing = this.history_entries.find((entry) => entry.topoheight === previous_topoheight);
            if (!existing) {
                await this.load_contract_data_at_topoheight(this.contract_hash, this.storage_key, previous_topoheight);
            }

            if (new_index < this.history_entries.length) {
                this.current_history_index = new_index;
            } else {
                this.current_history_index = this.history_entries.length - 1;
            }
            this.update_display();
        }
    }

    private async go_to_latest() {
        if (!this.contract_hash || !this.storage_key) {
            return;
        }

        try {
            const node = XelisNode.instance();
            const current_data = await node.rpc.getContractData({
                contract: this.contract_hash,
                key: this.storage_key,
            }) as any;

            if (current_data && current_data.data !== null && current_data.data !== undefined) {
                this.history_entries = [
                    {
                        topoheight: current_data.topoheight,
                        previous_topoheight: current_data.previous_topoheight,
                        value: current_data.data,
                    }
                ];
                this.current_history_index = 0;
                this.opened_from_param = false;
                this.update_display();
                return;
            }
        } catch (e) {
            console.log(`Could not load latest value for storage key ${this.storage_key}:`, e);
        }

        this.current_history_index = 0;
        this.opened_from_param = false;
        this.update_display();
    }

    private update_display() {
        const title = (this.content as any).__title as HTMLElement;
        const key_display = (this.content as any).__key_display as HTMLElement;
        const history_indicator = (this.content as any).__history_indicator as HTMLElement;
        const value_container = (this.content as any).__value_container as HTMLElement;
        const prev_button = (this.content as any).__prev_button as HTMLButtonElement;
        const next_button = (this.content as any).__next_button as HTMLButtonElement;

        title.innerHTML = localization.get_text(`Storage Entry History`);
        // Display key as JSON string if it's an object, otherwise as string
        const key_display_str = typeof this.storage_key === 'string' 
            ? this.storage_key 
            : JSON.stringify(this.storage_key);
        key_display.innerHTML = `<code>${key_display_str}</code>`;

        if (this.history_entries.length === 0) {
            history_indicator.innerHTML = localization.get_text(`No history available`);
            value_container.replaceChildren();
            prev_button.disabled = true;
            next_button.disabled = true;
            return;
        }

        const entry = this.history_entries[this.current_history_index];
        history_indicator.innerHTML = localization.get_text(`{} of {}`, [
            (this.current_history_index + 1).toLocaleString(),
            this.history_entries.length.toLocaleString()
        ]);

        const has_previous = entry.previous_topoheight !== null && entry.previous_topoheight !== undefined;
        prev_button.disabled = !has_previous;
        next_button.disabled = this.opened_from_param ? false : this.current_history_index === 0;
        next_button.innerText = this.opened_from_param
            ? localization.get_text(`Latest`)
            : localization.get_text(`Next`);

        // Display value with JSON viewer
        value_container.replaceChildren();

        const topoheight_label = document.createElement(`div`);
        topoheight_label.classList.add(`xe-storage-history-modal-topoheight`);
        topoheight_label.innerHTML = localization.get_text(`Topoheight: {}`, [entry.topoheight.toLocaleString()]);
        value_container.appendChild(topoheight_label);

        // Safely prepare data for json-viewer
        let data_to_display: any = entry.value;
        
        // Handle null/undefined
        if (data_to_display === null || data_to_display === undefined) {
            data_to_display = null;
        } else {
            // Handle Uint8Array and other typed arrays
            if (data_to_display instanceof Uint8Array) {
                // Convert binary data to array of numbers
                data_to_display = Array.from(data_to_display);
            } else if (data_to_display instanceof ArrayBuffer) {
                data_to_display = Array.from(new Uint8Array(data_to_display));
            } else if (ArrayBuffer.isView && ArrayBuffer.isView(data_to_display)) {
                // Handle other ArrayBuffer views (Int8Array, Int16Array, etc.)
                data_to_display = Array.from(data_to_display as any);
            } else if (typeof data_to_display === 'object') {
                // Deep clone to avoid issues with circular references or special objects
                try {
                    data_to_display = JSON.parse(JSON.stringify(data_to_display, (key, value) => {
                        // Handle special types
                        if (value instanceof Uint8Array) {
                            return Array.from(value);
                        }
                        if (ArrayBuffer.isView && ArrayBuffer.isView(value)) {
                            return Array.from(value as any);
                        }
                        if (typeof value === 'function') {
                            return '[Function]';
                        }
                        if (value instanceof Error) {
                            return value.toString();
                        }
                        return value;
                    }));
                } catch (e) {
                    // If cloning fails, try to convert to a safe format
                    console.warn(`Could not clone data for json-viewer:`, e, data_to_display);
                    // Fallback: create a safe representation
                    try {
                        const safe_obj: any = {};
                        for (const key in data_to_display) {
                            try {
                                const val = data_to_display[key];
                                if (val instanceof Uint8Array) {
                                    safe_obj[key] = Array.from(val);
                                } else if (typeof val === 'function') {
                                    safe_obj[key] = '[Function]';
                                } else {
                                    safe_obj[key] = val;
                                }
                            } catch {
                                safe_obj[key] = '[Unable to serialize]';
                            }
                        }
                        data_to_display = safe_obj;
                    } catch {
                        data_to_display = { _error: 'Unable to serialize data', _raw: String(data_to_display) };
                    }
                }
            }
        }
        
        const json_viewer = new JsonViewer();
        try {
            json_viewer.set_data(data_to_display);
            value_container.appendChild(json_viewer.element);
        } catch (e) {
            console.error(`Error setting data in json-viewer:`, e, data_to_display);
            // Fallback: display as text
            const fallback = document.createElement(`div`);
            fallback.style.fontFamily = 'monospace';
            fallback.style.whiteSpace = 'pre-wrap';
            fallback.textContent = JSON.stringify(data_to_display, null, 2);
            value_container.appendChild(fallback);
        }
    }

    async show(contract_hash: string, storage_key: any, topoheight?: number) {
        if (this.visible) {
            return;
        }

        this.contract_hash = contract_hash;
        this.storage_key = storage_key;
        this.current_history_index = 0;
        this.history_entries = [];
        this.opened_from_param = topoheight !== undefined && Number.isFinite(topoheight);

        this.element.style.visibility = `visible`;
        this.element.classList.add(`visible`);

        // Show loading state
        const value_container = (this.content as any).__value_container as HTMLElement;
        value_container.replaceChildren();
        const loading = document.createElement(`div`);
        loading.classList.add(`xe-storage-history-modal-loading`);
        loading.innerHTML = localization.get_text(`Loading history...`);
        value_container.appendChild(loading);

        this.visible = true;

        try {
            await this.load_history(contract_hash, storage_key, topoheight);
        } catch (e) {
            value_container.replaceChildren();
            const error = document.createElement(`div`);
            error.classList.add(`xe-storage-history-modal-error`);
            error.innerHTML = localization.get_text(`Unable to load storage entry history.`);
            value_container.appendChild(error);
        }
    }

    private async load_contract_data_at_topoheight(contract_hash: string, storage_key: any, topoheight: number) {
        const node = XelisNode.instance();

        const current_data = await node.rpc.getContractDataAtTopoheight({
            contract: contract_hash,
            topoheight: topoheight,
            key: storage_key,
        }) as any;

        if (current_data && current_data.data !== null && current_data.data !== undefined) {
            this.history_entries.push({
                topoheight: topoheight,
                previous_topoheight: current_data.previous_topoheight,
                value: current_data.data,
            });
        }
    }

    private async load_history(contract_hash: string, storage_key: any, topoheight?: number) {
        const node = XelisNode.instance();

        if (topoheight !== undefined && Number.isFinite(topoheight)) {
            try {
                await this.load_contract_data_at_topoheight(contract_hash, storage_key, topoheight);
            } catch (e) {
                console.log(`Could not load value at topoheight ${topoheight} for storage key ${storage_key}:`, e);
            }
        } else {
            // First, get current value
            try {
                const current_data = await node.rpc.getContractData({
                    contract: contract_hash,
                    key: storage_key,
                }) as any;

                if (current_data && current_data.data !== null && current_data.data !== undefined) {
                    this.history_entries.push({
                        topoheight: current_data.topoheight,
                        previous_topoheight: current_data.previous_topoheight,
                        value: current_data.data,
                    });
                }
            } catch (e) {
                // Current value might not exist, that's okay
                console.log(`Could not load current value for storage key ${storage_key}:`, e);
            }
        }

        this.update_display();
    }

    hide() {
        if (!this.visible) {
            return;
        }

        this.visible = false;
        this.element.classList.remove(`visible`);

        // Hide after animation
        setTimeout(() => {
            if (!this.visible) {
                this.element.style.visibility = `hidden`;
            }
        }, 250);
    }

    destroy() {
        this.element.remove();
    }
}

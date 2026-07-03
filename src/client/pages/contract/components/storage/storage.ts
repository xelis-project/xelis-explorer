import { XelisNode } from '../../../../app/xelis_node';
import { Container } from '../../../../components/container/container';
import { Box } from '../../../../components/box/box';
import { localization } from '../../../../localization/localization';
import { StorageHistoryModal } from './storage_history_modal';
import icons from '../../../../assets/svg/icons';
import { reduce_text } from '../../../../utils/reduce_text';

import './storage.css';

// NOTE:
// The JS SDK does not yet expose strongly typed helpers for contract
// storage entries, so we intentionally go through `any` here to
// decouple the explorer UI from SDK changes while we experiment with
// the feature.

type ContractStorageEntry = {
    key: unknown; // Can be string, object, or other types
    topoheight?: number;
    data?: unknown;
    value?: unknown;
};

export class ContractStorageEntries {
    container: Container;
    list_element: HTMLElement;
    pagination_element: HTMLElement;
    info_element: HTMLElement;
    page_size_selector: HTMLSelectElement;
    history_modal: StorageHistoryModal;

    private contract_hash?: string;
    private page_size = 10;
    private current_page = 0;
    private has_next_page = false;
    private total_entries_shown = 0;
    private last_entries: ContractStorageEntry[] = [];

    constructor() {
        this.container = new Container();
        this.container.element.classList.add(`xe-contract-storage`);

        // Header with title and page size selector
        const header_element = document.createElement(`div`);
        header_element.classList.add(`xe-contract-storage-header`);
        this.container.element.appendChild(header_element);

        const title_element = document.createElement(`div`);
        title_element.classList.add(`xe-contract-storage-title`);
        title_element.innerHTML = localization.get_text(`STORAGE ENTRIES`);
        header_element.appendChild(title_element);

        const controls_element = document.createElement(`div`);
        controls_element.classList.add(`xe-contract-storage-controls`);
        header_element.appendChild(controls_element);

        const page_size_label = document.createElement(`label`);
        page_size_label.classList.add(`xe-contract-storage-page-size-label`);
        page_size_label.innerHTML = localization.get_text(`Per page:`);
        controls_element.appendChild(page_size_label);

        this.page_size_selector = document.createElement(`select`);
        this.page_size_selector.classList.add(`xe-contract-storage-page-size-selector`);
        [10, 25, 50, 100].forEach(size => {
            const option = document.createElement(`option`);
            option.value = String(size);
            option.textContent = String(size);
            if (size === this.page_size) {
                option.selected = true;
            }
            this.page_size_selector.appendChild(option);
        });
        this.page_size_selector.addEventListener(`change`, () => {
            this.page_size = Number(this.page_size_selector.value);
            this.current_page = 0;
            if (this.contract_hash) {
                this.load_entries(this.contract_hash, this.current_page);
            }
        });
        controls_element.appendChild(this.page_size_selector);

        // Info element to show "Showing X-Y of Z entries"
        this.info_element = document.createElement(`div`);
        this.info_element.classList.add(`xe-contract-storage-info`);
        this.container.element.appendChild(this.info_element);

        this.list_element = document.createElement(`div`);
        this.list_element.classList.add(`xe-contract-storage-list`);
        this.container.element.appendChild(this.list_element);

        this.pagination_element = document.createElement(`div`);
        this.pagination_element.classList.add(`xe-contract-storage-pagination`);
        this.container.element.appendChild(this.pagination_element);

        this.history_modal = new StorageHistoryModal();

        this.render_pagination();
    }

    private set_loading(loading: boolean) {
        if (loading) {
            Box.list_loading(this.list_element, this.page_size, `0.5rem`);
        } else {
            // Don't clear the list when turning off loading - entries are already added
            // Just remove loading class from any remaining loading boxes
            const loading_boxes = this.list_element.querySelectorAll<HTMLElement>(`.xe-box-loading`);
            loading_boxes.forEach(box => Box.set_loading(box, false));
        }
        Box.content_loading(this.pagination_element, loading);
    }

    // Extract human-readable value from nested structure
    private extract_display_value(value: any): { display: string; type?: string; isAddress?: boolean } {
        if (value === null || value === undefined) {
            return { display: '—' };
        }

        // Handle primitives directly
        if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
            const isAddress = typeof value === 'string' && value.startsWith('xel:');
            return { display: String(value), isAddress };
        }

        // Handle arrays
        if (Array.isArray(value)) {
            if (value.length === 0) {
                return { display: '[]' };
            }
            // For arrays, show each element
            const items = value.map((item, idx) => {
                const extracted = this.extract_display_value(item);
                return `[${idx}]: ${extracted.display}`;
            });
            return { display: items.join(', ') };
        }

        // Handle nested type/value structures
        if (typeof value === 'object' && value.type) {
            // Handle Address type: { type: "opaque", value: { type: "Address", value: "xel:..." } }
            if (value.type === 'opaque' && value.value?.type === 'Address' && value.value?.value) {
                return { display: value.value.value, type: 'Address', isAddress: true };
            }

            // Handle primitive with nested value: { type: "primitive", value: {...} }
            if (value.type === 'primitive' && value.value) {
                // Recursively extract from nested value
                return this.extract_display_value(value.value);
            }

            // Handle other typed structures
            if (value.value !== undefined) {
                return this.extract_display_value(value.value);
            }
        }

        // Handle plain objects (nested key-value pairs)
        if (typeof value === 'object' && value !== null) {
            const entries = Object.entries(value);
            if (entries.length === 0) {
                return { display: '{}' };
            }

            // For objects with few keys, show inline
            if (entries.length <= 3) {
                const pairs = entries.map(([k, v]) => {
                    const extracted = this.extract_display_value(v);
                    return `${k}: ${extracted.display}`;
                });
                return { display: `{ ${pairs.join(', ')} }` };
            }
        }

        // Fallback to JSON
        return { display: JSON.stringify(value, null, 2) };
    }

    private get_entry_preview(entry: ContractStorageEntry) {
        const value = (entry.value ?? entry.data ?? null) as unknown;
        const extracted = this.extract_display_value(value);

        try {
            if (extracted.display.length > 120) {
                return `${extracted.display.slice(0, 120)}…`;
            }
            return extracted.display;
        } catch {
            return String(value ?? `—`);
        }
    }

    private get_key_string(key: unknown): string {
        if (typeof key === 'string') {
            return key;
        }
        if (typeof key === 'number' || typeof key === 'boolean') {
            return String(key);
        }

        // Handle nested type/value structures for keys
        if (typeof key === 'object' && key !== null) {
            const extracted = this.extract_display_value(key);
            return extracted.display;
        }

        try {
            return JSON.stringify(key);
        } catch {
            return String(key);
        }
    }

    private parse_storage_key_param(raw_key: string): unknown {
        const trimmed = raw_key.trim();
        if (trimmed.length === 0) {
            return ``;
        }

        try {
            return JSON.parse(trimmed);
        } catch {
            return trimmed;
        }
    }

    async show_history_for_param(storage_key_param: string, storage_key_topo_param: string | null) {
        if (!this.contract_hash) {
            return;
        }

        const normalized_param = storage_key_param.trim();
        let key_to_use = this.parse_storage_key_param(storage_key_param);
        const topoheight = storage_key_topo_param ? Number.parseInt(storage_key_topo_param, 10) : undefined;

        if (normalized_param.length > 0 && this.last_entries.length > 0) {
            const matching_entry = this.last_entries.find((entry) => {
                try {
                    return this.get_key_string(entry.key) === normalized_param;
                } catch {
                    return false;
                }
            });
            if (matching_entry) {
                key_to_use = matching_entry.key;
            }
        }

        this.history_modal.show(this.contract_hash, key_to_use, Number.isFinite(topoheight) ? topoheight : undefined);
    }

    private copy_to_clipboard(text: string, button: HTMLElement) {
        navigator.clipboard.writeText(text).then(() => {
            const originalHTML = button.innerHTML;
            button.innerHTML = icons.checkmark();
            button.style.color = '#2CFFCF';
            setTimeout(() => {
                button.innerHTML = originalHTML;
                button.style.color = '';
            }, 1500);
        });
    }

    private add_entry(entry: ContractStorageEntry) {
        const item = document.createElement('div');
        item.classList.add(`xe-contract-storage-item`);

        // Extract meaningful information
        const value = (entry.value ?? entry.data ?? null) as unknown;
        const extracted = this.extract_display_value(value);
        const key_str = this.get_key_string(entry.key);

        // Key container
        const key_container = document.createElement(`div`);
        key_container.classList.add(`xe-contract-storage-key-container`);
        item.appendChild(key_container);

        const key_element = document.createElement(`div`);
        key_element.classList.add(`xe-contract-storage-key`);
        key_element.textContent = reduce_text(key_str, 15, 15);
        key_element.title = key_str;
        key_container.appendChild(key_element);

        const key_copy_btn = document.createElement(`button`);
        key_copy_btn.classList.add(`xe-contract-storage-copy-btn`);
        key_copy_btn.innerHTML = icons.copy();
        key_copy_btn.title = localization.get_text(`Copy key`);
        key_copy_btn.onclick = (e) => {
            e.stopPropagation();
            this.copy_to_clipboard(key_str, key_copy_btn);
        };
        key_container.appendChild(key_copy_btn);

        // Value section
        const value_section = document.createElement(`div`);
        value_section.classList.add(`xe-contract-storage-item-value-section`);
        item.appendChild(value_section);

        // Display value with special handling for addresses
        if (extracted.isAddress) {
            const address_container = document.createElement(`div`);
            address_container.classList.add(`xe-contract-storage-address`);
            value_section.appendChild(address_container);

            const address_icon = document.createElement(`span`);
            address_icon.classList.add(`xe-contract-storage-address-icon`);
            address_icon.innerHTML = icons.user();
            address_container.appendChild(address_icon);

            const address_link = document.createElement(`a`);
            address_link.classList.add(`xe-contract-storage-address-link`);
            address_link.href = `/account/${extracted.display}`;
            address_link.textContent = reduce_text(extracted.display, 15, 15);
            address_link.title = extracted.display;
            address_link.onclick = (e) => {
                e.stopPropagation();
            };
            address_container.appendChild(address_link);

            const address_copy_btn = document.createElement(`button`);
            address_copy_btn.classList.add(`xe-contract-storage-copy-btn`);
            address_copy_btn.innerHTML = icons.copy();
            address_copy_btn.title = localization.get_text(`Copy address`);
            address_copy_btn.onclick = (e) => {
                e.stopPropagation();
                this.copy_to_clipboard(extracted.display, address_copy_btn);
            };
            address_container.appendChild(address_copy_btn);
        } else {
            const value_element = document.createElement(`div`);
            value_element.classList.add(`xe-contract-storage-value`);
            value_section.appendChild(value_element);

            const value_text = document.createElement(`span`);
            value_text.style.flex = '1';
            value_text.style.minWidth = '0';
            value_text.style.overflow = 'hidden';
            value_text.style.textOverflow = 'ellipsis';
            value_text.style.whiteSpace = 'nowrap';
            const displayText = extracted.display.length > 100 ? reduce_text(extracted.display, 50, 50) : extracted.display;
            value_text.textContent = displayText;
            value_text.title = extracted.display;
            value_element.appendChild(value_text);

            const value_copy_btn = document.createElement(`button`);
            value_copy_btn.classList.add(`xe-contract-storage-copy-btn`);
            value_copy_btn.innerHTML = icons.copy();
            value_copy_btn.title = localization.get_text(`Copy value`);
            value_copy_btn.onclick = (e) => {
                e.stopPropagation();
                this.copy_to_clipboard(extracted.display, value_copy_btn);
            };
            value_element.appendChild(value_copy_btn);
        }

        // History button
        const history_button = document.createElement(`button`);
        history_button.classList.add(`xe-contract-storage-history-btn`);
        history_button.innerHTML = icons.history();
        history_button.title = localization.get_text(`View History`) + (entry.topoheight !== undefined ? ` (${localization.get_text(`Topoheight`)} ${entry.topoheight.toLocaleString()})` : '');
        history_button.onclick = (e) => {
            e.stopPropagation();
            if (this.contract_hash) {
                let key_to_use: any = entry.key;
                if (typeof entry.key === 'string') {
                    try {
                        key_to_use = JSON.parse(entry.key);
                    } catch {
                        key_to_use = entry.key;
                    }
                }
                this.history_modal.show(this.contract_hash, key_to_use);
            }
        };
        item.appendChild(history_button);

        this.list_element.appendChild(item);
    }

    private render_pagination() {
        this.pagination_element.replaceChildren();

        // First page button
        const first_button = document.createElement(`button`);
        first_button.classList.add(`xe-contract-storage-pagination-btn`, `xe-contract-storage-pagination-first`);
        first_button.innerHTML = icons.page_end();
        first_button.title = localization.get_text(`First page`);
        first_button.disabled = this.current_page === 0;
        first_button.onclick = () => this.goto_page(0);
        this.pagination_element.appendChild(first_button);

        // Previous page button
        const previous_button = document.createElement(`button`);
        previous_button.classList.add(`xe-contract-storage-pagination-btn`, `xe-contract-storage-pagination-prev`);
        previous_button.innerHTML = icons.page_next();
        previous_button.title = localization.get_text(`Previous page`);
        previous_button.disabled = this.current_page === 0;
        previous_button.onclick = () => {
            if (this.current_page > 0) {
                this.goto_page(this.current_page - 1);
            }
        };
        this.pagination_element.appendChild(previous_button);

        // Page indicator
        const page_indicator = document.createElement(`div`);
        page_indicator.classList.add(`xe-contract-storage-page-indicator`);
        page_indicator.innerText = localization.get_text(`Page {}`, [(this.current_page + 1).toLocaleString()]);
        this.pagination_element.appendChild(page_indicator);

        // Next page button
        const next_button = document.createElement(`button`);
        next_button.classList.add(`xe-contract-storage-pagination-btn`, `xe-contract-storage-pagination-next`);
        next_button.innerHTML = icons.page_next();
        next_button.style.rotate = `180deg`;
        next_button.title = localization.get_text(`Next page`);
        next_button.disabled = !this.has_next_page;
        next_button.onclick = () => {
            if (this.has_next_page) {
                this.goto_page(this.current_page + 1);
            }
        };
        this.pagination_element.appendChild(next_button);

        // Update info element
        if (this.total_entries_shown > 0) {
            const start = this.current_page * this.page_size + 1;
            const end = start + this.total_entries_shown - 1;
            this.info_element.innerHTML = localization.get_text(`Showing {}-{} entries`, [
                start.toLocaleString(),
                end.toLocaleString()
            ]);
            if (this.has_next_page) {
                this.info_element.innerHTML += ` ${localization.get_text(`(more available)`)}`;
            }
        } else {
            this.info_element.innerHTML = ``;
        }
    }

    private async goto_page(page: number) {
        if (!this.contract_hash) {
            return;
        }
        this.current_page = page;
        this.render_pagination();
        await this.load_entries(this.contract_hash, this.current_page);
    }

    private async load_entries(contract_hash: string, page: number) {
        const node = XelisNode.instance();
        const skip = page * this.page_size;
        const maximum = this.page_size;

        this.list_element.replaceChildren();
        this.set_loading(true);

        try {
            // Use the SDK method directly - it exists and is properly typed
            const entries = await node.rpc.getContractDataEntries({
                contract: contract_hash,
                minimum_topoheight: undefined,
                maximum_topoheight: undefined,
                skip,
                maximum,
            }) as ContractStorageEntry[];

            // Debug: log the response to understand the format
            console.log(`Storage entries response for contract ${contract_hash}:`, entries);

            this.last_entries = Array.isArray(entries) ? entries : [];

            this.total_entries_shown = Array.isArray(entries) ? entries.length : 0;
            this.has_next_page = this.total_entries_shown === maximum;
            this.render_pagination();

            if (!entries || entries.length === 0) {
                this.list_element.replaceChildren();
                const empty_element = document.createElement(`div`);
                empty_element.classList.add(`xe-contract-storage-empty`);
                empty_element.innerHTML = `
                    ${icons.book()}
                    <div>${localization.get_text(`No storage entries found`)}</div>
                    <div style="font-size: 1.3rem; opacity: 0.7; margin-top: 0.5rem;">${localization.get_text(`This contract has no storage entries yet`)}</div>
                `;
                this.list_element.appendChild(empty_element);
                this.set_loading(false);
                return;
            }

            // Clear loading boxes and add entries
            this.list_element.replaceChildren();
            entries.forEach((entry) => {
                console.log(`Processing storage entry:`, entry);
                try {
                    this.add_entry(entry);
                } catch (entryError) {
                    console.error(`Error adding storage entry:`, entryError, entry);
                }
            });

            // Turn off loading after entries are added
            this.set_loading(false);
        } catch (e) {
            console.error(`Failed to load storage entries for contract ${contract_hash}:`, e);
            this.list_element.replaceChildren();
            const error_element = document.createElement(`div`);
            error_element.classList.add(`xe-contract-storage-error`);
            const error_message = e instanceof Error ? e.message : String(e);
            error_element.innerHTML = `
                ${icons.error()}
                <div>${localization.get_text(`Unable to load storage entries`)}</div>
                <div style="font-size: 1.3rem; opacity: 0.7; margin-top: 0.5rem;">${error_message}</div>
            `;
            this.list_element.appendChild(error_element);
            this.set_loading(false);
        }
    }

    async load(contract_hash: string) {
        this.contract_hash = contract_hash;
        this.current_page = 0;
        this.has_next_page = false;
        this.render_pagination();
        await this.load_entries(contract_hash, this.current_page);
    }
}

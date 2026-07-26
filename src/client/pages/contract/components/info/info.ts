import { GetContractModuleResult } from '@xelis/sdk/daemon/types';
import { Container } from '../../../../components/container/container';
import icons from '../../../../assets/svg/icons';
import { Box } from '../../../../components/box/box';
import { localization } from '../../../../localization/localization';
import { append_json_viewer_boxes, create_json_viewer_container } from '../../../transaction/components/json_viewer_box/json_viewer_box';
import { JsonViewerListModal } from '../../../transaction/components/json_viewer_box/json_viewer_list_modal';

import './info.css';

export class ContractInfo {
    container: Container;

    warning_element: HTMLDivElement;
    constants_container: Box;
    instructions_container: Box;
    hook_ids_box: Box;
    hash_element: HTMLDivElement;
    constants_modal: JsonViewerListModal;
    instructions_modal: JsonViewerListModal;
    constants: any[] = [];
    instructions: any[] = [];

    constructor() {
        this.container = new Container();
        this.container.element.classList.add(`xe-contract-info`);
        this.constants_modal = new JsonViewerListModal();
        this.instructions_modal = new JsonViewerListModal();

        this.warning_element = document.createElement('div');
        this.warning_element.classList.add(`warning-banner`);

        const title_element = document.createElement(`div`);
        title_element.innerHTML = localization.get_text(`CONTRACT`);
        title_element.classList.add(`xe-contract-info-title`);
        this.container.element.appendChild(title_element);

        this.hash_element = document.createElement(`div`);
        this.hash_element.classList.add(`xe-contract-info-hash`);
        this.container.element.appendChild(this.hash_element);

        const constants_title_element = this.create_section_title(`CONSTANTS`, () => {
            this.constants_modal.show(`CONSTANTS`, this.constants);
        });
        this.container.element.appendChild(constants_title_element);

        this.constants_container = create_json_viewer_container([]);
        this.container.element.appendChild(this.constants_container.element);

        const instructions_title_element = this.create_section_title(`INSTRUCTIONS`, () => {
            this.instructions_modal.show(`INSTRUCTIONS`, this.instructions);
        });
        this.container.element.appendChild(instructions_title_element);

        this.instructions_container = create_json_viewer_container([]);
        this.container.element.appendChild(this.instructions_container.element);

        const hook_ids_title_element = document.createElement(`div`);
        hook_ids_title_element.innerHTML = localization.get_text(`HOOK CHUNK IDS`);
        this.container.element.appendChild(hook_ids_title_element);

        this.hook_ids_box = new Box();
        //hook_ids_box.element.innerHTML = JSON.stringify(deploy_contract.module.hook_chunk_ids || [], null, 2);
        this.container.element.appendChild(this.hook_ids_box.element);
    }

    set_loading(loading: boolean) {
        this.hook_ids_box.set_loading(loading);
        //Box.content_loading(this.hash_element, loading);
    }

    set(contract_hash: string, result: GetContractModuleResult) {
        this.hash_element.innerHTML = `<a href="/tx/${contract_hash}">${contract_hash}</a></div>`;

        const { data } = result;
        if (data?.module) {
            this.warning_element.remove();
            this.constants = data.module.constants;
            this.instructions = data.module.chunks;
            this.constants_container.element.replaceChildren();
            append_json_viewer_boxes(this.constants_container.element, this.constants);
            this.instructions_container.element.replaceChildren();
            append_json_viewer_boxes(this.instructions_container.element, this.instructions);
            this.hook_ids_box.element.innerHTML = JSON.stringify(data.module.hook_chunk_ids || [], null, 2);
        } else {
            this.warning_element.innerHTML = localization.get_text('This contract module has been deleted or failed its deploy');
            this.container.element.insertBefore(this.warning_element, this.container.element.firstChild);

            this.constants_container.element.replaceChildren();
            this.instructions_container.element.replaceChildren();
            this.constants = [];
            this.instructions = [];
            this.hook_ids_box.element.innerHTML = ``;
        }
    }

    private create_section_title(title: string, open_modal: () => void) {
        const section_title = document.createElement(`div`);
        section_title.classList.add(`xe-json-viewer-section-title`);

        const title_text = document.createElement(`span`);
        title_text.innerHTML = localization.get_text(title);
        section_title.appendChild(title_text);

        const open_button = document.createElement(`button`);
        open_button.classList.add(`xe-json-viewer-open-modal`);
        open_button.innerHTML = localization.get_text(`OPEN MODAL`);
        open_button.addEventListener(`click`, open_modal);
        section_title.appendChild(open_button);

        return section_title;
    }
}

import { GetContractModuleResult } from '@xelis/sdk/daemon/types';
import { Container } from '../../../../components/container/container';
import icons from '../../../../assets/svg/icons';
import { Box } from '../../../../components/box/box';
import { localization } from '../../../../localization/localization';
import { JsonViewerBox } from '../../../transaction/components/json_viewer_box/json_viewer_box';

import './info.css';

export class ContractInfo {
    container: Container;

    warning_element: HTMLDivElement;
    constant_json_viewer_box: JsonViewerBox;
    chunks_json_viewer_box: JsonViewerBox;
    hook_ids_box: Box;
    hash_element: HTMLDivElement;

    constructor() {
        this.container = new Container();
        this.container.element.classList.add(`xe-contract-info`);

        this.warning_element = document.createElement('div');
        this.warning_element.classList.add(`warning-banner`);

        const title_element = document.createElement(`div`);
        title_element.innerHTML = localization.get_text(`CONTRACT`);
        title_element.classList.add(`xe-contract-info-title`);
        this.container.element.appendChild(title_element);

        this.hash_element = document.createElement(`div`);
        this.hash_element.classList.add(`xe-contract-info-hash`);
        this.container.element.appendChild(this.hash_element);

        const constants_title_element = document.createElement(`div`);
        constants_title_element.innerHTML = localization.get_text(`CONSTANTS`);
        this.container.element.appendChild(constants_title_element);

        this.constant_json_viewer_box = new JsonViewerBox();
        this.container.element.appendChild(this.constant_json_viewer_box.box.element);

        const chunks_title_element = document.createElement(`div`);
        chunks_title_element.innerHTML = localization.get_text(`CHUNKS`);
        this.container.element.appendChild(chunks_title_element);

        this.chunks_json_viewer_box = new JsonViewerBox();
        this.container.element.appendChild(this.chunks_json_viewer_box.box.element);

        const hook_ids_title_element = document.createElement(`div`);
        hook_ids_title_element.innerHTML = localization.get_text(`HOOK CHUNK IDS`);
        this.container.element.appendChild(hook_ids_title_element);

        this.hook_ids_box = new Box();
        //hook_ids_box.element.innerHTML = JSON.stringify(deploy_contract.module.hook_chunk_ids || [], null, 2);
        this.container.element.appendChild(this.hook_ids_box.element);
    }

    set_loading(loading: boolean) {
        this.constant_json_viewer_box.box.set_loading(loading);
        this.chunks_json_viewer_box.box.set_loading(loading);
        this.hook_ids_box.set_loading(loading);
        //Box.content_loading(this.hash_element, loading);
    }

    set(contract_hash: string, result: GetContractModuleResult) {
        this.hash_element.innerHTML = `<a href="/tx/${contract_hash}">${contract_hash}</a></div>`;

        const { data } = result;
        if (data?.module) {
            this.warning_element.remove();
            this.constant_json_viewer_box.set_data(data.module.constants);
            this.chunks_json_viewer_box.set_data(data.module.chunks);
            this.hook_ids_box.element.innerHTML = JSON.stringify(data.module.hook_chunk_ids || [], null, 2);
        } else {
            this.warning_element.innerHTML = localization.get_text('This contract module has been deleted or failed its deploy');
            this.container.element.insertBefore(this.warning_element, this.container.element.firstChild);

            this.constant_json_viewer_box.set_data(null);
            this.chunks_json_viewer_box.set_data(null);
            this.hook_ids_box.element.innerHTML = ``;
        }
    }
}
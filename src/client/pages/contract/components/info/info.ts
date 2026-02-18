import { GetContractModuleResult } from '@xelis/sdk/daemon/types';
import { Container } from '../../../../components/container/container';
import icons from '../../../../assets/svg/icons';
import { Box } from '../../../../components/box/box';
import { localization } from '../../../../localization/localization';
import { JsonViewerBox } from '../../../transaction/components/json_viewer_box/json_viewer_box';

import './info.css';

export class ContractInfo {
    container: Container;

    constant_json_viewer_box: JsonViewerBox;
    chunks_json_viewer_box: JsonViewerBox;
    hook_ids_box: Box;
    hash_element: HTMLDivElement;

    constructor() {
        this.container = new Container();
        this.container.element.classList.add(`xe-contract-info`);

        const title_element = document.createElement(`div`);
        title_element.innerHTML = localization.get_text(`CONTRACT`);
        this.container.element.appendChild(title_element);

        this.hash_element = document.createElement(`div`);
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
            this.constant_json_viewer_box.set_data(data.module.constants);
            this.chunks_json_viewer_box.set_data(data.module.chunks);
            this.hook_ids_box.element.innerHTML = JSON.stringify(data.module.hook_chunk_ids || [], null, 2);
        } else {
            const warning_element = document.createElement('div');
            warning_element.style.color = '#ff6b6b';
            warning_element.style.padding = '1rem';
            warning_element.style.marginBottom = '1rem';
            warning_element.style.borderLeft = '4px solid #ff6b6b';
            warning_element.style.backgroundColor = 'rgba(255, 107, 107, 0.1)';
            warning_element.innerHTML = localization.get_text('This contract module has been deleted or failed its deploy');
            this.container.element.insertBefore(warning_element, this.constant_json_viewer_box.box.element);
            
            this.constant_json_viewer_box.set_data(null);
            this.chunks_json_viewer_box.set_data(null);
            this.hook_ids_box.element.innerHTML = ``;
        }
    }
}
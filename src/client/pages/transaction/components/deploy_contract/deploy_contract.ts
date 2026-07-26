import { DeployContractPayload } from "@xelis/sdk/daemon/types";
import { Container } from "../../../../components/container/container";
import { Box } from "../../../../components/box/box";
import { DepositsBox } from "./deposits_box";
import { format_xel } from "../../../../utils/format_xel";
import { JsonViewerBox } from "../json_viewer_box/json_viewer_box";
import { localization } from "../../../../localization/localization";
import { format_hash } from "../../../../utils/format_hash";

import './deploy_contract.css';

export class TransactionDeployContract {
    container: Container;

    title_element: HTMLDivElement;

    constructor(hash: string, deploy_contract: DeployContractPayload) {
        this.container = new Container();
        this.container.element.classList.add(`xe-transaction-deploy-contract`);

        this.title_element = document.createElement(`div`);
        this.title_element.innerHTML = localization.get_text(`DEPLOY CONTRACT`);
        this.container.element.appendChild(this.title_element);

        const hash_element = document.createElement(`a`);
        hash_element.href = `/contract/${hash}`;
        hash_element.innerHTML = format_hash(hash);
        this.container.element.appendChild(hash_element);

        const constants_title_element = document.createElement(`div`);
        constants_title_element.innerHTML = localization.get_text(`CONSTANTS`);
        this.container.element.appendChild(constants_title_element);

        if (deploy_contract.module.constants.length > 0) {
            const constant_json_viewer_box = new JsonViewerBox(deploy_contract.module.constants);
            this.container.element.appendChild(constant_json_viewer_box.box.element);
        } else {
            this.append_empty_message();
        }

        const chunks_title_element = document.createElement(`div`);
        chunks_title_element.innerHTML = localization.get_text(`CHUNKS`);
        this.container.element.appendChild(chunks_title_element);

        if (deploy_contract.module.chunks.length > 0) {
            const chunks_json_viewer_box = new JsonViewerBox(deploy_contract.module.chunks);
            this.container.element.appendChild(chunks_json_viewer_box.box.element);
        } else {
            this.append_empty_message();
        }

        const hook_ids_title_element = document.createElement(`div`);
        hook_ids_title_element.innerHTML = localization.get_text(`HOOK CHUNK IDS`);
        this.container.element.appendChild(hook_ids_title_element);
        if (deploy_contract.module.hook_chunk_ids?.length > 0) {
            const hook_ids_box = new Box();
            hook_ids_box.element.innerHTML = JSON.stringify(deploy_contract.module.hook_chunk_ids, null, 2);
            this.container.element.appendChild(hook_ids_box.element);
        } else {
            this.append_empty_message();
        }

        if (deploy_contract.invoke) {
            const deposits_title_element = document.createElement(`div`);
            deposits_title_element.innerHTML = localization.get_text(`DEPOSITS`);
            this.container.element.appendChild(deposits_title_element);

            if (Object.keys(deploy_contract.invoke.deposits).length > 0) {
                const deposits_box = new DepositsBox(deploy_contract.invoke.deposits);
                this.container.element.appendChild(deposits_box.box.element);
            } else {
                this.append_empty_message();
            }

            const max_gas_title = document.createElement(`div`);
            max_gas_title.innerHTML = localization.get_text(`MAX GAS`);
            this.container.element.appendChild(max_gas_title);

            const max_gas_value = document.createElement(`div`);
            max_gas_value.innerHTML = format_xel(deploy_contract.invoke.max_gas, true);
            this.container.element.appendChild(max_gas_value);
        }
    }

    private append_empty_message() {
        const empty_box = new Box();
        empty_box.element.innerHTML = localization.get_text(`None.`);
        this.container.element.appendChild(empty_box.element);
    }
}

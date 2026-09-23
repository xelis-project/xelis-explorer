import { InvokeContractPayload } from "@xelis/sdk/daemon/types";
import { Container } from "../../../../components/container/container";
import { Box } from "../../../../components/box/box";
import { format_xel } from "../../../../utils/format_xel";
import { DepositsBox } from "../deploy_contract/deposits_box";
import { JsonViewerBox } from "../json_viewer_box/json_viewer_box";
import { localization } from "../../../../localization/localization";
import { format_hash } from "../../../../utils/format_hash";

import './invoke_contract.css';

export class TransactionInvokeContract {
    container: Container;

    title_element: HTMLDivElement;

    constructor(invoke_contract: InvokeContractPayload) {
        this.container = new Container();
        this.container.element.classList.add(`xe-transaction-invoke-contract`);

        this.title_element = document.createElement(`div`);
        this.title_element.innerHTML = `INVOKE CONTRACT`;
        this.container.element.appendChild(this.title_element);

        const hash_element = document.createElement(`a`);
        hash_element.href = `/tx/${invoke_contract.contract}`;
        hash_element.innerHTML = format_hash(invoke_contract.contract);
        this.container.element.appendChild(hash_element);

        const container_element = document.createElement(`div`);

        const entry_id_element = document.createElement(`div`);
        entry_id_element.innerHTML = `<div>ENTRY ID</div><div>${invoke_contract.entry_id}</div>`;
        container_element.appendChild(entry_id_element);

        const max_gas_element = document.createElement(`div`);
        max_gas_element.innerHTML = `<div>MAX GAS</div><div>${format_xel(invoke_contract.max_gas, true)}</div>`;
        container_element.appendChild(max_gas_element);

        const permission_element = document.createElement(`div`);

        if (typeof invoke_contract.permission === `string`) {
            permission_element.innerHTML = `<div>PERMISSION</div><div>${invoke_contract.permission}</div>`;
            container_element.appendChild(permission_element);
            this.container.element.appendChild(container_element);
        } else if ("specific" in invoke_contract.permission) {
            permission_element.innerHTML = `<div>PERMISSION</div><div>specific</div>`;
            container_element.appendChild(permission_element);
            this.container.element.appendChild(container_element);

            const permission_title_element = document.createElement(`div`);
            permission_title_element.innerHTML = localization.get_text(`PERMISSION LIST`);
            this.container.element.appendChild(permission_title_element);

            const permission_json_viewer_box = new JsonViewerBox(invoke_contract.permission.specific);
            this.container.element.appendChild(permission_json_viewer_box.box.element);
        } else if ("exclude" in invoke_contract.permission) {
            permission_element.innerHTML = `<div>PERMISSION</div><div>exclude</div>`;
            container_element.appendChild(permission_element);
            this.container.element.appendChild(container_element);

            const permission_title_element = document.createElement(`div`);
            permission_title_element.innerHTML = localization.get_text(`PERMISSION LIST`);
            this.container.element.appendChild(permission_title_element);

            const permission_json_viewer_box = new JsonViewerBox(invoke_contract.permission.exclude);
            this.container.element.appendChild(permission_json_viewer_box.box.element);
        }

        const deposits_title_element = document.createElement(`div`);
        deposits_title_element.innerHTML = `DEPOSITS`;
        this.container.element.appendChild(deposits_title_element);

        if (Object.keys(invoke_contract.deposits).length > 0) {
            const deposits_box = new DepositsBox(invoke_contract.deposits);
            this.container.element.appendChild(deposits_box.box.element);
        } else {
            const box = new Box();
            box.element.innerHTML = localization.get_text(`None.`);
            this.container.element.appendChild(box.element);
        }

        const parameters_title_element = document.createElement(`div`);
        parameters_title_element.innerHTML = localization.get_text(`PARAMETERS`);
        this.container.element.appendChild(parameters_title_element);

        if (invoke_contract.parameters) {
            const parameters_json_viewer_box = new JsonViewerBox(invoke_contract.parameters);
            this.container.element.appendChild(parameters_json_viewer_box.box.element);
        } else {
            const box = new Box();
            box.element.innerHTML = localization.get_text(`No params provided.`);
            this.container.element.appendChild(box.element);
        }
    }
}
import { ContractLog } from "@xelis/sdk/daemon/types";
import { Container } from "../../../../components/container/container";
import { localization } from "../../../../localization/localization";
import { CollapseBox } from "../../../../components/collapse_box/collapse_box";
import { format_hash } from "../../../../utils/format_hash";
import { format_xel } from "../../../../utils/format_xel";
import { XelisNode } from "../../../../app/xelis_node";
import { ws_format_asset } from "../../../../utils/ws_format_asset";

import './contract_logs.css';

export class TransactionContractLogs {
    container: Container;

    constructor(contract_logs: ContractLog[]) {
        this.container = new Container();
        this.container.element.classList.add(`xe-transaction-contract-logs`);

        const title_element = document.createElement(`div`);
        title_element.innerHTML = localization.get_text(`CONTRACT LOGS`);
        this.container.element.appendChild(title_element);

        const node = XelisNode.instance();

        const load = async () => {
            for (let i = 0; i < contract_logs.length; i++) {
                const contract_log = contract_logs[i];

                if (contract_log.type === `exit_code`) {
                    const collapse_box = new CollapseBox();
                    collapse_box.title_element.innerHTML = localization.get_text(`EXIT CODE`);

                    const exit_code = contract_log.value;
                    if (exit_code === 0) {
                        collapse_box.content_element.innerHTML = `
                            <div class="exit-code">
                            <span class="dot-success"></span>
                            ${localization.get_text(`The contract execution was successful. Exit code: {}`, [`0`])}
                            </div>
                        `;
                    } else {
                        collapse_box.content_element.innerHTML = `
                            <div class="exit-code">
                            <span class="dot-fail"></span>
                            ${localization.get_text(`The contract execution failed. Exit code: {}`, [`${exit_code}`])}
                            </div>
                        `;
                    }

                    this.container.element.appendChild(collapse_box.element);
                }

                if (contract_log.type === `burn`) {
                    const collapse_box = new CollapseBox();
                    collapse_box.title_element.innerHTML = `BURN`;

                    const burn = contract_log.value;
                    const asset_amount_string = await ws_format_asset(node.ws, burn.asset, burn.amount);
                    collapse_box.content_element.innerHTML = `
                        <table>
                            <tr>
                                <td>${localization.get_text(`AMOUNT`)}</td>
                                <td>${asset_amount_string}</td>
                            <tr>
                            <tr>
                                <td>${localization.get_text(`ASSET`)}</td>
                                <td><a href="/asset/${burn.asset}">${format_hash(burn.asset)}</a></td>
                            <tr>
                            <tr>
                                <td>${localization.get_text(`CONTRACT`)}</td>
                                <td><a href="/tx/${burn.contract}">${format_hash(burn.contract)}</a></td>
                            <tr>
                        </table>
                    `;
                    collapse_box.set_collapse(true);
                    this.container.element.appendChild(collapse_box.element);
                }

                if (contract_log.type === `gas_injection`) {
                    const collapse_box = new CollapseBox();
                    collapse_box.title_element.innerHTML = localization.get_text(`GAS INJECTION`);

                    const gas_injection = contract_log.value;
                    collapse_box.content_element.innerHTML = `
                        <table>
                            <tr>
                                <td>${localization.get_text(`AMOUNT`)}</td>
                                <td>${format_xel(gas_injection.amount, true)}</td>
                            <tr>
                            <tr>
                                <td>${localization.get_text(`CONTRACT`)}</td>
                                <td><a href="/tx/${gas_injection.contract}">${format_hash(gas_injection.contract)}</a></td>
                            <tr>
                        </table>
                    `;

                    collapse_box.content_element.innerHTML = ``;
                    collapse_box.set_collapse(true);
                    this.container.element.appendChild(collapse_box.element);
                }

                if (contract_log.type === `mint`) {
                    const collapse_box = new CollapseBox();
                    collapse_box.title_element.innerHTML = localization.get_text(`MINT`);

                    const mint = contract_log.value;
                    const asset_amount_string = await ws_format_asset(node.ws, mint.asset, mint.amount);
                    collapse_box.content_element.innerHTML = `
                        <table>
                            <tr>
                                <td>${localization.get_text(`AMOUNT`)}</td>
                                <td>${asset_amount_string}</td>
                            <tr>
                            <tr>
                                <td>${localization.get_text(`ASSET`)}</td>
                                <td><a href="/asset/${mint.asset}">${format_hash(mint.asset)}</a></td>
                            <tr>
                            <tr>
                                <td>${localization.get_text(`CONTRACT`)}</td>
                                <td><a href="/tx/${mint.contract}">${format_hash(mint.contract)}</a></td>
                            <tr>
                        </table>
                    `;

                    collapse_box.set_collapse(true);
                    this.container.element.appendChild(collapse_box.element);
                }

                if (contract_log.type === `new_asset`) {
                    const collapse_box = new CollapseBox();
                    collapse_box.title_element.innerHTML = localization.get_text(`NEW ASSET`);

                    const new_asset = contract_log.value;
                    collapse_box.content_element.innerHTML = `
                        <table>
                            <tr>
                                <td>${localization.get_text(`ASSET`)}</td>
                                <td><a href="/asset/${new_asset.asset}">${format_hash(new_asset.asset)}</a></td>
                            <tr>
                            <tr>
                                <td>${localization.get_text(`CONTRACT`)}</td>
                                <td><a href="/tx/${new_asset.contract}">${format_hash(new_asset.contract)}</a></td>
                            <tr>
                        </table>
                    `;

                    collapse_box.set_collapse(true);
                    this.container.element.appendChild(collapse_box.element);
                }

                if (contract_log.type === `refund_deposits`) {
                    const collapse_box = new CollapseBox();
                    collapse_box.title_element.innerHTML = localization.get_text(`REFUND DEPOSITS`);
                    collapse_box.content_element.innerHTML = `Refund occurred.`;
                    collapse_box.set_collapse(true);
                    this.container.element.appendChild(collapse_box.element);
                }

                if (contract_log.type === `refund_gas`) {
                    const collapse_box = new CollapseBox();
                    collapse_box.title_element.innerHTML = localization.get_text(`REFUND GAS`);

                    const refund_gas = contract_log.value;
                    collapse_box.content_element.innerHTML = `${format_xel(refund_gas.amount, true)} ${localization.get_text(`refunded.`)}`;
                    collapse_box.set_collapse(true);
                    this.container.element.appendChild(collapse_box.element);
                }

                if (contract_log.type === `scheduled_execution`) {
                    const collapse_box = new CollapseBox();
                    collapse_box.title_element.innerHTML = localization.get_text(`SCHEDULED EXECUTION`);

                    const scheduled_execution = contract_log.value;
                    collapse_box.content_element.innerHTML = `
                        <table>
                            <tr>
                                <td>${localization.get_text(`HASH`)}</td>
                                <td>${format_hash(scheduled_execution.hash)}</td>
                            <tr>
                            <tr>
                                <td>${localization.get_text(`CONTRACT`)}</td>
                                <td><a href="/tx/${scheduled_execution.contract}">${format_hash(scheduled_execution.contract)}</a></td>
                            <tr>
                            <tr>
                                <td>${localization.get_text(`KIND`)}</td>
                                <td>${JSON.stringify(scheduled_execution.kind)}</td>
                            <tr>
                        </table>
                    `;

                    collapse_box.set_collapse(true);
                    this.container.element.appendChild(collapse_box.element);
                }

                if (contract_log.type === `transfer`) {
                    const collapse_box = new CollapseBox();
                    collapse_box.title_element.innerHTML = localization.get_text(`TRANSFER`);

                    const transfer = contract_log.value;
                    const asset_amount_string = await ws_format_asset(node.ws, transfer.asset, transfer.amount);
                    collapse_box.content_element.innerHTML = `
                        <table>
                            <tr>
                                <td>${localization.get_text(`AMOUNT`)}</td>
                                <td>${asset_amount_string}</td>
                            <tr>
                            <tr>
                                <td>${localization.get_text(`ASSET`)}</td>
                                <td><a href="/asset/${transfer.asset}">${format_hash(transfer.asset)}</a></td>
                            <tr>
                            <tr>
                                <td>${localization.get_text(`CONTRACT`)}</td>
                                <td><a href="/tx/${transfer.contract}">${format_hash(transfer.contract)}</a></td>
                            <tr>
                            <tr>
                                <td>${localization.get_text(`DESTINATION`)}</td>
                                <td><a href="/account/${transfer.destination}">${format_hash(transfer.destination)}</a></td>
                            <tr>
                        </table>
                    `;

                    collapse_box.set_collapse(true);
                    this.container.element.appendChild(collapse_box.element);
                }

                if (contract_log.type === `transfer_contract`) {
                    const collapse_box = new CollapseBox();
                    collapse_box.title_element.innerHTML = localization.get_text(`TRANSFER CONTRACT`);

                    const transfer_contract = contract_log.value;
                    const asset_amount_string = await ws_format_asset(node.ws, transfer_contract.asset, transfer_contract.amount);
                    collapse_box.content_element.innerHTML = `
                        <table>
                            <tr>
                                <td>${localization.get_text(`AMOUNT`)}</td>
                                <td>${asset_amount_string}</td>
                            <tr>
                            <tr>
                                <td>${localization.get_text(`ASSET`)}</td>
                                <td><a href="/asset/${transfer_contract.asset}">${format_hash(transfer_contract.asset)}</a></td>
                            <tr>
                            <tr>
                                <td>${localization.get_text(`CONTRACT`)}</td>
                                <td><a href="/tx/${transfer_contract.contract}">${format_hash(transfer_contract.contract)}</a></td>
                            <tr>
                            <tr>
                                <td>${localization.get_text(`DESTINATION`)}</td>
                                <td><a href="/tx/${transfer_contract.destination}">${format_hash(transfer_contract.destination)}</a></td>
                            <tr>
                        </table>
                    `;

                    collapse_box.set_collapse(true);
                    this.container.element.appendChild(collapse_box.element);
                }

                if (contract_log.type === `exit_payload`) {
                    const collapse_box = new CollapseBox();
                    collapse_box.title_element.innerHTML = localization.get_text(`EXIT PAYLOAD`);

                    collapse_box.content_element.innerHTML = contract_log.value.payload;

                    collapse_box.set_collapse(true);
                    this.container.element.appendChild(collapse_box.element);
                }


                if (contract_log.type === `transfer_payload`) {
                    const collapse_box = new CollapseBox();
                    collapse_box.title_element.innerHTML = localization.get_text(`TRANSFER PAYLOAD`);

                    const transfer_payload = contract_log.value;
                    const asset_amount_string = await ws_format_asset(node.ws, transfer_payload.asset, transfer_payload.amount);
                    collapse_box.content_element.innerHTML = `
                        <table>
                            <tr>
                                <td>${localization.get_text(`AMOUNT`)}</td>
                                <td>${asset_amount_string}</td>
                            <tr>
                            <tr>
                                <td>${localization.get_text(`ASSET`)}</td>
                                <td><a href="/asset/${transfer_payload.asset}">${format_hash(transfer_payload.asset)}</a></td>
                            <tr>
                            <tr>
                                <td>${localization.get_text(`CONTRACT`)}</td>
                                <td><a href="/tx/${transfer_payload.contract}">${format_hash(transfer_payload.contract)}</a></td>
                            <tr>
                            <tr>
                                <td>${localization.get_text(`DESTINATION`)}</td>
                                <td><a href="/tx/${transfer_payload.destination}">${format_hash(transfer_payload.destination)}</a></td>
                            <tr>
                            <tr>
                                <td>${localization.get_text(`PAYLOAD`)}</td>
                                <td>${transfer_payload.payload}</td>
                            <tr>
                        </table>
                    `;

                    collapse_box.set_collapse(true);
                    this.container.element.appendChild(collapse_box.element);
                }

                if (contract_log.type === `exit_error`) {
                    const collapse_box = new CollapseBox();
                    collapse_box.title_element.innerHTML = localization.get_text(`EXIT ERROR`);

                    collapse_box.content_element.innerHTML = `
                          <table>
                            <tr>
                                <td>${localization.get_text(`CODE`)}</td>
                                <td>${contract_log.value.err.code}</td>
                            <tr>
                            <tr>
                                <td>${localization.get_text(`MESSAGE`)}</td>
                                <td>${contract_log.value.err.message}</td>
                            <tr>
                        </table>
                    `;

                    collapse_box.set_collapse(true);
                    this.container.element.appendChild(collapse_box.element);
                }
            }
        }

        load();
    }
}
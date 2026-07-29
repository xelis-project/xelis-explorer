import { hashicon } from '@emeraldpay/hashicon';
import { Row } from "../../../components/table/row";
import { localization } from "../../../localization/localization";
import { format_address } from "../../../utils/format_address";

import './account_row.css';

export interface AccountRowData {
    addr: string;
    registration_topo: number;
    in_topo: number;
    out_topo: number;
}

export class AccountRow extends Row {
    constructor() {
        super(6);
    }

    set(account_data: AccountRowData) {
        this.set_addr(account_data.addr);
        this.set_registration_topo(account_data.registration_topo);
        this.set_in_topo(account_data.in_topo);
        this.set_out_topo(account_data.out_topo);
        this.set_balance();
    }

    set_addr(addr: string) {
        const container = document.createElement(`div`);
        container.classList.add(`xe-table-miner`);

        const signer_icon = hashicon(addr, { size: 25 }) as HTMLCanvasElement;
        container.appendChild(signer_icon);

        const signer_addr = document.createElement(`div`);
        signer_addr.innerHTML = format_address(addr);
        container.appendChild(signer_addr);

        this.value_cells[0].replaceChildren();
        this.value_cells[0].appendChild(container);
    }

    set_registration_topo(topo: number) {
        this.value_cells[1].innerHTML = `${topo.toLocaleString()}`;
    }

    set_in_topo(topo: number) {
        this.value_cells[2].innerHTML = `${topo.toLocaleString()}`;
    }

    set_out_topo(topo: number) {
        this.value_cells[3].innerHTML = `${topo.toLocaleString()}`;
    }

    set_balance() {
        this.value_cells[4].innerHTML = localization.get_text(`ENCRYPTED`);
    }
}

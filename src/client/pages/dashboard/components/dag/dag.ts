import { localization } from "../../../../localization/localization";
import { Container } from "../../../../components/container/container";
import { DAG } from "../../../../components/dag/dag";

import './dag.css';

export class DashboardDAG {
    container: Container;
    dag: DAG;

    constructor() {
        this.container = new Container();
        this.container.element.classList.add(`xe-dashboard-dag`);

        const title_element = document.createElement(`div`);
        title_element.innerHTML = localization.get_text(`DAG Inspector`);
        this.container.element.appendChild(title_element);

        this.dag = new DAG();
        this.dag.element.classList.add(`xe-dashboard-dag-dag`);
        this.container.element.appendChild(this.dag.element);
    }

    on_resize = () => {
        // this code below is intended to properly resize the dag
        this.container.element.removeChild(this.dag.element);
        this.dag.update_size();
        this.container.element.appendChild(this.dag.element);
        this.dag.update_size();
    }

    async load() {
        window.addEventListener(`resize`, this.on_resize);
        this.on_resize();

        this.dag.overlay_loading.set_loading(true);
        await this.dag.set_live(true);
        this.dag.overlay_loading.set_loading(false);
    }

    unload() {
        window.removeEventListener(`resize`, this.on_resize);
        this.dag.unload();
    }
}

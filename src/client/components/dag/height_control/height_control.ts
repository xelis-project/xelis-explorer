import * as nouislider from 'nouislider';
import { EventEmitter } from '../../../utils/event_emitter';
import { localization } from '../../../localization/localization';
// import 'nouislider/dist/nouislider.css';

import './dag_slider.css';
import './height_control.css';
import icons from '../../../assets/svg/icons';
import humanNumber from 'human-number';

interface HeightControlEventMap {
    new_height: number;
}

export class HeightControl extends EventEmitter<HeightControlEventMap> {
    element: HTMLElement;

    height_slider_element: HTMLDivElement;
    height_slider: nouislider.API;
    height_input_element: HTMLInputElement;
    live_btn_element: HTMLButtonElement;
    prev_height_element: HTMLButtonElement;
    next_height_element: HTMLButtonElement;
    lock_cam_element: HTMLButtonElement;

    constructor() {
        super();

        this.element = document.createElement(`div`);
        this.element.classList.add(`xe-dag-height-control`);

        const inputs_container = document.createElement(`div`);
        inputs_container.classList.add(`xe-dag-height-control-inputs`);

        this.prev_height_element = document.createElement(`button`);
        this.prev_height_element.classList.add(`xe-dag-height-control-btn-prev`);
        this.prev_height_element.innerHTML = `${icons.caret_down()} -10`;
        this.prev_height_element.title = localization.get_text(`Prev 10 height.`);
        inputs_container.appendChild(this.prev_height_element);

        this.next_height_element = document.createElement(`button`);
        this.next_height_element.classList.add(`xe-dag-height-control-btn-next`);
        this.next_height_element.innerHTML = `+10 ${icons.caret_down()}`;
        this.next_height_element.title = localization.get_text(`Next 10 height.`);
        inputs_container.appendChild(this.next_height_element);

        this.live_btn_element = document.createElement(`button`);
        this.live_btn_element.classList.add(`xe-dag-height-control-btn-live`);
        this.live_btn_element.innerHTML = localization.get_text(`LIVE`);
        this.live_btn_element.title = localization.get_text(`Toggle LIVE mode.`);
        inputs_container.appendChild(this.live_btn_element);

        this.lock_cam_element = document.createElement(`button`);
        this.lock_cam_element.innerHTML = localization.get_text(`UNLOCK CAM`);
        this.lock_cam_element.title = localization.get_text(`Lock camera to current height.`);
        inputs_container.appendChild(this.lock_cam_element);

        const title_element = document.createElement(`label`);
        title_element.innerHTML = localization.get_text(`HEIGHT`);
        inputs_container.appendChild(title_element);

        this.height_input_element = document.createElement(`input`);

        this.height_input_element.ariaLabel = 'Block height';
        this.height_input_element.type = `text`;
        this.height_input_element.name = `xe-dag-height-control`;
        this.height_input_element.addEventListener(`change`, (e) => {
            const target = e.target as HTMLInputElement;
            const new_height = parseInt(target.value);
            this.set_height(new_height);
            this.emit(`new_height`, new_height);
        });
        inputs_container.appendChild(this.height_input_element);

        this.element.appendChild(inputs_container);

        this.height_slider_element = document.createElement(`div`);

        const format_to = (value: number) => {
            return humanNumber(value, x => x.toFixed(1));
            // return value.toLocaleString(undefined, { maximumFractionDigits: 0 });
        }

        this.height_slider = nouislider.create(this.height_slider_element, {
            cssPrefix: `dag-slider-`,
            start: 0,
            step: 1,
            tooltips: {
                to: format_to
            },
            range: { min: 0, max: 100 },
            pips: {
                mode: nouislider.PipsMode.Count,
                values: 6,
                format: {
                    to: format_to
                }
            }
        });

        this.height_slider.on(`set`, (values) => {
            if (values.length === 1 && typeof values[0] === `string`) {
                const int_value = parseInt(values[0]);
                this.height_input_element.value = `${int_value}`;
                this.emit(`new_height`, int_value);
            } else {
                throw "height slider invalid set format";
            }
        });

        this.element.appendChild(this.height_slider_element);
    }

    set_height(height: number) {
        this.height_slider.updateOptions({
            start: height,
        }, false);
        this.height_input_element.value = `${height}`;
    }

    set_max_height(max_height: number) {
        this.height_slider.updateOptions({
            range: { min: 0, max: max_height }
        }, false);
    }
}
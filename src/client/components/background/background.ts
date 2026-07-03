import './background.css';

export class Background {
    element: HTMLDivElement;

    constructor() {
        this.element = document.createElement(`div`);
        this.element.classList.add(`xe-background`);
    }
}

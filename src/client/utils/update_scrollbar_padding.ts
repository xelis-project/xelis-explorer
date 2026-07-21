export function update_scrollbar_padding(element: HTMLElement, padding = `.8rem`) {
    const update = () => {
        element.style.paddingRight = element.scrollHeight > element.clientHeight ? padding : ``;
    };

    const resize_observer = new ResizeObserver(update);
    resize_observer.observe(element);

    const mutation_observer = new MutationObserver(update);
    mutation_observer.observe(element, { childList: true, subtree: true });

    update();

    return () => {
        resize_observer.disconnect();
        mutation_observer.disconnect();
        element.style.paddingRight = ``;
    };
}

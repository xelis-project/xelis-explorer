import * as d3 from 'd3';

export const chart_colors = {
    mint: `#02ffcf`,
    mint_soft: `#7fffe7`,
    mint_dark: `#00342a`,
    gold: `#f5d95f`,
    teal: `#0aa892`,
    white: `#f5f7fb`,
    muted: `#9bb3b2`,
};

const clamp = (value: number, min: number, max: number) => {
    if (max < min) return (min + max) / 2;
    return Math.max(min, Math.min(max, value));
}

const clamp_center_between = (value: number, size: number, min: number, max: number) => {
    if ((max - min) <= size) return min + ((max - min) / 2);
    return clamp(value, min + size / 2, max - size / 2);
}

export const create_chart_value_color = (min_value: number, max_value: number) => {
    const min = Number.isFinite(min_value) ? min_value : 0;
    const max = Number.isFinite(max_value) && max_value !== min ? max_value : min + 1;
    const mid = min + ((max - min) / 2);

    return d3.scaleLinear<string>()
        .domain([min, mid, max])
        .range([chart_colors.teal, chart_colors.mint, chart_colors.gold]);
}

export const create_chart_palette = (count: number) => {
    if (count <= 1) return [chart_colors.mint];

    return d3.quantize(
        (t) => d3.interpolateRgbBasis([
            chart_colors.mint,
            chart_colors.mint_soft,
            chart_colors.gold,
            chart_colors.teal,
        ])(t),
        count,
    );
}

export const hide_svg_chart_tooltip = (node: d3.Selection<SVGGElement, unknown, null, undefined>) => {
    node.selectAll(`.xe-chart-tooltip`).remove();
    node.selectAll(`.xe-chart-cursor`).remove();
}

export const show_svg_chart_tooltip = (
    node: d3.Selection<SVGGElement, unknown, null, undefined>,
    width: number,
    height: number,
    x: number,
    y: number,
    lines: string[],
    accent = chart_colors.mint,
    show_cursor = true,
    bounds = { min_x: 0, max_x: width, min_y: 0, max_y: height },
) => {
    hide_svg_chart_tooltip(node);

    if (show_cursor) {
        const cursor = node
            .append(`g`)
            .attr(`class`, `xe-chart-cursor`)
            .style(`pointer-events`, `none`);

        cursor
            .append(`line`)
            .attr(`x1`, x)
            .attr(`x2`, x)
            .attr(`y1`, bounds.min_y)
            .attr(`y2`, bounds.max_y)
            .attr(`stroke`, accent)
            .attr(`stroke-width`, 1)
            .attr(`stroke-dasharray`, `4 5`)
            .attr(`opacity`, .7);

        cursor
            .append(`circle`)
            .attr(`cx`, x)
            .attr(`cy`, y)
            .attr(`r`, 4.5)
            .attr(`fill`, `#041414`)
            .attr(`stroke`, accent)
            .attr(`stroke-width`, 2.5);
    }

    const tooltip = node
        .append(`g`)
        .attr(`class`, `xe-chart-tooltip`)
        .style(`pointer-events`, `none`)
        .style(`filter`, `drop-shadow(0 14px 24px rgba(0, 0, 0, 0.42))`);

    const text = tooltip
        .append(`text`)
        .attr(`text-anchor`, `middle`)
        .style(`font-family`, `var(--xe-font-body)`)
        .style(`font-size`, `1.3rem`)
        .style(`font-weight`, `700`);

    lines.forEach((line, i) => {
        text
            .append(`tspan`)
            .attr(`x`, 0)
            .attr(`dy`, i === 0 ? 0 : `1.22em`)
            .style(`fill`, i === 0 ? accent : `rgba(245, 247, 251, 0.82)`)
            .text(line);
    });

    const text_node = text.node();
    if (!text_node) return;

    const box = text_node.getBBox();
    const padding_x = 11;
    const padding_y = 7;
    const rect_width = box.width + padding_x * 2;
    const rect_height = box.height + padding_y * 2;

    tooltip
        .insert(`rect`, `:first-child`)
        .attr(`x`, -rect_width / 2)
        .attr(`y`, box.y - padding_y)
        .attr(`width`, rect_width)
        .attr(`height`, rect_height)
        .attr(`rx`, 8)
        .attr(`fill`, `rgba(6, 12, 15, 0.96)`)
        .attr(`stroke`, accent)
        .attr(`stroke-width`, 1)
        .attr(`opacity`, .98);

    let tooltip_x = clamp_center_between(x, rect_width, bounds.min_x, bounds.max_x);
    let tooltip_y = y - rect_height / 2 - 18;

    if (tooltip_y - rect_height / 2 < bounds.min_y) {
        tooltip_y = y + rect_height / 2 + 18;
    }

    tooltip_y = clamp_center_between(tooltip_y, rect_height, bounds.min_y, bounds.max_y);
    tooltip.attr(`transform`, `translate(${tooltip_x}, ${tooltip_y})`);
}

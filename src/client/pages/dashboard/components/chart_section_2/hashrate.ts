import * as d3 from 'd3';
import { BoxChart } from '../../../../components/box_chart/box_chart';
import { Block, BlockType, GetInfoResult } from '@xelis/sdk/daemon/types';
import { format_hashrate } from '../../../../utils/format_hashrate';
import { localization } from '../../../../localization/localization';

interface DataPoint {
    x: number;
    y: number;
    text?: { x: number; y: number; }
    text_rect?: DOMRect;
}

export class DashboardHashRate {
    box_chart: BoxChart;

    blocks: Block[];
    info?: GetInfoResult;
    chart?: {
        node: d3.Selection<SVGGElement, unknown, null, undefined>;
        width: number;
        height: number;
        rect: DOMRect
    }

    constructor() {
        this.box_chart = new BoxChart();
        this.box_chart.element_title.innerHTML = localization.get_text(`HASHRATE`);
        this.blocks = [];
    }

    set_hashrate(info: GetInfoResult) {
        const hashrate = format_hashrate(parseInt(info.difficulty), info.block_version);
        this.box_chart.element_value.innerHTML = hashrate;
    }

    create_chart() {
        this.box_chart.element_content.replaceChildren();

        const margin = { top: 10, right: 10, bottom: 10, left: 10 };
        const rect = this.box_chart.element_content.getBoundingClientRect();
        const width = rect.width - margin.left - margin.right;
        const height = 250 - margin.top - margin.bottom;

        const node = d3
            .select(this.box_chart.element_content)
            .append("svg")
            .attr("width", `100%`)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform",
                "translate(" + margin.left + "," + margin.top + ")");

        this.chart = { node, width, height, rect };
    }

    update_chart() {
        if (!this.chart || !this.info) return;

        const data = this.blocks
            .filter((b) => {
                return b.block_type === BlockType.Normal || b.block_type === BlockType.Sync;
            })
            .map((block) => {
                return { x: block.height, y: parseInt(block.difficulty) };
            }).slice(0, 100) as DataPoint[];
        if (data.length === 0) return;

        const x_scale = d3.scaleLinear()
            .domain(d3.extent(data, d => d.x) as [number, number])
            .range([0, this.chart.width]);

        const y_scale = d3.scaleLinear()
            .domain([d3.min(data, d => d.y)!, d3.max(data, d => d.y)!])
            .nice()
            .range([this.chart.height, 0]);

        const line = d3.line<DataPoint>()
            .x(d => x_scale(d.x))
            .y(d => y_scale(d.y))
            .curve(d3.curveMonotoneX);

        const min_data = data.reduce((a, b) => (a.y < b.y ? a : b), data[0] ? data[0] : { x: 0, y: 0 });
        const max_data = data.reduce((a, b) => (a.y > b.y ? a : b), data[0] ? data[0] : { x: 0, y: 0 });
        const avg_y = d3.mean(data, d => d.y) as number;


        this.chart.node.selectAll(".grad-defs").remove();

        const gradient = this.chart.node
            .append("defs")
            .attr("class", "grad-defs")
            .append("linearGradient")
            .attr("id", "grad_y")
            .attr("gradientUnits", "userSpaceOnUse")
            .attr("x1", 0)
            .attr("x2", 0)
            .attr("y1", y_scale(min_data.y))
            .attr("y2", y_scale(max_data.y));

        gradient.append("stop")
            .attr("offset", "0%")
            .attr("stop-color", "#02ffcf");

        gradient.append("stop")
            .attr("offset", "100%")
            .attr("stop-color", "#ff00aa");

        const path = this.chart.node
            .selectAll(`path`)
            .data([data])
            .attr('d', (d) => line(d))

        path.enter()
            .append('path')
            .attr('fill', `none`)
            .style('stroke-width', 5)
            .attr('stroke', `url(#grad_y)`)
            .attr('d', (d) => line(d));

        path.exit().remove();

        const add_tooltip = (prefix: string, text: string, x: number, y: number) => {
            if (!this.chart) return;

            this.chart.node
                .selectAll(`.${prefix}-tooltip`)
                .remove();

            const tooltip = this.chart.node
                .selectAll(`.${prefix}-tooltip`)
                .data([null])
                .enter()
                .append(`g`)
                .attr(`class`, `${prefix}-tooltip`);

            const text_tooltip = tooltip
                .append(`text`)
                .attr("text-anchor", "middle")
                .style("font-size", "1rem")
                .style("font-weight", "bold")
                .style("fill", "black")
                .text(text);

            const text_node = text_tooltip.node();
            if (text_node) {
                const text_box = text_node.getBBox();
                const rect_margin = { top: 3, left: 10, bottom: 2, right: 10 };
                const rect_width = text_box.width + rect_margin.left + rect_margin.right;
                const rect_height = text_box.height + rect_margin.top + rect_margin.bottom;

                tooltip.insert(`rect`, ":first-child")
                    .attr("x", -rect_width / 2)
                    .attr("y", -rect_height / 2 - rect_margin.top - rect_margin.bottom)
                    .attr("width", d => rect_width)
                    .attr("height", d => rect_height)
                    .style("backdrop-filter", "blur(10px)")
                    .style('fill', 'rgba(2, 255, 209, 1)');

                const clamp_x = Math.max(text_box.width / 2, Math.min(this.chart.width - text_box.width / 2, x));
                const clamp_y = Math.max(text_box.height / 2, Math.min(this.chart.height - text_box.height / 2, y));
                tooltip.attr("transform", `translate(${clamp_x}, ${clamp_y})`);
            }
        }

        // Avg line
        this.chart.node
            .selectAll(".avg-line")
            .data([avg_y])
            .join("line")
            .attr("class", "avg-line")
            .attr("x1", 0)
            .attr("x2", "100%")
            .attr("y1", y_scale(avg_y))
            .attr("y2", y_scale(avg_y))
            .attr("stroke", "#2CFFCF")
            .attr("stroke-width", 3)
            .attr("opacity", "1")
            .attr("stroke-dasharray", "6 4");

        // TODO: use block version for format_hashrate
        add_tooltip("avg", `AVG ${format_hashrate(avg_y, min_data.x)}`, this.chart.width / 2, y_scale(avg_y));
        add_tooltip("min", `MIN ${format_hashrate(min_data.y, min_data.x)}`, x_scale(min_data.x), y_scale(min_data.y));
        add_tooltip("max", `MAX ${format_hashrate(max_data.y, max_data.x)}`, x_scale(max_data.x), y_scale(max_data.y));
    }

    set(info: GetInfoResult, blocks: Block[]) {
        this.info = info;
        this.blocks = blocks;

        this.set_hashrate(info);
        this.update_chart();
    }

    on_resize() {
        this.create_chart();
        this.update_chart();
    }

    load() {
        window.addEventListener(`resize`, () => this.on_resize());
        this.on_resize();
    }

    unload() {
        window.removeEventListener(`resize`, () => this.on_resize());
        if (this.chart) this.chart.node.remove();
    }
}
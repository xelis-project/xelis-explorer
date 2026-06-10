import * as d3 from 'd3';
import { BoxChart } from '../../../../components/box_chart/box_chart';
import { Block, BlockType, GetInfoResult } from '@xelis/sdk/daemon/types';
import prettyMilliseconds from 'pretty-ms';
import { localization } from '../../../../localization/localization';

export class DashboardBlockTime {
    box_chart: BoxChart;
    chart?: {
        node: d3.Selection<SVGGElement, unknown, null, undefined>;
        width: number;
        height: number;
    }
    blocks: Block[];
    info!: GetInfoResult;

    constructor() {
        this.box_chart = new BoxChart();
        this.box_chart.element_title.innerHTML = localization.get_text(`BLOCK TIME`);
        this.blocks = [];
    }

    set_avg_time(avg_time: number) {
        this.box_chart.element_value.innerHTML = `${prettyMilliseconds(avg_time, { compact: true })} avg`;
    }

    create_chart() {
        this.box_chart.element_content.replaceChildren();

        const margin = { top: 10, right: 0, bottom: 10, left: 30 };
        const rect = this.box_chart.element_content.getBoundingClientRect();
        const width = rect.width - margin.left - margin.right;
        const height = 220 - margin.top - margin.bottom;

        const node = d3
            .select(this.box_chart.element_content)
            .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        this.chart = { node, width, height };
    }

    update_chart() {
        if (!this.chart) return;

        const data = [];

        const blocks = this.blocks
            .filter((b) => {
                return b.block_type === BlockType.Normal || b.block_type === BlockType.Sync;
            }).slice(0, 100);

        blocks.sort((a, b) => b.height - a.height);
        for (let i = 0; i < blocks.length; i++) {
            const prev_block = blocks[i + 1];
            const block = blocks[i];
            if (prev_block) {
                const time_ms = block.timestamp - prev_block.timestamp;
                if (prev_block.height === block.height) continue;
                data.unshift({ x: block.height, y: time_ms });
            }
        }

        const min_data = data.reduce((a, b) => (a.y < b.y ? a : b), data[0] ? data[0] : { x: 0, y: 0 });
        const max_data = data.reduce((a, b) => (a.y > b.y ? a : b), data[0] ? data[0] : { x: 0, y: 0 });
        const color = d3.scaleLinear<string>()
            .domain([min_data.y, max_data.y])
            .range(d3.quantize(t => d3.interpolateRgb(`#02ffcf`, `#ff00aa`)(t * 0.7), 2));

        const x_scale = d3
            .scaleBand<number>()
            .domain(data.map((d) => d.x))
            .range([0, this.chart.width])
            .padding(0.2);

        const y_scale = d3
            .scaleLinear()
            .domain([0, d3.max(data, (d) => d.y)!])
            .range([this.chart.height, 0]);

        const height = this.chart.height;
        const bars = this.chart.node
            .selectAll(".bar")
            .data(data)
            .join("rect")
            .attr("class", "bar")
            .attr("x", (d) => x_scale(d.x)!)
            .attr("y", (d) => y_scale(d.y))
            .attr("rx", 3)
            .attr("width", x_scale.bandwidth())
            .attr("height", (d) => height - y_scale(d.y))
            .attr("fill", d => color(d.y));

        const legend = this.chart.node
            .selectAll(`.legend`)
            .data([null]);

        legend.exit().remove();

        legend
            .enter()
            .append("g")
            .attr(`class`, `legend`)
            .merge(legend as any)
            .call(d3.axisLeft(y_scale).tickFormat((d) => {
                return prettyMilliseconds(d as number, { colonNotation: true });
            }).ticks(10));
    }

    set(info: GetInfoResult, blocks: Block[]) {
        this.info = info;
        this.blocks = blocks;
        this.set_avg_time(info.average_block_time);
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
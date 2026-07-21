import * as d3 from 'd3';
import { BoxChart } from '../../../../components/box_chart/box_chart';
import { Block, BlockType, GetInfoResult } from '@xelis/sdk/daemon/types';
import prettyMilliseconds from 'pretty-ms';
import { localization } from '../../../../localization/localization';
import { chart_colors, create_chart_value_color, hide_svg_chart_tooltip, show_svg_chart_tooltip } from '../../../../utils/chart_tooltip';

interface DataPoint {
    x: number;
    y: number;
}

export class DashboardBlockTime {
    box_chart: BoxChart;
    resize_observer?: ResizeObserver;
    last_content_width = 0;
    last_content_height = 0;
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
        const width = Math.max(rect.width - margin.left - margin.right, 1);
        const content_height = Math.max(rect.height, 220);
        const height = content_height - margin.top - margin.bottom;
        this.last_content_width = Math.round(rect.width);
        this.last_content_height = Math.round(rect.height);

        const node = d3
            .select(this.box_chart.element_content)
            .append("svg")
            .attr("width", `100%`)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        this.chart = { node, width, height };
    }

    update_chart() {
        if (!this.chart) return;

        const data = [] as DataPoint[];

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
        const color = create_chart_value_color(min_data.y, max_data.y);

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
        this.chart.node
            .selectAll(".chart-guide")
            .data(y_scale.ticks(4))
            .join("line")
            .attr("class", "chart-guide")
            .attr("x1", 0)
            .attr("x2", this.chart.width)
            .attr("y1", d => y_scale(d))
            .attr("y2", d => y_scale(d))
            .attr("stroke", "rgba(245, 247, 251, 0.08)")
            .attr("stroke-width", 1);

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
            .attr("fill", d => color(d.y))
            .attr("opacity", .92)
            .style("cursor", "crosshair");

        bars
            .on("pointermove", (event, d) => {
                if (!this.chart) return;

                const x = x_scale(d.x)! + x_scale.bandwidth() / 2;
                const y = y_scale(d.y);
                d3.select(event.currentTarget as SVGRectElement)
                    .attr("stroke", chart_colors.gold)
                    .attr("stroke-width", 2)
                    .attr("opacity", 1);

                show_svg_chart_tooltip(
                    this.chart.node,
                    this.chart.width,
                    this.chart.height,
                    x,
                    y,
                    [`HEIGHT ${d.x.toLocaleString()}`, prettyMilliseconds(d.y, { compact: true })],
                    chart_colors.gold,
                );
            })
            .on("pointerleave", (event) => {
                d3.select(event.currentTarget as SVGRectElement)
                    .attr("stroke", null)
                    .attr("stroke-width", null)
                    .attr("opacity", .92);
                if (this.chart) hide_svg_chart_tooltip(this.chart.node);
            });

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

        this.chart.node
            .selectAll(`.legend path, .legend line`)
            .attr("stroke", "rgba(245, 247, 251, 0.16)");

        this.chart.node
            .selectAll(`.legend text`)
            .attr("fill", "rgba(245, 247, 251, 0.66)")
            .style("font-size", "1.3rem")
            .style("font-family", "var(--xe-font-body)");
    }

    set(info: GetInfoResult, blocks: Block[]) {
        this.info = info;
        this.blocks = blocks;
        this.set_avg_time(info.average_block_time);
        this.create_chart();
        this.update_chart();
    }

    on_resize = () => {
        this.create_chart();
        this.update_chart();
    }

    load() {
        window.addEventListener(`resize`, this.on_resize);
        this.resize_observer = new ResizeObserver((entries) => {
            const rect = entries[0]?.contentRect;
            if (!rect) return;

            const width = Math.round(rect.width);
            const height = Math.round(rect.height);
            if (width === this.last_content_width && height === this.last_content_height) return;

            this.on_resize();
        });
        this.resize_observer.observe(this.box_chart.element_content);
        this.on_resize();
    }

    unload() {
        window.removeEventListener(`resize`, this.on_resize);
        this.resize_observer?.disconnect();
        if (this.chart) this.chart.node.remove();
    }
}

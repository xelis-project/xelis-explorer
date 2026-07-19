import * as d3 from 'd3';
import { BoxChart } from '../../../../components/box_chart/box_chart';
import { Block, BlockType, GetInfoResult } from '@xelis/sdk/daemon/types';
import { format_hashrate } from '../../../../utils/format_hashrate';
import { localization } from '../../../../localization/localization';
import { chart_colors, hide_svg_chart_tooltip, show_svg_chart_tooltip } from '../../../../utils/chart_tooltip';

interface DataPoint {
    x: number;
    y: number;
    version?: number;
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
                return { x: block.height, y: parseInt(block.difficulty), version: block.version };
            })
            .slice(0, 100)
            .sort((a, b) => a.x - b.x) as DataPoint[];
        if (data.length === 0) return;

        const x_scale = d3.scaleLinear()
            .domain(d3.extent(data, d => d.x) as [number, number])
            .range([0, this.chart.width]);

        const min_y = d3.min(data, d => d.y)!;
        const max_y = d3.max(data, d => d.y)!;
        const y_padding = min_y === max_y ? Math.max(1, min_y * 0.05) : 0;

        const y_scale = d3.scaleLinear()
            .domain([min_y - y_padding, max_y + y_padding])
            .nice()
            .range([this.chart.height, 0]);

        const line = d3.line<DataPoint>()
            .x(d => x_scale(d.x))
            .y(d => y_scale(d.y))
            .curve(d3.curveMonotoneX);

        const area = d3.area<DataPoint>()
            .x(d => x_scale(d.x))
            .y0(this.chart.height)
            .y1(d => y_scale(d.y))
            .curve(d3.curveMonotoneX);

        this.chart.node.selectAll(".grad-defs").remove();

        const defs = this.chart.node
            .append("defs")
            .attr("class", "grad-defs");

        const gradient = defs
            .append("linearGradient")
            .attr("id", "xe-hashrate-line-grad")
            .attr("gradientUnits", "userSpaceOnUse")
            .attr("x1", 0)
            .attr("x2", this.chart.width)
            .attr("y1", 0)
            .attr("y2", 0);

        gradient.append("stop")
            .attr("offset", "0%")
            .attr("stop-color", chart_colors.mint);

        gradient.append("stop")
            .attr("offset", "100%")
            .attr("stop-color", chart_colors.gold);

        const area_gradient = defs
            .append("linearGradient")
            .attr("id", "xe-hashrate-area-grad")
            .attr("gradientUnits", "userSpaceOnUse")
            .attr("x1", 0)
            .attr("x2", 0)
            .attr("y1", 0)
            .attr("y2", this.chart.height);

        area_gradient.append("stop")
            .attr("offset", "0%")
            .attr("stop-color", chart_colors.mint)
            .attr("stop-opacity", .18);

        area_gradient.append("stop")
            .attr("offset", "100%")
            .attr("stop-color", chart_colors.mint_dark)
            .attr("stop-opacity", 0);

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

        this.chart.node
            .selectAll<SVGPathElement, DataPoint[]>(".hashrate-area")
            .data([data])
            .join("path")
            .attr("class", "hashrate-area")
            .attr("fill", `url(#xe-hashrate-area-grad)`)
            .attr("d", (d) => area(d));

        this.chart.node
            .selectAll<SVGPathElement, DataPoint[]>(".hashrate-line")
            .data([data])
            .join("path")
            .attr("class", "hashrate-line")
            .attr("fill", `none`)
            .style("stroke-width", 4)
            .attr("stroke", `url(#xe-hashrate-line-grad)`)
            .attr('d', (d) => line(d));

        const bisect = d3.bisector<DataPoint, number>(d => d.x).center;

        this.chart.node
            .selectAll<SVGRectElement, null>(".hover-layer")
            .data([null])
            .join("rect")
            .attr("class", "hover-layer")
            .attr("x", 0)
            .attr("y", 0)
            .attr("width", this.chart.width)
            .attr("height", this.chart.height)
            .attr("fill", "transparent")
            .style("cursor", "crosshair")
            .on("pointermove", (event) => {
                if (!this.chart || !this.info) return;

                const [mouse_x] = d3.pointer(event, this.chart.node.node());
                const x_value = x_scale.invert(mouse_x);
                const index = Math.max(0, Math.min(data.length - 1, bisect(data, x_value)));
                const point = data[index];
                const x = x_scale(point.x);
                const y = y_scale(point.y);
                const version = point.version ?? this.info.block_version;

                show_svg_chart_tooltip(
                    this.chart.node,
                    this.chart.width,
                    this.chart.height,
                    x,
                    y,
                    [`HEIGHT ${point.x.toLocaleString()}`, format_hashrate(point.y, version)],
                    chart_colors.gold,
                );
            })
            .on("pointerleave", () => {
                if (this.chart) hide_svg_chart_tooltip(this.chart.node);
            });
    }

    set(info: GetInfoResult, blocks: Block[]) {
        this.info = info;
        this.blocks = blocks;

        this.set_hashrate(info);
        this.update_chart();
    }

    on_resize = () => {
        this.create_chart();
        this.update_chart();
    }

    load() {
        window.addEventListener(`resize`, this.on_resize);
        this.on_resize();
    }

    unload() {
        window.removeEventListener(`resize`, this.on_resize);
        if (this.chart) this.chart.node.remove();
    }
}

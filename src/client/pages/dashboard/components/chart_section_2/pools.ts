import * as d3 from 'd3';
import { BoxChart } from '../../../../components/box_chart/box_chart';
import { format_address } from '../../../../utils/format_address';
import { Block } from '@xelis/sdk/daemon/types';
import { localization } from '../../../../localization/localization';
import { chart_colors, create_chart_palette, hide_svg_chart_tooltip, show_svg_chart_tooltip } from '../../../../utils/chart_tooltip';

interface DataItem {
    label: string;
    value: number;
}

export class DashboardPools {
    box_chart: BoxChart;
    miners: Record<string, number>;
    chart?: {
        node: d3.Selection<SVGGElement, unknown, null, undefined>;
        width: number;
        height: number;
    }

    constructor() {
        this.box_chart = new BoxChart();
        this.box_chart.element_title.innerHTML = localization.get_text(`POOLS & MINERS`);
        this.miners = {};
    }

    set_miner_count(count: number) {
        this.box_chart.element_value.innerHTML = `${count.toLocaleString()}`;
    }

    create_chart() {
        this.box_chart.element_content.replaceChildren();

        const rect = this.box_chart.element_content.getBoundingClientRect();
        const width = 400 //rect.width;
        const height = 200;

        const node = d3
            .select(this.box_chart.element_content)
            .append('svg')
            .attr('width', `100%`)
            .attr('height', height)
            .append('g')
            .attr('transform', `translate(100, ${height / 2})`);

        this.chart = { node, width, height };
    }

    update_chart() {
        if (!this.chart) return;

        const radius = Math.min(this.chart.width, this.chart.height) / 2;
        const donutInnerOffset = 25;

        let data = Object.keys(this.miners).map((miner, i) => {
            return {
                label: format_address(miner),
                value: this.miners[miner],
            };
        });

        data = data.sort((a, b) => b.value - a.value).slice(0, 6);

        const pie_generator = d3.pie<DataItem>()
            .value(d => d.value)
            .sort(null);

        const arc_data = pie_generator(data);

        const arc_generator = d3.arc<d3.PieArcDatum<DataItem>>()
            .innerRadius(radius - donutInnerOffset)
            .outerRadius(radius);

        const color = d3.scaleOrdinal<string>()
            .domain(data.map(d => d.label))
            .range(create_chart_palette(data.length));

        const arcs = this.chart.node.selectAll('path')
            .data(arc_data);

        arcs.exit().transition().remove();

        const arc_paths = arcs.enter()
            .append(`path`)
            .merge(arcs as any)
            .attr('stroke', 'rgba(2, 7, 8, 0.72)')
            .attr('stroke-width', 2)
            .style('cursor', 'crosshair');

        arc_paths
            .transition()
            .duration(500)
            .attr('fill', d => color(d.data.label))
            .attr('d', arc_generator);

        const total = d3.sum(data, d => d.value);
        const tooltip_bounds = {
            min_x: -this.chart.width / 2,
            max_x: this.chart.width / 2,
            min_y: -this.chart.height / 2,
            max_y: this.chart.height / 2,
        };

        arc_paths
            .on("pointermove", (event, d) => {
                if (!this.chart) return;

                const [x, y] = arc_generator.centroid(d);
                const share = total > 0 ? (d.data.value / total) * 100 : 0;
                const accent = color(d.data.label);

                d3.select(event.currentTarget as SVGPathElement)
                    .attr("stroke", chart_colors.gold)
                    .attr("stroke-width", 3);

                show_svg_chart_tooltip(
                    this.chart.node,
                    this.chart.width,
                    this.chart.height,
                    x,
                    y,
                    [d.data.label, `${d.data.value.toLocaleString()} blocks`, `${share.toFixed(1)}% share`],
                    accent,
                    false,
                    tooltip_bounds,
                );
            })
            .on("pointerleave", (event) => {
                d3.select(event.currentTarget as SVGPathElement)
                    .attr("stroke", "rgba(2, 7, 8, 0.72)")
                    .attr("stroke-width", 2);
                if (this.chart) hide_svg_chart_tooltip(this.chart.node);
            });

        const legend_radius = 8;
        const legend_spacing = 20;

        this.chart.node
            .selectAll(`.legend`)
            .remove();

        const legend = this.chart.node
            .selectAll('.legend')
            .data(data)
            .enter()
            .append('g')
            .attr('class', 'legend')
            .attr('transform', (d, i) => {
                var height = legend_radius + legend_spacing;
                var offset = height * color.domain().length / 2;
                var x = 120;
                var y = (i * height) - offset;
                return `translate(${x}, ${y})`;
            });

        legend
            .append('circle')
            .attr('r', legend_radius)
            .style('fill', d => color(d.label));

        legend
            .append('text')
            .attr('x', 5 + legend_radius)
            .attr('y', legend_radius / 2)
            .style(`fill`, d => color(d.label))
            .style("font-family", "var(--xe-font-body)")
            .style("font-size", "1.3rem")
            .text((d) => `${d.label} (${d.value})`);
    }

    set(blocks: Block[]) {
        const limit_blocks = blocks.slice(0, 100);

        this.miners = {};

        for (let i = 0; i < limit_blocks.length; i++) {
            const { miner } = limit_blocks[i];
            if (this.miners[miner]) {
                this.miners[miner] += 1;
            } else {
                this.miners[miner] = 1;
            }
        }

        this.set_miner_count(Object.keys(this.miners).length);
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

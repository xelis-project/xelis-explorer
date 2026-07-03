import * as d3 from 'd3';
import { BoxChart } from '../../../../components/box_chart/box_chart';
import { format_address } from '../../../../utils/format_address';
import { Block } from '@xelis/sdk/daemon/types';
import { localization } from '../../../../localization/localization';

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
            .range(data.length > 1 ? d3.quantize(t => d3.interpolateRgb(`#ff00aa`, `#02ffcf`)(t * 0.8), data.length) : [`#02ffcf`]);

        const arcs = this.chart.node.selectAll('path')
            .data(arc_data);

        arcs.exit().transition().remove();

        arcs.enter()
            .append(`path`)
            .merge(arcs as any)
            .transition()
            .duration(500)
            .attr('fill', d => color(d.data.label))
            .attr('d', arc_generator);

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

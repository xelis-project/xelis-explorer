import * as d3 from 'd3';
import { BoxChart } from '../../../../components/box_chart/box_chart';
import { Peer } from '@xelis/sdk/daemon/types';
import { localization } from '../../../../localization/localization';

interface DataItem {
    label: string;
    value: number;
}

export class PeersChartNodesByVersion {
    box_chart: BoxChart;
    chart?: {
        node: d3.Selection<SVGGElement, unknown, null, undefined>;
        width: number;
        height: number;
    };
    peers: Peer[];

    constructor() {
        this.peers = [];
        this.box_chart = new BoxChart();
        this.box_chart.element_title.innerHTML = localization.get_text(`NODES BY VERSION`);
    }

    create_chart() {
        this.box_chart.element_content.replaceChildren();

        const width = 150;
        const height = 150;

        const node = d3
            .select(this.box_chart.element_content)
            .append('svg')
            .attr('width', `100%`)
            .attr('height', height)
            .append('g')
            .attr('transform', `translate(${width / 2}, ${height / 2})`);

        this.chart = { node, width, height };
    }

    update_chart() {
        if (!this.chart) return;
        const peers_version = {} as Record<string, number>;

        this.peers.forEach((peer, i) => {
            if (peers_version[peer.version]) {
                peers_version[peer.version]++;
            } else {
                peers_version[peer.version] = 1;
            }
        });

        let data = Object.keys(peers_version).map((key) => {
            return { label: key, value: peers_version[key] };
        });

        data = data.sort((a, b) => b.value - a.value).slice(0, 5);

        const radius = Math.min(this.chart.width, this.chart.height) / 2;
        const donutInnerOffset = 35;

        const pie_generator = d3.pie<DataItem>()
            .value(d => d.value)
            .sort(null);

        const arc_data = pie_generator(data);

        const arc_generator = d3.arc<d3.PieArcDatum<DataItem>>()
            .innerRadius(radius - donutInnerOffset)
            .outerRadius(radius);

        const color = d3.scaleOrdinal<string>()
            .domain(data.map(d => d.label))
            .range(data.length > 1 ? d3.quantize(t => d3.interpolateRgb(`#02ffcf`, `#ff00aa`)(t * 0.5), data.length) : [`#02ffcf`]);

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

        this.chart.node
            .selectAll(`.count`)
            .remove();

        this.chart.node
            .selectAll(`.count`)
            .data(arc_data)
            .enter()
            .append('text')
            .attr(`class`, `count`)
            .attr('transform', d => `translate(${arc_generator.centroid(d)})`)
            .text(d => `${d.data.value}`)
            .style('font-size', '1rem')
            .style("text-anchor", "middle")
            .style('font-weight', `bold`)
            .style('fill', 'black');

        const legend_radius = 8;
        const legend_spacing = 15;

        this.chart.node
            .selectAll(`.legend`)
            .remove();

        const legend = this.chart.node
            .selectAll('.legend')
            .data(color.domain())
            .enter()
            .append('g')
            .attr('class', 'legend')
            .attr('transform', (d, i) => {
                var height = legend_radius + legend_spacing;
                var offset = height * color.domain().length / 2;
                var x = 100;
                var y = (i * height) - offset;
                return `translate(${x}, ${y})`;
            });

        legend
            .append('circle')
            .attr('r', legend_radius)
            .style('fill', color);

        legend
            .append('text')
            .attr('x', 5 + legend_radius)
            .attr('y', legend_radius / 2)
            .style(`fill`, color)
            .text((d) => `${d}`);
    }

    set(peers: Peer[]) {
        this.peers = peers;
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
import * as d3 from 'd3';
import { BoxChart } from '../../../../components/box_chart/box_chart';
import { PeerLocation } from '../../../../components/peers_map/peers_map';
import { localization } from '../../../../localization/localization';

export class PeersChartNodesByCountry {
    box_chart: BoxChart;
    chart?: {
        node: d3.Selection<SVGGElement, unknown, null, undefined>;
        width: number;
        height: number;
    };
    peers_locations: PeerLocation[];

    constructor() {
        this.peers_locations = [];
        this.box_chart = new BoxChart();
        this.box_chart.element_title.innerHTML = localization.get_text(`NODES BY COUNTRY`);
    }

    create_chart() {
        this.box_chart.element_content.replaceChildren();

        const margin = { top: 20, right: 0, bottom: 20, left: 0 };
        const rect = this.box_chart.element_content.getBoundingClientRect();
        const width = rect.width - margin.left - margin.right;
        const height = 150 - margin.top - margin.bottom;

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

        const peers_country = {} as Record<string, number>;
        this.peers_locations.forEach((peer_location) => {
            const { geo_location } = peer_location;
            let country = geo_location.country || `Unknown`;

            if (peers_country[country]) {
                peers_country[country]++;
            } else {
                peers_country[country] = 1;
            }
        });

        let data = Object.keys(peers_country).map((key) => {
            return { label: key, value: peers_country[key] };
        })

        data = data.sort((a, b) => b.value - a.value).slice(0, 10);

        const x_scale = d3
            .scaleBand<string>()
            .domain(data.map((d) => d.label))
            .range([0, this.chart.width])
            .padding(0.2);

        const y_scale = d3
            .scaleLinear()
            .domain([0, d3.max(data, (d) => d.value)!])
            .range([this.chart.height, 0]);

        const color = d3.scaleOrdinal<string>()
            .domain(data.map(d => d.label))
            .range(data.length > 1 ? d3.quantize(t => d3.interpolateRgb(`#02ffcf`, `#ff00aa`)(t * 0.5), data.length) : [`#02ffcf`]);

        const height = this.chart.height;

        const bars = this.chart.node
            .selectAll(`.bar`)
            .data(data)
            .join("rect")
            .attr("class", "bar")
            .attr("x", (d) => x_scale(d.label)!)
            .attr("y", (d) => y_scale(d.value))
            .attr("rx", 3)
            .attr("width", x_scale.bandwidth())
            .attr("height", (d) => height - y_scale(d.value))
            .attr("fill", d => color(d.label));

        this.chart.node
            .selectAll(`.legend`)
            .remove();

        this.chart.node
            .append("g")
            .attr("class", "legend")
            .attr("transform", `translate(0,${height})`)
            .call(d3.axisBottom(x_scale));

        this.chart.node
            .selectAll(`.node-count`)
            .remove();

        this.chart.node
            .selectAll(`.node-count`)
            .data(data)
            .enter()
            .append('text')
            .attr(`class`, `node-count`)
            .attr('transform', d => `translate(${x_scale(d.label)! + x_scale.bandwidth() / 2}, ${y_scale(d.value) - 5})`)
            .text(d => `${d.value}`)
            .style('font-size', '1rem')
            .style("text-anchor", "middle")
            .style('font-weight', `bold`)
            .style('fill', 'white');
    }

    set(peers_locations: PeerLocation[]) {
        this.peers_locations = peers_locations;
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
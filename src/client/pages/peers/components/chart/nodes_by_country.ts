import * as d3 from 'd3';
import { BoxChart } from '../../../../components/box_chart/box_chart';
import { PeerLocation } from '../../../../components/peers_map/peers_map';
import { localization } from '../../../../localization/localization';
import { chart_colors, create_chart_palette, hide_svg_chart_tooltip, show_svg_chart_tooltip } from '../../../../utils/chart_tooltip';

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
            .range(create_chart_palette(data.length));

        const height = this.chart.height;

        this.chart.node
            .selectAll(".chart-guide")
            .data(y_scale.ticks(3))
            .join("line")
            .attr("class", "chart-guide")
            .attr("x1", 0)
            .attr("x2", this.chart.width)
            .attr("y1", d => y_scale(d))
            .attr("y2", d => y_scale(d))
            .attr("stroke", "rgba(245, 247, 251, 0.08)")
            .attr("stroke-width", 1);

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
            .attr("fill", d => color(d.label))
            .attr("opacity", .92)
            .style("cursor", "crosshair");

        bars
            .on("pointermove", (event, d) => {
                if (!this.chart) return;

                const x = x_scale(d.label)! + x_scale.bandwidth() / 2;
                const y = y_scale(d.value);
                const accent = color(d.label);
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
                    [d.label, `${d.value.toLocaleString()} nodes`],
                    accent,
                );
            })
            .on("pointerleave", (event) => {
                d3.select(event.currentTarget as SVGRectElement)
                    .attr("stroke", null)
                    .attr("stroke-width", null)
                    .attr("opacity", .92);
                if (this.chart) hide_svg_chart_tooltip(this.chart.node);
            });

        this.chart.node
            .selectAll(`.legend`)
            .remove();

        this.chart.node
            .append("g")
            .attr("class", "legend")
            .attr("transform", `translate(0,${height})`)
            .call(d3.axisBottom(x_scale));

        this.chart.node
            .selectAll(`.legend path, .legend line`)
            .attr("stroke", "rgba(245, 247, 251, 0.16)");

        this.chart.node
            .selectAll(`.legend text`)
            .attr("fill", "rgba(245, 247, 251, 0.66)")
            .style("font-size", "1.3rem")
            .style("font-family", "var(--xe-font-body)");

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
            .style('font-size', '1.3rem')
            .style("text-anchor", "middle")
            .style('font-weight', `bold`)
            .style('fill', 'rgba(245, 247, 251, 0.82)');
    }

    set(peers_locations: PeerLocation[]) {
        this.peers_locations = peers_locations;
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

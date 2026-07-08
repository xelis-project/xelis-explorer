import * as d3 from 'd3';
import { Box } from "../../../../components/box/box";
import { chart_colors, create_chart_palette, hide_svg_chart_tooltip, show_svg_chart_tooltip } from '../../../../utils/chart_tooltip';

export class MempoolTxSizeTreeMap {
    box: Box;

    constructor() {
        this.box = new Box();
    }

    build_chart() {
        this.box.element.replaceChildren();
        const rect = this.box.element.getBoundingClientRect();

        const margin = { top: 0, right: 0, bottom: 0, left: 0 },
            width = rect.width - margin.left - margin.right,
            height = 300 - margin.top - margin.bottom;

        const svg = d3.select(this.box.element)
            .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform",
                "translate(" + margin.left + "," + margin.top + ")");

        interface TreeNode {
            name?: string;
            value?: number;
            children?: TreeNode[];
        }

        const data = {
            children: [
                { name: "A", value: 100 },
                { name: "B", value: 300 },
                { name: "C", value: 200 },
                { name: "D", value: 50 },
                { name: "E", value: 150 }
            ]
        };

        const root = d3.hierarchy<TreeNode>(data).sum((d) => { return d.value ?? 0 });

        const treemap = d3.treemap<TreeNode>()
            .size([width, height])
            .padding(15)

        treemap(root);

        const leaves = root.leaves() as d3.HierarchyRectangularNode<any>[];
        const palette = create_chart_palette(leaves.length);
        const color = d3.scaleOrdinal<string>()
            .domain(leaves.map((d) => d.data.name))
            .range(palette);

        const cells = svg
            .selectAll("rect")
            .data(leaves)
            .enter()
            .append("rect")
            .attr("rx", 8)
            .attr('x', (d) => { return d.x0; })
            .attr('y', (d) => { return d.y0; })
            .attr('width', (d) => { return d.x1 - d.x0; })
            .attr('height', (d) => { return d.y1 - d.y0; })
            .style("stroke", "rgba(2, 7, 8, 0.72)")
            .style("stroke-width", 2)
            .style("fill", (d) => color(d.data.name))
            .style("cursor", "crosshair");

        cells
            .on("pointermove", (event, d) => {
                const x = (d.x0 + d.x1) / 2;
                const y = (d.y0 + d.y1) / 2;
                const accent = color(d.data.name);

                d3.select(event.currentTarget as SVGRectElement)
                    .style("stroke", chart_colors.gold)
                    .style("stroke-width", 3);

                show_svg_chart_tooltip(
                    svg,
                    width,
                    height,
                    x,
                    y,
                    [d.data.name, `${d.value?.toLocaleString() ?? 0} bytes`],
                    accent,
                );
            })
            .on("pointerleave", (event) => {
                d3.select(event.currentTarget as SVGRectElement)
                    .style("stroke", "rgba(2, 7, 8, 0.72)")
                    .style("stroke-width", 2);
                hide_svg_chart_tooltip(svg);
            });

        svg
            .selectAll("text")
            .data(leaves)
            .enter()
            .append("text")
            .attr("x", (d) => { return d.x0 + 5 })
            .attr("y", (d) => { return d.y0 + 20 })
            .text(function (d) { return d.data.name })
            .attr("font-size", "1.3rem")
            .attr("font-family", "var(--xe-font-body)")
            .attr("font-weight", "700")
            .attr("fill", "#041414")
            .style("pointer-events", "none");
    }
}

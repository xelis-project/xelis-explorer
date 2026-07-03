import * as d3 from 'd3';
import { BoxChart } from '../../../../components/box_chart/box_chart';
import { Block, BlockType } from '@xelis/sdk/daemon/types';
import { localization } from '../../../../localization/localization';

export class MempoolChartBlocksTxs {
    box_chart: BoxChart;
    chart?: {
        node: d3.Selection<SVGGElement, unknown, null, undefined>;
        width: number;
        height: number;
    }
    blocks: Block[];

    constructor() {
        this.blocks = [];
        this.box_chart = new BoxChart();
        this.box_chart.element_title.innerHTML = localization.get_text(`PAST BLOCKS`);
    }

    set_value(tx_count: number, tps: number) {
        this.box_chart.element_value.innerHTML = `${tx_count} TXS | ${tps.toLocaleString(undefined, { maximumFractionDigits: 2 })} TPS`;
    }

    create_chart() {
        this.box_chart.element_content.replaceChildren();

        const margin = { top: 20, right: 0, bottom: 0, left: 0 };
        const rect = this.box_chart.element_content.getBoundingClientRect();
        const width = rect.width - margin.left - margin.right;
        const height = 125 - margin.top - margin.bottom;

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

        const filtered_blocks = this.blocks
            .filter((b) => {
                return b.block_type === BlockType.Normal || b.block_type === BlockType.Sync;
            });

        let data = filtered_blocks
            .map((b, i) => ({ x: filtered_blocks.length - i, y: b.txs_hashes.length }))
            .sort((a, b) => b.x - a.x);

        const x_scale = d3
            .scaleBand<number>()
            .domain(data.map((d) => d.x))
            .range([0, this.chart.width])
            .padding(0.2);

        const y_scale = d3
            .scaleLinear()
            .domain([-1, d3.max(data, (d) => d.y)!])
            .range([this.chart.height, 0]);

        const min_data = data.reduce((a, b) => (a.y < b.y ? a : b), data[0] ? data[0] : { x: 0, y: 0 });
        const max_data = data.reduce((a, b) => (a.y > b.y ? a : b), data[0] ? data[0] : { x: 0, y: 0 });
        const color = d3.scaleLinear<string>()
            .domain([min_data.y, max_data.y])
            .range(d3.quantize(t => d3.interpolateRgb(`#02ffcf`, `#ff00aa`)(t * 0.7), 2));

        const height = this.chart.height;
        this.chart.node
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

        this.chart.node
            .selectAll(`.tx-count`)
            .data(data)
            .join(
                enter => enter.append('text')
                    .attr(`class`, `tx-count`)
                    .attr('transform', d => `translate(${x_scale(d.x)! + x_scale.bandwidth() / 2}, ${y_scale(d.y) - 5})`)
                    .text(d => {
                        return d.y.toLocaleString(undefined, { notation: `compact`, compactDisplay: `short` });
                    })
                    .style('font-size', '.8rem')
                    .style("text-anchor", "middle")
                    .style('font-weight', `bold`)
                    .style('fill', 'white'),
                update => update
                    .attr('transform', d => `translate(${x_scale(d.x)! + x_scale.bandwidth() / 2}, ${y_scale(d.y) - 5})`)
                    .text(d => {
                        return d.y.toLocaleString(undefined, { notation: `compact`, compactDisplay: `short` });
                    })
            );
    }

    set(blocks: Block[]) {
        this.blocks = blocks;

        let min_timestamp = 0;
        let max_timestamp = 0;
        let total_txs = 0;
        blocks.forEach((block) => {
            total_txs += block.txs_hashes.length;
            if (min_timestamp === 0 || block.timestamp < min_timestamp) min_timestamp = block.timestamp;
            if (block.timestamp > max_timestamp) max_timestamp = block.timestamp;
        });

        const elapsed = max_timestamp - min_timestamp;
        const tps = total_txs * 1000 / elapsed;

        this.set_value(total_txs, tps);
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

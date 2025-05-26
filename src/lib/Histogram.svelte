<script>
    import { onMount } from "svelte";
    import data from "../data/revenue_per_space_per_day_list.json";
    let svgEl;
    let tooltipEl;
    let containerEl;

    const binSize = 2;
    const max = Math.max(...data);
    const numBins = Math.ceil(max / binSize);

    let bins = Array(numBins).fill(0);
    data.forEach((d) => {
        const binIndex = Math.floor(d / binSize);
        bins[binIndex]++;
    });

    const maxCount = Math.max(...bins);
    const chartHeight = 250;
    const yTickInterval = 10;

    let chartWidth = 450;
    function updateWidth() {
        if (containerEl) {
            chartWidth = containerEl.offsetWidth - 40;
        }
    }
    onMount(() => {
        updateWidth();
        window.addEventListener("resize", updateWidth);
        return () => window.removeEventListener("resize", updateWidth);
    });

    // Make barWidth and medianX reactive
    $: barWidth = chartWidth / bins.length;
    const sorted = [...data].sort((a, b) => a - b);
    const median =
        sorted.length % 2 === 0
            ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
            : sorted[Math.floor(sorted.length / 2)];
    $: medianX = 35 + (median / max) * chartWidth;

    // Tooltip state
    let tooltip = {
        show: false,
        x: 0,
        y: 0,
        count: 0,
        range: "",
    };

    function showTooltip(event, count, i) {
        let width = tooltipEl ? tooltipEl.offsetWidth : 120;
        let height = tooltipEl ? tooltipEl.offsetHeight : 40;
        tooltip = {
            show: true,
            x: event.clientX - width / 2,
            y: event.clientY - height - 12,
            count,
            range: `$${i * binSize} - $${(i + 1) * binSize}`,
        };
    }

    function hideTooltip() {
        tooltip.show = false;
    }
</script>

<div class="histogram-container" bind:this={containerEl}>
    <svg bind:this={svgEl} width={chartWidth + 40} height={chartHeight + 60}>
        <!-- Y-axis ticks and labels-->
        {#each Array(Math.floor(maxCount / yTickInterval) + 1) as _, idx}
            {#if idx * yTickInterval <= maxCount}
                <text
                    x="25"
                    y={chartHeight -
                        ((idx * yTickInterval) / maxCount) * chartHeight +
                        5}
                    font-size="10"
                    text-anchor="end"
                    fill="#333"
                >
                    {idx * yTickInterval}
                </text>
                <line
                    x1="30"
                    x2={chartWidth}
                    y1={chartHeight -
                        ((idx * yTickInterval) / maxCount) * chartHeight}
                    y2={chartHeight -
                        ((idx * yTickInterval) / maxCount) * chartHeight}
                    stroke="#eee"
                    stroke-width="1"
                />
            {/if}
        {/each}

        <!-- Median vertical dashed line -->
        <line
            x1={medianX}
            x2={medianX}
            y1="0"
            y2={chartHeight}
            stroke="grey"
            stroke-width="1"
            stroke-dasharray="3,2"
        />
        <text
            x={medianX + 5}
            y="10"
            font-size="11"
            text-anchor="start"
            fill="grey"
        >
            Median: ${median.toFixed(2)}
        </text>

        <!-- Histogram bars -->
        {#each bins as count, i}
            <rect
                x={35 + i * barWidth}
                y={chartHeight - (count / maxCount) * chartHeight}
                width={barWidth - 2}
                height={(count / maxCount) * chartHeight}
                fill="#00A189"
                opacity="0.8"
                on:mouseenter={(e) => showTooltip(e, count, i)}
                on:mousemove={(e) => showTooltip(e, count, i)}
                on:mouseleave={hideTooltip}
                style="cursor:pointer"
            />
        {/each}

        <!-- X-axis tick labels every 5 bins -->
        {#each Array(numBins) as _, i}
            {#if i % 5 === 0}
                <text
                    x={35 + i * barWidth}
                    y={chartHeight + 15}
                    font-size="10"
                    text-anchor="middle"
                    fill="#333"
                >
                    {i * binSize}
                </text>
            {/if}
        {/each}

        <!-- X-axis label -->
        <text
            x={(chartWidth + 40) / 2}
            y={chartHeight + 40}
            font-size="14"
            text-anchor="middle"
            fill="#333"
            font-weight="bold"
        >
            Revenue Per Space Per Day ($)
        </text>
    </svg>
</div>

{#if tooltip.show}
    <div
        class="tooltip"
        bind:this={tooltipEl}
        style="top: {tooltip.y}px; left: {tooltip.x}px;"
    >
        <div><strong>Count:</strong> {tooltip.count}</div>
        <div><strong>Revenue:</strong> {tooltip.range}</div>
    </div>
{/if}

<style>
    .histogram-container {
        width: 100%;
        max-width: 600px;
        justify-content: center;
        align-items: center;
        display: flex;
        margin: 0 auto;
    }
    svg {
        width: 100%;
        height: auto;
        display: block;
    }
    .tooltip {
        position: fixed;
        pointer-events: none;
        background: #fff;
        border: 1px solid #ccc;
        padding: 6px 12px;
        border-radius: 4px;
        font-size: 13px;
        color: #222;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
        z-index: 1000;
        white-space: nowrap;
    }
</style>

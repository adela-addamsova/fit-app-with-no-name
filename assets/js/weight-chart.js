/**
 * Weight line chart ([data-weight-chart] canvas) with range buttons (data-chart-range).
 * The entries come from the canvas's data-points attribute as [{x: 'Y-m-d', y: '82.40'}, ...].
 */

import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

/**
 * @typedef {{x: number, y: number}} ChartPoint Timestamp in milliseconds and weight in kg
 */

const DAY_MS = 24 * 60 * 60 * 1000;
const systemDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');
const shortDate = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short' });
const fullDate = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

/** @type {Chart|null} */
let chart = null;

/** @type {ChartPoint[]} */
let allPoints = [];

/**
 * @param {string} name CSS variable
 * @returns {string} Its current value
 */
const cssVar = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();

/**
 * @param {string} hex 6-digit hex color
 * @param {number} opacity From 0 to 1
 * @returns {string} 8-digit hex color
 */
const hexWithOpacity = (hex, opacity) => hex + Math.round(opacity * 255).toString(16).padStart(2, '0');

/**
 * @param {string} range
 * @returns {ChartPoint[]}
 */
const pointsInRange = (range) => {
    if (range === 'all') {
        return allPoints;
    }

    const from = Date.now() - Number(range) * DAY_MS;

    return allPoints.filter((point) => point.x >= from);
};

/**
 * Places up to 5 ticks on real entry dates, evenly spread, which avoids repeated day labels.
 *
 * @param {{chart: {data: {datasets: {data: ChartPoint[]}[]}}, ticks: {value: number}[]}} scale Chart.js x-axis
 */
const entryDateTicks = (scale) => {
    const dates = scale.chart.data.datasets[0].data.map((point) => point.x);
    const count = Math.min(5, dates.length);
    const ticks = [];

    for (let i = 0; i < count; i++) {
        const index = Math.round((i * (dates.length - 1)) / Math.max(count - 1, 1));
        ticks.push({ value: dates[index] });
    }

    scale.ticks = ticks;
};

/**
 * @param {{dataIndex: number, dataset: {data: ChartPoint[]}}} context
 * @returns {boolean}
 */
const isLastPoint = (context) => context.dataIndex === context.dataset.data.length - 1;

/**
 * Chart.js plugin that draws a vertical line at the hovered point.
 */
const crosshairPlugin = {
    id: 'crosshair',
    afterDatasetsDraw(chartInstance) {
        const [active] = chartInstance.getActiveElements();
        if (!active) {
            return;
        }

        const { ctx, chartArea } = chartInstance;
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(active.element.x, chartArea.top);
        ctx.lineTo(active.element.x, chartArea.bottom);
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.strokeStyle = hexWithOpacity(cssVar('--muted'), 0.6);
        ctx.stroke();
        ctx.restore();
    },
};

/**
 * Removes the current chart.
 */
const destroyChart = () => {
    if (chart) {
        chart.destroy();
        chart = null;
    }
};

/**
 * Draws the chart.
 */
const renderWeightChart = () => {
    destroyChart();

    const canvas = document.querySelector('[data-weight-chart]');
    if (!canvas) {
        return;
    }

    allPoints = JSON.parse(canvas.dataset.points).map((point) => ({
        x: new Date(point.x).getTime(),
        y: Number(point.y),
    }));

    const activeRange = document.querySelector('[data-chart-range].active');
    const accent = cssVar('--accent');
    const muted = cssVar('--muted');

    Chart.defaults.font.family = getComputedStyle(document.body).fontFamily;

    chart = new Chart(canvas, {
        type: 'line',
        plugins: [crosshairPlugin],
        data: {
            datasets: [{
                data: pointsInRange(activeRange ? activeRange.dataset.chartRange : 'all'),
                borderColor: accent,
                borderWidth: 2.5,
                tension: 0.4,
                fill: 'start',
                backgroundColor: (context) => {
                    const { ctx, chartArea } = context.chart;

                    if (!chartArea) {
                        return null;
                    }

                    const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
                    gradient.addColorStop(0, hexWithOpacity(accent, 0.35));
                    gradient.addColorStop(1, hexWithOpacity(accent, 0));

                    return gradient;
                },
                pointRadius: (context) => (isLastPoint(context) ? 5 : 0),
                pointBackgroundColor: accent,
                pointBorderColor: cssVar('--surface'),
                pointBorderWidth: 3,
                pointHoverRadius: 6,
                pointHoverBackgroundColor: accent,
                pointHoverBorderColor: cssVar('--surface'),
                pointHoverBorderWidth: 3,
            }],
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { mode: 'nearest', axis: 'x', intersect: false },
            plugins: {
                legend: { display: false },
                tooltip: {
                    displayColors: false,
                    backgroundColor: cssVar('--surface-raised'),
                    titleColor: muted,
                    bodyColor: cssVar('--text'),
                    borderColor: cssVar('--separator'),
                    borderWidth: 1,
                    padding: 12,
                    cornerRadius: 12,
                    titleFont: { weight: '500' },
                    bodyFont: { size: 15, weight: '600' },
                    callbacks: {
                        title: (items) => fullDate.format(items[0].parsed.x),
                        label: (item) => `${item.parsed.y.toFixed(1)} kg`,
                    },
                },
            },
            scales: {
                x: {
                    type: 'linear',
                    bounds: 'data',
                    afterBuildTicks: entryDateTicks,
                    grid: { display: false },
                    border: { display: false },
                    ticks: {
                        color: muted,
                        maxRotation: 0,
                        callback: (value) => shortDate.format(value),
                    },
                },
                y: {
                    grace: '10%',
                    position: 'right',
                    grid: { color: cssVar('--separator'), drawTicks: false },
                    border: { display: false, dash: [4, 4] },
                    ticks: {
                        color: muted,
                        padding: 8,
                        maxTicksLimit: 4,
                        callback: (value) => Number(value).toFixed(1),
                    },
                },
            },
        },
    });
};

document.addEventListener('click', (event) => {
    const button = event.target.closest('[data-chart-range]');
    if (!button || !chart) {
        return;
    }

    document.querySelectorAll('[data-chart-range]').forEach((item) => {
        item.classList.toggle('active', item === button);
    });
    chart.data.datasets[0].data = pointsInRange(button.dataset.chartRange);
    chart.update();
});

document.addEventListener('turbo:load', renderWeightChart);
document.addEventListener('turbo:render', renderWeightChart);
document.addEventListener('turbo:before-cache', destroyChart);

// Redraw when theme changes
systemDarkScheme.addEventListener('change', renderWeightChart);
document.addEventListener('themechange', renderWeightChart);

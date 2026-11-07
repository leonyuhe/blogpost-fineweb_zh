import { getColor, COLORS } from "./colors.mjs"
import Plotly from "plotly.js-basic-dist-min"
import _ from "lodash"

const DATA_FOLDER = "assets/data/plots"


const LINE_SETTINGS = {
    width: 2.5,
    type: "scatter",
    mode: "lines",
}
const BAR_SETTINGS = {
    width: 0.5,
    type: "bar",
    opacity: 0.9,
    marker: {
        line: {
            width: 1.0
        }
    }
}

const METRIC_ID_TO_PRIORITY = {
    "agg_score": 0,
    "hellaswag/acc_norm": 1,
    "arc/acc_norm": 2,
    "mmlu/acc_norm": 3,
    "openbookqa/acc_norm": 4,
    "commonsense_qa/acc_norm": 5,
    "piqa/acc_norm": 6,
    "siqa/acc_norm": 7,
    "winogrande/acc_norm": 8,


    // Stats
    "lines_ended_with_punct": 0,
    "lines_chars": 1,
    "short_lines": 2,
}

const TASK_ID_TO_NAME = {
    // Ablations
    agg_score: "Aggregate Score",
    "commonsense_qa/acc_norm": "Commonsense QA",
    "hellaswag/acc_norm": "HellaSwag",
    "openbookqa/acc_norm": "OpenBook QA",
    "piqa/acc_norm": "PIQA",
    "siqa/acc_norm": "Social IQA",
    "winogrande/acc_norm": "WinoGrande",
    "arc/acc_norm": "ARC",
    "mmlu/acc_norm": "MMLU",

    // Stats
    "lines_ended_with_punct": "Lines Ended With Punctuation",
    "lines_chars": "Lines Chars",
    "short_lines": "Short Lines",
};

const DATASET_ID_TO_NAME = {
    pii_removed: "Fineweb",
    allenai_c4_en: "C4",
    "tiiuae_falcon-refinedweb_data": "RefinedWeb",
    "red-pajama-v2_jsonl-deduplicated-extract": "RedPajamaV2",
    "dolma-sample": "Dolma1.6",
    dedup_minhash_independent_output: "Independent Dedup MinHash",
    "dedup_minhash_CC-MAIN-2013-48_output": "Full MinHash CC-MAIN-2013-48",
    "dedup_minhash_independent_output_CC-MAIN-2013-48": "Independent MinHash CC-MAIN-2013-48",
    "ind_minhash-CC-MAIN-2019-18": "Independent MinHash CC-MAIN-2019-18",
    "wet-extraction-2019-18": "WET Extraction 2019-18",
    "dedup_minhash_CC-MAIN-2013-48_output": "Full MinHash CC-MAIN-2013-48",
    "dedup_minhash_independent_output_CC-MAIN-2013-48": "Independent MinHash CC-MAIN-2013-48",

};

const DEFAULT_SETTINGS = {
    slider: {
        max: 30,
        min: 0,
        default: 0,
    },
    defaultMetric: "agg_score",
    type: "line"
};

const DEFAULT_LAYOUT = {
    font: {
        family: "apple-system, Arial, sans-serif",
    },
    title: {
        text: "Plot Title",
        font: {
            size: 19,
            family: "apple-system, Arial, sans-serif",
        },
    },
    xaxis: {
        title: {
            text: "Training tokens (billions)",
            font: {
                size: 15,
                family: "apple-system, Arial, sans-serif",
            },
        },
        tickfont: {
            size: 14,
            family: "apple-system, Arial, sans-serif",
        },
        showgrid: false,
        mirror: true,
        ticks: "outside",
        showline: true,
    },
    yaxis: {
        title: {
            text: "Agg Score",
            font: {
                size: 15,
                family: "apple-system, Arial, sans-serif",
            },
            standoff: 10,
        },
        showgrid: false,
        mirror: true,
        ticks: "outside",
        showline: true,
        tickfont: {
            size: 14,
            family: "apple-system, Arial, sans-serif",
        },
    },
    yaxis2: {
        title: {
            text: "Words Contamination",
            font: {
                size: 15,
                family: "apple-system, Arial, sans-serif",
            },
            standoff: 10,
        },
        tickfont: {
            size: 14,
            family: "apple-system, Arial, sans-serif",
        },
        showgrid: false,
        ticks: "outside",
    },
    legend: {
        orientation: "v",
        xanchor: "right",
        yanchor: "bottom",
        x: 1,
        y: 0,
        font: {
            size: 14,
            family: "apple-system, Arial, sans-serif",
        },
        bgcolor: "rgba(0,0,0,0)",
    },
    margin: {
        t: 30,
        b: 50,
    },
    height: 400,
};

const getAutoRange = (traces) => {
    let minX = Math.min(...traces.flatMap((trace) => trace.x));
    let maxX = Math.max(...traces.flatMap((trace) => trace.x));
    return [minX * 0.95, maxX * 1.05];
};

const getColorForTrace = (traceName, colorsMapping, index) => {
    // First check if the color already exists in colorsMaping and if so return it
    const reusedColor = colorsMapping.get(traceName)
    if (reusedColor) {
        return reusedColor
    }

    let color = getColor(index)
    while (colorsMapping.has(color) && index < COLORS.length) {
        index += 1
        color = getColor(index)
    }
    colorsMapping.set(traceName, color)
    return color
}


const createAblationPlottingElements = (
    plotElement,
    indexMapping,
    settings
) => {
    const plot = document.createElement("figure");
    const controls = document.createElement("div");
    plot.classList.add("plotly");
    controls.classList.add("plotly_controls");
    plotElement.appendChild(plot);
    plotElement.appendChild(controls);

    const metricOptions = Object.keys(indexMapping).filter(
        (metric) => metric in TASK_ID_TO_NAME
    );
    // Dropdown
    let dropdown = undefined
    if (metricOptions.length > 1) {
        const dropdownLabel = document.createElement("label");
        dropdownLabel.textContent = "Metric:";
        dropdown = document.createElement("select");
        dropdown.innerHTML = metricOptions
            .sort((a, b) => (METRIC_ID_TO_PRIORITY[a] ?? 0) - (METRIC_ID_TO_PRIORITY[b] ?? 0))
            .map(
                (option) =>
                    `<option value="${option}">${TASK_ID_TO_NAME[option]}</option>`
            )
            .join("");
        dropdown.value = settings.defaultMetric;

        const dropdownContainer = document.createElement("div");
        dropdownContainer.classList.add("plotly_input_container");
        dropdownContainer.appendChild(dropdownLabel);
        dropdownContainer.appendChild(dropdown);
        controls.appendChild(dropdownContainer);
    }

    let slider = undefined;
    if (settings.slider !== null) {
        const sliderLabel = document.createElement("label");
        sliderLabel.textContent = "Rolling window:";
        slider = document.createElement("input");
        slider.type = "range";
        slider.min = settings.slider.min;
        slider.max = settings.slider.max;
        slider.value = settings.slider.default;

        // current value
        const sliderValue = document.createElement("span");
        sliderValue.textContent = slider.value;
        slider.addEventListener("input", () => {
            sliderValue.textContent = slider.value;
        });
        const sliderInputContainer = document.createElement("div");
        sliderInputContainer.classList.add("plotly_slider");
        sliderInputContainer.appendChild(slider);
        sliderInputContainer.appendChild(sliderValue);

        const sliderContainer = document.createElement("div");
        sliderContainer.classList.add("plotly_input_container");

        sliderContainer.appendChild(sliderLabel);
        sliderContainer.appendChild(sliderInputContainer);
        controls.appendChild(sliderContainer);
    }
    let caption = undefined
    if (settings.caption) {
        caption = document.createElement("figcaption");
        caption.classList.add("plotly_caption");
        caption.textContent = settings.caption;
        plotElement.appendChild(caption);
    }

    return { dropdown, slider, plot, caption };
};

const rollingWindow = function (data, windowSize) {
    if (windowSize === 0) {
        return data;
    }
    const rollingData = [];

    // Start at halfWindowSize to ensure we can get a full window
    for (let i = windowSize; i < data.length; i++) {
        const windowStart = i - windowSize;
        const windowEnd = i;
        const windowData = data.slice(windowStart, windowEnd);

        const windowAverage =
            windowData.reduce((acc, value) => acc + value, 0) /
            windowData.length;
        rollingData.push(windowAverage);
    }

    return rollingData;
};

const createTraces = (data, settings, colorsMapping, sliderValue) => {
    if (!data) {
        return []
    }
    const res = Array.from(Object.entries(data)).map(([key, traceData], index) => {
        const y = rollingWindow(traceData.y, sliderValue);
        const x = traceData.x.slice(0, y.length);
        const plotSettings = settings?.type === "bar" ? BAR_SETTINGS : LINE_SETTINGS;
        const traceColor = traceData.color ?? getColorForTrace(key, colorsMapping, index)
        const trace = _.merge({}, {
            x: x,
            y: y,
            name: traceData.label ?? DATASET_ID_TO_NAME[key] ?? key,
            marker: {
                color: traceColor,
            },
            line: {
                color: traceColor,
            },
            yaxis: traceData.yaxis ?? "y1"
        }, plotSettings);
        return trace
    });
    return res
}

export const init_ablation_plot = function () {
    const plotElements = document.querySelectorAll('[id^="plot-"]');
    plotElements.forEach(async (plotElement) => {
        const plotName = plotElement.id.replace("plot-", "");
        const indexData = await fetch(`${DATA_FOLDER}/${plotName}/index.json`).then(
            (response) => response.json()
        );
        const settings = _.merge({}, DEFAULT_SETTINGS, indexData.settings);
        const indexMapping = indexData.files;
        const { dropdown, slider, plot } = createAblationPlottingElements(
            plotElement,
            indexMapping,
            settings
        );
        plot.id = `graph-${plotName}`;
        if (dropdown !== undefined) {
            dropdown.addEventListener("change", () => updatePlot(dropdown, slider));
        }
        let timeoutId;
        // Debounce the slider
        if (slider !== undefined) {
            slider.addEventListener("input", () => {
                clearTimeout(timeoutId);
                timeoutId = setTimeout(() => {
                    updatePlot(dropdown, slider);
                }, 500);
            });
        }
        // Shared plot
        Plotly.newPlot(plot, []);

        // This is to ensure that the colors are consistent acrros different metrics
        const colorsMapping = new Map()

        async function updatePlot(dropdown, slider) {
            const metricName = dropdown?.value ?? settings.defaultMetric;
            const sliderValue = parseInt(slider?.value ?? 0);
            const metricData = await fetch(
                `${DATA_FOLDER}/${plotName}/${indexMapping[metricName]["file"]}`
            ).then((response) => response.json());
            const traces = (metricData?.traces ?? []).concat(createTraces(metricData.data, settings, colorsMapping, sliderValue))
            const width = plot.parentElement.offsetWidth;
            const layout = _.merge(
                {},
                DEFAULT_LAYOUT,
                {
                    width: width,
                    yaxis: { title: { text: TASK_ID_TO_NAME[metricName] } },
                    xaxis: {
                        range: null
                    },
                },
                metricData.layout
            );
            Plotly.react(plot, traces, layout);

            window.addEventListener("resize", () => {
                // If the window size is smaller than 768, we don't care as it's not shown
                if (window.innerWidth < 768) {
                    return;
                }
                Plotly.relayout(plot, {
                    width: plot.parentElement.offsetWidth,
                });
            });
        }

        // Initial plot
        updatePlot(dropdown, slider);
    });
};
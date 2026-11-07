import { getColor } from "./colors.mjs"
import { parse } from "papaparse"
import _ from "lodash"
import Plotly from "plotly.js-basic-dist-min"

const DATA_FOLDER = "assets/data/clustering";

const BASE_SIZE = 5.5;
// x0, x1, y0, y1
const DEFAULT_XAXIS = {
    showticklabels: false,
    showgrid: false,
    zeroline: false,
    title: {
        text: "<a href='https://github.com/huggingface/text-clustering' target='_blank' style='color: inherit;'>The 🍷 FineWeb dataset, clustered and annotated with educational score labels</a>",
        font: {
            size: 16,
            style: "italic",
        },
    },
    range: [5, 15.6461]
}
const DEFAULT_YAXIS = {
    showticklabels: false,
    showgrid: false,
    zeroline: false,
    range: [0, 8.5],
}

const getLabelHoverFormat = (row, labelIDToName) => {
    return `<b>Text</b>: ${row.text}<br><b>Label</b>: ${labelIDToName[row.label] ?? "Unknown"}<br><b>Edu label</b>: ${row.eduScore}`;
};


// Number of annotations to display
const K = 15;

function createLabelOrderMapping(labels) {
    const labelCounts = labels.reduce((acc, label) => {
        acc[label] = (acc[label] || 0) + 1;
        return acc;
    }, {});

    const sortedLabels = Object.entries(labelCounts)
        .sort((a, b) => b[1] - a[1])
        .map((entry) => entry[0]);

    const labelOrder = {};
    sortedLabels.forEach((label, index) => {
        labelOrder[label] = index;
    });
    return labelOrder;
}

const parseAnnotations = async (file) => {
    return (await readCSV(file))
        .filter((cluster_summary) => {
            return parseInt(cluster_summary.cluster_id) != -1;
        })
        .map((cluster_summary) => {
            return {
                x: parseFloat(cluster_summary.cluster_position_x),
                y: parseFloat(cluster_summary.cluster_position_y),
                label: parseInt(cluster_summary.cluster_id),
                text: cluster_summary.cluster_summaries,
            };
        });
};

const addStylingToAnnotations = (annotations) => {
    return annotations.map((annotation) => {
        return {
            showarrow: false,
            font: {
                size: 14,
                color: "black",
                weight: "bold",
            },
            bgcolor: getColor(annotation.label, 0.6),
            borderpad: 2, // Add padding around the text
            ...annotation,
        };
    });
};

const getRelevantAnnotations = (annotations, x0, x1, y0, y1, k = K) => {
    const relevant_annotations = annotations.filter((annotation) => {
        return (
            annotation.x >= x0 &&
            annotation.x <= x1 &&
            annotation.y >= y0 &&
            annotation.y <= y1
        );
    });
    return relevant_annotations.sort((a, b) => a.ord - b.ord).slice(0, k);
};

const getMinMaxTracesArea = (traces) => {
    const x0 = Math.min(...traces.map((trace) => trace.x));
    const x1 = Math.max(...traces.map((trace) => trace.x));
    const y0 = Math.min(...traces.map((trace) => trace.y));
    const y1 = Math.max(...traces.map((trace) => trace.y));
    return { x0, x1, y0, y1 };
};

const readData = async () => {
    return (await readCSV(`${DATA_FOLDER}/data.csv`)).map((row) => ({
        x: parseFloat(row.X),
        y: parseFloat(row.Y),
        eduScore: parseFloat(row.edu_labels),
        label: parseInt(row.cluster_labels),
        text: row.content_display,
    }));
};

// The cluster is pretty big, so takes time to donwload
// In the meantime we put there a placeholder image
const destroyPlaceholderImage = (parent) => {
    const img = parent.querySelector("img");
    console.log(img);
    img.remove();
};

export async function plotClusters() {
    const parent = document.getElementById("clusters-plot");
    // We do a little trolling on users and pretend that we already donwloaded the data by simply showing uniteractive image :)
    const data = await readData();
    const labelOrder = createLabelOrderMapping(data.map((row) => row.label));
    const annotations = addStylingToAnnotations(
        await parseAnnotations(`${DATA_FOLDER}/info.csv`)
    ).map((annot) => {
        return {
            ...annot,
            ord: labelOrder[annot.label],
        };
    });

    const labelIDToName = annotations.reduce((acc, annotation) => {
        acc[annotation.label] = annotation.text;
        return acc;
    }, {});

    const traces = [
        {
            type: "scatter",
            mode: "markers",
            x: data.map((row) => row.x),
            y: data.map((row) => row.y),
            marker: {
                color: data.map((row) => getColor(row.label, 0.4)),
                size: BASE_SIZE,
            },
            hoverinfo: "text",
            hovertext: data.map((row) => getLabelHoverFormat(row, labelIDToName)),
            hoverlabel: {
                bgcolor: "white",
            },
        },
    ];

    const { x0, x1, y0, y1 } = getMinMaxTracesArea(data);
    const layout = {
        height: 550,
        width: parent.clientWidth,
        xaxis: DEFAULT_XAXIS,
        yaxis: DEFAULT_YAXIS,
        annotations: getRelevantAnnotations(annotations, DEFAULT_XAXIS.range[0], DEFAULT_XAXIS.range[1], DEFAULT_YAXIS.range[0], DEFAULT_YAXIS.range[1]),
        font: {
            family: "apple-system, Arial, sans-serif",
        },
        margin: {
            t: 0,
            b: 50,
            l: 0,
            r: 0,
        },
    };

    destroyPlaceholderImage(parent);
    Plotly.newPlot(parent, traces, layout);

    parent.on("plotly_relayout", (eventdata) => {
        // First option zoomed in
        console.log(eventdata)
        if (eventdata["xaxis.range[0]"]) {
            const [newx0, newx1] = [
                eventdata["xaxis.range[0]"],
                eventdata["xaxis.range[1]"],
            ];
            const [newy0, newy1] = [
                eventdata["yaxis.range[0]"],
                eventdata["yaxis.range[1]"],
            ];
            // Idk maybe we can even recompute the ordering, but I think it's fine to use the global one
            const relevant_annotations = getRelevantAnnotations(
                annotations,
                newx0,
                newx1,
                newy0,
                newy1
            );
            console.log(x0, x1, y0, y1);
            // 1.8 otherwise it's too big
            const zoomLevel =
                Math.min(
                    (x1 - x0) / (newx1 - newx0),
                    (y1 - y0) / (newy1 - newy0)
                ) / 1.2;
            Plotly.update(
                parent,
                { "marker.size": BASE_SIZE * zoomLevel },
                { annotations: relevant_annotations },
            );
        }
        // Zoom reset to full outzoomed or to base range
        else if (eventdata["xaxis.autorange"] || eventdata["xaxis.range"]) {
            const relevant_annotations = getRelevantAnnotations(
                annotations,
                x0,
                x1,
                y0,
                y1
            );
            // We wan to always fully zoomed out
            const xaxis = _.merge({}, DEFAULT_XAXIS, { range: [x0, x1] });
            const yaxis = _.merge({}, DEFAULT_YAXIS, { range: [y0, y1] });
            Plotly.update(
                parent,
                { "marker.size": BASE_SIZE },
                { annotations: relevant_annotations, xaxis, yaxis }
            );
        }
    });

    window.addEventListener("resize", () => {
        // If the window size is smaller than 768, we don't care as it's not shown
        if (window.innerWidth < 768) {
            return;
        }
        Plotly.relayout(parent, {
            width: parent.offsetWidth,
        });
    });
}

const readCSV = async (file) => {
    const data = await fetch(file);
    const text = await data.text();
    const csv = parse(text, { header: true, skipEmptyLines: true });
    return csv.data;
};
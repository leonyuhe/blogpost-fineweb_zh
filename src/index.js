import { plotClusters } from './clusters'
import { init_ablation_plot } from './plotting'


document.addEventListener("DOMContentLoaded", () => {
    console.log("DOMContentLoaded");
    plotClusters();
    init_ablation_plot();
}, { once: true });
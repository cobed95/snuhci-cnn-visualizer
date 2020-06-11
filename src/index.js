import { bootstrap, getRawData } from './nnbootstrap';
import Visualizer from './Visualizer';
import ModelController from './ModelController';

const hideLoading = () => {
  document.getElementById("loading").style.display = "none";
}

const showCnnVis = () => {
  const cnnVisualizer = document.getElementById("cnn-visualizer");
  cnnVisualizer.style.display = "flex";
  cnnVisualizer.style.flexDirection = "column";
  cnnVisualizer.style.flex = 10;
  // document.getElementById("cnn-visualizer").style.display = "flex";
  // document.getElementById("cnn-visulizer")
}

function init() {
  console.log('Bootstrapping');

  bootstrap()
    .then(model => {
      console.log('Bootstrapping finished.');
      const data = getRawData();
      const visualizer = new Visualizer(model, data);
      const modelController = new ModelController(model, data, visualizer);
      hideLoading();
      showCnnVis();
    });
}

init();

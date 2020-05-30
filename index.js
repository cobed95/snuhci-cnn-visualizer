import * as d3 from 'd3';
import { bootstrap, getTestData, getRawData } from './nnbootstrap';
import { IMAGE_H } from './data'
import { MDCSlider } from '@material/slider';
import { runImage } from './activation';
import Visualizer from './Visualizer';
import ModelController from './ModelController';

function init() {
  console.log('Bootstrapping');
  const container = document.getElementsByClassName("controller-container");

  bootstrap()
    .then(model => {
      console.log('Bootstrapping finished.');
      const data = getRawData();
      const visualizer = new Visualizer(model, data);
      const modelController = new ModelController(model, data, container, visualizer);
    });
}

init();

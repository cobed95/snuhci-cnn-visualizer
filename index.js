import { bootstrap, getRawData } from './nnbootstrap';
import Visualizer from './Visualizer';
import ModelController from './ModelController';

function init() {
  console.log('Bootstrapping');

  bootstrap()
    .then(model => {
      console.log('Bootstrapping finished.');
      const data = getRawData();
      const visualizer = new Visualizer(model, data);
      const modelController = new ModelController(model, data, visualizer);
    });
}

init();

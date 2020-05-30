import * as d3 from 'd3';
import { bootstrap, getTestData, getRawData } from './nnbootstrap';
import { IMAGE_H } from './data'
import { MDCSlider } from '@material/slider';
import { runImage } from './activation';

const container = document.getElementsByClassName("controller-container");

const width = 1280;
const height = 500;

const constructData = (_image, model) => {
  // Compute Neural Network Weights
  const conv1Weights = model.layers[0].getWeights()[0].arraySync();
  const conv2Weights = model.layers[2].getWeights()[0].arraySync();
  const fcWeights = model.layers[5].getWeights()[0].arraySync();

  // Compute activations values for given _image
  const conv1ActivationsTensors = runImage(model, _image, 0).filterActivations;
  const conv2ActivationsTensors = runImage(model, _image, 2).filterActivations;

  conv1ActivationsTensors.shift();
  conv2ActivationsTensors.shift();

  const conv1Activations = conv1ActivationsTensors
    .map(tensor => tensor.arraySync());
  const conv2Activations = conv2ActivationsTensors
    .map(tensor => tensor.arraySync());

  // Derive a 2D image to be fed to D3
  const image = _image.arraySync()[0];

  const constructInputImage = () => {
    const width = image.length * 3;
    const height = image[0].length * 3;
    const margin = 20;

    return {
      image: image,
      position: [width / 2, height / 2],
      accHeight: height + margin
    } 
  }

  const constructConv1 = (accHeight) => {
    // 3 3 1 8
    let data = [];

    let width  = 3 * 20;
    let height = 3 * 20;
    let margin = 20;
    let sumWidth = margin;

    for (let fidx = 0; fidx < 8; fidx++) {
      let weights = new Array(3).fill(0).map(() => new Array(3).fill(0.0));

      for (let x = 0; x < 3; x++) {
        for (let y = 0; y < 3; y++) {
          weights[x][y] = conv1Weights[x][y][0][fidx];
        }
      }

      let position = [sumWidth + width / 2, accHeight + margin + height / 2];
      let size = [width, height];

      data.push({ weights, position, size });

      sumWidth += width + margin;
    }

    return { data: data, accHeight: accHeight + margin + height };
  }

  const constructConv1Activations = (accHeight) => {
    let margin = 20;
    let width = 26 * 3;
    let height = 26 * 3;

    let data = [];

    let sumWidth = margin;

    for (let fidx = 0; fidx < 8; fidx++) {
      let weights = new Array(26).fill(0).map(() => new Array(26).fill(0));

      for (let x = 0; x < 26; x++) {
        for (let y = 0; y < 26; y++) {
          weights[x][y] = conv1Activations[fidx][y][x];
        }
      }

      let size = [width, height];
      let position = [sumWidth + width / 2, accHeight + margin + height / 2];

      data.push({ weights, position, size })

      sumWidth += width * margin;
    }

    return { data: data, accHeight: accHeight + margin + height };
  }

  const constructConv2 = (accHeight) => {
    // 3 3 1 16
    let data = [];

    let width  = 3 * 20;
    let height = 3 * 20;
    let margin = 20;
    let sumWidth = margin;

    for (let fidx = 0; fidx < 16; fidx++) {
      let weights = new Array(3).fill(0.0).map(() => new Array(3).fill(0.0));

      for (let x = 0; x < 3; x++) {
        for (let y = 0; y < 3; y++) {
          weights[x][y] = conv2Weights[x][y][0][fidx];
        }
      }

      let position = [sumWidth + width / 2, accHeight + margin + height / 2];
      let size = [width, height];

      data.push({ weights, position, size });

      sumWidth += width + margin;
    }

    return { data: data, accHeight: accHeight + margin + height };
  }

  const constructConv2Activations = (accHeight) => {
    let margin = 20;
    let width = 24 * 3;
    let height = 24 * 3;

    let data = [];

    let sumWidth = margin;

    for (let fidx = 0; fidx < 16; fidx++) {
      let weights = new Array(11).fill(0).map(() => new Array(11).fill(0));

      for (let x = 0; x < 11; x++) {
        for (let y = 0; y < 11; y++) {
          weights[x][y] = conv2Activations[fidx][y][x];
        }
      }

      let size = [width, height];
      let position = [sumWidth + width / 2, accHeight + margin + height / 2];

      data.push({ weights, position, size })

      sumWidth += width * margin;
    }

    return { data: data, accHeight: accHeight + margin + height };
  };

  const constructFc = (accHeight) => {
    return { data: [], accHeight: accHeight };
  }

  const inputConstructionResult = constructInputImage();
  const conv1ConstructionResult = constructConv1(inputConstructionResult.accHeight);
  const act1ConstructionResult  = constructConv1Activations(conv1ConstructionResult.accHeight);
  const conv2ConstructionResult = constructConv2(act1ConstructionResult.accHeight);
  const act2ConstructionResult  = constructConv2Activations(conv2ConstructionResult.accHeight);
  const fcConstructionResult    = constructFc(act2ConstructionResult.accHeight);

  const result = {
    input: {
      image: inputConstructionResult.image,
      position: inputConstructionResult.position
    },
    conv1: conv1ConstructionResult.data,
    act1: act1ConstructionResult.data, 
    conv2: conv2ConstructionResult.data,
    act2: act2ConstructionResult.data,
    fc: fcConstructionResult.data
  }

  return result;
}

function visualize(model) {
  const conv1Weights = model.layers[0].getWeights()[0].arraySync();
  const conv2Weights = model.layers[2].getWeights()[0].arraySync();
  const fcWeights = model.layers[5].getWeights()[0].arraySync();

  const data = getRawData();
  const trainData = data.getTrainData();
  const activationExample = trainData.xs.slice([1], [2]);

  const cnn = constructData(activationExample, model);
  const inputImage = cnn.input;

  const svg = d3.select("#d3-container")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

  const g = svg.append("g");

  const colorScale = d3.scaleLinear().domain([0.0, 1.0]).range(['white', 'black']);

  const zoomed = () => { g.attr("transform", d3.event.transform); };
  const zoom = d3.zoom().scaleExtent([1, 4]).on("zoom", zoomed);
  const resetZoom = () => {
    svg.transition().duration(750).call(
      zoom.transform,
      d3.zoomIdentity,
      d3.zoomTransform(svg.node()).invert([width / 2, height / 2])
    );
  };

  svg.on("click", resetZoom);
  svg.call(zoom);

  const clicked = d => {
    const { position } = d
    const [x, y] = position
    d3.event.stopPropagation();
    svg.transition().duration(750).call(
      zoom.transform,
      d3.zoomIdentity.translate(width / 2, height / 2).scale(4).translate(-x, -y),
      d3.mouse(svg.node())
    );
  };

  // Input Layer
  const input = g.selectAll(".input")
    .data([inputImage])
    .enter()
    .append("g")
    .classed('rect', true);

  // Draw input image
  for (let row = 0; row < inputImage.image.length; row++) {
    for (let col = 0; col < inputImage.image[row].length; col++) {
      input.append("rect")
        .attr("width", 3)
        .attr("height", 3)
        .attr("x", row * 3)
        .attr("y", col * 3)
        .attr("fill", d => {
          return colorScale(d.image[col][row]);
        });
    }
  }

  // Conv Layers
  const conv1 = g.selectAll(".conv1")
    .data(cnn.conv1)
    .enter()
    .append("g")
    .classed('rect', true);

  const drawRects = (layer, h, v, width, height) => {
    layer.each(function(p, j) {
      const child = d3.select(this)
      child
        .attr("transform", d => "translate(" + (j * h) + "," + v + ")")
        .attr("stroke", "black")
        .on("click", clicked);
      
      const data = child.data()[0]
      for (let row = 0; row < data.weights.length; row++) {
        for (let col = 0; col < data.weights[row].length; col++) {
          child.append("rect")
            .attr("width", width)
            .attr("height", height)
            .attr("x", row * width)
            .attr("y", col * height)
            .attr("fill", d => colorScale(d.weights[row][col]));
        }
      } 
    });
  }

  drawRects(conv1, 80.0, 100, 20, 20);

  const act1 = g.selectAll(".act1")
    .data(cnn.act1)
    .enter()
    .append("g");

  drawRects(act1, 78.0, 200, 3, 3);

  const conv2 = g.selectAll(".conv2")
    .data(cnn.conv2)
    .enter()
    .append("g");

  drawRects(conv2, 80.0, 350, 20, 20);

  const act2 = g.selectAll(".act2")
    .data(cnn.act2)
    .enter()
    .append("g");

  drawRects(act2, 72.0, 450, 3, 3);

  Object.assign(svg.node(), {
    zoomIn: () => svg.transition().call(zoom.scaleBy, 2),
    zoomOut: () => svg.transition().call(zoom.scaleBy, 0.5),
    zoomReset: resetZoom
  });
}

function init() {
  console.log('Bootstrapping');

  bootstrap(container)
    .then(modelController => {
      console.log('Bootstrapping finished.');
      visualize(modelController.model);
    });
}

init();

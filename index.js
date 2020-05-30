import * as d3 from 'd3';
import * as tf from '@tensorflow/tfjs';
import { MDCSlider } from '@material/slider';
import { bootstrap, getTestData, getRawData } from './nnbootstrap';
import { IMAGE_H, IMAGE_W } from './data'

const epochSlider = new MDCSlider(document.querySelector('.mdc-slider'));
epochSlider.listen('MDCSlider:change', (a) => {
  console.log(a)
  // console.log(`Value changed to ${epochSlider.value}`)
});

let play = false;
const playButton = document.querySelector('.mdc-button');
const playButtonClickHandler = () => { 
  play = !play;
  if (play)
    playButton.textContent = "pause";
  else
    playButton.textContent = "play";
};
playButton.addEventListener("click", playButtonClickHandler);

const increaseEpoch = () => {
  if (play)
    epochSlider.value++
}
setInterval(increaseEpoch, 1000)

const width = 1280;
const height = 500;

const constructData = (image, model) => {
  const conv1Weights = model.layers[0].getWeights()[0].arraySync();
  const conv2Weights = model.layers[2].getWeights()[0].arraySync();
  const fcWeights = model.layers[5].getWeights()[0].arraySync();

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

  const constructFc = (accHeight) => {
    return { data: [], accHeight: accHeight };
  }

  const inputConstructionResult = constructInputImage();
  const conv1ConstructionResult = constructConv1(inputConstructionResult.accHeight);
  const conv2ConstructionResult = constructConv2(conv1ConstructionResult.accHeight);
  const fcConstructionResult    = constructFc(conv2ConstructionResult.accHeight);

  const result = {
    input: {
      image: inputConstructionResult.image,
      position: inputConstructionResult.position
    },
    conv1: conv1ConstructionResult.data,
    conv2: conv2ConstructionResult.data,
    fc: fcConstructionResult.data
  }

  console.log(result);

  return result;
}

function visualize(model) {
  const conv1Weights = model.layers[0].getWeights()[0].arraySync();
  const conv2Weights = model.layers[2].getWeights()[0].arraySync();
  const fcWeights = model.layers[5].getWeights()[0].arraySync();

  const testData = getTestData();
  const inputImage = { image: testData[2] };

  const cnn = constructData(testData[2], model);

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

  const drawRects = (layer, h, v) => {
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
            .attr("width", 20)
            .attr("height", 20)
            .attr("x", row * 20)
            .attr("y", col * 20)
            .attr("fill", d => colorScale(d.weights[row][col]));
        }
      } 
    });
  }

  drawRects(conv1, 80.0, 100);

  const conv2 = g.selectAll(".conv2")
    .data(cnn.conv2)
    .enter()
    .append("g");

  drawRects(conv2, 60.0, 350);

  Object.assign(svg.node(), {
    zoomIn: () => svg.transition().call(zoom.scaleBy, 2),
    zoomOut: () => svg.transition().call(zoom.scaleBy, 0.5),
    zoomReset: resetZoom
  });
}

const getActivation = (input, model, layer) => {
  const activationModel = tf.model({
    inputs: model.input,
    outputs: layer.output
  });
  return activationModel.predict(input);
};

function getActivationTable(model, examples, layerIdx, imageSize) {
  const layer = model.getLayer(undefined, layerIdx);

  let filters = tf.tidy(() =>
    layer.kernel.val.transpose([3, 0, 1, 2]).unstack()
  );

  if (filters[0].shape[2] > 3) {
    filters = filters.map((d, i) => `Filter ${i + 1}`);
  }

  filters.unshift("Input");

  const activations = tf.tidy(() => {
    return getActivation(examples, model, layer).unstack();
  });
  const activationImageSize = activations[0].shape[0]; // e.g. 24

  const numFilters = activations[0].shape[2]; // e.g. 8

  const filterActivations = activations.map((activation, i) => {
    const unpackedActivations = Array(numFilters)
      .fill(0)
      .map((_, i) =>
        activation.slice(
          [0, 0, i],
          [activationImageSize, activationImageSize, 1]
        )
      );

    const inputExample = tf.tidy(() =>
      examples.slice([i], [1]).reshape([imageSize, imageSize, 1])
    );
    unpackedActivations.unshift(inputExample);
    return unpackedActivations;
  });
  return {
    filters,
    filterActivations
  };
}

const renderImage = async (container, tensor, imageOpts) => {
  const resized = tf.tidy(() =>
    tf.image
      .resizeNearestNeighbor(tensor, [imageOpts.height, imageOpts.width])
      .clipByValue(0.0, 1.0)
  );
  const canvas = document.createElement("canvas");
  canvas.width = imageOpts.width;
  canvas.height = imageOpts.height;
  canvas.style = `margin: 4px; width:${imageOpts.width}px; height:${
    imageOpts.height
  }px`;
  container.appendChild(canvas);
  await tf.browser.toPixels(resized, canvas);
  resized.dispose();
};

const renderImageTable = (container, headerData, data) => {
  let table = d3.select(container).select("table");

  if (table.size() === 0) {
    table = d3.select(container).append("table");
    table.append("thead").append("tr");
    table.append("tbody");
  }

  const headers = table
    .select("thead")
    .select("tr")
    .selectAll("th")
    .data(headerData);
  const headersEnter = headers.enter().append("th");
  headers.merge(headersEnter).each((d, i, group) => {
    const node = group[i];

    if (typeof d === "string") {
      node.innerHTML = d;
    } else {
      renderImage(node, d, {
        width: 25,
        height: 25
      });
    }
  });
  const rows = table
    .select("tbody")
    .selectAll("tr")
    .data(data);
  const rowsEnter = rows.enter().append("tr");
  const cells = rows
    .merge(rowsEnter)
    .selectAll("td")
    .data(d => d);
  const cellsEnter = cells.enter().append("td");
  cells.merge(cellsEnter).each((d, i, group) => {
    const node = group[i];
    renderImage(node, d, {
      width: 40,
      height: 40
    });
  });
  cells.exit().remove();
  rows.exit().remove();
};

const renderFilters = (model, examples, layerIdx, container, imageSize) => {
  const { filters, filterActivations } = getActivationTable(
    model,
    examples,
    layerIdx,
    imageSize
  );

  renderImageTable(
    document.getElementById(container),
    filters,
    filterActivations
  );
};

function init() {
  console.log('Bootstrapping');

  bootstrap()
    .then(model => {
      console.log('Bootstrapping finished.');
      visualize(model);

      const data = getRawData();
      const trainData = data.getTrainData();
      const activationExamples = trainData.xs.slice([0], [5]);

      const getContainerName = layerIdx => `layer-${layerIdx + 1}-filters`;
      [0, 2].forEach(layerIdx => 
        renderFilters(
          model, 
          activationExamples, 
          layerIdx, 
          getContainerName(layerIdx), 
          IMAGE_H
        )
      );
    });
}

init();

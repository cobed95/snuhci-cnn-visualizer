import * as d3 from 'd3';
import { MDCSlider } from '@material/slider';
import { bootstrap } from './nnbootstrap';

const epochSlider = new MDCSlider(document.querySelector('.mdc-slider'));
epochSlider.listen('MDCSlider:change', () => console.log(`Value changed to ${epochSlider.value}`));

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

const width = 5000;
const height = 5000;

const cnn = {
  conv: [ 
    {
      weights: [
        [0.0, 0.4, 1.0],
        [0.35, 0.8, 0.3],
        [0.2, 0.68, 0.58]
      ]
    },
    {
      weights: [
        [0.3, 0.4, 1.0],
        [0.35, 0.8, 0.3],
        [0.2, 0.68, 0.58]
      ]
    },
    {
      weights: [
        [0.3, 0.8, 1.0],
        [1.0, 0.3, 0.3],
        [0.0, 0.77, 0.58]
      ]
    }
  ],
  subsampling: [
    {
      weights: [
        [0.0, 1.0],
        [0.3, 0.7]
      ]
    },
    {
      weights: [
        [0.25, 0.95],
        [0.3, 0.7]
      ]
    }
  ]
};

function visualize(model) {
  const svg = d3.select("#d3-container")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

  // Conv Layers
  const conv = svg.selectAll(".rect")
    .data(cnn.conv)
    .enter()
    .append("g")
    .classed('rect', true);

  conv
    .append("text")
    .text("Convolution Layers");

  const colorScale = d3.scaleLinear().domain([0.0, 1.0]).range(['white', 'black']);

  cnn.conv.forEach((layer, idx) => {
    const layerAgg = conv.append("g")
      .attr("transform", d => "translate(" + (idx * 80.0) + "," + 0.0 + ")")
      .attr("stroke", "black");

    for (var row = 0; row < layer.weights.length; row++) {
      for (var col = 0; col < layer.weights[row].length; col++) {
        layerAgg.append("rect")
          .attr("width", 20)
          .attr("height", 20)
          .attr("x", row * 20)
          .attr("y", col * 20)
          .attr("fill", d => colorScale(layer.weights[row][col]));
      }
    }
  });

  const subsampling = svg.selectAll(".subsampling")
    .data(cnn.subsampling)
    .enter()
    .append("g");

  cnn.subsampling.forEach((layer, idx) => {
    const layerAgg = subsampling.append("g")
      .attr("transform", d => "translate(" + (idx * 60.0) + "," + 0.0 + ")")
      .attr("stroke", "black");

    for (let row = 0; row < layer.weights.length; row++) {
      for (let col = 0; col < layer.weights[row].length; col++) {
        layerAgg.append("rect")
          .attr("width", 20)
          .attr("height", 20)
          .attr("x", row * 20)
          .attr("y", col * 20)
          .attr("fill", d => colorScale(layer.weights[row][col]));
      }
    }
  });

  subsampling
    .attr("transform", d => "translate(" + 0 + "," + 100 + ")");
}

function init() {
  console.log('Bootstrapping');

  bootstrap()
    .then(model => {
      console.log('Bootstrapping finished.');
      visualize(model);
    })
}

init();

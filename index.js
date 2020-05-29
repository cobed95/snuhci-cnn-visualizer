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

const width = 960;
const height = 500;

const cnn = {
  conv: [ 
    {
      weights: [
        [0.0, 0.4, 1.0],
        [0.35, 0.8, 0.3],
        [0.2, 0.68, 0.58]
      ],
      position: [30, 30]
    },
    {
      weights: [
        [0.3, 0.4, 1.0],
        [0.35, 0.8, 0.3],
        [0.2, 0.68, 0.58]
      ],
      position: [110, 30]
    },
    {
      weights: [
        [0.3, 0.8, 1.0],
        [1.0, 0.3, 0.3],
        [0.0, 0.77, 0.58]
      ],
      position: [190, 30]
    }
  ],
  subsampling: [
    {
      weights: [
        [0.0, 1.0],
        [0.3, 0.7]
      ],
      position: [20, 120]
    },
    {
      weights: [
        [0.25, 0.95],
        [0.3, 0.7]
      ],
      position: [80, 120]
    }
  ]
};

function visualize(model) {
  const svg = d3.select("#d3-container")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

  const g = svg.append("g");

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

  // Conv Layers
  const conv = g.selectAll(".rect")
    .data(cnn.conv)
    .enter()
    .append("g")
    .classed('rect', true);

  conv
    .append("text")
    .text("Convolution Layers");

  const colorScale = d3.scaleLinear().domain([0.0, 1.0]).range(['white', 'black']);

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
    })
  }

  drawRects(conv, 80.0, 0);

  const subsampling = g.selectAll(".subsampling")
    .data(cnn.subsampling)
    .enter()
    .append("g");

  drawRects(subsampling, 60.0, 100);

  Object.assign(svg.node(), {
    zoomIn: () => svg.transition().call(zoom.scaleBy, 2),
    zoomOut: () => svg.transition().call(zoom.scaleBy, 0.5),
    zoomReset: resetZoom
  });
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

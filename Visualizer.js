import * as d3 from "d3";
import { getRawData } from './nnbootstrap'
import { runImage } from './activation'

const colorScale = d3.scaleLinear().domain([0.0, 1.0]).range(['white', 'black']);

export default class Visualizer {
  constructor(model, data) {
    this.width = 1280;
    this.height = 500;

    const trainData = data.getTrainData();
    this.activationExample = trainData.xs.slice([1], [2]);

    this.constructData(model);
    this.initVisualization();
  }

  constructData(model) {
    const convIdx = [0, 2]
    // Compute Neural Network Weights
    const convWeights = convIdx.map(idx => model.layers[idx].getWeights()[0].arraySync());
    // const conv1Weights = model.layers[0].getWeights()[0].arraySync();
    // const conv2Weights = model.layers[2].getWeights()[0].arraySync();

    // Compute activation values for given this.activationExample
    // const conv1ActivationsTensors = runImage(model, this.activationExample, 0).filterActivations;
    // const conv2ActivationsTensors = runImage(model, this.activationExample, 2).filterActivations;
    const convActivationsTensors = convIdx.map(i => runImage(model, this.activationExample, i).filterActivations);
    convActivationsTensors.forEach(tensors => { tensors.shift(); });

    const convActivations = convActivationsTensors.map(tensors => 
      tensors.map(tensor => tensor.arraySync()));

    const image = this.activationExample.arraySync()[0];

    const constructInputImage = () => {
      const width = image.length * 3;
      const height = image[0].length * 3;
      const margin = 20;

      return {
        image: image,
        position: [width / 2, height / 2],
        accHeight: height + margin
      };
    }

    const constructConv = (accHeight, convWeights) => {
      let data = [];

      let width  = 3 * 20;
      let height = 3 * 20;
      let margin = 20;
      let sumWidth = margin;

      for (let fidx = 0; fidx < 8; fidx++) {
        let weights = Array(3).fill(0).map(() => new Array(3).fill(0.0));

        for (let x = 0; x < 3; x++) {
          for (let y = 0; y < 3; y++) {
            weights[x][y] = convWeights[x][y][0][fidx];
          }
        }

        let position = [sumWidth + width / 2, accHeight + margin + height / 2];
        let size = [width, height];

        data.push({ weights, position, size });

        sumWidth += width + margin;
      }

      return { data, accHeight: accHeight + margin + height };
    }

    const constructConvActivations = (
      accHeight, 
      convActivations, 
      numRects, 
      numWeights, 
      numActivations
    ) => {
      let margin = 20;
      let width = numRects * 3;
      let height = numRects * 3;

      let data = [];

      let sumWidth = margin;

      for (let fidx = 0; fidx < numActivations; fidx++) {
        let weights = new Array(numWeights).fill(0).map(() => new Array(numWeights).fill(0));

        for (let x = 0; x < numWeights; x++) {
          for (let y = 0; y < numWeights; y++) {
            weights[x][y] = convActivations[fidx][y][x];
          }
        }

        let size = [width, height];
        let position = [sumWidth + width / 2, accHeight + margin + height / 2];

        data.push({ weights, position, size })

        sumWidth += width * margin;
      }

      return { data, accHeight: accHeight + margin + height };
    }

    const constructFc = accHeight => ({ data: [], accHeight });

    const inputConstructionResult = constructInputImage();
    const conv1ConstructionResult = constructConv(inputConstructionResult.accHeight, convWeights[0]);
    const act1ConstructionResult  = constructConvActivations(conv1ConstructionResult.accHeight, convActivations[0], 26, 26, 8);
    const conv2ConstructionResult = constructConv(act1ConstructionResult.accHeight, convWeights[1]);
    const act2ConstructionResult  = constructConvActivations(conv2ConstructionResult.accHeight, convActivations[1], 24, 11, 16);
    const fcConstructionResult    = constructFc(act2ConstructionResult.accHeight);

    this.input = inputConstructionResult;
    this.conv1 = conv1ConstructionResult.data;
    this.act1  = act1ConstructionResult.data;
    this.conv2 = conv2ConstructionResult.data;
    this.act2  = act2ConstructionResult.data;
    this.fc    = fcConstructionResult.data;
  }

  initVisualization() {
    const svg = d3.select("#d3-container")
      .append("svg")
      .attr("width", this.width)
      .attr("height", this.height);

    const g = svg.append("g");

    const zoomed = () => { g.attr("transform", d3.event.transform); };
    const zoom = d3.zoom().scaleExtent([1, 4]).on("zoom", zoomed);
    const width = this.width;
    const height = this.height;
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
      .data([this.input])
      .enter()
      .append("g")
      .attr("id", "input");
      // .classed('rect', true);

    // Draw input image
    for (let row = 0; row < this.input.image.length; row++) {
      for (let col = 0; col < this.input.image[row].length; col++) {
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
      .data(this.conv1)
      .enter()
      .append("g")
      .attr("id", "conv1");
      // .classed('rect', true);

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
      .data(this.act1)
      .enter()
      .append("g")
      .attr("id", "act1");

    drawRects(act1, 78.0, 200, 3, 3);

    const conv2 = g.selectAll(".conv2")
      .data(this.conv2)
      .enter()
      .append("g")
      .attr("id", "conv2");

    drawRects(conv2, 80.0, 350, 20, 20);

    const act2 = g.selectAll(".act2")
      .data(this.act2)
      .enter()
      .append("g")
      .attr("id", "act2");

    drawRects(act2, 72.0, 450, 3, 3);

    this.svgNode = Object.assign(svg.node(), {
      zoomIn: () => svg.transition().call(zoom.scaleBy, 2),
      zoomOut: () => svg.transition().call(zoom.scaleBy, 0.5),
      zoomReset: resetZoom,
      update: this.update
    });

    console.log(this.svgNode);
  }

  update(model) {
    this.constructData(model);
    const updateRects = (layer, h, v, width, height) => {
      console.log(layer.nodes())
      layer.each(function(p, j) {
        const child = d3.select(this)
        console.log(child);
        console.log(child.data());
        // child
        //   .attr("transform", d => "translate(" + (j * h) + "," + v + ")")
        //   .attr("stroke", "black")
        //   .on("click", clicked);
        
        // const data = child.data()[0]
        // console.log('c', child);
        // child.nodes().each(function(p, j) {
        //   const grandchild = d3.select(this)
        //   console.log('gc', grandchild);
          // grandchild.each(function(p, j) {
          //   const greatGrandchild = d3.select(this);
          //   console.log('ggc', greatGrandchild);
          // })
        // })
        // for (let row = 0; row < data.weights.length; row++) {
        //   for (let col = 0; col < data.weights[row].length; col++) {
        //     child
        //       // .append("rect")
        //       // .attr("width", width)
        //       // .attr("height", height)
        //       // .attr("x", row * width)
        //       // .attr("y", col * height)
        //       // .attr("fill", d => colorScale(d.weights[row][col]));
        //   }
        // } 
      });
    }   

    const conv1 = d3.selectAll("#conv1");
    // console.log(conv1)
    // conv1.data(this.conv1).attr("fill", colorScale)
    updateRects(conv1);
    console.log("updated");
  }
}
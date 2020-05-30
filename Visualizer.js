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

    this.constructValues(model);
    this.initVisualization();
  }

  constructValues(model) {
    const getImage = () => {
      const _image = this.activationExample.arraySync()[0];
      const image = new Array(28).fill(0).map(() => new Array(28));
      
      for (let x = 0; x < 28; x++) {
        for (let y = 0; y < 28; y++) {
          image[x][y] = _image[y][x];
        }
      }

      return image;
    };

    const getConv1Weights = () => {
      const rawWeights = model.layers[0].getWeights()[0].arraySync();
      const conv1Weights = new Array(8).fill(0).map(() => new Array(3).fill(0).map(() => new Array(3)));

      for (let fidx = 0; fidx < 8; fidx++) {
        for (let x = 0; x < 3; x++) {
          for (let y = 0; y < 3; y++) {
            conv1Weights[fidx][x][y] = rawWeights[y][x][0][fidx];
          }
        }
      } 

      return conv1Weights;
    };

    const getConv2Weights = () => {
      const rawWeights = model.layers[2].getWeights()[0].arraySync();
      const conv2Weights = new Array(16).fill(0).map(() => new Array(3).fill(0).map(() => new Array(3)));

      for (let fidx = 0; fidx < 16; fidx++) {
        for (let x = 0; x < 3; x++) {
          for (let y = 0; y < 3; y++) {
            conv2Weights[fidx][x][y] = rawWeights[y][x][0][fidx];
          }
        }
      }

      return conv2Weights;
    };

    const getConv1Activations = () => {
      const result = runImage(model, this.activationExample, 0).filterActivations;
      result.shift();
      const synced = result.map(tensor => tensor.arraySync());
      const conv1Activations = new Array(8).fill(0).map(() => new Array(26).fill(0).map(() => new Array(26)));

      for (let fidx = 0; fidx < 8; fidx++) {
        for (let x = 0; x < 26; x++) {
          for (let y = 0; y < 26; y++) {
            conv1Activations[fidx][x][y] = synced[fidx][y][x];
          }
        }
      } 

      return conv1Activations;
    };

    const getConv2Activations = () => {
      const result = runImage(model, this.activationExample, 2).filterActivations;
      result.shift();
      const synced = result.map(tensor => tensor.arraySync());
      const conv2Activations = new Array(16).fill(0).map(() => new Array(11).fill(0).map(() => new Array(11)));

      for (let fidx = 0; fidx < 16; fidx++) {
        for (let x = 0; x < 11; x++) {
          for (let y = 0; y < 11; y++) {
            conv2Activations[fidx][x][y] = synced[fidx][y][x];
          }
        }
      } 

      return conv2Activations;
    };

    const constructRects = (image, conv1Weights, conv1Activations, conv2Weights, conv2Activations) => {
      const BASE_SIZE = 110.0;
      const visLayers = [];
      const rects = [];

      visLayers.push([[image], 3]);
      visLayers.push([conv1Weights, 20]);
      visLayers.push([conv1Activations, 3]);
      visLayers.push([conv2Weights, 20]);
      visLayers.push([conv2Activations, 3]);

      let pivotY = 0.0;

      for (let i = 0; i < visLayers.length; i++) {
        const visLayer = visLayers[i];

        let pivotX = 0.0;
        let grids = visLayer[0];
        let cellSize = visLayer[1];

        let n = grids[0].length;
        let size = n * cellSize;

        let marginDiff = (BASE_SIZE - size) / 2.0;

        for (let g = 0; g < grids.length; g++) {
          const grid = grids[g];

          let x0 = pivotX + marginDiff;
          let y0 = pivotY + marginDiff;

          for (let x = 0; x < grid.length; x++) {
            for (let y = 0; y < grid[x].length; y++) {
              const xc = x0 + x * cellSize;
              const yc = y0 + y * cellSize;

              let rect = {
                x: xc,
                y: yc,
                width: cellSize,
                height: cellSize,
                weight: grid[x][y]
              };

              rects.push(rect);
            }
          }
          pivotX += BASE_SIZE;
        } 

        pivotY += BASE_SIZE;
      }
      
      return rects;
    };

    const image = getImage();
    const conv1Weights = getConv1Weights();
    const conv1Activations = getConv1Activations();
    const conv2Weights = getConv2Weights();
    const conv2Activations = getConv2Activations();
    const rects = constructRects(image, conv1Weights, conv1Activations, conv2Weights, conv2Activations);

    this.input = image;
    this.conv1 = conv1Weights;
    this.act1  = conv1Activations;
    this.conv2 = conv2Weights;
    this.act2  = conv2Activations;
    this.fc    = undefined;
    this.rects = rects;
  } 

  constructData(model) {
    const convIdx = [0, 2]

    const convWeights = convIdx.map(idx => model.layers[idx].getWeights()[0].arraySync());
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

      for (let fidx = 0; fidx < convWeights[0][0][0].length; fidx++) {
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

    const g = svg.append("g").attr("id", "model-container");

    g.selectAll("rect")
      .data(this.rects)
      .enter()
      .append("rect")
      .attr("width", d => d.width)
      .attr("height", d => d.height)
      .attr("x", d => d.x)
      .attr("y", d => d.y)
      .attr("stroke", "gray")
      .attr("fill", d => {
        if (typeof d === "Array") 
          return colorScale(d.weight[0])

        return colorScale(d.weight)
      });
  }

  // initVisualization() {
  //   const svg = d3.select("#d3-container")
  //     .append("svg")
  //     .attr("width", this.width)
  //     .attr("height", this.height);

  //   const g = svg.append("g");

  //   const zoomed = () => { g.attr("transform", d3.event.transform); };
  //   const zoom = d3.zoom().scaleExtent([1, 4]).on("zoom", zoomed);
  //   const width = this.width;
  //   const height = this.height;
  //   const resetZoom = () => {
  //     svg.transition().duration(750).call(
  //       zoom.transform,
  //       d3.zoomIdentity,
  //       d3.zoomTransform(svg.node()).invert([width / 2, height / 2])
  //     );
  //   };

  //   svg.on("click", resetZoom);
  //   svg.call(zoom);

  //   const clicked = d => {
  //     const { position } = d
  //     const [x, y] = position
  //     d3.event.stopPropagation();
  //     svg.transition().duration(750).call(
  //       zoom.transform,
  //       d3.zoomIdentity.translate(width / 2, height / 2).scale(4).translate(-x, -y),
  //       d3.mouse(svg.node())
  //     );
  //   };

  //   // Input Layer
  //   const input = g.selectAll(".input")
  //     .data([this.input])
  //     .enter()
  //     .append("g")
  //     .attr("id", "input");
  //     // .classed('rect', true);

  //   // Draw input image
  //   for (let row = 0; row < this.input.image.length; row++) {
  //     for (let col = 0; col < this.input.image[row].length; col++) {
  //       input.append("rect")
  //         .attr("width", 3)
  //         .attr("height", 3)
  //         .attr("x", row * 3)
  //         .attr("y", col * 3)
  //         .attr("fill", d => {
  //           return colorScale(d.image[col][row]);
  //         });
  //     }
  //   }

  //   // Conv Layers
  //   const conv1 = g.selectAll(".conv1")
  //     .data(this.conv1)
  //     .enter()
  //     .append("g")
  //     .attr("id", "conv1");
  //     // .classed('rect', true);

  //   const drawRects = (layer, h, v, width, height) => {
  //     layer.each(function(p, j) {
  //       const child = d3.select(this)
  //       child
  //         .attr("transform", d => "translate(" + (j * h) + "," + v + ")")
  //         .attr("stroke", "black")
  //         .on("click", clicked);
        
  //       const data = child.data()[0]
  //       for (let row = 0; row < data.weights.length; row++) {
  //         for (let col = 0; col < data.weights[row].length; col++) {
  //           child.append("rect")
  //             .attr("width", width)
  //             .attr("height", height)
  //             .attr("x", row * width)
  //             .attr("y", col * height)
  //             .attr("fill", d => colorScale(d.weights[row][col]));
  //         }
  //       } 
  //     });
  //   }

  //   drawRects(conv1, 80.0, 100, 20, 20);

  //   const act1 = g.selectAll(".act1")
  //     .data(this.act1)
  //     .enter()
  //     .append("g")
  //     .attr("id", "act1");

  //   drawRects(act1, 78.0, 200, 3, 3);

  //   const conv2 = g.selectAll(".conv2")
  //     .data(this.conv2)
  //     .enter()
  //     .append("g")
  //     .attr("id", "conv2");

  //   drawRects(conv2, 80.0, 350, 20, 20);

  //   const act2 = g.selectAll(".act2")
  //     .data(this.act2)
  //     .enter()
  //     .append("g")
  //     .attr("id", "act2");

  //   drawRects(act2, 72.0, 450, 3, 3);

  //   this.svgNode = Object.assign(svg.node(), {
  //     zoomIn: () => svg.transition().call(zoom.scaleBy, 2),
  //     zoomOut: () => svg.transition().call(zoom.scaleBy, 0.5),
  //     zoomReset: resetZoom,
  //     update: this.update
  //   });

  //   console.log(this.svgNode);
  // }

  update(model) {
    this.constructValues(model);
    const g = d3.select("#model-container")
      .data(this.rects)
      .attr("fill", d => {
        if (typeof d === "Array") 
          return colorScale(d.weight[0])

        return colorScale(d.weight)
      });
  }
}

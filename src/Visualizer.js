import * as d3 from "d3";
import { getRawData } from './nnbootstrap'
import { runImage, getActivation } from './activation'

const colorScale = d3.scaleLinear().domain([0.0, 1.0]).range(['white', 'black']);
const outputScale = d3.scaleLinear().domain([0.0, 1.0]).range(['red', 'green']);

export default class Visualizer {
  constructor(model, data) {
    this.width = 1300;
    this.height = 500;

    this.model = model;

    const trainData = data.getTrainData();
    this.activationExampleArr = trainData.xs.slice([0], [10]);
    this._activationExample = this.activationExampleArr.slice([0], [1]);

    this.constructValues(model);
    this.initVisualization();
  }

  constructValues(model) {
    const getImage = () => {
      const _image = this._activationExample.arraySync()[0];
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
      const result = runImage(model, this._activationExample, 0).filterActivations;
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
      const result = runImage(model, this._activationExample, 2).filterActivations;
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

    const constructSubsamplingOutputs = () => {
      const outputs = getActivation(this._activationExample, model, model.layers[3]);
      return outputs.arraySync()[0];
    };

    const constructFcWeights = () => {
      const rawWeights = model.layers[5].getWeights()[0].arraySync();

      return rawWeights;
    };

    const constructFcActivations = () => {
      const prediction = model.predict(this._activationExample);
      return prediction.arraySync()[0];
    };

    const BASE_SIZE = 110.0;

    const constructRects = (image, conv1Weights, conv1Activations, conv2Weights, conv2Activations) => {
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

    const constructCirclesAndLinks = (subsamplingOutputs, fcWeights, fcActivations) => {
      let pivotY = 550.0;
      let pivotX = 0.0;

      const margin = 20.0;

      const circles = [];
      const flattened = [];
      const output = [];
      const links = [];

      for (let fidx = 0; fidx < 16; fidx++) {
        for (let x = 0; x < 5; x++) {
          for (let y = 0; y < 5; y++) {
            const xc = pivotX + margin + x * 18;
            const yc = pivotY + margin + y * 18;
            
            const weight = subsamplingOutputs[y][x][fidx];

            const circle = {
              cx: xc, 
              cy: yc,
              weight: weight,
              r: 8
            };
            
            circles.push(circle);
            flattened.push(circle);
          }
        }

        pivotX += BASE_SIZE;
      }
      
      pivotX = 88.0;
      pivotY += 5 * BASE_SIZE;

      for (let i = 0; i < 10; i++) {
        const circle = {
          cx: pivotX,
          cy: pivotY + 55.0,
          r: 20,
          weight: fcActivations[i]
        };

        circles.push(circle);
        output.push(circle);

        pivotX += 176.0;
      }

      for (let i = 0; i < fcWeights.length; i++) {
        for (let j = 0; j < 10; j++) {
          const link = {
            x1: flattened[i].cx,
            y1: flattened[i].cy,
            x2: output[j].cx,
            y2: output[j].cy,
            weight: fcWeights[i][j]
          };

          links.push(link);
        }
      }

      return { circles, links };
    };

    const image = getImage();
    const conv1Weights = getConv1Weights();
    const conv1Activations = getConv1Activations();
    const conv2Weights = getConv2Weights();
    const conv2Activations = getConv2Activations();
    const subsamplingOutputs = constructSubsamplingOutputs();
    const fcWeights = constructFcWeights();
    const fcActivations = constructFcActivations();

    const rects = constructRects(image, conv1Weights, conv1Activations, conv2Weights, conv2Activations);
    const { circles, links } = constructCirclesAndLinks(subsamplingOutputs, fcWeights, fcActivations);

    this.input = image;
    this.conv1 = conv1Weights;
    this.act1  = conv1Activations;
    this.conv2 = conv2Weights;
    this.act2  = conv2Activations;
    this.fc    = fcWeights;
    this.act3  = fcActivations;

    this.rects = rects;
    this.circles = circles;
    this.links = links;
  } 

  initVisualization() {
    const width = this.width;
    const height = this.height;
    const div = d3.select("#d3-container");
    console.log(div.style("width"));
    console.log(div.style("height"));
    const divWidth = Number.parseInt(div.style("width"));
    const divHeight = Number.parseInt(div.style("height"));
    console.log(divWidth);
    console.log(divHeight);

    const zoom = d3.zoom()
      .scaleExtent([1, 40])
      .on("zoom", zoomed);

    const svg = d3.select("#d3-container")
      .append("svg")
      .call(zoom)
      .attr("width", width)
      .attr("height", height)
      .on("click", reset);

    const g = svg.append("g").attr("id", "model-container");

    function zoomed() {
      g.attr("transform", d3.event.transform);
    }

    function reset() {
      console.log("Reset");
      svg.transition().duration(750).call(
        zoom.transform,
        d3.zoomIdentity,
        d3.zoomTransform(svg.node()).invert([width / 2, height / 2])
      );
    }  

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

    g.selectAll("line")
      .data(this.links)
      .enter()
      .append("line")
      .attr("x1", d => d.x1)
      .attr("y1", d => d.y1)
      .attr("x2", d => d.x2)
      .attr("y2", d => d.y2)
      .attr("stroke", "gray");

    g.selectAll("circle")
      .data(this.circles)
      .enter()
      .append("circle")
      .attr("cx", d => d.cx)
      .attr("cy", d => d.cy)
      .attr("r", d => d.r)
      .attr("stroke", "gray")
      .attr("fill", d => colorScale(d.weight));
  }

  update(model) {
    this.model = model;
    this.constructValues(model);
    d3.select("#model-container")
      .selectAll("rect")
      .data(this.rects)
      .attr("width", d => d.width)
      .attr("height", d=> d.height)
      .attr("x", d => d.x)
      .attr("y", d => d.y)
      .attr("stroke", "gray")
      .attr("fill", d => {
        if (typeof d === "Array") 
          return colorScale(d.weight[0])

        return colorScale(d.weight)
      });

    d3.select("#model-container")
      .selectAll("circle")
      .data(this.circles)
      .attr("cx", d => d.cx)
      .attr("cy", d => d.cy)
      .attr("r", d => d.r)
      .attr("stroke", "gray")
      .attr("fill", d => colorScale(d.weight));
  }

  get activationExample() {
    return this._activationExample
  }

  /**
   * @param {number} idx
   */
  set activationExample(idx) {
    this._activationExample = this.activationExampleArr
      .slice(idx, 1);
    this.update(this.model);
  }
}

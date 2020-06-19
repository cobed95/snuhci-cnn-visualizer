import * as d3 from "d3";
import { runImage, getActivation } from './activation';
import createPopupOnMouseover from './createPopupOnMouseover';

const colorScale = d3.scaleLinear().domain([0.0, 1.0]).range(['white', 'black']);
// const outputScale = d3.scaleLinear().domain([0.0, 1.0]).range([0, 50]);

const BASE_SIZE = 110;
const MODAL_SIZE = 110;

export default class Visualizer {
  constructor(model, data) {
    this.width = BASE_SIZE * 17;
    this.height = BASE_SIZE * 13;

    this.model = model;

    const trainData = data.getTrainData();
    this.activationExampleArr = trainData.xs.slice([0], [10]);
    this._activationExample = this.activationExampleArr.slice([0], [1]);

    this.constructValues(model);
    this.initVisualization();
  }

  constructValues(model) {
    const svgWidth = this.width;
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
      const rawWeights = model.layers[0].getWeights();
      const [kernel, conv1Bias] = rawWeights.map(el => el.arraySync());
      // const rawWeights = model.layers[0].getWeights()[0].arraySync();
      const conv1Weights = new Array(8).fill(0).map(() => new Array(3).fill(0).map(() => new Array(3)));

      for (let fidx = 0; fidx < 8; fidx++) {
        for (let x = 0; x < 3; x++) {
          for (let y = 0; y < 3; y++) {
            conv1Weights[fidx][x][y] = kernel[y][x][0][fidx];
          }
        }
      } 

      return { conv1Weights, conv1Bias };
    };

    const getConv2Weights = () => {
      const rawWeights = model.layers[2].getWeights()[0].arraySync();
      const conv2Weights = new Array(16).fill(0)
        .map(() => new Array(8).fill(0)
          .map(() => new Array(3).fill(0)
            .map(() => new Array(3))));

      for (let fidx = 0; fidx < 16; fidx++) {
        for (let dim = 0; dim < 8; dim++) {
          for (let x = 0; x < 3; x++) {
            for (let y = 0; y < 3; y++) {
              conv2Weights[fidx][dim][x][y] = rawWeights[y][x][dim][fidx];
            }
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
    
    const constructSubsamplingOutputs1 = () => {
      const result = getActivation(this._activationExample, model, model.layers[1]);
      const synced = result.arraySync()[0];
      
      const subsamplingOutputs1 = new Array(8).fill(0).map(() => new Array(13).fill(13).map(() => new Array(13)));
      for (let fidx = 0; fidx < 8; fidx++) {
        for (let x = 0; x < 13; x++) {
          for (let y = 0; y < 13; y++) {
            subsamplingOutputs1[fidx][x][y] = synced[y][x][fidx];
          }
        }
      }

      return subsamplingOutputs1;
    }

    const constructSubsamplingOutputs2 = () => {
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

    const constructRectsAndLinks = (
      image, 
      conv1Weights, 
      conv1Bias, 
      conv1Activations, 
      subsamplingOutputs1, 
      conv2Weights, 
      conv2Activations
    ) => {
      const visLayers = [];
      const rects = [];

      const imageRects = [];
      const conv1Rects = [];
      const conv1ActivationRects = [];

      const subsampling1Rects = [];
      const conv2Rects = [];
      const conv2ActivationRects = [];

      const links = [];
      const arrows = [];
      const texts = [];

      visLayers.push([[image], 3]);
      visLayers.push([conv1Weights, 20]);
      visLayers.push([conv1Activations, 3]);
      visLayers.push([subsamplingOutputs1, 3]);
      visLayers.push([conv2Weights, 20]);
      visLayers.push([conv2Activations, 3]);

      let pivotY = 0.0;

      const getPivotX = numG => {
        const midPoint = svgWidth / 2;
        const halfWidth = BASE_SIZE * (numG / 2);
        return midPoint - halfWidth;
      }

      const mustOverlap = i => i === 4;

      for (let i = 0; i < visLayers.length; i++) {
        const visLayer = visLayers[i];

        let grids = visLayer[0];
        let cellSize = visLayer[1];

        let pivotX = getPivotX(grids.length + 1);

        if (i === 0) 
          texts.push({ label: "Input Image", x: pivotX - BASE_SIZE + 20.0, y: pivotY + 45.0 });
        else if (i === 1)
          texts.push({ label: "Conv1 Filters", x: pivotX - BASE_SIZE + 20.0, y: pivotY + 45.0 });
        else if (i === 2)
          texts.push({ label: "Conv1 Activations", x: pivotX - BASE_SIZE, y: pivotY + 45.0 });
        else if (i === 3)
          texts.push({ label: "Subsampling1", x: pivotX - BASE_SIZE + 20.0, y: pivotY + 45.0 });
        else if (i === 5)
          texts.push({ label: "Conv2 Activations", x: pivotX - BASE_SIZE + 20.0, y: pivotY + 45.0 });

        if (mustOverlap(i)) {
          let n = grids[0][0].length;
          let size = n * cellSize;
          let marginDiff = (BASE_SIZE - size) / 2.0;

          texts.push({ label: "Conv2 Filters", x: pivotX - BASE_SIZE + 20.0, y: pivotY + 45.0 });

          for (let g = 0; g < grids.length; g++) {
            const grid = grids[g];
            const totalDim = grid.length;

            const gridRects = [];

            for (let dim = totalDim - 1; dim >= 0; dim--) {
              const singleDim = grid[dim];
              
              const dimOffset = 3 * (dim - (totalDim / 2));
              let x0 = pivotX + marginDiff + dimOffset;
              let y0 = pivotY + marginDiff - dimOffset;

              for (let x = 0; x < singleDim.length; x++) {
                for (let y = 0; y < singleDim[x].length; y++) {
                  const xc = x0 + x * cellSize;
                  const yc = y0 + y * cellSize;

                  let rect = {
                    x: xc,
                    y: yc,
                    width: cellSize,
                    height: cellSize,
                    weight: singleDim[x][y]
                  };

                  rects.push(rect);
                }
              }

              let gridRect = {
                x: x0,
                y: y0,
                width: cellSize * singleDim.length,
                height: cellSize * singleDim[0].length
              };

              gridRects.push(gridRect);
            }

            conv2Rects.push(gridRects);

            pivotX += BASE_SIZE;
          }

        } else {
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

            let gridRect = {
              x: x0,
              y: y0,
              width: cellSize * grid.length,
              height: cellSize * grid[0].length,
            };

            if (i === 0) imageRects.push(gridRect);
            else if (i === 1) conv1Rects.push(gridRect);
            else if (i === 2) {
              gridRect.inputs = [image];
              gridRect.filters = [conv1Weights[g]];

              conv1ActivationRects.push(gridRect);
            }
            else if (i === 3) subsampling1Rects.push(gridRect);
            else if (i === 5) {
              gridRect.inputs = subsamplingOutputs1;
              gridRect.filters = conv2Weights[g];
              
              conv2ActivationRects.push(gridRect);
            }

            pivotX += BASE_SIZE;
          }
        }

        if (i == 3) pivotY += 2 * BASE_SIZE;
        else pivotY += BASE_SIZE;
      }

      for (let i = 0; i < conv1Rects.length; i++) {
        const link = {
          x1: imageRects[0].x + imageRects[0].width / 2,
          y1: imageRects[0].y + imageRects[0].height,
          x2: conv1Rects[i].x + conv1Rects[i].width / 2,
          y2: conv1Rects[i].y,
          weight: 1.0
        };

        links.push(link);
      }

      arrows.push({x1: 0, y1: 0, x2: 0, y2: 0, weight: 0});

      for (let i = 0; i < conv1Rects.length; i++) {
        const link = {
          x1: conv1ActivationRects[i].x + conv1ActivationRects[i].width / 2,
          y1: conv1ActivationRects[i].y + conv1ActivationRects[i].height,
          x2: subsampling1Rects[i].x + subsampling1Rects[i].width / 2,
          y2: subsampling1Rects[i].y,
          weight: 1.0
        };

        arrows.push(link);
      }

      for (let i = 0; i < conv1Rects.length; i++) {
        const link = {
          x1: conv1Rects[i].x + conv1Rects[i].width / 2,
          y1: conv1Rects[i].y + conv1Rects[i].height,
          x2: conv1ActivationRects[i].x + conv1ActivationRects[i].width / 2,
          y2: conv1ActivationRects[i].y,
          weight: 1.0
        };

        links.push(link);
      }

      for (let r1 = 0; r1 < subsampling1Rects.length; r1++) {
        for (let r2 = 0; r2 < conv2Rects.length; r2++) {
          const link = {
            x1: subsampling1Rects[r1].x + subsampling1Rects[r1].width / 2,
            y1: subsampling1Rects[r1].y + subsampling1Rects[r1].height,
            x2: conv2Rects[r2][7 - r1].x + conv2Rects[r2][7 - r1].width / 2,
            y2: conv2Rects[r2][7 - r1].y,
            weight: 1.0 
          };

          links.push(link);
        }
      }

      for (let i = 0; i < conv2ActivationRects.length; i++) {
        let rect = conv2ActivationRects[i];
        let conv = conv2Rects[i][7];

        const link = {
          x1: conv.x + conv.width * 0.7,
          y1: conv.y + conv.height,
          x2: rect.x + rect.width / 2,
          y2: rect.y,
          weight: 1.0
        };

        links.push(link);
      }
      
      return { rects, conv1ActivationRects, conv2ActivationRects, links1: links, arrows, texts1: texts, pivotY };
    };

    const constructCirclesAndLinks = (subsamplingOutputs2, fcWeights, fcActivations, pivotY) => {
      // let pivotY = 550.0;
      let pivotX = 0.0;

      const margin = 20.0;

      const circles = [];
      const flattened = [];
      const output = [];
      const links = [];

      const subsampling2Circles = [];

      const texts = [];

      texts.push({ label: "Subsampling2", x: pivotX - BASE_SIZE + 20.0, y: pivotY + 45.0 });

      for (let fidx = 0; fidx < 16; fidx++) {
        for (let x = 0; x < 5; x++) {
          for (let y = 0; y < 5; y++) {
            const xc = pivotX + margin + x * 18;
            const yc = pivotY + margin + y * 18;
            
            const weight = subsamplingOutputs2[y][x][fidx];

            const circle = {
              cx: xc, 
              cy: yc,
              weight: weight,
              r: 8
            };
            
            circles.push(circle);
            flattened.push(circle);
            if (x === 2 && y === 0) subsampling2Circles.push(circle);
          }
        }

        pivotX += BASE_SIZE;
      }
      
      pivotX = 88.0;
      pivotY += 5 * BASE_SIZE;

      texts.push({ label: "Outputs", x: pivotX - BASE_SIZE, y: pivotY + 45.0 });

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

      return { circles, links2: links, texts2: texts, subsampling2Circles };
    };

    const image = getImage();
    const { conv1Weights, conv1Bias } = getConv1Weights();
    const conv1Activations = getConv1Activations();
    const subsamplingOutputs1 = constructSubsamplingOutputs1();
    const conv2Weights = getConv2Weights();
    const conv2Activations = getConv2Activations();
    const subsamplingOutputs2 = constructSubsamplingOutputs2();
    const fcWeights = constructFcWeights();
    const fcActivations = constructFcActivations();

    const { rects, conv1ActivationRects, conv2ActivationRects, links1, arrows, texts1, pivotY } = constructRectsAndLinks(
      image, 
      conv1Weights, 
      conv1Bias,
      conv1Activations, 
      subsamplingOutputs1, 
      conv2Weights, 
      conv2Activations
    );
    const { circles, links2, texts2, subsampling2Circles } = constructCirclesAndLinks(subsamplingOutputs2, fcWeights, fcActivations, pivotY);

    const links = links1.concat(links2);

    for (let i = 0; i < 16; i++) {
      const link = {
        x1: conv2ActivationRects[i].x + conv2ActivationRects[i].width / 2,
        y1: conv2ActivationRects[i].y + conv2ActivationRects[i].height,
        x2: subsampling2Circles[i].cx,
        y2: subsampling2Circles[i].cy - subsampling2Circles[i].r,
        weight: 1.0
      };

      arrows.push(link);
    }

    this.input = image;
    this.conv1 = conv1Weights;
    this.act1  = conv1Activations;
    this.conv2 = conv2Weights;
    this.act2  = conv2Activations;
    this.fc    = fcWeights;
    this.act3  = fcActivations;

    this.conv1ActivationRects = conv1ActivationRects;
    this.conv2ActivationRects = conv2ActivationRects;

    this.rects = rects;
    this.circles = circles;
    this.links = links;
    this.arrows = arrows;
    this.texts = texts1.concat(texts2);
  } 

  initVisualization() {
    const width = this.width;
    const height = this.height;
    
    const svg = d3.select("#d3-container")
      .append("svg")
      .attr("viewBox", `${-BASE_SIZE} 0 ${width} ${height}`)
      .attr("preserveAspectRatio", "xMaxYMin")
      // .attr("position", "absolute")
      // .attr("width", width)
      // .attr("height", height)
      // .attr("layout-css", "paddingLeft: 100")

    const g = svg.append("g").attr("id", "model-container");

    function zoomed() {
      g.attr("transform", d3.event.transform);
    }

    const markerBoxWidth = 10;
    const markerBoxHeight = 10;
    const refX = markerBoxWidth / 2;
    const refY = markerBoxHeight / 2;
    const arrowPoints = [[0, 0], [0, 10], [10, 5]];

    // g.append('defs')
    //   .append('marker')
    //   .attr('id', 'arrow')
    //   .attr('viewBox', [0, 0, markerBoxWidth, markerBoxHeight])
    //   .attr('refX', refX)
    //   .attr('refY', refY)
    //   .attr('markerWidth', markerBoxWidth)
    //   .attr('markerHeight', markerBoxHeight)
    //   .attr('orient', 'auto-start-reverse')
    //   .append('path')
    //   .attr('d', d3.line()(arrowPoints))
    //   .attr('fill', 'gray')
    //   .attr('stroke', 'gray');

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

    const conv1Rects = g.selectAll('#conv1Rect')
      .data(this.conv1ActivationRects)
      .enter()
      .append('rect')
      .attr('id', 'conv1Rect')
      .attr('width', d => d.width)
      .attr('height', d => d.height)
      .attr('x', d => d.x)
      .attr('y', d => d.y)
      .attr('opacity', 0);

    createPopupOnMouseover(g, conv1Rects, BASE_SIZE * 4, BASE_SIZE * 2, -BASE_SIZE, 0);

    g.selectAll("line")
      .data(this.links)
      .enter()
      .append("line")
      .attr("x1", d => d.x1)
      .attr("y1", d => d.y1)
      .attr("x2", d => d.x2)
      .attr("y2", d => d.y2)
      .attr("stroke", "gray")
      .attr("stroke-width", d => d.weight);

    g.selectAll("path")
      .data(this.arrows)
      .enter()
      .append("path")
      .attr('d', d => d3.line()([[d.x1, d.y1], [d.x2, d.y2]]))
      .attr('opacity', 1)
      .attr('stroke', 'gray')
      .attr('marker-end', 'url(#arrow)')
      .attr('fill', 'none');

    g.selectAll("circle")
      .data(this.circles)
      .enter()
      .append("circle")
      .attr("cx", d => d.cx)
      .attr("cy", d => d.cy)
      .attr("r", d => d.r)
      .attr("stroke", "gray")
      .attr("fill", d => colorScale(d.weight));

    g.selectAll("text")
      .data(this.texts)
      .enter()
      .append("text")
      .attr("x", d => d.x)
      .attr("y", d => d.y)
      .text(d => d.label);
  }

  update(model) {
    this.model = model;
    this.constructValues(model);
    const modelContainer = d3.select("#model-container");

    modelContainer.selectAll("rect")
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

    modelContainer.selectAll("line")
      .data(this.links)
      .attr("x1", d => d.x1)
      .attr("y1", d => d.y1)
      .attr("x2", d => d.x2)
      .attr("y2", d => d.y2)
      .attr("stroke", "gray")
      .attr("stroke-width", d => d.weight);

    modelContainer.selectAll("circle")
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

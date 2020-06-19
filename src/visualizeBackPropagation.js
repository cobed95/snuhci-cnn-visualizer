import * as d3 from "d3";
import { AnimationDescriptor, Animation } from './Animation';

// const BASIC_LARGE_RECT_LT_POINT = [0, 6];

const appendMathJax = (selection, tag, text) => {
  selection.append(tag)
    .html(
      function (d) {
        setTimeout(function(){MathJax.Hub.Queue(["Typeset",MathJax.Hub]);}, 10);

        return text;
      }
    )
}
// const pointsToStr = points => 
//   points.reduce((acc, curr) => 
//     `${acc} ${curr.reduce((accUnit, currUnit) => `${accUnit},${currUnit}`, '').substring(1)}`, '');

// const getLargeRectPoints = leftTopPoint => {
//   const [xStandard, yStandard] = leftTopPoint;
//   return [
//     leftTopPoint,
//     [xStandard, yStandard + 6],
//     [xStandard + 6, yStandard],
//     [xStandard + 6, yStandard - 6]
//   ];
// };

// const getLargeRectLines = leftTopPoint => {
//   const [xStandard, yStandard] = leftTopPoint;
//   return [
//     [[xStandard, yStandard + 2], [xStandard + 6, yStandard - 4]],
//     [[xStandard, yStandard + 4], [xStandard + 6, yStandard - 2]],
//     [[xStandard + 2, yStandard - 2], [xStandard + 2, yStandard + 4]],
//     [[xStandard + 4, yStandard - 4], [xStandard + 4, yStandard + 2]]
//   ];
// };

// const renderLargeRect = (svg, leftTopPoint) => {
//   const representation = svg.append("g");
  
//   const polygonPoints = getLargeRectPoints(leftTopPoint);
//   const lines = getLargeRectLines(leftTopPoint);

//   representation.append("polygon")
//     .attr("points", pointsToStr(polygonPoints))
//     .attr("fill", "#d3d3d3")
//     .attr("stroke", "gray")
//     .attr("stroke-width", 0.1);

//   lines.forEach(line => {
//     const [src, dst] = line;
//     const [x1, y1] = src;
//     const [x2, y2] = dst;
    
//     representation.append("line")
//       .attr("x1", x1)
//       .attr("y1", y1)
//       .attr("x2", x2)
//       .attr("y2", y2)
//       .attr("stroke", "gray")
//       .attr("stroke-width", 0.1);
//   });
// };

// const renderSmallRect = (svg, centerPoint) => {
//   const representation = svg.append("")
// }

// const renderStatics = svg => {
//   // const xRepresentation = svg.append("g");
  
//   // const xPolygonPoints = [
//   //   [0, 6],
//   //   [0, 12],
//   //   [6, 6],
//   //   [6, 0]
//   // ];

//   renderLargeRect(svg, BASIC_LARGE_RECT_LT_POINT);

//   return svg;
// };

const visualizeBackPropagation = () => {
  const bpContainer = d3.select("#bp-container");

  // bpContainer.on('click', function () {
  //   console.log('Clicked!');
  //   if (convDiagramAnimation.running) {
  //     convDiagramAnimation.stop();
  //   } else {
  //     convDiagramAnimation.run();
  //   }

  //   if (bpDiagramAnimation.running) {
  //     bpDiagramAnimation.stop();
  //   } else {
  //     bpDiagramAnimation.run();
  //   }
  // });

  // const convolutionDiagramDimensions = {
  //   minX: 0,
  //   minY: 0,
  //   width: 23,
  //   height: 12
  // };
  
  // const dimObjToStr = dimObj => {
  //   const { minX, minY, width, height } = dimObj;
  //   return `${minX} ${minY} ${width} ${height}`;
  // }

  // const convolutionDiagram1 = bpContainer.append("div")
  //   .attr("class", "bp-svg-container")
  //   .append("svg")
  //   .attr("viewBox", dimObjToStr(convolutionDiagramDimensions))
  //   .attr("position", "relative");

  // renderStatics(convolutionDiagram1);

  const text0 = "0. Forward pass is implemented as, ${{O = Convolution(X, F)}}$ where ${{X}}$ is the output from the previous layer and ${{F}}$ is the convolution filter.";
  appendMathJax(bpContainer, "p", text0);

  const convolutionDiagramContainer = bpContainer 
    .append("div")
    .attr("class", "bp-svg-container");

  const convolutionDiagram = convolutionDiagramContainer 
    .append("svg")
    .attr("viewBox", `-175 0 700 135`)
    .attr("position", "relative");

  const markerBoxWidth = 10;
  const markerBoxHeight = 10;
  const refX = markerBoxWidth / 2;
  const refY = markerBoxHeight / 2;
  const arrowPoints = [[0, 0], [0, 10], [10, 5]];
  
  convolutionDiagram.append("circle")
    .attr("cx", 150)
    .attr("cy", 75)
    .attr("r", 30)
    .attr("fill", "transparent")
    .attr("stroke", "gray");

  convolutionDiagram
    .append('defs')
    .append('marker')
    .attr('id', 'arrow')
    .attr('viewBox', [0, 0, markerBoxWidth, markerBoxHeight])
    .attr('refX', refX)
    .attr('refY', refY)
    .attr('markerWidth', markerBoxWidth)
    .attr('markerHeight', markerBoxHeight)
    .attr('orient', 'auto-start-reverse')
    .append('path')
    .attr('d', d3.line()(arrowPoints))
    .attr('fill', 'gray')
    .attr('stroke', 'gray');

  convolutionDiagram
    .append('text')
    .text('X')
    .attr('id', 'x-text--conv')
    .attr('x', 60)
    .attr('y', 30);

  convolutionDiagram
    .append('text')
    .text('F')
    .attr('id', 'f-text--conv')
    .attr('x', 60)
    .attr('y', 105);

  convolutionDiagram
    .append('text')
    .text('O')
    .attr('id', 'o-text--conv')
    .attr('x', 240)
    .attr('y', 65);

  convolutionDiagram
    .append('path')
    .attr('d', d3.line()([[0, 15], [117.5, 60]]))
    .attr('id', 'x-arrow--conv')
    .attr('opacity', 1)
    .attr('stroke', 'gray')
    .attr('marker-end', 'url(#arrow)')
    .attr('fill', 'none');

  convolutionDiagram
    .append('path')
    .attr('d', d3.line()([[0, 135], [117.5, 90]]))
    .attr('id', 'f-arrow--conv')
    .attr('opacity', 1)
    .attr('stroke', 'gray')
    .attr('marker-end', 'url(#arrow)')
    .attr('fill', 'none');

  convolutionDiagram
    .append('path')
    .attr('d', d3.line()([[180, 75], [330, 75]]))
    .attr('id', 'o-arrow--conv')
    .attr('opacity', 1)
    .attr('stroke', 'gray')
    .attr('marker-end', 'url(#arrow)')
    .attr('fill', 'none');

  const text1 = "1. During backpropagation, use ${{\\partial{E}\\over{{\\partial{O}}}}}$ to compute ${{\\partial{E}\\over{{\\partial{X}}}}}$ and ${{\\partial{E}\\over{{\\partial{F}}}}}$.";
  appendMathJax(bpContainer, "p", text1)
  
  const bpDiagramContainer = bpContainer
    .append("div")
    .attr("class", "bp-svg-container");

  const bpDiagram = bpDiagramContainer
    .append("svg")
    .attr("viewBox", '-175 0 700 135')
    .attr("position", "absolute");

  // bpDiagram
  //   .append('defs')
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

  bpDiagram.append("circle")
    .attr("cx", 150)
    .attr("cy", 75)
    .attr("r", 30)
    .attr("fill", "transparent")
    .attr("stroke", "gray");

  bpDiagram
    .append('text')
    .text('∂E/∂X')
    .attr('id', 'x-text--bp')
    .attr('opacity', 1)
    .attr('x', 50)
    .attr('y', 25);

  bpDiagram
    .append('text')
    .text('∂E/∂F')
    .attr('id', 'f-text--bp')
    .attr('opacity', 1)
    .attr('x', 50)
    .attr('y', 100);

  bpDiagram
    .append('text')
    .text('∂E/∂O')
    .attr('id', 'o-text--bp')
    .attr('opacity', 1)
    .attr('x', 225)
    .attr('y', 65);

  bpDiagram
    .append('path')
    .attr('d', d3.line()([[15, 20], [124.5, 60]]))
    .attr('id', 'x-arrow--bp')
    .attr('opacity', 1)
    .attr('stroke', 'gray')
    .attr('marker-start', 'url(#arrow)')
    .attr('fill', 'none');

  bpDiagram
    .append('path')
    .attr('d', d3.line()([[15, 130], [124.5, 90]]))
    .attr('id', 'f-arrow--bp')
    .attr('opacity', 1)
    .attr('stroke', 'gray')
    .attr('marker-start', 'url(#arrow)')
    .attr('fill', 'none');

  bpDiagram
    .append('path')
    .attr('d', d3.line()([[185, 75], [330, 75]]))
    .attr('id', 'o-arrow--bp')
    .attr('stroke', 'gray')
    .attr('marker-start', 'url(#arrow)')
    .attr('fill', 'none');


  const text2 = "2. ${{\\partial{E}\\over{{\\partial{X}}}}} = {{\\partial{E}\\over{{\\partial{O}}}}} \\cdot {{\\partial{O}\\over{{\\partial{X}}}}}, {{\\partial{E}\\over{{\\partial{F}}}}} = {{\\partial{E}\\over{{\\partial{O}}}}} \\cdot {{\\partial{O}\\over{{\\partial{F}}}}}$ (using Chain Rule).";
  appendMathJax(bpContainer, "p", text2);

  const bp2dDiagram = bpContainer
    .append("svg")
    .attr("width", 500)
    .attr("height", 260);

  const rects = [];

  let X = 40;
  let Y = 40;

  for (let x = 0; x < 3; x++) {
    for (let y = 0; y < 3; y++) {
      rects.push({
        prefix: "X",
        index: [x + 1, y + 1],
        coords: [X + 60 * x, Y + 60 * y]
      });
    }
  }

  X += 240;

  for (let x = 0; x < 2; x++) {
    for (let y = 0; y < 2; y++) {
      rects.push({
        prefix: "F",
        index: [x + 1, y + 1],
        coords: [X + 60 * x, Y + 60 * y]
      });
    }
  }

  bp2dDiagram
    .selectAll("rect")
    .data(rects)
    .enter()
    .append("rect")
    .attr("width", 60)
    .attr("height", 60)
    .attr("x", d => d.coords[0])
    .attr("y", d => d.coords[1])
    .attr("fill", "white")
    .attr("stroke", "gray");

  bp2dDiagram
    .selectAll("text")
    .data(rects)
    .enter()
    .append("text")
    .attr("x", d => d.coords[0] + 7.5)
    .attr("y", d => d.coords[1] + 32.5)
    .text(d => d.prefix + "(" + d.index[0] + ", " + d.index[1] + ")")

  const text3 = "3. Computing ${{\\partial{E}\\over{{\\partial{F}}}}}$";
  const text3A = "(a) ${{\\partial{E}\\over{{\\partial{F_{i, j}}}}}} = \\sum\\limits^{M}_{k}{ {\\partial{E}\\over{\\partial{O_k}}} \\cdot {\\partial{O_k}\\over{\\partial{F_{i, j}}}} }$"
    + "$ = \\sum\\limits^{M}_{k}{ {\\partial{E}\\over{\\partial{O_k}}} \\cdot {X_{k + (i - 1, j -1)}} }$";
  const text3B = "(b) $ {{\\partial{E}\\over{{\\partial{F}}}}} = Convolution(X, {{\\partial{E}\\over{{\\partial{O}}}}}) $"
  appendMathJax(bpContainer, "p", text3);
  appendMathJax(bpContainer, "p", text3A);
  appendMathJax(bpContainer, "p", text3B);

  const text4 = "4. Computing ${{\\partial{E}\\over{{\\partial{X}}}}}$";
  const text4A = "(a) ${{\\partial{E}\\over{{\\partial{X_{i, j}}}}}} = \\sum\\limits^{M}_{k}{ {\\partial{E}\\over{\\partial{O_k}}} \\cdot {\\partial{O_k}\\over{\\partial{X_{i, j}}}} }$,"
    + "$ $";
  const text4B = "(b) $ {{\\partial{E}\\over{{\\partial{X}}}}} = FullConvolution(F, {{\\partial{E}\\over{{\\partial{O}}}}}) $";
  appendMathJax(bpContainer, "p", text4);
  appendMathJax(bpContainer, "p", text4A);
  appendMathJax(bpContainer, "p", text4B);

  // const allIds = ['#x-arrow', '#f-arrow', '#o-arrow', '#x-text', '#f-text', '#o-text'];
  // const leftIds = ['#x-arrow', '#f-arrow', '#x-text', '#f-text'];
  // const rightIds = ['#o-arrow', '#o-text'];

  // const setOpacity = (container, id, value) => container.select(id).attr('opacity', value);
  // const hide = container => id => setOpacity(container, id, 0);
  // const show = container => id => setOpacity(container, id + id, 1);

  // const getDiagIds = diagId => ids => ids.map(id => id + diagId);
  // const getConvDiagIds = getDiagIds('--conv');
  // const getBpDiagIds = getDiagIds('--bp');

  // const convDiagAnimationDescs = [
  //   new AnimationDescriptor(getConvDiagIds(allIds), hide(convolutionDiagram)),
  //   new AnimationDescriptor(getConvDiagIds(leftIds), show(convolutionDiagram)),
  //   new AnimationDescriptor(getConvDiagIds(rightIds), show(convolutionDiagram))
  // ];
  // const convDiagAnimationOnStopDesc = new AnimationDescriptor(getConvDiagIds(allIds), show(convolutionDiagram));
  // const convDiagramAnimation = new Animation(convDiagAnimationDescs, 500, convDiagAnimationOnStopDesc);

  // const bpDiagramAnimationDescs = [
  //   new AnimationDescriptor(getBpDiagIds(allIds), hide(bpDiagram)),
  //   new AnimationDescriptor(getBpDiagIds(rightIds), show(bpDiagram)),
  //   new AnimationDescriptor(getBpDiagIds(leftIds), show(bpDiagram))
  // ];
  // const bpDiagramAnimationOnStopDesc = new AnimationDescriptor(getBpDiagIds(allIds), show(bpDiagram));
  // const bpDiagramAnimation = new Animation(bpDiagramAnimationDescs, 500, bpDiagramAnimationOnStopDesc);

  // convDiagramAnimation.run();
  // bpDiagramAnimation.run();
};

export default visualizeBackPropagation;

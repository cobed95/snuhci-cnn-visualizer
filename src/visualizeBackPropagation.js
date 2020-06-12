import * as d3 from "d3";

const visualizeBackPropagation = () => {
  const bpContainer = d3.select("#bp-container");

  bpContainer.on('click', function () {
    console.log('Clicked!');
  });

  bpContainer
    .append("body")
    .html(
      function (d) {
        setTimeout(function(){MathJax.Hub.Queue(["Typeset",MathJax.Hub]);}, 10);

        return "0. Forward pass is implemented as, ${{O = Convolution(X, F)}}$ where ${{X}}$ is the output from the previous layer and ${{F}}$ is the convolution filter.";
      } 
    )

  const convolutionDiagram = bpContainer
    .append("svg")
    .attr("width", 500)
    .attr("height", 150);

  const markerBoxWidth = 10;
  const markerBoxHeight = 10;
  const refX = markerBoxWidth / 2;
  const refY = markerBoxHeight / 2;
  const arrowPoints = [[0, 0], [0, 10], [10, 5]];

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

  convolutionDiagram.append("circle")
    .attr("cx", 150)
    .attr("cy", 75)
    .attr("r", 30)
    .attr("fill", "transparent")
    .attr("stroke", "gray");

  convolutionDiagram
    .append('text')
    .text('X')
    .attr('x', 60)
    .attr('y', 30);

  convolutionDiagram
    .append('text')
    .text('F')
    .attr('x', 60)
    .attr('y', 105);

  convolutionDiagram
    .append('text')
    .text('O')
    .attr('x', 240)
    .attr('y', 65);

  convolutionDiagram
    .append('path')
    .attr('d', d3.line()([[0, 15], [117.5, 60]]))
    .attr('stroke', 'gray')
    .attr('marker-end', 'url(#arrow)')
    .attr('fill', 'none');

  convolutionDiagram
    .append('path')
    .attr('d', d3.line()([[0, 135], [117.5, 90]]))
    .attr('stroke', 'gray')
    .attr('marker-end', 'url(#arrow)')
    .attr('fill', 'none');

  convolutionDiagram
    .append('path')
    .attr('d', d3.line()([[180, 75], [330, 75]]))
    .attr('stroke', 'gray')
    .attr('marker-end', 'url(#arrow)')
    .attr('fill', 'none');

  bpContainer
    .append("body")
    .html(
      function (d) {
        setTimeout(function(){MathJax.Hub.Queue(["Typeset",MathJax.Hub]);}, 10);

        return "1. During backpropagation, use ${{\\partial{E}\\over{{\\partial{O}}}}}$ to compute ${{\\partial{E}\\over{{\\partial{X}}}}}$ and ${{\\partial{E}\\over{{\\partial{F}}}}}$.";
      } 
    );

  const bpDiagram = bpContainer
    .append("svg")
    .attr("width", 500)
    .attr("height", 150);

  bpDiagram
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

  bpDiagram.append("circle")
    .attr("cx", 150)
    .attr("cy", 75)
    .attr("r", 30)
    .attr("fill", "transparent")
    .attr("stroke", "gray");

  bpDiagram
    .append('text')
    .text('∂E/∂X')
    .attr('x', 50)
    .attr('y', 25);

  bpDiagram
    .append('text')
    .text('∂E/∂F')
    .attr('x', 50)
    .attr('y', 100);

  bpDiagram
    .append('text')
    .text('∂E/∂O')
    .attr('x', 225)
    .attr('y', 65);

  bpDiagram
    .append('path')
    .attr('d', d3.line()([[15, 20], [124.5, 60]]))
    .attr('stroke', 'gray')
    .attr('marker-start', 'url(#arrow)')
    .attr('fill', 'none');

  bpDiagram
    .append('path')
    .attr('d', d3.line()([[15, 130], [124.5, 90]]))
    .attr('stroke', 'gray')
    .attr('marker-start', 'url(#arrow)')
    .attr('fill', 'none');

  bpDiagram
    .append('path')
    .attr('d', d3.line()([[185, 75], [330, 75]]))
    .attr('stroke', 'gray')
    .attr('marker-start', 'url(#arrow)')
    .attr('fill', 'none');

  bpContainer
    .append("body")
    .html(
      function (d) {
        setTimeout(function(){MathJax.Hub.Queue(["Typeset",MathJax.Hub]);}, 10);

        return "2. ${{\\partial{E}\\over{{\\partial{X}}}}} = {{\\partial{E}\\over{{\\partial{O}}}}} \\cdot {{\\partial{O}\\over{{\\partial{X}}}}}, {{\\partial{E}\\over{{\\partial{F}}}}} = {{\\partial{E}\\over{{\\partial{O}}}}} \\cdot {{\\partial{O}\\over{{\\partial{F}}}}}$ (using Chain Rule).";
      } 
    );

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

  bpContainer.append("body")
    .html(
      function (d) {
        setTimeout(function(){MathJax.Hub.Queue(["Typeset",MathJax.Hub]);}, 10);

        return "3. Computing ${{\\partial{E}\\over{{\\partial{F}}}}}$"
      }
    )

  bpContainer
    .append("body")
    .html(
      function (d) {
        setTimeout(function(){MathJax.Hub.Queue(["Typeset",MathJax.Hub]);}, 10);

        let string = "(a) ${{\\partial{E}\\over{{\\partial{F_{i, j}}}}}} = \\sum\\limits^{M}_{k}{ {\\partial{E}\\over{\\partial{O_k}}} \\cdot {\\partial{O_k}\\over{\\partial{F_{i, j}}}} }$"
        string += "$ = \\sum\\limits^{M}_{k}{ {\\partial{E}\\over{\\partial{O_k}}} \\cdot {X_{k + (i - 1, j -1)}} }$"

        return string;
      } 
    );

  bpContainer
    .append("body")
    .html(
      function (d) {
        setTimeout(function(){MathJax.Hub.Queue(["Typeset",MathJax.Hub]);}, 10);

        let string = "(b) $ {{\\partial{E}\\over{{\\partial{F}}}}} = Convolution(X, {{\\partial{E}\\over{{\\partial{O}}}}}) $";
        return string;
      } 
    );

  bpContainer.append("body")
    .html(
      function (d) {
        setTimeout(function(){MathJax.Hub.Queue(["Typeset",MathJax.Hub]);}, 10);

        return "4. Computing ${{\\partial{E}\\over{{\\partial{X}}}}}$"
      }
    );

  bpContainer
    .append("body")
    .html(
      function (d) {
        setTimeout(function(){MathJax.Hub.Queue(["Typeset",MathJax.Hub]);}, 10);

        let string = "(a) ${{\\partial{E}\\over{{\\partial{X_{i, j}}}}}} = \\sum\\limits^{M}_{k}{ {\\partial{E}\\over{\\partial{O_k}}} \\cdot {\\partial{O_k}\\over{\\partial{X_{i, j}}}} }$,"
        string += "$ $";

        return string;
      } 
    );

  bpContainer
    .append("body")
    .html(
      function (d) {
        setTimeout(function(){MathJax.Hub.Queue(["Typeset",MathJax.Hub]);}, 10);

        let string = "(b) $ {{\\partial{E}\\over{{\\partial{X}}}}} = FullConvolution(F, {{\\partial{E}\\over{{\\partial{O}}}}}) $";
        return string;
      } 
    );
};

export default visualizeBackPropagation;

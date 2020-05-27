<template>
  <v-card>
    <svg></svg>
  </v-card>
</template>

<script>
import * as d3 from 'd3'

export default {
  data() {
    return {
      num: 10
    }
  },

  mounted() {
    const svg = d3.select('svg');
    const [svgWidth, svgHeight] = [500, 500]
    const margin = {
      top: 20,
      right: 10,
      bottom: 30,
      left: 40
    };
    const width = svgWidth - margin.right - margin.left;
    const height = svgHeight - margin.top - margin.bottom;

    const translate = (x, y) => `translate(${x}, ${y})`;
    const container = svg.append('g')
      .attr('transform', translate(margin.left, margin.right));
    
    const data = [
      {
        a: 1,
        b: 2
      },
      {
        a: 5,
        b: 10
      }
    ]
    const circles = container.selectAll('circle').data(data).enter().append('circle')
      .attr('cx', d => d.a)
      .attr('cy', d => d.b)
      .attr('r', 3.5)
      .style('fill', d => '#3366cc')
  },

  computed: {
    value() {
      return 10
    }
  }
}
</script>

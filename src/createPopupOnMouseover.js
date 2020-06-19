import * as d3 from 'd3';

const colorScale = d3.scaleLinear().domain([0.0, 1.0]).range(['white', 'black']);

const getStandardAndCellSize = d => {
  if (d.width)
    return { 
      standard: [d.x, d.y],
      cellSize: d.width
    };
  else if (d.r)
    return {
      standard: [d.cx - d.r, d.cy - d.r],
      cellSize: d.r * 2
    };

  const defaultStandard = [d.x, d.y];
  const defaultCellSize = 10;
  console.log(`cell size is undefined. Using default cell size ${defaultCellSize}.`)
  return { defaultStandard, defaultCellSize };
};

const getPopupDirection = (standard, popupWidth, popupHeight, minX, minY) => {
  const [x, y] = standard;
  const xReach = x - popupWidth;
  const yReach = y - popupHeight;
  if (xReach >= minX && yReach >= minY)
    // Left Top
    return 0;
  else if (xReach < minX && yReach >= minY)
    // Right Top
    return 1;
  else if (xReach >= minX && yReach < minY)
    // Left Bottom
    return 2;
  else 
    // Right Bottom
    return 3;
}

const getPoints = (d, popupWidth, popupHeight, minX, minY) => {
  const { standard, cellSize } = getStandardAndCellSize(d);

  const popupDirection = getPopupDirection(standard, popupWidth, popupHeight, minX, minY);
  const [x, y] = standard;
  switch (popupDirection) {
    case 0:
      return [
        [x - popupWidth, y - popupHeight],
        [x - popupWidth, y],
        standard,
        [x, y - popupHeight]
      ];
    case 1:
      return [
        [x + cellSize, y - popupHeight],
        [x + cellSize, y],
        [x + cellSize + popupWidth, y],
        [x + cellSize + popupWidth, y - popupHeight]
      ];
    case 2:
      return [
        [x - popupWidth, y + cellSize],
        [x - popupWidth, y + cellSize + popupHeight],
        [x, y + cellSize + popupHeight],
        [x, y + cellSize],
      ];
    case 3:
      return [
        [x + cellSize, y + cellSize],
        [x + cellSize, y + cellSize + popupHeight],
        [x + cellSize + popupWidth, y + cellSize + popupHeight],
        [x + cellSize + popupWidth, y + cellSize]
      ];
    default:
      throw new Error(`unexpected popup direction: ${popupDirection}`);
  }
};

const pointsToStr = points => 
  points.reduce((acc, curr) => 
    `${acc} ${curr.reduce((accUnit, currUnit) => `${accUnit},${currUnit}`, '').substring(1)}`, '');

const giveId = selection => {
  const selectionWithId = selection.attr('id', 'popup');
  return selectionWithId;
};

const getContainerConstructor = (container, popupWidth, popupHeight, minX, minY) => d => {
  const containerPoints = getPoints(d, popupWidth, popupHeight, minX, minY);
  const pivot = containerPoints[0];
  const popupContainer = container.selectAll('polygon')
    .data([0])
    .enter()
    .append('polygon')
    .attr('points', pointsToStr(containerPoints))
    .attr('fill', 'white')
    .attr('stroke', 'gray');
  return { popupContainer, pivot };
};

const getTextConstructor = (container, pivot) => d => {
  const [x, y] = pivot;
  const [offsetX, offsetY] = d.offset;
  const text = container.append('text')
    .attr('x', () => x + offsetX)
    .attr('y', () => y + offsetY)
    .attr('font-size', () => '2em')
    .text(d.text);
  return text;
};

const getRectConstructor = (container, pivot) => d => {
  const [x, y] = pivot;
  const { data, offsetX, offsetY, totalWidth } = d;
  // const offsetX = 240;
  // console.log('data', data)
  const visualizedRect = container.append('g')
    .selectAll('rect')
    .data(data)
    .enter()
    .append('rect')
    .attr('x', data => data.x + x + offsetX)
    .attr('y', data => data.y + y + offsetY + 10)
    .attr('width', data => data.width)
    .attr('height', data => data.height)
    .attr('stroke', 'gray')
    .attr("fill", d => {
      if (typeof d === "Array") 
        return colorScale(d.weight[0])

      return colorScale(d.weight)
    });
  return { visualizedRect, offsetRect: offsetX + totalWidth };
}

const getXConstructor = (container, pivot) => d => getRectConstructor(container, pivot)({ data: d.inputs, offsetX: 240, offsetY: 0, totalWidth: 3 * 28 });
const getFConstructor = (container, pivot) => d => getRectConstructor(container, pivot)({ data: d.filters, offsetX: 350, offsetY: 24, totalWidth: 3 * 20 });

const createPopupOnMouseover = (container, selection, popupWidth, popupHeight, minX, minY) => {
  selection.on('mouseenter', d => {
    // const constructors = [
    //   getContainerConstructor(container, popupWidth, popupHeight, minX, minY)
    // ];

    // constructors.map(constructor => constructor(d)).map(giveId);
    const { popupContainer, pivot } = getContainerConstructor(container, popupWidth, popupHeight, minX, minY)(d);
    giveId(popupContainer);
    const forwardPassText1 = {
      text: 'O = Convolution(',
      offset: [10, 3 * 28]
    }
    giveId(getTextConstructor(container, pivot)(forwardPassText1));
    const { visualizedRect: visualizedInput, offsetRect: offsetInput } = getXConstructor(container, pivot)(d);
    giveId(visualizedInput);
    const forwardPassText2 = {
      text: ', ',
      offset: [offsetInput + 10, 3 * 28]
    };
    giveId(getTextConstructor(container, pivot)(forwardPassText2));
    const { visualizedRect: visualizedFilter, offsetRect: offsetFilter } = getFConstructor(container, pivot)(d);
    giveId(visualizedFilter);
    const forwardPassText3 = {
      text: ')',
      offset: [offsetFilter + 10, 3 * 28]
    };
    giveId(getTextConstructor(container, pivot)(forwardPassText3));
    const backwardPassText1 = {
      text: '∂E/∂F = Convolution(X, ∂E/∂O)',
      offset: [10, (3 * 28) + 60]
    };
    giveId(getTextConstructor(container, pivot)(backwardPassText1));
    const backwardPassText2 = {
      text: '∂E/∂X = FullConvolution(F, ∂E/∂O)',
      offset: [10, (3 * 28) + 120]
    };
    giveId(getTextConstructor(container, pivot)(backwardPassText2));
  }).on('mouseleave', d => {
    container.selectAll('#popup').data([]).exit().remove();
  });
};

export default createPopupOnMouseover;

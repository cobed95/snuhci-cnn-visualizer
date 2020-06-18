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
  const [x, y] = pivot
  const text = container.append('text')
    .attr('x', () => x)
    .attr('y', () => y + 20)
    .text('awiefjaoweifjaew');
  return text;
};

const createPopupOnMouseover = (container, selection, popupWidth, popupHeight, minX, minY) => {
  selection.on('mouseenter', d => {
    // const constructors = [
    //   getContainerConstructor(container, popupWidth, popupHeight, minX, minY)
    // ];

    // constructors.map(constructor => constructor(d)).map(giveId);
    const { popupContainer, pivot } = getContainerConstructor(container, popupWidth, popupHeight, minX, minY)(d);
    giveId(popupContainer);
    giveId(getTextConstructor(container, pivot)(d));
  }).on('mouseleave', d => {
    container.selectAll('#popup').data([]).exit().remove();
  });
};

export default createPopupOnMouseover;

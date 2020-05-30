import * as tf from '@tensorflow/tfjs';

import { IMAGE_W } from './data';

function getActivationTable(model, examples, layerIdx, imageSize) {
  const layer = model.getLayer(undefined, layerIdx);

  let filters = tf.tidy(() =>
    layer.kernel.val.transpose([3, 0, 1, 2]).unstack()
  );

  if (filters[0].shape[2] > 3) {
    filters = filters.map((d, i) => `Filter ${i + 1}`);
  }

  filters.unshift("Input");

  const activations = tf.tidy(() => {
    return getActivation(examples, model, layer).unstack();
  });
  const activationImageSize = activations[0].shape[0]; // e.g. 24

  const numFilters = activations[0].shape[2]; // e.g. 8

  const filterActivations = activations.map((activation, i) => {
    const unpackedActivations = Array(numFilters)
      .fill(0)
      .map((_, i) =>
        activation.slice(
          [0, 0, i],
          [activationImageSize, activationImageSize, 1]
        )
      );

    const inputExample = tf.tidy(() =>
      examples.slice([i], [1]).reshape([imageSize, imageSize, 1])
    );
    unpackedActivations.unshift(inputExample);
    return unpackedActivations;
  });
  return {
    filters,
    filterActivations
  };
};

const getActivation = (input, model, layer) => {
  const activationModel = tf.model({
    inputs: model.input,
    outputs: layer.output
  });
  return activationModel.predict(input);
};

const renderImage = async (container, tensor, imageOpts) => {
  const resized = tf.tidy(() =>
    tf.image
      .resizeNearestNeighbor(tensor, [imageOpts.height, imageOpts.width])
      .clipByValue(0.0, 1.0)
  );
  const canvas = document.createElement("canvas");
  canvas.width = imageOpts.width;
  canvas.height = imageOpts.height;
  canvas.style = `margin: 4px; width:${imageOpts.width}px; height:${
    imageOpts.height
  }px`;
  container.appendChild(canvas);
  await tf.browser.toPixels(resized, canvas);
  resized.dispose();
};

const renderImageTable = (container, headerData, data) => {
  let table = d3.select(container).select("table");

  if (table.size() === 0) {
    table = d3.select(container).append("table");
    table.append("thead").append("tr");
    table.append("tbody");
  }

  const headers = table
    .select("thead")
    .select("tr")
    .selectAll("th")
    .data(headerData);

  const headersEnter = headers.enter().append("th");
  headers.merge(headersEnter).each((d, i, group) => {
    const node = group[i];

    if (typeof d === "string") {
      node.innerHTML = d;
    } else {
      renderImage(node, d, {
        width: 25,
        height: 25
      });
    }
  });

  const rows = table
    .select("tbody")
    .selectAll("tr")
    .data(data);

  const rowsEnter = rows.enter().append("tr");

  const cells = rows
    .merge(rowsEnter)
    .selectAll("td")
    .data(d => d);

  const cellsEnter = cells.enter().append("td");
  
  cells.merge(cellsEnter).each((d, i, group) => {
    const node = group[i];
    renderImage(node, d, {
      width: 40,
      height: 40
    });
  });

  cells.exit().remove();
  rows.exit().remove();
};

export const runImage = (model, image, layerIdx) => {
  const result = getActivationTable(model, image, layerIdx, IMAGE_W);

  const filters = result.filters;
  const filterActivations = result.filterActivations[0];

  return { filters, filterActivations };
};

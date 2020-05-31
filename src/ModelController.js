import * as tf from '@tensorflow/tfjs';
import { MDCSlider } from '@material/slider';
import { MDCSelect } from '@material/select';
import { 
  optimizer, 
  batchSize, 
  validationSplit, 
  trainEpochs 
} from './parameters';

export default class ModelController {
  constructor(model, data, visualizer) {
    // Compile tf model and set initialize variables.
    model.compile({
      optimizer,
      loss: 'categoricalCrossentropy',
      metrics: ['accuracy']
    });
    this.model = model;
    this.trainData = data.getTrainData();
    this.testData = data.getTestData();
    this.valAcc = 0;

    // Set visualizer.
    this.visualizer = visualizer;
    
    // Initialize and set DOM elements and related variables.
    const select = document.querySelector(".mdc-select");
    this.activationExampleSelect = new MDCSelect(select);

    this.playButton = document.querySelector(".mdc-button");
    this.play = false;

    const slider = document.querySelector(".mdc-slider");
    this.progressSlider = new MDCSlider(slider);
    this.progressSlider.layout();
    this.progressSlider.value = 0;

    // Draw examples to the MDCSelect element.
    const listItemContents = Array.from(document.getElementsByClassName("mdc-list-item__graphic"))
    const { activationExampleArr } = this.visualizer;
    
    const draw = async () => {
      for (let i = 0; i < 10; i++) {
        const imageTensor = tf.tidy(() => {
          // Reshape the image to 28x28 px
          return activationExampleArr.slice([i, 0], [1, activationExampleArr.shape[1]])
            .reshape([28, 28, 1]);
        });
        
        const canvas = document.createElement('canvas');
        canvas.width = 28;
        canvas.height = 28;
        canvas.style = 'margin: 4px;';
        await tf.browser.toPixels(imageTensor, canvas);
        listItemContents[i].appendChild(canvas);
    
        imageTensor.dispose();
      }
    }

    draw();
    
    // Set reference to this object for scoping.
    const that = this;

    // Set event listeners.
    this.activationExampleSelect.listen("MDCSelect:change", () => {
      that.visualizer.activationExample = that.activationExampleSelect.selectedIndex;
    });

    this.playButton.addEventListener("click", () => {
      that.play = !that.play
      if (that.play) {
        that.playButton.textContent = "pause";
        that.startTraining();
      } else {
        that.playButton.textContent = "play";
        that.stopTraining();
      }
    })

    const totalNumBatches =
      Math.ceil(this.trainData.xs.shape[0] * (1 - validationSplit) / batchSize) *
      trainEpochs;
    this.progressSlider.max = totalNumBatches;
  }

  getBatches(isData) {
    if (isData)
      return this.trainData.xs.slice((this.progressSlider.value) * batchSize)
    return this.trainData.labels.slice((this.progressSlider.value) * batchSize);
  }
  
  async startTraining() {
    if (this.model.stopTraining)
      this.model.stopTraining = false;
    
    const dataBatches = this.getBatches(true);
    const labelBatches = this.getBatches(false);

    const that = this;
    await this.model.fit(dataBatches, labelBatches, {
      batchSize,
      validationSplit,
      epochs: trainEpochs,
      callbacks: {
        onBatchEnd: function (batch, logs) {
          console.log(batch);
          console.log('batch', that.progressSlider.value, 'done');
          that.progressSlider.stepUp();
          that.visualizer.update(that.model);
        },
        onEpochEnd: function (epoch, logs) {
          that.valAcc = logs.val_acc
          const testResult = that.model.evaluate(that.testData.xs, that.testData.labels);
          const testAccPercent = testResult[1].dataSync()[0] * 100;
          const finalValAccPercent = that.valAcc * 100;
          console.log(`Final validation accuracy: ${finalValAccPercent.toFixed(1)}%`);
          console.log(`Final test accuracy: ${testAccPercent.toFixed(1)}%`)
        }
      }
    })
  }

  stopTraining() {
    this.model.stopTraining = true;
  }
}
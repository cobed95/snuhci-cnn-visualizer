import { MDCSlider } from '@material/slider';
import { 
  optimizer, 
  batchSize, 
  validationSplit, 
  trainEpochs 
} from './parameters'

export default class ModelController {
  constructor(model, data, container) {
    model.compile({
      optimizer,
      loss: 'categoricalCrossentropy',
      metrics: ['accuracy']
    });
    this.model = model;
    this.trainData = data.getTrainData();
    this.testData = data.getTestData();
    this.valAcc = 0;

    const { children } = container.item(0);
    const buttonWrapper = children.item(0);
    this.playButton = buttonWrapper.children.item(0);
    this.play = false;
    const that = this;
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

    const slider = children.item(1);
    this.progressSlider = new MDCSlider(slider);
    
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
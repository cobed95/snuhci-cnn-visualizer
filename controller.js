import { MDCSlider } from "@material/slider";

export default class Controller {
  constructor(container) {
    const { children } = container.item(0);
    const buttonWrapper = children.item(0);
    const slider = children.item(1);
    // const [buttonWrapper, slider] = children;
    const playButton = buttonWrapper.children.item(0);

    this.epochSlider = new MDCSlider(slider);
    this.epochSlider.listen('MDCSlider:change', (a) => {
      console.log(a);
    })

    this.play = false;
    const playButtonClickHandler = () => {
      this.play = !this.play;
      if (this.play)
        playButton.textContent = "pause";
      else
        playButton.textContent = "play";
    }
    playButton.addEventListener("click", playButtonClickHandler);

    const increaseEpoch = () => {
      if (this.play)
        this.epochSlider.value++
    }
    setInterval(increaseEpoch, 1000)
  }
}
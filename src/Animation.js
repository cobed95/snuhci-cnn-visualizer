export class AnimationDescriptor {
  constructor(targetIds, action) {
    this.targetIds = targetIds;
    this.action = action;
  }
}

export class Animation {
  constructor(descriptors, ms, onStopDescriptor) {
    this.sequence = descriptors.map(
      descriptor => () => {
        const { targetIds, action } = descriptor
        targetIds.forEach(action)
      }
    );
    this.ms = ms;
    this.seqIdx = 0;
    if (onStopDescriptor) {
      const { targetIds, action } = onStopDescriptor;
      this.onStop = () => targetIds.forEach(action);
    }
    this.running = false;
  }
  
  run() {
    const that = this;
    this.intervalId = setInterval(() => {
      that.next();
    }, this.ms);
    this.running = true;
  }

  next() {
    this.sequence[this.seqIdx]();
    this.seqIdx = (this.seqIdx + 1) % this.sequence.length;
  }

  stop() {
    clearInterval(this.intervalId);
    this.running = false;

    if (this.onStop)
      this.onStop();
  }
}
class Sprite {
  constructor(context, width, height, x, y, numberFrames, image) {
    this.context = context;
    this.width = width;
    this.height = height;
    this.startX = x;
    this.startY = y;
    this.image = image;
    this.totalFrames = numberFrames;
    this.tickCount = 0;
    this.frameCount = 0;
  }

  update() {
    this.tickCount++;
    if (this.tickCount % 10 === 0) {
      this.frameCount = (this.frameCount + 1) % this.totalFrames;
    }
  }

  render(x, y) {
    this.context.drawImage(
      this.image,
      this.startX + this.width * this.frameCount, /* source x */
      this.startY, /* source y */
      this.width,
      this.height,
      x, /* canvas x */
      y, /* canvas y */
      this.width,
      this.height);
  }
}

class BasePlayer {
  constructor(context, username, initialX = 0, initialY = 0, initialDir = MOVE_DOWN, selectedCharacter = 0) {
    this.xVelocity = 0;
    this.yVelocity = 0;
    this.x = initialX;
    this.y = initialY;
    this._username = username;

    this.context = context;
    this.characters = [new Bijou(context), new Boss(context)];
    this.selectedCharacter = selectedCharacter;
    this.direction = initialDir;
    this.dataChannels = [];
  }

  update() {
    this.x += this.xVelocity;
    if (this.x > CANVAS_WIDTH) {
      this.x = -30;
    }
    if (this.x < -30) {
      this.x = CANVAS_WIDTH;
    }
    this.y += this.yVelocity;
    if (this.y > CANVAS_HEIGHT) {
      this.y = -30;
    }
    if (this.y < -30) {
      this.y = CANVAS_HEIGHT;
    }
    this.characters[this.selectedCharacter].update(this.direction);
  }

  render() {
    this.characters[this.selectedCharacter].render(this.x, this.y);
  }

  setDataChannel(channel) {
    this.dataChannels.push(channel);
  }
}

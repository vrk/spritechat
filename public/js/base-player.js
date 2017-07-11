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
  }

  update() {
    this.x += this.xVelocity;
    this.y += this.yVelocity;
    this.characters[this.selectedCharacter].update(this.direction);
  }

  render() {
    this.characters[this.selectedCharacter].render(this.x, this.y);
  }
}

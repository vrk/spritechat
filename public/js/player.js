const PLAYER_PX_UPDATES_PER_TICK = 2;

class Player {
  constructor(context) {
    this.onKeyDown = this.onKeyDown.bind(this);
    this.onKeyUp = this.onKeyUp.bind(this);

    document.addEventListener('keyup', this.onKeyUp);
    document.addEventListener('keydown', this.onKeyDown);

    this.xVelocity = 0;
    this.yVelocity = 0;
    this.x = 0;
    this.y = 0;
    this.arrowsPressed = [];

    this.character = new Bijou(context);
    this.direction = MOVE_DOWN;
  }

  update() {
    this.x += this.xVelocity;
    this.y += this.yVelocity;
    this.character.update(this.direction);
  }

  render() {
    this.character.render(this.x, this.y);
  }

  // Private
  onKeyDown(event) {
    const key = event.key;
    if (key === 'ArrowLeft') {
      this.xVelocity = -PLAYER_PX_UPDATES_PER_TICK;
      this.arrowsPressed.push(key);
      this.direction = MOVE_LEFT;
    } else if (key === 'ArrowRight') {
      this.xVelocity = PLAYER_PX_UPDATES_PER_TICK;
      this.arrowsPressed.push(key);
      this.direction = MOVE_RIGHT;
    } else if (key === 'ArrowDown') {
      this.yVelocity = PLAYER_PX_UPDATES_PER_TICK;
      this.arrowsPressed.push(key);
      this.direction = MOVE_DOWN;
    } else if (key === 'ArrowUp') {
      this.yVelocity = -PLAYER_PX_UPDATES_PER_TICK;
      this.arrowsPressed.push(key);
      this.direction = MOVE_UP;
    }
  }

  onKeyUp(event) {
    const key = event.key;
    this.arrowsPressed = this.arrowsPressed.filter(element => element !== key);
    if (!this.arrowsPressed.includes('ArrowLeft') && !this.arrowsPressed.includes('ArrowRight')) {
      this.xVelocity = 0;
    }
    if (!this.arrowsPressed.includes('ArrowDown') && !this.arrowsPressed.includes('ArrowUp')) {
      this.yVelocity = 0;
    }
  }
}

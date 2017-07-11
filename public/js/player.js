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

    const bijouImage = new Image();
    bijouImage.src = 'images/bijou-sheet.png';

    this.downSprite = new Sprite(context, 37, 34, 2, 64, 4, bijouImage);
    this.upSprite = new Sprite(context, 37, 34, 2, 64+74, 4, bijouImage);
    this.leftSprite = new Sprite(context, 32, 34, 2+296, 64+37, 4, bijouImage);
    this.rightSprite = new Sprite(context, 32, 34, 2, 64+37, 4, bijouImage);

    this.sprite = this.downSprite;
    this.direction = MOVE_DOWN;
  }

  update() {
    this.x += this.xVelocity;
    this.y += this.yVelocity;

    switch (this.direction) {
      case MOVE_DOWN:
        this.sprite = this.downSprite;
      break;
      case MOVE_UP:
        this.sprite = this.upSprite;
      break;
      case MOVE_LEFT:
        this.sprite = this.leftSprite;
      break;
      case MOVE_RIGHT:
        this.sprite = this.rightSprite;
      break;
    }
    this.sprite.update();
  }

  render() {
    this.sprite.render(this.x, this.y);
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

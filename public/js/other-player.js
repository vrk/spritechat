class OtherPlayer extends BasePlayer {
  constructor(context, socket, username, initialX, initialY, initialDir, selectedCharacter) {
    super(context, username, initialX, initialY, initialDir, selectedCharacter);
    this.goalX = initialX;
    this.goalY = initialY;
  }

  onNewMessage(message) {
    if (message.action === 'move' && message.username === this._username) {
      this.goalX = message.x;
      this.goalY = message.y;
      this.goalXVelocity = message.xVelocity;
      this.goalYVelocity = message.yVelocity;
      this.goalDirection = message.direction;
      this.selectedCharacter = message.selectedCharacter;
    } else if (message.action === 'look' && message.username === this._username) {
      this.selectedCharacter = message.selectedCharacter;
    }
  }

  update() {
    const xDelta = this.goalX - this.x;
    const yDelta = this.goalY - this.y;

    this.direction = this.goalDirection;

    const forceMoveRight = xDelta < -CANVAS_WIDTH / 2;
    const forceMoveLeft = xDelta > CANVAS_WIDTH / 2;
    if (forceMoveLeft || (xDelta < 0 && !forceMoveRight)) {
      // Need to move left to get to goal.
      this.direction = MOVE_LEFT;
      this.x -= PLAYER_PX_UPDATES_PER_TICK;
    } else if (forceMoveRight || (xDelta > 0 && !forceMoveLeft)) {
      // Need to move right to get to goal.
      this.direction = MOVE_RIGHT;
      this.x += PLAYER_PX_UPDATES_PER_TICK;
    }

    const forceMoveDown = yDelta < -CANVAS_HEIGHT / 2;
    const forceMoveUp = yDelta > CANVAS_HEIGHT / 2;
    if (forceMoveUp || (yDelta < 0 && !forceMoveDown)) {
      // Need to move up to get to goal.
      this.direction = MOVE_UP;
      this.y -= PLAYER_PX_UPDATES_PER_TICK;
    } else if (forceMoveDown || (yDelta > 0 && !forceMoveUp)) {
      // Need to move down to get to goal.
      this.direction = MOVE_DOWN;
      this.y += PLAYER_PX_UPDATES_PER_TICK;
    }

    this.updateWrapAround();

    this.characters[this.selectedCharacter].update(this.direction);
  }
}

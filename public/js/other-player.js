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


    } else if (message.action === 'look' && message.username === this._username) {
      this.selectedCharacter = message.selectedCharacter;
    }
  }

  update() {
    const xDelta = this.goalX - this.x;
    const yDelta = this.goalY - this.y;

    if (xDelta < 0 || xDelta > CANVAS_WIDTH / 2) {
      // Need to move left to get to goal.
      this.direction = MOVE_LEFT;
      this.x -= PLAYER_PX_UPDATES_PER_TICK;
    } else if (xDelta > 0 || xDelta < -CANVAS_WIDTH / 2) {
      // Need to move right to get to goal.
      this.direction = MOVE_RIGHT;
      this.x += PLAYER_PX_UPDATES_PER_TICK;
    }

    if (yDelta < 0 || yDelta > CANVAS_HEIGHT / 2) {
      // Need to move up to get to goal.
      this.direction = MOVE_UP;
      this.y -= PLAYER_PX_UPDATES_PER_TICK;
    } else if (yDelta > 0 || yDelta < -CANVAS_HEIGHT / 2) {
      // Need to move down to get to goal.
      this.direction = MOVE_DOWN;
      this.y += PLAYER_PX_UPDATES_PER_TICK;
    }

    this.updateWrapAround();

    this.characters[this.selectedCharacter].update(this.direction);
  }
}

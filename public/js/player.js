const PLAYER_PX_UPDATES_PER_TICK = 2;

class Player {
  constructor(context, socket, username='bijou') {
    this.onKeyDown = this.onKeyDown.bind(this);
    this.onKeyUp = this.onKeyUp.bind(this);
    this._onReceiveServerMessage = this._onReceiveServerMessage.bind(this);

    document.addEventListener('keyup', this.onKeyUp);
    document.addEventListener('keydown', this.onKeyDown);

    this.xVelocity = 0;
    this.yVelocity = 0;
    this.x = 0;
    this.y = 0;
    this.arrowsPressed = [];

    this.prevDir = null;
    this.prevXVelocity = null;
    this.prevYVelocity = null;

    this.character = new Bijou(context);
    this.direction = MOVE_DOWN;
    this.needsUpdate = true;

    this._socket = socket;
    this._socket.addEventListener('message', this._onReceiveServerMessage);

    const outMessage = {
      action: 'enter',
      username
    };
    // Connection opened
    this._socket.send(JSON.stringify(outMessage));
  }

  _onReceiveServerMessage(event) {
    console.log(event.data);
    const message = JSON.parse(event.data);
    if (message.action === 'entered') {
      this._username = message.username;
    }
  }


  update() {
    this.x += this.xVelocity;
    this.y += this.yVelocity;
    this.character.update(this.direction);

    if (this.needsUpdate) {
      this.needsUpdate = false;
      console.log('diff');
      const outMessage = {
        action: 'move',
        username: this._username,
        direction: this.direction,
        xVelocity: this.xVelocity,
        yVelocity: this.yVelocity
      };
      requestAnimationFrame( () => {
        this._socket.send(JSON.stringify(outMessage));
      });
    }
  }

  render() {
    this.character.render(this.x, this.y);
  }

  // Private
  onKeyDown(event) {
    const key = event.key;

    const prevX = this.xVelocity;
    const prevY = this.yVelocity;
    const prevDir = this.direction;

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
    this.needsUpdate |= prevX !== this.xVelocity || prevY !== this.yVelocity || prevDir !== this.direction;
  }

  onKeyUp(event) {
    const key = event.key;
    this.arrowsPressed = this.arrowsPressed.filter(element => element !== key);
    const prevX = this.xVelocity;
    const prevY = this.yVelocity;
    if (!this.arrowsPressed.includes('ArrowLeft') && !this.arrowsPressed.includes('ArrowRight')) {
      this.xVelocity = 0;
    }
    if (!this.arrowsPressed.includes('ArrowDown') && !this.arrowsPressed.includes('ArrowUp')) {
      this.yVelocity = 0;
    }
    this.needsUpdate |= prevX !== this.xVelocity || prevY !== this.yVelocity;
  }
}

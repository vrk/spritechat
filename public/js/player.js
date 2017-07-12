class Player extends BasePlayer {
  constructor(context, socket, username='bijou') {
    super(context, username);
    this.onKeyDown = this.onKeyDown.bind(this);
    this.onKeyUp = this.onKeyUp.bind(this);
    this._onReceiveServerMessage = this._onReceiveServerMessage.bind(this);

    document.addEventListener('keyup', this.onKeyUp);
    document.addEventListener('keydown', this.onKeyDown);

    this.arrowsPressed = [];

    this.prevDir = null;
    this.prevXVelocity = null;
    this.prevYVelocity = null;

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
    const message = JSON.parse(event.data);
    if (message.action === 'entered') {
      this._username = message.username;
    }
  }

  update() {
    super.update();
    if (this.needsUpdate) {
      this.needsUpdate = false;
      const outMessage = {
        action: 'move',
        username: this._username,
        direction: this.direction,
        xVelocity: this.xVelocity,
        yVelocity: this.yVelocity,
        x: this.x,
        y: this.y
      };

      this.dataChannels = this.dataChannels.filter(c => c.readyState === 'open');
      for (const dataChannel of this.dataChannels) {
        console.log('sending over data channel!');
        dataChannel.send(JSON.stringify(outMessage));
      }
    }
  }

  setDataChannel(channel) {
    super.setDataChannel(channel);
    this.needsUpdate = true;
    this.update();
  }

  changeLook() {
    this.selectedCharacter = (this.selectedCharacter + 1) % this.characters.length;
    const outMessage = {
      action: 'look',
      username: this._username,
      selectedCharacter: this.selectedCharacter
    };
    this._socket.send(JSON.stringify(outMessage));
  }

  dance() {

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

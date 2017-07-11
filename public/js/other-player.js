class OtherPlayer {
  constructor(context, socket, username, initialX = 0, initialY = 0, selectedCharacter = 0) {
    this._onReceiveServerMessage = this._onReceiveServerMessage.bind(this);

    this.xVelocity = 0;
    this.yVelocity = 0;
    this.x = initialX;
    this.y = initialY;
    this.arrowsPressed = [];

    this.prevDir = null;
    this.prevXVelocity = null;
    this._username = username;
    this.prevYVelocity = null;

    this.characters = [new Bijou(context), new Boss(context)];
    this.selectedCharacter = selectedCharacter;
    this.direction = MOVE_DOWN;
    this.needsUpdate = true;

    this._socket = socket;
    this._socket.addEventListener('message', this._onReceiveServerMessage);
  }

  _onReceiveServerMessage(event) {
    const message = JSON.parse(event.data);
    if (message.action === 'move' && message.username === this._username) {
      this.x = message.x;
      this.y = message.y;
      this.direction = message.direction;
    } else if (message.action === 'look' && message.username === this._username) {
      this.selectedCharacter = message.selectedCharacter;
    }
  }

  update() {
    this.characters[this.selectedCharacter].update(this.direction);
  }

  render() {
    this.characters[this.selectedCharacter].render(this.x, this.y);
  }
}

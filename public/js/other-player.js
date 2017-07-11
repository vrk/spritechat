class OtherPlayer extends BasePlayer {
  constructor(context, socket, username, initialX, initialY, initialDir, selectedCharacter) {
    super(context, username, initialX, initialY, initialDir, selectedCharacter);
    this._onReceiveServerMessage = this._onReceiveServerMessage.bind(this);

    this._socket = socket;
    this._socket.addEventListener('message', this._onReceiveServerMessage);
  }

  _onReceiveServerMessage(event) {
    const message = JSON.parse(event.data);
    if (message.action === 'move' && message.username === this._username) {
      this.xVelocity = message.xVelocity;
      this.yVelocity = message.yVelocity;
      this.x = message.x;
      this.y = message.y;
      this.direction = message.direction;
    } else if (message.action === 'look' && message.username === this._username) {
      this.selectedCharacter = message.selectedCharacter;
    }
  }
}

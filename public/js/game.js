class Game {
  constructor(socket) {
    this.startGameLoop = this.startGameLoop.bind(this);
    this._onReceiveServerMessage = this._onReceiveServerMessage.bind(this);

    this.canvas = document.querySelector('canvas');
    this.canvas.width = CANVAS_WIDTH;
    this.canvas.height = CANVAS_HEIGHT;
    this.context = this.canvas.getContext('2d');
    this.context.imageSmoothingEnabled = false;

    this._socket = socket;
    this.player = new Player(this.context, socket);
    this.others = {};
    this.world = new World(this.context);

    this._socket.addEventListener('message', this._onReceiveServerMessage);
  }

  _onReceiveServerMessage(event) {
    const message = JSON.parse(event.data);
    if (message.action === 'entered') {
      this._username = message.username;
      for (const playerName of message.users) {
        if (this._username !== playerName) {
          this.others[playerName] = new OtherPlayer(this.context, this._socket, playerName);
        }
      }
      console.log(`in the chat room: ${message.users.join(', ')}`);
    } if (message.action === 'announce-enter') {
      if (message.username !== this._username) {
        this.others[message.username] = new OtherPlayer(this.context, this._socket, message.username);
      }
      console.log(`${message.username} has entered`);
    } else if (message.action === 'announce-exit') {
      delete this.others[message.username];
      console.log(`${message.username} has left`);
    }
  }


  startGameLoop() {
    const gameLoop = () => {
    this.context.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      requestAnimationFrame(gameLoop);
      // TODO: Move this to a background layer.
      // this.world.render();

      this.player.update();
      this.player.render();

      for (const playerName in this.others) {
        const otherPlayer = this.others[playerName];
        otherPlayer.update();
        otherPlayer.render();
      }
    }
    gameLoop();
  }
}

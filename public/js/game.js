class Game {
  constructor(socket) {
    this.startGameLoop = this.startGameLoop.bind(this);
    this._onReceiveServerMessage = this._onReceiveServerMessage.bind(this);
    this.onNewDataChannel = this.onNewDataChannel.bind(this);
    this._onDanceClick = this._onDanceClick.bind(this);
    this._onLookClick = this._onLookClick.bind(this);

    this.container = document.querySelector('#world-container');
    this.container.style.width = CANVAS_WIDTH + 'px';
    this.container.style.height = CANVAS_HEIGHT + 'px';

    this.canvas = document.querySelector('#foreground');
    this.canvas.width = CANVAS_WIDTH;
    this.canvas.height = CANVAS_HEIGHT;
    this.context = this.canvas.getContext('2d');
    this.context.imageSmoothingEnabled = false;

    this.backCanvas = document.querySelector('#background');
    this.backCanvas.width = CANVAS_WIDTH;
    this.backCanvas.height = CANVAS_HEIGHT;
    this.backContext = this.backCanvas.getContext('2d');

    this._socket = socket;
    this.player = new Player(this.context, socket);
    this.others = {};
    this.world = new World(this.backContext);

    // const danceButton = document.querySelector('#dance-button');
    // danceButton.addEventListener('click', this._onDanceClick);

    const lookButton = document.querySelector('#look-button');
    lookButton.addEventListener('click', this._onLookClick);
    this._socket.addEventListener('message', this._onReceiveServerMessage);

    this.peerConnectionManager = null;
  }

  _onLookClick() {
    this.player.changeLook();
  }

  _onDanceClick() {
    this.player.dance();
  }

  _onReceiveServerMessage(event) {
    const message = JSON.parse(event.data);
    if (message.action === 'entered') {
      this._username = message.username;
      for (const playerName in message.users) {
        const playerInfo = message.users[playerName];
        if (this._username !== playerName) {
          this.others[playerName] = new OtherPlayer(this.context, this._socket, playerName, playerInfo.x, playerInfo.y, playerInfo.selectedCharacter);
        }
      }
    } if (message.action === 'announce-enter') {
      if (message.username !== this._username) {
        this.others[message.username] = new OtherPlayer(this.context, this._socket, message.username);
      }
      console.log(`${message.username} has entered`);

      if (!this.peerConnectionManager) {
        const createdParty = Object.keys(this.others).length === 0;
        this.peerConnectionManager =
            new DataChannelManager(this._socket, this._username, createdParty, this.onNewDataChannel);
      }

    } else if (message.action === 'announce-exit') {
      delete this.others[message.username];
      console.log(`${message.username} has left`);
    }
  }

  onNewDataChannel(channel) {
    console.log('new channel');
    this.player.setDataChannel(channel);
    channel.onmessage = (event) => {
      const message = JSON.parse(event.data);
      for (const playerName in this.others) {
        const otherPlayer = this.others[playerName];
        otherPlayer.onNewMessage(message);
      }
    };
  }

  startGameLoop() {
    this.world.render();
    const gameLoop = () => {
    this.context.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      requestAnimationFrame(gameLoop);
      // TODO: Move this to a background layer.

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

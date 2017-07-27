class App {
  constructor() {
    const url = location.hostname === 'localhost' ?
        'ws://localhost:9000' : `wss://${location.hostname}`;
    this._socket = new WebSocket(url);

    this._socket.addEventListener('open', (event) => {
      const game = new Game(this._socket);
      game.startGameLoop();
    });
  }
}
new App();

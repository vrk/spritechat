// // Create WebSocket connection.
class App {
  constructor() {
    this._onRoomEnter = this._onRoomEnter.bind(this);
    const url = location.hostname === 'localhost' ?
        'ws://localhost:8080' : `wss://${location.hostname}`;
    this._socket = new WebSocket(url);

    // TODO: Open the socket, then show the menu.
    this._socket.addEventListener('open', (event) => {
      this._menu = new Menu(this._onRoomEnter);
    });
  }

  _onRoomEnter(username) {
    const container = document.querySelector('#menu');
    container.classList.add('hidden');
    this._room = new Room(username, this._socket);
  }
}
new App();

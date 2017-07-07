// // Create WebSocket connection.
class App {
  constructor() {
    this._onRoomEnter = this._onRoomEnter.bind(this);
    this._socket = new WebSocket('ws://localhost:8080');

    // TODO: Open the socket, then show the menu.
    this._socket.addEventListener('open', (event) => {
      this._menu = new Menu(this._onRoomEnter);
    });
  }

  _onRoomEnter(username) {
    this._room = new Room(username, this._socket);
  }
}
new App();

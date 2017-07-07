class Room {
  constructor(username, socket) {
    this._onReceiveServerMessage = this._onReceiveServerMessage.bind(this);
    this._onSendMessage = this._onSendMessage.bind(this);

    this._username = username;
    this._socket = socket;

    const form = document.querySelector('#message-form');
    form.addEventListener('submit', this._onSendMessage);

    this._onReceiveServerMessage = this._onReceiveServerMessage.bind(this);
    this._socket.addEventListener('message', this._onReceiveServerMessage);

    const outMessage = {
      action: 'enter',
      username,
    }
    // Connection opened
    this._socket.send(JSON.stringify(outMessage));

    const container = document.querySelector('#room');
    container.classList.remove('hidden');
  }

  _onReceiveServerMessage(event) {
    const message = JSON.parse(event.data);
    if (message.action === 'chat' && message.username !== this._username) {
      this._logMessage(message);
    } else if (message.action === 'entered') {
      console.log(message);
      for (const line of message.messageLog) {
        this._logMessage(JSON.parse(line));
      }
    }
  }

  _logMessage(message) {
    const historyContainer = document.querySelector('#history');
    const para = document.createElement('p');
    para.textContent = `${message.username}: ${message.message}`;
    historyContainer.append(para);
  }

  _onSendMessage(e) {
    e.preventDefault();
    const input = document.querySelector('#chat-message');
    console.log(input.value);

    const outMessage = {
      action: 'chat',
      username: this._username,
      message: input.value
    }

    this._logMessage(outMessage);
    // Connection opened
    this._socket.send(JSON.stringify(outMessage));
  }
}

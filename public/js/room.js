class Room {
  constructor(username, socket) {
    this._onReceiveServerMessage = this._onReceiveServerMessage.bind(this);
    this._onSendMessage = this._onSendMessage.bind(this);

    this._username = username;
    this._socket = socket;
    this._users = [];

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
    if (message.action === 'chat') {
      if (message.username !== this._username) {
        this._logChatMessage(message);
      }
    } else if (message.action === 'entered') {
      this._username = message.username;
      this._users = message.users;
      console.log(this._users);
      for (const line of message.messageLog) {
        this._logChatMessage(line);
      }
      this._logChannelMessage(`in the chat room: ${this._users.join(', ')}`);
    } else if (message.action === 'announce-enter') {
      if (message.username !== this._username) {
        this._users.push(message.username);
      }
      this._logChannelMessage(`${message.username} has entered`);
    } else if (message.action === 'announce-exit') {
      const index = this._users.indexOf(message.username);
      this._users.splice(index, 1);
      this._logChannelMessage(`${message.username} has left`);
    }
  }

  _logChannelMessage(text) {
    const historyContainer = document.querySelector('#history');
    const para = document.createElement('p');
    para.textContent = text;
    historyContainer.append(para);
  }

  _logChatMessage(message) {
    const historyContainer = document.querySelector('#history');
    const para = document.createElement('p');
    para.textContent = `${message.username}: ${message.message}`;
    historyContainer.append(para);
  }

  _onSendMessage(e) {
    e.preventDefault();
    const input = document.querySelector('#chat-message');

    const outMessage = {
      action: 'chat',
      username: this._username,
      message: input.value
    };

    input.value = '';
    this._logChatMessage(outMessage);
    // Connection opened
    this._socket.send(JSON.stringify(outMessage));
  }
}

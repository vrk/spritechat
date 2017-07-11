const express = require('express');
const http = require('http');
const url = require('url');
const WebSocket = require('ws');

const app = express();

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(express.static('public'));

const users = [];
const messageLog = [];

const onUserEnter = (ws, messageInfo) => {
  let username = messageInfo.username;

  let n = 1;
  while (users.includes(username)) {
    username = `${messageInfo.username}${n}`;
    n++;
  }
  users.push(username);
  ws.username = username;
  const message = {
    action: 'entered',
    username,
    users,
    messageLog
  };
  ws.send(JSON.stringify(message));

  const announceEnter = {
    action: 'announce-enter',
    username
  }
  broadcastMessage(announceEnter);
};

const broadcastMessage = (message) => {
  wss.clients.forEach(function each(client) {
    client.send(JSON.stringify(message));
  });
};

const onUserChat = (ws, message) => {
  messageLog.push(message);
  if (messageLog.length > 20) {
    messageLog.pop();
  }
  broadcastMessage(message);
};

const onUserMove = (ws, message) => {
  broadcastMessage(message);
};


const onUserExit = (username) => {
  const index = users.indexOf(username);
  users.splice(index, 1);
  broadcastMessage({
    action: 'announce-exit',
    username
  })
};

const interval = setInterval(function ping() {
  wss.clients.forEach(function each(ws) {
    if (!ws.isAlive) {
      onUserExit(ws.username);
      return ws.terminate();
    }

    ws.isAlive = false;
    ws.ping('', false, true);
  });
}, 30000);

wss.on('connection', function connection(ws, req) {
  ws.isAlive = true;
  const heartbeat = () => {
    console.log(`${ws.username}: pong!`);
    ws.isAlive = true;
  };
  ws.on('pong', heartbeat);
  ws.on('close', () => {
    onUserExit(ws.username);
  });

  ws.on('message', function (data) {
    console.log('received: %s', data);
    const messageInfo = JSON.parse(data);
    switch (messageInfo.action) {
      case 'enter':
        onUserEnter(ws, messageInfo);
        break;
      case 'chat':
        onUserChat(ws, messageInfo);
        break;
      case 'move':
        onUserMove(ws, messageInfo);
        break;
      default:
    }
  });

  ws.send(JSON.stringify({ status: 'connected' }));
});

server.listen(process.env.PORT || 8080, function listening() {
  console.log('Listening on %d', server.address().port);
});

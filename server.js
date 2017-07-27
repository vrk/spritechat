const express = require('express');
const http = require('http');
const url = require('url');
const WebSocket = require('ws');

const app = express();

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(express.static('public'));

const users = {};
const messageLog = [];

const onUserEnter = (ws, messageInfo) => {
  let username = messageInfo.username;

  let n = 1;
  while (Object.keys(users).includes(username)) {
    username = `${messageInfo.username}${n}`;
    n++;
  }
  users[username] = {};
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
  users[message.username].x = message.x;
  users[message.username].y = message.y;
  broadcastMessage(message);
};

const onUserLook = (ws, message) => {
  users[message.username].selectedCharacter = message.selectedCharacter;
  broadcastMessage(message);
};

const onSignalling = (ws, message) => {
  wss.clients.forEach(function each(client) {
    console.log(`sending ${ws.username}'s message to ${client.username}`);
    if (client.username !== ws.username) {
      client.send(JSON.stringify(message));
    }
  });
};

const onUserExit = (username) => {
  delete users[username];
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
    const messageInfo = JSON.parse(data);
    console.log(messageInfo);
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
      case 'look':
        onUserLook(ws, messageInfo);
        break;
      case 'ice':
      case 'ice-complete':
      case 'signal':
      case 'sdp-offer':
      case 'sdp-answer':
      console.log('---');
        console.log('action: ' +messageInfo.action);
        console.log('target: ' +messageInfo.target);
        console.log('sender: ' +messageInfo.username);
        onSignalling(ws, messageInfo);
        break;
      default:
    }
  });

  let isInitial = false;
  if (Object.keys(users).length === 1) {
    isInitial = true;
  }

  ws.send(JSON.stringify({ action: 'connected', isInitial }));
});

server.listen(process.env.PORT || 9000, function listening() {
  console.log('Listening on %d', server.address().port);
});

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
  // TODO: Handle exits
  users.push(messageInfo.username);
  ws.send(JSON.stringify({
    action: 'entered',
    users,
    messageLog
  }));
};

const broadcastMessage = (message) => {
  messageLog.push(message);
  wss.clients.forEach(function each(client) {
    client.send(message);
  });
};

wss.on('connection', function connection(ws, req) {
  const location = url.parse(req.url, true);
  console.log(`connected: ${JSON.stringify(location)}`);

  ws.on('message', function (data) {
    console.log('received: %s', data);
    const messageInfo = JSON.parse(data);
    switch (messageInfo.action) {
      case 'enter':
        onUserEnter(ws, messageInfo);
        break;
      case 'chat':
        broadcastMessage(data);
        break;
      default:
    }
  });

  ws.send('connected');
});

server.listen(8080, function listening() {
  console.log('Listening on %d', server.address().port);
});

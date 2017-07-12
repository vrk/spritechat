
//Signaling Code Setup
const SIGNAL_ROOM = "signaling";
const configuration = {
	'iceServers': [{
		'url': 'stun:stun.l.google.com:19302'
	}]
};

const dataChannelOptions = {
	ordered: false, //no guaranteed delivery, unreliable but faster
	maxRetransmitTime: 1000, //milliseconds
};


class Game {
  constructor(socket) {
    this.sendLocalDesc = this.sendLocalDesc.bind(this);
    this.startGameLoop = this.startGameLoop.bind(this);
    this.receiveDataChannel = this.receiveDataChannel.bind(this);
    this._onReceiveServerMessage = this._onReceiveServerMessage.bind(this);
    this.receiveDataChannelMessage = this.receiveDataChannelMessage.bind(this);
    this.dataChannelStateChanged = this.dataChannelStateChanged.bind(this);
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

    this.rtcPeerConn;
    this.dataChannel;
    // const danceButton = document.querySelector('#dance-button');
    // danceButton.addEventListener('click', this._onDanceClick);

    const lookButton = document.querySelector('#look-button');
    lookButton.addEventListener('click', this._onLookClick);
    this._socket.addEventListener('message', this._onReceiveServerMessage);
  }

  _onLookClick() {
    this.player.changeLook();
  }

  _onDanceClick() {
    this.player.dance();
  }

  _onReceiveServerMessage(event) {
    const message = JSON.parse(event.data);
    if (message.action === 'signal') {
      this.setupPeerConnection();
    } else if (message.action === 'sdp') {
      console.log('handl sdp');
      console.log(this._username);
      console.log(message.sdp);
      this.rtcPeerConn.setRemoteDescription(new RTCSessionDescription(message.sdp), () => {
        console.log('remote description');
        // if we received an offer, we need to answer
        if (this.rtcPeerConn.remoteDescription.type == 'offer') {
          this.rtcPeerConn.createAnswer(this.sendLocalDesc);
        }
      }, this.fail);
    } else if (message.action === 'ice') {
      this.rtcPeerConn.addIceCandidate(new RTCIceCandidate(message.candidate),
      () => {console.log('wooo');},
       this.fail);
    } else if (message.action === 'entered') {
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

      const kickoffMessage = {
        username: this._username,
        action: 'signal'
      };
      this._socket.send(JSON.stringify(kickoffMessage));
    } else if (message.action === 'announce-exit') {
      delete this.others[message.username];
      console.log(`${message.username} has left`);
    }
  }

  setupPeerConnection() {
    if (!this.rtcPeerConn) {
      console.log('setup pc');
      this.rtcPeerConn = new RTCPeerConnection(configuration, null);
      this.dataChannel = this.rtcPeerConn.createDataChannel('textMessages', dataChannelOptions);

      this.dataChannel.onopen = this.dataChannelStateChanged;
      this.rtcPeerConn.ondatachannel = this.receiveDataChannel;

      // send any ice candidates to the other peer
      this.rtcPeerConn.onicecandidate = (evt) => {
        // displaySignalMessage("completed that ice candidate...");
        if (evt.candidate) {
          const outMessage = {
            username: this._username,
            candidate: evt.candidate,
            action: 'ice'
          };
          this._socket.send(JSON.stringify(outMessage));
        }
      }

      // let the 'negotiationneeded' event trigger offer generation
      this.rtcPeerConn.onnegotiationneeded = () => {
        // displaySignalMessage("on negotiation called");
        console.log('on negot called');
        if (this.rtcPeerConn.remoteDescription.type == 'offer') {
          this.rtcPeerConn.createAnswer(this.sendLocalDesc, this.fail);
        } else {
          this.rtcPeerConn.createOffer(this.sendLocalDesc, this.fail);

        }
      }
    }
  }

  fail(error) {
    console.log(error);
    debugger;
    console.log('FAIL');
  }

  async sendLocalDesc(desc) {
    if (this.setRemote) {
      return;
    }
    this.setRemote = true;
  	await this.rtcPeerConn.setLocalDescription(desc);
    console.log('send local description!');
    console.log(desc);
		//displaySignalMessage("sending local description");
    console.log('sending local desc');
    console.log(this._username);
    const outMessage = {
      sdp: this.rtcPeerConn.localDescription,
      username: this._username,
      action: 'sdp'
    };
    this._socket.send(JSON.stringify(outMessage));
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

  //Data Channel Specific methods
  dataChannelStateChanged() {
      console.log('state changed');
  	if (this.dataChannel.readyState === 'open') {
      console.log('data channel open');
  		this.dataChannel.onmessage = this.receiveDataChannelMessage;
      this.player.setDataChannel(this.dataChannel);
      for (const playerName in this.others) {
        const otherPlayer = this.others[playerName];
        otherPlayer.setDataChannel(this.dataChannel);
      }
  	}
  }

  receiveDataChannel(event) {
  	//displaySignalMessage("Receiving a data channel");
    console.log('receiving a data channel');
  	this.dataChannel = event.channel;
  	this.dataChannel.onmessage = this.receiveDataChannelMessage;
    this.player.setDataChannel(this.dataChannel);
    for (const playerName in this.others) {
      const otherPlayer = this.others[playerName];
      otherPlayer.setDataChannel(this.dataChannel);
    }
  }

  receiveDataChannelMessage(event) {
  	//displayMessage("From DataChannel: " + event.data);
    console.log('from datachannel ' + event.data);

  }

}

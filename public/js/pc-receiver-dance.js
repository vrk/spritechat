class PartyStarter {
  constructor(socket, username) {
    this._socket = socket;
    this._username = username;
    this.dataChannels = {};
  }

  listenForNewUser() {
    let peerConnection;
    const starterOnReceiveMessages = async (event) => {
      const message = JSON.parse(event.data);
      if (message.action === 'signal') {
        console.log('aha, another person!');
        if (!peerConnection) {
          peerConnection = this.setupPeerConnection();
        }
        const dataChannel = peerConnection.createDataChannel('textMessages', dataChannelOptions);
        this.dataChannels[message.username] = dataChannel;
      } else if (message.action === 'sdp-answer') {
        console.log('The guest answered! I set remote and then done.');
        await peerConnection.setRemoteDescription(new RTCSessionDescription(message.sdp));
      }
    };
    this._socket.addEventListener('message', starterOnReceiveMessages);
  }

  removeUser() {
    delete this.dataChannels[message.username];
  }

  setupPeerConnection() {
    const peerConnection = new RTCPeerConnection(configuration, null);

    peerConnection.onicecandidate = (evt) => {
      console.log('ice!');
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
    peerConnection.onnegotiationneeded = async () => {
      console.log('Going to send my guest an offer w/ my local description.');
      const desc = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(desc);
      const outMessage = {
         sdp: peerConnection.localDescription,
         username: this._username,
         action: 'sdp-offer'
       };
       this._socket.send(JSON.stringify(outMessage));
    };
    return peerConnection;
  }
}

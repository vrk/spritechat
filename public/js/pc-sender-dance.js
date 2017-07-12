class PartyJoiner {
  constructor(socket, username) {
    this._socket = socket;
    this._username = username;
  }

  kickoffParty() {
    console.log(`yoooo I'm ${this._username} and I just entered this thing!`);
    console.log("going to let the host know I'm here...")
    const kickoffMessage = {
      username: this._username,
      action: 'signal'
    };
    this._socket.send(JSON.stringify(kickoffMessage));

    // Now listen for replies to our kick-off message...
    let peerConnection;
    const joinerOnReceiveMessages = async (event) => {
      const message = JSON.parse(event.data);
      if (message.action === 'sdp-offer' || message.action === 'ice') {
        if (!peerConnection) {
          peerConnection = this.createPeerConnection();
          const receiveDataChannel = (event) => {
            console.log('received a data channel from the party host!');
          };
          peerConnection.ondatachannel = receiveDataChannel;
        }
      }
      if (message.action === 'sdp-offer') {
        console.log('ok, the host invited me!')
        await peerConnection.setRemoteDescription(new RTCSessionDescription(message.sdp));
        console.assert(peerConnection.remoteDescription.type === 'offer');
        console.log("I'll give them my answer")
        const desc = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(desc);
        const outMessage = {
          sdp: peerConnection.localDescription,
          username: this._username,
          action: 'sdp-answer'
        };
        this._socket.send(JSON.stringify(outMessage));
      } else if (message.action === 'ice') {
        await peerConnection.addIceCandidate(new RTCIceCandidate(message.candidate));
      }
    };
    // Listen for replies
    this._socket.addEventListener('message', joinerOnReceiveMessages);
  }

  createPeerConnection() {
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
    return peerConnection;
  }

}

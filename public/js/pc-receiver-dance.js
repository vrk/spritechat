class DataChannelManager {
  constructor(socket, username, createdParty = false, onNewDataChannel) {
    this._socket = socket;
    this._username = username;
    this.createdParty = createdParty;
    this.onNewDataChannel = onNewDataChannel;

    if (this.createdParty) {
      console.log('I HAVE STARTED THIS PARTY');
      this.listenForNewUser();
    } else {
      console.log('I HAVE JOINED THIS PARTY');
      this.kickoffParty();
    }

    this.dataChannels = [];
    this.peerConnections = [];
    this.onJoinPeerConnections = {};
  }

  kickoffParty() {
    console.assert(!this.createdParty);

    // Now listen for replies to our kick-off message...
    const joinerOnReceiveMessages = async (event) => {
      const message = JSON.parse(event.data);
      console.log('received message! ' + message.action);
      if (message.target !== this._username) {
        return;
      }
      if (message.action !== 'sdp-offer' && message.action !== 'ice') {
        return;
      }

      let peerConnection;
      if (!this.onJoinPeerConnections[message.username]) {
        peerConnection = this.createPeerConnection(message.username);
        this.onJoinPeerConnections[message.username] = {
          peerConnection,
          hasSpd: false,
          pendingIceCandidates: []
        };
        console.log(this.onJoinPeerConnections);
        peerConnection.ondatachannel = receiveDataChannel;
      }
      console.log(this.onJoinPeerConnections[message.username]);
      peerConnection = this.onJoinPeerConnections[message.username].peerConnection;
      console.log(message.action);
      console.log(peerConnection);

      if (message.action === 'sdp-offer') {
        console.log('ok, the host invited me!')
        await peerConnection.setRemoteDescription(new RTCSessionDescription(message.sdp));
        const pcInfo = this.onJoinPeerConnections[message.username];
        console.assert(peerConnection.remoteDescription.type === 'offer');
        console.log("I'll give them my answer");
        const desc = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(desc);
        const outMessage = {
          sdp: peerConnection.localDescription,
          username: this._username,
          target: message.username,
          action: 'sdp-answer'
        };
        this._socket.send(JSON.stringify(outMessage));

        pcInfo.hasSpd = true;
        for (const candidate of pcInfo.pendingIceCandidates) {
          try {
            await pcInfo.peerConnection.addIceCandidate(candidate);
          } catch(e) {
            console.log(e);
          }
        }
        pcInfo.pendingIceCandidates = [];
      } else if (message.action === 'ice') {
        const pcInfo = this.onJoinPeerConnections[message.username];
        console.log(pcInfo);
        const candidate = new RTCIceCandidate(message.candidate);
        if (pcInfo.hasSpd) {
          try {
            await pcInfo.peerConnection.addIceCandidate(candidate);
          } catch(e) {
            console.log(e);
          }
        } else {
          pcInfo.pendingIceCandidates.push(candidate);
        }
      }
    };
    // Listen for replies
    this._socket.addEventListener('message', joinerOnReceiveMessages);

    console.log(`yoooo I'm ${this._username} and I just entered this thing!`);
    console.log("going to let the host know I'm here...")
    const kickoffMessage = {
      username: this._username,
      action: 'signal'
    };
    this._socket.send(JSON.stringify(kickoffMessage));

    const receiveDataChannel = (event) => {
      console.log('received a data channel from the party host!');
      const channel = event.channel;
      this.addDataChannel(channel);
      this.listenForNewUser();
    };

  }

  listenForNewUser() {
    let peerConnection;
    const starterOnReceiveMessages = async (event) => {
      const message = JSON.parse(event.data);

      if (message.action === 'signal') {
        console.log('aha, another person!');
        const guestName = message.username;
        peerConnection = this.createPeerConnection(guestName);
        this.peerConnections[guestName] = peerConnection;
        peerConnection.onnegotiationneeded = async () => {
          console.log('Going to send my guest an offer w/ my local description.');
          const desc = await peerConnection.createOffer();
          await peerConnection.setLocalDescription(desc);
          const outMessage = {
            sdp: peerConnection.localDescription,
            username: this._username,
            target: guestName,
            action: 'sdp-offer'
          };
          console.log('sending offer...');
          console.log(outMessage);
          this._socket.send(JSON.stringify(outMessage));
        };
        const channelName = `${this._username}-${guestName}`;
        const dataChannel = peerConnection.createDataChannel(channelName, dataChannelOptions);
        this.addDataChannel(dataChannel);
      } else if (message.action === 'sdp-answer' && message.target === this._username) {
        console.log('The guest answered! I set remote and then done.');
        await peerConnection.setRemoteDescription(new RTCSessionDescription(message.sdp));
      }
    };
    this._socket.addEventListener('message', starterOnReceiveMessages);
  }

  addDataChannel(channel) {
    channel.onopen = () => {
      this.dataChannels.push(channel);
      this.onNewDataChannel(channel);
    };
    channel.onclose = (event) => {
      this.dataChannels = this.dataChannels.filter(c => event.target !== c);
    };
  }

  createPeerConnection(guestName) {
    const peerConnection = new RTCPeerConnection(configuration, null);
    peerConnection.onicecandidate = (evt) => {
      console.log('ice!');
      if (evt.candidate) {
        const outMessage = {
          username: this._username,
          target: guestName,
          candidate: evt.candidate,
          action: 'ice'
        };
        this._socket.send(JSON.stringify(outMessage));
      }
    }
    return peerConnection;
  }
}

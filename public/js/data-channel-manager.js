let GLOB = null;
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
  remove(name) {
    delete this.onJoinPeerConnections[name];
  }

  async tryAddIceCandidates(message) {
    const pcInfo = this.onJoinPeerConnections[message.username];
    if (!pcInfo.hasSpd || pcInfo.waitingForCandidates) {
      console.log('Can I add ice candidates? NO');
      return;
    }
    console.log('Can I add ice candidates? YES');

    for (const c of pcInfo.pendingIceCandidates) {
      try {
        await pcInfo.peerConnection.addIceCandidate(c);
        console.log('Adding ice succeeded.');
      } catch(e) {
        console.log(e);
      }
    }
    pcInfo.pendingIceCandidates = [];

    const peerConnection = pcInfo.peerConnection;
    const desc = await peerConnection.createAnswer();
    peerConnection.setLocalDescription(desc);
    const outMessage = {
      sdp: peerConnection.localDescription.sdp,
      username: this._username,
      target: message.username,
      action: 'sdp-answer'
    };
    this._socket.send(JSON.stringify(outMessage));
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
      if (message.action !== 'sdp-offer' && message.action !== 'ice' &&
    message.action !== 'ice-complete') {
        return;
      }

      let peerConnection;
      if (!this.onJoinPeerConnections[message.username]) {
        peerConnection = this.createPeerConnection(message.username);
        this.onJoinPeerConnections[message.username] = {
          peerConnection,
          hasSpd: false,
          waitingForCandidates: true,
          pendingIceCandidates: []
        };
        console.log(this.onJoinPeerConnections);
        peerConnection.ondatachannel = receiveDataChannel;
        const guestName = message.username;
        const channelName = `${this._username}-${guestName}`;
        const dataChannel = peerConnection.createDataChannel(channelName, dataChannelOptions);
        this.addDataChannel(dataChannel);
      }
      console.log(this.onJoinPeerConnections[message.username]);
      peerConnection = this.onJoinPeerConnections[message.username].peerConnection;
      console.log(message.action);
      console.log(peerConnection);

      if (message.action === 'sdp-offer') {
        console.log('ok, the host invited me!')
        await peerConnection.setRemoteDescription(new RTCSessionDescription(
          { sdp: message.sdp, type: 'offer' }));
        const pcInfo = this.onJoinPeerConnections[message.username];
        pcInfo.hasSpd = true;
        this.tryAddIceCandidates(message);
      } else if (message.action === 'ice-complete') {
        console.log('ice is complete!');
        const pcInfo = this.onJoinPeerConnections[message.username];
        pcInfo.waitingForCandidates = false;
        this.tryAddIceCandidates(message);
      } else if (message.action === 'ice') {
        const candidate = new RTCIceCandidate( {
          sdpMLineIndex: message.label,
          candidate: message.candidate
        });
        const pcInfo = this.onJoinPeerConnections[message.username];
        pcInfo.pendingIceCandidates.push(candidate);

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
      if (!this.isListening) {
        this.isListening = true;
        this.listenForNewUser();
      }
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
        const channelName = `${this._username}-${guestName}`;
        const dataChannel = peerConnection.createDataChannel(channelName, dataChannelOptions);
        this.addDataChannel(dataChannel);
        peerConnection.onnegotiationneeded = async () => {
          console.log('Going to send my guest an offer w/ my local description.');
          const desc = await peerConnection.createOffer();
          peerConnection.setLocalDescription(desc);
          console.log(peerConnection.localDescription);
          const outMessage = {
            sdp: peerConnection.localDescription.sdp,
            username: this._username,
            target: guestName,
            action: 'sdp-offer'
          };
          console.log('sending offer...');
          console.log(outMessage);
          GLOB = outMessage;

          this._socket.send(JSON.stringify(outMessage));
        };
      } else if (message.action === 'sdp-answer' && message.target === this._username) {
        console.log('The guest answered! I set remote and then done.');
        await peerConnection.setRemoteDescription(
          new RTCSessionDescription({ sdp: message.sdp, type: 'answer' }));
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
    peerConnection.oniceconnectionstatechange = (evt) => {
      console.log('**ICE CHANGE: ' + peerConnection.iceConnectionState);
    };
    peerConnection.onsignalingstatechange = (evt) => {
      console.log('**SIGNAL CHANGE: ' + peerConnection.signalingState);
    };

    peerConnection.onicecandidate = (evt) => {
      console.log('ice!');
      if (evt.candidate) {
        const candidateStr = evt.candidate.candidate;

        // Always eat TCP candidates. Not needed in this context.
        if (candidateStr.indexOf('tcp') !== -1) {
          console.log('NOPE');
          return;
        }

        const outMessage = {
          username: this._username,
          target: guestName,
          label: event.candidate.sdpMLineIndex,
          id: event.candidate.sdpMid,
          candidate: evt.candidate.candidate,
          action: 'ice'
        };
        this._socket.send(JSON.stringify(outMessage));
      } else {
        console.log('done');
        const outMessage = {
          username: this._username,
          target: guestName,
          action: 'ice-complete'
        };
        this._socket.send(JSON.stringify(outMessage));
      }
    }
    return peerConnection;
  }
}

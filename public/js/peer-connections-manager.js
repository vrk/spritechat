class PeerConnectionsManager {
  constructor(socket, onNewDataChannel) {
    this.socket_ = socket;
    this.onNewDataChannel = onNewDataChannel;
    this.hasJoined = false;
    this.peerConnectionClients = {};
    this.myUserName = null;
  }

  askForCallInvite(otherUsers, myUsername) {
    this.myUserName = myUsername;
    for (const user of otherUsers) {
      console.log('asking for invite...');
      this.peerConnectionClients[user] = new PeerConnectionClient(this.socket_, myUsername, this.onNewDataChannel);
      this.peerConnectionClients[user].startAsCallee(user);
    }
  }

  sendCallToNewGuest(newGuestName, myUsername) {
    this.myUserName = myUsername;
    console.log('inviting new guest!');
    this.peerConnectionClients[newGuestName] = new PeerConnectionClient(this.socket_, myUsername, this.onNewDataChannel);
    this.peerConnectionClients[newGuestName].startAsCaller(newGuestName);
  }

  close(guestName) {
    this.peerConnectionClients[guestName].close();
    delete this.peerConnectionClients[guestName];
  }

  receiveSignalingMessage(message) {
    if (!message.username || message.username === this.myUserName) {
      return;
    }

    const pcc = this.peerConnectionClients[message.username];
    if (pcc) {
      pcc.receiveSignalingMessage(message);
    }
  }
}

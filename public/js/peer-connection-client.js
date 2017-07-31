class PeerConnectionClient {
  constructor(socket, username, onNewDataChannel) {
    this.socket_ = socket;
    this.username_ = username;
    this.onNewDataChannel = onNewDataChannel;

    this.hasRemoteSdp_ = false;
    this.messageQueue_ = [];
    this.isInitiator_ = false;
    this.started_ = false;
  }

  createPeerConnection() {
    const configuration = {
    	'iceServers': [
        {
        	'urls': ['turn:numb.viagenie.ca']  ,
        	credential: 'ohbotherohbother',
        	username: 'victoriakirst@gmail.com'
        },{
    		'urls': ['stun:stun.l.google.com:19302']
    	}]
    };

    console.log('Creating RTCPeerConnnection with:\n' +
      '  config: \'' + JSON.stringify(configuration) + '\';\n' +
      '\'.');

    // Create an RTCPeerConnection via the polyfill (adapter.js).
    this.pc_ = new RTCPeerConnection(configuration);
    this.pc_.onicecandidate = this.onIceCandidate_.bind(this);
    this.pc_.onsignalingstatechange = this.onSignalingStateChanged_.bind(this);
    this.pc_.oniceconnectionstatechange = this.onIceConnectionStateChanged_.bind(this);

    const dataChannelOptions = { ordered: false };
    this.dataChannel_ = this.pc_.createDataChannel('sendData', dataChannelOptions);

    this.pc_.ondatachannel = (event) => {
      const channel = event.channel;
      if (!this.isInitiator_) {
        this.onNewDataChannel(channel);
      } else {
        this.onNewDataChannel(this.dataChannel_);
      }
    };
  }

  async startAsCaller(remoteName) {
    this.createPeerConnection();

    console.assert(this.pc_);
    console.assert(!this.starter_);

    this.isInitiator_ = true;
    this.started_ = true;
    this.remoteName_ = remoteName;

    const sessionDescription = await this.pc_.createOffer();
    this.setLocalSdpAndNotify_(sessionDescription);

    return true;
  }

  startAsCallee(remoteName) {
    this.createPeerConnection();

    console.assert(this.pc_);
    console.assert(!this.starter_);

    this.isInitiator_ = false;
    this.started_ = true;
    this.remoteName_ = remoteName;

    return true;
  }

  receiveSignalingMessage(message) {
    const messageObj = message;
    if (!messageObj) {
      return;
    }

    if (messageObj.target !== this.username_) {
      return;
    }

    if ((this.isInitiator_ && messageObj.type === 'answer') ||
        (!this.isInitiator_ && messageObj.type === 'offer')) {
      this.hasRemoteSdp_ = true;
      // Always process offer before candidates.
      this.messageQueue_.unshift(messageObj);
    } else if (messageObj.type === 'candidate') {
      this.messageQueue_.push(messageObj);
    } else {
      console.log('ignoring 2');
    }
    this.drainMessageQueue_();
  }



  close() {
    if (!this.pc_) {
      return;
    }

    this.pc_.close();
    this.pc_ = null;
  }

  async doAnswer_() {
    console.log('Sending answer to peer.');
    const sessionDescription = await this.pc_.createAnswer();
    await this.setLocalSdpAndNotify_(sessionDescription);
  }

  async setLocalSdpAndNotify_(sessionDescription) {
    await this.pc_.setLocalDescription(sessionDescription);
    console.log('Set session description success.');

    this.sendSignalingMessage_({
      sdp: sessionDescription.sdp,
      type: sessionDescription.type,
      action: sessionDescription.type === 'offer' ? 'sdp-offer' : 'sdp-answer'
    });
  }

  async setRemoteSdp_(message) {
    await this.pc_.setRemoteDescription(new RTCSessionDescription(message));
    console.log('set remote description success.');
  }

  sendSignalingMessage_(message) {
    message.username = this.username_;
    message.target = this.remoteName_;
    this.socket_.send(JSON.stringify(message));
  }

  async processSignalingMessage_(message) {
    console.log(`processing message: ${message.type} from ${message.username}`);
    if (message.type === 'offer' && !this.isInitiator_) {
      if (this.pc_.signalingState !== 'stable') {
        console.log('ERROR: remote offer received in unexpected state: ' + this.pc_.signalingState);
        return;
      }

      this.setRemoteSdp_(message);
      this.doAnswer_();
    } else if (message.type === 'answer' && this.isInitiator_) {
      if (this.pc_.signalingState !== 'have-local-offer') {
        console.log('ERROR: remote answer received in unexpected state: ' + this.pc_.signalingState);
        return;
      }

      this.setRemoteSdp_(message);
    } else if (message.type === 'candidate') {

      const candidate = new RTCIceCandidate({
        sdpMLineIndex: message.label,
        candidate: message.candidate
      });
      await this.pc_.addIceCandidate(candidate);
      console.log('Remote candidate added successfully.');
    } else {
      console.log('WARNING: unexpected message: ' + JSON.stringify(message));
    }
  }

  // When we receive messages from GAE registration and from the WSS connection,
  // we add them to a queue and drain it if conditions are right.
  drainMessageQueue_() {
    // It's possible that we finish registering and receiving messages from WSS
    // before our peer connection is created or started. We need to wait for the
    // peer connection to be created and started before processing messages.
    //
    // Also, the order of messages is in general not the same as the POST order
    // from the other client because the POSTs are async and the server may handle
    // some requests faster than others. We need to process offer before
    // candidates so we wait for the offer to arrive first if we're answering.
    // Offers are added to the front of the queue.
    if (!this.pc_ || !this.started_ || !this.hasRemoteSdp_) {
      return;
    }
    for (let i = 0, len = this.messageQueue_.length; i < len; i++) {
      this.processSignalingMessage_(this.messageQueue_[i]);
    }
    this.messageQueue_ = [];
  };

  onIceCandidate_(event) {
    if (event.candidate) {
      const message = {
        action: 'ice',
        type: 'candidate',
        label: event.candidate.sdpMLineIndex,
        id: event.candidate.sdpMid,
        candidate: event.candidate.candidate
      };
      this.sendSignalingMessage_(message);
    } else {
      console.log('End of candidates.');
    }
  }

  onSignalingStateChanged_() {
    if (!this.pc_) {
      return;
    }
    console.log('Signaling state changed to: ' + this.pc_.signalingState);
  }

  onIceConnectionStateChanged_() {
    if (!this.pc_) {
      return;
    }
    console.log('ICE connection state changed to: ' + this.pc_.iceConnectionState);
  }

  onError_(tag, error) {
    console.log(tag + ': ' + error.toString());
  }
};

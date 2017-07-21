var PeerConnectionClient = function() {
  var configuration = {
  	'iceServers': [
      {
      	'urls': ['turn:numb.viagenie.ca']  ,
      	credential: 'ohbotherohbother',
      	username: 'victoriakirst@gmail.com'
      },{
  		'urls': ['stun:stun.l.google.com:19302']
  	}]
  };

  trace('Creating RTCPeerConnnection with:\n' +
    '  config: \'' + JSON.stringify(configuration) + '\';\n' +
    '\'.');

  // Create an RTCPeerConnection via the polyfill (adapter.js).
  console.log('HAAAAAAAAAAAAAAY');
  this.pc_ = new RTCPeerConnection(configuration);
      console.log('HAAAAAAAAAAAAAAY');
  this.pc_.onicecandidate = this.onIceCandidate_.bind(this);
  this.pc_.ontrack = this.onRemoteStreamAdded_.bind(this);
  this.pc_.onremovestream = trace.bind(null, 'Remote stream removed.');
  this.pc_.onsignalingstatechange = this.onSignalingStateChanged_.bind(this);
  this.pc_.oniceconnectionstatechange =
      this.onIceConnectionStateChanged_.bind(this);
  var dataChannelOptions = {
    ordered: true,
  };
  this.pc_.createDataChannel('sendData', dataChannelOptions);

  this.hasRemoteSdp_ = false;
  this.messageQueue_ = [];
  this.isInitiator_ = false;
  this.started_ = false;

  // TODO(jiayl): Replace callbacks with events.
  // Public callbacks. Keep it sorted.
  this.onerror = null;
  this.oniceconnectionstatechange = null;
  this.onnewicecandidate = null;
  this.onremotehangup = null;
  this.onremotesdpset = null;
  this.onremotestreamadded = null;
  this.onsignalingmessage = null;
  this.onsignalingstatechange = null;
};

// Set up audio and video regardless of what devices are present.
// Disable comfort noise for maximum audio quality.
PeerConnectionClient.DEFAULT_SDP_OFFER_OPTIONS_ = {
  // offerToReceiveAudio: 1,
  // offerToReceiveVideo: 1,
  voiceActivityDetection: false
};

PeerConnectionClient.prototype.addStream = function(stream) {
  if (!this.pc_) {
    return;
  }
  // this.pc_.addStream(stream);
};

PeerConnectionClient.prototype.startAsCaller = function(offerOptions) {
  if (!this.pc_) {
    return false;
  }

  if (this.started_) {
    return false;
  }

  this.isInitiator_ = true;
  this.setupCallstats_();
  this.started_ = true;
  var constraints = mergeConstraints(
      PeerConnectionClient.DEFAULT_SDP_OFFER_OPTIONS_, offerOptions);

  trace('Sending offer to peer, with constraints: \n\'' +
      JSON.stringify(constraints) + '\'.');
  this.pc_.createOffer(constraints)
      .then(this.setLocalSdpAndNotify_.bind(this))
      .catch(this.onError_.bind(this, 'createOffer'));

  return true;
};

PeerConnectionClient.prototype.startAsCallee = function(initialMessages) {
  if (!this.pc_) {
    return false;
  }

  if (this.started_) {
    return false;
  }

  this.isInitiator_ = false;
  this.setupCallstats_();
  this.started_ = true;

  if (initialMessages && initialMessages.length > 0) {
    // Convert received messages to JSON objects and add them to the message
    // queue.
    for (var i = 0, len = initialMessages.length; i < len; i++) {
      this.receiveSignalingMessage(initialMessages[i]);
    }
    return true;
  }

  // We may have queued messages received from the signaling channel before
  // started.
  if (this.messageQueue_.length > 0) {
    this.drainMessageQueue_();
  }
  return true;
};

PeerConnectionClient.prototype.receiveSignalingMessage = function(message) {
  var messageObj = parseJSON(message);
  if (!messageObj) {
    return;
  }
  if ((this.isInitiator_ && messageObj.type === 'answer') ||
      (!this.isInitiator_ && messageObj.type === 'offer')) {
    this.hasRemoteSdp_ = true;
    // Always process offer before candidates.
    this.messageQueue_.unshift(messageObj);
  } else if (messageObj.type === 'candidate') {
    this.messageQueue_.push(messageObj);
  } else if (messageObj.type === 'bye') {
    if (this.onremotehangup) {
      this.onremotehangup();
    }
  }
  this.drainMessageQueue_();
};

PeerConnectionClient.prototype.close = function() {
  if (!this.pc_) {
    return;
  }

  this.pc_.close();
  this.pc_ = null;
};

PeerConnectionClient.prototype.doAnswer_ = function() {
  trace('Sending answer to peer.');
  this.pc_.createAnswer()
      .then(this.setLocalSdpAndNotify_.bind(this))
      .catch(this.onError_.bind(this, 'createAnswer'));
};

PeerConnectionClient.prototype.setLocalSdpAndNotify_ =
    function(sessionDescription) {
      this.pc_.setLocalDescription(sessionDescription)
          .then(trace.bind(null, 'Set session description success.'))
          .catch(this.onError_.bind(this, 'setLocalDescription'));

      if (this.onsignalingmessage) {
        this.onsignalingmessage({
          sdp: sessionDescription.sdp,
          type: sessionDescription.type
        });
      }
    };

PeerConnectionClient.prototype.setRemoteSdp_ = function(message) {
  this.pc_.setRemoteDescription(new RTCSessionDescription(message))
      .then(this.onSetRemoteDescriptionSuccess_.bind(this))
      .catch(this.onError_.bind(this, 'setRemoteDescription'));
};

PeerConnectionClient.prototype.onSetRemoteDescriptionSuccess_ = function() {

};

PeerConnectionClient.prototype.processSignalingMessage_ = function(message) {
  if (message.type === 'offer' && !this.isInitiator_) {
    if (this.pc_.signalingState !== 'stable') {
      trace('ERROR: remote offer received in unexpected state: ' +
            this.pc_.signalingState);
      return;
    }
    this.setRemoteSdp_(message);
    this.doAnswer_();
  } else if (message.type === 'answer' && this.isInitiator_) {
    if (this.pc_.signalingState !== 'have-local-offer') {
      trace('ERROR: remote answer received in unexpected state: ' +
            this.pc_.signalingState);
      return;
    }
    this.setRemoteSdp_(message);
  } else if (message.type === 'candidate') {
    var candidate = new RTCIceCandidate({
      sdpMLineIndex: message.label,
      candidate: message.candidate
    });
    console.log('---------------------');
    console.log(candidate);
    console.log('---------------------');
    console.log(candidate);
    this.recordIceCandidate_('Remote', candidate);
    this.pc_.addIceCandidate(candidate)
        .then(trace.bind(null, 'Remote candidate added successfully.'))
        .catch(this.onError_.bind(this, 'addIceCandidate'));
  } else {
    trace('WARNING: unexpected message: ' + JSON.stringify(message));
  }
};

// When we receive messages from GAE registration and from the WSS connection,
// we add them to a queue and drain it if conditions are right.
PeerConnectionClient.prototype.drainMessageQueue_ = function() {
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
  for (var i = 0, len = this.messageQueue_.length; i < len; i++) {
    this.processSignalingMessage_(this.messageQueue_[i]);
  }
  this.messageQueue_ = [];
};

PeerConnectionClient.prototype.onIceCandidate_ = function(event) {
  if (event.candidate) {
    // Eat undesired candidates.
    if (this.filterIceCandidate_(event.candidate)) {
      var message = {
        type: 'candidate',
        label: event.candidate.sdpMLineIndex,
        id: event.candidate.sdpMid,
        candidate: event.candidate.candidate
      };
      if (this.onsignalingmessage) {
        this.onsignalingmessage(message);
      }
      this.recordIceCandidate_('Local', event.candidate);
    }
  } else {
    trace('End of candidates.');
  }
};

PeerConnectionClient.prototype.onSignalingStateChanged_ = function() {
  if (!this.pc_) {
    return;
  }
  trace('Signaling state changed to: ' + this.pc_.signalingState);
};

PeerConnectionClient.prototype.onIceConnectionStateChanged_ = function() {
  if (!this.pc_) {
    return;
  }
  trace('ICE connection state changed to: ' + this.pc_.iceConnectionState);
};

// Return false if the candidate should be dropped, true if not.
PeerConnectionClient.prototype.filterIceCandidate_ = function(candidateObj) {
  var candidateStr = candidateObj.candidate;

  // Always eat TCP candidates. Not needed in this context.
  if (candidateStr.indexOf('tcp') !== -1) {
    console.log('NOPE');
    return false;
  }
  return true;
};

PeerConnectionClient.prototype.onError_ = function(tag, error) {
  if (this.onerror) {
    this.onerror(tag + ': ' + error.toString());
    this.reportErrorToCallstats(tag, error);
  }
};

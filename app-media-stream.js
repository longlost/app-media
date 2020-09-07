
/**
	* `app-media-stream`
	*
  *   Rewrite of Polymer `app-media-stream`.
  *
  *   Docs at https://www.webcomponents.org/element/@polymer/app-media.
  *
  *   This version includes some bug fixes and works in a simpler context, 
  *   plus it is lighter since it does not load legacy Polymer.
  *
  *
  * @customElement
  * @polymer
  * @demo demo/index.html
  *
  **/

import {AppElement} from '@longlost/app-element/app-element.js';


const combine = (constraints, device) => {
	const combined = typeof constraints === 'object' ? {...constraints} : {};

	// Favor faceMode constraints vs deviceId for iOS.
	if (constraints && constraints.faceMode) {
		return combined;
	}

	if (device && device.deviceId) {
		
		// iOS does not work with 'exact' property for device id,
		// throws an overconstrained error.
    return {...combined, deviceId: device.deviceId};
  }

  return combined;
};


class AppMediaStream extends AppElement {
  static get is() { return 'app-media-stream'; }


  static get properties() {
    return {

	    /**
				* If true, a media stream will be created. If false, the media stream
				* will be discarded and the stream property will be unset. Discarding
				* the media stream is akin to turning off access to the camera and/or
				* microphone, and is useful in some UX conditions (e.g., switching
				* tabs).
				*
				**/
	    active: {
	      type: Boolean,
	      value: false
	    },

	    /**
				* The audio constraints to use when creating the media stream.
				**/
	    audioConstraints: {
	      type: Object,
	      value: null
	    },

    	/**
				* The audio device to use when creating the media stream.
				*
				* @type {MediaDeviceInfo}
				*
				**/
	    audioDevice: {
	      type: Object,
	      value: null
	    },

	    /**
				* A reference to the constraints that are used when requesting the
				* media stream.
				*
				* Read only.
				*
				**/
	    constraints: Object,

	    /**
				* A media stream that is created using the configured audio and/or
				* video device(s).
				*
				* Read only.
				*
				* @type {MediaStream}
				*
				**/
	    stream: Object,

	    /**
				* The video constraints to use when creating the media stream.
				**/
	    videoConstraints: {
	      type: Object,
	      value: null
	    },

	    /**
				* The video device to use when creating the media stream.
				*
				* @type {MediaDeviceInfo}
				*
				**/
	    videoDevice: {
	      type: Object,
	      value: null
	    },

	    /**
	    	* Private computed.
	    	**/
	    _audioConstraints: {
	    	type: Object,
	    	computed: '__computeCombineConstraints(audioConstraints, audioDevice)'
	    },

	    /**
	    	* Private computed.
	    	**/
	    _constraints: {
	    	type: Object,
	    	computed: '__computeConstraints(_audioConstraints, _videoConstraints)',
	    	observer: '__constraintsChanged'
	    },

	    /**
	    	* Private computed.
	    	**/
	    _videoConstraints: {
	    	type: Object,
	    	computed: '__computeCombineConstraints(videoConstraints, videoDevice)'
	    }

    };
  }


  static get observers() {
  	return [
	    '__streamChanged(stream)',
	    '__updateStream(active, constraints)'
	  ]
  }


  __computeCombineConstraints(inputConstraints, inputDevice) {
    if (!inputConstraints && !inputDevice) { return false; }

    return combine(inputConstraints, inputDevice);
  }


  __computeConstraints(audioConstraints, videoConstraints) {
  	if (audioConstraints || videoConstraints) {
  		return {audio: audioConstraints, video: videoConstraints};
    }

    return null;
  }

  // Only update the stream when the constraints actually change in value,
  // not when the objects only change.
  __constraintsChanged(newVal, oldVal) {
  	if (typeof newVal === 'object' && typeof oldVal === 'object') {

  		if (JSON.stringify(newVal) === JSON.stringify(oldVal)) {
  			return;
  		}
  	}

  	this.constraints = newVal;
  }


  __streamChanged(stream) {
  	this.fire('app-media-stream-changed', {value: stream});
  }


  async __updateStream(active, constraints) {
  	try {
  		await this.debounce('app-media-stream-update-stream-debounce', 50);

      if (this.stream) {
        this.stream.getTracks().forEach(track => {
          track.stop();
        });
      }

  		if (active && constraints) {
        this.stream = await navigator.mediaDevices.getUserMedia(constraints);
	    } 
	    else {
	      this.stream = null;
	    }
  	}
  	catch (error) {
  		if (error === 'debounced') { return; }

  		if (error && error.name && error.name === 'NotAllowedError') {
  			this.fire('app-media-stream-permission-denied');
  		}
  		else {
  			console.error(error.name);

  			this.fire('app-media-stream-error-changed', {value: error});
  		}
  	}    
  }  

}

window.customElements.define(AppMediaStream.is, AppMediaStream);

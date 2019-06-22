/**
 * `app-media-stream`
 * rewrite of polymer app-media-stream
 * docs at https://www.webcomponents.org/element/@polymer/app-media
 * Fixes bugs and works in a simpler context,
 * modern, more functional style
 * It does not load legacy polymer (dependency spaghetti hell)
 * Works on ios 11+
 *
 * @customElement
 * @polymer
 * @demo demo/index.html
 */
import {SpritefulElement} from '@spriteful/spriteful-element/spriteful-element.js';


const combine = (constraints, device) => {
	const combined = 
		constraints && typeof constraints === 'object' ? 
			Object.assign({}, constraints) : {};

	// favor faceMode constraints vs deviceId for ios
	if (constraints && constraints.faceMode) {
		return combined;
	}

	if (device && device.deviceId) {
		// ios does not work with 'exact' property for device id,
		// throws an overconstrained error
    return Object.assign({}, combined, {deviceId: device.deviceId});
  }
  return combined;
};


class SpritefulAppMediaStream extends SpritefulElement {
  static get is() { return 'app-media-stream'; }


  static get properties() {
    return {
    	/**
	     * The audio device to use when creating the media stream.
	     *
	     * @type {MediaDeviceInfo}
	     */
	    audioDevice: {
	      type: Object,
	      value: null,
	    },

	    /**
	     * The video device to use when creating the media stream.
	     *
	     * @type {MediaDeviceInfo}
	     */
	    videoDevice: {
	      type: Object,
	      value: null,
	    },

	    /**
	     * The audio constraints to use when creating the media stream.
	     */
	    audioConstraints: {
	      type: Object,
	      value: null,
	    },

	    /**
	     * The video constraints to use when creating the media stream.
	     */
	    videoConstraints: {
	      type: Object,
	      value: null,
	    },

	    /**
	     * A media stream that is created using the configured audio and/or
	     * video device(s).
	     * read only
	     *
	     * @type {MediaStream}
	     */
	    stream: {
	      type: Object,
	      notify: true
	    },

	    /**
	     * If true, a media stream will be created. If false, the media stream
	     * will be discarded and the stream property will be unset. Discarding
	     * the media stream is akin to turning off access to the camera and/or
	     * microphone, and is useful in some UX conditions (e.g., switching
	     * tabs).
	     */
	    active: {
	      type: Boolean,
	      notify: true,
	      value: false,
	    },

	    /**
	     * A reference to the constraints that are used when requesting the
	     * media stream.
	     * read only
	     */
	    constraints: Object,
	    // private computed
	    _constraints: {
	    	type: Object,
	    	computed: '__computeConstraints(_audioConstraints, _videoConstraints)'
	    },
	    // private computed
	    _audioConstraints: {
	    	type: Object,
	    	computed: '__computeCombineConstraints(audioConstraints, audioDevice)'
	    },
	    // private computed
	    _videoConstraints: {
	    	type: Object,
	    	computed: '__computeCombineConstraints(videoConstraints, videoDevice)'
	    }

    };
  }


  static get observers() {
  	return [
	    '__constraintsChanged(_constraints)',
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


  __constraintsChanged(constraints) {
  	this.set('constraints', constraints);
  }


  async __updateStream(active, constraints) {
  	try {
  		await this.debounce('app-media-stream-update-stream-debounce', 50);

      if (this.stream) {
        this.stream.getTracks().forEach(function(track) {
          track.stop();
        });
      }
  		if (active && constraints) {
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
	      this.set('stream', stream);	      
	    } 
	    else {
	      this.set('stream', null);
	    }
  	}
  	catch (error) {
  		if (error === 'debounced') { return; }
  		console.error(error);
  		this.fire('media-stream-error', error);
  	}    
  }  

}

window.customElements.define(SpritefulAppMediaStream.is, SpritefulAppMediaStream);

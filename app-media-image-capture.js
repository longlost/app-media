
/**
 * `app-media-image-capture`
 * rewrite of polymer app-media-image-capture
 * docs at https://www.webcomponents.org/element/@polymer/app-media
 * Fixes bugs and works in a simpler context,
 * modern, more functional style
 * It does not load legacy polymer (dependency spaghetti hell)
 * Works on ios 11+ and you can set the stream to a falsey value
 *
 * @customElement
 * @polymer
 * @demo demo/index.html
 */
import {AppElement} from '@longlost/app-element/app-element.js';
import {schedule} 	from '@longlost/utils/utils.js';
import 'image-capture/src/imagecapture.js'; // safari polyfill that tests first


const TRACK_CONSTRAINT_NAMES = [
  'whiteBalanceMode',
  'colorTemperature',
  'exposureMode',
  'exposureCompensation',
  'iso',
  'focusMode',
  'pointsOfInterest',
  'brightness',
  'contrast',
  'saturation',
  'sharpness',
  'zoom',
  'torch'
];

const PHOTO_SETTING_NAMES = ['fillLightMode', 'imageHeight', 'imageWidth'];
/**
`app-media-image-capture` implements a helpful wrapper element for the emerging
[Image Capture API](https://www.w3.org/TR/image-capture/). This element enables
straight-forward photographic image control and capture that cooperates nicely
with other app-media elements.

NOTE: Image Capture API is still under development. As of today (April 7th,
2017), the API requires a polyfill or an [Origin
Trial](https://github.com/jpchase/OriginTrials/blob/gh-pages/developer-guide.md).
This element will politely neglect to register itself in browsers that do not
feature the appropriate ImageRecorder global constructor.

Chrome and Firefox have partial support for the API behind flags. See the
[ImageCapture API browser
support](https://github.com/w3c/mediacapture-image/blob/gh-pages/implementation-status.md)
page for details.

If you wish to support browsers that do not implement the Image Capture API,
please consider including a polyfill such as
[this one](https://github.com/GoogleChrome/imagecapture-polyfill) in your app.
Note that most polyfills will not enable full functionality, but they should
give your app a reasonable fallback in browsers that do not natively support the
API.

ELEMENT DESIGN NOTE: Many of the properties of this element have a default
configuration value of `null`. While this is weird, it is important to keep the
behavior of multi-property observers in the element implementation normalized
across Polymer 1.x and 2.x. Expect this aspect of the API to change as the
element graduates from the current hybrid implementation to something that can
rely on Polymer >=2.x observer semantics.

@group App Elements
@demo demo/index.html
*/


class AppMediaImageCapture extends AppElement {
  static get is() { return 'app-media-image-capture'; }


  static get properties() {
    return {
    	
    	/**
	     * The input media stream to capture images from. Note that the
	     * stream must have at least one video track in order to be a suitable
	     * source for image capture.
	     *
	     * @type {MediaStream}
	     */
	    stream: Object,

	    /**
	     * MediaStreams can have multiple video tracks. This property enables
	     * you to configure the index of the video track to use.
	     */
	    trackIndex: {
	      type: Number,
	      value: 0
	    },

	    /**
	     * The video track selected from the input MediaStream. This track will
	     * be the source for any images captured.
	     *
	     * @type {MediaStreamTrack}
	     */
	    videoTrack: {
	      type: Object,
	      notify: true,
	      computed: '__computeVideoTrack(stream, trackIndex)'
	    },

	    /**
	     * An ImageCapture instance associated with the selected video track.
	     *
	     * @type {ImageCapture}
	     */
	    imageCapture: {
	      type: Object,
	      notify: true,
	      computed: '__computeImageCapture(videoTrack)'
	    },

	    /**
	     * The last photo captured by the image capture instance.
	     * read only
	     *
	     * @type {Blob}
	     */
	    lastPhoto: {
	      type: Object,
	      notify: true
	    },

	    /**
	     * The last frame grabbed by the image capture instance.
	     * read only
	     *
	     * @type {ImageBitmap}
	     */
	    lastFrame: {
	      type: Object,
	      notify: true
	    },

	    /**
	     * The PhotoCapabilities for the device providing the image data
	     * associated with the chosen video track. This object contains
	     * information about the minimum, maximum, current and incremental
	     * values for various camera settings.
	     * read only
	     *
	     * @see https://w3c.github.io/mediacapture-image/##photocapabilities-section
	     */
	    photoCapabilities: {
	      type: Object,
	      notify: true
	    },

	    /**
	     * The MediaTrackCapabilities for the device providing the image data
	     * associated with the chosen video track. This object contains
	     * information about the minimum, maximum, current and incremental
	     * values for various camera settings.
	     *
	     * @see https://w3c.github.io/mediacapture-image/#mediatrackcapabilities-section
	     */
	    trackCapabilities: {
	      type: Object,
	      notify: true,
	      computed: '__computeTrackCapabilities(imageCapture, videoTrack)'
	    },

	    /**
	     * The PhotoSettings that will be used to configure the ImageCapture
	     * instance used by this element. This configuration is generated
	     * based on the individually configured properties on this element.
	     * A full list of configurable properties can be found
	     * [here](https://w3c.github.io/mediacapture-image/##photosettings-section).
	     * read only
	     *
	     * @type {!PhotoSettings}
	     */
	    photoSettings: {
	      type: Object,
	      notify: true
	    },

	    /**
	     * @type {Polymer.AppMedia.FillLightMode}
	     * @see https://w3c.github.io/mediacapture-image/##photosettings-section
	     */
	    fillLightMode: {
	      type: String,
	      value: null
	    },

	    /** @see https://w3c.github.io/mediacapture-image/##photosettings-section */
	    imageHeight: {
	      type: Number,
	      value: null
	    },

	    /** @see https://w3c.github.io/mediacapture-image/##photosettings-section */
	    imageWidth: {
	      type: Number,
	      value: null
	    },

	    /**
	     * Note that red eye reduction may not be controllable. If it is reported as
	     * controllable, the value of this property will be respected. Otherwise it
	     * will be ignored.
	     *
	     * @see https://w3c.github.io/mediacapture-image/##photosettings-section
	     */
	    redEyeReduction: {
	      type: Boolean,
	      value: null
	    },

	    /**
	     * The constraints that will be applied to the MediaStreamTrack that
	     * is associated with the ImageCapture instance. This configuration is
	     * generated based on the individually configured properties on this
	     * element. A full list of configurable constraints can be found
	     * [here](https://w3c.github.io/mediacapture-image/#constrainable-properties)
	     *
	     * Note that if a given setting is not supported by the current track, it
	     * will be ignored. Also, any constraints that are suported will be clamped
	     * to the bounds that are reported by the track PhotoCapabilities instance.
	     * read only
	     *
	     * @type {!MediaTrackConstraints}
	     */
	    trackConstraints: {
	      type: Object,
	      notify: true
	    },

	    /**
	       @see https://w3c.github.io/mediacapture-image/#mediatracksettings-members
	     */
	    whiteBalanceMode: {
	      type: String,
	      value: null
	    },

	    /**
	       @see https://w3c.github.io/mediacapture-image/#mediatracksettings-members
	     */
	    colorTemperature: {
	      type: Number,
	      value: null
	    },

	    /**
	     * @type {Polymer.AppMedia.MeteringMode}
	     * @see https://w3c.github.io/mediacapture-image/#mediatracksettings-members
	     */
	    exposureMode: {
	      type: String,
	      value: null
	    },

	    /**
	       @see https://w3c.github.io/mediacapture-image/#mediatracksettings-members
	     */
	    exposureCompensation: {
	      type: Number,
	      value: null
	    },

	    /**
	       @see https://w3c.github.io/mediacapture-image/#mediatracksettings-members
	     */
	    iso: {
	      type: Number,
	      value: null
	    },

	    /**
	     * @type {Polymer.AppMedia.MeteringMode}
	     * @see https://w3c.github.io/mediacapture-image/#mediatracksettings-members
	     */
	    focusMode: {
	      type: String,
	      value: null // 'none', 'manual', 'single-shot', 'continuous'
	    },

	    /**
	       @see https://w3c.github.io/mediacapture-image/#mediatracksettings-members
	     */
	    pointsOfInterest: {
	      type: Array,
	      value: null
	    },

	    /**
	       @see https://w3c.github.io/mediacapture-image/#mediatracksettings-members
	     */
	    brightness: {
	      type: Number,
	      value: null
	    },

	    /**
	       @see https://w3c.github.io/mediacapture-image/#mediatracksettings-members
	     */
	    contrast: {
	      type: Number,
	      value: null
	    },

	    /**
	       @see https://w3c.github.io/mediacapture-image/#mediatracksettings-members
	     */
	    saturation: {
	      type: Number,
	      value: null
	    },

	    /**
	       @see https://w3c.github.io/mediacapture-image/#mediatracksettings-members
	     */
	    sharpness: {
	      type: Number,
	      value: null
	    },

	    /**
	       @see https://w3c.github.io/mediacapture-image/#mediatracksettings-members
	     */
	    zoom: {
	      type: Number,
	      value: null
	    },

	    /**
	       @see https://w3c.github.io/mediacapture-image/#mediatracksettings-members
	     */
	    torch: {
	      type: Boolean,
	      value: null
	    }

    };
  }


  static get observers() {
  	return [
  		'__imageCaptureChanged(imageCapture)',
  		'__trackCapabilitiesChanged(trackCapabilities)',
  		'__videoTrackChanged(videoTrack)',
	    '__updatePhotoCapabilities(imageCapture, videoTrack)',
	    '__updatePhotoSettings(imageCapture, photoCapabilities, redEyeReduction, fillLightMode, imageHeight, imageWidth)',
	    '__updateTrackConstraints(imageCapture, trackCapabilities, whiteBalanceMode, exposureMode, focusMode, pointsOfInterest, exposureCompensation, colorTemperature, iso, brightness, contrast, saturation, sharpness, zoom, torch)'
	  ]
  }


  __computeVideoTrack(stream, trackIndex) {
    if (!stream || typeof trackIndex !== 'number') { return; }
    return stream.getVideoTracks()[trackIndex];
  }


  __computeImageCapture(videoTrack) {
    if (!videoTrack) { return; }
    return new ImageCapture(videoTrack);
  }


  __computeTrackCapabilities(imageCapture, videoTrack) {
    if (!imageCapture || !videoTrack) { return; }
    return videoTrack.getCapabilities();
  }


  __imageCaptureChanged(capture) {
  	this.fire('image-capture-changed', {value: capture});
  }


  __trackCapabilitiesChanged(capabilities) {
  	this.fire('track-capabilities-changed', {value: capabilities});
  }


  __videoTrackChanged(track) {
  	this.fire('video-track-changed', {value: track});
  }
  

  async __updatePhotoCapabilities(imageCapture) {
  	try {
  		if (!imageCapture) { return; }
	    await this.debounce('app-media-image-capture-capabilities-debounce', 10);
	    const photoCapabilities = await imageCapture.getPhotoCapabilities();
	    this.set('photoCapabilities', photoCapabilities);
	    this.fire('photo-capabilities-changed', {value: photoCapabilities});       
  	}
  	catch (error) {
  		if (error === undefined) { return; }
  		this.fire('image-capture-capabilities-error', error);
  	}    
  }

  /**
   * ELEMENT DESIGN NOTE: While this observer does not rely on the
   * arguments passed to it, it also avoids the pitfall of relying on
   * properties that may be in a partial / indeterminant state at the
   * time that its debounce'd implementation is invoked. As long as
   * this remains true, it should not be subject to the undesirable
   * behavior exhibited by some elements such as iron-selector.
   */
  __updateTrackConstraints(imageCapture, trackCapabilities) {
		const trackConstraints = 
			this.__generateConfigurationObject(trackCapabilities, TRACK_CONSTRAINT_NAMES);
    // TODO(cdata): It's not clear how constraints from one controller
    // (such as this element) should attempt to compose with constraints
    // from some other controller that has a reference to the same
    // track. It's possible that we may benefit from some additional
    // abstraction dedicated to managing constraints (or perhaps
    // conflicts between controllers).
    // @see https://www.w3.org/TR/mediacapture-streams/#dfn-applyconstraints
    this.set('trackConstraints', trackConstraints);
    this.fire('track-constraints-changed', {value: trackConstraints});
  }


  __updatePhotoSettings(imageCapture, photoCapabilities, redEyeReduction) {
    // Don't update anything until we know the available capabilities:
    if (!photoCapabilities) { return; }

    const getSettings = () => {
    	const settings = 
	    	this.__generateConfigurationObject(photoCapabilities, PHOTO_SETTING_NAMES);

	    // Red eye reduction is a special case. The capability is reported
	    // as one of three states, and only one (controllable) allows the
	    // user to configure it.
	    // @see https://w3c.github.io/mediacapture-image/#redeyereduction-section
	    if (redEyeReduction && photoCapabilities.redEyeReduction === 'controllable') {
	      return Object.assign({}, settings, {redEyeReduction});
	    }
	    return settings
    };

    const photoSettings = getSettings();
    this.set('photoSettings', photoSettings);
    this.fire('photo-settings-changed', {value: photoSettings});
  }

  /**
   * The purpose of this method is to take a set of capabilities reported
   * by the platform, and sift the properties of this element through
   * the filter of those reported capabilities. Properties that are not
   * supported are ignored. Properties that are supported but don't have
   * values within a MediaSettingsRange are clamped to that range.
   * Properties with values that do not occur within a reported vector of
   * supported values are ignored.
   */
  __generateConfigurationObject(reportedCapabilities, allowedNames) {
  	if (!reportedCapabilities) { return {}; }

  	const configurationObject = allowedNames.reduce((accum, name) => {
  		const value 		 				= this[name];
      const capability 				= reportedCapabilities[name];
      const capabilityIsArray = Array.isArray(capability);
      // Don't set photo options if a value is provided, and skip
      // if the name is not present in the PhotoCapabilities object
      // (setting such properties will probably result in an error).
      if (!value || !capability ||
          (capabilityIsArray && capability.indexOf(value) === -1)) {
        return accum;
      }
      // If the capability is an object, then it is probably a
      // MediaSettingsRange. This means we need to clamp the value to the
      // min/max values of the range (otherwise it will likely throw when
      // we try to apply the configuration).
      // @see https://w3c.github.io/mediacapture-image/#mediasettingsrange
      const getConfigVal = (val, capability) => {
      	if (!Array.isArray(capability) && capability instanceof Object) {
	        if (capability.min >= val) {
	          return capability.min;
	        } 
	        else if (capability.max <= val) {
	          return capability.max;
	        }
	      }
	      return val;
      };      

      accum[name] = getConfigVal(value, capability);
      return accum;
  	}, {});

    return configurationObject;
  }

  /**
   * Take a photo. Returns a promise that resolves a photographic Blob.
   *
   * @return Promise<Blob>
   * @see https://www.w3.org/TR/image-capture/#dom-imagecapture-takephoto
   */
  async takePhoto() {  
    if (!this.imageCapture) {
      throw new Error('ImageCapture instance not ready.');
    }
    const photo = await this.imageCapture.takePhoto(this.photoSettings);
  	this.set('lastPhoto', photo);
  	this.fire('last-photo-changed', {value: photo});
    return photo;
  }

  /**
   * Grab a frame from the camera. Returns a promise that resolves an
   * ImageBitmap suitable for drawing to a canvas or used in conjunction
   * with object detection.
   *
   * @return Promise<ImageBitmap>
   * @see https://www.w3.org/TR/image-capture/#dom-imagecapture-grabframe
   */
  async grabFrame() {    
    if (!this.imageCapture) {
      throw new Error('ImageCapture instance not ready.');
    }
    const frame = await this.imageCapture.grabFrame();
    this.set('lastFrame', frame);
    this.fire('last-frame-changed', {value: frame});
    return frame;    
  }

}

window.customElements.define(AppMediaImageCapture.is, AppMediaImageCapture);

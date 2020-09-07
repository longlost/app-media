
/**
	* `app-media-image-capture`
	*
  *   Rewrite of Polymer `app-media-image-capture`.
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
import {schedule} 	from '@longlost/utils/utils.js';


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

const PHOTO_SETTING_NAMES = [
	'fillLightMode', 
	'imageHeight', 
	'imageWidth'
];

/*

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

	    /** @see https://w3c.github.io/mediacapture-image/#mediatracksettings-members **/
	    brightness: {
	      type: Number,
	      value: null
	    },

	    /** 
	    	*	Used in conjunction with `whiteBalanceMode` set to 'manual'.
	    	*
	    	*			 Mode        |   Kelvin range
	    	*
	    	* incandescent					2500-3500
				* fluorescent						4000-5000
				* warm-fluorescent			5000-5500
				* daylight							5500-6500
				* cloudy-daylight				6500-8000
				* twilight							8000-9000
				* shade									9000-10000
	    	*
	    	* @see https://w3c.github.io/mediacapture-image/#mediatracksettings-members **/
	    colorTemperature: {
	      type: Number,
	      value: null
	    },

	    /** @see https://w3c.github.io/mediacapture-image/#mediatracksettings-members **/
	    contrast: {
	      type: Number,
	      value: null
	    },

	    /** @see https://w3c.github.io/mediacapture-image/#mediatracksettings-members **/
	    exposureCompensation: {
	      type: Number,
	      value: null
	    },

	    /**
				* @type {Polymer.AppMedia.MeteringMode}
				*
				* @see https://w3c.github.io/mediacapture-image/#mediatracksettings-members
				*
	     	**/
	    exposureMode: {
	      type: String,
	      value: null
	    },

	    /**
	    	* One of 'auto', 'off' or 'on'.
	    	*
				* @type {Polymer.AppMedia.FillLightMode}
				*
				* @see https://w3c.github.io/mediacapture-image/##photosettings-section
				*
				**/
	    fillLightMode: {
	      type: String,
	      value: null
	    },

	    /**
	    	* @type {Polymer.AppMedia.MeteringMode}
	    	*
	    	* @see https://w3c.github.io/mediacapture-image/#mediatracksettings-members
	    	*
	     	**/
	    focusMode: {
	      type: String,
	      value: null // 'none', 'manual', 'single-shot' or 'continuous'.
	    },

	    /** @see https://w3c.github.io/mediacapture-image/##photosettings-section **/
	    imageHeight: {
	      type: Number,
	      value: null
	    },

	    /** @see https://w3c.github.io/mediacapture-image/##photosettings-section **/
	    imageWidth: {
	      type: Number,
	      value: null
	    },

	    /** @see https://w3c.github.io/mediacapture-image/#mediatracksettings-members **/
	    iso: {
	      type: Number,
	      value: null
	    },

	    /**
				* The PhotoCapabilities for the device providing the 
				* image data associated with the chosen video track. 
				* This object contains information about the minimum, 
				* maximum, current and incremental values for various 
				* camera settings.
				*
				* Read only.
				*
				* @see https://w3c.github.io/mediacapture-image/##photocapabilities-section
				*
				**/
	    photoCapabilities: Object,

	    /**
	    	* The PhotoSettings that will be used to configure the 
	    	* ImageCapture instance used by this element. 
	    	* This configuration is generated based on the individually 
	    	* configured properties on this element.
	    	*
	    	* A full list of configurable properties can be found
	    	* [here](https://w3c.github.io/mediacapture-image/##photosettings-section).
	    	*
	    	* Read only.
	    	*
	    	* @type {!PhotoSettings}
	    	*
	    	**/
	    photoSettings: Object,

	    /** @see https://w3c.github.io/mediacapture-image/#mediatracksettings-members **/
	    pointsOfInterest: {
	      type: Array,
	      value: null
	    },

	    /**
				* Note that red eye reduction may not be controllable. 
				* If it is reported as controllable, the value of this 
				* property will be respected. Otherwise it will be ignored.
				*
				* @see https://w3c.github.io/mediacapture-image/##photosettings-section
				*
				**/
	    redEyeReduction: {
	      type: Boolean,
	      value: null
	    },

	    /**
	       @see https://w3c.github.io/mediacapture-image/#mediatracksettings-members
	     */
	    saturation: {
	      type: Number,
	      value: null
	    },

	    /** @see https://w3c.github.io/mediacapture-image/#mediatracksettings-members **/
	    sharpness: {
	      type: Number,
	      value: null
	    },
    	
    	/**
				* The input media stream to capture images from. 
				* Note that the stream must have at least one 
				* video track in order to be a suitable source 
				* for image capture.
				*
				* @type {MediaStream}
				*
				**/
	    stream: Object,

	    /** @see https://w3c.github.io/mediacapture-image/#mediatracksettings-members **/
	    torch: {
	      type: Boolean,
	      value: null
	    },

	    /**
				* The MediaTrackCapabilities for the device providing the 
				* image data associated with the chosen video track. 
				* This object contains information about the minimum, 
				* maximum, current and incremental values for various 
				* camera settings.
				*
				* @see https://w3c.github.io/mediacapture-image/#mediatrackcapabilities-section
				*
				**/
	    trackCapabilities: {
	      type: Object,
	      computed: '__computeTrackCapabilities(_imageCapture, videoTrack)'
	    },

	    /**
				* The constraints that will be applied to the MediaStreamTrack 
				* that is associated with the ImageCapture instance. 
				* This configuration is generated based on the individually 
				* configured properties on this element. 
				*
				* A full list of configurable constraints can be found
				* [here](https://w3c.github.io/mediacapture-image/#constrainable-properties)
				*
				* Note that if a given setting is not supported by the current track, it
				* will be ignored. Also, any constraints that are suported will be clamped
				* to the bounds that are reported by the track PhotoCapabilities instance.
				*
				* Read only.
				*
				* @type {!MediaTrackConstraints}
				*
				**/
	    trackConstraints: Object,

	    /**
				* MediaStreams can have multiple video tracks. 
				* This property enables you to configure the 
				* index of the video track to use.
				*
				**/
	    trackIndex: {
	      type: Number,
	      value: 0
	    },

	    /**
				* Set to true when `window.ImageCapture` is nullish.
				*  
				* A polyfill is loaded in when this is the case.
				*
				* Read Only.
				*
				**/
	    usingPolyfill: Boolean,

	    /**
				* The video track selected from the input MediaStream. 
				* This track will be the source for any images captured.
				*
				* @type {MediaStreamTrack}
				*
				**/
	    videoTrack: {
	      type: Object,
	      computed: '__computeVideoTrack(stream, trackIndex)'
	    },

	    /** 
	    	*	'auto' or 'manual'. 
	    	*
	    	* Used in conjunction with `colorTemperature` when set to 'manual'.
	    	*
	    	* @see https://w3c.github.io/mediacapture-image/#mediatracksettings-members 
	    	*
	    	**/
	    whiteBalanceMode: {
	      type: String,
	      value: null
	    },

	    /** 
	    	*	1 Represents no zoom. 
	    	*
	    	*	@see https://w3c.github.io/mediacapture-image/#mediatracksettings-members 
	    	*
	    	**/
	    zoom: {
	      type: Number,
	      value: null
	    },

	    /**
				* An ImageCapture instance associated with the selected video track.
				*
				* @type {ImageCapture}
				*
				**/
	    _imageCapture: {
	      type: Object,
	      computed: '__computeImageCapture(videoTrack)'
	    }

    };
  }


  static get observers() {
  	return [
  		'__photoCapabilitiesChanged(photoCapabilities)',
  		'__photoSettingsChanged(photoSettings)',
  		'__trackCapabilitiesChanged(trackCapabilities)',
  		'__trackConstraintsChanged(trackConstraints)',
	    '__updatePhotoCapabilities(_imageCapture, videoTrack)',
	    '__updatePhotoSettings(_imageCapture, photoCapabilities, redEyeReduction, fillLightMode, imageHeight, imageWidth)',
	    '__updateTrackConstraints(_imageCapture, trackCapabilities, whiteBalanceMode, exposureMode, focusMode, pointsOfInterest, exposureCompensation, colorTemperature, iso, brightness, contrast, saturation, sharpness, zoom, torch)',
  		'__videoTrackChanged(videoTrack)'
	  ]
  }


  constructor() {
  	super();


  	if (!window.ImageCapture) { 

  		this.usingPolyfill = true;
  		this.fire('app-media-image-capture-using-polyfill');

    	// Conditional polyfill meant for Safari.
			import(
				/* webpackChunkName: 'image-capture-polyfill' */ 
				'image-capture/src/imagecapture.js'
			); 
  	}
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


  __photoCapabilitiesChanged(capabilities) {
	  this.fire('app-media-image-capture-photo-capabilities-changed', {value: capabilities}); 
  }


  __photoSettingsChanged(settings) {
  	this.fire('app-media-image-capture-photo-settings-changed', {value: settings});
  }


  __trackCapabilitiesChanged(capabilities) {
  	this.fire('app-media-image-capture-track-capabilities-changed', {value: capabilities});
  }


  __trackConstraintsChanged(constraints) { 
    this.fire('app-media-image-capture-track-constraints-changed', {value: constraints});
  }


  __videoTrackChanged(track) {
  	this.fire('app-media-image-capture-video-track-changed', {value: track});
  }
  

  async __updatePhotoCapabilities(imageCapture) {
  	try {
  		if (!imageCapture) { return; }

	    await this.debounce('app-media-image-capture-capabilities-debounce', 10);

	    this.photoCapabilities = await imageCapture.getPhotoCapabilities();
  	}
  	catch (error) {
  		if (error === 'debounced') { return; }
  		console.error(error);

  		this.fire('app-media-image-capture-error-changed', {value: error});
  	}    
  }

  /**
  	* ELEMENT DESIGN NOTE: While this observer does not rely on the
  	* arguments passed to it, it also avoids the pitfall of relying on
  	* properties that may be in a partial / indeterminant state at the
  	* time that its debounce'd implementation is invoked. As long as
  	* this remains true, it should not be subject to the undesirable
  	* behavior exhibited by some elements such as iron-selector.
  	*
  	**/
  __updateTrackConstraints(imageCapture, trackCapabilities) {

  	// TODO: 
    //
    // It's not clear how constraints from one controller
    // (such as this element) should attempt to compose with constraints
    // from some other controller that has a reference to the same
    // track. It's possible that we may benefit from some additional
    // abstraction dedicated to managing constraints (or perhaps
    // conflicts between controllers).
    // @see https://www.w3.org/TR/mediacapture-streams/#dfn-applyconstraints

		this.trackConstraints = 
			this.__generateConfigurationObject(trackCapabilities, TRACK_CONSTRAINT_NAMES);
  }


  __updatePhotoSettings(imageCapture, photoCapabilities, redEyeReduction) {

    // Don't update anything until we know the available capabilities.
    if (!photoCapabilities) { return; }

    const getSettings = () => {
    	const settings = 
	    	this.__generateConfigurationObject(photoCapabilities, PHOTO_SETTING_NAMES);

	    // Red eye reduction is a special case. The capability is reported
	    // as one of three states, and only one (controllable) allows the
	    // user to configure it.
	    // @see https://w3c.github.io/mediacapture-image/#redeyereduction-section
	    if (redEyeReduction && photoCapabilities.redEyeReduction === 'controllable') {
	      return {...settings, redEyeReduction};
	    }

	    return settings;
    };

    this.photoSettings = getSettings();
  }

  /**
  	* The purpose of this method is to take a set of capabilities reported
  	* by the platform, and sift the properties of this element through
  	* the filter of those reported capabilities. Properties that are not
  	* supported are ignored. Properties that are supported but don't have
  	* values within a MediaSettingsRange are clamped to that range.
  	* Properties with values that do not occur within a reported vector of
  	* supported values are ignored.
  	*
  	**/
  __generateConfigurationObject(reportedCapabilities, allowedNames) {
  	if (!reportedCapabilities) { return {}; }

  	const configurationObject = allowedNames.reduce((accum, name) => {
  		const value 		 				= this[name];
      const capability 				= reportedCapabilities[name];
      const capabilityIsArray = Array.isArray(capability);

      // Don't set photo options if a value is provided, and skip
      // if the name is not present in the PhotoCapabilities object
      // (setting such properties will probably result in an error).
      if (
      	value 		 === null 		 || 
      	value 		 === undefined || 
      	capability === null 		 ||
      	capability === undefined ||
      	capability === 'none' 	 ||
        (capabilityIsArray && capability.indexOf(value) === -1)
      ) {
        return accum;
      }

      // If the capability is an object, then it is probably a
      // MediaSettingsRange. This means we need to clamp the value to the
      // min/max values of the range (otherwise it will likely throw when
      // we try to apply the configuration).
      // @see https://w3c.github.io/mediacapture-image/#mediasettingsrange
      const getConfigVal = (val, capability) => {
      	if (!capabilityIsArray && capability instanceof Object) {

	        if (typeof capability.min === 'number' && capability.min >= val) {
	          return capability.min;
	        }

	        if (typeof capability.max === 'number' && capability.max <= val) {
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
  	*
  	* @see https://www.w3.org/TR/image-capture/#dom-imagecapture-takephoto
  	*
  	**/
  takePhoto() {  
    if (!this._imageCapture) {
      throw new Error('ImageCapture instance not ready.');
    }

    return this._imageCapture.takePhoto(this.photoSettings);
  }

  /**
  	* Grab a frame from the camera. Returns a promise that resolves an
  	* ImageBitmap suitable for drawing to a canvas or used in conjunction
  	* with object detection.
  	*
  	* @return Promise<ImageBitmap>
  	*
  	* @see https://www.w3.org/TR/image-capture/#dom-imagecapture-grabframe
  	*
  	**/
  grabFrame() {    
    if (!this._imageCapture) {
      throw new Error('ImageCapture instance not ready.');
    }

    return this._imageCapture.grabFrame();
  }

}

window.customElements.define(AppMediaImageCapture.is, AppMediaImageCapture);

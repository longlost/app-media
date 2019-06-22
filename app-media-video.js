/**
 * `app-media-devices`
 * rewrite of polymer app-media-devices
 * docs at https://www.webcomponents.org/element/@polymer/app-media
 * Fixes bugs and works in a simpler context,
 * modern, more functional style
 * It does not load legacy polymer (dependency spaghetti hell)
 *
 * @customElement
 * @polymer
 * @demo demo/index.html
 */
 import {
  SpritefulElement, 
  html
}                 from '@spriteful/spriteful-element/spriteful-element.js';
import {listen} 	from '@spriteful/utils/utils.js';
import htmlString from './app-media-video.html';


const getScales = (contain, videoWidth, videoHeight, videoRect, selfRect) => {
	const selfRatio 		= selfRect.width / selfRect.height;
  const videoRatio 		= videoWidth 		 / videoHeight;
  const scaleByHeight = contain ? 
  												videoRatio < selfRatio : 
  												videoRatio > selfRatio;
  // This is the scale of the source video's width compared to the
  // width of the video tag's bounding box.
  const sourceScale = videoWidth / videoRect.width;
  // This is the scale applied to the video to transform it based
  // on whether it should be contained within the viewport or not.
  const videoScale = 
  	scaleByHeight ? 
  		selfRect.height / videoRect.height : 
  		selfRect.width  / videoRect.width;
  return {sourceScale, videoScale};
};


class SpritefulAppMediaVideo extends SpritefulElement {
  static get is() { return 'app-media-video'; }

  static get template() {
    return html([htmlString]);
  }


  static get properties() {
    return {
  
  		/**
	     * The input source for the element. This can be a Media Stream, a
	     * Blob or a string URL.
	     *
	     * @type {MediaStream|Blob|string}
	     */
	    source: {
	      type: Object,
	      notify: true
	    },

	    /**
	     * If true, the video will be scaled so that the source video is
	     * flush with the edge of the element, but fully contained by it. If
	     * false (the default), the video will be scaled to the smallest size
	     * that is at full-bleed with respect to the element's bounding box.
	     * Both settings preserve the aspect ratio of the source video.
	     */
	    contain: {
	      type: Boolean,
	      value: false,
	    },

	    /**
	     * If true, the video will be inverted along the x-axis so that it is
	     * effectively mirrored.
	     */
	    mirror: {
	      type: Boolean,
	      value: false,
	    },

	    /**
	     * If true, the video is muted.
	     */
	    muted: {
	      type: Boolean,
	      value: false,
	    },

	    /**
	     * If true, the video will automatically play when it has a source.
	     */
	    autoplay: {
	      type: Boolean,
	      value: false,
	    },

	    /**
	     * If true, the video will loop when it reaches the end of the source.
	     */
	    loop: {
	      type: Boolean,
	      value: false,
	    },

	    /**
	     * A bindable reference to the video element that actually plays the
	     * source. This is sometimes useful in conjunction with
	     * `app-media-audio`, which can accept an HTMLVideoElement as its
	     * source.
	     * read only
	     *
	     * @type {HTMLVideoElement}
	     */
	    videoElement: {
	      type: Object,
	      notify: true
	    },

	    /**
	     * A rect-like object that describes the projection of the source
	     * video element to the viewport (the bounding box of the
	     * app-media-video element).
	     *
	     * This rectangle is useful to understand the space within the
	     * source video element that is visible to the user at any given
	     * time. Depending on the value of contain, and also any transforms
	     * that affect the scale of the video element, this rectangle could
	     * have a range of values that are opportunistically calculated
	     * and made available through this property.
	     * read only
	     */
	    sourceRect: {
	      type: Object,
	      notify: true,
	      value: () => ({
	      	top: 0, 
	      	left: 0, 
	      	width: 0, 
	      	height: 0
	      })
	    },

	    /**
	     * This is the bounding ClientRect of the app-media-video element.
	     * This is kept here for easy future access by users of the element
	     * and is useful in conjunction with sourceRect.
	     * read only
	     *
	     * @type {ClientRect}
	     */
	    viewportRect: {
	      type: Object,
	      notify: true
	    }

    };
  }


  static get observers() {
  	return [
  		'__sourceChanged(source)',
  		'__updateMetrics(contain, mirror)'
  	]
  }


  connectedCallback() {
  	super.connectedCallback();

  	this.videoElement = this.$.videoElement;
  	listen(this.$.videoElement, 'loadedmetadata', this.__metadataLoaded.bind(this));
  	listen(window, 							'resize', 				this.__updateMetrics.bind(this));
  	this.__updateMetrics();
  }

  /**
   * Play the video.
   */
  play() {
    this.$.videoElement.play();
  }

  /**
   * Pause the video.
   */
  pause() {
    this.$.videoElement.pause();
  }


  __sourceChanged(source) {
    const oldSrc 		= this.$.videoElement.src;
    const oldPaused = this.$.videoElement.paused;

    if (typeof source === 'string') {
      this.$.videoElement.src = source;
    } 
    else {
      try {
        // NOTE(cdata): Chrome as of 55 does not support anything other than
        // MediaStream as the value of srcObject (even though the value is
        // allowed to be Blob, per the spec). We try the standardized way,
        // and then fall back to URL.createObjectURL if necessary.
        this.$.videoElement.srcObject = source;
      } 
      catch (error) {
        if (source instanceof Blob) {
          this.$.videoElement.src = window.URL.createObjectURL(source);
        } 
        else {
          console.error(error);
        }
      }
    }

    if (typeof oldSrc === 'string') {
      try {
        window.URL.revokeObjectURL(oldSrc);
      } 
      catch (error) {
      	console.error(error);
      }
    }
    // Ensure that the video keeps playing if it was playing before we
    // changed the source:
    if (!oldPaused && this.$.videoElement.paused) {
      this.play();
    }
    // NOTE(cdata): No need to manually update metrics here, since the
    // new source will cause the video element to fire a loadmetadata
    // event when it is ready.
    this.fire('source-changed', {value: source});
  }


  __updateMetrics() {
    // These values are the width and the height of the video source
    // being displayed by the video element. They stay the same
    // regardless of the dimensions of the video element itself:
    const videoWidth  = this.$.videoElement.videoWidth;
    const videoHeight = this.$.videoElement.videoHeight;
    // If the source video dimensions describe an effectively invisible
    // or unavailable video, we can just hide the element and exit early.
    if (!videoWidth || !videoHeight) {
      this.$.videoElement.style.visibility = 'hidden';
      return;
    } 
    else {
      this.$.videoElement.style.visibility = '';
    }
    // Clear the current transform so that we can get the natural
    // bounding rect of the video element:
    this.$.videoElement.style.transform = '';

    const videoRect = this.$.videoElement.getBoundingClientRect();
    const selfRect 	= this.getBoundingClientRect();
    const {
    	sourceScale, 
    	videoScale
    } = getScales(this.contain, videoWidth, videoHeight, videoRect, selfRect);
    // Since we already grabbed this element's bounding rect, cache it
    // for future comparisons with the source rect:
    this.set('viewportRect', selfRect);
    // The source rect needs to account for:
    //  - The (eventual) scale of the video element within this element
    //  - Any transforms on this or ancestor elements that may change
    //    the effective scale of the video element.
    //  - Vertical and horizontal centering of the video element within
    //    this element due to flex layout rules.
    const downScaledSelfWidth   = selfRect.width  / videoScale;
    const downScaledSelfHeight  = selfRect.height / videoScale;
    const realHorizontalOverlap =
      (videoRect.width  - downScaledSelfWidth) 	* sourceScale;
    const realVerticalOverlap =
      (videoRect.height - downScaledSelfHeight) * sourceScale;

    this.set('sourceRect', {
      left: 	realHorizontalOverlap / 2,
      top: 		realVerticalOverlap 	/ 2,
      width: 	downScaledSelfWidth 	* sourceScale,
      height: downScaledSelfHeight 	* sourceScale
    });

    this.$.videoElement.style.transform = 
    	`scale(${(this.mirror ? -videoScale : videoScale)}, ${videoScale})`;
  }


  __metadataLoaded(event) {
    this.__updateMetrics();
    this.fire('metadata-loaded', {event});
  } 

}

window.customElements.define(SpritefulAppMediaVideo.is, SpritefulAppMediaVideo);

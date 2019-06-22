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
import {SpritefulElement} from '@spriteful/spriteful-element/spriteful-element.js';


class SpritefulAppMediaDevices extends SpritefulElement {
  static get is() { return 'app-media-devices'; }


  static get properties() {
    return {
  
  		/**
	     * A string used to filter the devices based on their kind property.
	     * The string is converted to a RegExp, and then used to match
	     * the kind property. So, it is sufficient to use a value like
	     * 'audioinput' or 'videoinput' to select for microphones and cameras
	     * respectively.
	     */
	    kind: {
	    	type: String, 
	    	value: ''
	    },

	    /**
	     * A list of devices whose kind properties match the configured kind
	     * value.
	     * read only
	     */
	    devices: {
	      type: Array,
	      notify: true,
	      value: () => ([])
	    },

	    /**
	     * A selected device in the list of devices. This starts as the first
	     * item in the devices array. The user can change this value by using
	     * the selectNextDevice and selectPreviousDevice methods.
	     * read only
	     *
	     * @type {MediaDeviceInfo}
	     */
	    selectedDevice: {
	      type: Object,
	      notify: true
	    },

	    /**
	     * The index of the currently selected device.
	     * read only
	     */
	    selectedDeviceIndex: {
	      type: Number,
	      notify: true,
	      value: 0
	    }

    };
  }


  static get observers() {
  	return [
	    '__updateDevices(kind)',
	    '__updateSelectedDevice(devices, selectedDeviceIndex)'
	  ]
  }

  /**
   * Select the next device in the list of devices. If the current device
   * is the last device, the first device is selected.
   */
  selectNextDevice() {
    const nextIndex = this.selectedDeviceIndex + 1;

    if (this.devices && nextIndex < this.devices.length) {
      this.set('selectedDeviceIndex', nextIndex);
    } 
    else {
      this.set('selectedDeviceIndex', 0);
    }
  }

  /**
   * Select the previous device in the list of devices. If the current
   * device is the first device, the last device is selected.
   */
  selectPreviousDevice() {
    const previousIndex = this.selectedDeviceIndex - 1;    

    if (
    	this.devices && 
    	previousIndex < this.devices.length &&
      previousIndex > -1
    ) {
      this.set('selectedDeviceIndex', previousIndex);
    } 
    else {
    	const maxIndex =
      	this.devices && this.devices.length > 0 ? 
      		this.devices.length - 1 : 0;
      this.set('selectedDeviceIndex', maxIndex);
    }
  }

  /**
   * Select a specific device from the list of devices.
   */
  selectDevice(device) {
    const index = this.devices.indexOf(device);
    if (index === -1) {
      throw new Error(`
        app-media-devices:
        	The given object is not a known device.
      `);
    }
    this.set('selectedDeviceIndex', index);
  }


  __updateSelectedDevice(devices, selectedDeviceIndex) {
    if (devices && typeof selectedDeviceIndex === 'number') {
      this.set('selectedDevice', devices[selectedDeviceIndex]);
    }
  }


  async __updateDevices(kind) {
    try {
      const deviceKindRe = new RegExp(kind ? kind : '', 'i');
      const devices      = await navigator.mediaDevices.enumerateDevices();
      const devicesOfKind = 
      	devices.filter(device => 
      		deviceKindRe.test(device.kind));

      this.set('selectedDeviceIndex', 0);
      this.set('devices', devicesOfKind);      
    } 
    catch (error) {
      console.error(error);
    }
  }

}

window.customElements.define(SpritefulAppMediaDevices.is, SpritefulAppMediaDevices);

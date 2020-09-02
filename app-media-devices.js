
/**
  * `app-media-devices`
  *
  *   Rewrite of Polymer `app-media-devices`.
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


class AppMediaDevices extends AppElement {
  static get is() { return 'app-media-devices'; }


  static get properties() {
    return {
  
      /**
        * A string used to filter the devices based on their kind property.
        *
        * The string is converted to a RegExp, and then used to match
        * the `kind` property. So, it is sufficient to use a value like
        * 'audioinput' or 'videoinput' to select for microphones and cameras
        * respectively.
        *
        **/
      kind: {
        type: String, 
        value: ''
      },

      /**
        * A list of devices whose 'kind' properties match the configured `kind`
        * value.
        *
        * Read only.
        *
        **/
      devices: {
        type: Array,
        value: () => ([])
      },

      /**
        * A selected device in the list of devices. This starts as the first
        * item in the devices array. The user can change this value by using
        * the selectNextDevice and selectPreviousDevice methods.
        *
        * Read only.
        *
        * @type {MediaDeviceInfo}
        *
        **/
      selected: Object,

      /**
        * The index of the currently selected device.
        *
        * Read only.
        *
        **/
      selectedIndex: {
        type: Number,
        value: 0
      }

    };
  }


  static get observers() {
    return [
      '__devicesChanged(devices)',
      '__devicesSelectedDeviceIndexChanged(devices, selectedIndex)',      
      '__kindChanged(kind)',
      '__selectedChanged(selected)'
    ]
  }


  __devicesChanged(devices) {
    this.fire('app-media-devices-changed', {value: devices});
  }


  __devicesSelectedDeviceIndexChanged(devices, selectedIndex) {
    if (devices && typeof selectedIndex === 'number') {
      this.selected = devices[selectedIndex];
    }
  }


  async __kindChanged(kind) {
    try {
      const deviceKindRe = new RegExp(kind ? kind : '', 'i');

      const devices = await navigator.mediaDevices.enumerateDevices();

      const devicesOfKind = devices.filter(device => 
        deviceKindRe.test(device.kind));

      this.selectedIndex = 0;
      this.devices = devicesOfKind;
    } 
    catch (error) {
      console.error(error);
    }
  }


  __selectedChanged(selected) {
    this.fire('app-media-devices-selected-changed', {value: selected});
  }

  // Select the next device in the list of devices. 
  // If the current device is the last device, 
  // the first device is selected.
  selectNextDevice() {
    const nextIndex = this.selectedIndex + 1;

    if (this.devices && nextIndex < this.devices.length) {
      this.selectedIndex = nextIndex;
    } 
    else {
      this.selectedIndex = 0;
    }
  }

  // Select the previous device in the list of devices. 
  // If the current device is the first device, 
  // the last device is selected.
  selectPreviousDevice() {
    if (!this.devices || this.devices.length === 0) {
      this.selectedIndex = 0;

      return;
    }

    const previousIndex = this.selectedIndex - 1;    

    if (previousIndex < this.devices.length && previousIndex > -1) {
      this.selectedIndex = previousIndex;
    } 
    else {
      this.selectedIndex = this.devices.length - 1;
    }
  }

  // Select a specific device from the list of devices.
  selectDevice(device) {
    const index = this.devices.indexOf(device);

    if (index === -1) {
      throw new Error(`
        app-media-devices:
          The given object is not a known device.
      `);
    }

    this.selectedIndex = index;
  }

}

window.customElements.define(AppMediaDevices.is, AppMediaDevices);

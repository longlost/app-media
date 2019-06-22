import {html, PolymerElement} from '@polymer/polymer/polymer-element.js';

/**
 * `app-media`
 * 
 *
 * @customElement
 * @polymer
 * @demo demo/index.html
 */
class AppMedia extends PolymerElement {
  static get template() {
    return html`
      <style>
        :host {
          display: block;
        }
      </style>
      <h2>Hello [[prop1]]!</h2>
    `;
  }
  static get properties() {
    return {
      prop1: {
        type: String,
        value: 'app-media',
      },
    };
  }
}

window.customElements.define('app-media', AppMedia);

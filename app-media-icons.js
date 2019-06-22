
import '@polymer/iron-iconset-svg/iron-iconset-svg.js';
import htmlString from './app-media-icons.html';

const spritefulMediaIcons = document.createElement('div');
spritefulMediaIcons.setAttribute('style', 'display: none;');
spritefulMediaIcons.innerHTML = htmlString;
document.head.appendChild(spritefulMediaIcons);

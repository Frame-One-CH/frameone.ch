import { Dots } from './components/dots';

import './components/reveal';

document.documentElement.classList.add('is-loaded');

new Dots(document.getElementById('js-bg-canvas'));

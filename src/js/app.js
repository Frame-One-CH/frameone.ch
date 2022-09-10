import { Dots } from './components/dots';

import './components/frame';
import './components/nav';
import './components/intro';
import './components/section';
import './components/services';
import './components/media-grid';
import './components/marquee';
import './components/reveal';
import './components/scroll-hint';
import './components/scroll';

document.documentElement.classList.add('is-loaded');

new Dots(document.getElementById('js-bg-canvas'));

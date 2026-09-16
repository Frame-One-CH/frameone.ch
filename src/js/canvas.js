import Lenis from 'lenis';

import { Dots } from './components/dots';
import { CanvasGrid } from './components/canvas-grid';

document.documentElement.classList.add('is-loaded');

// Lenis is only an input source here: the page never scrolls, so no raf
// loop, and the canvas pans on the 'virtual-scroll' deltas.
const lenis = new Lenis({
  autoRaf: false,
  gestureOrientation: 'both',
  syncTouch: false,
});

document.querySelectorAll('.canvas-grid').forEach((el) => {
  new CanvasGrid(el, { lenis });
});

new Dots(document.getElementById('js-bg-canvas'));

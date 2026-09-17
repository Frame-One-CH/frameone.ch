import Lenis from 'lenis';

import { CanvasGrid } from './components/canvas-grid';

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

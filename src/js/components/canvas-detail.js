// The overlay a tile opens into: the media Flips out of the grid into the
// detail figure and the surrounding tiles are thrown clear, running in
// reverse on close.
//
// It owns the lifecycle state, which the grid reads as isOpen / isAnimating.
// The pan stays frozen throughout, because the tweens measure from the layout.

import { gsap } from 'gsap';
import { Flip } from 'gsap/Flip';

import { WRAP_MARGIN } from './canvas-pan';
import { VideoPlayer } from './video-player';

gsap.registerPlugin(Flip);

const DEFAULTS = {
  detailDuration: 1,
  detailEase: 'expo.inOut',
};

// How far a thrown tile travels, as a share of the longest viewport edge.
const PUSH_DISTANCE = 0.8;

const PUSH_ROTATION = 40;

// Which way a tile is thrown when a detail opens over it: the first edge it
// sits clear of decides.
const PUSH_OFFSETS = [
  { clear: (rect, target) => rect.bottom < target.top, x: 0, y: -1 },
  { clear: (rect, target) => rect.top > target.bottom, x: 0, y: 1 },
  { clear: (rect, target) => rect.right < target.left, x: -1, y: 0 },
  { clear: (rect, target) => rect.left > target.right, x: 1, y: 0 },
];

// A tile overlapping the target on both axes sits clear of no edge, so it is
// thrown along whichever axis it is furthest off-centre on: it has to leave
// either way, and that is the shorter way out. Two tiles sharing a centre are
// the one case with no direction to read, so they go up.
const overlapOffset = (rect, target, distance) => {
  const awayX = (rect.left + rect.right - target.left - target.right) / 2;
  const awayY = (rect.top + rect.bottom - target.top - target.bottom) / 2;

  if (Math.abs(awayX) > Math.abs(awayY)) {
    return { x: Math.sign(awayX) * distance, y: 0 };
  }

  return { x: 0, y: (Math.sign(awayY) || -1) * distance };
};

const pushOffset = (rect, target, distance) => {
  const push = PUSH_OFFSETS.find((candidate) => candidate.clear(rect, target));

  if (!push) {
    return overlapOffset(rect, target, distance);
  }

  return { x: push.x * distance, y: push.y * distance };
};

export class CanvasDetail {
  constructor(el, pan, options = {}) {
    this.el = el;
    this.pan = pan;
    this.options = { ...DEFAULTS, ...options };

    this.layer = el.querySelector('.canvas-grid__detail');
    // The media Flips into this wrapper, not the figure: the shared player
    // looks the wrapper up as the video's parent.
    this.media = el.querySelector('.canvas-grid__detail-media');
    this.description = el.querySelector('.canvas-grid__detail-description');
    this.closeButton = el.querySelector('.canvas-grid__detail-close');
    this.container = el.querySelector('.canvas-grid__container');

    this.state = 'idle'; // 'idle' | 'opening' | 'open' | 'closing'

    this.item = null;
    this.timeline = null;
    this.player = null;
    this.onClosed = null;

    // The backdrop fades on the same clock as the Flip, so the stylesheet
    // reads the duration from here instead of repeating it. It goes on the
    // root because the page's dot field times against it too, and that canvas
    // sits outside the grid.
    document.documentElement.style.setProperty(
      '--canvas-detail-duration',
      `${this.options.detailDuration}s`,
    );

    this.layer.addEventListener('click', (e) => {
      if (e.target === this.layer && !this.isAnimating) {
        this.close();
      }
    });

    this.closeButton.addEventListener('click', () => {
      if (!this.isAnimating) {
        this.close();
      }
    });
  }

  get isOpen() {
    return this.state !== 'idle';
  }

  get isAnimating() {
    return this.state === 'opening' || this.state === 'closing';
  }

  // The single source of the detail tweens' timing, so open and close cannot
  // drift apart.
  get tween() {
    const { detailDuration: duration, detailEase: ease } = this.options;

    return { duration, ease };
  }

  toggle(item) {
    this.isOpen ? this.close() : this.open(item);
  }

  open(item) {
    if (this.isOpen) {
      return;
    }

    this.state = 'opening';
    this.item = item;

    this.el.classList.add('is-transitioning');

    // The tweens below measure from the layout, so the pan settles first.
    this.pan.freeze();

    this.timeline = gsap.timeline({
      onComplete: () => {
        this.el.classList.remove('is-transitioning');
        // Only now is the media in the figure's flow, giving it a real height.
        // Fading the description in earlier would show it against a collapsed
        // figure, then shift it as the Flip lands.
        this.el.classList.add('is-detail-settled');
        this.state = 'open';
        this.timeline = null;
      },
    });

    // Raised above the detail layer so the backdrop does not occlude the media
    // mid-animation; pointer-events off stops the tile, now in front of the
    // overlay, from catching hovers through it.
    gsap.set(item.el, { zIndex: 101, pointerEvents: 'none' });

    // Set before the Flip state is captured: a shown description takes height
    // in the figure and so changes the box the media lands in.
    this.description.textContent = item.description;
    this.description.hidden = !item.description;

    // The wrapper carries the player's state classes, so it must say which
    // kind of media it holds before the control can react.
    this.media.classList.toggle('media--video', item.isVideo);

    this.flipMediaInto(this.media, true);

    if (item.isVideo) {
      this.player = new VideoPlayer(item.media);
      item.media.play().catch(() => {});
    }

    this.pushTiles(item);

    this.el.classList.add('is-detail-open');
    document.documentElement.classList.add('is-canvas-detail-open');

    // Every tile is still in the tab order behind the overlay, so the whole
    // container leaves it. The open tile's media sits in the detail layer, so
    // it stays reachable.
    this.container.inert = true;

    this.closeButton.focus({ preventScroll: true });
  }

  close() {
    if (this.state !== 'open' || !this.item) {
      return;
    }

    const item = this.item;

    this.state = 'closing';

    this.el.classList.add('is-transitioning');
    this.el.classList.remove('is-detail-settled');

    this.timeline = gsap.timeline({
      onComplete: () => this.settleClosed(item),
    });

    // Down before the media leaves the wrapper, while the player still has the
    // parent it registered against to clear its state classes from.
    this.player?.destroy();
    this.player = null;

    this.flipMediaInto(item.el, false);

    this.pan.items
      .filter((other) => other.isPushed)
      .forEach((other) => {
        const { x, y } = this.pan.positionOf(other);

        this.timeline.to(other.el, { x, y, rotation: 0, ...this.tween }, 0);
      });

    this.el.classList.remove('is-detail-open');
    document.documentElement.classList.remove('is-canvas-detail-open');

    // Back in the tab order before focus is handed back: an inert element
    // cannot take focus.
    this.container.inert = false;

    // The close button is about to fade out and stop taking pointers, so focus
    // returns to the tile the detail opened from.
    if (this.layer.contains(document.activeElement)) {
      item.el.focus({ preventScroll: true });
    }
  }

  pushTiles(item) {
    const targetRect = item.el.getBoundingClientRect();
    const { width, height } = this.pan.viewport;
    const distance = Math.max(width, height) * PUSH_DISTANCE;

    // Every tile the wrap still keeps alive, not just the ones fully inside the
    // edges: a tile straddling an edge is on screen and must be thrown too.
    // Fast keyboard nav lands tiles here, because the settle before an open
    // jumps the pan far enough to bring a whole row in from the margin.
    this.pan
      .visibleItems(WRAP_MARGIN)
      .filter((other) => other !== item)
      .forEach((other) => {
        const offset = pushOffset(
          other.el.getBoundingClientRect(),
          targetRect,
          distance,
        );

        const { x, y } = this.pan.positionOf(other);

        other.isPushed = true;

        this.timeline.fromTo(
          other.el,
          { x, y, rotation: 0 },
          {
            x: x + offset.x,
            y: y + offset.y,
            rotation: gsap.utils.random(-PUSH_ROTATION, PUSH_ROTATION),
            ...this.tween,
          },
          0,
        );
      });
  }

  // Move the media between tile and detail wrapper, tweening it to where it
  // lands. Open and close are the same move in opposite directions.
  flipMediaInto(parent, isDetail) {
    const state = Flip.getState(this.item.media);

    parent.prepend(this.item.media);
    this.item.media.classList.toggle('canvas-grid__media--detail', isDetail);

    this.timeline.add(Flip.from(state, { ...this.tween, absolute: true }), 0);
  }

  settleClosed(item) {
    this.pan.items.forEach((other) => {
      gsap.set(other.el, { clearProps: 'x,y,rotation,transform' });
      other.isPushed = false;
    });

    gsap.set(item.el, { clearProps: 'zIndex,pointerEvents' });

    this.el.classList.remove('is-transitioning');

    this.description.hidden = true;
    this.description.textContent = '';

    this.state = 'idle';
    this.item = null;
    this.timeline = null;

    this.pan.thaw();
    // Clearing the transforms above leaves the items untransformed, so redraw
    // before the browser paints: otherwise they flash at the container origin
    // for one frame before the loop catches up.
    this.pan.render();

    this.onClosed?.();
  }

  destroy() {
    this.timeline?.kill();
    this.player?.destroy();
  }
}

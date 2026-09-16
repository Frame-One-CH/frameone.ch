// An endless, draggable canvas of project tiles: lays the tiles out and wires
// them to input. The pan, the opening reveal and the detail overlay each own
// themselves.

import { CanvasPan } from './canvas-pan';
import { CanvasDetail } from './canvas-detail';
import { playIntro } from './canvas-intro';
import { POSTER_TIME } from './video-player';

const DEFAULTS = {
  mediaHeight: 220,
  gap: 120,
  // A desktop-width gutter below this width would leave only one tile on
  // screen at a time.
  gapMobile: 60,
  gapBreakpoint: 768,
  columns: 6,
  rows: 6,
};

// Clicks that move less than this are treated as a tap, not a drag.
const CLICK_THRESHOLD = 5;

const KEY_STEP = 220;

// Breathing room kept between a keyboard-focused tile and the viewport edge,
// so the focus ring and the caption below the tile both stay in frame.
const FOCUS_MARGIN = 80;

const KEY_DIRECTIONS = {
  ArrowLeft: { x: 1, y: 0 },
  ArrowRight: { x: -1, y: 0 },
  ArrowUp: { x: 0, y: 1 },
  ArrowDown: { x: 0, y: -1 },
};

export class CanvasGrid {
  constructor(el, options = {}) {
    this.el = el;
    this.options = { ...DEFAULTS, ...options };

    // The canvas pans on Lenis's normalized wheel deltas.
    this.lenis = this.options.lenis;

    this.container = el.querySelector('.canvas-grid__container');
    this.sources = Array.from(el.querySelectorAll('[data-canvas-media]'));
    this.detailLayer = el.querySelector('.canvas-grid__detail');

    if (!this.container || !this.sources.length || !this.detailLayer) {
      return;
    }

    if (!this.lenis) {
      throw new Error('CanvasGrid requires a Lenis instance to pan on.');
    }

    this.reducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;

    this.viewport = { width: window.innerWidth, height: window.innerHeight };
    this.pan = new CanvasPan(this.viewport, this.options);
    this.pointer = { x: 0, y: 0 };

    this.needsRebuild = false;
    this.intro = null;

    // Without motion the canvas is a plain static grid: no pan loop, no intro,
    // no detail view, and so nothing below to wire.
    if (this.reducedMotion) {
      this.buildStatic();
      return;
    }

    this.detail = new CanvasDetail(el, this.pan, this.options);
    // A resize deferred by the detail view is taken now the pan is free.
    this.detail.onClosed = () => {
      if (this.needsRebuild) {
        this.rebuild();
      }
    };

    this.build();
    this.addEvents();
    this.tick();
    this.playIntro();
  }

  // Tiles are not controls here, so they leave the tab order and the visible
  // caption becomes each one's only label.
  buildStatic() {
    this.el.classList.add('canvas-grid--static');

    this.build();

    this.items.forEach((item) => {
      item.el.disabled = true;
      item.el.removeAttribute('aria-label');
      item.el
        .querySelector('.canvas-grid__caption')
        ?.removeAttribute('aria-hidden');
    });

    this.pan.render();
  }

  build() {
    const { mediaHeight, columns, rows } = this.options;

    // Every row's slack and the wrap steps must agree on one gap, so it is
    // resolved once per build.
    this.gap = this.resolveGap();

    const gap = this.gap;
    const stepY = mediaHeight + gap;

    this.container.innerHTML = '';
    this.items = [];

    // The widest row sets the tile width; narrower rows spend the slack as
    // extra gap, keeping every row the same width so the wrap is seamless.
    const grid = [];

    for (let row = 0; row < rows; row++) {
      const cells = [];

      for (let column = 0; column < columns; column++) {
        const source =
          this.sources[(row * columns + column) % this.sources.length];
        cells.push({ source, width: this.mediaWidth(source) });
      }

      grid.push(cells);
    }

    const rowWidths = grid.map(
      (cells) =>
        cells.reduce((total, cell) => total + cell.width, 0) + columns * gap,
    );

    const tileWidth = Math.max(...rowWidths);

    grid.forEach((cells, row) => {
      const rowGap = gap + (tileWidth - rowWidths[row]) / columns;
      // Offset alternate rows by half a step, so the pattern reads as
      // organic rather than a plain matrix.
      let x = row % 2 === 0 ? (cells[0].width + rowGap) / 2 : 0;

      cells.forEach((cell) => {
        this.items.push(
          this.createItem(cell.source, { x, y: row * stepY }, cell.width),
        );

        x += cell.width + rowGap;
      });
    });

    this.pan.setItems(this.items, { x: tileWidth, y: rows * stepY });
    this.pan.moveTo(this.viewport.width * -0.1, this.viewport.height * -0.1);
  }

  resolveGap() {
    const { gap, gapMobile, gapBreakpoint } = this.options;

    return this.viewport.width < gapBreakpoint ? gapMobile : gap;
  }

  mediaWidth(source) {
    const ratio =
      Number(source.dataset.width) / Number(source.dataset.height) || 1;

    return Math.round(this.options.mediaHeight * ratio);
  }

  createItem(source, position, width) {
    const isVideo = source.dataset.canvasMedia === 'video';
    const height = this.options.mediaHeight;

    const el = document.createElement('button');
    el.type = 'button';
    el.className = 'canvas-grid__item';
    el.style.width = `${width}px`;
    el.style.height = `${height}px`;

    if (source.dataset.label) {
      el.setAttribute('aria-label', source.dataset.label);
    }

    const media = document.createElement(isVideo ? 'video' : 'img');
    media.className = 'canvas-grid__media';
    media.src = isVideo
      ? `${source.getAttribute('src')}#t=${POSTER_TIME}`
      : source.getAttribute('src');

    if (isVideo) {
      media.muted = true;
      media.playsInline = true;
      media.preload = 'metadata';
    } else {
      media.alt = '';
      media.loading = 'lazy';
      media.draggable = false;
    }

    el.append(media);

    if (source.dataset.label) {
      const caption = document.createElement('span');
      caption.className = 'canvas-grid__caption';
      caption.textContent = source.dataset.label;
      caption.setAttribute('aria-hidden', 'true');
      el.append(caption);
    }

    this.container.append(el);

    const item = {
      el,
      media,
      isVideo,
      description: source.dataset.description || '',
      x: position.x,
      y: position.y,
      width,
      height,
      extraX: 0,
      extraY: 0,
      // How far behind the shared pan this tile is, in pixels. Drawn from,
      // never wrapped on: the wrap must see every tile at the same position
      // or they fold over at different moments and the lattice tears.
      lagX: 0,
      lagY: 0,
      isPushed: false,
    };

    // A rebuild replaces every element, so binding here is what keeps a
    // rebuilt tile interactive. The listeners die with the element they are
    // on, so there is nothing to take down.
    this.bindItem(item);

    return item;
  }

  bindItem(item) {
    if (this.reducedMotion) {
      return;
    }

    if (item.isVideo) {
      item.el.addEventListener('pointerenter', () => {
        this.startHoverPlayback(item);
      });

      // Tiles carry no player of their own, so the grid rewinds its finished
      // videos. The open detail's video is rewound by its player instead.
      item.media.addEventListener('ended', () => {
        if (item !== this.detail.item) {
          item.media.currentTime = POSTER_TIME;
        }
      });
    }

    // The grid wraps and the tab order does not, so focus can land on a tile
    // that is off-screen or clipped by an edge.
    item.el.addEventListener('focus', () => {
      this.focusItem(item);
    });

    item.el.addEventListener('click', (e) => {
      if (this.detail.isAnimating) {
        return;
      }

      // Enter and Space arrive as a click with no click count and no real
      // coordinates, so they skip the drag test.
      if (e.detail === 0) {
        this.openDetail(item);
        return;
      }

      const movedX = Math.abs(e.clientX - this.pointer.x);
      const movedY = Math.abs(e.clientY - this.pointer.y);

      if (movedX < CLICK_THRESHOLD && movedY < CLICK_THRESHOLD) {
        this.openDetail(item);
      }
    });
  }

  // The intro holds the same transforms the Flip is about to measure, so it
  // is cut short first.
  openDetail(item) {
    this.finishIntro();
    this.detail.toggle(item);
  }

  addEvents() {
    if (this.reducedMotion) {
      return;
    }

    this.onVirtualScroll = this.virtualScroll.bind(this);
    this.onPointerDown = this.pointerDown.bind(this);
    this.onPointerMove = this.pointerMove.bind(this);
    this.onPointerUp = this.pointerUp.bind(this);
    this.onResize = this.resize.bind(this);
    this.onKeydown = this.keydown.bind(this);

    this.lenis.on('virtual-scroll', this.onVirtualScroll);
    this.el.addEventListener('pointerdown', this.onPointerDown);
    window.addEventListener('pointermove', this.onPointerMove);
    window.addEventListener('pointerup', this.onPointerUp);
    window.addEventListener('resize', this.onResize);
    document.addEventListener('keydown', this.onKeydown);
  }

  removeEvents() {
    this.lenis.off('virtual-scroll', this.onVirtualScroll);
    this.el.removeEventListener('pointerdown', this.onPointerDown);
    window.removeEventListener('pointermove', this.onPointerMove);
    window.removeEventListener('pointerup', this.onPointerUp);
    window.removeEventListener('resize', this.onResize);
    document.removeEventListener('keydown', this.onKeydown);
  }

  // Lenis emits this before applying any scrolling of its own, so the deltas
  // arrive unclamped even though the page has nothing to scroll.
  virtualScroll({ deltaX, deltaY, event }) {
    if (this.detail.isOpen) {
      return;
    }

    if (event.cancelable) {
      event.preventDefault();
    }

    this.pan.by(-deltaX, -deltaY);
  }

  pointerDown(e) {
    this.pointer.x = e.clientX;
    this.pointer.y = e.clientY;

    if (this.detail.isOpen) {
      return;
    }

    this.pan.dragStart(e.clientX, e.clientY);

    this.el.classList.add('is-pressed');

    // A press on a tile is a potential tap, so it keeps its full size; only a
    // press on the empty canvas pushes the grid back.
    if (!e.target.closest('.canvas-grid__item')) {
      this.el.classList.add('is-pressed-canvas');
    }
  }

  pointerMove(e) {
    if (!this.pan.isDragging) {
      return;
    }

    const { movedX, movedY } = this.pan.dragTo(e.clientX, e.clientY);

    // A press that never clears the threshold is a tap, so the dragging state
    // waits until the pointer has actually travelled.
    if (
      Math.abs(movedX) >= CLICK_THRESHOLD ||
      Math.abs(movedY) >= CLICK_THRESHOLD
    ) {
      this.el.classList.add('is-dragging');
    }
  }

  pointerUp() {
    if (!this.pan.dragEnd()) {
      return;
    }

    this.el.classList.remove('is-pressed', 'is-pressed-canvas', 'is-dragging');
  }

  keydown(e) {
    if (e.key === 'Escape' && this.detail.isOpen) {
      this.detail.close();
      return;
    }

    const direction = KEY_DIRECTIONS[e.key];

    if (!direction || this.detail.isOpen) {
      return;
    }

    e.preventDefault();

    this.pan.by(direction.x * KEY_STEP, direction.y * KEY_STEP);
  }

  resize() {
    this.viewport.width = window.innerWidth;
    this.viewport.height = window.innerHeight;

    // Only a change to the resolved gap invalidates the per-row slack and the
    // wrap steps. A rebuild resets the pan, so it defers until the detail
    // view gives the screen back.
    if (this.resolveGap() === this.gap) {
      return;
    }

    if (this.detail.isOpen) {
      this.needsRebuild = true;
      return;
    }

    this.rebuild();
  }

  // Throws away the DOM the intro is holding, so the intro is stood down
  // first. The tiles' listeners come back with the new elements.
  rebuild() {
    this.needsRebuild = false;

    this.finishIntro();
    this.build();
    this.pan.render();
  }

  playIntro() {
    this.pan.render();

    this.intro = playIntro(
      this.el,
      this.pan.visibleItems(),
      this.viewport,
      this.options,
    );
  }

  finishIntro() {
    this.intro?.finish();
    this.intro = null;
  }

  startHoverPlayback(item) {
    if (this.pan.isDragging || this.detail.isOpen) {
      return;
    }

    item.media.play().catch(() => {});
  }

  tick() {
    if (this.pan.advance()) {
      this.pan.render();
    }

    this.raf = requestAnimationFrame(this.tick.bind(this));
  }

  // Pan a tile fully into frame. Tab order runs in build order, which has
  // nothing to do with where the wrap has put a tile, so this is what keeps
  // the focused one visible.
  focusItem(item) {
    if (this.reducedMotion || this.detail.isOpen) {
      return;
    }

    const { x, y } = this.pan.positionOf(item);

    const { width, height } = this.viewport;

    let shiftX = 0;
    let shiftY = 0;

    if (x < FOCUS_MARGIN) {
      shiftX = FOCUS_MARGIN - x;
    } else if (x + item.width > width - FOCUS_MARGIN) {
      shiftX = width - FOCUS_MARGIN - (x + item.width);
    }

    if (y < FOCUS_MARGIN) {
      shiftY = FOCUS_MARGIN - y;
    } else if (y + item.height > height - FOCUS_MARGIN) {
      shiftY = height - FOCUS_MARGIN - (y + item.height);
    }

    if (!shiftX && !shiftY) {
      return;
    }

    this.pan.shiftBy(shiftX, shiftY);
  }

  // The static build starts no loop, wires no input and opens no detail, so
  // each of these is a no-op there.
  destroy() {
    cancelAnimationFrame(this.raf);
    this.finishIntro();
    this.detail?.destroy();

    if (!this.reducedMotion) {
      this.removeEvents();
    }
  }
}

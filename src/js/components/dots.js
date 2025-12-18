import { Cursor } from './cursor';
import debounce from 'lodash/debounce';

const DOT_RADIUS = 2;

const OPACITY_DEFAULT = 0.1;
const OPACITY_TARGET = 1;
const OPACITY_STEP = 0.1;

const IMPACT_DEFAULT = 80;
const IMPACT_MIN = 150;
const IMPACT_MAX = 250;

export class Dots {
  constructor(el) {
    this.canvas = el;
    this.context = this.canvas.getContext('2d');

    this.toggleOn = new Audio(
      new URL('../../assets/sounds/celebration.mp3', import.meta.url),
    );
    this.toggleOn.volume = 0.5;

    this.toggleOff = new Audio(
      new URL('../../assets/sounds/toggle-off.mp3', import.meta.url),
    );
    this.toggleOff.volume = 0.5;

    this.init();
  }

  init() {
    this.setCanvasSize();
    this.bindEvents();
    this.createDots();
    this.render();
  }

  bindEvents() {
    this.debouncedResize = debounce(this.onResize.bind(this), 300);
    window.addEventListener('resize', this.debouncedResize);
    window.addEventListener('mousedown', this.onMousedown.bind(this));
    window.addEventListener('mouseup', this.onMouseup.bind(this));
    window.addEventListener('mousemove', this.onMousemove.bind(this));
    document.addEventListener(
      'visibilitychange',
      this.onVisibilityChange.bind(this),
    );
  }

  initRendering(fps = 30) {
    this.prevTime = 0;
    this.isRendering = true;
    this.fpsInterval = 1000 / fps;
    this.then = window.performance.now();

    requestAnimationFrame(this.tick.bind(this));
  }

  startRendering() {
    this.isRendering = true;
  }

  stopRendering() {
    this.isRendering = false;
  }

  resetRendering() {
    window.clearInterval(this.stopInterval);
    this.stopInterval = null;

    if (!this.isRendering) {
      this.initRendering();
    }
  }

  setCanvasSize() {
    this.canvas.width = this.canvas.offsetWidth;
    this.canvas.height = this.canvas.offsetHeight;

    if (this.canvas.width > 640) {
      this.SPREAD = 22;
    } else {
      this.SPREAD = 16;
    }
  }

  onMousemove(e) {
    this.mouseX = e.x;
    this.mouseY = e.y;
    this.moved = true;
    this.resetRendering();
  }

  onMousedown(e) {
    this.mouseStart = new Date();
    this.resetRendering();
  }

  onMouseup(e) {
    this.mouseX = e.x;
    this.mouseY = e.y;
    this.clicked = true;

    this.clickTime = new Date() - this.mouseStart;
    this.impact = this.clamp(this.clickTime, IMPACT_MIN, IMPACT_MAX);

    if (this.impact === IMPACT_MAX) {
      if (this.cursor) {
        this.toggleOff.cloneNode().play().catch(() => {});
        this.cursor.destory();
        this.cursor = null;
      } else {
        this.cursor = new Cursor();
        this.cursor.setPosition(this.mouseX, this.mouseY);
        this.cursor.activate();
        this.toggleOn.cloneNode().play().catch(() => {});
      }
    }
  }

  onResize() {
    this.setCanvasSize();
    this.createDots();
    this.render();
  }

  onVisibilityChange() {
    if (document.hidden) {
      this.stopRendering();
    } else {
      this.resetRendering();
    }
  }

  createDots() {
    this.dots = [];
    const margin = this.SPREAD / 2;
    const offsetX = (this.canvas.width % this.SPREAD) / 2;
    const offsetY = (this.canvas.height % this.SPREAD) / 2;

    for (
      let x = margin + offsetX;
      x < this.canvas.width - margin;
      x += this.SPREAD
    ) {
      for (
        let y = margin + offsetY;
        y < this.canvas.height - margin;
        y += this.SPREAD
      ) {
        this.dots.push({
          x,
          y,
        });
      }
    }

    this.dotCount = this.dots.length;
  }

  clamp(input, min, max) {
    return input < min ? min : input > max ? max : input;
  }

  drawDot(dot, opacity = OPACITY_DEFAULT) {
    this.context.beginPath();
    this.context.fillStyle = `rgba(255, 255, 255, ${opacity})`;
    this.context.fillRect(dot.x, dot.y, DOT_RADIUS, DOT_RADIUS);
  }

  render() {
    // set random opacity
    /*
    const random = Math.floor(Math.random() * this.dots.length);
    this.dots[random].targetOpacity = OPACITY_TARGET;
    this.dots[random].currentOpacity = OPACITY_DEFAULT;
    */

    for (let i = 0; i < this.dotCount; i++) {
      let dot = this.dots[i];
      let step = OPACITY_STEP;

      if (this.clicked || this.moved) {
        const dx = this.mouseX - dot.x;
        const dy = this.mouseY - dot.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const roundedDistance = Math.round(distance * 1.8);

        this.impact = this.clickTime ? this.impact : IMPACT_DEFAULT;

        if (roundedDistance < this.impact) {
          step = roundedDistance / this.impact;

          dot.currentOpacity = OPACITY_DEFAULT;
          dot.targetOpacity = OPACITY_TARGET;
        }

        if (i === this.dotCount - 1) {
          this.clicked = false;
          this.clickTime = 0;
          this.moved = false;

          if (!this.stopInterval) {
            this.stopInterval = window.setTimeout(() => {
              this.stopRendering();
            }, 2000);
          }
        }
      }

      let currentOpacity = dot.currentOpacity;

      if (currentOpacity) {
        let targetOpacity = dot.targetOpacity;

        if (currentOpacity >= targetOpacity) {
          currentOpacity -= step;
          targetOpacity = OPACITY_DEFAULT;

          if (currentOpacity <= OPACITY_DEFAULT) {
            currentOpacity = OPACITY_DEFAULT;
          }
        } else {
          currentOpacity += step;
        }

        dot.currentOpacity = currentOpacity;
        dot.targetOpacity = targetOpacity;
      }

      this.drawDot(dot, currentOpacity);
    }
  }

  clear() {
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  tick(now) {
    if (!this.isRendering) {
      return;
    }

    requestAnimationFrame(this.tick.bind(this));

    // calc elapsed time since last loop
    this.elapsed = now - this.then;

    // if enough time has elapsed, draw the next frame
    if (this.elapsed > this.fpsInterval) {
      // Get ready for next frame by setting then=now, but...
      // Also, adjust for fpsInterval not being multiple of 16.67
      this.then = now - (this.elapsed % this.fpsInterval);

      this.clear();
      this.render();
    }
  }
}

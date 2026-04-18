import { Cursor } from './cursor';
import debounce from 'lodash/debounce';

const SPREAD = 20;
const DOT_RADIUS = 10;

const OPACITY_DEFAULT = 0.1;
const OPACITY_TARGET = 1;
const OPACITY_STEP = 0.1;
const IMPACT_DISTANCE_SCALE = 1.8;
const CURSOR_REPEL_RADIUS_MULTIPLIER = 10;
const CURSOR_REPEL_RETURN_EASING = 0.18;
const CURSOR_REPEL_SNAP_EPSILON = 0.01;
const CLICK_EXPLOSION_STRENGTH = 0.4;

const IMPACT_DEFAULT = 80;
const IMPACT_MIN = 150;
const IMPACT_MAX = 250;

export class Dots {
  constructor(el) {
    this.canvas = el;
    this.context = this.canvas.getContext('2d');
    this.dotImage = new Image();

    this.dotImage.onload = () => {
      this.resetRendering();
    };

    this.dotImage.src = new URL(
      '../../assets/canvas-dot.png',
      import.meta.url,
    ).href;

    this.toggleOn = new Audio(
      new URL('../../assets/sounds/celebration.mp3', import.meta.url),
    );

    this.toggleOff = new Audio(
      new URL('../../assets/sounds/toggle-off.mp3', import.meta.url),
    );

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
    this.width = this.canvas.offsetWidth;
    this.height = this.canvas.offsetHeight;
    this.pixelRatio = window.devicePixelRatio || 1;

    this.canvas.width = Math.round(this.width * this.pixelRatio);
    this.canvas.height = Math.round(this.height * this.pixelRatio);
    this.context.setTransform(this.pixelRatio, 0, 0, this.pixelRatio, 0, 0);
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
    this.explosionStrength = CLICK_EXPLOSION_STRENGTH;
    this.resetRendering();

    if (this.impact === IMPACT_MAX) {
      if (this.cursor) {
        this.playSound(this.toggleOff);
        this.cursor.destroy();
        this.cursor = null;
      } else {
        this.playSound(this.toggleOn);
        this.cursor = new Cursor();
        this.cursor.setPosition(this.mouseX, this.mouseY);
        this.cursor.activate();
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
    const width = this.width;
    const height = this.height;

    if (SPREAD <= 0) {
      this.dots = [];
      this.dotCount = 0;
      return;
    }

    const cols = Math.floor(width / SPREAD);
    const rows = Math.floor(height / SPREAD);
    const padX = (width - cols * SPREAD) / 2;
    const padY = (height - rows * SPREAD) / 2;
    const halfSpread = SPREAD / 2;
    const dots = new Array(rows * cols);
    let idx = 0;

    for (let col = 0; col < cols; col++) {
      const x = padX + col * SPREAD + halfSpread;

      for (let row = 0; row < rows; row++) {
        const y = padY + row * SPREAD + halfSpread;
        dots[idx++] = { x, y, offsetX: 0, offsetY: 0 };
      }
    }

    this.dots = dots;
    this.dotCount = idx;
  }

  clamp(input, min, max) {
    return input < min ? min : input > max ? max : input;
  }

  drawDot(x, y, opacity = OPACITY_DEFAULT) {
    this.context.globalAlpha = opacity;
    this.context.drawImage(this.dotImage, x, y, DOT_RADIUS, DOT_RADIUS);
    this.context.globalAlpha = 1;
  }

  render() {
    // set random opacity
    /*
    const random = Math.floor(Math.random() * this.dots.length);
    this.dots[random].targetOpacity = OPACITY_TARGET;
    this.dots[random].currentOpacity = OPACITY_DEFAULT;
    */

    const dots = this.dots;
    const dotCount = this.dotCount;
    const mouseX = this.mouseX;
    const mouseY = this.mouseY;

    const hasInteraction = this.clicked || this.moved;
    const explosionStrength = this.explosionStrength || 0;
    const hasExplosion = explosionStrength > 0;
    const hasMotionEffect = hasInteraction || hasExplosion;

    const impact = this.clickTime ? this.impact : IMPACT_DEFAULT;
    const impactThreshold = impact / IMPACT_DISTANCE_SCALE;
    const impactThresholdSquared = impactThreshold * impactThreshold;

    const repulsionRadius = SPREAD * CURSOR_REPEL_RADIUS_MULTIPLIER;
    const repulsionRadiusSquared = repulsionRadius * repulsionRadius;
    const repulsionMaxOffset = SPREAD;

    for (let i = 0; i < dotCount; i++) {
      const dot = dots[i];
      let step = OPACITY_STEP;
      let repelTargetX = 0;
      let repelTargetY = 0;

      if (hasMotionEffect) {
        const dx = mouseX - dot.x;
        const dy = mouseY - dot.y;
        const distanceSquared = dx * dx + dy * dy;
        const isInRadius =
          distanceSquared > 0 && distanceSquared < repulsionRadiusSquared;
        const isInImpactRadius =
          hasInteraction &&
          distanceSquared > 0 &&
          distanceSquared < impactThresholdSquared;
        const needsDistance = isInRadius || isInImpactRadius;

        let distance = 0;
        let invDistance = 0;

        if (needsDistance) {
          distance = Math.sqrt(distanceSquared);
          invDistance = 1 / distance;
        }

        if (isInRadius) {
          const proximity = 1 - distance / repulsionRadius;
          const repelOffset = proximity * proximity * repulsionMaxOffset;

          repelTargetX = -dx * invDistance * repelOffset;
          repelTargetY = -dy * invDistance * repelOffset;
        }

        if (hasExplosion && isInRadius) {
          const proximity = 1 - distance / repulsionRadius;
          const explosionOffset =
            proximity * proximity * this.impact * explosionStrength;

          repelTargetX += -dx * invDistance * explosionOffset;
          repelTargetY += -dy * invDistance * explosionOffset;
        }

        // Skip sqrt for dots that are definitely outside impact range.
        if (isInImpactRadius) {
          step = (distance * IMPACT_DISTANCE_SCALE) / impact;

          dot.currentOpacity = OPACITY_DEFAULT;
          dot.targetOpacity = OPACITY_TARGET;
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

      const offsetX =
        dot.offsetX + (repelTargetX - dot.offsetX) * CURSOR_REPEL_RETURN_EASING;
      const offsetY =
        dot.offsetY + (repelTargetY - dot.offsetY) * CURSOR_REPEL_RETURN_EASING;

      dot.offsetX = Math.abs(offsetX) < CURSOR_REPEL_SNAP_EPSILON ? 0 : offsetX;
      dot.offsetY = Math.abs(offsetY) < CURSOR_REPEL_SNAP_EPSILON ? 0 : offsetY;

      this.drawDot(dot.x + dot.offsetX, dot.y + dot.offsetY, currentOpacity);
    }

    if (hasExplosion) {
      this.explosionStrength = Math.max(0, explosionStrength - OPACITY_STEP);
    }

    if (hasInteraction) {
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

  clear() {
    this.context.clearRect(0, 0, this.width, this.height);
  }

  playSound(baseSound) {
    const cleanup = () => {
      sound.pause();
      sound.currentTime = 0;
      sound.src = '';
      sound.removeEventListener('ended', cleanup);
    };

    const sound = baseSound.cloneNode();

    sound.addEventListener('ended', cleanup);
    sound.volume = 0.2;
    sound.play().catch(() => {});

    return sound;
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

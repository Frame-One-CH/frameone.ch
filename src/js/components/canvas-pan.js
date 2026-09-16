// The endless pan behind the canvas grid: an eased position, a per-item lag,
// and a wrap that repeats the lattice in both axes without reflowing the DOM.
//
// It knows an item only as { x, y, width, height } to read and
// { extraX, extraY, lagX, lagY } to own, so the grid can hand over a fresh
// list on every rebuild.

const DEFAULTS = {
  ease: 0.05,
  // The share of its ease the furthest downstream tile keeps: 1 is no stagger,
  // lower drags the tail further behind. Tiles the pan heads towards trail the
  // ones it leaves, so a throw runs through the grid like a whip.
  staggerFalloff: 0.25,
  // Pixels of outstanding pan before the stagger reaches full strength. Small
  // moves stay in lockstep, so the grid at rest is never smeared.
  staggerEngage: 200,
};

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

// How far outside the viewport a tile is kept before the wrap recycles it.
// The stagger draws a tile at x - lag, so a tile the wrap has just placed can
// still be rendered short of its slot; recycling this much early means the
// slot is filled before it can show. One margin for every tile, so the
// lattice still folds in lockstep.
const WRAP_MARGIN = 300;

export class CanvasPan {
  constructor(viewport, options = {}) {
    this.viewport = viewport;
    this.options = { ...DEFAULTS, ...options };

    this.current = { x: 0, y: 0 };
    this.target = { x: 0, y: 0 };
    // Where the pan sat last frame: the stagger reads direction and speed
    // off the difference.
    this.last = { x: 0, y: 0 };

    this.items = [];
    this.step = { x: 0, y: 0 };
    this.isFrozen = false;

    this.drag = { active: false, startX: 0, startY: 0, scrollX: 0, scrollY: 0 };
  }

  // Called on every build, so a rebuilt grid never pans against stale geometry.
  setItems(items, step) {
    this.items = items;
    this.step = step;
  }

  // Both axes move together: a half-applied origin tears the wrap next frame.
  moveTo(x, y) {
    this.current.x = this.target.x = this.last.x = x;
    this.current.y = this.target.y = this.last.y = y;
  }

  by(dx, dy) {
    this.target.x += dx;
    this.target.y += dy;
  }

  // Measured off current, not target, so a shift that interrupts an in-flight
  // ease still lands where it was asked to.
  shiftBy(dx, dy) {
    this.target.x = this.current.x + dx;
    this.target.y = this.current.y + dy;
  }

  dragStart(x, y) {
    this.drag.active = true;
    this.drag.startX = x;
    this.drag.startY = y;
    this.drag.scrollX = this.target.x;
    this.drag.scrollY = this.target.y;
  }

  dragTo(x, y) {
    if (!this.drag.active) {
      return { movedX: 0, movedY: 0 };
    }

    const movedX = x - this.drag.startX;
    const movedY = y - this.drag.startY;

    this.target.x = this.drag.scrollX + movedX;
    this.target.y = this.drag.scrollY + movedY;

    return { movedX, movedY };
  }

  dragEnd() {
    const wasActive = this.drag.active;
    this.drag.active = false;

    return wasActive;
  }

  get isDragging() {
    return this.drag.active;
  }

  // Hold the pan still while something else owns the screen. Outstanding lag
  // and ease are settled here, while nothing draws from them: whatever takes
  // over measures from the layout, and the render after the thaw would
  // otherwise resume the decay and slide every tile as it landed.
  freeze() {
    this.isFrozen = true;

    this.target.x = this.last.x = this.current.x;
    this.target.y = this.last.y = this.current.y;

    this.items.forEach((item) => {
      item.lagX = 0;
      item.lagY = 0;
    });
  }

  thaw() {
    this.isFrozen = false;
  }

  positionOf(item) {
    return {
      x: item.x + this.current.x + item.extraX,
      y: item.y + this.current.y + item.extraY,
    };
  }

  visibleItems() {
    const { width, height } = this.viewport;

    return this.items.filter((item) => {
      const { x, y } = this.positionOf(item);

      return x > -item.width && x < width && y > -item.height && y < height;
    });
  }

  advance() {
    if (this.isFrozen) {
      return false;
    }

    const { ease } = this.options;

    this.current.x += (this.target.x - this.current.x) * ease;
    this.current.y += (this.target.y - this.current.y) * ease;

    this.trackStagger();

    return true;
  }

  // Let every tile fall behind the shared pan by an amount that grows with how
  // far downstream it sits. Lag is a position easing back to zero: a tile takes
  // on a share of each frame's movement, then sheds what it carries, so it
  // trails during a throw and is flush again once the pan stops.
  trackStagger() {
    const { staggerFalloff, staggerEngage, ease } = this.options;

    const movedX = this.current.x - this.last.x;
    const movedY = this.current.y - this.last.y;

    this.last.x = this.current.x;
    this.last.y = this.current.y;

    // How much of the throw is still to come; the stagger fades in with it.
    const outstanding = Math.hypot(
      this.target.x - this.current.x,
      this.target.y - this.current.y,
    );
    const engagement = staggerEngage
      ? Math.min(outstanding / staggerEngage, 1)
      : 0;

    const speed = Math.hypot(movedX, movedY);

    // The unit vector "downstream" is measured against. Below a pixel a frame
    // the direction is noise, so the grid is left to settle.
    const dirX = speed > 1 ? movedX / speed : 0;
    const dirY = speed > 1 ? movedY / speed : 0;

    const { width, height } = this.viewport;
    const reach = Math.hypot(width, height) / 2;

    this.items.forEach((item) => {
      let share = 0;

      if (engagement && reach) {
        const { x, y } = this.positionOf(item);

        // Where the tile sits along the direction of travel, -1 at the
        // trailing edge to 1 at the leading one. The pan moves the grid
        // opposite the content, so the sign flips: tiles being moved towards
        // are the ones that wait.
        const alongX = x + item.width / 2 - width / 2;
        const alongY = y + item.height / 2 - height / 2;
        const along = -(alongX * dirX + alongY * dirY) / reach;

        const downstream = clamp((along + 1) / 2, 0, 1);

        share = downstream * engagement * (1 - staggerFalloff);
      }

      // Take on this frame's share as lag, then shed what is carried at the
      // grid's easing rate. The two balance during a throw; the second wins
      // once it stops.
      item.lagX += movedX * share - item.lagX * ease;
      item.lagY += movedY * share - item.lagY * ease;
    });
  }

  // Wrap each item around the viewport by whole tiles. Lag reaches the
  // transform only, never the wrap maths: folding it in would let tiles fold
  // over at different moments and tear the lattice.
  render() {
    const { width, height } = this.viewport;

    this.items.forEach((item) => {
      let x = item.x + this.current.x + item.extraX;
      let y = item.y + this.current.y + item.extraY;

      while (x + item.width + WRAP_MARGIN < 0) {
        item.extraX += this.step.x;
        x += this.step.x;
      }

      while (x - WRAP_MARGIN > width) {
        item.extraX -= this.step.x;
        x -= this.step.x;
      }

      while (y + item.height + WRAP_MARGIN < 0) {
        item.extraY += this.step.y;
        y += this.step.y;
      }

      while (y - WRAP_MARGIN > height) {
        item.extraY -= this.step.y;
        y -= this.step.y;
      }

      item.el.style.transform = `translate3d(${x - item.lagX}px, ${
        y - item.lagY
      }px, 0)`;
    });
  }
}

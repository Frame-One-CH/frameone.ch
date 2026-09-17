// The endless pan behind the canvas grid: an eased position, a per-item lag,
// and a wrap that repeats the lattice in both axes without reflowing the DOM.

const DEFAULTS = {
  ease: 0.05,
  // 1 is no stagger; lower drags the tail further behind.
  staggerFalloff: 0.25,
  // Pixels of outstanding pan before the stagger reaches full strength, so
  // small moves stay in lockstep.
  staggerEngage: 200,
};

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

// How far outside the viewport a tile is kept before the wrap recycles it.
// The stagger draws a tile at x - lag, so recycling this early means its slot
// is filled before the gap can show.
export const WRAP_MARGIN = 300;

export class CanvasPan {
  constructor(viewport, options = {}) {
    this.viewport = viewport;
    this.options = { ...DEFAULTS, ...options };

    this.current = { x: 0, y: 0 };
    this.target = { x: 0, y: 0 };
    // Last frame's position; the stagger reads direction and speed off it.
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

  // Both axes together: a half-applied origin tears the wrap next frame.
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

  // Jump an in-flight ease to its target, so anything about to measure the
  // layout sees the position that was asked for. Tabbing to an off-screen tile
  // starts a glide that Enter would otherwise interrupt mid-flight.
  settle() {
    this.current.x = this.last.x = this.target.x;
    this.current.y = this.last.y = this.target.y;

    this.items.forEach((item) => {
      item.lagX = 0;
      item.lagY = 0;
    });

    this.render();
  }

  // Hold the pan still while something else owns the screen. The redraw
  // commits the cleared lag, which whatever takes over measures against.
  freeze() {
    this.isFrozen = true;

    this.target.x = this.last.x = this.current.x;
    this.target.y = this.last.y = this.current.y;

    this.items.forEach((item) => {
      item.lagX = 0;
      item.lagY = 0;
    });

    this.render();
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

  // Tiles on screen, optionally widened by a margin. The wrap keeps a tile
  // alive until it is WRAP_MARGIN clear of an edge, so anything measuring
  // against what the viewer can actually see has to ask for that margin too.
  visibleItems(margin = 0) {
    const { width, height } = this.viewport;

    return this.items.filter((item) => {
      const { x, y } = this.positionOf(item);

      return (
        x > -item.width - margin &&
        x < width + margin &&
        y > -item.height - margin &&
        y < height + margin
      );
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
  // far downstream it sits. Lag is a position easing back to zero, so a tile
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

    // Below a pixel a frame the direction is noise, so the grid settles.
    const dirX = speed > 1 ? movedX / speed : 0;
    const dirY = speed > 1 ? movedY / speed : 0;

    const { width, height } = this.viewport;
    const reach = Math.hypot(width, height) / 2;

    this.items.forEach((item) => {
      let share = 0;

      if (engagement && reach) {
        const { x, y } = this.positionOf(item);

        // Where the tile sits along the direction of travel, -1 trailing to 1
        // leading. The pan moves opposite the content, hence the flipped sign.
        const alongX = x + item.width / 2 - width / 2;
        const alongY = y + item.height / 2 - height / 2;
        const along = -(alongX * dirX + alongY * dirY) / reach;

        const downstream = clamp((along + 1) / 2, 0, 1);

        share = downstream * engagement * (1 - staggerFalloff);
      }

      // Take on this frame's share, then shed what is carried. The two balance
      // during a throw; the second wins once it stops.
      item.lagX += movedX * share - item.lagX * ease;
      item.lagY += movedY * share - item.lagY * ease;
    });
  }

  // Wrap each item around the viewport by whole tiles. Lag reaches the
  // transform only: in the wrap maths it would tear the lattice.
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

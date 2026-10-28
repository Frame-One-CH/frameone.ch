const DEFAULT_OPTIONS = {
  classes: {
    cursor: 'cursor',
    active: 'is-cursor-active',
    pressed: 'cursor--pressed',
  },
};

export class Cursor {
  constructor(options) {
    this.options = { ...options, ...DEFAULT_OPTIONS };

    this.create();
    this.cursorClasses = document.querySelectorAll('[data-cursor-class]');
    this.cursorLabels = document.querySelectorAll('[data-cursor-label]');
    this.addEvents();

    return this;
  }

  // The element stays until its exit transition has played out. Reading the
  // animations flushes the style change first, so a cursor that was already
  // hidden has none and goes straight away.
  destroy() {
    const el = this.el;

    this.removeEvents();
    this.deactivate();

    Promise.all(
      el
        .getAnimations({ subtree: true })
        .map((animation) => animation.finished),
    )
      .catch(() => {})
      .then(() => el.remove());
  }

  // The caller activates the cursor right after creating it. Without a style
  // flush in between, the hidden state is never computed and the entrance
  // has nothing to transition from.
  create() {
    this.el = document.createElement('div');
    this.el.setAttribute('aria-hidden', true);
    this.el.classList.add(this.options.classes.cursor);
    document.body.append(this.el);
    this.el.getBoundingClientRect();
  }

  setPosition(x, y) {
    this.el.style.setProperty('--cursor-x', `${x}px`);
    this.el.style.setProperty('--cursor-y', `${y}px`);
  }

  mousemove(e) {
    this.setPosition(e.clientX, e.clientY);
  }

  mousedown() {
    this.el.classList.add(this.options.classes.pressed);
  }

  mouseup() {
    this.el.classList.remove(this.options.classes.pressed);
  }

  setClass(e) {
    this.el.classList.add(e.target.dataset.cursorClass);
  }

  removeClass(e) {
    this.el.classList.remove(e.target.dataset.cursorClass);
  }

  setLabel(e) {
    this.el.textContent = e.target.dataset.cursorLabel;
  }

  removeLabel() {
    this.el.textContent = '';
  }

  activate() {
    document.documentElement.classList.add(this.options.classes.active);
  }

  deactivate() {
    document.documentElement.classList.remove(this.options.classes.active);
  }

  addEvents() {
    this.mousemoveHandler = this.mousemove.bind(this);
    this.mousedownHandler = this.mousedown.bind(this);
    this.mouseupHandler = this.mouseup.bind(this);
    this.mouseoverHandler = this.activate.bind(this);
    this.mouseoutHandler = this.deactivate.bind(this);

    this.setClassHandler = this.setClass.bind(this);
    this.removeClassHandler = this.removeClass.bind(this);
    this.setLabelHandler = this.setLabel.bind(this);
    this.removeLabelHandler = this.removeLabel.bind(this);

    document.addEventListener('mousemove', this.mousemoveHandler);
    document.addEventListener('mouseover', this.mouseoverHandler);
    document.addEventListener('mouseout', this.mouseoutHandler);
    document.addEventListener('mousedown', this.mousedownHandler);
    document.addEventListener('mouseup', this.mouseupHandler);

    this.cursorClasses.forEach((el) => {
      el.addEventListener('mouseenter', this.setClassHandler);
      el.addEventListener('mouseleave', this.removeClassHandler);
    });

    this.cursorLabels.forEach((el) => {
      el.addEventListener('mouseenter', this.setLabelHandler);
      el.addEventListener('mouseleave', this.removeLabelHandler);
    });
  }

  removeEvents() {
    document.removeEventListener('mousemove', this.mousemoveHandler);
    document.removeEventListener('mouseover', this.mouseoverHandler);
    document.removeEventListener('mouseout', this.mouseoutHandler);
    document.removeEventListener('mousedown', this.mousedownHandler);
    document.removeEventListener('mouseup', this.mouseupHandler);

    this.cursorClasses.forEach((el) => {
      el.removeEventListener('mouseenter', this.setClassHandler);
      el.removeEventListener('mouseleave', this.removeClassHandler);
    });

    this.cursorLabels.forEach((el) => {
      el.removeEventListener('mouseenter', this.setLabelHandler);
      el.removeEventListener('mouseleave', this.removeLabelHandler);
    });
  }
}

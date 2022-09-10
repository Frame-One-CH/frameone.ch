export class Cursor {
  constructor() {
    this.cursor = document.createElement('div');
    this.cursor.setAttribute('aria-hidden', true);
    this.cursor.classList.add('cursor');
    document.body.append(this.cursor);

    this.addEvents();

    return this;
  }

  destory() {
    this.removeEvents();
    document.body.removeChild(this.cursor);
    document.documentElement.classList.remove('is-cursor-active');
  }

  addEvents() {
    document.addEventListener('mousemove', this.mousemove.bind(this));
    document.addEventListener('mousedown', this.mousedown.bind(this));
    document.addEventListener('mouseup', this.mouseup.bind(this));
    document.addEventListener('mouseover', this.activate);
    document.addEventListener('mouseout', this.deactivate);
  }

  removeEvents() {
    document.removeEventListener('mousemove', this.mousemove.bind(this));
    document.removeEventListener('mousedown', this.mousedown.bind(this));
    document.removeEventListener('mouseup', this.mouseup.bind(this));
    document.removeEventListener('mouseover', this.activate);
    document.removeEventListener('mouseout', this.deactivate);
  }

  setPosition(x, y) {
    this.cursor.style.setProperty('--cursor-left', `${x}px`);
    this.cursor.style.setProperty('--cursor-top', `${y}px`);
  }

  mousedown() {
    this.cursor.classList.add('cursor--pressed');
  }

  mouseup() {
    this.cursor.classList.remove('cursor--pressed');
  }

  activate() {
    document.documentElement.classList.add('is-cursor-active');
  }

  deactivate() {
    document.documentElement.classList.remove('is-cursor-active');
  }

  mousemove(e) {
    this.setPosition(e.clientX, e.clientY);
  }
}

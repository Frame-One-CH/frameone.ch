// The play/pause control shared by the media grid and the canvas detail
// view: a toggle button whose ring fills with the video's progress. The
// wrapper carries the state classes the styles hook into, so both callers
// only have to supply the same markup around their own video element.

// Safari needs a #t fragment to paint a first frame without a poster, so
// seeks back to the start land here rather than on zero.
export const POSTER_TIME = 0.1;

export class VideoPlayer {
  constructor(video) {
    this.video = video;
    this.wrapper = video.parentNode;

    this.button = this.wrapper.querySelector('.media__play');
    this.circle = this.wrapper.querySelector('.media__progress-circle');

    if (!this.button || !this.circle) {
      return;
    }

    this.circumference = 2 * Math.PI * this.circle.r.baseVal.value;
    this.offset = this.circumference;
    this.raf = null;

    this.circle.style.strokeDasharray = `${this.circumference}`;
    this.circle.style.strokeDashoffset = `${this.circumference}`;

    this.isEnded = false;

    this.onClick = this.toggle.bind(this);
    this.onPlay = this.play.bind(this);
    this.onPause = this.pause.bind(this);
    this.onEnded = this.ended.bind(this);
    this.onLoadedMetadata = this.loadedMetadata.bind(this);

    this.button.addEventListener('click', this.onClick);
    this.video.addEventListener('play', this.onPlay);
    this.video.addEventListener('pause', this.onPause);
    this.video.addEventListener('ended', this.onEnded);
    this.video.addEventListener('loadedmetadata', this.onLoadedMetadata);

    // Adopt whatever state the video is in rather than assuming it starts
    // paused.
    if (!this.video.paused) {
      this.play();
    } else {
      this.isEnded = this.video.ended;
    }
  }

  toggle() {
    if (!this.video.paused) {
      this.video.pause();
      return;
    }

    // Play on a finished video would resume from the end and stop dead, so
    // a replay starts it over. The rewind may already have done this, which
    // is why the flag rather than currentTime decides.
    if (this.isEnded) {
      this.video.currentTime = POSTER_TIME;
    }

    this.video.play();
  }

  play() {
    this.isEnded = false;
    this.updateProgress();
    this.setPlaybackState(true);
  }

  pause() {
    this.setPlaybackState(false);
  }

  // A video that runs out fires ended rather than pause, so the finished
  // state is recorded here instead of being read back off the element:
  // rewinding clears video.ended, and the flag has to outlive that. The
  // rewind is the player's own job so every caller settles back to a still
  // the same way.
  ended() {
    this.isEnded = true;
    this.setPlaybackState(false);
    this.video.currentTime = POSTER_TIME;
  }

  loadedMetadata() {
    if (this.video.paused) {
      this.video.currentTime = POSTER_TIME;
    }
  }

  setPlaybackState(isPlaying) {
    if (isPlaying) {
      this.wrapper.classList.add('is-playing');
      this.wrapper.classList.remove('is-paused', 'is-ended', 'is-hinting');
    } else {
      this.wrapper.classList.remove('is-playing');

      if (this.isEnded) {
        this.wrapper.classList.add('is-ended');
      } else {
        this.wrapper.classList.add('is-paused');
      }
    }

    this.button.setAttribute(
      'aria-label',
      isPlaying ? 'Pause video' : 'Play video',
    );
  }

  // While playing, the ring chases the real progress rather than tracking it
  // exactly, which smooths out the coarse timeupdate steps. Paused, it snaps
  // to wherever the video actually sits.
  updateProgress() {
    const progress = this.video.currentTime / this.video.duration;
    const target = this.circumference * (1 - progress);

    if (this.video.paused) {
      this.offset = target;

      if (this.isEnded) {
        this.offset = this.circumference;
        cancelAnimationFrame(this.raf);
      }
    } else {
      this.offset += (target - this.offset) * 0.3;
      this.raf = requestAnimationFrame(() => this.updateProgress());
    }

    this.circle.style.strokeDashoffset = this.offset;
  }

  // The canvas builds its player per opened detail, so it has to be able to
  // take one back down without leaving a raf or listeners behind.
  destroy() {
    if (!this.button) {
      return;
    }

    cancelAnimationFrame(this.raf);

    this.button.removeEventListener('click', this.onClick);
    this.video.removeEventListener('play', this.onPlay);
    this.video.removeEventListener('pause', this.onPause);
    this.video.removeEventListener('ended', this.onEnded);
    this.video.removeEventListener('loadedmetadata', this.onLoadedMetadata);

    this.wrapper.classList.remove('is-playing', 'is-paused', 'is-ended');
  }
}

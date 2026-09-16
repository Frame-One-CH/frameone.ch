// The canvas's opening reveal: the tiles the viewport shows rise and fade in,
// nearest the centre first.
//
// Fire-once with a cancel. playIntro() returns a handle whose finish() is
// idempotent — the timeline's completion and an early open both call it, and
// whichever lands first wins.

import { gsap } from 'gsap';

const DEFAULTS = {
  introDelay: 0.15,
  introDuration: 1.5,
  introEase: 'expo.out',
  introStagger: 0.05,
  introStaggerTotal: 0.6,
  introDistance: 80,
};

// The reveal opens outwards from where the eye already is.
const byDistanceFromCentre = (items, viewport) => {
  const centerX = viewport.width / 2;
  const centerY = viewport.height / 2;

  return items
    .map((item) => {
      const rect = item.el.getBoundingClientRect();
      const dx = rect.left + rect.width / 2 - centerX;
      const dy = rect.top + rect.height / 2 - centerY;

      return { item, distance: Math.hypot(dx, dy) };
    })
    .sort((a, b) => a.distance - b.distance)
    .map((entry) => entry.item);
};

export function playIntro(el, items, viewport, options = {}) {
  const {
    introDuration,
    introEase,
    introDelay,
    introStagger,
    introStaggerTotal,
    introDistance,
  } = { ...DEFAULTS, ...options };

  if (!items.length) {
    el.classList.add('is-revealed');

    return { finish: () => {} };
  }

  const ordered = byDistanceFromCentre(items, viewport);

  const elements = ordered.map((item) => item.el);
  const media = ordered.map((item) => item.media);

  // Written before the CSS hold lifts: the tween applies its own from-values
  // only once the delay elapses, and the tiles would flash in at rest until
  // then.
  gsap.set(media, { y: introDistance, opacity: 0 });

  // is-animating-media outlives is-intro: it suppresses the media's CSS
  // transform transition, which would lag the tween's writes through its tail.
  el.classList.add('is-revealed', 'is-intro', 'is-animating-media');

  const stagger = Math.min(introStagger, introStaggerTotal / ordered.length);

  let timeline = gsap.timeline({ onComplete: () => finish() });

  timeline.fromTo(
    media,
    { y: introDistance, opacity: 0 },
    { y: 0, opacity: 1, duration: introDuration, ease: introEase, stagger },
    introDelay,
  );

  // Hover returns once the last tile starts moving, not when it rests: the
  // ease covers most of its distance early, so the grid reads as settled long
  // before the tail runs out.
  timeline.call(
    () => el.classList.remove('is-intro'),
    null,
    introDelay + stagger * (ordered.length - 1),
  );

  // Idempotent: called by the timeline's completion, or by an open that cuts
  // the intro short.
  function finish() {
    if (!timeline) {
      return;
    }

    el.classList.remove('is-intro', 'is-animating-media');

    // Killed before the props are cleared: a live tween writes y and opacity
    // every frame and would undo the clear on the next tick.
    timeline.kill();
    timeline = null;

    gsap.set(elements, { clearProps: 'opacity' });
    // transform is cleared alongside y: clearing y alone leaves GSAP's inline
    // transform in place, which outranks the stylesheet's hover scale.
    gsap.set(media, { clearProps: 'y,opacity,transform' });
  }

  return { finish };
}

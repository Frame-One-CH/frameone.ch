// import Lenis from '@studio-freight/lenis';
import { gsap, Expo } from 'gsap';
import { ScrollToPlugin } from 'gsap/dist/ScrollToPlugin';

gsap.registerPlugin(ScrollToPlugin);

export function scrollTo(y) {
  gsap.to(window, {
    scrollTo: { y },
    duration: 1,
    ease: Expo.easeInOut,
  });
}

(() => {
  /*
  const lenis = new Lenis({
    duration: 1.2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // https://www.desmos.com/calculator/brs54l4xou
    direction: 'vertical', // vertical, horizontal
    gestureDirection: 'vertical', // vertical, horizontal, both
    smooth: true,
    mouseMultiplier: 1,
    smoothTouch: false,
    touchMultiplier: 2,
    infinite: false,
  });

  const raf = (time) => {
    lenis.raf(time);
    requestAnimationFrame(raf);
  };

  requestAnimationFrame(raf);
  */

  document.querySelectorAll('.js-scroll').forEach((el) => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      scrollTo(e.currentTarget.hash);
    });
  });
})();

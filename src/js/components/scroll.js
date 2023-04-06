import Lenis from '@studio-freight/lenis';
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
  const lenis = new Lenis();

  const raf = (time) => {
    lenis.raf(time);
    requestAnimationFrame(raf);
  };

  requestAnimationFrame(raf);

  document.querySelectorAll('.js-scroll').forEach((el) => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      scrollTo(e.currentTarget.hash);
    });
  });
})();

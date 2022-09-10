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
  document.querySelectorAll('.js-scroll').forEach((el) => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      scrollTo(e.currentTarget.hash);
    });
  });
})();

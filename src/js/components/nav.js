import { gsap, Expo } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

(() => {
  const navTween = gsap.to(document.querySelectorAll('.nav__link'), {
    y: 0,
    duration: 0.6,
    paused: true,
    ease: Expo.easeOut,
  });

  ScrollTrigger.create({
    onUpdate: (self) => {
      if (self.progress > 0) {
        document.documentElement.classList.add('is-scrolled');
      } else {
        document.documentElement.classList.remove('is-scrolled');
      }

      if (self.direction > 0) {
        navTween.play();
      } else {
        navTween.reverse();
      }
    },
  });
})();

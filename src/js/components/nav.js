import { gsap, Expo } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

(() => {
  const navTween = gsap.to(document.querySelectorAll('.nav__link'), {
    y: 0,
    duration: 1.5,
    paused: true,
    ease: Expo.easeInOut,
  });

  const navRevealPos =
    window.innerHeight / 6 / document.documentElement.scrollHeight;

  ScrollTrigger.create({
    onUpdate: (self) => {
      if (self.progress > 0) {
        document.documentElement.classList.add('is-scrolled');
      }

      if (self.progress > navRevealPos) {
        navTween.play();
      } else {
        navTween.reverse();
      }
    },
  });
})();

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

(() => {
  const navLinks = document.querySelectorAll('.nav__link');
  let isShown = false;

  // Showing and hiding are separate tweens rather than one reversed: a
  // reversed ease-out plays back as an ease-in, which drags on the way out.
  function setShown(shouldShow) {
    if (shouldShow === isShown) {
      return;
    }

    isShown = shouldShow;

    gsap.to(navLinks, {
      y: 0,
      yPercent: shouldShow ? 0 : -100,
      duration: shouldShow ? 0.6 : 0.3,
      ease: shouldShow ? 'expo.out' : 'expo.in',
      overwrite: true,
    });
  }

  ScrollTrigger.create({
    onUpdate: (self) => {
      if (self.progress > 0) {
        document.documentElement.classList.add('is-scrolled');
      } else {
        document.documentElement.classList.remove('is-scrolled');
      }

      setShown(self.direction > 0);
    },
  });
})();

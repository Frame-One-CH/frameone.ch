import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

(() => {
  const scrollHint = document.querySelector('.js-scroll-hint');

  const rotateTween = gsap.to(scrollHint, {
    rotate: 360,
    duration: 20,
    repeat: -1,
    ease: 'linear',
  });

  window.setTimeout(() => {
    if (document.documentElement.scrollTop === 0) {
      gsap.to(scrollHint, {
        autoAlpha: 1,
        duration: 1,
      });
    }
  }, 2500);

  scrollHint.addEventListener('mouseenter', () => {
    gsap.to(scrollHint, {
      scale: 1.1,
    });
  });

  scrollHint.addEventListener('mouseleave', () => {
    gsap.to(scrollHint, {
      scale: 1,
    });
  });

  let hidden = false;

  ScrollTrigger.create({
    onUpdate: (self) => {
      if (self.progress > 0) {
        if (hidden) return;
        hidden = true;

        gsap.to(scrollHint, {
          autoAlpha: 0,
          onComplete: () => rotateTween.pause(),
        });
      } else {
        if (!hidden) return;
        hidden = false;

        rotateTween.play();
        gsap.to(scrollHint, { autoAlpha: 1, duration: 1 });
      }
    },
  });
})();

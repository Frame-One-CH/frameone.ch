import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { scrollTo } from './scroll';

gsap.registerPlugin(ScrollTrigger);

(() => {
  const scrollHint = document.querySelector('.js-scroll-hint');

  gsap.to(scrollHint, {
    rotate: 360,
    duration: 20,
    repeat: -1,
    ease: 'linear',
  });

  let scrollHintHide;

  window.setTimeout(() => {
    if (document.documentElement.scrollTop === 0) {
      scrollHintHide = gsap.to(scrollHint, {
        autoAlpha: 1,
        duration: 0.5,
      });
    }
  }, 2000);

  scrollHint.addEventListener('click', (e) => {
    e.preventDefault();
    scrollTo(window.innerHeight / 6);
  });

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

  ScrollTrigger.create({
    onUpdate: (self) => {
      if (scrollHintHide) {
        if (self.progress > 0) {
          scrollHintHide.reverse();
        } else {
          scrollHintHide.play();
        }
      }
    },
  });
})();

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

(() => {
  gsap.fromTo(
    '.frame--bottom',
    {
      scaleX: 0,
    },
    {
      scaleX: 1,
      force3D: false,
      ease: 'none',
      scrollTrigger: {
        scrub: 0.5,
      },
    },
  );
})();

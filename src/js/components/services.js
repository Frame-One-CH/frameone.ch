import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

(() => {
  gsap.fromTo(
    document.querySelectorAll('.services__title'),
    {
      '--bg-progress': '100%',
    },
    {
      '--bg-progress': '0%',
      scrollTrigger: {
        trigger: document.querySelector('.section--services'),
        start: 'top center',
        end: 'center center-=10%',
        scrub: 1,
      },
    },
  );
})();

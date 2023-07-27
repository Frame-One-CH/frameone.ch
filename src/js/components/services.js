import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

(() => {
  gsap.fromTo(
    document.querySelectorAll('.services__item'),
    {
      '--line-progress': 0,
      '--bg-progress': '100%',
    },
    {
      '--line-progress': 1,
      '--bg-progress': '0%',
      stagger: {
        each: 0.05,
      },
      scrollTrigger: {
        trigger: document.querySelector('.section--services'),
        start: 'top top',
        end: 'bottom center+=20%',
        scrub: 1,
      },
    },
  );
})();

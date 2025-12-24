import { gsap, Power4 } from 'gsap';
import { SplitText } from 'gsap/SplitText';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(SplitText);
gsap.registerPlugin(ScrollTrigger);

(() => {
  document.fonts.ready.then(() => {
    document.querySelectorAll('.js-scroll-reveal').forEach((el, i) => {
      const splitText = SplitText.create(el, {
        type: 'lines',
        mask: 'lines',
      });

      gsap.from(splitText.lines, {
        yPercent: 100,
        duration: 1.5,
        stagger: {
          each: 0.1,
        },
        ease: Power4.easeOut,
        scrollTrigger: {
          trigger: el,
          start: 'bottom bottom',
          end: 'top bottom',
          toggleActions: 'play play reverse reverse',
        },
      });
    });
  });
})();

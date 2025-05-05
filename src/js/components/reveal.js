import { gsap, Power3, Power4 } from 'gsap';
import { SplitText } from 'gsap/SplitText';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(SplitText);
gsap.registerPlugin(ScrollTrigger);

(() => {
  document.fonts.ready.then(() => {
    document.querySelectorAll('.js-scroll-reveal').forEach((el, i) => {
      const start = el.getAttribute('data-start') || false;

      const splitText = SplitText.create(el, {
        type: 'lines',
        mask: 'lines',
      });

      gsap.from(splitText.lines, {
        yPercent: 100,
        duration: 1.5,
        ease: start ? Power3.easeInOut : Power4.easeOut,
        stagger: {
          each: 0.1,
        },
        scrollTrigger: {
          trigger: start ? el.closest('.section') : el,
          start: start ? 'top center' : 'bottom bottom',
          end: 'top bottom',
          toggleActions: 'play play reverse reverse',
        },
        onComplete: () => {
          if (start) {
            splitText.lines.forEach((line) => {
              if (line.parentNode) {
                line.parentNode.style.overflow = 'visible';
              }
            });
          }
        },
      });
    });
  });
})();

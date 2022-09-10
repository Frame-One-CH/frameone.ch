import { gsap, Power3 } from 'gsap';
import SplitType from 'split-type';

(() => {
  document.querySelectorAll('.js-scroll-reveal').forEach((el, i) => {
    const start = el.getAttribute('data-start') || false;
    const textLines = new SplitType(el, {
      types: 'lines',
    });

    if (textLines.lines) {
      textLines.lines.map((line) => {
        const wrapEl = document.createElement('div');
        wrapEl.classList.add('line-wrapper');
        wrapEl.style.overflow = 'hidden';
        line.parentNode.appendChild(wrapEl);
        wrapEl.appendChild(line);
      });

      gsap.from(textLines.lines, {
        yPercent: 100,
        duration: 1.5,
        ease: Power3.easeInOut,
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
            textLines.lines.forEach((line) => {
              line.parentNode.style.overflow = 'visible';
            });
          }
        },
      });
    }
  });
})();

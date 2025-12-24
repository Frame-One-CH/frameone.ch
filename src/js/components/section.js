import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

(() => {
  function onSectionColorChange(color) {
    gsap.to('.content', { backgroundColor: color });
  }

  const sections = document.querySelectorAll('.section');

  sections.forEach((el, i) => {
    const colorAttr = el.getAttribute('data-color');

    if (colorAttr) {
      const color =
        colorAttr === 'dark'
          ? gsap.getProperty('html', '--theme-dark')
          : gsap.getProperty('html', '--theme-light');

      ScrollTrigger.create({
        trigger: el.querySelector('.container'),
        start: 'top center',
        end: 'bottom center',
        onEnter: () => onSectionColorChange(color),
        onLeave: () => onSectionColorChange(color),
        onLeaveBack: () => onSectionColorChange(color),
        onEnterBack: () => onSectionColorChange(color),
      });
    }

    const progressEnd =
      i === sections.length - 1 ? 'bottom bottom' : 'bottom top';

    ScrollTrigger.create({
      trigger: el,
      start: 'top bottom',
      end: progressEnd,
      onUpdate: (self) => {
        gsap.to('.line-grid', {
          '--progress': self.progress,
        });
      },
      scrub: 0.5,
    });
  });
})();

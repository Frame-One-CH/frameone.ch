import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

(() => {
  function getThemeColor(variant) {
    const prop = variant === 'dark' ? '--theme-dark' : '--theme-light';
    return getComputedStyle(document.documentElement)
      .getPropertyValue(prop)
      .trim();
  }

  let activeVariant = null;

  function onSectionColorChange(variant) {
    activeVariant = variant;
    gsap.to('.content', { backgroundColor: getThemeColor(variant) });
  }

  const darkSchemeQuery = window.matchMedia('(prefers-color-scheme: dark)');
  darkSchemeQuery.addEventListener('change', () => {
    if (activeVariant) {
      gsap.set('.content', { backgroundColor: getThemeColor(activeVariant) });
    }
  });

  const sections = document.querySelectorAll('.section');

  sections.forEach((el, i) => {
    const colorAttr = el.getAttribute('data-color');

    if (colorAttr) {
      ScrollTrigger.create({
        trigger: el.querySelector('.container'),
        start: 'top center',
        end: 'bottom center',
        onEnter: () => onSectionColorChange(colorAttr),
        onLeave: () => onSectionColorChange(colorAttr),
        onLeaveBack: () => onSectionColorChange(colorAttr),
        onEnterBack: () => onSectionColorChange(colorAttr),
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

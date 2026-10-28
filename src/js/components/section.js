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

  sections.forEach((el) => {
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
  });

  // Each grid draws its lines with the scroll through its own section only;
  // driven from every section, overlapping ranges fought over the value.
  document.querySelectorAll('.line-grid').forEach((el) => {
    gsap.fromTo(
      el,
      { '--progress': 0 },
      {
        '--progress': 1,
        ease: 'none',
        scrollTrigger: {
          trigger: el.closest('.section'),
          start: 'top bottom',
          end: 'bottom bottom',
          scrub: 0.5,
        },
      },
    );
  });
})();

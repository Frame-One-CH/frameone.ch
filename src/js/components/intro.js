import { gsap, Power3 } from 'gsap';
import { SplitText } from 'gsap/SplitText';

(() => {
  document.fonts.ready.then(() => {
    const splitText = SplitText.create('.js-intro-title', {
      type: 'lines',
      mask: 'lines',
    });

    const tl = gsap.timeline();

    if (document.documentElement.scrollTop === 0) {
      tl.set('.js-intro-title', { opacity: 1 });

      tl.from(splitText.lines, {
        yPercent: 100,
        duration: 1.5,
        stagger: {
          each: 0.1,
        },
        ease: Power3.easeInOut,
        onComplete: () => {
          splitText.lines.forEach((line) => {
            if (line.parentNode) {
              line.parentNode.style.overflow = 'visible';
            }
          });
        },
      });

      tl.to(
        '.js-intro-title',
        {
          autoAlpha: 0,
          scale: 1.5,
          filter: 'blur(3px)',
          duration: 1,
          ease: Power3.easeInOut,
        },
        '-=0.2',
      );

      tl.to(
        '.js-scroll-out-top',
        {
          yPercent: -150,
          duration: 1,
          ease: Power3.easeInOut,
        },
        '<',
      );

      tl.to(
        '.js-scroll-out-bottom',
        {
          yPercent: 150,
          duration: 1,
          ease: Power3.easeInOut,
        },
        '<',
      );

      tl.from(
        '.js-scroll-about',
        {
          autoAlpha: 0,
          filter: 'blur(3px)',
          duration: 0.6,
          ease: Power3.easeInOut,
        },
        '-=0.8',
      );
    }
  });
})();

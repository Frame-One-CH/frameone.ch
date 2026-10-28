import { gsap, Power4 } from 'gsap';
import { SplitText } from 'gsap/SplitText';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(SplitText);
gsap.registerPlugin(ScrollTrigger);

(() => {
  document.fonts.ready.then(() => {
    // Elements inside a reveal group share one trigger, so a row of pills
    // reveals one after another instead of all on the same frame.
    const groups = new Map();

    document.querySelectorAll('.js-scroll-reveal').forEach((el) => {
      const splitText = SplitText.create(el, {
        type: 'lines',
        mask: 'lines',
        aria: 'none',
      });

      const trigger = el.closest('.js-scroll-reveal-group') || el;

      if (!groups.has(trigger)) {
        groups.set(trigger, []);
      }

      groups.get(trigger).push(...splitText.lines);
    });

    // Scrolling back above the trigger hides the lines again so they reveal
    // anew on the way down. The hide is its own short ease-out rather than
    // the reveal reversed, which would play back as a slow ease-in.
    groups.forEach((lines, trigger) => {
      gsap.set(lines, { yPercent: 100 });

      ScrollTrigger.create({
        trigger,
        start: 'bottom bottom',
        onEnter: () =>
          gsap.to(lines, {
            yPercent: 0,
            duration: 1.5,
            ease: Power4.easeOut,
            stagger: {
              each: 0.1,
            },
            overwrite: true,
          }),
        onLeaveBack: () =>
          gsap.to(lines, {
            yPercent: 100,
            duration: 0.6,
            ease: 'power3.out',
            overwrite: true,
          }),
      });
    });
  });
})();

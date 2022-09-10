import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

(() => {
  const introTimeline = gsap.timeline();

  introTimeline
    .set('.js-scroll-about', {
      autoAlpha: 0,
    })
    .to(
      '.js-scroll-out-top',
      {
        y: '-50vh',
      },
      'title'
    )
    .to(
      '.js-scroll-out-bottom',
      {
        y: '50vh',
      },
      'title'
    )
    .to(
      '.intro-title',
      {
        scale: 5,
        autoAlpha: 0,
      },
      'title'
    )
    .to(
      '.js-scroll-about',
      {
        autoAlpha: 1,
        duration: 0.2,
      },
      '>-0.5'
    );

  ScrollTrigger.create({
    animation: introTimeline,
    trigger: document.querySelector('.section--intro'),
    start: 'top top',
    end: 'bottom center',
    scrub: 1,
  });
})();

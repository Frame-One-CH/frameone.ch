import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import { VideoPlayer } from './video-player';

gsap.registerPlugin(ScrollTrigger);

(() => {
  const media = document.querySelectorAll('.media');
  const videos = document.querySelectorAll('.media video');

  const isTouchDevice =
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0 ||
    navigator.msMaxTouchPoints > 0;

  const videoObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.parentNode.classList.add('is-hinting');
          videoObserver.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 1.0,
    },
  );

  // Videos start with preload="none" so none of them compete with the intro
  // for bandwidth. Once the visitor scrolls, each loads its first frame about
  // a screen before it comes into view.
  const preloadObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.preload = 'metadata';
          entry.target.load();
          preloadObserver.unobserve(entry.target);
        }
      });
    },
    {
      rootMargin: '100% 0px',
    },
  );

  media.forEach((el, i) => {
    gsap.set(el, {
      'clip-path': 'polygon(0% 100%, 100% 80%, 100% 100%, 0% 100%)',
    });

    gsap.to(el, {
      'clip-path': 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)',
      duration: 5,
      ease: 'none',
      scrollTrigger: {
        trigger: el,
        start: 'center bottom',
        end: 'top bottom',
        scrub: 1,
      },
    });
  });

  videos.forEach((video) => {
    new VideoPlayer(video);

    if (isTouchDevice) {
      videoObserver.observe(video);
    }
  });

  const observePreload = () => {
    videos.forEach((video) => preloadObserver.observe(video));
  };

  // A reload restores the scroll position, so a page that opens mid-way
  // needs its videos straight away.
  if (window.scrollY > 0) {
    observePreload();
  } else {
    window.addEventListener('scroll', observePreload, {
      once: true,
      passive: true,
    });
  }
})();

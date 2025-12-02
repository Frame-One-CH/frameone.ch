import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

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
    const videoWrapper = video.parentNode;
    const playButton = videoWrapper.querySelector('.media__play');

    const updateButtonState = (isPlaying) => {
      playButton.setAttribute(
        'aria-label',
        isPlaying ? 'Pause video' : 'Play video',
      );
    };

    playButton.addEventListener('click', () => {
      video.paused ? video.play() : video.pause();
    });

    video.addEventListener('play', () => {
      videoWrapper.classList.add('is-playing');
      videoWrapper.classList.remove('is-paused');
      videoWrapper.classList.remove('is-hinting');
      updateButtonState(true);
    });

    video.addEventListener('pause', () => {
      videoWrapper.classList.add('is-paused');
      videoWrapper.classList.remove('is-playing');
      updateButtonState(false);
    });

    video.addEventListener('ended', () => {
      videoWrapper.classList.add('is-paused');
      videoWrapper.classList.remove('is-playing');
      video.currentTime = 0;
      video.pause();
      updateButtonState(false);
    });

    /*
    const progress = videoWrapper.querySelector('.progress__bar');

    if (progress) {
      video.addEventListener('timeupdate', () => {
        const value = Math.floor((video.currentTime / video.duration) * 100);

        if (value) {
          progress.setAttribute('aria-valuenow', value);
          progress.style.width = `${value}%`;
        }
      });
    }
    */

    if (isTouchDevice) {
      videoObserver.observe(video);
    }
  });
})();

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
    const progressCircle = videoWrapper.querySelector(
      '.media__progress-circle',
    );

    const circumference = 2 * Math.PI * progressCircle.r.baseVal.value;
    let currentOffset = circumference;
    let rafId = null;

    progressCircle.style.strokeDasharray = `${circumference}`;
    progressCircle.style.strokeDashoffset = `${circumference}`;

    const updatePlaybackState = (isPlaying) => {
      if (isPlaying) {
        videoWrapper.classList.add('is-playing');
        videoWrapper.classList.remove('is-paused', 'is-ended', 'is-hinting');
      } else {
        videoWrapper.classList.remove('is-playing');

        if (video.ended) {
          videoWrapper.classList.add('is-ended');
        } else {
          videoWrapper.classList.add('is-paused');
        }
      }

      playButton.setAttribute(
        'aria-label',
        isPlaying ? 'Pause video' : 'Play video',
      );
    };

    playButton.addEventListener('click', () => {
      video.paused ? video.play() : video.pause();
    });

    const updateProgress = () => {
      const progress = video.currentTime / video.duration;
      const targetOffset = circumference * (1 - progress);

      if (video.paused) {
        currentOffset = targetOffset;

        if (video.ended) {
          currentOffset = circumference;
          cancelAnimationFrame(rafId);
        }
      } else {
        currentOffset += (targetOffset - currentOffset) * 0.3;
        rafId = requestAnimationFrame(updateProgress);
      }

      progressCircle.style.strokeDashoffset = currentOffset;
    };

    video.addEventListener('play', () => {
      updateProgress();
      updatePlaybackState(true);
    });

    video.addEventListener('pause', () => {
      updatePlaybackState(false);
    });

    video.addEventListener('loadedmetadata', () => {
      video.currentTime = 0;
    });

    if (isTouchDevice) {
      videoObserver.observe(video);
    }
  });
})();

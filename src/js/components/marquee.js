import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

(() => {
  function duplicateMarquee(item) {
    const clone = item.parentNode.children[0].cloneNode(true);

    clone.classList.add('marquee__item--clone');
    clone.setAttribute('aria-hidden', true);
    item.parentNode.appendChild(clone);
  }

  document.querySelectorAll('.marquee__item').forEach((el) => {
    const numberOfClones = Math.ceil(window.innerWidth / el.scrollWidth);

    for (let i = 0; i < numberOfClones; i++) {
      duplicateMarquee(el);
    }
  });

  const marqueeTween = gsap
    .to('.marquee__item', {
      xPercent: -100,
      repeat: -1,
      duration: 10,
      ease: 'linear',
    })
    .totalProgress(0.5);

  const scrollClamp = gsap.utils.clamp(-20, 20);

  ScrollTrigger.create({
    onUpdate: (self) => {
      let velo = scrollClamp(self.getVelocity() / 40);

      if (velo > 0) {
        if (velo < 1) {
          velo = 1;
        }
      } else if (velo > -1) {
        velo = -1;
      }

      gsap.to(marqueeTween, {
        timeScale: velo * -1,
        overwrite: true,
        onUpdate() {
          gsap.to(marqueeTween, {
            timeScale: self.direction * -1,
          });
        },
      });
    },
  });
})();

(function() {
    var typed = new Typed('.js-typed', {
        loop: true,
        strings: [
            'makes nice websites<span class="u-color-primary">.</span>',
            'cares about details<span class="u-color-primary">.</span>',
            'thinks twice<span class="u-color-primary">.</span>',
            'likes urban music<span class="u-color-primary">.</span>',
            'keeps it real<span class="u-color-primary">.</span>'
        ],
        typeSpeed: 100,
        backSpeed: 50,
        backDelay: 2000
    });

    var lightSwitch = document.getElementsByClassName('js-toggle-theme')[0];

    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        document.documentElement.classList.add('theme-dark');
        lightSwitch.textContent = lightSwitch.getAttribute('data-label-on');
    } else {
        document.documentElement.classList.remove('theme-dark');
        lightSwitch.textContent = lightSwitch.getAttribute('data-label-off');
    }

    lightSwitch.addEventListener('click', function() {
        document.documentElement.classList.toggle('theme-dark');

        if (this.textContent === this.getAttribute('data-label-off')) {
            this.textContent = this.getAttribute('data-label-on');
        } else {
            this.textContent = this.getAttribute('data-label-off');
        }

        this.blur();
    });
}());

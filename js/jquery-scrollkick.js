/*
* jQuery Scrollkick 1.0
* http://sapprise.com
* Copyright 2013, Sergio Lavanga
* Free to use under the MIT license.
* http://www.opensource.org/licenses/mit-license.php
*/

;(function ($) {
	"use strict";

	function Plugin(element, options) {
		this.options = $.extend({}, $.fn.scrollkick.defaults, options);
		this.$window = $(window);
		this.$element = $(element);
		this.init();
	}

	Plugin.prototype = {

		init: function() {
			this.activeIndex = 0;
			this.hash = window.location.hash;
			this.docHeight = $(document).height();
			
			this.nav = {
				offset: Math.round(this.$element.offset().top),
				items: this.$element.find("li")
			};
			this.nav.links = this.nav.items.find("a[href^='#']" + this.options.filter);

			if(this.options.topbar) {
				this.nav.height = this.$element.outerHeight();
				this.$element.wrap("<div style='height:" + this.nav.height + "px'></div>"); // avoid jumping
			} else {
				this.nav.height = 0;
			}
			
			this.getSections(true);
			
			if(this.hash) {
				this.scroll(this.getHash(this.hash), 0);
			} else {
				this.triggerScroll();
			}
			
			this.bind();
		},

		bind: function() {
			var self = this;

			self.$window.on("scroll", $.proxy(this.triggerScroll, this));
			
			self.$window.on("touchmove", function() {
				if(window.pageYOffset !== self.scrolltop) {
					self.triggerScroll();
					self.watch();
				}
				$("html, body").stop();
			});

			self.t = setInterval(function() {
				if(self.animating) return;

				if(self.scrolled) {
					self.watch();
					self.scrolled = false;
				} else {
					if(self.options.changeHash) {
						self.hash = window.location.hash;
						if(self.hash !== "#" + self.newSection.hash) {
							self.scroll(self.hash.substring(1), 0);
						}
					}
				}
			}, 200);

			$(self.nav.links).on("click", function() {
				self.scroll(self.getHash($(this).attr("href")));
				self.nav.items.removeClass(self.options.activeClass);
				$(this).parent("li").addClass(self.options.activeClass);
				return false;
			});
			
			if(self.options.scrollSelector) {
				$(self.options.scrollSelector).on("click", function() {
					self.scroll(self.getHash($(this).attr("href")));
					return false;
				});
			}

			if(self.options.bindKeys) {
				$(document).on("keydown", function(e) {
					if(! self.animating) {
						if(e.keyCode === 40) self.next();
						if(e.keyCode === 38) self.prev();
					}
				});
			}
		},

		triggerScroll: function() {
			this.scrolltop = Math.round(this.$window.scrollTop());
			this.stick();
			this.scrolled = true;
		},

		getSections: function(id) {
			var self = this, link, hash, $el;
			
			self.sections = [];

			self.nav.links.each(function() {
				link = $(this);
				hash = link.attr("href");
				
				if(id) {
					$el = $(hash);
					$el.removeAttr("id").attr("data-scrollkick", hash);
				} else {
					$el = $("[data-scrollkick=" + hash + "]");
				}

				if($el.length) {
					self.sections.push({
						el: $el,
						hash: self.getHash(hash),
						item: link.parent("li"),
						title: link.attr("data-title"),
						offset: (Math.round($el.offset().top) - self.nav.height)
					});
				}
			});
		},

		getHash: function(hash) {
			return hash.split("#")[1];
		},

		stick: function() {
			if(this.scrolltop >= this.nav.offset) {
				if(! this.isSticky) {
					this.$element.addClass(this.options.fixedClass);
					this.isSticky = true;
				}
			} else {
				if(this.isSticky) {
					this.$element.removeClass(this.options.fixedClass);
					this.isSticky = false;
				}
			}
		},

		watch: function() {
			this.newDocHeight = $(document).height();

			if(this.docHeight !== this.newDocHeight) {
				this.docHeight = this.newDocHeight;
				this.getSections(false); // get sections if height changes
			}
			
			this.lastIndex = this.activeIndex;

			// remember last section that reached the top
			for(var i = 0; i < this.sections.length; i++) {
				if(this.scrolltop >= this.sections[i].offset) {
					this.activeIndex = i;
				}
			}

			if(this.activeIndex === 0 || this.activeIndex !== this.lastIndex) {
				this.oldSection = this.sections[this.lastIndex];
				this.newSection = this.sections[this.activeIndex];
			
				this.oldSection.el.trigger("leave", this.oldSection.el);
				this.newSection.el.trigger("arrive", this.newSection.el);
				
				// change class
				this.nav.items.removeClass(this.options.activeClass);
				this.newSection.item.addClass(this.options.activeClass);

				// change hash
				if(this.options.changeHash) {
					window.location.hash = this.newSection.hash;
				}

				// change title
				if(this.options.changeTitle) {
					document.title = this.newSection.title || document.title;
				}
			}
		},

		prev: function() {
			var prev = this.activeIndex - 1;
			if(prev >= 0) this.scroll(this.sections[prev].hash);
		},

		next: function() {
			var next = this.activeIndex + 1;
			if(next < this.sections.length) this.scroll(this.sections[next].hash);
		},

		scroll: function(hash, speed) {
			var self = this,
				$target = $("#" + hash);
				
			if(! $target.length) {
				$target = $("[data-scrollkick=#" + hash + "]");
			}
			
			if($target.length) {
				if(! speed) speed = self.options.scrollSpeed;
				self.animating = true;

				$("html, body").stop().animate({
					scrollTop: Math.round($target.offset().top) - self.nav.height
				}, speed, self.options.easing, function() {
					self.animating = false;
					self.triggerScroll();
				});
			}
		}
	};

	$.fn.scrollkick = function(option) {
		return this.each(function() {
			var $this = $(this);
			var data = $this.data("scrollkick");
			var options = typeof option == 'object' && option;
		
			if (!data) $this.data("scrollkick", (data = new Plugin(this, options)));
			if (typeof option === "string") data[option].call(data);
		});
	};

	$.fn.scrollkick.defaults = {
		topbar: true,
		changeHash: true,
		changeTitle: false,
		bindKeys: false,
		activeClass: "active",
		fixedClass: "sticky",
		easing: "swing",
		scrollSpeed: 600,
		filter: "",
		scrollSelector: ""
	};
})(jQuery);
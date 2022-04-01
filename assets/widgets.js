(function() {
  "use strict";

  window.Widgets = window.Widgets || {};

  // Key map
  var ENTER = 13;
  var ESCAPE = 27;
  var SPACE = 32;
  var UP = 38;
  var DOWN = 40;
  var TAB = 9;

  document.addEventListener('alpine:init', function() {

    // Simple toggle functionality
    Alpine.data('toggle', function(data) {
      return Object.assign({
        isOpen: false,

        toggle: function() {
          if (this.isOpen) {
            this.close();
          } else {
            this.open();
          }
        },

        open: function() {
          this.isOpen = true;
        },

        close: function() {
          this.isOpen = false;
        }
      }, data);
    });

    // Returns the current category object for section and article pages
    Alpine.data('category', function(data) {
      return Object.assign({
        sectionId: null,
        categoryId: null,
        category: null,

        init: function() {
          var pageId = Util.getPageId();
          if (!this.categoryId && Util.isCategoryPage()) this.categoryId = pageId;
          if (!this.sectionId && Util.isSectionPage()) this.sectionId = pageId;

          if (!this.categoryId && !this.sectionId) return;

          Util.get(['categories', 'sections'], ['id', 'category_id', 'html_url', 'name', 'description', 'position']).then(this.getActiveCategory.bind(this));
        },

        getActiveCategory: function(collection) {

          if (this.categoryId) {
            var activeCategoryId = this.categoryId;
            this.category = collection.categories.filter(function(category) {
              return category.id === activeCategoryId;
            })[0] || null;
          } else if (this.sectionId) {
            var sectionId = this.sectionId;

            // Get the active section
            var activeSection = collection.sections.filter(function(section) {
              return section.id === sectionId;
            })[0] || null;

            // Get the active category
            this.category = collection.categories.filter(function(category) {
              return category.id === activeSection['category_id'];
            })[0] || null;
          }
        }
      }, data);
    });
  });

  /**
   * Dropdown widget.
   */
  window.Widgets.dropdown = function() {
    return {
      isExpanded: false,

      get focusableElements() {
        return [...this.$refs.menu.querySelectorAll('a[href], button, input, textarea, select, details,[tabindex]:not([tabindex="-1"])')]
          .filter(el => !el.hasAttribute('disabled') && !el.getAttribute("aria-hidden"))
      },

      init: function() {
        this.$refs.toggle.addEventListener('click', this.clickHandler.bind(this));
        this.$refs.toggle.addEventListener('keydown', this.toggleKeyHandler.bind(this));
        this.$refs.menu.addEventListener('keydown', this.menuKeyHandler.bind(this));
        this.$refs.menu.classList.add('invisible');
      },

      open: function() {
        this.isExpanded = true;
        this.$nextTick(this.handleOverflow.bind(this));
      },

      close: function() {
        this.isExpanded = false;
        this.$refs.menu.classList.add('invisible');
        this.$refs.menu.style.left = this.$refs.menu.style.top = this.$refs.menu.style.bottom = null;
      },

      handleOverflow: function() {
        var observer = new IntersectionObserver((entries) => {
          for (var entry of entries) {
            var bounds = entry.boundingClientRect;
            if (bounds.x < 0) {
              this.$refs.menu.style.left = Math.abs(rect.left) + 'px';
            }
            if (bounds.x + bounds.width >= window.innerWidth) {
              this.$refs.menu.style.left = -((bounds.x + bounds.width) - window.innerWidth) + 'px';
            }
            if (bounds.top + bounds.height >= window.innerHeight) {
              this.$refs.menu.style.top = 'auto';
              this.$refs.menu.style.bottom = '100%';
            }
            this.$refs.menu.classList.remove('invisible');
          }
          observer.disconnect();
        });
        observer.observe(this.$refs.menu);
      },

      focusNextMenuItem: function(currentItem) {
        if (!this.focusableElements.length) return;
        var currentIndex = this.focusableElements.indexOf(currentItem);
        var nextIndex = currentIndex === this.focusableElements.length - 1 || currentIndex < 0 ? 0 : currentIndex + 1;
        this.focusableElements[nextIndex].focus();
      },

      focusPreviousMenuItem: function(currentItem) {
        if (!this.focusableElements.length) return;
        var currentIndex = this.focusableElements.indexOf(currentItem);
        var previousIndex = currentIndex <= 0 ? this.focusableElements.length - 1 : currentIndex - 1;
        this.focusableElements[previousIndex].focus();
      },

      clickHandler: function(e) {
        if (this.isExpanded) {
          this.close();
        } else {
          this.open();
        }
      },

      toggleKeyHandler: function(e) {
        switch (e.keyCode) {
          case ENTER:
          case SPACE:
          case DOWN:
            e.preventDefault();
            if (!this.isExpanded) this.open();
            this.focusNextMenuItem();
            break;
          case UP:
            e.preventDefault();
            if (!this.isExpanded) this.open();
            this.focusPreviousMenuItem();
            break;
          case ESCAPE:
            this.close();
            if (this.$refs.toggle) this.$refs.toggle.focus();
            break;
        }
      },

      menuKeyHandler: function(e) {
        var firstItem = this.focusableElements[0];
        var lastItem = this.focusableElements[this.focusableElements.length - 1];
        var currentElement = e.target;

        switch (e.keyCode) {
          case ESCAPE:
            this.close();
            if (this.$refs.toggle) this.$refs.toggle.focus();
            break;
          case DOWN:
            e.preventDefault();
            this.focusNextMenuItem(currentElement);
            break;
          case UP:
            e.preventDefault();
            this.focusPreviousMenuItem(currentElement);
            break;
          case TAB:
            if (e.shiftKey) {
              if (currentElement === firstItem) {
                this.close();
              } else {
                e.preventDefault();
                this.focusPreviousMenuItem(currentElement);
              }
            } else if (currentElement === lastItem) {
              this.close();
            } else {
              e.preventDefault();
              this.focusNextMenuItem(currentElement);
            }
            break;
        }
      }
    }
  };

  /**
   * Notification widget.
   */
  window.Widgets.notification = function() {
    return {
      key: 'alpine:notification:dismissed',
      isDismissed: null,

      /**
       * Fetches a page of categories.
       * @returns {Promise}
       */
      getNotification: function() {
        this.isDismissed = window.sessionStorage.getItem(this.key) === 'true';
      },

      /**
       * Dismisses the notification.
       */
      dismiss: function() {
        this.isDismissed = true;
        window.sessionStorage.setItem(this.key, 'true');
      }
    }
  };

  /**
   * Header widget.
   */
  window.Widgets.header = function(data) {
    return Object.assign({
      isFixed: false,
      isSticky: false,
      isStuck: null,
      isUnstuck: null,

      hasHeroElement: function() {
        var main = document.querySelector('main[role="main"]');
        return main.firstElementChild && main.firstElementChild.classList.contains('hero');
      },

      applyStickyHeader: function() {
        new Sticky(this.$el, {
          classNames: { sticky: 'sticky-top transition' }
        });
        this.$el.addEventListener('sticky:stuck', this.onStuck.bind(this));
        this.$el.addEventListener('sticky:unstuck', this.onUnstuck.bind(this));
      },

      onStuck: function() {
        this.isStuck = true;
        this.isUnstuck = false;
        },

      onUnstuck: function() {
        this.isStuck = false;
        this.isUnstuck = true;
        },

      applyFixedHeader: function() {
        this.$el.classList.add('absolute-top');
      },

      init: function() {
        var $el = this.$el;

        if (this.isSticky) {
          this.applyStickyHeader();
        }

        if (this.isFixed && this.hasHeroElement()) {
          this.applyFixedHeader();
        } else {
          this.isFixed = false;
          $el.classList.remove('fixed-header');
        }

        $el.classList.add('transition-none');
        $el.classList.add('visible');
        $el.classList.remove('transition-none');
      }
    }, data);
  };

  /**
   * Search widget.
   */
  window.Widgets.search = function() {
    return {
      isOpen: false,

      init: function() {
        var searchFields = Array.prototype.slice.call(this.$root.querySelectorAll('[type="search"]'));
        this.searchField = searchFields.length ? searchFields[searchFields.length - 1] : null;

        // Add query string value if appropriate
        var queryString = Util.getURLParameter('query');
        if (queryString && this.searchField && !this.searchField.value) {
          this.searchField.value = queryString;
        }

        this.addEventListeners();
      },

      addEventListeners: function() {
        this.$watch('isOpen', this.onChange.bind(this));
        window.addEventListener('resize', Util.debounce(this.close.bind(this), 500));
      },

      onChange: function(isOpen) {
        if (isOpen) {
          this.showSearch();
        } else {
          this.hideSearch();
        }
      },

      toggle: function() {
        if (this.isOpen) {
          this.close();
        } else {
          this.open();
        }
      },

      open: function() {
        this.isOpen = true;
      },

      showSearch: function() {
        if (this.searchField) {
          var container = Util.closest(this.searchField, '.search');
          if (container) container.style.display = 'block';
          this.searchField.focus();
        }
      },

      close: function() {
        this.isOpen = false;
      },

      hideSearch: function() {
        if (this.searchField) {
          var container = Util.closest(this.searchField, '.search');
          if (container) {
            if (this.$refs.dropdown) {
              Util.onTransitionEnd(this.$refs.dropdown, function() {
                container.style.display = 'none';
              });
            } else {
              container.style.display = 'none';
            }
          }
        }

        // Focus on toggle
        if (this.$root.contains(document.activeElement) && this.$refs.toggle) {
          this.$refs.toggle.focus();
        }
      }
    }
  };

  /**
   * Mobile menu widget.
   */
  window.Widgets.mobileMenu = function() {
    return {
      isOpen: false,

      init: function() {
        window.addEventListener('resize', Util.debounce(this.close.bind(this), 500));
        document.addEventListener('keydown', this.toggleKeyHandler.bind(this));
      },

      toggleKeyHandler: function(e) {
        switch (e.keyCode) {
          case ESCAPE:
            this.close();
            break;
        }
      },

      toggle: function() {
        if (this.isOpen) {
          this.close();
        } else {
          this.open();
        }
      },

      open: function() {
        this.isOpen = true;
      },

      close: function() {
        this.isOpen = false;
      }
    }
  };

  /**
   * Categories widget.
   */
  window.Widgets.categories = function() {
    return {
      categories: [],
      isLoading: true,

      /**
       * Fetches a page of categories.
       * @returns {Promise}
       */
      getCategories: function() {
        return Util.get('categories')
          .then(this.addCategories.bind(this));
      },

      /**
       * Adds the categories returned by the REST API to the collection.
       * @param json
       */
      addCategories: function(json) {
        this.categories = json.categories;
        this.isLoading = false;
      }
    }
  };

  /**
   * Parallax image widget.
   */
  window.Widgets.parallaxImage = function() {
    return {

      init: function() {
        if (!this.prefersReducedMotion()) {
          this.addEventListeners();
        }
      },

      prefersReducedMotion: function() {
        var mediaQueryList = window.matchMedia('(prefers-reduced-motion: reduce)');
        return mediaQueryList.matches;
      },

      addEventListeners: function() {
        window.addEventListener('scroll', this.onScroll.bind(this));
      },

      onScroll: function() {
        var scrolled = window.scrollY;
        this.$el.style['-moz-transform'] = `translate3d(0px,${scrolled / -3}px, 0px)`;
        this.$el.style['-webkit-transform'] = `translate3d(0px,${scrolled / -3}px, 0px)`;
        this.$el.style['transform'] = `translate3d(0px,${scrolled / -3}px, 0px)`;
      }
    }
  };

  /**
   * Popular keywords widget.
   */
  window.Widgets.popularKeywords = function() {
    return {
      keywords: [],

      /**
       * Parses the set of keywords.
       * @returns {Promise}
       */
      parseKeywords: function(keywords) {
        var baseURL = location.protocol + '//' + location.hostname + '/hc/' + Theme.locale + '/search?query=';
        this.keywords = keywords
          .split(',')
          .map(function(keyword) {
            keyword = keyword.trim();
            return keyword ? { title: keyword, html_url: baseURL + keyword }: keyword;
          })
          .filter(function(keyword) {
            return keyword;
          });
      }
    }
  };

})();
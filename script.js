(function() {
  "use strict";

  ready(function() {

    // Restore focus after page reload
    var returnFocusTo = sessionStorage.getItem('returnFocusTo');
    if (returnFocusTo) {
      sessionStorage.removeItem('returnFocusTo');
      var returnFocusToEl = document.querySelector(returnFocusTo);
      returnFocusToEl && returnFocusToEl.focus && returnFocusToEl.focus();
    }

    // Open social sharing links in a new window
    each('.share a', function(a) {
      a.addEventListener('click', function(e) {
        e.preventDefault();
        window.open(this.href, '', 'height = 500, width = 500');
      });
    });

    // Render inline micro-templates
    each('[data-element="template"]', function(el) {
      if (el.hasAttribute('data-template')) {
        Util.renderTemplate(el, el.getAttribute('data-template'));
      }
    });

    // Add focus classname to search field
    each('.form-field [type="search"]', function(el) {
      el.addEventListener('focus', function() { this.parentNode.classList.add(Util.classNames.FOCUS); });
      el.addEventListener('focusout', function() { this.parentNode.classList.remove(Util.classNames.FOCUS); });
    });

    // Replace images with inline SVG
    Array.prototype.forEach.call(document.querySelectorAll('[data-inline-svg]'), Util.replaceWithSVG);

    // Smooth scroll
    function maybeScroll() {
      var smoothScroll = Util.getURLParameter('smooth-scroll', window.location);
      if (smoothScroll === 'true' && window.location.hash) {
        var offset = Util.getURLParameter('offset', window.location);
        var target = document.getElementById(window.location.hash.substring(1).split("?")[0]);
        Util.scrollIntoView(target, offset);
      }
    }

    window.addEventListener('hashchange', maybeScroll, false);
    maybeScroll();

    /**
     * Collapsible nav plugin.
     * @param el
     * @constructor
     */
    function CollapsibleNav(el) {
      this.el = el;
      el.addEventListener('click', this.onClick.bind(this));
    }

    CollapsibleNav.prototype = {

      onClick: function(e) {
        var maxHeight = window.getComputedStyle(this.el).maxHeight;
        if (maxHeight === 'none') {
          return;
        }

        var isExpanded = this.el.getAttribute('aria-expanded') === 'true';
        var navLink = e.target;

        if (isExpanded) {

          // Close the nav if the clicked link is selected
          if (navLink.getAttribute('aria-selected') === 'true') {
            this.el.setAttribute('aria-expanded', 'false');
            this.el.classList.remove('is-expanded');
            navLink.setAttribute('aria-selected', 'false');
            e.preventDefault();
          }
        } else {

          // Open the nav if it's closed
          this.el.setAttribute('aria-expanded', 'true');
          this.el.classList.add('is-expanded');
          navLink.setAttribute('aria-selected', 'true');
          e.preventDefault();
        }
      }
    };

    each('.collapsible-nav', function(nav) {
      new CollapsibleNav(nav);
    });

    window.CollapsibleNav = CollapsibleNav;

  });
})();
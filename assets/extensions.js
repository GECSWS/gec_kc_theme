/* collapse.js */
(function() {
  "use strict";

  var NAME = 'collapse';

  var ClassName = {
    ACTIVE:     'is-active',
    SHOW:       'is-visible',
    COLLAPSE:   'collapse',
    COLLAPSING: 'collapsing',
    COLLAPSED:  'is-hidden'
  };

  var Event = {
    SHOW:   NAME + ':show',
    SHOWN:  NAME + ':shown',
    HIDE:   NAME + ':hide',
    HIDDEN: NAME + ':hidden'
  };

  var Selector = {
    DATA_TOGGLE:  '[data-toggle="collapse"]',
  };

  /**
   * Collapse.
   *
   * @type {component}
   */
  window.Collapse = Util.createPlugin({

    defaults: {
      parent: false,
      toggle: true,
    },

    optionTypes: {
      parent: '(string|element|boolean)',
      toggle: 'boolean',
    },

    /**
     * Initializes the plugin.
     */
    initialize: function(options) {
      this._isTransitioning = false;
      this._parent = options.parent ? this._getParent() : null;

      this._triggerArray = [].slice.call(document.querySelectorAll(
        Selector.DATA_TOGGLE + '[href="#' + this.el.id + '"],' +
        Selector.DATA_TOGGLE + '[data-target="#' + this.el.id + '"]'
      ));

      var _this = this;

      var toggleList = [].slice.call(document.querySelectorAll(Selector.DATA_TOGGLE));
      for (var i = 0, len = toggleList.length; i < len; i++) {
        var selector = Util.getSelectorFromElement(toggleList[i]);
        var filterElement = [].slice.call(document.querySelectorAll(selector)).filter(function(el) {
          return el === _this.el;
        });

        if (selector !== null && filterElement.length > 0) {
          this._selector = selector;
        }
      }

      if (!options.parent) {
        this._addAriaAndCollapsedClass(this.el, this._triggerArray)
      }

      if (options.toggle) {
        this.toggle()
      }
    },

    _getTargetFromElement: function(element) {
      var selector = Util.getSelectorFromElement(element);
      return selector ? document.querySelector(selector) : null;
    },

    _getParent: function() {
      var parent;

      if (Util.isElement(this.options.parent)) {
        parent = this.options.parent;
      } else {
        parent = document.querySelector(this.options.parent)
      }

      if (parent) {
        var selector = Selector.DATA_TOGGLE + '[data-parent="' + this.options.parent + '"]';
        var children = [].slice.call(parent.querySelectorAll(selector));
        for (var i = 0; i < children.length; i++) {
          this._addAriaAndCollapsedClass(
            this._getTargetFromElement(children[i]),
            [children[i]]
          )
        }
      }
      return parent
    },

    _addAriaAndCollapsedClass: function(el, triggers) {
      var isOpen = el.classList.contains(ClassName.SHOW);
      if (triggers.length) {
        triggers.forEach(function(trigger) {
          trigger.classList.toggle(ClassName.ACTIVE, isOpen);
          trigger.classList.toggle(ClassName.COLLAPSED, !isOpen);
          trigger.setAttribute('aria-expanded', isOpen);
        });
      }
    },

    _setTransitioning: function(isTransitioning) {
      this._isTransitioning = isTransitioning
    },

    toggle: function() {
      if (this.el.classList.contains(ClassName.SHOW)) {
        this.hide()
      } else {
        this.show()
      }
    },

    show: function() {
      if (this._isTransitioning || this.el.classList.contains(ClassName.SHOW)) {
        return;
      }

      var options = this.options;
      var actives;

      if (this._parent) {
        actives = [].slice.call(this._parent.querySelectorAll('.' + ClassName.SHOW + ', .' + ClassName.COLLAPSING))
          .filter(function(el) {
            if (typeof options.parent === 'string') {
              return el.getAttribute('data-parent') === options.parent
            }
            return el.classList.contains(ClassName.COLLAPSE)
          });

        if (actives.length === 0) {
          actives = null
        }
      }

      var startEvent = Util.triggerEvent(this.el, Event.SHOW, {
        relatedTargets: this._triggerArray
      });

      if (startEvent && startEvent.defaultPrevented) {
        return;
      }

      if (actives) {
        actives.forEach(function(el) {
          var instance = dataStorage.get(el, NAME);
          if (!instance) {
            dataStorage.put(el, NAME, new Collapse(el));
          } else {
            instance.hide();
          }
        });
      }

      this.el.classList.remove(ClassName.COLLAPSE);
      this.el.classList.add(ClassName.COLLAPSING);
      this.el.style.height = '0px';

      if (this._triggerArray.length) {
        this._triggerArray.forEach(function(el) {
          el.classList.add(ClassName.ACTIVE);

          var customActiveClass = el.getAttribute('data-active-class');
          if (customActiveClass) {
            el.classList.add.apply(
              el.classList,
              customActiveClass.split(' ')
            );
          }
          el.classList.remove(ClassName.COLLAPSED);
          el.setAttribute('aria-expanded', 'true');
        });
      }

      this._setTransitioning(true);

      var complete = function() {
        this.el.classList.remove(ClassName.COLLAPSING);
        this.el.classList.add(ClassName.COLLAPSE);
        this.el.classList.add(ClassName.SHOW);
        this.el.style.height = '';

        this._setTransitioning(false);

        Util.triggerEvent(this.el, Event.SHOWN, {
          relatedTargets: this._triggerArray
        });
      }.bind(this);

      Util.onTransitionEnd(this.el, complete);

      this.el.style.height = this.el.scrollHeight + 'px';
    },

    hide: function() {
      if (this._isTransitioning || !this.el.classList.contains(ClassName.SHOW)) return;

      var startEvent = Util.triggerEvent(this.el, Event.HIDE, {
        relatedTargets: this._triggerArray
      });

      if (startEvent && startEvent.defaultPrevented) {
        return;
      }

      this.el.style.height = this.el.getBoundingClientRect().height + 'px';
      this.el.classList.add(ClassName.COLLAPSING);
      this.el.classList.remove(ClassName.COLLAPSE);
      this.el.classList.remove(ClassName.SHOW);

      if (this._triggerArray.length > 0) {
        for (var i = 0; i < this._triggerArray.length; i++) {
          var trigger = this._triggerArray[i];
          var selector = Util.getSelectorFromElement(trigger);

          if (selector !== null) {
            [].slice.call(document.querySelectorAll(selector)).forEach(function(el) {
              if (!el.classList.contains(ClassName.SHOW)) {
                trigger.classList.add(ClassName.COLLAPSED);
                trigger.classList.remove(ClassName.ACTIVE);

                var customActiveClass = trigger.getAttribute('data-active-class');
                if (customActiveClass) {
                  trigger.classList.remove.apply(
                    trigger.classList,
                    customActiveClass.split(' ')
                  );
                }
                trigger.setAttribute('aria-expanded', 'false');
              }
            });
          }
        }
      }

      this._setTransitioning(true);

      var complete = function() {
        this._setTransitioning(false);
        this.el.classList.remove(ClassName.COLLAPSING);
        this.el.classList.add(ClassName.COLLAPSE);
        Util.triggerEvent(this.el, Event.HIDDEN, {
          relatedTargets: this._triggerArray
        });
      }.bind(this);

      Util.onTransitionEnd(this.el, complete);

      this.el.style.height = '';
    }
  });

  document.addEventListener('click', function(e) {
    var trigger = e.target;
    if (!trigger.matches(Selector.DATA_TOGGLE)) {
      trigger = Util.closest(trigger, Selector.DATA_TOGGLE);
      if (!trigger) {
        return;
      }
    }

    if (trigger.tagName === 'A') {
      e.preventDefault();
    }

    var selector = Util.getSelectorFromElement(trigger);

    [].slice.call(document.querySelectorAll(selector)).forEach(function(el) {
      var instance = dataStorage.get(el, NAME);
      if (!instance) {
        dataStorage.put(el, NAME, new Collapse(el));
      } else {
        instance.toggle();
      }
    });
  }, false);

})();

/* tab.js */
(function() {
  "use strict";

  var NAME = 'tab';

  var Event = {
    HIDE:   NAME + ':hide',
    HIDDEN: NAME + ':hidden',
    SHOW:   NAME + ':show',
    SHOWN:  NAME + ':shown'
  };

  var ClassName = {
    ACTIVE:   'is-active',
    DISABLED: 'is-disabled',
    SHOWN:    'is-shown'
  };

  var Selector = {
    NAV:          '.nav',
    ACTIVE:       '.' + ClassName.ACTIVE,
    DATA_TOGGLE:  '[data-toggle="tab"]',
  };

  /**
   * Tab.
   *
   * @type {component}
   */
  window.Tab = Util.createPlugin({

    /**
     * Initializes the plugin.
     */
    initialize: function(options) {},

    show: function() {
      if (
        this.el.parentNode &&
        this.el.parentNode.nodeType === Node.ELEMENT_NODE &&
        this.el.classList.contains(ClassName.ACTIVE) ||
        this.el.classList.contains(ClassName.DISABLED)
      ) {
        return;
      }

      var nav = Util.closest(this.el, Selector.NAV) || this.el.parentNode;
      var selector = Util.getSelectorFromElement(this.el);
      var previous;
      var target;

      if (nav) {
        previous = nav.querySelector(Selector.ACTIVE);
      }

      if (previous) {

        // Do nothing if a transition is underway on the previous element
        var previousSelector = Util.getSelectorFromElement(previous);
        var previousTarget = document.querySelector(previousSelector);

        if (
          previousTarget &&
          Util.getTransitionDuration(previousTarget) &&
          !previousTarget.classList.contains(ClassName.SHOWN)
        ) {
          return;
        }

        var hideEvent = Util.triggerEvent(previous, Event.HIDE, {
          relatedTarget: this.el
        });
      }

      var showEvent = Util.triggerEvent(this.el, Event.SHOW, {
        relatedTarget: previous
      });

      if (showEvent.defaultPrevented || (hideEvent && hideEvent.defaultPrevented)) {
        return;
      }

      this._activate(this.el, nav);

      /**
       * Trigger `hidden` and `shown` events.
       */
      var complete = function() {

        if (previous) {
          Util.triggerEvent(previous, Event.HIDDEN, {
            relatedTarget: this.el
          });
        }

        Util.triggerEvent(this.el, Event.SHOWN, {
          relatedTarget: previous
        });

      }.bind(this);

      if (selector) {
        target = document.querySelector(selector);
      }

      if (target) {
        this._activate(target, target.parentNode, complete);
      } else {
        complete();
      }
    },

    _activate: function(el, container, callback) {
      var active;
      if (container === el.parentNode) {
        active = Array.prototype.filter.call(container.children, function(el) {
          return el.matches(Selector.ACTIVE);
        })[0] || null;
      } else {
        active = container.querySelector(Selector.ACTIVE);
      }

      var onActivated = function() {
        return this._transitionComplete(el, active, callback);
      }.bind(this);

      if (active) {
        Util.onTransitionEnd(active, onActivated);
        active.classList.remove(ClassName.SHOWN);
      } else {
        onActivated();
      }
    },

    _transitionComplete: function(el, active, callback) {
      var customActiveClass;
      if (active) {

        // Remove active class names
        active.classList.remove(ClassName.ACTIVE);

        customActiveClass = active.getAttribute('data-active-class');
        if (customActiveClass) {
          active.classList.remove.apply(
            active.classList,
            customActiveClass.split(' ')
          );
        }

        if (active.getAttribute('role') === 'tab') {
          active.setAttribute('aria-selected', false)
        }
      }

      // Add active class names
      el.classList.add(ClassName.ACTIVE);

      customActiveClass = el.getAttribute('data-active-class');
      if (customActiveClass) {
        el.classList.add.apply(
          el.classList,
          customActiveClass.split(' ')
        );
      }

      if (el.getAttribute('role') === 'tab') {
        el.setAttribute('aria-selected', true)
      }

      Util.reflow(el);
      el.classList.add(ClassName.SHOWN);

      if (callback) {
        callback();
      }
    }
  });

  document.addEventListener('click', function(e) {
    var el = e.target;
    if (!el.matches(Selector.DATA_TOGGLE)) {
      el = Util.closest(el, Selector.DATA_TOGGLE);
      if (!el) {
        return;
      }
    }

    if (el.tagName === 'A') {
      e.preventDefault();
    }

    var instance = dataStorage.get(el, NAME);
    if (!instance) {
      instance = new Tab(el);
      dataStorage.put(el, NAME, instance);
    }

    instance.show();
  }, false);

})();

/* table-of-contents.js */
(function() {
  "use strict";

  // Globals
  var NAME = 'tableOfContents';

  var Event = {
    RENDER: NAME + ':render'
  };

  /**
   * Table of Contents.
   *
   * @type {component}
   */
  window.TableOfContents = Util.createPlugin({

    defaults: {
      parentElement: null,
      selector: '.content h2',
      anchorLinks: true,
      generateIds: true,

      // The ID of the custom template to use when generating HTML
      template: null,

      // Additional data to expose to the template
      templateData: {}
    },

    optionTypes: {
      parentElement: '(window|element|string|null)',
      selector: 'string',
      anchorLinks: 'boolean',
      generateIds: 'boolean',
      template: '(string|null)',
      templateData: '(string|object)'
    },

    /**
     * Adds an anchor link to the heading.
     * @param heading
     * @private
     */
    _maybeAddAnchorLink: function(heading) {
      if (this.options.anchorLinks === true && heading.getElementsByClassName('link-anchor').length === 0) {
        var a = document.createElement('A');
        a.className = 'link-anchor';
        a.href = '#' + heading.id;
        heading.appendChild(a);
      }
    },

    /**
     * Structures headings into a hierarchical collection.
     * @param headings
     * @returns {[]}
     * @private
     */
    _structureItems: function(headings) {
      var data = [];
      var lastObj = undefined;

      headings.forEach(function(heading, index) {
        var level = heading.outerHTML.match(/<h([\d]).*>/)[1];
        var name = Array.prototype.slice.call(heading.childNodes)
          .map(function(child) { return child.textContent.trim(); })
          .filter(function(text) { return text && text !== '#'; })
          .join(' ');

        var obj = { level, name, html_url: '#' + heading.id, parent: null, children: [] };

        // First heading
        if (index === 0) {
          data.push(obj);
          lastObj = obj;
        }

        else {
          if (obj.level === lastObj.level) {
            obj.parent = lastObj.parent;
            if (obj.parent) {
              obj.parent.children.push(obj);
            } else {
              data.push(obj);
            }
            lastObj = obj;
          }
          else if (obj.level > lastObj.level) {
            obj.parent = lastObj;
            obj.parent.children.push(obj);
            lastObj = obj;
          }
          else {
            while (1) {
              if (lastObj.level < obj.level) {
                lastObj.children.push(obj);
                lastObj = obj;
                break
              }
              lastObj = lastObj.parent;
              if (lastObj === null) {
                data.push(obj);
                lastObj = obj;
                break
              }
            }
          }
        }
      });
      return data;
    },

    /**
     * Initializes the plugin instance.
     *
     * @param options {Object}
     */
    initialize: function(options) {

      // Validate header selector
      var selector = options.selector;
      if (typeof selector !== 'string') {
        throw new TypeError('Selectors must be a string');
      }

      var parentElement = this._getParentElement();
      var headings = Array.prototype.slice.call(parentElement.querySelectorAll(this.options.selector));
      if (!headings) return;

      var validTags = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'];
      var _this = this;

      headings = headings.filter(function(heading, index) {

        // Only include <h1> - <h6> headings
        if (validTags.indexOf(heading.tagName.toLowerCase()) !== -1) {

          // Maybe generate an ID
          if (options.generateIds === true && !heading.id) heading.id = 'heading-' + ++index;

          // Maybe add an anchor link
          _this._maybeAddAnchorLink(heading);

          return heading.id
        }
        return false
      });

      this.render(this._structureItems(headings));
    },

    /**
     * Returns the parent element.
     *
     * @returns {*}
     * @private
     */
    _getParentElement: function() {
      var parentElement = this.options.parentElement;
      if (!parentElement) {
        return document;
      }

      if (Util.isElement(parentElement)) {
        return parentElement;
      }

      if (typeof parentElement === 'string') {
        return document.querySelector(parentElement) || document;
      }
      return document;
    },

    /**
     * Renders the plugin.
     *
     * @param items
     */
    render: function(items) {
      var options = this.options;
      var data = { items: items };
      if (options.templateData) {
        data = Util.extend(data, options.templateData);
      }

      Util.renderTemplate(this.el, options.template, data, { replaceContent: true });

      Util.triggerEvent(this.el, Event.RENDER, {
        relatedTarget: this.el
      });
    }
  });

  window.addEventListener('load', function() {
    each('[data-element="table-of-contents"]', function(el) {
      new TableOfContents(el);
    });
  });
})();

/* tabs.js */
(function() {
  "use strict";

  var NAME = 'tabs';

  var ClassName = {
    ACTIVE: 'is-active'
  };

  var Event = {
    RENDER: NAME + ':render'
  };

  /**
   * Tabs.
   *
   * @type {component}
   */
  window.Tabs = Util.createPlugin({

    defaults: {
      initial: 0,
      activeClass: 'text-primary',
      template: 'tabs',
      templateData: {}
    },

    optionTypes: {
      initial: 'number',
      activeClass: 'string',
      template: '(string|null)',
      templateData: 'object'
    },

    /**
     * Initializes the plugin.
     */
    initialize: function(options) {
      if (this.el.children.length) {
        this.render(options);
      }
    },

    /**
     * Renders the plugin HTML.
     */
    render: function(options) {
      var templateString = Util.getTemplateString(this.options.template);
      var html;

      var activeClass = ClassName.ACTIVE;
      if (options.activeClass) {
        activeClass += ' ' + options.activeClass;
      }

      var dataAttributes = 'data-toggle="tab"';
      if (options.activeClass) {
        dataAttributes += ' data-active-class="' + options.activeClass + '"';
      }

      if (!templateString) {
        templateString = '' +
          '<% if (children.length) { %>' +
            '<div class="my-6">' +
              '<ul class="nav nav-tabs overflow-hidden sm:overflow-visible" id="<%= id %>">' +
                '<% children.forEach(function(child, index) { %>' +
                  '<li class="nav-item bg-white sm:bg-transparent">' +
                    '<a class="nav-link text-inherit font-medium hover:text-primary<% if (initial === index ) { %> ' + activeClass + '<% } %>" role="tab" ' + dataAttributes + ' aria-expanded="<%= initial === index %>" href="#<%= id %>-<%= index %>">' +
                      '<%= child.title %>' +
                    '</a>' +
                  '</li>' +
                '<% }); %>' +
              '</ul>' +
              '<div class="tabs">' +
                '<% children.forEach(function(child, index) { %>' +
                  '<div class="tab list-unstyled p-5 mb-4 bg-white border border-radius-bottom<% if (initial === index ) { %> ' + ClassName.ACTIVE + '<% } %>" id="<%= id %>-<%= index %>" role="tab-panel">' +
                    '<%= child.innerHTML %>' +
                  '</div>' +
                '<% }); %>' +
              '</div>' +
            '</div>' +
          '<% } %>';
      }

      var compiled = Util.template(templateString);
      var children = [].slice.call(this.el.children).map(function(child, i) {
        var title = 'Tab ' + i;
        if (child.hasAttribute('data-title')) {
          title = child.getAttribute('data-title');
        } else {
          var heading = child.querySelector('.tab-heading');
          if (heading) {
            title = heading.textContent;
          }
        }
        return {
          innerHTML: child.innerHTML,
          title: title
        };
      });

      var data = {
        id: this.id,
        children: children,
        items: children,
        initial: options.initial,
        dataAttributes: dataAttributes,
        activeClass: activeClass,
        options: options
      };

      if (options.templateData) {
        data = Util.extend(data, options.templateData);
      }

      html = compiled(data).replace(/(^\s+|\s+$)/g, '');
      if (html) {
        this.el.insertAdjacentHTML('afterend', html);
      }

      var el = this.el.nextElementSibling;
      this.el.classList.forEach(function(className) { el.classList.add(className); });
      if (this.el.id) {
        el.id = this.el.id;
      }

      Util.triggerEvent(this.el, Event.RENDER, {
        relatedTarget: el
      });

      this.el.remove();
      this.el = el;
    }
  });

  window.addEventListener('load', function() {
    each('[data-element="tabs"], .js-tabs', function(el) {
      new Tabs(el);
    });
  });
})();

/* toggles.js */
(function() {
  "use strict";

  var NAME = 'toggles';

  var Event = {
    RENDER: NAME + ':render'
  };

  /**
   * Toggles.
   *
   * @type {component}
   */
  window.Toggles = Util.createPlugin({

    defaults: {

      // The index of the toggle to open on initialization
      initial: -1,

      // True if the toggles should behave as an accordion
      accordion: false,

      activeClass: 'text-primary',

      // The ID of the custom template to use when generating HTML
      template: 'toggles',

      // Additional data to expose to the template
      templateData: {}
    },

    optionTypes: {
      initial: 'number',
      activeClass: 'string',
      accordion: 'boolean',
      template: '(string|null)',
      templateData: 'object'
    },

    /**
     * Initializes the plugin.
     */
    initialize: function(options) {
      if (this.el.children.length) {
        this.render(options);
      }
    },

    /**
     * Renders the plugin HTML.
     */
    render: function(options) {
      var templateString = Util.getTemplateString(this.options.template);
      var html;

      var dataAttributes = 'data-toggle="collapse"';
      if (options.activeClass) {
        dataAttributes += ' data-active-class="' + options.activeClass + '"';
      }

      if (!templateString) {
        templateString = '' +
          '<% if (children.length) { %>' +
            '<ul class="list-unstyled list-bordered my-6 border border-radius" id="<%= id %>">' +
              '<% children.forEach(function(child, index) { %>' +
                '<% var isActive = (initial === index); %>' +
                '<li class="px-5 py-1">' +
                  '<a class="toggle-title font-semibold text-inherit hover:text-primary<% if (isActive && activeClass) { %> activeClass<% } %>" ' + dataAttributes + ' aria-expanded="<%= isActive %>" href="#<%= id %>-<%= index %>">' +
                    '<%= child.title %>' +
                  '</a>' +
                  '<div class="collapse<% if (isActive) { %> is-visible<% } %>" id="<%= id %>-<%= index %>" <% if (parent) { %>data-parent="<%= parent %>"<% } %>>' +
                    '<div class="py-4">' +
                      '<%= child.innerHTML %>' +
                    '</div>' +
                  '</div>' +
                '</li>' +
              '<% }); %>' +
            '</ul>' +
          '<% } %>';
      }

      var compiled = Util.template(templateString);
      var children = [].slice.call(this.el.children).map(function(child, i) {
        var title = 'Toggle ' + i;
        if (child.hasAttribute('data-title')) {
          title = child.getAttribute('data-title');
        } else {
          var heading = child.querySelector('.toggle-heading');
          if (heading) {
            title = heading.textContent;
          }
        }
        return {
          innerHTML: child.innerHTML,
          title: title
        };
      });

      var data = {
        id: this.id,
        children: children,
        items: children,
        accordion: options.accordion,
        parent: options.accordion ? '#' + this.id : null,
        initial: options.initial,
        dataAttributes: dataAttributes,
        activeClass: options.activeClass
      };

      if (this.options.templateData) {
        data = Util.extend(data, this.options.templateData);
      }

      html = compiled(data).replace(/(^\s+|\s+$)/g, '');
      if (html) {
        this.el.insertAdjacentHTML('afterend', html);
      }

      var el = this.el.nextElementSibling;
      this.el.classList.forEach(function(className) { el.classList.add(className); });
      if (this.el.id) {
        el.id = this.el.id;
      }

      Util.triggerEvent(this.el, Event.RENDER, {
        relatedTarget: el
      });

      this.el.remove();
      this.el = el;
    }
  });

  window.addEventListener('load', function() {
    each('[data-element="toggles"], .js-toggles', function(el) {
      new Toggles(el);
    });
  });
})();

/* carousels.js */
(function() {
  "use strict";

  // Globals
  var NAME = 'carousel';

  var Event = {
    RENDER:   NAME + ':render',
    INIT:   NAME + ':initialize',
    NEXT:  NAME + ':next',
    PREVIOUS:   NAME + ':previous',
  };

  /**
   * Carousel.
   *
   * @type {component}
   */
  window.Carousel = Util.createPlugin({

    defaults: {

      // The index of the page to open on initialization
      initial: 0,

      // Selectors
      children: '.list-unstyled > li',
      previousButton: '.js-previous',
      nextButton: '.js-next',

      // The 'Next step' title
      nextTitle: 'Next',

      // The 'Previous step' title
      previousTitle: 'Previous',

      scrollToTop: false,

      // The ID of the custom template to use when generating HTML
      template: 'carousel',

      // Additional data to expose to the template
      templateData: {}
    },

    optionTypes: {
      initial: 'number',
      children: 'string',
      previousButton: 'string',
      nextButton: 'string',
      nextTitle: 'string',
      previousTitle: 'string',
      scrollToTop: 'boolean',
      template: '(string|null)',
      templateData: 'object'
    },

    /**
     * Initializes the plugin instance.
     *
     * @param options
     */
    initialize: function(options) {
      if (!this.el.children.length) return;

      this.render();

      this.children = this.el.querySelectorAll(options.children);
      this.previousButton = this.el.querySelector(options.previousButton);
      this.nextButton = this.el.querySelector(options.nextButton);

      var initial = options.initial;
      this._activate(initial >= 0 && initial < this.children.length ? initial : 0);
      this._addEventListeners();

      Util.triggerEvent(this.el, Event.INIT, {
        relatedTarget: this.el
      });
    },

    render: function() {
      var templateString = Util.getTemplateString(this.options.template);
      var html;

      if (!templateString) {
        templateString = '' +
          '<% if (children.length) { %>' +
            '<div class="p-6 mb-4 border border-radius bg-white">' +
              '<ul class="list-unstyled">' +
                '<% children.forEach(function(child, index) { %>' +
                  '<li>' +
                    '<%= child.innerHTML %>' +
                  '</li>' +
                '<% }); %>' +
              '</ul>' +
              '<div class="mt-6">' +
                '<button class="button button-link js-previous">' +
                  '<svg class="svg-icon fill-current mr-1" viewBox="0 0 423 323" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">' +
                    '<path d="M423,162 C423,174 413,184 401,184 L76,184 L177,286 C186,294 186,308 177,317 C173,321 167,323 161,323 C156,323 150,321 146,317 L7,178 C-2,169 -2,155 7,146 L146,7 C155,-2 169,-2 177,7 C186,16 186,30 177,39 L76,140 L401,140 C413,140 423,150 423,162 Z"></path>' +
                  '</svg>' +
                  '<% if (previousTitle) { %>' +
                    '<%= previousTitle %>' +
                  '<% } %>' +
                '</button>' +
                '<button class="button button-primary js-next">' +
                  '<% if (nextTitle) { %>' +
                    '<%= nextTitle %>' +
                  '<% } %>' +
                  '<svg class="svg-icon fill-current ml-1" viewBox="0 0 423 323" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">' +
                    '<path d="M416,178 L277,317 C273,321 267,323 262,323 C256,323 251,321 246,317 C237,308 237,294 246,285 L347,184 L22,184 C10,184 0,174 0,162 C0,150 10,140 22,140 L347,140 L246,38 C237,30 237,16 246,7 C254,-2 268,-2 277,7 L416,146 C425,155 425,169 416,178 Z"></path>' +
                  '</svg>' +
                '</button>' +
              '</div>' +
            '</div>' +
          '<% } %>';
      }

      var compiled = Util.template(templateString);
      var children = [].slice.call(this.el.children).map(function(child, i) {
        return {
          innerHTML: child.innerHTML,
          title: child.getAttribute('data-title') || null
        }
      });

      var data = {
        id: this.id,
        items: children,
        children: children,
        nextTitle: this.options.nextTitle,
        previousTitle: this.options.previousTitle,
        initial: this.options.initial
      };

      if (this.options.templateData) {
        data = Util.extend(data, this.options.templateData);
      }

      html = compiled(data).replace(/(^\s+|\s+$)/g, '');

      if (html) {
        this.el.insertAdjacentHTML('afterend', html);
      }

      var el = this.el.nextElementSibling;
      this.el.classList.forEach(function(className) {
        el.classList.add(className);
      });
      if (this.el.id) {
        el.id = this.el.id;
      }
      this.el.remove();
      this.el = el;

      Util.triggerEvent(this.el, Event.RENDER, {
        relatedTarget: this.el
      });
    },

    /**
     * Shows the previous page.
     */
    previous: function() {
      if (this.previousButton.classList.contains(Util.classNames.DISABLED) || this.active === 0) {
        return;
      }
      this._activate(this.active - 1);
      this._maybeScroll(this.el.parentNode);
      Util.triggerEvent(this.el, Event.PREVIOUS, {
        relatedTarget: this.children[this.active]
      });
    },

    /**
     * Shows the next page.
     */
    next: function() {
      if (this.nextButton.classList.contains(Util.classNames.DISABLED) || this.active === (this.children.length - 1)) {
        return;
      }
      this._activate(this.active + 1);
      this._maybeScroll(this.el.parentNode);
      Util.triggerEvent(this.el, Event.NEXT, {
        relatedTarget: this.children[this.active]
      });
    },

    /**
     * Adds event listeners.
     */
    _addEventListeners: function() {
      this.previousButton.addEventListener('click', this._onClick.bind(this));
      this.previousButton.addEventListener('keypress', this._onClick.bind(this));
      this.nextButton.addEventListener('click', this._onClick.bind(this));
      this.nextButton.addEventListener('keypress', this._onClick.bind(this));
    },

    /**
     * Activates the item at the specified index.
     *
     * @param index
     * @private
     */
    _activate: function(index) {
      var isFirst = (index === 0);
      var isLast = (index === (this.children.length - 1));
      var visibleClassName = Util.classNames.VISIBLE;
      var disabledClassName = Util.classNames.DISABLED;

      Array.prototype.forEach.call(this.children, function(child, i) {
        if (i === index) {
          child.style.display = 'block';
          child.classList.add(visibleClassName);
        } else {
          child.style.display = 'none';
          child.classList.remove(visibleClassName);
        }
      });

      if (isFirst) {
        this.previousButton.classList.add(disabledClassName);
        this.previousButton.setAttribute('disabled', 'true');
      } else {
        this.previousButton.classList.remove(disabledClassName);
        this.previousButton.removeAttribute('disabled');
      }

      if (isLast) {
        this.nextButton.classList.add(disabledClassName);
        this.nextButton.setAttribute('disabled', 'true');
      } else {
        this.nextButton.classList.remove(disabledClassName );
        this.nextButton.removeAttribute('disabled');
      }

      this.active = index;
    },

    /**
     * Activates an item when the previous/next button is clicked.
     *
     * @param e
     * @private
     */
    _onClick: function(e) {
      if (e.type === "keypress" && e.which !== 13) {
        return;
      }

      this[e.currentTarget === this.previousButton ? 'previous' : 'next'].call(this);
      e.preventDefault();
    },

    /**
     * Scrolls to the top of the carousel if part of it is outside of the viewport.
     *
     * @param el
     * @private
     */
    _maybeScroll: function(el) {
      if (!this.options.scrollToTop) {
        return;
      }
      var rect = el.getBoundingClientRect();
      if (rect.top < 0 || rect.bottom > (window.innerHeight || document.documentElement.clientHeight)) {
        el.scrollIntoView({
          block: "start",
          inline: "nearest",
          behavior: "smooth"
        });
      }
    }
  });

  window.addEventListener('load', function() {
    each('[data-element="carousel"], .js-carousel', function(el) {
      new Carousel(el);
    });
  });
})();

/* sticky.js */
(function() {
  "use strict";

  // Globals
  var NAME = 'sticky';

  var Event = {
    INITIALIZE: NAME + ':initialize',
    STUCK: NAME + ':stuck',
    UNSTUCK: NAME + ':unstuck',
    HIDDEN: NAME + ':hidden',
    SHOWN: NAME + ':shown'
  };

  /**
   * Sticky.
   *
   * @type {component}
   */
  window.Sticky = Util.createPlugin({

    defaults: {
      scrollElement: window,
      offset: 0,
      tolerance: 8,
      hide: false,
      classNames: {

        // The class name(s) to apply to the element when the plugin is initialized
        sticky: 'sticky-top',

        // The class name(s) to apply to the element when it is not stuck
        unstuck: 'is-unstuck',

        // The class name(s) to apply to the element when it is stuck
        stuck: 'is-stuck',

        // The class name(s) to apply to the element when it is hidden (if applicable)
        hidden: Util.classNames.HIDDEN
      }
    },

    optionTypes: {
      scrollElement: '(window|element|string)',
      offset: 'number',
      tolerance: 'number',
      hide: 'boolean',
      classNames: '(object|string)'
    },

    /**
     * Initializes the plugin instance.
     *
     * @param options
     */
    initialize: function(options) {

      // Do nothing if the browser does not support position:sticky
      if (!this._supportsSticky()) return;

      if (typeof this.options.classNames === 'string') this.options.classNames = this._parseJSON(this.options.classNames);

      var stickyClassNames = this._getClassName('sticky');
      if (stickyClassNames) {
        this.el.classList.add.apply(
          this.el.classList,
          stickyClassNames.split(' ')
        );
      }

      this.scrollElement = (typeof options.scrollElement === 'string' ? document.querySelector(options.scrollElement) : options.scrollElement) || window;
      this.lastScrollTop = (this.scrollElement === window) ? window.scrollY || window.pageYOffset : this.scrollElement.scrollTop;
      this.scrolling = false;

      this._addEventListeners();

      // Set the initial state
      this._onScroll();

      Util.triggerEvent(this.el, Event.INITIALIZE);
    },

    /**
     * Returns an object given a JSON string.
     * @param str
     * @returns {*}
     * @private
     */
    _parseJSON: function(str) {
      var value = undefined;
      try {
        return JSON.parse(str);
      }
      catch(e) {
        if (str.indexOf('\'')) {
          str = str.replace(/\'/g, '"');
          value = this._parseJSON(str)
        } else {
          console.error('Sticky: classNames option value is not valid.');
        }
        return value;
      }
    },

    /**
     * Returns true if the browser supports position:sticky.
     *
     * @returns {boolean}
     */
    _supportsSticky: function() {
      var prefix = ['', '-o-', '-webkit-', '-moz-', '-ms-'];
      var test = document.head.style;
      for (var i = 0; i < prefix.length; i += 1) {
        test.position = prefix[i] + 'sticky';
      }
      var supportsSticky = !!test.position;
      test.position = '';
      return supportsSticky;
    },

    /**
     * Adds event listeners.
     */
    _addEventListeners: function() {
      this.scrollElement.addEventListener('scroll', this._onScroll.bind(this));
    },

    /**
     * Returns the top position of the specified element.
     *
     * @param el
     * @returns {number}
     * @private
     */
    _getTopPosition: function(el) {
      return el.getBoundingClientRect().top + (this.scrollElement.pageYOffset || document.documentElement.scrollTop);
    },

    /**
     * Checks the position of the header on scroll.
     *
     * @private
     */
    _onScroll: function() {
      if (!this.scrolling) {
        requestAnimationFrame(this._updateClassNames.bind(this));
        this.scrolling = true;
      }
    },

    /**
     * Updates class names of the sticky element based on the scroll position.
     *
     * @private
     */
    _updateClassNames: function() {
      var scrollTop = (this.scrollElement === window) ? window.scrollY || window.pageYOffset : this.scrollElement.scrollTop;
      var parentTop = this._getTopPosition(this.el.parentElement);
      var isStuck = scrollTop > (parentTop + this.options.offset);

      // Do nothing if the state is unchanged
      if (typeof this.isStuck !== 'undefined' && this.isStuck === isStuck) {
        this.scrolling = false;
        return;
      }

      this.isStuck = isStuck;

      var stuckClassNames = this._getClassName('stuck');
      var unStuckClassNames = this._getClassName('unstuck');
      if (isStuck) {
        if (unStuckClassNames) {
          this.el.classList.remove.apply(
            this.el.classList,
            unStuckClassNames.split(' ')
          );
        }
        if (stuckClassNames) {
          this.el.classList.add.apply(
            this.el.classList,
            stuckClassNames.split(' ')
          );
        }
      } else {
        if (stuckClassNames) {
          this.el.classList.remove.apply(
            this.el.classList,
            stuckClassNames.split(' ')
          );
        }
        if (unStuckClassNames) {
          this.el.classList.add.apply(
            this.el.classList,
            unStuckClassNames.split(' ')
          );
        }
      }

      Util.triggerEvent(this.el, (isStuck? Event.STUCK : Event.UNSTUCK));

      if (this.options.hide === true) {
        var hiddenClassNames = this._getClassName('hidden');
        if (scrollTop > (this.lastScrollTop + this.options.tolerance)) {
          if (hiddenClassNames) {
            this.el.classList.add.apply(
              this.el.classList,
              hiddenClassNames.split(' ')
            );
          }
          Util.triggerEvent(this.el, Event.HIDDEN);
        } else if (scrollTop < this.lastScrollTop || scrollTop <= 0) {
          if (hiddenClassNames) {
            this.el.classList.remove.apply(
              this.el.classList,
              hiddenClassNames.split(' ')
            );
          }
          Util.triggerEvent(this.el, Event.SHOWN);
        }
      }

      this.lastScrollTop = scrollTop;
      this.scrolling = false;
    }
  });

  window.addEventListener('load', function() {
    each('[data-element="sticky"]', function(el) {
      new Sticky(el);
    });
  });
}());

/* scrollspy.js */
(function() {
  "use strict";

  var NAME = 'scrollspy';

  var Event = {
    ACTIVE:   NAME + ':active'
  };

  /**
   * Scrollspy.
   *
   * @type {component}
   */
  window.Scrollspy = Util.createPlugin({

    defaults: {
      offset: 0,
      scrollElement: null,
      activeClass: Util.classNames.ACTIVE
    },

    optionTypes: {
      offset: '(string|number)',
      scrollElement: '(string|element|null)',
      activeClass: 'string'
    },

    /**
     * Initializes the plugin.
     */
    initialize: function() {
      var links = this.el.querySelectorAll("a[href^='#']");
      if (!links.length) {
        Util.log('The scrollspy element does not contain any links to anchor elements.');
        return;
      }

      if (typeof this.options.offset === 'string') this.options.offset = parseInt(this.options.offset, 10);

      var scrollElement = this._getScrollElement();

      this._scrollElement = scrollElement.tagName === 'BODY' ? window : scrollElement;
      this._links = Array.prototype.slice.call(links);
      this._targets = this._getTargets();
      this._activeTarget = null;

      this._addEventListeners();
      this._onScroll();
    },

    /**
     * Returns the scroll element.
     *
     * @returns {*}
     * @private
     */
    _getScrollElement: function() {
      var scrollElement = this.options.scrollElement;
      if (!scrollElement) {
        return window;
      }

      if (Util.isElement(scrollElement)) {
        return scrollElement;
      }

      if (typeof scrollElement === 'string') {
        return document.querySelector(scrollElement) || window;
      }
      return window;
    },

    /**
     * Returns the target elements of the list.
     *
     * @private
     */
    _getTargets: function() {
      var scrollElement = this._scrollElement === window ? document : this._scrollElement;
      return this._links

      // Find elements in the scroll element
        .map(function(el) {
          return scrollElement.querySelector(el.getAttribute('href').trim());
        })
        .filter(function(item) {
          return item;
        })

        // Sort based on top position
        .sort(function(a, b) {
          return a.getBoundingClientRect().top - b.getBoundingClientRect().top;
        });
    },

    /**
     * Adds the required event listeners.
     */
    _addEventListeners: function() {
      var _this = this;
      this._scrollElement.addEventListener('scroll', this._onScroll.bind(this));
      this._links.forEach(function(link) {
        link.addEventListener('click', _this._onClick.bind(_this));
      });
    },

    /**
     * Scroll the target element into view when a link referencing it is clicked.
     *
     * @param e
     * @private
     */
    _onClick: function(e) {
      var elementId = e.target.href.substring(e.target.href.indexOf('#') + 1);
      var targetElement = document.getElementById(elementId);

      // Scroll the element into view
      if (targetElement) {
        Util.scrollIntoView(targetElement, this.options.offset, this._scrollElement);
      }
      e.preventDefault();
    },

    /**
     * Returns the scrollTop position of the scroll element.
     *
     * @returns {number}
     * @private
     */
    _getScrollTop: function() {
      return this._scrollElement === window ? this._scrollElement.pageYOffset : this._scrollElement.scrollTop;
    },

    /**
     * Returns the scrollHeight of the scroll element.
     *
     * @returns {number}
     * @private
     */
    _getScrollHeight: function() {
      return this._scrollElement.scrollHeight || Math.max(document.body.scrollHeight, document.documentElement.scrollHeight)
    },

    /**
     * Returns the height of the scroll element.
     *
     * @returns {number}
     * @private
     */
    _getOffsetHeight: function() {
      return this._scrollElement === window ? window.innerHeight : this._scrollElement.getBoundingClientRect().height
    },

    /**
     * Updates the links on page scroll.
     *
     * @private
     */
    _onScroll: function() {
      var scrollTop = this._getScrollTop() + this.options.offset;
      var scrollHeight = this._getScrollHeight();
      var maxScroll = this.options.offset + scrollHeight - this._getOffsetHeight();

      // Identify active target
      var activeTarget = null;
      if (scrollTop >= maxScroll) {
        activeTarget = this._targets[this._targets.length - 1];
      } else {
        var scrollElementTop = this._scrollElement === window ? 0 : this._scrollElement.getBoundingClientRect().top;
        for (var i = 0; i < this._targets.length; i++) {
          var target = this._targets[i];
          if ((target.getBoundingClientRect().top - scrollElementTop - (this.options.offset + 1)) > 0) {
            if (activeTarget === null) {
              activeTarget = target;
            }
            break;
          }
          activeTarget = target;
        }
      }

      // Do nothing if the active target hasn't changed
      if (this._activeTarget === activeTarget) {
        return;
      }

      this._activeTarget = activeTarget;

      // Update link class names
      var activeClassNames = this.options.activeClass;
      this._links.forEach(function(link) {
        link.classList.remove.apply(
          link.classList,
          activeClassNames.split(' ')
        );
      });

      var activeLink = this._links.filter(function(link) {
        return activeTarget && link.getAttribute('href') === ('#' + activeTarget.id);
      })[0] || null;

      if (activeLink === null) return;

      activeLink.classList.add.apply(
        activeLink.classList,
        activeClassNames.split(' ')
      );

      Util.triggerEvent(this.el, Event.ACTIVE, {
        relatedTargets: activeLink
      });

      // Update ancestor link class names
      var parent = activeLink.parentElement;
      while (parent !== this.el) {
        var sibling = parent.previousElementSibling;
        if (['UL','OL','NAV'].indexOf(parent.tagName) > -1 && sibling && sibling.tagName === 'A') {
          var link = this._links.filter(function(el) {
            return el === sibling;
          });
          if (link.length) {
            link.classList.add.apply(
              link.classList,
              activeClassNames.split(' ')
            );
          }
        }
        parent = parent.parentElement;
      }
    }
  });

  window.addEventListener('load', function() {
    each('[data-spy="scroll"]', function(el) {
      new Scrollspy(el);
    });
  });
})();
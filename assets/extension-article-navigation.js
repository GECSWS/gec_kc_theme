(function() {
  "use strict";

  // Globals
  var NAME = 'articleNavigation';

  var Event = {
    RENDER: NAME + ':render'
  };

  /**
   * Articles Navigation extension.
   *
   * @type {component}
   */
  window.ArticleNavigation = Util.createPlugin({

    defaults: {

      // A collection of articles (can include sections and categories)
      collection: {},

      // The ID of the current article
      articleId: null,

      // The 'Next article' title
      nextTitle: 'Next article',

      // The 'Previous article' title
      previousTitle: 'Next article',

      // Only include articles with one or more labels
      labels: [],

      // The list of REST API properties passed to the rendering function
      properties: [
        "id",
        "name",
        "title",
        "html_url",
        "position",
        "promoted",
        "draft",
        "section_id",
        "category_id",
        "created_at"
      ],

      // Custom filtering functions
      filter: {
        categories: function(category) { return category.draft !== true; },
        sections: function(section) { return section.draft !== true; },
        articles: function(article) { return article.draft !== true; }
      },

      // Custom sorting functions
      sort: {
        categories: 'sortByPosition',
        sections: 'sortByPosition',
        articles: 'sortByPosition'
      },
      sortOrder: 'asc',

      // The ID of the custom template to use when generating HTML
      template: null,

      // Additional data to expose to the template
      templateData: {}
    },

    optionTypes: {
      collection: 'object',
      articleId: '(string|number|null)',
      nextTitle: 'string',
      previousTitle: 'string',
      labels: '(string|array)',
      properties: '(string|array)',
      sort: '(string|object)',
      sortOrder: 'string',
      filter: '(string|object|null)',
      template: '(string|null)',
      templateData: '(string|object)'
    },

    /**
     * Initializes the extension.
     *
     * @param options
     */
    initialize: function(options) {
      for (var optionName in options) {
        if (options.hasOwnProperty(optionName)) {
          var optionValue = options[optionName];
          if (typeof optionValue === 'string' && /object|array/g.test(this.optionTypes[optionName])) {
            try {
              this.options[optionName] = options[optionName] = JSON.parse(optionValue);
            }
            catch (e) {
              this.options[optionName] = options[optionName] = this.defaults[optionName];
              console.error('Option value (' + optionName + ') is not a valid JSON string.');
            }
          }
        }
      }

      if (options.collection && options.collection.hasOwnProperty('articles')) {
        this.render(options.collection);
      } else {
        if (!options.articleId) {
          if (!Util.isArticlePage()) {
            console.error('An article ID must be specified');
            return;
          }
          options.articleId = Util.getPageId();
        }
        this.getArticles(options.properties).then(this.render.bind(this));
      }
    },

    /**
     * Returns articles from the Zendesk REST API.
     *
     * Categories and sections may also be included, depending on the plugin settings.
     *
     * @returns {Promise}
     */
    getArticles: function(properties) {
      var options = this.options;
      var params = [];

      // Generate the REST API URL
      var url = '/api/v2/help_center/' + Util.locale + '/articles.json?include=categories,sections';

      if (options.labels.length) {
        params.push('label_names=' + options.labels.join(','));
      }

      if (params.length) {
        url += '?' + params.join('&');
      }
      return Util.request(url, properties);
    },

    /**
     * Sorts articles in the provided collection.
     *
     * @param collection
     * @returns {*[]}
     * @private
     */
    _sortArticles: function(collection) {
      var categories = this._filterObjects(collection.categories, 'categories').reverse();
      var sections = this._filterObjects(collection.sections, 'sections').reverse();
      var articles = this._filterObjects(collection.articles, 'articles');
      var sortObjects = this._sortObjects.bind(this);
      var sortedArticles = [];

      articles = sortObjects(articles, 'articles');

      sortObjects(categories, 'categories').forEach(function(category) {
        sortObjects(sections, 'sections').forEach(function(section) {
          if (section['category_id'] === category.id) {
            var i = articles.length;
            while (i--) {
              var article = articles[i];
              if (article['section_id'] === section.id) {
                sortedArticles.push(article);
                articles.splice(i, 1);
              }
            }
          }
        });
      });
      return this.options.sortOrder === 'desc' ? sortedArticles : sortedArticles.reverse();
    },

    /**
     * Filters objects based on the object type.
     * @param objects
     * @param objectType
     * @returns {*}
     */
    _filterObjects: function(objects, objectType) {
      var options = this.options;
      if (options.filter.hasOwnProperty(objectType) && options.sort[objectType] !== null) {
        if (typeof options.filter[objectType] === 'function') {
          return objects.filter(options.filter[objectType]);
        } else {
          var method = options.filter[objectType];
          if (typeof method === 'string' && typeof Util[method] === 'function') {
            return objects.filter(Util[method]);
          }
        }
      }
      return objects;
    },

    /**
     * Sorts objects based on the object type.
     * @param objects
     * @param objectType
     * @returns {*}
     */
    _sortObjects: function(objects, objectType) {
      var options = this.options;
      var defaultSortingFunctions = {
        categories: this.sortByPosition,
        sections: this.sortByPosition,
        articles: this.sortByName
      };
      if (options.sort.hasOwnProperty(objectType) && options.sort[objectType] !== null) {
        if (typeof options.sort[objectType] === 'function') {
          return objects.sort(options.sort[objectType]);
        } else {
          var method = options.sort[objectType];
          if (typeof method === 'string' && typeof Util[method] === 'function') {
            return objects.sort(Util[method]);
          }
        }
      }
      return objects.sort(defaultSortingFunctions[objectType]);
    },

    /**
     * Renders the extension.
     *
     * @param collection
     */
    render: function(collection) {
      var options = this.options;
      var articles = this._sortArticles(collection);

      // Get the index of the current article
      var index;
      for (var i = 0; i < articles.length; i++) {
        if (articles[i].id === options.articleId) {
          index = i;
          break;
        }
      }

      var data = {
        nextTitle: this.options.nextTitle,
        currentArticle: articles[index],
        previousTitle: this.options.previousTitle,
        previousArticle: (index - 1 >= 0) ? articles[index - 1] : null,
        nextArticle: (index + 1 < articles.length) ? articles[index + 1] : null,
      };
      if (options.templateData) {
        data = Util.extend(data, options.templateData);
      }

      Util.renderTemplate(this.el, options.template, data, { replaceContent: true });

      Util.triggerEvent(this.el, Event.RENDER, {
        relatedTarget: this.el,
        articles: articles,
      });
    }
  });

  window.addEventListener('load', function() {
    each('[data-element="article-navigation"]', function(el) {
      new ArticleNavigation(el);
    });
  });
})();
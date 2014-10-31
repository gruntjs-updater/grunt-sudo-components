/*
 * grunt-sudo-components
 * https://github.com/wirsich/grunt-sudo-components
 *
 * Copyright (c) 2014 Stephan Wirsich
 * Licensed under the MIT license.
 */

'use strict';

module.exports = {
  init: function (options) {
    this.options = options;
    this.minifier = this.minifier || require('uglify-js');
    return this;
  },

  handle: function (component, success, error) {
    var result = this.minifier.minify(component.src, this.options);
    success(component, result.code);
  }
};

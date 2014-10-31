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
    this.jade = this.jade || require('jade');
    return this;
  },

  handle: function (component, success, error) {
    var options = this.options;
    options.filename = component.src;
    success(component, this.jade.compileClient(component.contents(), options));
  }
};

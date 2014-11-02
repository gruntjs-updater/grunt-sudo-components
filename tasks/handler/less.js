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
    this.less = this.less || require('less');
    this.imports = options.imports && options.imports.length > 0 ?
      '@import (reference) "'+ options.imports.join('"; @import (reference) "') +'";'
      : '';
    return this;
  },

  handle: function (component, success, error) {
    this.less.render(this.imports +"\n"+ component.contents(), {
      compress: true,
    }, function (err, css) {
      if (err) {
        return error(component, err);
      }
      success(component, css);
    });
  }
};

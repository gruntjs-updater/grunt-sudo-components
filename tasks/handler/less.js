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
    this.parser = this.parser || new (require('less').Parser)();
    this.imports = options.imports.length > 0 ?
      "@import '"+ options.imports.join("'; @import '") +"';"
      : '';
    return this;
  },

  handle: function (component, success, error) {
    this.parser.parse(this.imports +"\n"+ component.contents(), function (err, data) {
      if (err) {
        return error(component, err);
      }
      success(component, data.toCSS({compress: true}));
    });
  }
};

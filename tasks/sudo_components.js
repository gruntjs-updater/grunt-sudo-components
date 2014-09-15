/*
 * grunt-sudo-components
 * https://github.com/wirsich/grunt-sudo-components
 *
 * Copyright (c) 2014 Stephan Wirsich
 * Licensed under the MIT license.
 */

'use strict';

module.exports = function(grunt) {
  grunt.registerMultiTask('sudo_components', 'Build SUDO specific components', function() {
    var options = this.options({
      namespace: 'client'
    });

    var jade;
    var less;

    // @TODO make sure this is working
    var less_parse = function (contents) {
      less = less || new (require('less').Parser)();
      var done = false;
      less.parse(contents, function (err, data) {
        if (err) { done = true; grunt.fail.fatal(err); }
        contents = data.toCSS({compress: true});
        done = true;
      });
      while (done === false) {
        console.log('wait for parser');
      }
      return contents;
    };

    var buffer = {};

    this.files.forEach(function(f) {
      var file = f.src[0];

      if (grunt.file.isFile(file)) {
        var root = f.orig.cwd;
        var component = file.split(root)[1];
        component = component.split('/');
        var name = component.pop().split('.')[0];
        // @FIXME subcomponents are not independent enough in this case (naming)
        component = component.join('-');

        if (component === "") {
          grunt.log.warn('parsing component "'+ f.src[0] +'"; component is not wrapped in a component folder, name component "'+name+'".');
          component = name;
        }
        var filename = f.orig.dest + component + '.js';

        // @TODO set component container
        // @TODO modules and options for handler
        // @TODO modules and options for wrapper
        var contents = grunt.file.read(file);

        switch (file.split('.').pop()) {
          case 'jade':
            jade = jade || require('jade');
            contents = jade.compileClient(contents);
            contents = options.namespace+".Template('"+ component +"/"+ name +"', '"+ contents +"')";
            break;
          case 'less':
            contents = less_parse(contents);
            contents = options.namespace+".Style('"+ name +"', '"+ contents +"')";
            break;
        }
        contents = "\n"+'#### '+component+'/'+name+'#####'+"\n"+contents;

        buffer[filename] = buffer[filename] || '';
        buffer[filename]+= contents;
      }
    });

    // @NOTE files and subdirs not sorted
    // write contents
    for (var filename in buffer) {
      grunt.file.write(filename, buffer[filename]);
      grunt.log.ok('Component "' + filename + '" created.');
    }
  });

};

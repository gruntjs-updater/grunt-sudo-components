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
      namespace:  'client',
      templateFn: 'Template',
      styleFn:    'Style',
      jade: {
        compileDebug: false,
        pretty: false
      }
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

    var reduceComponent = function (file, extension) {
      extension = (extension || '.js').toLowerCase();
      var src = file.src[0];
      var cwd = file.orig.cwd;
      var ext = src.split('.').pop();
      var dest = file.orig.dest;

      var component;
      var name;
      var comp = src.split(cwd)[1];

      if (comp.indexOf('/') < 0) {
        // is in root directory cwd
        component = comp.split('.'+ ext)[0];
        name = component;
      }
      else {
        component = comp.split('/')[0];
        name = comp.split('/').pop();
      }
      name = name.split('.'+ ext)[0];

      return {
        debug: comp,
        cwd: cwd,
        src: src,
        dest: dest + component.toLowerCase() + extension,
        component: component.toLowerCase(),
        name: name.toLowerCase(),
        ext: ext.toLowerCase(), // if file
        contents: function () {
          return grunt.file.read(src);
        }
      };
    };

    var writeComponents = function (buffer) {
      for (var filename in buffer) {
        grunt.file.write(filename, buffer[filename]);
        grunt.log.ok(filename + '" created.');
      }
    };

    var namespace = function (component) {
      return [component.component, component.name].join(':');
    };

    var buffer = {};
    this.files.forEach(function(f) {
      if (grunt.file.isFile(f.src[0])) {
        var component = reduceComponent(f);

        grunt.log.writeln('Processing '+ component.component + ' ' + component.name +' ('+ component.src +')');
        grunt.verbose.writeln(component);

        // @TODO set component container
        // @TODO modulize + options for handler
        // @TODO modulize + options for wrapper
        var contents = component.contents();
        grunt.verbose.ok('Got contents');

        grunt.verbose.writeln('Handle contents');
        // handle content types
        switch (component.ext) {
          case 'jade':
            grunt.verbose.writeln('use jade to handle contents');
            jade = jade || require('jade');
            var jadeOptions = options.jade;
            jadeOptions.filename = component.src;
            contents = jade.compileClient(contents, {filename: jadeOptions});
            contents = options.namespace+".Template('"+ namespace(component) +"', '"+ contents +"')";
            grunt.log.ok('processed contents with jade');
            break;
          case 'less':
            grunt.verbose.writeln('use less to handle contents');
            // contents = less_parse(contents);
            contents = options.namespace+".Style('"+ namespace(component) +"', '"+ contents +"')";
            grunt.log.ok('processed contents with less');
            break;
        }
        contents = "\n"+'#### '+ namespace(component) +'#####'+"\n"+contents;

        buffer[component.dest] = buffer[component.dest] || '';
        buffer[component.dest]+= contents;
      }
    });

    // @TODO use grunt templates to format output

    grunt.log.writeln();
    grunt.log.ok('Got all components, writing to destination.');
    grunt.log.writeln();

    // @NOTE files and subdirs not sorted
    writeComponents(buffer);
  });
};

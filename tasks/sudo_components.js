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
      template:   "/* <%= src %> <%= grunt.template.today('HH:MM:ss') %> */\n",
      js: {
        mangle: false
      },
      jade: {
        options: {
          compileDebug: false,
          pretty: false
        }
      },
      less: {
        imports: [],
        options: {
          minify: true
        }
      }
    });

    var buffer = {};
    var jobs = 1;
    var terminate = this.async();
    var done = function () {
      jobs--;
      grunt.verbose.ok(jobs);
      if (jobs === 0) {
        grunt.verbose.ok('finishing');
        finish();
        terminate();
      }
    };
    var finish = function () {
      grunt.log.writeln();
      grunt.log.ok('Got all components, writing to destination.');
      grunt.log.writeln();
      // @NOTE files and subdirs not sorted
      writeComponents(buffer);
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

    var handlers = {};

    var handleComponent = function (handlerName, component, buffer) {
      var successCallback = function (component, contents) {
        // @TODO substitute with format method
        // @TODO modulize + options for wrapper
        switch (component.ext) {
          case 'less':
            contents = options.namespace+".Style('"+ namespace(component) +"', '"+ contents +"')";
            break;
          case 'jade':
            contents = options.namespace+".Template('"+ namespace(component) +"', '"+ contents +"')";
            break;
          case 'js':
          default:

        }

        contents = grunt.template.process(options.template, {data: component}) + contents;

        grunt.log.ok('Contents compiled ('+ component.src +')');
        appendBuffer(component, buffer, contents);
        done();
      };

      var errorCallback = function (component, error) {
        grunt.log.warn(component.src);
        done();
        grunt.fail.fatal(error);
      };

      try {
        grunt.verbose.writeln('use '+ handlerName +' to handle contents');
        handlers[handlerName] =
          handlers[handlerName] ||
          require('./handler/'+ handlerName +'.js')
            .init(options[handlerName] || {});

        jobs++;
        handlers[handlerName].handle(component, successCallback, errorCallback);
      } catch (e) {
        // @TODO throw fatal
        grunt.log.warn('Cannot handle '+component.src);
        grunt.log.warn(e);
      }
    };

    var appendBuffer = function (component, buffer, contents) {
      buffer[component.dest] = buffer[component.dest] || '';
      buffer[component.dest]+= contents;
    };

    // @TODO use progress bar
    grunt.log.subhead('Processing components');
    this.files.forEach(function(f) {
      if (grunt.file.isFile(f.src[0])) {
        var component = reduceComponent(f);
        // grunt.log.writeln('Processing '+ component.component + ' ' + component.name +' ('+ component.src +')');
        grunt.verbose.writeln(component.src, component.component, component.name, component.dest);
        handleComponent(component.ext, component, buffer);
      }
    });
    done();
  });
};

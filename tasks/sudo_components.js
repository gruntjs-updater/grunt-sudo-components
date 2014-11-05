/*
 * grunt-sudo-components
 * https://github.com/wirsich/grunt-sudo-components
 *
 * Copyright (c) 2014 Stephan Wirsich
 * Licensed under the MIT license.
 */

'use strict';

//@TODO use scripts option when render jade to ensure that no extra import is done

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
        buffer[filename] = [
          buffer[filename].top.join(''),
          buffer[filename].middle.join(''),
          buffer[filename].bottom.join('')
        ].join('');

        grunt.file.write(filename, buffer[filename]);
        grunt.log.ok(filename + '" created.');
      }
    };

    var namespace = function (component) {
      return [component.component, component.name].join('/');
    };

    var handlers = {};

    var patterns = {
      "middle": /^(\s)?[a-z]+\.View(\s)?\(/i,
      "bottom": /^(\s)?[a-z]+\.ViewController(\s)?\(/i,
      "foo": /^(\s)?[a-z]+\.Controller(\s)?\(/i,
    };
    var dispatchOrder = function (content) {
      var order = 'bottom';
      for (order in patterns) {
        if (content.match(patterns[order])) {
          return order;
        }
      }
      return order;
    };

    var handleComponent = function (handlerName, component, buffer) {
      var successCallback = function (component, contents) {
        // @TODO substitute with format method
        // @TODO modulize + options for wrapper
        var order = 'middle';
        switch (component.ext) {
          case 'less':
            contents = options.namespace+".Style('"+ namespace(component) +"', '"+ contents +"')";
            order = 'bottom';
            break;
          case 'jade':
            contents = options.namespace+".Template('"+ namespace(component) +"', "+ contents +")";
            order = 'top';
            break;
          case 'js':
            order = dispatchOrder(contents);
            break;
        }

        contents = "\n  // "+ order + grunt.template.process(options.template, {data: component}) + "\n" + contents;

        grunt.log.ok('Contents compiled ('+ component.src +')');
        appendBuffer(component, buffer, order, contents);
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

    var appendBuffer = function (component, buffer, order, contents) {
      buffer[component.dest] = buffer[component.dest] || {top: [], middle: [], bottom: []};

      switch (order) {
        case 'top':
        case 'bottom':
        case 'middle':
          buffer[component.dest][order].push(contents);
          break;
        default:
          buffer[component.dest]['bottom'].push(contents);
      }
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

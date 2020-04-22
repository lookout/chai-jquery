(function (chaiJquery) {
  // Module systems magic dance.
  if (typeof require === "function" && typeof exports === "object" && typeof module === "object") {
    // NodeJS
    module.exports = chaiJquery;
  } else if (typeof define === "function" && define.amd) {
    // AMD
    define(['jquery'], function ($) {
      return function (chai, utils) {
        return chaiJquery(chai, utils, $);
      };
    });
  } else {
    // Other environment (usually <script> tag): plug in to global chai instance directly.
    chai.use(function (chai, utils) {
      return chaiJquery(chai, utils, jQuery);
    });
  }
}(function (chai, utils, $) {
  var inspect = utils.inspect,
      flag = utils.flag;
  $ = $ || jQuery;

  var setPrototypeOf = '__proto__' in Object ?
    function (object, prototype) {
      object.__proto__ = prototype;
    } :
    function (object, prototype) {
      var excludeNames = /^(?:length|name|arguments|caller)$/;

      function copyProperties(dst, src) {
        Object.getOwnPropertyNames(src).forEach(function (name) {
          if (!excludeNames.test(name)) {
            Object.defineProperty(dst, name,
              Object.getOwnPropertyDescriptor(src, name));
          }
        });
      }

      copyProperties(object, prototype);
      copyProperties(object, Object.getPrototypeOf(prototype));
    };

  $.fn.inspect = function (depth) {
    var el = $('<div />').append(this.clone());
    if (depth !== undefined) {
      var children = el.children();
      while (depth-- > 0)
        children = children.children();
      children.html('...');
    }
    return el.html();
  };

  var props = {attr: 'attribute', css: 'CSS property', prop: 'property'};
  for (var prop in props) {
    (function (prop, description) {
      chai.Assertion.overwriteMethod(prop, function (_super) {
        return function (name, val) {
          var obj = flag(this, 'object');
          if (obj instanceof $) {
            var actual = obj[prop](name);

            if (!flag(this, 'negate') || undefined === val) {
              this.assert(
                  undefined !== actual
                , 'expected #{this} to have a #{exp} ' + description
                , 'expected #{this} not to have a #{exp} ' + description
                , name
              );
            }

            if (undefined !== val) {
              this.assert(
                  val === actual
                , 'expected #{this} to have a ' + inspect(name) + ' ' + description + ' with the value #{exp}, but the value was #{act}'
                , 'expected #{this} not to have a ' + inspect(name) + ' ' + description + ' with the value #{act}'
                , val
                , actual
              );
            }

            flag(this, 'object', actual);
          } else {
            _super.apply(this, arguments);
          }
        }
      });
    })(prop, props[prop]);
  }

  chai.Assertion.addMethod('data', function (name, val) {
    // Work around a chai bug (https://github.com/logicalparadox/chai/issues/16)
    if (flag(this, 'negate') && undefined !== val && undefined === flag(this, 'object').data(name)) {
      return;
    }

    var assertion = new chai.Assertion(flag(this, 'object').data());
    if (flag(this, 'negate'))
      assertion = assertion.not;
    return assertion.property(name, val);
  });

  chai.Assertion.overwriteMethod('class', function (_super) {
    return function (className) {
      var obj = flag(this, 'object');
      if (obj instanceof $) {
        this.assert(
          obj.hasClass(className)
          , 'expected #{this} to have class #{exp}'
          , 'expected #{this} not to have class #{exp}'
          , className
        );
      } else {
        _super.apply(this, arguments);
      }
    }
  });

  chai.Assertion.overwriteMethod('id', function (_super) {
    return function (id) {
      var obj = flag(this, 'object');
      if (obj instanceof $) {
        this.assert(
          obj.attr('id') === id
          , 'expected #{this} to have id #{exp}'
          , 'expected #{this} not to have id #{exp}'
          , id
        );
      } else {
        _super.apply(this, arguments);
      }
    }
  });

  chai.Assertion.overwriteMethod('html', function (_super) {
    return function (html) {
      var obj = flag(this, 'object');
      if (obj instanceof $) {
        var actual = obj.html();
        this.assert(
            actual === html
          , 'expected #{this} to have HTML #{exp}, but the HTML was #{act}'
          , 'expected #{this} not to have HTML #{exp}'
          , html
          , actual
        );
      } else {
        _super.apply(this, arguments);
      }
    }
  });

  chai.Assertion.overwriteMethod('text', function (_super) {
    return function (text) {
      var obj = flag(this, 'object');
      if (obj instanceof $) {
        var actual = obj.text();
        this.assert(
            actual === text
          , 'expected #{this} to have text #{exp}, but the text was #{act}'
          , 'expected #{this} not to have text #{exp}'
          , text
          , actual
        );
      } else {
        _super.apply(this, arguments);
      }
    }
  });

  chai.Assertion.overwriteMethod('value', function (_super) {
    return function (value) {
      var obj = flag(this, 'object');
      if (obj instanceof $) {
        var actual = obj.val();
        this.assert(
          obj.val() === value
          , 'expected #{this} to have value #{exp}, but the value was #{act}'
          , 'expected #{this} not to have value #{exp}'
          , value
          , actual
        );
      } else {
        _super.apply(this, arguments);
      }
    }
  });

  chai.Assertion.addMethod('descendants', function (selector) {
    this.assert(
        flag(this, 'object').has(selector).length > 0
      , 'expected #{this} to have #{exp}'
      , 'expected #{this} not to have #{exp}'
      , selector
    );
  });

  $.each(['visible', 'hidden'], function (i, attr) {
    chai.Assertion.overwriteProperty(attr, function (_super) {
      return function () {
        var obj = flag(this, 'object');
        if (obj instanceof $) {
          this.assert(
              obj.is(':' + attr)
            , 'expected #{this} to be ' + attr
            , 'expected #{this} not to be ' + attr);
        } else {
          _super.apply(this, arguments);
        }
      }
    });
  });

  // chai-enzyme tries to override these are methods, let it do it
  $.each(['selected', 'checked', 'enabled', 'disabled'], function (i, attr) {
    chai.Assertion.overwriteMethod(attr, function (_super) {
      return function () {
        var obj = flag(this, 'object');
        if (obj instanceof $) {
          this.assert(
              obj.is(':' + attr)
            , 'expected #{this} to be ' + attr
            , 'expected #{this} not to be ' + attr);
        } else {
          _super.apply(this, arguments);
        }
      }
    });
  });

  chai.Assertion.overwriteProperty('exist', function (_super) {
    return function () {
      var obj = flag(this, 'object');
      if (obj instanceof $) {
        this.assert(
            obj.length > 0
          , 'expected ' + inspect(obj.selector) + ' to exist'
          , 'expected ' + inspect(obj.selector) + ' not to exist');
      } else {
        _super.apply(this, arguments);
      }
    };
  });

  chai.Assertion.overwriteProperty('empty', function (_super) {
    return function () {
      var obj = flag(this, 'object');
      if (obj instanceof $) {
        this.assert(
          obj.is(':empty')
          , 'expected #{this} to be empty'
          , 'expected #{this} not to be empty');
      } else {
        _super.apply(this, arguments);
      }
    };
  });

  chai.Assertion.overwriteMethod('match', function (_super) {
    return function (selector) {
      var obj = flag(this, 'object');
      if (obj instanceof $) {
        this.assert(
            obj.is(selector)
          , 'expected #{this} to match #{exp}'
          , 'expected #{this} not to match #{exp}'
          , selector
        );
      } else {
        _super.apply(this, arguments);
      }
    }
  });

  chai.Assertion.overwriteChainableMethod('contain',
    function (_super) {
      return function (text) {
        var obj = flag(this, 'object');
        if (obj instanceof $) {
          this.assert(
              obj.is(':contains(\'' + text + '\')')
            , 'expected #{this} to contain #{exp}'
            , 'expected #{this} not to contain #{exp}'
            , text);
        } else {
          _super.apply(this, arguments);
        }
      }
    },
    function(_super) {
      return function() {
        _super.call(this);
      };
    }
  );

  chai.Assertion.addMethod('focus', function () {
    this.assert(
      // Can't use `$().is(':focus')` because of certain webkit browsers
      // see https://github.com/ariya/phantomjs/issues/10427
      flag(this, 'object').get(0) === document.activeElement
      , 'expected #{this} to have focus'
      , 'expected #{this} not to have focus');
  });
}));

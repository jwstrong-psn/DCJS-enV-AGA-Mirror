/******************************************************************************
* !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! NOTICE !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! *
* !!!!!!!!!! This file is managed through the DCJS/envision-aga !!!!!!!!!!!!! *
* !!!!!!!!!!  repository on BitBucket. Changes made directly in !!!!!!!!!!!!! *
* !!!!!!!!!!  DCAT will be overwritten periodically when new    !!!!!!!!!!!!! *
* !!!!!!!!!!  versions are pushed.                              !!!!!!!!!!!!! *
* !!!!!!!!!! If you need access to the BitBucket repository,    !!!!!!!!!!!!! *
* !!!!!!!!!!  please contact: joseph.strong@pearson.com         !!!!!!!!!!!!! *
* !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! *
******************************************************************************/


window.PearsonGL = window.PearsonGL || {};
window.PearsonGL.External = window.PearsonGL.External || {};

/*——————————————————————————————————————————————————————————————————————
 | Module: rootJS
* ——————————————————————————————————————————————————————————————————————*/
PearsonGL.External.rootJS = (function() {

  "use strict";

  var debugLog = (function(){
    if(window.debugLog) {
      return window.debugLog;
    } else {
      return function(){};
    }
  })();

  /* ←— myIsNaN —————————————————————————————————————————————————→ *\
   | replaces Number.isNaN in case of *shudder* IE
   * ←————————————————————————————————————————————————————————————————→ */
   var myIsNaN = (function(){
    if(typeof Number.isNaN !== "function") {
      return function(obj) {
        return (typeof obj === "number" && obj !== obj);
      };
    } else {
      return Number.isNaN;
    }
   })();

  /* ←— objKeys —————————————————————————————————————————————————→ *\
   | replaces Object.keys in case of *shudder* IE
   * ←————————————————————————————————————————————————————————————————→ */
   var objKeys = (function(){
    if(typeof Object.keys === "function"){
      return Object.keys;
    } else {
      // From https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/keys
      return (function () {
        var hasOwnProperty = Object.prototype.hasOwnProperty,
        hasDontEnumBug = !({toString: null}).propertyIsEnumerable('toString'),
        dontEnums = [
          'toString',
          'toLocaleString',
          'valueOf',
          'hasOwnProperty',
          'isPrototypeOf',
          'propertyIsEnumerable',
          'constructor'
        ],
        dontEnumsLength = dontEnums.length;

        return function (obj) {
          if (typeof obj !== 'object' && (typeof obj !== 'function' || obj === null)) {
            throw new TypeError('Object.keys called on non-object');
          }

          var result = [], prop, i;

          for (prop in obj) {
            if (hasOwnProperty.call(obj, prop)) {
              result.push(prop);
            }
          }

          if (hasDontEnumBug) {
            for (i = 0; i < dontEnumsLength; i++) {
              if (hasOwnProperty.call(obj, dontEnums[i])) {
                result.push(dontEnums[i]);
              }
            }
          }
          return result;
        };
      }());
    }
   })();

  /* ←— mergeObjects —————————————————————————————————————————————————→ *\
   | replaces Object.assign in case of *shudder* IE
   * ←————————————————————————————————————————————————————————————————→ */
   var mergeObjects = (function() {
    if (typeof Object.assign === "function") {
      return Object.assign;
    } else {
      return function(){
        var obj = arguments[0];

        [].forEach.call(arguments, function(arg,i) {
          var keys = [];
          if(typeof arg === "string") {
            while(keys.length < arg.length) {
              keys.push(keys.length);
            }
          } else {
            keys = objKeys(arg);
          }

          if(i > 0) {
            keys.forEach(function(key) {
              obj[key] = arg[key];
            });
          }
        });

        return obj;
      };
    }
   })();


  /* ←—PRIVATE VARIABLES———————————————————————————————————————————————————→ *\
       | Variable cache; access with vs[uniqueId].myVariable
       * ←—————————————————————————————————————————————————————————————————→ */
    var vs = {shared:{}};
    var hxs = {}; // for storing helper expressions
  /* ←—PRIVATE CONSTANTS———————————————————————————————————————————————————→ *\
       | Constants, e.g. for tolerances or LaTeX strings.
       | Access with cs.type.NAME
       * ←—————————————————————————————————————————————————————————————————————→ */
    var cs = {
      color:{
        agaColors:{ // Colors for AGA
          blue: '#0092C8',
          red: '#F15A22',
          green: '#0AB14B',
          teal: '#36C1CD',
          orange: '#EFA038',
          lime: '#95CA59',
          purple: '#812990',
          black: '#000000',
          grey: '#58595B'
        },
        HIDDEN_COLOR:'#FFFFFF'
       },
      ts:{ // Tolerances for tuning; measured in log2 increments.
        AR:0.01, // Aspect Ratio, detectably non-square
        ZOOM:0.3, // For reporting coarse changes in the zoom level
        BUFFER_BUFFER:0.01
       },
      keyword:{
        LINEAR_SLOPE_INTERCEPT_FORM:'LMB',
        LINEAR_POINT_SLOPE_FORM:'LMP',
        LINEAR_TWO_POINTS:'LPP',
        QUADRATIC_VERTEX_FORM:'QVFAHK',
        QUADRATIC_STANDARD_FORM:'QSFABC',
        QUADRATIC_FACTORED_FORM:'QFFARR',
        INTERIOR:'INTERIOR',
        EXTERIOR:'EXTERIOR',
        PERIMETER:'PERIMETER',
        expform:{ABXC:'abxc',AEBC:'aebc',EABC:'eabc',EAHK:'eahk'},
        lineType:{
          SOLID:((Desmos && Desmos.Styles)?Desmos.Styles.SOLID:'normal'),
          DASHED:((Desmos && Desmos.Styles)?Desmos.Styles.DASHED:'dashed')
        }
       },
      precision:{ // # of decimal places to round to; inverse powers of 10
        COORDINATES:2,
        DEGREES:0,
        EVAL:1,
        FLOAT_PRECISION:6
       },
      delay:{ // delay values for timed events, in ms
        SAVE:1000, // delay to save after the most recent modification
        LOAD:1000, // consider a `setState` complete once the state is static for this long
        SET_EXPRESSION:100, // consider a `setExpression` complete after this amount of time
        EXECUTE_HELPER:1000 // allow this much time for a helper function to execute before calling potential conflicts (when the function terminates earlier than this, it should cancel the delay)
       },
      distance:{
        CONSTRAIN_BUFFER:0.000001
       },
      debug:{ // various constants for debug logging
        COORDINATE_DECIMALS:2
       },
      ENUM:[]
     };
  /* ←—PRIVATE HELPER FUNCTIONS————————————————————————————————————————————→ *\
       | Subroutines; access with hs.functionName(args)
       * ←—————————————————————————————————————————————————————————————————→ */
    var hs;
    hs = {
      /* ←— flattenFuncStruct —————————————————————————————————————————————→ *\
       ↑ Turn a nested function structure into a single layer; each function's   ↑
       |  name prefixed by its parent objects, connected by underscores.         |
       |                                                                         |
       | @Arg1: a hierarchical structure containing only Functions and objects   |
       | @Arg2: (Optional) a string to prefix all function names                 |
       |                                                                         |
       | @Returns: object whose members are all references to functions          |
       ↓ @Returns: false if input contains (sub-)*members that are not functions ↓
       * ←—————————————————————————————————————————————————————————————————————→ */
       flattenFuncStruct: function flattenFuncStruct(funcStruct,prefix) {
        if(prefix === undefined) {
          prefix = '';
        }
        var functions={};
        objKeys(funcStruct).forEach(function(key){
          var item = funcStruct[key];
          if (typeof item === 'object') {
            mergeObjects(functions,flattenFuncStruct(item,prefix+key+'_'));
          } else if (typeof item === 'function') {
            functions[prefix+key] = item;
          } else {
            debugLog(prefix+key+' is not a function or object');
          }
        });
        return functions;
       },
      /* ←— parseArgs ——————————————————————————————————————————————————→ *\
       ↑ Returns a new struct merging given options with defaults for those   ↑
       | options not provided.                                                |
       |                                                                      |
       |          TODO TK STUB UPDATE WHEN MSWEB-7680 IS RESOLVED             |
       |                                                                      |
       | @Arg1: standard helper function option struct                        |
       |                                                                      |
       | @Returns: standard helper function option struct                     |
       ↓ @Returns: default options if input is empty                          ↓
       * ←—————————————————————————————————————————————————————————————————→ */
       parseArgs: function(args) {
        var arg = args[0];
        var name = args[1];
        var desmos = args[2];

        var options = {
          'value': arg,
          'name': name,
          'id': name,
          'desmos': desmos,
          'log':debugLog
        };

        if(typeof arg === 'object') {
          mergeObjects(options,arg);
        }

        if (options.desmos === undefined) {
          options.desmos = window.calculator || window.Calc;
        }

        desmos = options.desmos;

        // ENUM the widget
        var uid = cs.ENUM.indexOf(desmos);
        if(uid === -1) {
          uid = cs.ENUM.length;
          cs.ENUM.push(desmos);
        }

        // Identify the widget by its ENUM uid if it has no other identifier
        if(options.uniqueId === undefined) {
          options.uniqueId = uid;
        }

        var ouid = options.uniqueId;

        // Initialize the variable & helper cache if necessary
        vs[ouid] = vs[ouid] || {};
        hxs[ouid] = hxs[ouid] || {};

        // Link the ENUM uid to the authored Id, so the ENUM uid can always be used,
        //  even if only the authored Id is known, using the following shortcut:
        // uid = cs.ENUM.indexOf(cs.ENUM[options.uniqueId])
        cs.ENUM[ouid] = cs.ENUM[uid];
        vs[uid] = vs[ouid];
        hxs[uid] = hxs[ouid];


        if(hxs[uid].maker === undefined) {
          hxs[options.uniqueId].maker = function(expr){
            return desmos.HelperExpression.call(desmos,(typeof expr === "string" ? {latex:expr} : expr));
          };
        }
        if (window.debugLog && (window.widgetDebug === undefined || window.widgetDebug.widgets[options.uniqueId] === undefined)) {
          window.widgetDebug = window.widgetDebug || {
            vs: vs,
            hxs: hxs,
            cs: cs,
            widgets: {},
            download: function() {
              var element = document.createElement('a');
              var obj = {};
              objKeys(window.widgetDebug.widgets).forEach(function(e){
                var desmos = window.widgetDebug.widgets[e];
                obj[e] = {
                  state: desmos.getState(),
                  variables: vs[e],
                  // helpers: hxs[options.uniqueId],
                  screenshot: desmos.screenshot()
                };
              });
              element.setAttribute('href', 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(obj,null,"\t")));
              element.setAttribute('download', 'Widget Error Report '+((new Date()).toISOString())+'.json');
              element.style.display = 'none';
              document.body.appendChild(element);
              element.click();
              document.body.removeChild(element);
            }
          };
          window.widgetDebug.widgets[options.uniqueId] = desmos;
        }
        return options;
       },
      /* ←— compareJSON ——————————————————————————————————————————————————→ *\
       ↑ Traverses a pair of JSON objects, matching keys & values           ↑
       |                                                                    |
       | @input: two strings representing JSON objects                      |
       |  Note: inputs should be stringified to ensure they only contain    |
       |        valid JSON data types                                       |
       |                                                                    |
       | @Returns: true if objects' contents are identical                  |
       ↓ @Returns: false if objects' contents are not identical             ↓
       * ←————————————————————————————————————————————————————————————————→ */
       compareJSON: function compareJSON(stringified1,stringified2) {

        if (typeof stringified1 !== "string" || typeof stringified2 !== "string") {
          throw new Error("compareJSON requires string input");
        }

        var obj1 = JSON.parse(stringified1);
        var obj2 = JSON.parse(stringified2);

        if(obj1 === obj2) {
          return true;
        }

        if(!(obj1 instanceof Object) || !(obj2 instanceof Object)) {
          return false;
        }

        var compare = function compare(x,y) {
          var xKeys;
          var yKeys;
          var ret;
          var type = typeof x;
          if(type === "string" ||
             type === "boolean" ||
             type === "undefined" ||
             type === "number" ||
             x === "null") {
            if (x === y) {
              // debugLog(type,x,"===",y);
              return true;
            } else {
              // debugLog(type,x,"!==",y);
              return false;
            }
          } else if(Array.isArray(x)) {
            // debugLog("Comparing Array:",x);
            if(Array.isArray(y) && x.length === y.length) {
              // debugLog("to Array:",y);
              ret = x.every(function(e,i) {
                return compare(e,y[i]);
              });
              // debugLog(x,(ret ? "==" : "!="),y);
              return ret;
            } else {
              // debugLog("!==",y);
              return false;
            }
          } else {
            xKeys = objKeys(x);
            yKeys = objKeys(y);
            // debugLog("Comparing Object:",x);
            ret = (xKeys.length === yKeys.length) && xKeys.every(function(k) {
              return (yKeys.indexOf(k) !== -1);
            });
            if(!ret) {
              // debugLog("Does not match Object with keys:",yKeys);
              return false;
            }
            // debugLog("to Object:",y);
            ret = xKeys.every(function(k) {
              var ret;
              // debugLog("Key \"",k,"\":");
              ret = compare(x[k],y[k]);
              // debugLog("Key \"",k,(ret ? "\" matches." : "\" does not match."));
              return ret;
            });
            // debugLog(x,(ret ? "==" : "!="),y);
            return ret;
          }
        };

        return compare(obj1,obj2);

       },
      /* ←— latexToText ———————————————————————————————————————————————————————→ *\
       ↑ Convert a latex string to a plaintext string, e.g. for labels
       ↓
       * ←—————————————————————————————————————————————————————————————————————→ */
       latexToText: function(expr){
        expr = (''+expr).
          replace(new RegExp('\\\\cdot\\s?','g'),'\u22c5').
          replace(new RegExp('._\\{([a-zA-Z])Var\\}','g'),'$1').
          replace(new RegExp('([+=÷×\\u22c5])','g'),' $1 ').
          replace(new RegExp(',','g'),',\u202f').
          replace(new RegExp('\\^2','g'),'²').
          replace(new RegExp('\\^3','g'),'³').
          replace(new RegExp('\\\\sqrt\\{([^{}]*?)\\}','g'),'√($1)').
          replace(new RegExp('\\\\theta\\s?','g'),'θ').
          replace(new RegExp('\\\\pi\\s?','g'),'π').
          replace(new RegExp('_0','g'),'₀').
          replace(new RegExp('_1','g'),'₁').
          replace(new RegExp('_2','g'),'₂').
          replace(new RegExp('\\\\(?:right|left)\\\\*([()\\[\\]|{}])','g'),'$1').
          replace(new RegExp('\\\\right','g'),'').
          replace(new RegExp('\\\\left','g'),'').
          replace(new RegExp('([^\\s \\u202f(\\[{|])\\-|(\\|[^|]*\\|)-(?=\\|)','g'),'$1$2 − ').
          replace(new RegExp('\\-','g'),'−');
        return expr;
       },
      /* ←— mirrorExpressions —————————————————————————————————————————————————→ *\
       ↑ Apply an expression list exactly to a target Desmos
       ↓
       * ←—————————————————————————————————————————————————————————————————————→ */
       mirrorExpressions: function(exprs,desmos){
        exprs = Array.from(exprs);
        var ids = exprs.map(function(e) {
          return e.id;
        });
        var list = desmos.getExpressions();
        var rem = [];

        list.forEach(function(e){
          var i = ids.indexOf(e.id);
          if(i === -1) {
            rem.push({id:e.id});
          } else {
            // Don't overwrite expressions unnecessarily.
            if(hs.compareJSON(JSON.stringify(e),JSON.stringify(exprs[i]))) {
              exprs.splice(i,1);
              ids.splice(i,1);
            }
          }
        });

        debugLog("Overwriting:",list);
        debugLog("Removing:",rem);
        debugLog("Adding/Updating:",exprs);

        desmos.removeExpressions(rem);
        desmos.setExpressions(exprs);
       },
      /* ←— keyedExprList ———————————————————————————————————————————————————————→ *\
       ↑ Convert an array of Expressions to an object, with Expressions keyed by |
       |  their respective ids                                                   |
       ↓                                                                         |
       * ←—————————————————————————————————————————————————————————————————————→ */
       keyedExprList: function(exprs){
        var keyed = {};
        exprs.forEach(function(e){
          // TEMP fix the stupid sliderBounds bug while it's still a problem (pre-1.1)
          if(e.sliderBounds) {
            e.sliderBounds.min = String(e.sliderBounds.min);
            e.sliderBounds.max = String(e.sliderBounds.max);
            e.sliderBounds.step = String(e.sliderBounds.step);
          }
          if(e.latex !== "") {
            keyed[e.id] = e;
          }
        });
        return keyed;
       },
      /* ←— Distance From Point to Line ——————————————————————————————————→ *\
       | Compute the distance from a point to a line
       |
       | Point given as object with {x:_,y:_}
       | Line given as object with {a:_,b:_,c:_} with ax + by + c = 0
       | Value is signed based on orientation of the line.
       * ←————————————————————————————————————————————————————————————————→ */
       distancePointLine: function(point, line) {
        return (point.x*line.a+point.y*line.b+line.c)/Math.sqrt(line.a*line.a+line.b*line.b);
       },
      /* ←— Line through two points ——————————————————————————————————————→ *\
       | Compute the distance from a point to a line
       |
       | Points given as object with {x:_,y:_}
       | Line returned is oriented counter-clockwise, such that a point to
       |  the left of the second point from the perspective of the first is
       |  on a "higher" contour, and a point to the right is lower.
       | The coefficients are normalized.
       | Output: {a:_,b:_,c:_} in ax+by+c=0
       * ←————————————————————————————————————————————————————————————————→ */
       lineTwoPoints: function(point1, point2) {
        var line = {
          a:point1.y-point2.y,
          b:point2.x-point1.x,
          c:point1.x*point2.y-point1.y*point2.x
        };

        var magnitude = Math.sqrt(line.a*line.a+line.b*line.b);

        line.a = line.a/magnitude;
        line.b = line.b/magnitude;
        line.c = line.c/magnitude;

        return line;
       },
      /* ←— Project a point onto a line ——————————————————————————————————→ *\
       | Returns the intersection of a line with the perpendicular
       | through a given point.
       | Line in {a,b,c} ax+by+c=0 and point in {x,y}
       * ←————————————————————————————————————————————————————————————————→ */
       projectPointLine: function(point, line) {
        return hs.intersectLines(line,hs.perpendicular(line, point));
       },
      /* ←— Perpendicular to a line through a point ——————————————————————→ *\
       | Returns the line perpendicular to a given line through a given point.
       | Line in {a,b,c} ax+by+c=0 and point in {x,y}
       * ←————————————————————————————————————————————————————————————————→ */
       perpendicular: function(line, point) {
        return {a:line.b,b:-line.a,c:line.a*point.y-line.b*point.x};
       },
      /* ←— polygonConstrain —————————————————————————————————————————————→ *\
       | Constrain a point to a convex polygon.
       |
       | Point {x,y}, and an arbitrary number of lines [{a,b,c},…].
       | Polygon is defined by the set of all points a nonnegative distance from
       | all edges.
       | Point returned will be the closest point inside the polygon.
       | Optional buffer distance places the returned point inside the polygon.
       | If the point is already inside the buffer zone, returns the point object
       |  itself. Otherwise, returns a new point object.
       | Returns null if there are no points inside the buffered polygon
       * ←————————————————————————————————————————————————————————————————→ */
       polygonConstrain: function(point, lines, buffer) {

        buffer = buffer || cs.distance.CONSTRAIN_BUFFER;

        function viable(testPoint) {
          if (testPoint === null) {return false;}
          var i;
          for (i=0;i<lines.length;i+=1) {
            if (hs.distancePointLine(testPoint,lines[i])<buffer) {
              return false;
            }
          }
          return true;
        }

        if (viable(point)) {
          debugLog('Point viable:',point);
          return point;
        }

        var buffered = [];
        var bufferedLine;
        var projected;
        var i;

        for (i=0;i<lines.length;i+=1) {
          bufferedLine = {a:lines[i].a,b:lines[i].b,c:lines[i].c-buffer*Math.pow(2,cs.ts.BUFFER_BUFFER)}; // Overcompensate to guarantee success
          if (hs.distancePointLine(point,lines[i])<buffer) {
            // For a convex polygon, if projecting to a crossed boundary results in a valid point, then that point is definitely the closest.
            projected = hs.projectPointLine(point,bufferedLine);
            if (viable(projected)) {
              return projected;
            }
          }
          // Otherwise, all lines need to be considered to account for acute angles, where projecting may cross from inside one boundary to outside it.
          buffered.push(bufferedLine);
        }

        // If projecting to an edge doesn't work, find the closest vertex of the polygon.
        var constrained = null;
        var j;
        var intersected;

        for (i=0;i<buffered.length;i+=1) {
          for (j=(i+1);j<buffered.length;j+=1) {
            intersected = hs.intersectLines(buffered[i],buffered[j]);
            if (viable(intersected)) {
              if (constrained === null || (
                (Math.pow(intersected.x-point.x,2) +
                  Math.pow(intersected.y-point.y,2)) <
                (Math.pow(constrained.x-point.x,2) +
                  Math.pow(constrained.y-point.y,2))
              )) {
                constrained = {x:intersected.x,y:intersected.y};
              }
            }
          }
        }
        return constrained;
       },
      /* ←— circleConstrain —————————————————————————————————————————————→ *\
       | Constrain a point to the a circle.
       |
       | Point {x,y}, circle {x,y,r}, and side cs.keyword.INTERIOR, EXTERIOR, or PERIMETER.
       |
       | Point returned will be the closest point inside, outside, or on the circle.
       |
       | Optional buffer distance shrinks (or expands) the acceptable circle region
       | If the point is already inside the buffer zone, returns the point object
       |  itself. Otherwise, returns a new point object.
       | Returns null if there are no points inside the buffered polygon
       * ←————————————————————————————————————————————————————————————————→ */
       circleConstrain: function(point, circle, side, buffer) {

        if(side === undefined) {
          side = cs.keyword.PERIMETER;
        }
        if(buffer === undefined) {
          buffer = cs.distance.CONSTRAIN_BUFFER;
        }

        var dSquared = Math.pow(point.x-circle.x,2)+Math.pow(point.y-circle.y,2);
        var scaleBack;

        switch (side) {
          case cs.keyword.PERIMETER:
            if (
              (buffer > 0) &&
              (Math.pow(circle.r-buffer,2) < dSquared &&
                dSquared < Math.pow(circle.r+buffer,2))
            ) {
              return point;
            }
            scaleBack = circle.r;
            break;
          case cs.keyword.INTERIOR:
            if (dSquared < Math.pow(circle.r-buffer,2)) {
              return point;
            }
            scaleBack = circle.r-buffer*Math.pow(2,cs.ts.BUFFER_BUFFER);
            break;
          case cs.keyword.EXTERIOR:
            if (dSquared > Math.pow(circle.r+buffer,2)) {
              return point;
            }
            scaleBack = circle.r+buffer*Math.pow(2,cs.ts.BUFFER_BUFFER);
            break;
          default:
            return null;
        }

        if (scaleBack < 0) {
          debugLog('Negative circle constraint '+scaleBack);
          return null;
        }

        if(dSquared !== 0) {scaleBack /= Math.sqrt(dSquared);}
        else {scaleBack = 0;}

        return {
          x:(hs.number(circle.x+(point.x-circle.x)*scaleBack)),
          y:(hs.number(circle.y+(point.y-circle.y)*scaleBack))
        };
       },
      /* ←— Intersect Two Lines ——————————————————————————————————————————→ *\
       | Find the point of intersection between two lines
       |
       | Lines given as object with {a:_,b:_,c:_} with ax + by + c = 0
       | Point given as object with {x:_,y:_}
       * ←————————————————————————————————————————————————————————————————→ */
       intersectLines: function(line1, line2) {
        var x = line1.b*line2.c-line2.b*line1.c;
        var y = line2.a*line1.c-line1.a*line2.c;
        var z = line1.a*line2.b-line2.a*line1.b;

        return {
          x:x/z,
          y:y/z
        };
       },
      /* ←— number to letter (lowercase) —————————————————————————————————→ *\
       | Convert a number to its lowercase letter with cs.alpha[n]`
       * ←————————————————————————————————————————————————————————————————→ */
       alpha:(function(){
          var alphabet = '_abcdefghijklmnopqrstuvwxyz';
          var func = function(x){
            return alphabet[x];
          };
          mergeObjects(func,alphabet);
          return func;
        }()),
      /* ←— number to letter (uppercase) —————————————————————————————————→ *\
       | Convert a number to its uppercase letter with `cs.ALPHA[n]`
       * ←————————————————————————————————————————————————————————————————→ */
       ALPHA:(function(){
          var alphabet = '_ABCDEFGHIJKLMNOPQRSTUVWXYZ';
          var func = function(x){
            return alphabet[x];
          };
          mergeObjects(func,alphabet);
          return func;
        }()),
      /* ←— subscript ————————————————————————————————————————————————————→ *\
       | Given a variable and an index, return the latex-subscripted variable
       |  e.g. x_11 becomes x_{11}
       | Variable name must be an atomic string
       * ←————————————————————————————————————————————————————————————————→ */
       sub:function(v,i) {
        return v+'_'+((String(i).length>1)?"{"+i+"}":i);
       },
      /* ←— number ————————————————————————————————————————————————————→ *\
       | Rounds a value to acceptable precision (# of decimal places)
       * ←————————————————————————————————————————————————————————————————→ */
       number:function(val,precision) {
        if(precision === undefined) {
          precision = cs.precision.FLOAT_PRECISION;
        }
        return Math.round(Math.pow(10,precision)*val)/Math.pow(10,precision);
       },
      /* ←— roundSum ————————————-————————————————————————————————————————→ *\
       | Rounds values in an array so their integer sum is exact
       |    vals is an array of values
       |    target is the target sum; must be an integer
       |    values will first be rounded to 1 decimal place
       * ←————————————————————————————————————————————————————————————————→ */
       roundSum:function(vals,target) {
        var newVals = Array.from(vals);

        function addRound(acc,e){
          return Math.round(acc) + Math.round(e);
        }

        function roundLowestDown(arr) {
          arr = Array.from(arr);
          var idx = arr.reduce(function(acc,e,i,a){
            if ((e + 0.5) % 1 < (a[acc] + 0.5) % 1) {
              return i;
            } else {
              return acc;
            }
          },0);
          if (arr[idx] % 1 >= 0.5) {
            arr[idx] = Math.floor(arr[idx]);
          } else {
            arr[idx] = Math.floor(arr[idx] - 1);
          }
          return arr;
        }

        var newSum = newVals.reduce(addRound);

        while (newSum !== target) {
          // debugLog("Sum "+newSum+" does not match target "+target);
          if (newSum < target) {
            newVals = newVals.map(function(e){
              return -e;
            });
          }
          newVals = roundLowestDown(newVals);
          if (newSum < target) {
            newVals = newVals.map(function(e){
              return -e;
            });
          }
          // debugLog("New array: "+newVals);
          newSum = newVals.reduce(addRound);
        }

        return newVals.map(function(e){
          return Math.round(e);
        });
       }
     };

  /* ←— EXPORTS / PUBLIC FUNCTIONS ————————————————————————————————————————→ *\
       |
       | To declare your function
       | exports.myFunc1 = function() {};
       |
       | OR
       | fs.myCategory2 = {myFunc2: function() {}}
       | fs[myCategory3] = fs[myCategory3] || {};
       | fs.myCategory3.myFunc3 = function() {};
       |
       | The Desmos gadget can be authored to use helper expressions which call custom JavaScript
       | when observed variables are updated. For example, if a Desmos graph were authored to show
       | a parabola "y=a(x-h)^2+k" a helper expression with Observed Variable "h" and JavaScript
       | Function Name "reflectParabola" would cause the below function to run whenever h was
       | updated and would draw another parabola reflected across the x axis.
       |
       | NOTE: (val, name, desmos) will be deprecated in favour of:
       |       options={value,name,desmos,uniqueId}
       |
       | exports.reflectParabola = function(val, name, desmos) {
       |  if (o.log) {log(name + " was updated to " + val);}
       |  desmos.setExpression({id: "reflected", latex: "y=-a(x-" + val + ")^2-k", color: "#00AA00"});
       | };
       |
       | The three values passed in to the CJS function are the variable's new value, the
       | name of the variable, and a reference to the Desmos object.
       |
       | Note that console logging should only be used for debugging and is not
       | recommended for production.
       * ←—————————————————————————————————————————————————————————————————→ */
   var exports = {}; // This object is used to export public functions/variables
   var fs = {shared:{}}; // Function structure; define with fs[WIDGET_ID].myFunction()
  
    /* ←— SHARED INITIALIZATION FUNCTIONS —————————————————————————————————→ */
     fs.shared.init = {
      /* ←— observeZoom ———————————————————————————————————————————————————→ *\
       | Keeps track of the zoom level by monitoring graph state
       | Zoom level is saved to variables "x_{pxScale}" and "y_{pxScale}"
       | Values are Units/Pixel, to optimise for scaling images onto the graph
       |  e.g. size: 1024*x_{pxScale} × 768*y_{pxScale}.
       |
       | EXPRESSIONS MUST BE MANUALLY AUTHORED USING API:
       |  calculator.setExpression({id:'x_pxScale',latex:'x_{pxScale}'});
       |  calculator.setExpression({id:'y_pxScale',latex:'y_{pxScale}'});
       |
       | For testing, use option {log:console.log}, which will log whenever
       |  the scale or aspect ratio changes by a significant amount.
       * ←———————————————————————————————————————————————————————————————————→ */
       observeZoom: function(){
        var o = hs.parseArgs(arguments);

        if (o.log) {
          o.log('observeZoom activated with '+JSON.stringify(mergeObjects({},o,{'desmos':'l'})));
        }

        var v = vs[o.uniqueId];

        // Static variables keep track of the last logged settings.
        v.pixelCoordinates = o.desmos.graphpaperBounds.pixelCoordinates;
        v.mathCoordinates = o.desmos.graphpaperBounds.mathCoordinates;
        v.scale = {x: v.pixelCoordinates.width/v.mathCoordinates.width, y: v.pixelCoordinates.height/v.mathCoordinates.height};

        // Initialize the expressions
        o.desmos.setExpression({id:'x_pxScale',latex:'x_{pxScale}='+1/v.scale.x});
        o.desmos.setExpression({id:'y_pxScale',latex:'y_{pxScale}='+1/v.scale.y});

        // Update whenever the bounds change.
        o.desmos.observe('graphpaperBounds', function() {
          var newPxCoords = o.desmos.graphpaperBounds.pixelCoordinates;
          var newMthCoords = o.desmos.graphpaperBounds.mathCoordinates;
          var newScale = {x: newPxCoords.width/newMthCoords.width, y: newPxCoords.height/newMthCoords.height};

          // log changes in Aspect Ratio
          if (Math.abs(Math.log2(newScale.x/newScale.y)-Math.log2(v.scale.x/v.scale.y))>cs.ts.ZOOM) {
            if (o.log) {o.log('Aspect Ratio Change: '+Math.round(100*v.scale.x/v.scale.y)/100+' to '+Math.round(100*newScale.x/newScale.y)/100+'.');}

            v.pixelCoordinates = newPxCoords;
            v.mathCoordinates = newMthCoords;
            v.scale = newScale;
          }

          // log changes in Scale
          // note: changes in y-scale alone should be captured by changes in Aspect Ratio
          if (Math.abs(Math.log2(newScale.x)-Math.log2(v.scale.x))>cs.ts.ZOOM) {
            if (o.log) {o.log('Scale Change: '+
              Math.round(10*v.scale.x)/10+
              // Only log previous x and y scale separately if the aspect ratio was not square
              (Math.abs(Math.log2(v.scale.x)-Math.log2(v.scale.y))>cs.ts.AR ? 'px/unit by '+Math.round(10*v.scale.y)/10 : '')+
              'px/unit to '+Math.round(10*newScale.x)/10+
              // Only log new x and y scale separately if the aspect ratio is not square
              (Math.abs(Math.log2(newScale.x)-Math.log2(newScale.y))>cs.ts.AR ? 'px/unit by '+Math.round(10*newScale.y)/10 : '')+
              'px/unit');}

            v.pixelCoordinates = newPxCoords;
            v.mathCoordinates = newMthCoords;
            v.scale = newScale;
          }

          o.desmos.setExpression({id:'x_pxScale',latex:'x_{pxScale}='+1/newScale.x});
          o.desmos.setExpression({id:'y_pxScale',latex:'y_{pxScale}='+1/newScale.y});

        });
       },
      /* ←— observeBounds ———————————————————————————————————————————————————→ *\
       | Keeps track of the edges of the Desmos Gadget, in the following vars
       |
       | EXPRESSIONS MUST BE MANUALLY AUTHORED USING API:
       |  o.desmos.setExpressions([
       |    {id:'leftBound',   latex:'x_{leftBound}'   },
       |    {id:'rightBound',  latex:'x_{rightBound}'  },
       |    {id:'topBound',    latex:'y_{topBound}'    },
       |    {id:'bottomBound', latex:'y_{bottomBound}' }
       |  ]);
       * ←———————————————————————————————————————————————————————————————————→ */
       observeBounds: function(){
        var o = hs.parseArgs(arguments);
        var vars = vs[o.uniqueId];

        o.log('observeBounds activated on '+o.uniqueId);

        function updateBounds(t,h) {
          vars.mathBounds = h[t].mathCoordinates;
          vars.pixelFrame = h[t].pixelCoordinates;

          var bounds = vars.mathBounds;

          o.desmos.setExpressions([
            {
              id:'leftBound',
              latex:'x_{leftBound}='+bounds.left
            },
            {
              id:'rightBound',
              latex:'x_{rightBound}='+bounds.right
            },
            {
              id:'topBound',
              latex:'y_{topBound}='+bounds.top
            },
            {
              id:'bottomBound',
              latex:'y_{bottomBound}='+bounds.bottom
            }
          ]);
        }

        o.desmos.observe('graphpaperBounds.observeBounds', updateBounds);

        updateBounds('graphpaperBounds',o.desmos);
       }
     };
    /* ←— SHARED LABEL FUNCTIONS ——————————————————————————————————————————→ */
     fs.shared.label = {
      /* ←— valueOnly —————————————————————————————————————————————————————→ *\
       | Label a point according to the value of an expression.
       | Use for labeling anonymous sliders, or e.g. side lengths.
       |
       | POINT MUST FIRST BE MANUALLY AUTHORED USING API:
       |  calculator.setExpression({
       |    id:'[expressionLaTeX]',
       |    latex:'[pointLaTeX]',
       |    showLabel:true
       |  });
       * ←————————————————————————————————————————————————————————————————→ */
       valueOnly: function(){
        var o = hs.parseArgs(arguments);
        o.desmos.setExpression({id:o.name,label:hs.latexToText(o.value)});
       },
      /* ←— labelAngle ——————————————————————————————————————————————————→ *\
       | Label a point according to the value of an expression, with degree marker
       | Use for labeling anonymous sliders or e.g. angle vertices.
       |
       | POINT MUST FIRST BE MANUALLY AUTHORED USING API:
       |  calculator.setExpression({
       |    id:'[expressionLaTeX]',
       |    latex:'[pointLaTeX]',
       |    showLabel:true
       |  });
       * ←————————————————————————————————————————————————————————————————→ */
       labelAngle: function(){
        var o = hs.parseArgs(arguments);
        o.desmos.setExpression({id:o.name,label:hs.latexToText(o.value)+'°'});
       },
      /* ←— labelPoint ———————→———————————————————————————————————————————→ *\
       | Label a point according to its coordinates and name
       | e.g., "P(3,2)"
       |
       | POINT MUST FIRST BE MANUALLY AUTHORED USING API:
       |  calculator.setExpression({
       |    id:'[unique name]',
       |    latex:'[pointLaTeX]',
       |    showLabel:true
       |  });
       |
       | For testing, use option {log:console.log}, which will log whenever
       |  the expression's value changes.
       * ←————————————————————————————————————————————————————————————————→ */
       labelPoint: function(xVal, yVal, name, id, options, precision) {
        if(precision === undefined) {
          precision = cs.precision.COORDINATES;
        }
        var o = hs.parseArgs([(options || {})]);
        var expr = name+'('+
          ((xVal<0)?'−':'')+
          Math.abs(Math.round(Math.pow(10,precision)*xVal)/Math.pow(10,precision))+
          ',\u202f'+
          ((yVal<0)?'−':'')+
          Math.abs(Math.round(Math.pow(10,precision)*yVal)/Math.pow(10,precision))+
          ')';
        if (o.log) {o.log('Setting point label ' + expr);}
        o.desmos.setExpression({id:id,label:expr});
       },
      /* ←— labelEquation ———————————————————————————————————————————————→ *\
       | Label a point according to an equation with an expression equal to
       | its value.
       | Use for labeling anonymous sliders.
       |
       | POINT MUST FIRST BE MANUALLY AUTHORED USING API:
       |  calculator.setExpression({
       |    id:'[expressionLaTeX]',
       |    latex:'[pointLaTeX]',
       |    showLabel:true
       |  });
       |
       | For testing, use option {log:console.log}, which will log whenever
       |  the expression's value changes.
       * ←————————————————————————————————————————————————————————————————→ */
       labelEquation: function() {
        var prec = cs.precision.EVAL;
        var o = hs.parseArgs(arguments);
        var expr = hs.latexToText(o.name+'='+Math.round(o.value*Math.pow(10,prec))/Math.pow(10,prec));
        o.log('Setting point label ' + expr);
        o.desmos.setExpression({id:o.name,label:expr});
       },
      /* ←— labelTriAngles ——————————————————————————————————————————————————→ *\
       | Updates the labels of the triangle's vertices with their respective
       | angle measures. Defaults to triangle ABC.
       | Execute when observing each angle's measure, with options.value that measure.
       | prec is the number of decimal places to round to.
       |   !REQUIRES Initializing vs[o.uniqueId] with:
       |             ('triAngle'+pointNames.A+pointNames.B+pointNames.C): {
       |               prevError:0,
       |               (pointNames.A):0,
       |               (pointNames.B):0,
       |               (pointNames.C):0
       |             }
       |   !REQUIRES Angle points to be labeled have ids 'point'+pointNames.A, etc.
       |   !REQUIRES options.name end in pointNames.A, etc.
       |   !REQUIRES options.value be the angle's value, in Radians.
       * ←———————————————————————————————————————————————————————————————————→ */
       labelTriAngles: function(options,pointNames,prec) {
        if(!pointNames || !pointNames.A || !pointNames.B || !pointNames.C) {
          pointNames = {A:'A',B:'B',C:'C'};
        }
        if(typeof prec !== "number") {
          prec = cs.precision.DEGREES;
        }
        var o = hs.parseArgs(arguments); // hs.parseArgs.apply(this,[(options || {})]);
        var A = pointNames.A;
        var B = pointNames.B;
        var C = pointNames.C;
        var vertex = o.name[o.name.length-1];
        var val = Math.round(180*o.value/Math.PI*Math.pow(10,prec))/Math.pow(10,prec);
        var vars = vs[o.uniqueId]['triAngle'+A+B+C];
        var oldVal = vars[vertex];

        if (vars.upToDate === undefined) {o.log('Labeling angles of △'+A+B+C+' to '+prec+' decimal places.');}

        // Only update stuff if the one of the values has changed
        if (vars.upToDate === true && val === oldVal) {return;}

        // Calculate the value it should have to match the other two angles
        var calculated;
        switch (vertex) {
          case A:
            calculated = 180-(vars[B]+vars[C]);
            break;
          case B:
            calculated = 180-(vars[A]+vars[C]);
            break;
          default:
            calculated = 180-(vars[A]+vars[B]);
        }

        // If all is gravy, update the labels to match.
        if (val === calculated) {
          vars[vertex] = val;
          o.desmos.setExpression({id:'point'+A,label:('m∠'+A+' = '+vars[A]/*+'°'*/)});
          o.desmos.setExpression({id:'point'+B,label:('m∠'+B+' = '+vars[B]/*+'°'*/)});
          o.desmos.setExpression({id:'point'+C,label:('m∠'+C+' = '+vars[C]/*+'°'*/)});
          vars.upToDate = true;
        } else {
          // If this angle is closer to its (re-)calculated value than the last one was, correct this one and let the others keep their original values.
          var newErr = Math.abs(180*o.value/Math.PI-calculated);
          if (newErr < vars.prevError && newErr < 1) {
            // Note: <1 makes rounding floor or ceiling only; if there is a spin where the error
            //       is always > 1, something has gone seriously wrong.
            // correct this one and update the 3 labels
            val = Math.round(calculated*Math.pow(10,prec))/Math.pow(10,prec);
            vars[vertex] = val;
            o.desmos.setExpression({id:'point'+A,label:('m∠'+A+' = '+vars[A]/*+'°'*/)});
            o.desmos.setExpression({id:'point'+B,label:('m∠'+B+' = '+vars[B]/*+'°'*/)});
            o.desmos.setExpression({id:'point'+C,label:('m∠'+C+' = '+vars[C]/*+'°'*/)});
            vars.prevError = newErr;
            vars.upToDate = true;
          } else {
            // If the other angles are closer, this one should keep its given value, and will be updated
            // when the closer angles' measures are next polled.
            vars[vertex] = val;
            vars.prevError = newErr;
            vars.upToDate = false;
          }
        }
       },
      /* ←— labelPolyAngles —————————————————————————————————————————————————→ *\
       | Updates the labels of a polygon's vertices with their respective
       | angle measures, to ensure they sum to 180n-360. Defaults to polygon ABCD…
       | Execute when observing each angle's measure, with options.value that measure.
       | prec is the number of decimal places to round to.
       |   !REQUIRES Initializing vs[o.uniqueId] with:
       |              polygonName:('polygon'+pointNames.A+pointNames.B+…),
       |             (polygonName+'_angles'): {
       |               (pointNames.A):0,
       |               (pointNames.B):0,
       |               …
       |             }
       |   !REQUIRES Angle measure label points have ids matching name of their measures
       |             e.g., 'm_A', 'm_B', etc.
       |   !REQUIRES Angle measures to be stored using `value_P`
       |   !REQUIRES options.name end in pointNames.A, etc.
       |   !REQUIRES options.value be the angle's value, in degrees.
       * ←———————————————————————————————————————————————————————————————————→ */
       labelPolyAngles: function(options,params,prec) {
        if(params === undefined) {
          params = {};
        }
        if(prec === undefined) {
          prec = cs.precision.DEGREES;
        }
        var o = hs.parseArgs([(options || {})]);
        var ps = mergeObjects({refreshAll:false,exterior:false},params);
        var v = o.name[o.name.length-1];
        var vars = vs[o.uniqueId];
        var p = vars[vars.polygonName+'_angles'];
        var vertices = vars.polygonName.slice(7,vars.polygonName.length).split('');
        var apparentSum;
        var prevError;
        var nextError;
        var errors;
        var vals;
        var pos;
        var sorted = [];
        var thisError;
        var thatError;
        var i;

        function measure(x) {return (Math.pow(10,prec)*vars['P_'+x]);}

        if (ps.refreshAll) {
          // Sort the points by the error they produce (larger error closer to ends).
          vertices.forEach(function(name) {
            // Delay if the value hasn't been reported yet.
            if (measure(name) === undefined || myIsNaN(measure(name))) {
              o.log('Angles of '+vars.polygonName+' not all defined. Delaying full refresh by '+cs.delay.SET_EXPRESSION+'ms');
              setTimeout(function(){
                fs.shared.label.labelPolyAngles(o,mergeObjects({},ps,{refreshAll:true}),prec);
              },cs.delay.LOAD);
              return;
            }

            thisError = Math.round(Math.pow(10,cs.precision.FLOAT_PRECISION)*(Math.round(measure(name))-measure(name)))/Math.pow(10,cs.precision.FLOAT_PRECISION);

            for (i = 0;i<=sorted.length;i+=1) {
              thatError = Math.round(Math.pow(10,cs.precision.FLOAT_PRECISION)*(Math.round(measure(sorted[i]))-measure(sorted[i])))/Math.pow(10,cs.precision.FLOAT_PRECISION);
              if(thisError >= thatError) {
                // If the errors are the same, then prioritise the smaller relative error
                if (thisError === thatError) {
                  if (measure(name) === measure(sorted[i])) {
                    if (2*Math.random()>1) {
                      i+=1;
                    }
                  }
                  else if (((measure(name) < measure(sorted[i])) && (thisError > 0)) ||
                           ((measure(name) >= measure(sorted[i])) && (thisError <= 0))) { // IFF
                    i+=1;
                  }
                }
                sorted.splice(i,0,name);
                break;
              }
            }
          });

          var desiredSum = 180*(vertices.length-2)*Math.pow(10,prec);
          apparentSum = 0;
          var rounded;
          vertices.forEach(function(name){
            rounded = Math.round(measure(name));
            p[name] = rounded;
            apparentSum += rounded;
          });

          o.log('Measured angles:',mergeObjects({},p));

          // Points with the largest error introduce the least error when rounded oppositely
          // So, re-round points with the largest error to get the sum you want (but each one only once)
          var adjusting;
          while (apparentSum > desiredSum && sorted.length>1) {
            adjusting = sorted.shift();
            o.log('Apparent sum of '+apparentSum+' too high; reducing value of angle '+adjusting+' by 1.');
            p[adjusting]-=1;
            apparentSum-=1;
          }
          while (apparentSum < desiredSum && sorted.length>1) {
            adjusting = sorted.pop();
            o.log('Apparent sum of '+apparentSum+' too low; increasing value of angle '+adjusting+' by 1.');
            p[adjusting]+=1;
            apparentSum+=1;
          }
          if (sorted.length < 1) {o.log('Something went wrong trying to fix the angle lengths. Wound up with angle sum of '+apparentSum+' out of '+desiredSum+'. With angle measures:',p);}
          else {
            vertices.forEach(function(name){
              o.desmos.setExpression({id:'m_'+name,label:''+(((ps.exterior)?180*Math.pow(10,prec)-p[name]:p[name])/Math.pow(10,prec))+'°'});
              vars.upToDate = true;
            });
          }

          o.log('Corrected angles:',mergeObjects({},p));

          return;
         }

        if (vertices.indexOf(v) === -1) {
          o.log('Unable to label angle '+v+' of '+vars.polygonName);
          return;
        }

        if (vars.upToDate !== true) {o.log('Labeling angles of '+vars.polygonName+' to '+prec+' decimal places.');}

        var prev = vertices[(vertices.indexOf(v)+vertices.length-1)%vertices.length];
        var next = vertices[(vertices.indexOf(v)+1)%vertices.length];

        var prevVal = Math.round(measure(prev));
        var val = Math.round(measure(v));
        var nextVal = Math.round(measure(next));
        
        if (myIsNaN(prevVal) || myIsNaN(nextVal) || myIsNaN(val)) {
          o.log('Angles of vertices '+prev+', '+v+', and '+next+' not all defined. Refreshing polygon '+vars.polygonName+' in '+cs.delay.SET_EXPRESSION+'ms');
          setTimeout(function(){fs.shared.label.labelPolyAngles(o,mergeObjects({},ps,{refreshAll:true}),prec);},cs.delay.SET_EXPRESSION*300);
          return;
        }

        // Only update stuff if the one of the values has changed
        if (vars.upToDate === true && val === p[v] && prevVal === p[prev] && nextVal === p[next]) {return;}

        // The apparent sum of the three affected angles shouldn't change, else other angles will have to change.
        var expectedSum = p[prev] + p[v] + p[next];
        apparentSum = prevVal + val + nextVal;

        while (apparentSum > expectedSum) {
          prevError = prevVal - measure(prev);
          thisError = val - measure(v);
          nextError = nextVal - measure(next);

          errors = [prevError,thisError,nextError];
          vals = [prevVal,val,nextVal];

          pos = errors.indexOf(Math.max.apply(null,errors));

          o.log('Angle sum '+apparentSum+'° too large for expected sum of '+expectedSum+'°; decreasing '+vals[pos]+' from '+vals[pos]+'.');

          if (pos === 0) {prevVal-=1;}
          else if (pos === 1) {val-=1;}
          else {nextVal-=1;}

          apparentSum-=1;
        }
        while (apparentSum < expectedSum) {
          prevError = prevVal - measure(prev);
          thisError = val - measure(v);
          nextError = nextVal - measure(next);

          errors = [prevError,thisError,nextError];
          vals = [prevVal,val,nextVal];

          pos = errors.indexOf(Math.min.apply(null,errors));

          o.log('Angle sum '+apparentSum+'° too small for expected sum of '+expectedSum+'°; increasing '+vals[pos]+' from '+vals[pos]+'.');

          if (pos === 0) {prevVal+=1;}
          else if (pos === 1) {val+=1;}
          else {nextVal+=1;}

          apparentSum+=1;
        }

        p[prev] = prevVal;
        p[v] = val;
        p[next] = nextVal;
        o.desmos.setExpression({id:'m_'+prev,label:((((ps.exterior)?Math.round(180*Math.pow(10,prec)-prevVal):prevVal)/Math.pow(10,prec))+'°')});
        o.desmos.setExpression({id:'m_'+v,label:((((ps.exterior)?Math.round(180*Math.pow(10,prec)-val):val)/Math.pow(10,prec))+'°')});
        o.desmos.setExpression({id:'m_'+next,label:((((ps.exterior)?Math.round(180*Math.pow(10,prec)-nextVal):nextVal)/Math.pow(10,prec))+'°')});
        vars.upToDate = true;

       }
     };
    /* ←— SHARED EXPRESSION FUNCTIONS —————————————————————————————————————→ */
     fs.shared.expression = {
      /* ←— showHide —————————————————————————————————————————————————————→ *\
       | Show or hide an expression. Pass the expression id and 0 or 1 as value
       |    0 is hidden
       |    1 is visible
       * ←————————————————————————————————————————————————————————————————→ */
       showHide: function(){
        var o = hs.parseArgs(arguments);
        o.desmos.setExpression({id:o.id,hidden:(!(o.value))});
       }
     };

    /* ←— AGA SCO FUNCTIONS ———————————————————————————————————————————————→ */

      /* ←— A0596347 FUNCTIONS ——————————————————————————————————————————————→ */
       fs.A0596347 = {
        /* ←— updateLabels ————————————————————————————————————————————————————→ *\
         | updates the blue equation label
         |
         | Hidden point must be authored with showLabel:true,
         | and the ID 782
         * ←———————————————————————————————————————————————————————————————————→ */
         updateLabels: function(){
          var o = hs.parseArgs(arguments);
          o.desmos.setExpression({id:'782',label:'y = −2x² + 4x'+(o.value<0?' − '+(-o.value):(o.value>0?' + '+o.value:''))});
         }
       };

      /* ←— A0596370 FUNCTIONS ——————————————————————————————————————————————→ */
       fs.A0596370 = {
        /* ←— init ——————————————————————————————————————————————————————→ *\
         | Preps the watcher
         * ←—————————————————————————————————————————————————————————————————→ */
         init: function(){
          var o = hs.parseArgs(arguments);
          vs[o.uniqueId] = {lastStep:1};
         },
        /* ←— changeStep ——————————————————————————————————————————————————————→ *\
         | Switches to the next step.
         * ←—————————————————————————————————————————————————————————————————→ */
         changeStep: function(){
          var o = hs.parseArgs(arguments);
          var lastStep = vs[o.uniqueId].lastStep;
          vs[o.uniqueId].lastStep = o.value;

          var gt1 = (o.value>1);
          var lt2 = (!gt1);
          var lt3 = (o.value<3);
          var lt4 = (o.value<4);
          var lt5 = (o.value<5);
            
          var exprs = [
            // Step 1: show radii
            {id:"radii",hidden:gt1},
            {id:"tickRadiusA",hidden:gt1},
            {id:"tickRadiusB",hidden:gt1},
            {id:"tickRadiusC",hidden:gt1},
            // Step 2: bisect a
            {id:"tickSideALeft",hidden:lt2},
            {id:"tickSideARight",hidden:lt2},
            {id:"midpointA",hidden:lt2},
            // Step 3: bisect b
            {id:"tickSideBLeft",hidden:lt3},
            {id:"tickSideBRight",hidden:lt3},
            {id:"midpointB",hidden:lt3},
            // Step 4: show circumcenter
            {id:"pointCircumcenter",hidden:(gt1&&lt4),color:((lt5)?"#F15A22":"#000000")}
            // Step 5: show circumcircle
          ];

          if(lt2) {
            exprs.push({id:'rightAngleA',latex:'1'},{id:'bisectorA',latex:'1'});
          } else if(lt3) {
            exprs.push(
              {id:'rightAngleA',latex:
                '\\left(M_{xabc}\\left[1\\right]+n_{animate}I_{nv}\\left[1\\right]t_{ick}\\left(\\left[t,1\\right]\\theta_{yabc}\\left[1\\right]-\\left[1,t\\right]\\theta_{xabc}\\left[1\\right]\\right),M_{yabc}\\left[1\\right]-n_{animate}I_{nv}\\left[1\\right]t_{ick}\\left(\\left[t,1\\right]\\theta_{xabc}\\left[1\\right]+\\left[1,t\\right]\\theta_{yabc}\\left[1\\right]\\right)\\right)'
              }, {id:'bisectorA',color:'#F15A22',latex:
                '\\left(\\left(M_{xabc}\\left[1\\right]-t_{ick}I_{nv}\\left[1\\right]\\theta_{yabc}\\left[1\\right]\\right)\\left(1-tn_{animate}\\right)+\\left(U_x+t_{ick}I_{nv}\\left[1\\right]\\theta_{yabc}\\left[1\\right]\\right)tn_{animate},\\left(M_{yabc}\\left[1\\right]+t_{ick}I_{nv}\\left[1\\right]\\theta_{xabc}\\left[1\\right]\\right)\\left(1-tn_{animate}\\right)+\\left(U_y-t_{ick}I_{nv}\\left[1\\right]\\theta_{xabc}\\left[1\\right]\\right)tn_{animate}\\right)'
              }
            );
          } else {
            exprs.push(
              {id:'rightAngleA',latex:
                '\\left(M_{xabc}\\left[1\\right]+I_{nv}\\left[1\\right]t_{ick}\\left(\\left[t,1\\right]\\theta_{yabc}\\left[1\\right]-\\left[1,t\\right]\\theta_{xabc}\\left[1\\right]\\right),M_{yabc}\\left[1\\right]-I_{nv}\\left[1\\right]t_{ick}\\left(\\left[t,1\\right]\\theta_{xabc}\\left[1\\right]+\\left[1,t\\right]\\theta_{yabc}\\left[1\\right]\\right)\\right)'
              }, {id:'bisectorA',color:'#000000',latex:
                '\\left(\\left(M_{xabc}\\left[1\\right]-t_{ick}I_{nv}\\left[1\\right]\\theta_{yabc}\\left[1\\right]\\right)\\left(1-t\\right)+\\left(U_x+t_{ick}I_{nv}\\left[1\\right]\\theta_{yabc}\\left[1\\right]\\right)t,\\left(M_{yabc}\\left[1\\right]+t_{ick}I_{nv}\\left[1\\right]\\theta_{xabc}\\left[1\\right]\\right)\\left(1-t\\right)+\\left(U_y-t_{ick}I_{nv}\\left[1\\right]\\theta_{xabc}\\left[1\\right]\\right)t\\right)'
              }
            );
          }

          if(lt3) {
            if(lastStep>2) {
              exprs.push({id:'rightAngleB',latex:'1'},{id:'bisectorB',latex:'1'});
            }
          } else if((lastStep<3)||((lastStep === 3) ? !lt4 : lt4)) { // XOR
            if(lt4) {
              exprs.push(
                {id:'rightAngleB',latex:
                  '\\left(M_{xabc}\\left[2\\right]+n_{animate}I_{nv}\\left[2\\right]t_{ick}\\left(\\left[t,1\\right]\\theta_{yabc}\\left[2\\right]-\\left[1,t\\right]\\theta_{xabc}\\left[2\\right]\\right),M_{yabc}\\left[2\\right]-n_{animate}I_{nv}\\left[2\\right]t_{ick}\\left(\\left[t,1\\right]\\theta_{xabc}\\left[2\\right]+\\left[1,t\\right]\\theta_{yabc}\\left[2\\right]\\right)\\right)'
                }, {id:'bisectorB',color:'#F15A22',latex:
                  '\\left(\\left(M_{xabc}\\left[2\\right]-t_{ick}I_{nv}\\left[2\\right]\\theta_{yabc}\\left[2\\right]\\right)\\left(1-tn_{animate}\\right)+\\left(U_x+t_{ick}I_{nv}\\left[2\\right]\\theta_{yabc}\\left[2\\right]\\right)tn_{animate},\\left(M_{yabc}\\left[2\\right]+t_{ick}I_{nv}\\left[2\\right]\\theta_{xabc}\\left[2\\right]\\right)\\left(1-tn_{animate}\\right)+\\left(U_y-t_{ick}I_{nv}\\left[2\\right]\\theta_{xabc}\\left[2\\right]\\right)tn_{animate}\\right)'
                }
              );
            } else {
              exprs.push(
                {id:'rightAngleB',latex:
                  '\\left(M_{xabc}\\left[2\\right]+I_{nv}\\left[2\\right]t_{ick}\\left(\\left[t,1\\right]\\theta_{yabc}\\left[2\\right]-\\left[1,t\\right]\\theta_{xabc}\\left[2\\right]\\right),M_{yabc}\\left[2\\right]-I_{nv}\\left[2\\right]t_{ick}\\left(\\left[t,1\\right]\\theta_{xabc}\\left[2\\right]+\\left[1,t\\right]\\theta_{yabc}\\left[2\\right]\\right)\\right)'
                }, {id:'bisectorB',color:'#000000',latex:
                  '\\left(\\left(M_{xabc}\\left[2\\right]-t_{ick}I_{nv}\\left[2\\right]\\theta_{yabc}\\left[2\\right]\\right)\\left(1-t\\right)+\\left(U_x+t_{ick}I_{nv}\\left[2\\right]\\theta_{yabc}\\left[2\\right]\\right)t,\\left(M_{yabc}\\left[2\\right]+t_{ick}I_{nv}\\left[2\\right]\\theta_{xabc}\\left[2\\right]\\right)\\left(1-t\\right)+\\left(U_y-t_{ick}I_{nv}\\left[2\\right]\\theta_{xabc}\\left[2\\right]\\right)t\\right)'
                }
              );
            }
          }

          if(o.value === 5) {
            exprs.push(
              {id:'circumCircle',color:'#F15A22',style:cs.keyword.lineType.SOLID,latex:
              'P\\left(R,\\operatorname{sign}\\left(y_C-U_y\\right)\\arccos\\left(\\frac{x_C-U_x}{R}\\right)+2\\pi tn_{animate},U_x,U_y\\right)'},
              {id:'traceRadius',latex:
              'P\\left(tR,\\operatorname{sign}\\left(y_C-U_y\\right)\\arccos\\left(\\frac{x_C-U_x}{R}\\right)+2\\pi n_{animate},U_x,U_y\\right)'}
            );
          } else {
            exprs.push({id:'traceRadius',latex:'1'});
            if(lt2) {
              exprs.push({id:'circumCircle',color:'#000000',style:cs.keyword.lineType.DASHED,latex:'\\left(x-U_x\\right)^2+\\left(y-U_y\\right)^2=R^2'});
            } else if(lt4) {
              exprs.push({id:'circumCircle',latex:'1'});
            } else if(!lt5) {
              exprs.push({id:'circumCircle',color:'#F15A22',style:cs.keyword.lineType.SOLID,latex:'\\left(x-U_x\\right)^2+\\left(y-U_y\\right)^2=R^2'});
            }
          }

          o.desmos.setExpressions(exprs);
         }
       };

      /* ←— A0596373 FUNCTIONS ——————————————————————————————————————————————→ */
       fs.A0596373 = {
        /* ←— changeStep ——————————————————————————————————————————————————————→ *\
         | Switches to the next step.
         * ←—————————————————————————————————————————————————————————————————→ */
         changeStep: function(){
          var o = hs.parseArgs(arguments);
            
          var exprs = [
            // Step 1: show radii congruent
            {id:"radiiCongruence",hidden:(o.value>1)},
            // Step 2: bisect a
            {id:"congruenceA1",hidden:(o.value === 1)},
            {id:"congruenceA2",hidden:(o.value === 1)},
            // Step 3: bisect b
            {id:"congruenceB1",hidden:(o.value<=2)},
            {id:"congruenceB2",hidden:(o.value<=2)}
            // Step 4: show incenter
            // Step 5: draw a radius
            // Step 6: draw the circle
          ];

          // incenter
          if ((o.value>4)||(o.value === 1)) {exprs.push({id:'pointIncenter',hidden:false,color:'#000000'});}
          else if (o.value === 4) {exprs.push({id:'pointIncenter',hidden:false,color:'#F15A22'});}
          else {exprs.push({id:'pointIncenter',hidden:true});}

          // incircle
          if (o.value === 1) {
            exprs.push(
              {id:'inCircle',color:'#000000',style:cs.keyword.lineType.DASHED,latex:
                '\\operatorname{distance}\\left(\\left(x,y\\right),U\\right)=R'
              }
            );
          } else if (o.value === 6) {
            exprs.push(
              {id:'inCircle',color:'#F15A22',style:cs.keyword.lineType.SOLID,latex:
                'P\\left(R,\\arccos\\left(\\theta_{xabc}\\left[3\\right]\\right)\\operatorname{sign}\\left(\\theta_{yabc}\\left[3\\right]\\right)+I_{nv}\\frac{\\pi}{2}+2\\pi tn_{animation},U_x,U_y\\right)'
              }
            );
          } else {exprs.push({id:'inCircle',latex:'1'});}

          // radii
          if (o.value === 1) {exprs.push(
            {id:'pointTangents',color:'#000000',hidden:false,latex:
              'P\\left(I_{nv}R,\\theta_{abc}+\\arccos 0,U_x,U_y\\right)'
            },{id:'radii',style:cs.keyword.lineType.SOLID,latex:
              'P\\left(I_{nv}Rt,\\theta_{abc}+\\arccos 0,U_x,U_y\\right)'
            },{id:'rightAngleSides',latex:
              '\\left(\\left\\{R>2t_{ick}\\right\\}U_x-I_{nv}\\left(R-tt_{ick}\\right)\\theta_{yabc}+t_{ick}\\theta_{xabc},U_y+I_{nv}\\left(R-tt_{ick}\\right)\\theta_{xabc}+t_{ick}\\theta_{yabc}\\right)'
            },{id:'rightAngleTops',latex:
              '\\left(\\left\\{R>2t_{ick}\\right\\}U_x-I_{nv}\\left(R-t_{ick}\\right)\\theta_{yabc}+tt_{ick}\\theta_{xabc},U_y+I_{nv}\\left(R-t_{ick}\\right)\\theta_{xabc}+tt_{ick}\\theta_{yabc}\\right)'
            });
          } else if(o.value>=5) {
            exprs.push(
              {id:'rightAngleSides',latex:
                '\\left(\\left\\{R>2t_{ick}\\right\\}U_x-I_{nv}\\left(R-tt_{ick}\\right)\\theta_{yabc}\\left[3\\right]+t_{ick}\\theta_{xabc}\\left[3\\right],U_y+I_{nv}\\left(R-tt_{ick}\\right)\\theta_{xabc}\\left[3\\right]+t_{ick}\\theta_{yabc}\\left[3\\right]\\right)'
              },{id:'rightAngleTops',latex:
                '\\left(\\left\\{R>2t_{ick}\\right\\}U_x-I_{nv}\\left(R-t_{ick}\\right)\\theta_{yabc}\\left[3\\right]+tt_{ick}\\theta_{xabc}\\left[3\\right],U_y+I_{nv}\\left(R-t_{ick}\\right)\\theta_{xabc}\\left[3\\right]+tt_{ick}\\theta_{yabc}\\left[3\\right]\\right)'
              });
            if (o.value === 6) {exprs.push(
              {id:'pointTangents',color:'#F15A22',hidden:false,latex:
                'P\\left(I_{nv}R,\\theta_{abc}\\left[3\\right]+\\arccos 0,U_x,U_y\\right)'
              },{id:'radii',style:cs.keyword.lineType.DASHED,latex:
                'P\\left(I_{nv}Rt,\\theta_{abc}\\left[3\\right]+\\arccos 0,U_x,U_y\\right)'
              });
            } else {exprs.push(
              {id:'pointTangents',hidden:true},
              {id:'radii',style:cs.keyword.lineType.DASHED,latex:
                'P\\left(I_{nv}\\left(\\left(1-n_{animation}\\right)\\left(R-\\frac{14}{9}t_{ick}\\right)t+R\\left(1-t\\right)\\right),\\theta_{abc}\\left[3\\right]+\\arccos 0,U_x,U_y\\right)'
              });
            }
          } else {exprs.push(
            {id:'pointTangents',hidden:true},
            {id:'radii',latex:'1'},
            {id:'rightAngleTops',latex:'1'},
            {id:'rightAngleSides',latex:'1'});
          }

          // bisectors
          if (o.value === 1) {exprs.push( // Dashed cicle with 3 tangents and 3 congruent radii
            {id:'bisectorA',latex:'1'},
            {id:'bisectorB',latex:'1'}
            );
          } else if (o.value === 2) {exprs.push(
            {id:'bisectorA',color:'#F15A22',latex:
              '\\left(x_A+\\left(2-n_{animation}\\right)t\\frac{U_x-x_A}{r_{CAB}\\left[2\\right]}t_{ick}+tn_{animation}\\left(U_x-x_A\\right),y_A+\\left(2-n_{animation}\\right)t\\frac{U_y-y_A}{r_{CAB}\\left[2\\right]}t_{ick}+tn_{animation}\\left(U_y-y_A\\right)\\right)'
            },{id:'bisectorB',latex:'1'});
          } else if (o.value<=4) {
            exprs.push({id:'bisectorA',color:'#000000',latex:
              '\\left(x_A+t\\frac{U_x-x_A}{r_{CAB}\\left[2\\right]}\\left(t_{ick}+r_{CAB}\\left[2\\right]\\right),y_A+t\\frac{U_y-y_A}{r_{CAB}\\left[2\\right]}\\left(t_{ick}+r_{CAB}\\left[2\\right]\\right)\\right)'});
            if (o.value === 3) {exprs.push(
              {id:'bisectorB',color:'#F15A22',latex:
                '\\left(x_B+\\left(2-n_{animation}\\right)t\\frac{U_x-x_B}{r_{CAB}\\left[3\\right]}t_{ick}+tn_{animation}\\left(U_x-x_B\\right),y_B+\\left(2-n_{animation}\\right)t\\frac{U_y-y_B}{r_{CAB}\\left[3\\right]}t_{ick}+tn_{animation}\\left(U_y-y_B\\right)\\right)'
              });
            } else {exprs.push(
              {id:'bisectorB',color:'#000000',latex:
                '\\left(x_B+t\\frac{U_x-x_B}{r_{CAB}\\left[3\\right]}\\left(t_{ick}+r_{CAB}\\left[3\\right]\\right),y_B+t\\frac{U_y-y_B}{r_{CAB}\\left[3\\right]}\\left(t_{ick}+r_{CAB}\\left[3\\right]\\right)\\right)'
              });
            }
          } else {exprs.push(
            {id:'bisectorA',color:'#000000',latex:
              '\\left(x_A\\left(1-t\\right)+tU_x,y_A\\left(1-t\\right)+tU_y\\right)'
            },{id:'bisectorB',color:'#000000',latex:
              '\\left(x_B\\left(1-t\\right)+tU_x,y_B\\left(1-t\\right)+tU_y\\right)'
            });
          }

          o.desmos.setExpressions(exprs);
         }
       };

      /* ←— A0597080 FUNCTIONS */
       fs.A0597080 = {
        /* ←— updateLabels ————————————————————————————————————————————————————→ *\
         | updates the label of quadratic  function g(x) = x2 + k
         |
         | Hidden point must be authored with showLabel:true,
         | and the ID 344
         * ←———————————————————————————————————————————————————————————————————→ */
         updateLabels: function(){
          var o = hs.parseArgs(arguments);
            if (o.value > 0){
              o.desmos.setExpression({id:'344',label:('g(x) = x² + '+ o.value)});
              }
            else if (o.value < 0){
              o.desmos.setExpression({id:'344',label:('g(x) = x² – '+ -o.value)});
              }
            else{
              o.desmos.setExpression({id:'344',label:('g(x) = x²')});
              }
          }
       };

      /* ←— A0597083 FUNCTIONS */
       fs.A0597083 = {
        /* ←— updateLabels ————————————————————————————————————————————————————→ *\
         | updates the label of quadratic  function j(x) = k√(x)
         |
         | Hidden point must be authored with showLabel:true, (decided to show "0 in front of the square root when  k = 0)")
         | and the ID 357
         * ←———————————————————————————————————————————————————————————————————→ */
         updateLabels: function(){
            var o = hs.parseArgs(arguments);
            if (o.value === 1){
              o.desmos.setExpression({id:'357',label:('j(x) = √(x)')});
            // } else if (o.value === 0) {
            //   o.desmos.setExpression({id:'357',label:('j(x) = 0')});
            } else {
              o.desmos.setExpression({id:'357',label:('j(x) = '+ o.value +'√(x)')});
            }
          }
       };

      /* ←— A0597206 FUNCTIONS ——————————————————————————————————————————————→ */
       fs.A0597206 = {
        /* ←— init ————————————————————————————————————————————————————————————→ *\
         | Initializes the variables
         * ←———————————————————————————————————————————————————————————————————→ */
         init: function(){
          var o = hs.parseArgs(arguments);
          vs[o.uniqueId] = {
            a:1,
            b:0,
            c:0
          };
         },
        /* ←— updateLabels ————————————————————————————————————————————————————→ *\
         | updates the label of function based  the values of a and b
         |
         * ←———————————————————————————————————————————————————————————————————→ */
         updateLabels: function(){
          var o = hs.parseArgs(arguments);
          var vars = vs[o.uniqueId];
          vars[o.name] = o.value;
          var a = vars.a;
          var b = vars.b;
          var c = vars.c;

          var label = 'f(x)=';

          // ax²
          if (a !== 0) {
            if (a < 0) {
              label += '−';
              if (a !== -1) {
                label += (-a);
              }
            } else if (a !== 1) {
              label += a;
            }
            label += 'x²';
            if (b > 0 ||
                (b === 0 && c > 0)) {
              label += '+';
            }
          }

          // bx
          if (b !== 0) {
            if(b < 0) {
              label += '−';
              if (b !== -1) {
                label += (-b);
              }
            } else if (b !== 1) {
              label += b;
            }
            label += 'x';
            if (c > 0) {
              label += '+';
            }
          }

          // c
          if (c < 0) {
            label += '−';
            label += (-c);
          } else if (c > 0) {
            label += c;
          } else if (a === 0 && b === 0) {
            label += '0';
          }

          o.desmos.setExpression({id:390,label:label});
         }
       };

      /* ←— A0597207 FUNCTIONS ——————————————————————————————————————————————→ */
       fs.A0597207 = {
        /* ←— init ————————————————————————————————————————————————————————————→ *\
         | Initializes the variables
         * ←———————————————————————————————————————————————————————————————————→ */
         init: function(){
          var o = hs.parseArgs(arguments);
          vs[o.uniqueId] = {
            x:3,
            y:2
          };
         },
        /* ←— updateTriangle ———————————————————————————————————————————————————→ *\
         | updates the labels of function based  the values of x and y
        |
         * ←———————————————————————————————————————————————————————————————————→ */
         updateTriangle: function(){
          var o = hs.parseArgs(arguments);
          var vars = vs[o.uniqueId];
          vars[o.name[0]] = o.value;

          var x = vars.x;
          var y = vars.y;

          o.desmos.setExpressions([
            {id:'1',latex:'x_0='+x},
            {id:'373',latex:'y_0='+y},
            {id:'a',label:hs.latexToText(''+x+'^2-'+y+'^2='+(x*x-y*y))},
            {id:'b',label:hs.latexToText('2\\cdot '+x+'\\cdot '+y+'='+(2*x*y))},
            {id:'c',label:hs.latexToText(''+x+'^2+'+y+'^2='+(x*x+y*y))}
            ]);
         }
       };

      /* ←— A0597217 FUNCTIONS ——————————————————————————————————————————————→ */
       fs.A0597217 = {
         /* Initializes the variables
         ←———————————————————————————————————————————————————————————————————→ */
         init: function(){
          var o = hs.parseArgs(arguments);
          var n = 9;
          var i;

          vs[o.uniqueId] = {
            n:n,
            ids: {
              x1off:507,
              y1off:508,
              x2off:374,
              y2off:373,
              x3off:379,
              y3off:378,
              x4off:381,
              y4off:380,
              x5off:383,
              y5off:382,
              x6off:385,
              y6off:384,
              x7off:387,
              y7off:386,
              x8off:389,
              y8off:388,
              x9off:391,
              y9off:390
            }
          };

          function callbackGen1(x){
            return function() {
              o.desmos.setExpression({label:vs[o.uniqueId]['dpfx'+x+'y'+x].numericValue,id:(511+2*x)});
            };
          }
          function callbackGen2(x){
            return function(){
              o.desmos.setExpression({label:vs[o.uniqueId]['dpdx'+x+'y'+x].numericValue,id:(512+2*x)});
            };
          }

          // Initialize labeling
          for(i=1;i<=n;i+=1) {
            vs[o.uniqueId]['dpfx'+i+'y'+i]=hxs[o.uniqueId].maker({latex:'d_{pf}\\left(x_'+i+',y_'+i+'\\right)'});
            vs[o.uniqueId]['dpdx'+i+'y'+i]=hxs[o.uniqueId].maker({latex:'d_{pd}\\left(x_'+i+',y_'+i+'\\right)'});

            vs[o.uniqueId]['dpfx'+i+'y'+i].observe('numericValue',callbackGen1(i));
            vs[o.uniqueId]['dpdx'+i+'y'+i].observe('numericValue',callbackGen2(i));
          }
         },
         /* if widget is unlocked, to change focus or directrix reset the 
          the parabola points.*/

         reset: function(){
          var o = hs.parseArgs(arguments);
          var n = vs[o.uniqueId].n;
          var ids = vs[o.uniqueId].ids;
          var i;

            o.log("new lock value is"+ ' '+ o.value);

            if(vs[o.uniqueId].last_l_ock === 1 && o.value === 0){

              for(i=1;i<=n;i+=1) {
                o.desmos.setExpression({id:ids['x'+i+'off'],latex:('x_{'+i+'off}=0')});
                o.desmos.setExpression({id:ids['y'+i+'off'],latex:('y_{'+i+'off}=0')});
              }
            }
            vs[o.uniqueId].last_l_ock = o.value;
          }
       };

      /* ←— A0597220 FUNCTIONS ——————————————————————————————————————————————→ */
       fs.A0597220 = {
        /* ←— simulation ————————————————————————————————————————————————————→ *\
         | update function could be used later
         |
         | H
         * ←———————————————————————————————————————————————————————————————————→ */
         simulation: function(){
          var o = hs.parseArgs(arguments);

          if(o.name === 'p') {
            vs[o.uniqueId].p = o.value;

            o.desmos.setExpressions([
              // {id:'405',latex:'N_{ewSample}=0'}, // Alternate functionality: leave the old graph, but mark it as old
              {id:'sides',color:cs.color.agaColors.red,hidden:true},
              {id:'bars',color:cs.color.agaColors.red,hidden:true}
            ]);

            return;
          }
          if (o.value === 0) {
            /* // Alternate functionality: turn bar grey when toggling off.
            o.desmos.setExpressions([
              {id:'sides',color:cs.color.agaColors.grey},
              {id:'bars',color:cs.color.agaColors.grey}
              ]);
            */
            return;
          }
          
          o.desmos.setExpression({id:'405',latex:'N_{ewSample}=0'}); // Comment out if using alternate functionality

          var p = vs[o.uniqueId].p || 0;
          var histBarID = {};
          var histLeft =[];
          var histFreq = [];
          var histHeight=[];
          var numberofSamples = 1000;
          var numberofSims = 1000;
          var sample;
          var sim;
          var pSim;
          var pCount;
          var histMax;
          var histMin;
          var bar;

          // REVISED STUFF

          // Run simulations
          for(sim = 0; sim < numberofSims ; sim+=1){

            // Count # of "successes"
             pCount = 0;
             for (sample = 0; sample < numberofSamples; sample+=1){
              if (Math.random() <= p) {
                pCount+=1;
              }
             }

            // Log sample proportion in appropriate bin (bin n: n<p<=n+1)
            pSim = Math.ceil(100*(pCount/numberofSamples))-1;

            if(pSim<0) {
              pSim=0; // p=0 included in bin 0
            }

            if(histBarID[pSim]===undefined) {
              histBarID[pSim]=1;
            } else {
              histBarID[pSim]+=1;
            }
          }

          histMin = Math.min.apply(null,objKeys(histBarID));
          histMax = Math.max.apply(null,objKeys(histBarID));

          for(bar = histMin; bar <= histMax; bar+=1) {

            histLeft.push(bar/100);

            if(histBarID[bar]===undefined) {
              histFreq.push(0);
            } else {
              histFreq.push(histBarID[bar]);
            }

            if(bar===histMin) {
              histHeight.push(histFreq[0]);
            } else {
              histHeight.push(Math.max(histFreq[histFreq.length-2],histFreq[histFreq.length-1]));
            }
          }

          histLeft.push((histMax+1)/100);
          histHeight.push(histBarID[histMax]);

          o.desmos.setExpressions([
            {id: 'list1', latex: 'L = ['+ (histLeft) +']'},
            {id: 'list2', latex: 'H = ['+ (histHeight) +']'},
            {id: 'list3', latex: 'F = ['+ (histFreq)+ ']'},
            {id:'sides',color:cs.color.agaColors.red,hidden:false},
            {id:'bars',color:cs.color.agaColors.red,hidden:false}
            ]);
        }
       };

      /* ←— A0597225 FUNCTIONS ——————————————————————————————————————————————→ */
       fs.A0597225 = {
        /* ←— init ————————————————————————————————————————————————————————————→ *\
         | Initializes the variables
         * ←———————————————————————————————————————————————————————————————————→ */
         init: function(){
          var o = hs.parseArgs(arguments);
          vs[o.uniqueId] = {
            globalDiffArray:[],
            histFreq:[]
          };
         },
        /*———————————————————————————————————————————————————————————————
         |    Additional function to reset histogram.
         *————————————————————————————————————————————————*/
         histReset: function(){
          var o = hs.parseArgs(arguments);
          if(o.value===0) {
            return;
          }
          var vars = vs[o.uniqueId];
          var globalDiffArray = [];
          var histFreq =[0,0,0,0,0,0,0,0,0,0];
       
          //passs zero-ed freq list and global mean back to desmos
          o.desmos.setExpression({id: '427', latex: 'F = ['+ (histFreq)+ ']'});
          //o.desmos.setExpression({id: '500', latex: 'm = '+ globalMean});
          vars.globalDiffArray = globalDiffArray;
          vars.histFreq = histFreq;

          o.desmos.setExpression({id:524,latex:'h_{istReset}=0'});
         },
        /* ←— Resample ————————————————————————————————————————————————————→ *\
         |
         * ←———————————————————————————————————————————————————————————————————→ */
         resample: function(){
          var o = hs.parseArgs(arguments);
          var vars = vs[o.uniqueId];

          if(o.value===0) {
            return;
          }
      
          var exGroup1 = [];
          var exGroup2 = [];

          var globalDiffArray=vars.globalDiffArray;
          //  let globalDiffArray=[0];
          var meanDiff;
          var numberofResamples;
          // var histMin = -10;
          // var histMax = 10;
          // var histBandWidth = 2;
          var histLeft =[-10,-8,-6,-4,-2,0,2,4,6,8];
          var histRight =[-8,-6,-4,-2,0,2,4,6,8,10];
          var histFreq = vars.histFreq;
          /* —————————————————————————————
              first detect the switches for resampling.
          —————————————————————————————————————————————————*/
         
          switch (o.name) {
            case 'r_{sample1}':
              numberofResamples = 1;
              o.desmos.setExpression({id:1,latex:'r_{sample1}=0'});
              break;
            case 'r_{sample10}':
              numberofResamples = 10;
              o.desmos.setExpression({id:422,latex:'r_{sample10}=0'});
              break;
            case 'r_{sample100}':
              numberofResamples = 100;
              o.desmos.setExpression({id:423,latex:'r_{sample100}=0'});
              break;
            case 'r_{sample1000}':
              numberofResamples = 1000;
              o.desmos.setExpression({id:424,latex:'r_{sample1000}=0'});
              break;
          }
          /* —————————————————————————————————————————————————————
           put the main program here
           —————————————————————————————————————————————————*/

          function getArrayMean (arr){
            var arrayMean;
            var arraySum;
            var i;
            arraySum = 0;
            arrayMean = 0;
            for (i = 0; i < arr.length; i+=1){
             arraySum = arraySum + arr[i];
            }
            arrayMean = arraySum/arr.length;
            return arrayMean;
          }

          function resampleGroups(){
            // zero the assignGroup array.
            var i;
            var assignGroup =[];
            var oGroup = [184, 186, 183, 182, 170, 182, 178, 170, 187, 185, 188, 183, 202, 188, 193, 182, 179, 190, 189, 164, 177, 173, 183, 172, 154, 177, 168, 180, 167, 170, 178, 180, 168, 178, 197, 188, 167, 174, 177, 173];
            var assignSum;

            for (i = 0; i < oGroup.length; i+=1){
             assignGroup[i]=0;
            }
            /* find the assignSum, randomly assign 1's and 2' with a mean of 
            1.5 so half go to 1 group and half go to group 2 */
            assignSum = 0;
            while (assignSum !== ((1.5)*(oGroup.length))){
              for (i = 0; i < oGroup.length; i+=1){
                // assign group as 1 or 2.
                assignGroup[i] = Math.round(Math.random()) + 1;
               }
              assignSum = 0;
               // compute the current assign sum do we have a even re-assignment?
              for (i = 0; i < oGroup.length; i+=1){
                assignSum = assignSum + assignGroup[i];
               }
             }
            // clear the ex groups
            exGroup1 = [];
            exGroup2 = [];
            /* place the data into the new resampled groups. if assignGroup is 1 place in group 1, else place in group 2. */    

            for (i = 0; i < oGroup.length; i+=1){
              
               if(assignGroup[i] === 1){
                 exGroup1.push(oGroup[i]);
               }
               else {
                exGroup2.push(oGroup[i]);
               }
             }
            }
          /* —————————————————————————————————————————————————————————————
           The main loop
          ———————————————————————————————————————————————————————————————*/
          var j;
          for (j = 0; j < numberofResamples; j+=1){
              resampleGroups();
              meanDiff = Math.round(100*(getArrayMean(exGroup1)-getArrayMean(exGroup2)))/100;
              globalDiffArray.push(meanDiff);
          }
          /* ——————————————————————————————————————————————————————————
            Compute the global mean which has to get passed back to desmos to get displayed as vertical line.

           Build the histogram. for each interval j 1 to 10..
           check the global diff array ..first clear the frequency table.
          ——————————————————————————————————————————————————————————————————*/
          for (j =0; j < 10 ; j+=1){
            histFreq[j] = 0;
           }

          var k;
          for (j = 0; j < 10 ; j+=1){
            for(k = 0 ; k < globalDiffArray.length ; k +=1){
              if(globalDiffArray[k] >= histLeft[j] && globalDiffArray[k] < histRight[j] ){
                histFreq[j]+=1;
              }
            }
          }
          vars.globalDiffArray = globalDiffArray;
          vars.histFreq = histFreq;
            //passs freq list ——(and global mean )———- back to desmos
          o.desmos.setExpression({id: '427', latex: 'F = ['+ (vars.histFreq)+ ']'});

         }
       };

      /* ←— A0597227 FUNCTIONS ——————————————————————————————————————————————→ */
       fs.A0597227 = {
        /* ←— init ————————————————————————————————————————————————————————————→ *\
         | Initializes the variables
         * ←———————————————————————————————————————————————————————————————————→ */
         init: function(){
          var o = hs.parseArgs(arguments);
          vs[o.uniqueId] = {
            n:1,
            p:0.5,
            A:0,
            C:0,
            on:true
          };
         },
        //←———————————————————————————————————————————————————————————————————
         simulation: function(){
          var o = hs.parseArgs(arguments);
        
          var win = false;
          var net = 0;
          var totalNet = 0;
          var currentMeanNet = 0;
          var meanNetPerGame=[];
          var xMeanNet =[];

          //vars for rescaling graph.
          var leftBound;
          var rightBound;
          var topBound;
          var bottomBound;

          if (o.name === 'R_{unSimulation}') {
              if(o.value===0) {
                return;
              }
              o.desmos.setExpression({id:5,latex:'R_{unSimulation}=0'});
              vs[o.uniqueId].on = true;
          } else {
            vs[o.uniqueId][o.name] = o.value;
            if (vs[o.uniqueId].on) {
              vs[o.uniqueId].on = false;
              o.desmos.setExpressions([
                {id:'600',hidden:true,showLabel:false},
                {id:'601',type:'table',columns:[{label:'x',values:[]},{label:'y',values:[],hidden:true}]}
              ]);
            }
            return;
          }

              var n = vs[o.uniqueId].n;
              var p = vs[o.uniqueId].p;
              var A = vs[o.uniqueId].A;
              var C = vs[o.uniqueId].C;
              var i;

              meanNetPerGame=[];
              xMeanNet =[];
              for(i = 1 ; i <= n; i+=1) {
                // play the game, did you win?
                // r = Math.round(100*Math.random())/100;
                 if(Math.random() <= p) {
                   win = true;
                  } else {
                   win = false;
                  }
                // compute winning/losses.      
                if(win === true) {
                  net = (-1) * C + A;
                } else {
                  net = (-1) * C;
                }
                // record the results. Compute the mean.  
                totalNet = totalNet + net;
                currentMeanNet = Math.round(100*(totalNet/i))/100;
                meanNetPerGame.push(currentMeanNet);
              }
              //send the last point to Desmos.
               o.desmos.setExpression({id: '600', latex: '(' + n + ', '+ meanNetPerGame[n-1] +')', color: '#0092C8', showLabel:'true', hidden:false});
              /*————————————————————————————————————————————————-
              Generate a string for a xvalues  from 1 to n. for the
              in the table to be sent to  Desmos.- this index was the problem before!
             ——————————————————————————————————————————————————————- */
                for (i = 0 ; i < meanNetPerGame.length; i+=1){
                  xMeanNet[i]=i+1;
                   }
              // send the table to desmos. 
              o.desmos.setExpression({id: '601', type: 'table',
                columns:[
                {latex:'x',values: xMeanNet},
                {latex:'y',values: meanNetPerGame,color:'#0092C8', columnMode:
                Desmos.ColumnModes.LINES, hidden:false}
                ]
              });
             /*————————————————————————————————————————————————
                 code  to rescale the graph.
             ———————————————————————————————————————————————————*/
                leftBound = (-1)* n;
                rightBound = (n)*1.3;
                if (A > C){
                    bottomBound = (-1)* C * 1.3;
                    topBound = Math.abs(A-C)* 1.3;
                } else if (A < C){
                    bottomBound = (-1)* C * 1.3;
                    topBound = Math.abs(A-C)* 1.3;
                } else{
                    if (C === 0){
                      bottomBound = -5;
                      topBound = 5;
                    } else {
                      bottomBound = (-1)* C * 1.3;
                      topBound = C * 1.3;
                    }
                  }
                o.desmos.setMathBounds({
                  left:leftBound,
                  right: rightBound,
                  bottom: bottomBound,
                  top: topBound
                });
          }
       };

       /* ←— A0597514 FUNCTIONS ——————————————————————————————————————————————→ */
       fs.A0597514 = {
        /* ←— init ————————————————————————————————————————————————————————————→ *\
         | Initializes the variables
         * ←———————————————————————————————————————————————————————————————————→ */
         init: function(){
          var o = hs.parseArgs(arguments);
          vs[o.uniqueId] = {
            P_x:-4,
            P_y:-3,
            Q_x:2,
            Q_y:1,
            M_x:-1,
            M_y:-1
          };
         },
        /* ←— updateLabels ————————————————————————————————————————————————————→ *\
         | updates the labels of P, Q, and M based on changes in their coordinates
         |
         | P=(x_1,y_1) and Q=(x_2,y_2)
         |
         | Points P, Q, and M must be authored with showLabel:true, and the IDs
         |  P_point, Q_point, and M_point
         * ←———————————————————————————————————————————————————————————————————→ */
         updateLabels: function(){
          var o = hs.parseArgs(arguments);
          switch (o.name) {
            case 'x_1':
              vs[o.uniqueId].P_x = o.value;
              vs[o.uniqueId].M_x = (vs[o.uniqueId].Q_x+o.value)/2;
              fs.shared.label.labelPoint(vs[o.uniqueId].P_x,vs[o.uniqueId].P_y,'P','P_point',o);
              break;
            case 'y_1':
              vs[o.uniqueId].P_y = o.value;
              vs[o.uniqueId].M_y = (vs[o.uniqueId].Q_y+o.value)/2;
              fs.shared.label.labelPoint(vs[o.uniqueId].P_x,vs[o.uniqueId].P_y,'P','P_point',o);
              break;
            case 'x_2':
              vs[o.uniqueId].Q_x = o.value;
              vs[o.uniqueId].M_x = (vs[o.uniqueId].P_x+o.value)/2;
              fs.shared.label.labelPoint(vs[o.uniqueId].Q_x,vs[o.uniqueId].Q_y,'Q','Q_point',o);
              break;
            case 'y_2':
              vs[o.uniqueId].Q_y = o.value;
              vs[o.uniqueId].M_y = (vs[o.uniqueId].P_y+o.value)/2;
              fs.shared.label.labelPoint(vs[o.uniqueId].Q_x,vs[o.uniqueId].Q_y,'Q','Q_point',o);
              break;
          }
          fs.shared.label.labelPoint(vs[o.uniqueId].M_x,vs[o.uniqueId].M_y,'M','M_point',o);
         }
       };

      /* ←— A0597522 FUNCTIONS ——————————————————————————————————————————————→ */
       fs.A0597522 = {
        /* ←— labelDiags ————————————————————————————————————————————————————→ */
         labelDiags: function(){
          var o = hs.parseArgs(arguments);
          function diags(n) {
            if(n === 3) {
              return 0;
            } else if((n<1)||(n%1 !== 0)) {
              return undefined;
            } else {
              return diags(n-1)+n-2;
            }
          }
          o.desmos.setExpressions([
            {id:'n_sides',latex:'n_{sides}='+o.value},
            {id:'diagLabel',label:''+diags(o.value)+' diagonals'}
            ]);
         }
       };


      /* ←— A0597552 FUNCTIONS ——————————————————————————————————————————————→ */
       fs.A0597552 = {
        /* ←— init ————————————————————————————————————————————————————————————→ *\
         | Initializes the variables
         * ←———————————————————————————————————————————————————————————————————→ */
         init: function(){
          var o = hs.parseArgs(arguments);
          vs[o.uniqueId] = {
            P_x:-4,
            P_y:-3,
            Q_x:2,
            Q_y:1
          };
         },
        /* ←— updateLabels ————————————————————————————————————————————————————→ *\
         | updates the labels of P, Q, and the distances based on changes in their
         | coordinates
         |
         | P=(x_1,y_1) and Q=(x_2,y_2)
         |
         | Points P, Q, and the distances must be authored with showLabel:true,
         | and the IDs
         |  P_point, Q_point, distance, x_distance, and y_distance
         * ←———————————————————————————————————————————————————————————————————→ */
         updateLabels: function(){
          var o = hs.parseArgs(arguments);
          var P_x = vs[o.uniqueId].P_x;
          var P_y = vs[o.uniqueId].P_y;
          var Q_x = vs[o.uniqueId].Q_x;
          var Q_y = vs[o.uniqueId].Q_y;
          switch (o.name) {
            case 'x_1':
              vs[o.uniqueId].P_x = o.value;
              P_x = o.value;
              fs.shared.label.labelPoint(vs[o.uniqueId].P_x,vs[o.uniqueId].P_y,'P','P_point',o);
              break;
            case 'y_1':
              vs[o.uniqueId].P_y = o.value;
              P_y = o.value;
              fs.shared.label.labelPoint(vs[o.uniqueId].P_x,vs[o.uniqueId].P_y,'P','P_point',o);
              break;
            case 'x_2':
              vs[o.uniqueId].Q_x = o.value;
              Q_x = o.value;
              fs.shared.label.labelPoint(vs[o.uniqueId].Q_x,vs[o.uniqueId].Q_y,'Q','Q_point',o);
              break;
            case 'y_2':
              vs[o.uniqueId].Q_y = o.value;
              Q_y = o.value;
              fs.shared.label.labelPoint(vs[o.uniqueId].Q_x,vs[o.uniqueId].Q_y,'Q','Q_point',o);
              break;
          }
          var distance = Math.round(100*Math.sqrt(Math.pow(Q_x-P_x,2)+Math.pow(Q_y-P_y,2)))/100;
          var x_distance = Math.abs(Q_x-P_x);
          var y_distance = Math.abs(Q_y-P_y);

          o.desmos.setExpressions([
            {id:'distance',label:('√('+x_distance+'² + '+y_distance+'²) = '+distance)},
            {id:'x_distance',label:x_distance},
            {id:'y_distance',label:y_distance}
          ]);
         }
       };

      /* ←— A0597629 FUNCTIONS ——————————————————————————————————————————————→ */
        cs.A0597629 = {
          MAX_VERTICES:14,
          RADIUS:5,
          INITIAL_COORDINATES_PRECISION:6,
          DRAG_BUFFER:0.25,
          DRAG_BUFFER_REBOUND:0.1, // How much to bounce back when going past the buffer
          SEGMENT_TEMPLATE:'\\left(x_U\\left(1-t\\right)+x_Vt,y_U\\left(1-t\\right)+y_Vt\\right)',
          HIDDEN_COLOR:'#FFFFFF', // white is close enough to hidden
          VERTEX_COLOR:'#000000'
         };
       fs.A0597629 = {
        /* ←— init ————————————————————————————————————————————————————————————→ *\
         | Initializes the variables
         * ←———————————————————————————————————————————————————————————————————→ */
         init: function(){
          var o = hs.parseArgs(arguments);
          vs[o.uniqueId] = {lastDragged:0,placeholder:0};
          var vars = vs[o.uniqueId];
          var hlps = hxs[o.uniqueId];
          var cons = cs.A0597629;
          var i;
          var j;

          hlps.n = hlps.maker({latex:'n'});
          hlps.showDiagonals = hlps.maker({latex:'d_{iags}'});

          vars.belayCorrection = true;

          function changeFunc(varName,i){
            return function(){
              fs.A0597629.coordinateChanged({
                name:hs.sub(varName,i),
                value:vars[varName+'_'+i].numericValue,
                desmos:o.desmos,
                uniqueId:o.uniqueId,
                log:o.log
              });
            };
           }

          // Set up variables and observers for vertices of each polygon
           for(i=1;i<=cons.MAX_VERTICES;i+=1) {
            // Track x & y for this vertex
            vars["x_"+i] = hlps.maker({latex:hs.sub('x',i)});
            vars["y_"+i] = hlps.maker({latex:hs.sub('y',i)});
            vars[i]={};
            if (i >= 3) {
              for(j=1;j<=i;j+=1) {
                if (i === vars.n) {
                  // Initialize active polygon to current state
                  vars[i]['x_'+j] = vars['x_'+i].numericValue;
                  vars[i]['y_'+j] = vars['y_'+i].numericValue;
                } else {
                  // Initialize inactive polygons to default
                  vars[i]['x_'+j] = cons.RADIUS*Math.round(Math.pow(10,cons.INITIAL_COORDINATES_PRECISION)*Math.sin(2*Math.PI*((j-1)/i)))/Math.pow(10,cons.INITIAL_COORDINATES_PRECISION);
                  vars[i]['y_'+j] = cons.RADIUS*Math.round(Math.pow(10,cons.INITIAL_COORDINATES_PRECISION)*Math.cos(2*Math.PI*((j-1)/i)))/Math.pow(10,cons.INITIAL_COORDINATES_PRECISION);
                }
               }
            }
            // Set up observers for when the user drags a point
            hlps["x_"+i] = changeFunc('x',i);
            hlps['y_'+i] = changeFunc('y',i);
            vars["x_"+i].observe('numericValue.correction',hlps['x_'+i]);
            vars['y_'+i].observe('numericValue.correction',hlps['y_'+i]);
           }

           // 

          // Let the user turn the diagonals on and off
          hlps.showDiagonals.observe('numericValue',function(){
            var exprs = [];
            for (i = 3; i < hlps.n.numericValue; i+=1) {
              exprs.push({
                id:'segment_'+hs.ALPHA[i]+'A',
                hidden:(hlps.showDiagonals.numericValue === 0)
              });
            }
            exprs.push({
              id:'centroid-1',
              showLabel:(hlps.showDiagonals.numericValue === 1)
            });
            o.desmos.setExpressions(exprs);
          });

          // Wait until the state fully loads before initializing the switchPolygon observer
          hlps.n.observe('numericValue.init',function(){
            if (hlps.n.numericValue !== undefined && hlps.n.numericValue>2) {
              vars.n = hlps.n.numericValue;
              o.log('n initialized to '+vars.n);
              hlps.n.unobserve('numericValue.init');
              hlps.n.observe('numericValue.switchingPolygon',function(){
                fs.A0597629.switchPolygon({
                  name:'n',
                  value:hlps.n.numericValue,
                  desmos:o.desmos,
                  uniqueId:o.uniqueId,
                  log:o.log
                });
              });
            }
          });

          // prepare to clear placeholders
          document.addEventListener('mouseup',function(){fs.A0597629.clearPlaceholder(o);});
          document.addEventListener('touchend',function(){fs.A0597629.clearPlaceholder(o);});
          
          o.log("Observers initialized:",vars);

          hlps.correctionBuffer = window.setTimeout(function(){vars.belayCorrection = false;},cs.delay.LOAD);
         },
        /* ←— setPlaceholder ——————————————————————————————————————————————————→ *\
         | Attaches all segments from a vertex to the placeholder vertex
         * ←———————————————————————————————————————————————————————————————————→ */
         setPlaceholder: function(options,i) {
          if(i === undefined) {
            i = 0;
          }
          var o = hs.parseArgs([(options || {})]);
          var vars = vs[o.uniqueId];
          var n = vars.n;

          var j;

          // move the placeholder to the location of the vertex to hold place
          o.desmos.setExpression({id:'x_0',latex:'x_0='+Math.round(vars[n]['x_'+i]*Math.pow(10,cs.precision.FLOAT_PRECISION))/Math.pow(10,cs.precision.FLOAT_PRECISION)});
          o.desmos.setExpression({id:'y_0',latex:'y_0='+Math.round(vars[n]['y_'+i]*Math.pow(10,cs.precision.FLOAT_PRECISION))/Math.pow(10,cs.precision.FLOAT_PRECISION)});

          if (i === vars.placeholder) {return;} // The rest of this stuff only needs to be done the first time

          o.log('Adding placeholder '+hs.ALPHA[i]);

          vars.placeholder = i;
          var cons = cs.A0597629;

          // make the placeholder visible, and the dragged vertex invisible
          o.desmos.setExpression({id:'placeholder_vertex',hidden:false,showLabel:true,label:hs.ALPHA[i],dragMode:Desmos.DragModes.NONE});
          o.desmos.setExpression({id:'vertex_'+hs.ALPHA[i],showLabel:false,color:cons.HIDDEN_COLOR});

          // Attach the vertex to its edges and diagonals
          if (i === 1) {
            // Attach placeholder to B
            o.desmos.setExpression({
              id:'segment_AB',
              latex:cons.SEGMENT_TEMPLATE.replace(new RegExp('U','g'),'0').replace(new RegExp('V','g'),'2')
            });
            // Attach every other vertex to placeholder
            for (j = 3;j<=n;j+=1) {
              o.desmos.setExpression({
                id:'segment_'+hs.ALPHA[j]+'A',
                latex:cons.SEGMENT_TEMPLATE.replace(new RegExp('([xy])_U','g'),hs.sub('$1',j)).replace(new RegExp('V','g'),'0')
              });
            }
          } else {
            if (i === 2) {
              o.desmos.setExpression({
                id:'segment_AB',
                latex:cons.SEGMENT_TEMPLATE.replace(new RegExp('U','g'),'0').replace(new RegExp('V','g'),'1')
              });
            } else {
              // attach to previous vertex
              o.desmos.setExpression({
                id:'segment_'+hs.ALPHA[i-1]+hs.ALPHA[i],
                latex:cons.SEGMENT_TEMPLATE.replace(new RegExp('([xy])_U','g'),hs.sub('$1',i-1)).replace(new RegExp('V','g'),'0')
              });
              // attach diagonal to A
              if (2 < i && i < n) {
                o.desmos.setExpression({
                  id:'segment_'+hs.ALPHA[i]+'A',
                  latex:cons.SEGMENT_TEMPLATE.replace(new RegExp('U','g'),'0').replace(new RegExp('V','g'),'1')
                });
              }
            }
            // Attach to the next vertex
            o.desmos.setExpression({
              id:'segment_'+hs.ALPHA[i]+hs.ALPHA[i%n+1],
              latex:cons.SEGMENT_TEMPLATE.replace(new RegExp('U','g'),'0').replace(new RegExp('([xy])_V','g'),hs.sub('$1',i%n+1))
            });
          }
         },
        /* ←— clearPlaceholder ————————————————————————————————————————————————→ *\
         | moves the last dragged vertex back to the placeholder vertex's location
         |
         * ←———————————————————————————————————————————————————————————————————→ */
         clearPlaceholder: function(){
          var o = hs.parseArgs(arguments);
          var vars = vs[o.uniqueId];
          var hlps = hxs[o.uniqueId];
          var cons = cs.A0597629;
          var i = vars.placeholder;
          var n = vars.n;

          var j;

          if (i === 0) {return;} // if it ain't broke, don't fix it

          o.log('Now clearing placeholder '+hs.ALPHA[i]);

          // Don't recorrect while clearing the placeholder
          if (hlps.correctionBuffer !== undefined) {window.clearTimeout(hlps.correctionBuffer);}
          vars.belayCorrection = true;

          // Move the place-held point to the placeholder
          o.desmos.setExpression({id:'x_'+i,latex:hs.sub('x',i)+'='+Math.round(vars[n]['x_'+i]*Math.pow(10,cs.precision.FLOAT_PRECISION))/Math.pow(10,cs.precision.FLOAT_PRECISION)});
          o.desmos.setExpression({id:'y_'+i,latex:hs.sub('y',i)+'='+Math.round(vars[n]['y_'+i]*Math.pow(10,cs.precision.FLOAT_PRECISION))/Math.pow(10,cs.precision.FLOAT_PRECISION)});

          hlps.correctionBuffer = window.setTimeout(function(){vars.belayCorrection = false;},cs.delay.SET_EXPRESSION);

          // Make the place-held point visible, and the placeholder invisible
          o.desmos.setExpression({id:'placeholder_vertex',hidden:true,showLabel:false});
          o.desmos.setExpression({id:'vertex_'+hs.ALPHA[i],showLabel:true,color:cons.VERTEX_COLOR});

          // Attach the vertex to its edges and diagonals
          if (i === 1) {
            // Attach A to B
            o.desmos.setExpression({
              id:'segment_AB',
              latex:cons.SEGMENT_TEMPLATE.replace(new RegExp('U','g'),'1').replace(new RegExp('V','g'),'2')
            });
            // Attach A to every other vertex
            for (j = 3;j<=n;j+=1) {
              o.desmos.setExpression({
                id:'segment_'+hs.ALPHA[j]+'A',
                latex:cons.SEGMENT_TEMPLATE.replace(new RegExp('([xy])_U','g'),hs.sub('$1',j)).replace(new RegExp('V','g'),'1')
              });
            }
          } else {
            if (i === 2) {
              o.desmos.setExpression({
                id:'segment_AB',
                latex:cons.SEGMENT_TEMPLATE.replace(new RegExp('U','g'),'1').replace(new RegExp('V','g'),'2')
              });
            } else {
              // attach to previous vertex
              o.desmos.setExpression({
                id:'segment_'+hs.ALPHA[i-1]+hs.ALPHA[i],
                latex:cons.SEGMENT_TEMPLATE.replace(new RegExp('([xy])_U','g'),hs.sub('$1',i-1)).replace(new RegExp('([xy])_V','g'),hs.sub('$1',i))
              });
              // attach diagonal to A
              o.desmos.setExpression({
                  id:'segment_'+hs.ALPHA[i]+'A',
                  latex:cons.SEGMENT_TEMPLATE.replace(new RegExp('([xy])_U','g'),hs.sub('$1',i)).replace(new RegExp('V','g'),'1')
                });
            }
            // Attach to the next vertex
            o.desmos.setExpression({
              id:'segment_'+hs.ALPHA[i]+hs.ALPHA[i%n+1],
              latex:cons.SEGMENT_TEMPLATE.replace(new RegExp('([xy])_U','g'),hs.sub('$1',i)).replace(new RegExp('([xy])_V','g'),hs.sub('$1',i%n+1))
            });
          }

          vars.placeholder = 0;
         },
        /* ←— coordinateChanged ———————————————————————————————————————————————→ *\
         | updates variables, and corrects if the user tries to cross diagonals
         * ←———————————————————————————————————————————————————————————————————→ */
         coordinateChanged: function(){
          var o = hs.parseArgs(arguments);
          var vars = vs[o.uniqueId];
          if (vars.belayCorrection === true) {return;}
          var n = vars.n;
          var i = +(o.name.match(new RegExp('[0-9]+'))[0]);
          var newPoint = {
            x:vars['x_'+i].numericValue,
            y:vars['y_'+i].numericValue
          };

          var j;

          if (i !== vars.lastDragged) {
            o.log('Now dragging n='+n+',i='+i);
            vars.lastDragged = i;

            // First, put the last dragged vertex back.
            fs.A0597629.clearPlaceholder(o);

            // Now create a list of all the new boundaries
            vars.dragBoundaries = [];
            if (i === 1) {
              // All edges are boundaries, except [n]A and AB
              // NOTE: Since the vertices are numbered clockwise, edges must be defined in reverse so the positive-orientation of the polygon constrain function will work
              for (j=2;j<n;j+=1) {
                vars.dragBoundaries.push(hs.lineTwoPoints(
                  {x:vars[n]['x_'+(j+1)],y:vars[n]['y_'+(j+1)]},
                  {x:vars[n]['x_'+j],y:vars[n]['y_'+j]}
                ));
              }
            } else {
              // Bind by the previous diagonal
              if (2 < i) {
                vars.dragBoundaries.push(hs.lineTwoPoints(
                  {x:vars[n]['x_'+(i-1)],y:vars[n]['y_'+(i-1)]},
                  {x:vars[n].x_1,y:vars[n].y_1}
                ));
              }
              // Bind by the next diagonal
              if (i < n) {
                vars.dragBoundaries.push(hs.lineTwoPoints(
                  {x:vars[n].x_1,y:vars[n].y_1},
                  {x:vars[n]['x_'+(i%n+1)],y:vars[n]['y_'+(i%n+1)]}
                ));
              }
            }

            o.log('Now constraining by:',vars.dragBoundaries);

            // Note: in previous versions, bound instead to keep the polygon convex.
            //  This meant binding by line(i-1,i+1), line(i-1,i-2), and line(i+2,i+1).
          }

          var constrained = hs.polygonConstrain(newPoint,vars.dragBoundaries);

          vars[n]['x_'+i] = constrained.x;
          vars[n]['y_'+i] = constrained.y;

          if (constrained === newPoint) {
            fs.A0597629.clearPlaceholder(o);
          } else {
            /** o.log('Correcting ('+
              Math.round(Math.pow(10,cs.debug.COORDINATE_DECIMALS)*newPoint.x)/Math.pow(10,cs.debug.COORDINATE_DECIMALS)
              +','+
              Math.round(Math.pow(10,cs.debug.COORDINATE_DECIMALS)*newPoint.y)/Math.pow(10,cs.debug.COORDINATE_DECIMALS)
              +') to ('+
              Math.round(Math.pow(10,cs.debug.COORDINATE_DECIMALS)*constrained.x)/Math.pow(10,cs.debug.COORDINATE_DECIMALS)
              +','+
              Math.round(Math.pow(10,cs.debug.COORDINATE_DECIMALS)*constrained.y)/Math.pow(10,cs.debug.COORDINATE_DECIMALS)
              +')'); **/
            fs.A0597629.setPlaceholder(o,i);
          }
         },
        /* ←— switchPolygon ———————————————————————————————————————————————————→ *\
         | Adds and removes vertices and edges
         | Restyles diagonals
         | Restores coordinates
         * ←———————————————————————————————————————————————————————————————————→ */
         switchPolygon: function(){
          var o = hs.parseArgs(arguments);
          var vars = vs[o.uniqueId];
          var hlps = hxs[o.uniqueId];
          var cons = cs.A0597629;
          vars.belayCorrection = true;

          var i;

          fs.A0597629.clearPlaceholder(o);

          var prevn = vars.n;
          var n = o.value;
          vars.n = n;

          o.log("Changing from "+prevn+" sides to "+n+" sides");

          var exprs = [];

          // Delete extra vertices
          for (i = cons.MAX_VERTICES; i >= n+1; i-=1) {
            exprs.push({
              id:'vertex_'+hs.ALPHA[i],
              hidden:true,
              showLabel:false
            });
            exprs.push({
              id:'segment_'+hs.ALPHA[i]+'A',
              hidden:true
            });
            exprs.push({
                id:'segment_'+hs.ALPHA[i-1]+hs.ALPHA[i],
                hidden:true
            });
            // o.log('Deleting vertex '+hs.ALPHA[i]);
          }

          // Add new vertices
          for (i = 3; i < n; i+=1) {
            exprs.push({
              id:'vertex_'+hs.ALPHA[i+1],
              hidden:false,
              showLabel:true
            });
            exprs.push({
                id:'segment_'+hs.ALPHA[i]+'A',
                hidden:(hlps.showDiagonals.numericValue === 0),
                style:cs.keyword.lineType.DASHED,
                color:cs.color.agaColors.red
            });
            exprs.push({
                id:'segment_'+hs.ALPHA[i]+hs.ALPHA[i+1],
                hidden:false,
                style:cs.keyword.lineType.SOLID,
                color:cs.color.agaColors.black
            });
          }

          // Style terminal edge
          exprs.push({
            id:'segment_'+hs.ALPHA[n]+'A',
            hidden:false,
            style:cs.keyword.lineType.SOLID,
            color:cs.color.agaColors.black
          });

          // Update centroid and labels
          var x_centroid = 'x_{centroid}=\\frac{';
          for (i = 1; i < n; i+=1) {x_centroid+=(hs.sub('x',i)+'+');}
          x_centroid += (hs.sub('x',n)+'}{n}');
          exprs.push({
            id:'x_centroid',
            latex:x_centroid
          });
          exprs.push({
            id:'y_centroid',
            latex:x_centroid.replace(new RegExp('x','g'),'y')
          });
          exprs.push({
            id:'centroid',
            label:'n = '+n
          });
          exprs.push({
            id:'centroid-1',
            label:''+(n-2)+' triangle'+((n>3)?'s':'')
          });

          // o.log('Changed figures:',exprs);

          o.desmos.setExpressions(exprs);

          exprs = [];

          // Update coordinates
          for (i = 1; i <= n; i+=1) {
            exprs.push({
              id:'x_'+i,
              latex:hs.sub('x',i)+'='+vars[n]['x_'+i]
            });
            exprs.push({
              id:'y_'+i,
              latex:hs.sub('y',i)+'='+vars[n]['y_'+i]
            });
            //o.log('Moving vertex '+hs.ALPHA[i]+' to ('+vars[n]['x_'+i]+','+vars[n]['y_'+i]+')');
          }

          // o.log('Changed coordinates:',exprs);

          // clear observers
          for(i=1;i<=cons.MAX_VERTICES;i+=1){
            vars['x_'+i].unobserve('numericValue.correction');
            vars['y_'+i].unobserve('numericValue.correction');
          }

          if (hlps.correctionBuffer !== undefined) {
            window.clearTimeout(hlps.correctionBuffer);
          }

          o.desmos.setExpressions(exprs);

          // Reinitialize observers.
           for(i=1;i<=n;i+=1) {
            // Observe x
            vars["x_"+i].observe('numericValue.correction',hlps["x_"+i]);
            // Observe y
            vars["y_"+i].observe('numericValue.correction',hlps["y_"+i]);
           }

          hlps.correctionBuffer = window.setTimeout(function(){vars.belayCorrection = false;},cs.delay.LOAD);

         }
       };

      /* ←— A0597630 FUNCTIONS ——————————————————————————————————————————————→ */
        cs.A0597630 = {
          RADIUS: 5,
          BUFFER: 0.05,
          ANGLE_PRECISION: 2,
          HIDDEN_COLOR: '#000000',
          VERTEX_COLOR: '#000000',
          DEFAULT_VERTEX_COUNT: 5,
          EPSILON: 0.0001
         };
        fs.A0597630 = {
        /* ←— init ————————————————————————————————————————————————————————————→ *\
         | Initializes the variables
         * ←———————————————————————————————————————————————————————————————————→ */
         init: function() {
          var o = hs.parseArgs(arguments);
          delete vs[o.uniqueId];
          delete hxs[o.uniqueId];
          o = hs.parseArgs(arguments);

          var hlps = hxs[o.uniqueId];
          var vars = vs[o.uniqueId];
          var funs = fs.A0597630;
          
          // Cleanup in case of refresh
          document.removeEventListener('mouseup',funs.dragEnd);
          document.removeEventListener('touchend',funs.dragEnd);

          hlps.x_h = hlps.maker('x_h');
          hlps.y_h = hlps.maker('y_h');
          hlps.x_V = hlps.maker('x_V');
          hlps.y_V = hlps.maker('y_V');

          hlps.hash_list = hlps.maker('x_hy_h');
          hlps.hash_list.observe('listValue.findDrag',function(t,h){
            funs.findDrag(h[t],o);
          });

          funs.dragEnd = function(){
            if (vars.bounds !== undefined) {
              funs.snapBack(o);
            }
          };

          document.addEventListener('mouseup',funs.dragEnd);
          document.addEventListener('touchend',funs.dragEnd);
         },
        /* ←— findDrag ————————————————————————————————————————————————————————→ *\
         | Finds the point being dragged
         * ←———————————————————————————————————————————————————————————————————→ */
         findDrag: function(hash_list,o){
          var vars = vs[o.uniqueId];
          var funs = fs.A0597630;

          // Initialize
          if (!Array.isArray(hash_list)) {
            return;
          }

          var n = hash_list.length;

          if (vars[n] === undefined) {
            vars[n] = {};
          }
          if (vars.hash_list === undefined) {
            vars.hash_list = hash_list;
            vars.drag_index = -1;
            return;
          }

          // If the length of the list has changed,
          // we're switching polygons, not dragging
          if (n !== vars.n) {
            vars.n = n;
            vars.hash_list = hash_list;
            vars.drag_index = -1;
            return;
          }

          var new_drag_index;
          var i;

          // Find point being dragged
          for(i = 0; i < n; i += 1) {
            if (hash_list[i] !== vars.hash_list[i]) {
              new_drag_index = i;
              break;
            }
          }

          if(new_drag_index === undefined) {
            return;
          }

          vars.hash_list = hash_list;

          // Switch bounding polygon if necessary
          if (new_drag_index !== vars.drag_index) {
            o.log('Now dragging vertex '+new_drag_index);
            o.desmos.setExpression({
              id:'drag_index',
              latex:'d='+(new_drag_index+1)
            });
            funs.setBounds(new_drag_index,n,o);
            vars.drag_index = new_drag_index;
          } else {
            o.log ('Still dragging vertex '+new_drag_index);
          }

          // constrain point to polygon
          funs.constrain(o);
         },
        /* ←— setBounds ———————————————————————————————————————————————————————→ *\
         | Sets the bounding polygon for a given vertex.
         * ←———————————————————————————————————————————————————————————————————→ */
         setBounds: function(new_drag_index,n,o){
          var vars = vs[o.uniqueId];
          var hlps = hxs[o.uniqueId];

          var id_next = (new_drag_index + 1) % n;
          var id_next_next = (new_drag_index + 2) % n;
          var id_prev = (new_drag_index + n - 1) % n;
          var id_prev_prev = (new_drag_index + n - 2) % n;

          var xs = hlps.x_h.listValue;
          var ys = hlps.y_h.listValue;

          var bounds = [];

          var point_next = {x: xs[id_next], y: ys[id_next]};
          var point_next_next = {x: xs[id_next_next], y: ys[id_next_next]};
          var point_prev = {x: xs[id_prev], y: ys[id_prev]};
          var point_prev_prev = {x: xs[id_prev_prev], y: ys[id_prev_prev]};

          bounds.push(hs.lineTwoPoints(point_prev, point_next));
          bounds.push(hs.lineTwoPoints(point_next_next, point_next));
          bounds.push(hs.lineTwoPoints(point_prev, point_prev_prev));

          vars.bounds = bounds;
         },
        /* ←— snapBack ————————————————————————————————————————————————————————→ *\
         | Constrains the point being dragged to its bounding polygon constraints.
         * ←———————————————————————————————————————————————————————————————————→ */
         snapBack: function(o){
          var vars = vs[o.uniqueId];
          var hlps = hxs[o.uniqueId];
          var cons = cs.A0597630;
          var funs = fs.A0597630;

          if (!Array.isArray(vars.bounds) || vars.bounds.length < 1) {
            return;
          }

          var x_h = Array.from(hlps.x_h.listValue);
          var y_h = Array.from(hlps.y_h.listValue);

          var point = {
            x: x_h[vars.drag_index],
            y: y_h[vars.drag_index]
          };

          var newPoint = hs.polygonConstrain(point, vars.bounds, cons.BUFFER);

          x_h[vars.drag_index] = newPoint.x;
          y_h[vars.drag_index] = newPoint.y;

          hlps.hash_list.unobserve('listValue.findDrag');
          hlps.hash_list.observe('listValue.startFind',function(t,h){
            h.unobserve(t+'.startFind');
            h.observe(t+'.findDrag',function(t,h){
              funs.findDrag(h[t],o);
            });
          });

          o.desmos.setExpression({
            id:'handles',
            type:'table',
            columns:[
              {
                latex:'x_h',
                values:x_h.map(function(e){return e.toFixed(10);})
              },
              {
                latex: 'y_h',
                values: y_h.map(function(e){return e.toFixed(10);}),
                color: '#000000',
                dragMode: Desmos.DragModes.XY
              }
            ]
          });
         },
        /* ←— constrain ———————————————————————————————————————————————————————→ *\
         | Constrains the point being dragged to its bounding polygon constraints.
         * ←———————————————————————————————————————————————————————————————————→ */
         constrain: function(o){
          var vars = vs[o.uniqueId];
          var hlps = hxs[o.uniqueId];
          var cons = cs.A0597630;

          vars[vars.n].x_V = Array.from(hlps.x_h.listValue);
          vars[vars.n].y_V = Array.from(hlps.y_h.listValue);

          var point = {
            x: vars[vars.n].x_V[vars.drag_index],
            y: vars[vars.n].y_V[vars.drag_index]
          };

          var newPoint = hs.polygonConstrain(point, vars.bounds, cons.BUFFER);

          vars[vars.n].x_V[vars.dragIndex] = newPoint.x;
          vars[vars.n].y_V[vars.dragIndex] = newPoint.y;

          if (newPoint.x === point.x && newPoint.y === point.y) {
            if (vars.valid === true) {
              // Vertices are already following handles
              return;
            } else {
              vars.valid = true;
            }
            newPoint.x = 'x_h\\left[d\\right]';
            newPoint.y = 'y_h\\left[d\\right]';
          } else {
            vars.valid = false;
          }

          o.desmos.setExpressions([
            {
              id:'projected_x',
              latex:'x_d='+newPoint.x
            },
            {
              id:'projected_y',
              latex:'y_d='+newPoint.y
            }
          ]);
         },
        /* ←— changePolygon ———————————————————————————————————————————————————→ *\
         | Changes the number of vertices.
         * ←———————————————————————————————————————————————————————————————————→ */
         changePolygon: function() {
          var o = hs.parseArgs(arguments);
          var vars = vs[o.uniqueId];
          var hlps = hxs[o.uniqueId];
          var cons = cs.A0597630;
          var funs = fs.A0597630;

          // First, save the locations of the current polygon's vertices.
          var n = hlps.x_V.listValue.length;
          if (vars[n] === undefined) {
            vars[n] = {};
          }
          vars[n].x_V = Array.from(hlps.x_V.listValue);
          vars[n].y_V = Array.from(hlps.y_V.listValue);

          n = o.value;
          var delta_theta = 2 * Math.PI / n;
          var x_h;
          var y_h;
          var i;

          // Pick up saved vertices if possible
          // otherwise generate new regular polygon.
          if (false && vars[n] !== undefined && vars[n].x_V !== undefined) {
            x_h = vars[n].x_V;
            y_h = vars[n].y_V;
          } else {
            x_h = [];
            y_h = [];

            for (i=0; i < n; i += 1) {
              x_h.push(cons.RADIUS * Math.sin(i * delta_theta));
              y_h.push(cons.RADIUS * Math.cos(i * delta_theta));
            }

            vars[n] = {
              x_V: x_h,
              y_V: y_h
            };
          }


          // Coordinates will be changing from switching polygons
          // Don't count the first change as dragging
          hlps.hash_list.unobserve('listValue.findDrag');
          hlps.hash_list.observe('listValue.startFind',function(t,h){
            h.unobserve(t+'.startFind');
            // funs.snapBack(o); // ensure the new coordinates work
            h.observe(t+'.findDrag',function(t,h){
              funs.findDrag(h[t],o);
            });
          });

          // Change handles' coordinates to match loaded/generated polygon
          // Change "dragged" vertex to match corresponding handle
          o.desmos.setExpressions([
            {
              id:'handles',
              type:'table',
              columns:[
                {
                  latex:'x_h',
                  values:x_h.map(function(e){return e.toFixed(10);})
                },
                {
                  latex: 'y_h',
                  values: y_h.map(function(e){return e.toFixed(10);}),
                  color: '#000000',
                  dragMode: Desmos.DragModes.XY
                }
              ]
            },
            {
              id:'projected_x',
              latex:'x_d=x_h\\left[d\\right]'
            },
            {
              id:'projected_y',
              latex:'y_d=y_h\\left[d\\right]'
            }
          ]);
         }
        };
      /* ←— OLD A0597630 FUNCTIONS ——————————————————————————————————————————————→ */
        cs.A0597630_bak = {
          MAX_VERTICES:14,
          RADIUS:5,
          INITIAL_COORDINATES_PRECISION:6,
          ANGLE_PRECISION:2,
          DRAG_BUFFER:0.25,
          DRAG_BUFFER_REBOUND:0.1, // How much to bounce back when going past the buffer
          SEGMENT_TEMPLATE:'\\left(x_U\\left(1-t\\right)+x_Vt,y_U\\left(1-t\\right)+y_Vt\\right)',
          MEASURE_TEMPLATE:'m_U=\\theta_{LVL}\\left(W,U,Z\\right)',
          LABEL_TEMPLATE:'W_{label}=P_{xyrt}\\left(xU,yU,\\frac{3}{2}t_{ick},\\theta_{xy}\\left(xZ-xU,yZ-yU\\right)-\\frac{\\theta_{LVL}\\left(S,W,Q\\right)}{2}\\right)',
          HIDDEN_COLOR:'#000000', // white is close enough to hidden
          VERTEX_COLOR:'#000000'
         };
       fs.A0597630_bak = {
        /* ←— init ————————————————————————————————————————————————————————————→ *\
         | Initializes the variables
         * ←———————————————————————————————————————————————————————————————————→ */
         init: function() {
          var o = hs.parseArgs(arguments);
          var vars = vs[o.uniqueId];
          mergeObjects(vars,{lastDragged:0,placeholder:0});
          var hlps = hxs[o.uniqueId];
          if(hlps.n === undefined) {
            hlps.n = hlps.maker({latex:'n'});
          }
          o.log(hlps);
          var cons = cs.A0597630_bak;
          var funs = fs.A0597630_bak;

          var i;
          var j;
          var n;

          vars.belayCorrection = true;


          // Set up watchers for each vertex of each polygon
           for(i=1;i<=cons.MAX_VERTICES;i+=1) {
            if (vars[i] === undefined) {
              vars["x_"+i] = hlps.maker({latex:hs.sub('x',i)});
              vars["y_"+i] = hlps.maker({latex:hs.sub('y',i)});
              vars[i]={};
            }
           }

          // Initialize Vertices
           if (hlps.n.numericValue === undefined) {
            o.log('n not yet initialized; delaying initialization by '+cs.delay.SET_EXPRESSION+'ms');
            setTimeout(function(){funs.init(o);},cs.delay.SET_EXPRESSION);
            return;
           }

           vars.n = hlps.n.numericValue;
           n = vars.n;
           
           function loopFunc() {
            funs.init(o);
           }

           for(i=1;i<=cons.MAX_VERTICES;i+=1) {
            if (i >= 3) {
              for(j=1;j<=i;j+=1) {
                if (i === n) {
                  if (vars['x_'+j].numericValue === undefined || vars['y_'+j].numericValue === undefined) {
                    o.log('Vertex '+hs.ALPHA[j]+' not yet initialized; delaying initialization by '+cs.delay.SET_EXPRESSION+'ms');
                    setTimeout(loopFunc,cs.delay.SET_EXPRESSION);
                    return;
                  }
                  // Initialize active polygon to current state
                  vars[i]['x_'+j] = vars['x_'+j].numericValue;
                  vars[i]['y_'+j] = vars['y_'+j].numericValue;
                } else if (vars[i]['x_'+j] === undefined || vars[i]['y_'+j] === undefined) {
                  // Initialize inactive polygons to default
                  vars[i]['x_'+j] = cons.RADIUS*Math.round(Math.pow(10,cons.INITIAL_COORDINATES_PRECISION)*Math.sin(2*Math.PI*((j-1)/i)))/Math.pow(10,cons.INITIAL_COORDINATES_PRECISION);
                  vars[i]['y_'+j] = cons.RADIUS*Math.round(Math.pow(10,cons.INITIAL_COORDINATES_PRECISION)*Math.cos(2*Math.PI*((j-1)/i)))/Math.pow(10,cons.INITIAL_COORDINATES_PRECISION);
                }
               }
            }
           }

          // Initialize angles and set observers
           vars.polygonName = 'polygonABC';
           vars.polygonABC_angles = {A:60,B:60,C:60};
           function changeFunc(varName,i){
            return function(){
              funs.coordinateChanged({
                name:hs.sub(varName,i),
                value:vars[varName+'_'+i].numericValue,
                desmos:o.desmos,
                uniqueId:o.uniqueId,
                log:o.log
                });
            };
           }
           var newPoly;

           for(i=1;i<=cons.MAX_VERTICES;i+=1) {
            // Set up polygon angle values for the polygon terminating in this vertex
            if (i > 3) {
              newPoly = mergeObjects({},vars[vars.polygonName+'_angles']);
              newPoly[hs.ALPHA[i]]=0;
              vars.polygonName+=hs.ALPHA[i];
              vars[vars.polygonName+'_angles'] = newPoly;
              vars[vars.polygonName+'_vertices'] = vars[i];
              o.log('Initializing '+vars.polygonName+' with angles:',vars[vars.polygonName+'_angles']);
            }
            // Set up observers for when the user drags a point
            hlps["x_"+i] = changeFunc('x',i);
            hlps['y_'+i] = changeFunc('y',i);
            vars["x_"+i].observe('numericValue.correction',hlps['x_'+i]);
            vars['y_'+i].observe('numericValue.correction',hlps['y_'+i]);
            o.log('Vertex '+hs.ALPHA[i]+' initialized at ('+vars['x_'+i].numericValue+', '+vars['y_'+i].numericValue+')');
           }
           vars.polygonName = vars.polygonName.slice(0,7+n);

           var asquared;
           var bsquared;
           var csquared;
           for (i = 1; i <= n; i+=1) {
            asquared = Math.pow(vars[n]['x_'+((i+n-2)%n+1)]-vars[n]['x_'+i],2)+Math.pow(vars[n]['y_'+((i+n-2)%n+1)]-vars[n]['y_'+i],2);
            bsquared = Math.pow(vars[n]['x_'+(i%n+1)]-vars[n]['x_'+i],2)+Math.pow(vars[n]['y_'+(i%n+1)]-vars[n]['y_'+i],2);
            csquared = Math.pow(vars[n]['x_'+((i+n-2)%n+1)]-vars[n]['x_'+(i%n+1)],2)+Math.pow(vars[n]['y_'+((i+n-2)%n+1)]-vars[n]['y_'+(i%n+1)],2);
            vars['P_'+hs.ALPHA[i]] = 180*Math.acos((asquared+bsquared-csquared)/(2*Math.sqrt(asquared*bsquared)))/Math.PI;
           }

           fs.shared.label.labelPolyAngles(o,{refreshAll:true},cons.ANGLE_PRECISION);

          var expr = '';
          for (j = 1;j <= n;j+=1) {expr+=((vars[vars.polygonName+'_angles'][hs.ALPHA[j]]/Math.pow(10,cons.ANGLE_PRECISION))+'+');}
          expr = expr.slice(0,expr.length-1);
          o.desmos.setExpressions([{id:'sum',latex:expr},
            {
              id:'centroid-1',
              label:'180'/*+'°'*/+'⋅('+n+' − 2) = '+(180*(n-2))/*+'°'*/
            },
            {
              id:'centroid',
              label:hs.latexToText(expr+'='+(180*(n-2)))
            },{id:'product',latex:'180\\left('+n+'-2\\right)'}]);

          hlps.n.observe('numericValue.switchingPolygon',function(){
            funs.switchPolygon({
              name:'n',
              value:hlps.n.numericValue,
              desmos:o.desmos,
              uniqueId:o.uniqueId,
              log:o.log
            });
          });

          // prepare to clear placeholders
          document.addEventListener('mouseup',function(){funs.clearPlaceholder(o);});
          document.addEventListener('touchend',function(){funs.clearPlaceholder(o);});
        
          o.log("Observers initialized:",vars);

          hlps.correctionBuffer = window.setTimeout(function(){
            // set up the initial angles
            fs.shared.label.labelPolyAngles(o,{refreshAll:true},cons.ANGLE_PRECISION);

            vars.belayCorrection = false;
          },cs.delay.LOAD);
         },
        /* ←— setPlaceholder ——————————————————————————————————————————————————→ *\
         | Attaches all segments from a vertex to the placeholder vertex
         * ←———————————————————————————————————————————————————————————————————→ */
         setPlaceholder: function(options,i) {
          if(i === undefined) {
            i = 0;
          }
          var o = hs.parseArgs([(options || {})]);
          var vars = vs[o.uniqueId];
          var n = vars.n;

          var j;

          // move the placeholder to the location of the vertex to hold place
          o.desmos.setExpression({id:'x_0',latex:'x_0='+Math.round(vars[n]['x_'+i]*Math.pow(10,cs.precision.FLOAT_PRECISION))/Math.pow(10,cs.precision.FLOAT_PRECISION)});
          o.desmos.setExpression({id:'y_0',latex:'y_0='+Math.round(vars[n]['y_'+i]*Math.pow(10,cs.precision.FLOAT_PRECISION))/Math.pow(10,cs.precision.FLOAT_PRECISION)});

          if (i === vars.placeholder) {return;} // The rest of this stuff only needs to be done the first time

          o.log('Adding placeholder '+hs.ALPHA[i]);

          vars.placeholder = i;
          var cons = cs.A0597630_bak;

          // make the placeholder visible, and the dragged vertex invisible
          o.desmos.setExpression({id:'placeholder_vertex',hidden:false,showLabel:true,label:hs.ALPHA[i],dragMode:Desmos.DragModes.NONE});
          o.desmos.setExpression({id:'vertex_'+hs.ALPHA[i],showLabel:false,color:cons.HIDDEN_COLOR});

          // Attach the angle label to the placeholder
          o.desmos.setExpression({
            id:'m_'+hs.ALPHA[i],
            latex:cons.LABEL_TEMPLATE.replace(new RegExp('U','g'),hs.sub('',0)).replace(new RegExp('Z','g'),hs.sub('',i%n+1)).replace(new RegExp('W','g'),'P').replace(new RegExp('Q','g'),hs.ALPHA[(i+n-2)%n+1]).replace(new RegExp('S','g'),hs.ALPHA[i%n+1]).replace(new RegExp('P_\\{label','g'),hs.ALPHA[i]+'_{label')
          });
          o.desmos.setExpression({
            id:'m_'+hs.ALPHA[(i+n-2)%n+1],
            latex:cons.LABEL_TEMPLATE.replace(new RegExp('U','g'),hs.sub('',((i+n-2)%n+1))).replace(new RegExp('Z','g'),hs.sub('',0)).replace(new RegExp('W','g'),hs.ALPHA[(i+n-2)%n+1]).replace(new RegExp('Q','g'),'P').replace(new RegExp('S','g'),hs.ALPHA[(i+n-3)%n+1]).replace(new RegExp('P_\\{label','g'),hs.ALPHA[(i+n-2)%n+1]+'_{label')
          });
          o.desmos.setExpression({
            id:'m_'+hs.ALPHA[i%n+1],
            latex:cons.LABEL_TEMPLATE.replace(new RegExp('U','g'),hs.sub('',i%n+1)).replace(new RegExp('Z','g'),hs.sub('',(i+1)%n+1)).replace(new RegExp('W','g'),hs.ALPHA[i%n+1]).replace(new RegExp('Q','g'),hs.ALPHA[(i+1)%n+1]).replace(new RegExp('S','g'),'P').replace(new RegExp('P_\\{label','g'),hs.ALPHA[i%n+1]+'_{label')
          });

          // Attach the vertex to its edges and diagonals
          if (i === 1) {
            // Attach placeholder to B
            o.desmos.setExpression({
              id:'segment_AB',
              latex:cons.SEGMENT_TEMPLATE.replace(new RegExp('U','g'),'0').replace(new RegExp('V','g'),'2')
            });
            // Attach every other vertex to placeholder
            for (j = 3;j<=n;j+=1) {
              o.desmos.setExpression({
                id:'segment_'+hs.ALPHA[j]+'A',
                latex:cons.SEGMENT_TEMPLATE.replace(new RegExp('([xy])_U','g'),hs.sub('$1',j)).replace(new RegExp('V','g'),'0')
              });
            }
          } else {
            if (i === 2) {
              o.desmos.setExpression({
                id:'segment_AB',
                latex:cons.SEGMENT_TEMPLATE.replace(new RegExp('U','g'),'0').replace(new RegExp('V','g'),'1')
              });
            } else {
              // attach to previous vertex
              o.desmos.setExpression({
                id:'segment_'+hs.ALPHA[i-1]+hs.ALPHA[i],
                latex:cons.SEGMENT_TEMPLATE.replace(new RegExp('([xy])_U','g'),hs.sub('$1',i-1)).replace(new RegExp('V','g'),'0')
              });
              // attach diagonal to A
              if (2 < i && i < n) {
                o.desmos.setExpression({
                  id:'segment_'+hs.ALPHA[i]+'A',
                  latex:cons.SEGMENT_TEMPLATE.replace(new RegExp('U','g'),'0').replace(new RegExp('V','g'),'1')
                });
              }
            }
            // Attach to the next vertex
            o.desmos.setExpression({
              id:'segment_'+hs.ALPHA[i]+hs.ALPHA[i%n+1],
              latex:cons.SEGMENT_TEMPLATE.replace(new RegExp('U','g'),'0').replace(new RegExp('([xy])_V','g'),hs.sub('$1',i%n+1))
            });
          }
         },
        /* ←— clearPlaceholder ————————————————————————————————————————————————→ *\
         | moves the last dragged vertex back to the placeholder vertex's location
         |
         * ←———————————————————————————————————————————————————————————————————→ */
         clearPlaceholder: function(){
          var o = hs.parseArgs(arguments);
          var vars = vs[o.uniqueId];
          var hlps = hxs[o.uniqueId];
          var cons = cs.A0597630_bak;
          var i = vars.placeholder;
          var n = vars.n;

          var j;

          if (i === 0) {return;} // if it ain't broke, don't fix it

          o.log('Now clearing placeholder '+hs.ALPHA[i]);

          // Don't recorrect while clearing the placeholder
          if (hlps.correctionBuffer !== undefined) {window.clearTimeout(hlps.correctionBuffer);}
          vars.belayCorrection = true;

          // Move the place-held point to the placeholder
          o.desmos.setExpression({id:'x_'+i,latex:hs.sub('x',i)+'='+Math.round(vars[n]['x_'+i]*Math.pow(10,cs.precision.FLOAT_PRECISION))/Math.pow(10,cs.precision.FLOAT_PRECISION)});
          o.desmos.setExpression({id:'y_'+i,latex:hs.sub('y',i)+'='+Math.round(vars[n]['y_'+i]*Math.pow(10,cs.precision.FLOAT_PRECISION))/Math.pow(10,cs.precision.FLOAT_PRECISION)});

          // Detach the angle label from the placeholder
          o.desmos.setExpression({
              id:'m_'+hs.ALPHA[i],
              latex:cons.LABEL_TEMPLATE.replace(new RegExp('U','g'),hs.sub('',i)).replace(new RegExp('Z','g'),hs.sub('',i%n+1)).replace(new RegExp('W','g'),hs.ALPHA[i]).replace(new RegExp('Q','g'),hs.ALPHA[(i+n-2)%n+1]).replace(new RegExp('S','g'),hs.ALPHA[i%n+1])
          });
          o.desmos.setExpression({
            id:'m_'+hs.ALPHA[(i+n-2)%n+1],
            latex:cons.LABEL_TEMPLATE.replace(new RegExp('U','g'),hs.sub('',((i+n-2)%n+1))).replace(new RegExp('Z','g'),hs.sub('',i)).replace(new RegExp('W','g'),hs.ALPHA[(i+n-2)%n+1]).replace(new RegExp('Q','g'),hs.ALPHA[i]).replace(new RegExp('S','g'),hs.ALPHA[(i+n-3)%n+1]).replace(new RegExp('P_\\{label','g'),hs.ALPHA[(i+n-2)%n+1]+'_{label')
          });
          o.desmos.setExpression({
            id:'m_'+hs.ALPHA[i%n+1],
            latex:cons.LABEL_TEMPLATE.replace(new RegExp('U','g'),hs.sub('',i%n+1)).replace(new RegExp('Z','g'),hs.sub('',(i+1)%n+1)).replace(new RegExp('W','g'),hs.ALPHA[i%n+1]).replace(new RegExp('Q','g'),hs.ALPHA[(i+1)%n+1]).replace(new RegExp('S','g'),hs.ALPHA[i]).replace(new RegExp('P_\\{label','g'),hs.ALPHA[i%n+1]+'_{label')
          });

          hlps.correctionBuffer = window.setTimeout(function(){vars.belayCorrection = false;},cs.delay.SET_EXPRESSION);

          // Make the place-held point visible, and the placeholder invisible
          o.desmos.setExpression({id:'placeholder_vertex',hidden:true,showLabel:false});
          o.desmos.setExpression({id:'vertex_'+hs.ALPHA[i],showLabel:true,color:cons.VERTEX_COLOR});

          // Attach the vertex to its edges and diagonals
          if (i === 1) {
            // Attach A to B
            o.desmos.setExpression({
              id:'segment_AB',
              latex:cons.SEGMENT_TEMPLATE.replace(new RegExp('U','g'),'1').replace(new RegExp('V','g'),'2')
            });
            // Attach A to every other vertex
            for (j = 3;j<=n;j+=1) {
              o.desmos.setExpression({
                id:'segment_'+hs.ALPHA[j]+'A',
                latex:cons.SEGMENT_TEMPLATE.replace(new RegExp('([xy])_U','g'),hs.sub('$1',j)).replace(new RegExp('V','g'),'1')
              });
            }
          } else {
            if (i === 2) {
              o.desmos.setExpression({
                id:'segment_AB',
                latex:cons.SEGMENT_TEMPLATE.replace(new RegExp('U','g'),'1').replace(new RegExp('V','g'),'2')
              });
            } else {
              // attach to previous vertex
              o.desmos.setExpression({
                id:'segment_'+hs.ALPHA[i-1]+hs.ALPHA[i],
                latex:cons.SEGMENT_TEMPLATE.replace(new RegExp('([xy])_U','g'),hs.sub('$1',i-1)).replace(new RegExp('([xy])_V','g'),hs.sub('$1',i))
              });
              // attach diagonal to A
              o.desmos.setExpression({
                  id:'segment_'+hs.ALPHA[i]+'A',
                  latex:cons.SEGMENT_TEMPLATE.replace(new RegExp('([xy])_U','g'),hs.sub('$1',i)).replace(new RegExp('V','g'),'1')
                });
            }
            // Attach to the next vertex
            o.desmos.setExpression({
              id:'segment_'+hs.ALPHA[i]+hs.ALPHA[i%n+1],
              latex:cons.SEGMENT_TEMPLATE.replace(new RegExp('([xy])_U','g'),hs.sub('$1',i)).replace(new RegExp('([xy])_V','g'),hs.sub('$1',i%n+1))
            });
          }

          vars.placeholder = 0;
         },
        /* ←— coordinateChanged ———————————————————————————————————————————————→ *\
         | updates variables, and corrects if the user tries to cross diagonals
         * ←———————————————————————————————————————————————————————————————————→ */
         coordinateChanged: function(){
          var o = hs.parseArgs(arguments);
          var vars = vs[o.uniqueId];
          var cons = cs.A0597630_bak;
          var funs = fs.A0597630_bak;
          if (vars.belayCorrection === true) {
            o.log('Belaying order to correct '+o.name);
            return;
          }
          var n = vars.n;
          var i = +(o.name.match(new RegExp('[0-9]+'))[0]);
          var newPoint = {x:vars['x_'+i].numericValue,y:vars['y_'+i].numericValue};

          if (i !== vars.lastDragged) {
            o.log('Now dragging n='+n+',i='+i);
            vars.lastDragged = i;

            // First, put the last dragged vertex back.
            funs.clearPlaceholder(o);

            // Now create a list of all the new boundaries
            vars.dragBoundaries = [];
            // Bind by the 2-previous edge
            vars.dragBoundaries.push(hs.lineTwoPoints(
                {x:vars[n]['x_'+((n+i-2)%n+1)],y:vars[n]['y_'+((n+i-2)%n+1)]},
                {x:vars[n]['x_'+((n+i-3)%n+1)],y:vars[n]['y_'+((n+i-3)%n+1)]}
              ));

            // Bind by the in-between edge
            vars.dragBoundaries.push(hs.lineTwoPoints(
                {x:vars[n]['x_'+((n+i-2)%n+1)],y:vars[n]['y_'+((n+i-2)%n+1)]},
                {x:vars[n]['x_'+(i%n+1)],y:vars[n]['y_'+(i%n+1)]}
              ));

            // Bind by the 2-next edge
            vars.dragBoundaries.push(hs.lineTwoPoints(
                {x:vars[n]['x_'+((i+1)%n+1)],y:vars[n]['y_'+((i+1)%n+1)]},
                {x:vars[n]['x_'+(i%n+1)],y:vars[n]['y_'+(i%n+1)]}
              ));

            o.log('Now constraining by:',vars.dragBoundaries);

            if (o.log === console.log) {
              vars.dragBoundaries.forEach(function(line,id) {
                o.desmos.setExpression({id:'boundary'+id,latex:'b_'+id+'\\left(x,y\\right)='+line.a+'x+'+line.b+'y+'+line.c});
              });
            }
          }

          var constrained = hs.polygonConstrain(newPoint,vars.dragBoundaries);

          if (constrained !== null) {
            vars[n]['x_'+i] = constrained.x;
            vars[n]['y_'+i] = constrained.y;
          }

          [(i+n-2)%n+1,i,i%n+1].forEach(function(j) {
            var asquared = Math.pow(vars[n]['x_'+((j+n-2)%n+1)]-vars[n]['x_'+j],2)+Math.pow(vars[n]['y_'+((j+n-2)%n+1)]-vars[n]['y_'+j],2);
            var bsquared = Math.pow(vars[n]['x_'+(j%n+1)]-vars[n]['x_'+j],2)+Math.pow(vars[n]['y_'+(j%n+1)]-vars[n]['y_'+j],2);
            var csquared = Math.pow(vars[n]['x_'+((j+n-2)%n+1)]-vars[n]['x_'+(j%n+1)],2)+Math.pow(vars[n]['y_'+((j+n-2)%n+1)]-vars[n]['y_'+(j%n+1)],2);
            vars['P_'+hs.ALPHA[j]] = 180*Math.acos((asquared+bsquared-csquared)/(2*Math.sqrt(asquared*bsquared)))/Math.PI;
          });

          fs.shared.label.labelPolyAngles(mergeObjects({},o,{name:'m_'+hs.ALPHA[i],value:vars['P_'+hs.ALPHA[i]]}),{},cons.ANGLE_PRECISION);

          var expr = '';
          var j;
          for (j = 1;j <= n;j+=1) {expr+=((vars[vars.polygonName+'_angles'][hs.ALPHA[j]]/Math.pow(10,cons.ANGLE_PRECISION))+'+');}
          expr = expr.slice(0,expr.length-1);
          o.desmos.setExpressions([{id:'sum',latex:expr},
            {
              id:'centroid-1',
              label:'180'/*+'°'*/+'⋅('+n+' − 2) = '+(180*(n-2))/*+'°'*/
            },
            {
              id:'centroid',
              label:hs.latexToText(expr+'='+(180*(n-2)))
            },{id:'product',latex:'180\\left('+n+'-2\\right)'}]);

          if (constrained === newPoint) {
            funs.clearPlaceholder(o);
          } else {
            funs.setPlaceholder(o,i);
          }
         },
        /* ←— switchPolygon ———————————————————————————————————————————————————→ *\
         | Adds and removes vertices and edges
         | Restyles diagonals
         | Restores coordinates
         * ←———————————————————————————————————————————————————————————————————→ */
         switchPolygon: function(){
          var o = hs.parseArgs(arguments);
          var vars = vs[o.uniqueId];
          var hlps = hxs[o.uniqueId];
          var cons = cs.A0597630_bak;
          var funs = fs.A0597630_bak;
          vars.belayCorrection = true;

          var i;
          var j;

          funs.clearPlaceholder(o);

          var prevn = vars.n;
          var n = o.value;
          vars.n = n;
          var polyNames = 'polygonABCDEFGHIJKLMNOPQRSTUVWXYZ';
          vars.polygonName = polyNames.slice(0,7+n);

          o.log("Changing from "+prevn+" sides to "+n+" sides");

          var exprs = [];

          // Move terminal vertex
           exprs.push({
            id:'segment_'+hs.ALPHA[prevn]+'A',
            hidden:true
           });
           exprs.push({
            id:'m_A',
            latex:cons.LABEL_TEMPLATE.replace(new RegExp('U','g'),hs.sub('',1)).replace(new RegExp('Z','g'),hs.sub('',2)).replace(new RegExp('W','g'),'A').replace(new RegExp('Q','g'),hs.ALPHA[n]).replace(new RegExp('S','g'),'B')
           });

          // Delete extra vertices
           for (i = cons.MAX_VERTICES; i >= n+1; i-=1) {
            exprs.push({
              id:'vertex_'+hs.ALPHA[i],
              hidden:true,
              showLabel:false
            });
            exprs.push({
              id:'segment_'+hs.ALPHA[i-1]+hs.ALPHA[i],
              hidden:true
            });
            exprs.push({
              id:'m_'+hs.ALPHA[i],
              showLabel:false
            });
            // o.log('Deleting vertex '+hs.ALPHA[i]);
           }

          // Add new vertices
           for (i = 3; i <= n; i+=1) {
            exprs.push({
              id:'vertex_'+hs.ALPHA[i%n+1],
              hidden:false,
              showLabel:true
            });
            exprs.push({
              id:'segment_'+hs.ALPHA[i]+hs.ALPHA[i%n+1],
              hidden:false
            });
            o.log(cons.LABEL_TEMPLATE.replace(new RegExp('U','g'),hs.sub('',i)).replace(new RegExp('Z','g'),hs.sub('',i%n+1)).replace(new RegExp('W','g'),hs.ALPHA[i]).replace(new RegExp('Q','g'),hs.ALPHA[(i+n-2)%n+1]).replace(new RegExp('S','g'),hs.ALPHA[i%n+1]));
            exprs.push({
              id:'m_'+hs.ALPHA[i],
              showLabel:true,
              latex:cons.LABEL_TEMPLATE.replace(new RegExp('U','g'),hs.sub('',i)).replace(new RegExp('Z','g'),hs.sub('',i%n+1)).replace(new RegExp('W','g'),hs.ALPHA[i]).replace(new RegExp('Q','g'),hs.ALPHA[(i+n-2)%n+1]).replace(new RegExp('S','g'),hs.ALPHA[i%n+1])
            });
           }

          // Update centroid and labels
           var x_centroid = 'x_{centroid}=\\frac{';
           for (i = 1; i < n; i+=1) {x_centroid+=(hs.sub('x',i)+'+');}
           x_centroid += (hs.sub('x',n)+'}{n}');
           exprs.push({
            id:'x_centroid',
            latex:x_centroid
           });
           exprs.push({
            id:'y_centroid',
            latex:x_centroid.replace(new RegExp('x','g'),'y')
           });
           // exprs.push({
           //  id:'centroid',
           //  label:'180'/*+'°'*/+'⋅('+n+' − 2) = '+(180*(n-2))/*+'°'*/
           // });
           // exprs.push({
           //  id:'centroid-1',
           //  label:' ' // Placeholder (TK)
           // });

          // o.log('Changed figures:',exprs);

          o.desmos.setExpressions(exprs);

          var asquared;
          var bsquared;
          var csquared;

          for (i = 1; i <= n; i+=1) {
            asquared = Math.pow(vars[n]['x_'+((i+n-2)%n+1)]-vars[n]['x_'+i],2)+Math.pow(vars[n]['y_'+((i+n-2)%n+1)]-vars[n]['y_'+i],2);
            bsquared = Math.pow(vars[n]['x_'+(i%n+1)]-vars[n]['x_'+i],2)+Math.pow(vars[n]['y_'+(i%n+1)]-vars[n]['y_'+i],2);
            csquared = Math.pow(vars[n]['x_'+((i+n-2)%n+1)]-vars[n]['x_'+(i%n+1)],2)+Math.pow(vars[n]['y_'+((i+n-2)%n+1)]-vars[n]['y_'+(i%n+1)],2);
            vars['P_'+hs.ALPHA[i]] = 180*Math.acos((asquared+bsquared-csquared)/(2*Math.sqrt(asquared*bsquared)))/Math.PI;
          }

          fs.shared.label.labelPolyAngles(o,{refreshAll:true},cons.ANGLE_PRECISION);

          var expr = '';
          for (j = 1;j <= n;j+=1) {expr+=((vars[vars.polygonName+'_angles'][hs.ALPHA[j]]/Math.pow(10,cons.ANGLE_PRECISION))+'+');}
          expr = expr.slice(0,expr.length-1);
          o.desmos.setExpressions([
            {id:'sum',latex:expr},
            {
              id:'centroid',
              label:hs.latexToText(expr+'='+(180*(n-2)))
            },
            {id:'product',latex:'180\\left('+n+'-2\\right)'},
            {
              id:'centroid-1',
              label:'180'/*+'°'*/+'⋅('+n+' − 2) = '+(180*(n-2))/*+'°'*/
            }
            ]);

          exprs = [];

          // Update coordinates
          for (i = 1; i <= n; i+=1) {
            exprs.push({
              id:'x_'+i,
              latex:hs.sub('x',i)+'='+vars[n]['x_'+i]
            });
            exprs.push({
              id:'y_'+i,
              latex:hs.sub('y',i)+'='+vars[n]['y_'+i]
            });
            // Prevent correction from kicking in
            vars['x_'+i].numericValue = vars[n]['x_'+i];
            vars['y_'+i].numericValue = vars[n]['y_'+i];
            //o.log('Moving vertex '+hs.ALPHA[i]+' to ('+vars[n]['x_'+i]+','+vars[n]['y_'+i]+')');
          }
          // o.log('Changed coordinates:',exprs);

          if (hlps.correctionBuffer !== undefined) {window.clearTimeout(hlps.correctionBuffer);}

          o.desmos.setExpressions(exprs);

          hlps.correctionBuffer = window.setTimeout(function(){
            vars.belayCorrection = false;
          },cs.delay.LOAD);

         }
       };

      /* ←— A0597631 FUNCTIONS ——————————————————————————————————————————————→ */
       fs.A0597631 = {
        /* ←— equation ——————————————————————————————————————————————————————→ *\
         | Updates the equation (expression) with the new value of `n`
         * ←—————————————————————————————————————————————————————————————————→ */
         equation: function(){
          var o = hs.parseArgs(arguments);
          o.desmos.setExpression({id:'equation',latex:'\\frac{180\\left('+o.value+'-2\\right)}{'+o.value+'}'});
          o.desmos.setExpression({id:'centroid',label:hs.latexToText('180⋅\\left('+o.value+'-2\\right)÷'+o.value+'='+(Math.round(18000*(o.value-2)/o.value)/100))});
         }
       };

      /* ←— A0597634 FUNCTIONS ——————————————————————————————————————————————→ */
        cs.A0597634 = {
          MAX_VERTICES:14,
          RADIUS:4,
          EXTENSION_LENGTH:3, // in ticks
          INITIAL_COORDINATES_PRECISION:6,
          ANGLE_PRECISION:2,
          DRAG_BUFFER:0.25,
          DRAG_BUFFER_REBOUND:0.1, // How much to bounce back when going past the buffer
          SEGMENT_TEMPLATE:'\\left(x_U\\left(1-t\\right)+x_Vt,y_U\\left(1-t\\right)+y_Vt\\right)',
          EXTENSION_TEMPLATE:'\\left(xU+\\left(xU-xV\\right)\\frac{Wt_{ick}}{\\operatorname{distance}\\left(Z,Q\\right)}t,yU+\\left(yU-yV\\right)\\frac{Wt_{ick}}{\\operatorname{distance}\\left(Z,Q\\right)}t\\right)',
          MEASURE_TEMPLATE:'m_U=\\theta_{LVL}\\left(W,U,Z\\right)',
          LABEL_TEMPLATE:'W_{label}=P_{xyrt}\\left(xU,yU,\\frac{3}{2}t_{ick},\\theta_{xy}\\left(xZ-xU,yZ-yU\\right)+90-\\frac{\\theta_{LVL}\\left(S,W,Q\\right)}{2}\\right)',
          HIDDEN_COLOR:'#000000', // white is close enough to hidden
          VERTEX_COLOR:'#000000'
         };
       fs.A0597634 = {
        /* ←— init ————————————————————————————————————————————————————————————→ *\
         | Initializes the variables
         * ←———————————————————————————————————————————————————————————————————→ */
         init: function() {
          var o = hs.parseArgs(arguments);
          var vars = vs[o.uniqueId];
          mergeObjects(vars,{lastDragged:0,placeholder:0});
          var hlps = hxs[o.uniqueId];
          if (hlps.n === undefined) {
            hlps.n = hlps.maker({latex:'n'});
          }
          var cons = cs.A0597634;
          cons.EXTENSION_TEMPLATE = cons.EXTENSION_TEMPLATE.replace(new RegExp('W','g'),cons.EXTENSION_LENGTH);

          var i;
          var j;

          vars.belayCorrection = true;

          // Set up watchers for each vertex of each polygon
           for(i=1;i<=cons.MAX_VERTICES;i+=1) {
            if (vars[i] === undefined) {
              vars["x_"+i] = hlps.maker({latex:hs.sub('x',i)});
              vars["y_"+i] = hlps.maker({latex:hs.sub('y',i)});
              vars[i]={};
            }
           }

          // Initialize Vertices
           if (hlps.n.numericValue === undefined) {
            o.log('n not yet initialized; delaying initialization by '+cs.delay.SET_EXPRESSION+'ms');
            setTimeout(function(){fs.A0597634.init(o);},cs.delay.SET_EXPRESSION);
            return;
           }
           // else
           var n = hlps.n.numericValue;
           vars.n = n;

           function loopFunc() {
            fs.A0597634.init(o);
           }

           for(i=1;i<=cons.MAX_VERTICES;i+=1) {
            if (i >= 3) {
              for(j=1;j<=i;j+=1) {
                if (i === n) {
                  if (vars['x_'+j].numericValue === undefined || vars['y_'+j].numericValue === undefined) {
                    o.log('Vertex '+hs.ALPHA[j]+' not yet initialized; delaying initialization by '+cs.delay.SET_EXPRESSION+'ms');
                    setTimeout(loopFunc,cs.delay.SET_EXPRESSION);
                    return;
                  }
                  // Initialize active polygon to current state
                  vars[i]['x_'+j] = vars['x_'+j].numericValue;
                  vars[i]['y_'+j] = vars['y_'+j].numericValue;
                } else if (vars[i]['x_'+j] === undefined || vars[i]['y_'+j] === undefined) {
                  // Initialize inactive polygons to default
                  vars[i]['x_'+j] = cons.RADIUS*Math.round(Math.pow(10,cons.INITIAL_COORDINATES_PRECISION)*Math.sin(2*Math.PI*((j-1)/i)))/Math.pow(10,cons.INITIAL_COORDINATES_PRECISION);
                  vars[i]['y_'+j] = cons.RADIUS*Math.round(Math.pow(10,cons.INITIAL_COORDINATES_PRECISION)*Math.cos(2*Math.PI*((j-1)/i)))/Math.pow(10,cons.INITIAL_COORDINATES_PRECISION);
                }
               }
            }
           }

          // Initialize angles and set observers
           vars.polygonName = 'polygonABC';
           vars.polygonABC_angles = {A:60,B:60,C:60};
           var newPoly;
           function changeFunc(varName,i) {
            return function(){
              fs.A0597634.coordinateChanged({
                name:hs.sub(varName,i),
                value:vars[varName+'_'+i].numericValue,
                desmos:o.desmos,
                uniqueId:o.uniqueId,
                log:o.log
              });
            };
           }
           for(i=1;i<=cons.MAX_VERTICES;i+=1) {
            // Set up polygon angle values for the polygon terminating in this vertex
            if (i > 3) {
              newPoly = mergeObjects({},vars[vars.polygonName+'_angles']);
              newPoly[hs.ALPHA[i]]=0;
              vars.polygonName+=hs.ALPHA[i];
              vars[vars.polygonName+'_angles'] = newPoly;
              vars[vars.polygonName+'_vertices'] = vars[i];
              o.log('Initializing '+vars.polygonName+' with angles:',vars[vars.polygonName+'_angles']);
            }
            // Set up observers for when the user drags a point
            hlps["x_"+i] = changeFunc('x',i);
            hlps['y_'+i] = changeFunc('y',i);
            vars["x_"+i].observe('numericValue.correction',hlps['x_'+i]);
            vars['y_'+i].observe('numericValue.correction',hlps['y_'+i]);
            o.log('Vertex '+hs.ALPHA[i]+' initialized at ('+vars['x_'+i].numericValue+', '+vars['y_'+i].numericValue+')');
           }
           vars.polygonName = vars.polygonName.slice(0,7+n);

           var asquared;
           var bsquared;
           var csquared;

           for (i = 1; i <= n; i+=1) {
            asquared = Math.pow(vars[n]['x_'+((i+n-2)%n+1)]-vars[n]['x_'+i],2)+Math.pow(vars[n]['y_'+((i+n-2)%n+1)]-vars[n]['y_'+i],2);
            bsquared = Math.pow(vars[n]['x_'+(i%n+1)]-vars[n]['x_'+i],2)+Math.pow(vars[n]['y_'+(i%n+1)]-vars[n]['y_'+i],2);
            csquared = Math.pow(vars[n]['x_'+((i+n-2)%n+1)]-vars[n]['x_'+(i%n+1)],2)+Math.pow(vars[n]['y_'+((i+n-2)%n+1)]-vars[n]['y_'+(i%n+1)],2);
            vars['P_'+hs.ALPHA[i]] = 180*Math.acos((asquared+bsquared-csquared)/(2*Math.sqrt(asquared*bsquared)))/Math.PI;
           }

           fs.shared.label.labelPolyAngles(o,{refreshAll:true,exterior:true},cons.ANGLE_PRECISION);

          var expr = '';
          for (j = 1;j <= n;j+=1) {expr+=((Math.round(180*Math.pow(10,cons.ANGLE_PRECISION)-vars[vars.polygonName+'_angles'][hs.ALPHA[j]])/Math.pow(10,cons.ANGLE_PRECISION))+'+');}
          expr = expr.slice(0,expr.length-1);
          o.desmos.setExpression({id:'sum',latex:expr});
          o.desmos.setExpression({id:'centroid',label:hs.latexToText(expr+'=360')});

          hlps.n.observe('numericValue.switchingPolygon',function(){
            fs.A0597634.switchPolygon({
              name:'n',
              value:hlps.n.numericValue,
              desmos:o.desmos,
              uniqueId:o.uniqueId,
              log:o.log
            });
          });

          // prepare to clear placeholders
          document.addEventListener('mouseup',function(){fs.A0597634.clearPlaceholder(o);});
          document.addEventListener('touchend',function(){fs.A0597634.clearPlaceholder(o);});
        
          o.log("Observers initialized:",vars);

          hlps.correctionBuffer = window.setTimeout(function(){
            // set up the initial angles
            fs.shared.label.labelPolyAngles(o,{refreshAll:true,exterior:true},cons.ANGLE_PRECISION);

            vars.belayCorrection = false;
          },cs.delay.LOAD);
         },
        /* ←— setPlaceholder ——————————————————————————————————————————————————→ *\
         | Attaches all segments from a vertex to the placeholder vertex
         * ←———————————————————————————————————————————————————————————————————→ */
         setPlaceholder: function(options,i) {
          if(i === undefined) {
            i = 0;
          }
          var o = hs.parseArgs.apply(this,[(options || {})]);
          var vars = vs[o.uniqueId];
          var n = vars.n;

          var j;

          // move the placeholder to the location of the vertex to hold place
          o.desmos.setExpression({id:'x_0',latex:'x_0='+Math.round(vars[n]['x_'+i]*Math.pow(10,cs.precision.FLOAT_PRECISION))/Math.pow(10,cs.precision.FLOAT_PRECISION)});
          o.desmos.setExpression({id:'y_0',latex:'y_0='+Math.round(vars[n]['y_'+i]*Math.pow(10,cs.precision.FLOAT_PRECISION))/Math.pow(10,cs.precision.FLOAT_PRECISION)});

          if (i === vars.placeholder) {return;} // The rest of this stuff only needs to be done the first time

          o.log('Adding placeholder '+hs.ALPHA[i]);

          vars.placeholder = i;
          var cons = cs.A0597634;

          // make the placeholder visible, and the dragged vertex invisible
          o.desmos.setExpression({id:'placeholder_vertex',hidden:false,showLabel:true,label:hs.ALPHA[i],dragMode:Desmos.DragModes.NONE});
          o.desmos.setExpression({id:'vertex_'+hs.ALPHA[i],showLabel:false,color:cons.HIDDEN_COLOR});

          // Attach the angle label to the placeholder
          o.desmos.setExpression({
            id:'m_'+hs.ALPHA[i],
            latex:cs.A0597634.LABEL_TEMPLATE.replace(new RegExp('U','g'),hs.sub('',0)).replace(new RegExp('Z','g'),hs.sub('',i%n+1)).replace(new RegExp('W','g'),'P').replace(new RegExp('Q','g'),hs.ALPHA[(i+n-2)%n+1]).replace(new RegExp('S','g'),hs.ALPHA[i%n+1]).replace(new RegExp('P_\\{label','g'),hs.ALPHA[i]+'_{label')
          });
          o.desmos.setExpression({
            id:'m_'+hs.ALPHA[(i+n-2)%n+1],
            latex:cs.A0597634.LABEL_TEMPLATE.replace(new RegExp('U','g'),hs.sub('',((i+n-2)%n+1))).replace(new RegExp('Z','g'),hs.sub('',0)).replace(new RegExp('W','g'),hs.ALPHA[(i+n-2)%n+1]).replace(new RegExp('Q','g'),'P').replace(new RegExp('S','g'),hs.ALPHA[(i+n-3)%n+1]).replace(new RegExp('P_\\{label','g'),hs.ALPHA[(i+n-2)%n+1]+'_{label')
          });
          o.desmos.setExpression({
            id:'m_'+hs.ALPHA[i%n+1],
            latex:cs.A0597634.LABEL_TEMPLATE.replace(new RegExp('U','g'),hs.sub('',i%n+1)).replace(new RegExp('Z','g'),hs.sub('',(i+1)%n+1)).replace(new RegExp('W','g'),hs.ALPHA[i%n+1]).replace(new RegExp('Q','g'),hs.ALPHA[(i+1)%n+1]).replace(new RegExp('S','g'),'P').replace(new RegExp('P_\\{label','g'),hs.ALPHA[i%n+1]+'_{label')
          });

          // Attach the vertex to its edges and diagonals
          if (i === 1) {
            // Attach placeholder to B
            o.desmos.setExpression({
              id:'segment_AB',
              latex:cons.SEGMENT_TEMPLATE.replace(new RegExp('U','g'),'0').replace(new RegExp('V','g'),'2')
            });
            o.desmos.setExpression({
              id:'extend_AB',
              latex:cons.EXTENSION_TEMPLATE.replace(new RegExp('U','g'),'_2').replace(new RegExp('V','g'),'_0').replace(new RegExp('Z','g'),'B').replace(new RegExp('Q','g'),'P')
            });
            // Attach every other vertex to placeholder
            for (j = 3;j<=n;j+=1) {
              o.desmos.setExpression({
                id:'segment_'+hs.ALPHA[j]+'A',
                latex:cons.SEGMENT_TEMPLATE.replace(new RegExp('([xy])_U','g'),hs.sub('$1',j)).replace(new RegExp('V','g'),'0')
              });
              o.desmos.setExpression({
                id:'extend_'+hs.ALPHA[j]+'A',
                latex:cons.EXTENSION_TEMPLATE.replace(new RegExp('U','g'),'_0').replace(new RegExp('V','g'),hs.sub('',j)).replace(new RegExp('Z','g'),'P').replace(new RegExp('Q','g'),hs.ALPHA[j])
              });
            }
          } else {
            if (i === 2) {
              o.desmos.setExpression({
                id:'segment_AB',
                latex:cons.SEGMENT_TEMPLATE.replace(new RegExp('U','g'),'0').replace(new RegExp('V','g'),'1')
              });
            } else {
              // attach to previous vertex
              o.desmos.setExpression({
                id:'segment_'+hs.ALPHA[i-1]+hs.ALPHA[i],
                latex:cons.SEGMENT_TEMPLATE.replace(new RegExp('([xy])_U','g'),hs.sub('$1',i-1)).replace(new RegExp('V','g'),'0')
              });
              // attach diagonal to A
              if (2 < i && i < n) {
                o.desmos.setExpression({
                  id:'segment_'+hs.ALPHA[i]+'A',
                  latex:cons.SEGMENT_TEMPLATE.replace(new RegExp('U','g'),'0').replace(new RegExp('V','g'),'1')
                });
              }
            }
            // Attach exterior angle
            o.desmos.setExpression({
              id:'extend_'+hs.ALPHA[i-1]+hs.ALPHA[i],
              latex:cons.EXTENSION_TEMPLATE.replace(new RegExp('U','g'),'_0').replace(new RegExp('V','g'),hs.sub('',i-1)).replace(new RegExp('Z','g'),'P').replace(new RegExp('Q','g'),hs.ALPHA[i-1])
            });
            // Attach to the next vertex
            o.desmos.setExpression({
              id:'segment_'+hs.ALPHA[i]+hs.ALPHA[i%n+1],
              latex:cons.SEGMENT_TEMPLATE.replace(new RegExp('U','g'),'0').replace(new RegExp('([xy])_V','g'),hs.sub('$1',i%n+1))
            });
            o.desmos.setExpression({
              id:'extend_'+hs.ALPHA[i]+hs.ALPHA[i%n+1],
              latex:cons.EXTENSION_TEMPLATE.replace(new RegExp('U','g'),hs.sub('',i%n+1)).replace(new RegExp('V','g'),'_0').replace(new RegExp('Z','g'),hs.ALPHA[i%n+1]).replace(new RegExp('Q','g'),'P')
            });
          }
         },
        /* ←— clearPlaceholder ————————————————————————————————————————————————→ *\
         | moves the last dragged vertex back to the placeholder vertex's location
         |
         * ←———————————————————————————————————————————————————————————————————→ */
         clearPlaceholder: function(){
          var o = hs.parseArgs(arguments);
          var vars = vs[o.uniqueId];
          var hlps = hxs[o.uniqueId];
          var cons = cs.A0597634;
          var i = vars.placeholder;
          var n = vars.n;

          var j;

          if (i === 0) {return;} // if it ain't broke, don't fix it

          o.log('Now clearing placeholder '+hs.ALPHA[i]);

          // Don't recorrect while clearing the placeholder
          if (hlps.correctionBuffer !== undefined) {window.clearTimeout(hlps.correctionBuffer);}
          vars.belayCorrection = true;

          // Move the place-held point to the placeholder
          o.desmos.setExpression({id:'x_'+i,latex:hs.sub('x',i)+'='+Math.round(vars[n]['x_'+i]*Math.pow(10,cs.precision.FLOAT_PRECISION))/Math.pow(10,cs.precision.FLOAT_PRECISION)});
          o.desmos.setExpression({id:'y_'+i,latex:hs.sub('y',i)+'='+Math.round(vars[n]['y_'+i]*Math.pow(10,cs.precision.FLOAT_PRECISION))/Math.pow(10,cs.precision.FLOAT_PRECISION)});

          // Detach the angle label from the placeholder
          o.desmos.setExpression({
              id:'m_'+hs.ALPHA[i],
              latex:cs.A0597634.LABEL_TEMPLATE.replace(new RegExp('U','g'),hs.sub('',i)).replace(new RegExp('Z','g'),hs.sub('',i%n+1)).replace(new RegExp('W','g'),hs.ALPHA[i]).replace(new RegExp('Q','g'),hs.ALPHA[(i+n-2)%n+1]).replace(new RegExp('S','g'),hs.ALPHA[i%n+1])
          });
          o.desmos.setExpression({
            id:'m_'+hs.ALPHA[(i+n-2)%n+1],
            latex:cs.A0597634.LABEL_TEMPLATE.replace(new RegExp('U','g'),hs.sub('',((i+n-2)%n+1))).replace(new RegExp('Z','g'),hs.sub('',i)).replace(new RegExp('W','g'),hs.ALPHA[(i+n-2)%n+1]).replace(new RegExp('Q','g'),hs.ALPHA[i]).replace(new RegExp('S','g'),hs.ALPHA[(i+n-3)%n+1]).replace(new RegExp('P_\\{label','g'),hs.ALPHA[(i+n-2)%n+1]+'_{label')
          });
          o.desmos.setExpression({
            id:'m_'+hs.ALPHA[i%n+1],
            latex:cs.A0597634.LABEL_TEMPLATE.replace(new RegExp('U','g'),hs.sub('',i%n+1)).replace(new RegExp('Z','g'),hs.sub('',(i+1)%n+1)).replace(new RegExp('W','g'),hs.ALPHA[i%n+1]).replace(new RegExp('Q','g'),hs.ALPHA[(i+1)%n+1]).replace(new RegExp('S','g'),hs.ALPHA[i]).replace(new RegExp('P_\\{label','g'),hs.ALPHA[i%n+1]+'_{label')
          });

          hlps.correctionBuffer = window.setTimeout(function(){vars.belayCorrection = false;},cs.delay.SET_EXPRESSION);

          // Make the place-held point visible, and the placeholder invisible
          o.desmos.setExpression({id:'placeholder_vertex',hidden:true,showLabel:false});
          o.desmos.setExpression({id:'vertex_'+hs.ALPHA[i],showLabel:true,color:cons.VERTEX_COLOR});

          // Attach the vertex to its edges and diagonals
          if (i === 1) {
            // Attach A to B
            o.desmos.setExpression({
              id:'segment_AB',
              latex:cons.SEGMENT_TEMPLATE.replace(new RegExp('U','g'),'1').replace(new RegExp('V','g'),'2')
            });
            o.desmos.setExpression({
              id:'extend_AB',
              latex:cons.EXTENSION_TEMPLATE.replace(new RegExp('U','g'),'_2').replace(new RegExp('V','g'),'_1').replace(new RegExp('Z','g'),'B').replace(new RegExp('Q','g'),'A')
            });
            // Attach A to every other vertex
            for (j = 3;j<=n;j+=1) {
              o.desmos.setExpression({
                id:'segment_'+hs.ALPHA[j]+'A',
                latex:cons.SEGMENT_TEMPLATE.replace(new RegExp('([xy])_U','g'),hs.sub('$1',j)).replace(new RegExp('V','g'),'1')
              });
              o.desmos.setExpression({
                id:'extend_'+hs.ALPHA[j]+'A',
                latex:cons.EXTENSION_TEMPLATE.replace(new RegExp('U','g'),'_1').replace(new RegExp('V','g'),hs.sub('',j)).replace(new RegExp('Z','g'),'A').replace(new RegExp('Q','g'),hs.ALPHA[j])
              });
            }
          } else {
            if (i === 2) {
              o.desmos.setExpression({
                id:'segment_AB',
                latex:cons.SEGMENT_TEMPLATE.replace(new RegExp('U','g'),'1').replace(new RegExp('V','g'),'2')
              });
            } else {
              // attach to previous vertex
              o.desmos.setExpression({
                id:'segment_'+hs.ALPHA[i-1]+hs.ALPHA[i],
                latex:cons.SEGMENT_TEMPLATE.replace(new RegExp('([xy])_U','g'),hs.sub('$1',i-1)).replace(new RegExp('([xy])_V','g'),hs.sub('$1',i))
              });
              // attach diagonal to A
              o.desmos.setExpression({
                  id:'segment_'+hs.ALPHA[i]+'A',
                  latex:cons.SEGMENT_TEMPLATE.replace(new RegExp('([xy])_U','g'),hs.sub('$1',i)).replace(new RegExp('V','g'),'1')
                });
            }
            // Attach exterior angle
            o.desmos.setExpression({
              id:'extend_'+hs.ALPHA[i-1]+hs.ALPHA[i],
              latex:cons.EXTENSION_TEMPLATE.replace(new RegExp('U','g'),hs.sub('',i)).replace(new RegExp('V','g'),hs.sub('',i-1)).replace(new RegExp('Z','g'),hs.ALPHA[i]).replace(new RegExp('Q','g'),hs.ALPHA[i-1])
            });
            // Attach to the next vertex
            o.desmos.setExpression({
              id:'segment_'+hs.ALPHA[i]+hs.ALPHA[i%n+1],
              latex:cons.SEGMENT_TEMPLATE.replace(new RegExp('([xy])_U','g'),hs.sub('$1',i)).replace(new RegExp('([xy])_V','g'),hs.sub('$1',i%n+1))
            });
            o.desmos.setExpression({
              id:'extend_'+hs.ALPHA[i]+hs.ALPHA[i%n+1],
              latex:cons.EXTENSION_TEMPLATE.replace(new RegExp('U','g'),hs.sub('',i%n+1)).replace(new RegExp('V','g'),hs.sub('',i)).replace(new RegExp('Z','g'),hs.ALPHA[i%n+1]).replace(new RegExp('Q','g'),hs.ALPHA[i])
            });
          }

          vars.placeholder = 0;
         },
        /* ←— coordinateChanged ———————————————————————————————————————————————→ *\
         | updates variables, and corrects if the user tries to cross diagonals
         * ←———————————————————————————————————————————————————————————————————→ */
         coordinateChanged: function(){
          var o = hs.parseArgs(arguments);
          var vars = vs[o.uniqueId];
          var cons = cs.A0597634;
          if (vars.belayCorrection === true) {
            o.log('Belaying order to correct '+o.name);
            return;
          }
          var n = vars.n;
          var i = +(o.name.match(new RegExp('[0-9]+'))[0]);
          var newPoint = {x:vars['x_'+i].numericValue,y:vars['y_'+i].numericValue};

          var j;

          if (i !== vars.lastDragged) {
            o.log('Now dragging n='+n+',i='+i);
            vars.lastDragged = i;

            // First, put the last dragged vertex back.
            fs.A0597634.clearPlaceholder(o);

            // Now create a list of all the new boundaries
            vars.dragBoundaries = [];
            // Bind by the 2-previous edge
            vars.dragBoundaries.push(hs.lineTwoPoints(
                {x:vars[n]['x_'+((n+i-2)%n+1)],y:vars[n]['y_'+((n+i-2)%n+1)]},
                {x:vars[n]['x_'+((n+i-3)%n+1)],y:vars[n]['y_'+((n+i-3)%n+1)]}
              ));

            // Bind by the in-between edge
            vars.dragBoundaries.push(hs.lineTwoPoints(
                {x:vars[n]['x_'+((n+i-2)%n+1)],y:vars[n]['y_'+((n+i-2)%n+1)]},
                {x:vars[n]['x_'+(i%n+1)],y:vars[n]['y_'+(i%n+1)]}
              ));

            // Bind by the 2-next edge
            vars.dragBoundaries.push(hs.lineTwoPoints(
                {x:vars[n]['x_'+((i+1)%n+1)],y:vars[n]['y_'+((i+1)%n+1)]},
                {x:vars[n]['x_'+(i%n+1)],y:vars[n]['y_'+(i%n+1)]}
              ));

            o.log('Now constraining by:',vars.dragBoundaries);

            if (o.log === console.log) {
              vars.dragBoundaries.forEach(function(line,id) {
                o.desmos.setExpression({id:'boundary'+id,latex:'b_'+id+'\\left(x,y\\right)='+line.a+'x+'+line.b+'y+'+line.c});
              });
            }
          }

          var constrained = hs.polygonConstrain(newPoint,vars.dragBoundaries);

          if (constrained !== null) {
            vars[n]['x_'+i] = constrained.x;
            vars[n]['y_'+i] = constrained.y;
          }

          var asquared;
          var bsquared;
          var csquared;

          [(i+n-2)%n+1,i,i%n+1].forEach(function(j){
            asquared = Math.pow(vars[n]['x_'+((j+n-2)%n+1)]-vars[n]['x_'+j],2)+Math.pow(vars[n]['y_'+((j+n-2)%n+1)]-vars[n]['y_'+j],2);
            bsquared = Math.pow(vars[n]['x_'+(j%n+1)]-vars[n]['x_'+j],2)+Math.pow(vars[n]['y_'+(j%n+1)]-vars[n]['y_'+j],2);
            csquared = Math.pow(vars[n]['x_'+((j+n-2)%n+1)]-vars[n]['x_'+(j%n+1)],2)+Math.pow(vars[n]['y_'+((j+n-2)%n+1)]-vars[n]['y_'+(j%n+1)],2);
            vars['P_'+hs.ALPHA[j]] = 180*Math.acos((asquared+bsquared-csquared)/(2*Math.sqrt(asquared*bsquared)))/Math.PI;
          });

          fs.shared.label.labelPolyAngles(mergeObjects({},o,{name:'m_'+hs.ALPHA[i],value:vars['P_'+hs.ALPHA[i]]}),{exterior:true},cons.ANGLE_PRECISION);

          var expr = '';
          for (j = 1;j <= n;j+=1) {expr+=((Math.round(180*Math.pow(10,cons.ANGLE_PRECISION)-vars[vars.polygonName+'_angles'][hs.ALPHA[j]])/Math.pow(10,cons.ANGLE_PRECISION))+'+');}
          expr = expr.slice(0,expr.length-1);
          o.desmos.setExpression({id:'sum',latex:expr});
          o.desmos.setExpression({id:'centroid',label:hs.latexToText(expr+'=360')});

          if (constrained === newPoint) {
            fs.A0597634.clearPlaceholder(o);
          } else {
            fs.A0597634.setPlaceholder(o,i);
          }
         },
        /* ←— switchPolygon ———————————————————————————————————————————————————→ *\
         | Adds and removes vertices and edges
         | Restyles diagonals
         | Restores coordinates
         * ←———————————————————————————————————————————————————————————————————→ */
         switchPolygon: function(){
          var o = hs.parseArgs(arguments);
          var vars = vs[o.uniqueId];
          var hlps = hxs[o.uniqueId];
          var cons = cs.A0597634;
          vars.belayCorrection = true;

          var i;
          var j;

          fs.A0597634.clearPlaceholder(o);

          var prevn = vars.n;
          var n = o.value;
          vars.n = n;
          var polygons = 'polygonABCDEFGHIJKLMNOPQRSTUVWXYZ';
          vars.polygonName = polygons.slice(0,7+n);

          o.log("Changing from "+prevn+" sides to "+n+" sides");

          var exprs = [];

          // Move terminal vertex
           exprs.push({
            id:'segment_'+hs.ALPHA[prevn]+'A',
            hidden:true
           });
           exprs.push({
            id:'extend_'+hs.ALPHA[prevn]+'A',
            hidden:true
           });
           exprs.push({
            id:'m_A',
            latex:cs.A0597634.LABEL_TEMPLATE.replace(new RegExp('U','g'),hs.sub('',1)).replace(new RegExp('Z','g'),hs.sub('',2)).replace(new RegExp('W','g'),'A').replace(new RegExp('Q','g'),hs.ALPHA[n]).replace(new RegExp('S','g'),'B')
           });

          // Delete extra vertices
           for (i = cons.MAX_VERTICES; i >= n+1; i-=1) {
            exprs.push({
              id:'vertex_'+hs.ALPHA[i],
              hidden:true,
              showLabel:false
            });
            exprs.push({
              id:'segment_'+hs.ALPHA[i-1]+hs.ALPHA[i],
              hidden:true
            });
            exprs.push({
              id:'extend_'+hs.ALPHA[i-1]+hs.ALPHA[i],
              hidden:true
            });
            exprs.push({
              id:'m_'+hs.ALPHA[i],
              showLabel:false
            });
            // o.log('Deleting vertex '+hs.ALPHA[i]);
           }

          // Add new vertices
           for (i = 3; i <= n; i+=1) {
            exprs.push({
              id:'vertex_'+hs.ALPHA[i%n+1],
              hidden:false,
              showLabel:true
            });
            exprs.push({
              id:'segment_'+hs.ALPHA[i]+hs.ALPHA[i%n+1],
              hidden:false
            });
            exprs.push({
              id:'extend_'+hs.ALPHA[i]+hs.ALPHA[i%n+1],
              hidden:false
            });
            o.log(cs.A0597634.LABEL_TEMPLATE.replace(new RegExp('U','g'),hs.sub('',i)).replace(new RegExp('Z','g'),hs.sub('',i%n+1)).replace(new RegExp('W','g'),hs.ALPHA[i]).replace(new RegExp('Q','g'),hs.ALPHA[(i+n-2)%n+1]).replace(new RegExp('S','g'),hs.ALPHA[i%n+1]));
            exprs.push({
              id:'m_'+hs.ALPHA[i],
              showLabel:true,
              latex:cs.A0597634.LABEL_TEMPLATE.replace(new RegExp('U','g'),hs.sub('',i)).replace(new RegExp('Z','g'),hs.sub('',i%n+1)).replace(new RegExp('W','g'),hs.ALPHA[i]).replace(new RegExp('Q','g'),hs.ALPHA[(i+n-2)%n+1]).replace(new RegExp('S','g'),hs.ALPHA[i%n+1])
            });
           }

          // Update centroid and labels
           var x_centroid = 'x_{centroid}=\\frac{';
           for (i = 1; i < n; i+=1) {x_centroid+=(hs.sub('x',i)+'+');}
           x_centroid += (hs.sub('x',n)+'}{n}');
           exprs.push({
            id:'x_centroid',
            latex:x_centroid
           });
           exprs.push({
            id:'y_centroid',
            latex:x_centroid.replace(new RegExp('x','g'),'y')
           });
           // exprs.push({
           //  id:'centroid',
           //  label:'180'/*+'°'*/+'⋅('+n+' − 2) = '+(180*(n-2))/*+'°'*/
           // });
           // exprs.push({
           //  id:'centroid-1',
           //  label:' ' // Placeholder (TK)
           // });

          // o.log('Changed figures:',exprs);

          o.desmos.setExpressions(exprs);

          var asquared;
          var bsquared;
          var csquared;

          for (i = 1; i <= n; i+=1) {
            asquared = Math.pow(vars[n]['x_'+((i+n-2)%n+1)]-vars[n]['x_'+i],2)+Math.pow(vars[n]['y_'+((i+n-2)%n+1)]-vars[n]['y_'+i],2);
            bsquared = Math.pow(vars[n]['x_'+(i%n+1)]-vars[n]['x_'+i],2)+Math.pow(vars[n]['y_'+(i%n+1)]-vars[n]['y_'+i],2);
            csquared = Math.pow(vars[n]['x_'+((i+n-2)%n+1)]-vars[n]['x_'+(i%n+1)],2)+Math.pow(vars[n]['y_'+((i+n-2)%n+1)]-vars[n]['y_'+(i%n+1)],2);
            vars['P_'+hs.ALPHA[i]] = 180*Math.acos((asquared+bsquared-csquared)/(2*Math.sqrt(asquared*bsquared)))/Math.PI;
          }

          fs.shared.label.labelPolyAngles(o,{refreshAll:true,exterior:true},cons.ANGLE_PRECISION);

          var expr = '';
          for (j = 1;j <= n;j+=1) {expr+=((Math.round(180*Math.pow(10,cons.ANGLE_PRECISION)-vars[vars.polygonName+'_angles'][hs.ALPHA[j]])/Math.pow(10,cons.ANGLE_PRECISION))+'+');}
          expr = expr.slice(0,expr.length-1);
          o.desmos.setExpression({id:'sum',latex:expr});
          o.desmos.setExpression({id:'centroid',label:hs.latexToText(expr+'=360')});

          exprs = [];

          // Update coordinates
          for (i = 1; i <= n; i+=1) {
            exprs.push({
              id:'x_'+i,
              latex:hs.sub('x',i)+'='+vars[n]['x_'+i]
            });
            exprs.push({
              id:'y_'+i,
              latex:hs.sub('y',i)+'='+vars[n]['y_'+i]
            });
            // Prevent correction from kicking in
            vars['x_'+i].numericValue = vars[n]['x_'+i];
            vars['y_'+i].numericValue = vars[n]['y_'+i];
            //o.log('Moving vertex '+hs.ALPHA[i]+' to ('+vars[n]['x_'+i]+','+vars[n]['y_'+i]+')');
          }
          // o.log('Changed coordinates:',exprs);

          if (hlps.correctionBuffer !== undefined) {window.clearTimeout(hlps.correctionBuffer);}

          o.desmos.setExpressions(exprs);

          hlps.correctionBuffer = window.setTimeout(function(){
            vars.belayCorrection = false;
          },cs.delay.LOAD);

         }
       };

      /* ←— A0597720 FUNCTIONS ——————————————————————————————————————————————→ */
       fs.A0597720 = {
        /* ←— labelEquation ————————————————————————————————————————————————————→ */
         labelEquation: function(){
          var o = hs.parseArgs(arguments);
          o.desmos.setExpression({id:'equation',label:''+(180-o.value)/*+'°'*/+' + '+o.value/*+'°'*/+' = 180'/*+'°'*/});
         }
       };

      /* ←— A0597724 FUNCTIONS ——————————————————————————————————————————————→ */
       fs.A0597724 = {
        /* ←— init ——————————————————————————————————————————————————————→ *\
         | Prepares the widget to listen to user input
         * ←—————————————————————————————————————————————————————————————————→ */
         init: function(){
          var o = hs.parseArgs(arguments);
          var vars = vs[o.uniqueId];
          mergeObjects(vars,{
            x_1:8,
            y_1:4,
            x_2:-2,
            y_2:4,
            dragging:0
          });
          vars.d1 = hxs[o.uniqueId].maker({latex:'d_1'});
          vars.d2 = hxs[o.uniqueId].maker({latex:'d_2'});

          function startDragging(){
            vars.dragging = -1;
          }

          function stopDragging(){
            if (vars.dragging > 0) {
              o.desmos.setExpressions([
                {id:'x_1',latex:'x_1='+vars.x_1},
                {id:'y_1',latex:'y_1='+vars.y_1},
                {id:'x_2',latex:'x_2='+vars.x_2},
                {id:'y_2',latex:'y_2='+vars.y_2}
              ]);
            }
            vars.dragging = 0;
          }

          // prepare to clear placeholders
          setTimeout(function(){
            document.addEventListener('mousedown',startDragging);
            document.addEventListener('touchstart',startDragging);
            document.addEventListener('mouseup',stopDragging);
            document.addEventListener('touchend',stopDragging);
          },cs.delay.LOAD);
         },
        /* ←— dragging ——————————————————————————————————————————————————————→ *\
         | Fixes the diagonal not being dragged to rotate, but not scale, with
         | the dragged point.
         * ←—————————————————————————————————————————————————————————————————→ */
         dragging: function(){
          var o = hs.parseArgs(arguments);
          var vars = vs[o.uniqueId];

          vars[o.name] = o.value;

          if (vars.dragging > -1) {return;}

          vars.dragging = o.name[o.name.length-1];

          o.desmos.setExpression({id:'x_'+(3-vars.dragging),latex:'x_'+(3-vars.dragging)+'='+vars['d'+(3-vars.dragging)].numericValue+'\\frac{'+((vars.dragging === 1)?'':'-')+'y_'+vars.dragging+'}{d_'+vars.dragging+'}'});
          o.desmos.setExpression({id:'y_'+(3-vars.dragging),latex:'y_'+(3-vars.dragging)+'='+vars['d'+(3-vars.dragging)].numericValue+'\\frac{'+((vars.dragging === 1)?'-':'')+'x_'+vars.dragging+'}{d_'+vars.dragging+'}'});
         }
       };

      /* ←— A0597744 FUNCTIONS ——————————————————————————————————————————————→ */
        /* ←— A0597744 Constants ——————————————————————————————————————————————→ */
         cs.A0597744 = {PRECISION:10};
       fs.A0597744 = {
        /* ←— init ————————————————————————————————————————————————————→ */
         init: function(){
          var o = hs.parseArgs(arguments);
          var vars = vs[o.uniqueId];
          var hlps = hxs[o.uniqueId];
          var cons = cs.A0597744;

          hlps.h = hlps.maker({latex:'h'});
          hlps.k = hlps.maker({latex:'k'});
          hlps.p = hlps.maker({latex:'p'});
          hlps.a = hlps.maker({latex:'a'});
          hlps.t = hlps.maker({latex:'P\\left(a\\right)'});
          

          function dragging() {
            vars.dragged=true;

            vars.H=Math.round(cons.PRECISION*hlps.h.numericValue)/cons.PRECISION;
            vars.K=Math.round(cons.PRECISION*hlps.k.numericValue)/cons.PRECISION;
            vars.P=Math.round(cons.PRECISION*hlps.p.numericValue)/cons.PRECISION;
            vars.A=Math.round(cons.PRECISION*hlps.a.numericValue)/cons.PRECISION;
            vars.T=Math.round(cons.PRECISION*hlps.t.numericValue)/cons.PRECISION;
            var f = Math.round(cons.PRECISION*(vars.K+vars.P))/cons.PRECISION;
            var d = Math.round(cons.PRECISION*(vars.K-vars.P))/cons.PRECISION;
            var tx = Math.round(cons.PRECISION*(vars.H+vars.A))/cons.PRECISION;
            var ty = Math.round(cons.PRECISION*(vars.K+vars.T))/cons.PRECISION;

            o.desmos.setExpressions([
              {id:'liveParabola',hidden:false},
              {id:'focus',label:'focus '+hs.latexToText('('+vars.H+','+f+')')},
              {id:'vertex',label:'vertex '+hs.latexToText('('+vars.H+','+vars.K+')')},
              {id:'pMeasure',label:hs.latexToText('p='+vars.P)},
              {id:'directrix',label:'directrix '+hs.latexToText('y='+d)},
              {id:'equation',hidden:true,
                latex:'y'+((vars.K === 0)?'':((vars.K<0)?'+'+Math.abs(vars.K):'-'+vars.K)) +
                        '='+((vars.P<0)?'-':'')+'\\frac{1}{4\\left('+Math.abs(vars.P)+'\\right)}' +
                        ((vars.H === 0)?'x':
                          '\\left(x' +
                           ((vars.H<0)?'+'+Math.abs(vars.H):'-'+vars.H) +
                           '\\right)') +
                        '^2'},
              {id:'tracePoint',label:hs.latexToText('\\left('+tx+','+ty+'\\right)')}
             ]);
           }

          hlps.h.observe('numericValue.dragging',dragging);
          hlps.k.observe('numericValue.dragging',dragging);
          hlps.p.observe('numericValue.dragging',dragging);
          hlps.a.observe('numericValue.dragging',dragging);
          hlps.t.observe('numericValue.dragging',dragging);

          var unclick;

          function click() {
            document.removeEventListener('mousedown',click);
            document.removeEventListener('touchstart',click);

            o.desmos.setExpressions([
              {id:'equation',hidden:true},
              {id:'liveParabola',hidden:false}
             ]);
            /*
            hlps.h.observe('numericValue.dragging',dragging);
            hlps.k.observe('numericValue.dragging',dragging);
            hlps.p.observe('numericValue.dragging',dragging);
            */
            document.addEventListener('mouseup',unclick);
            document.addEventListener('touchend',unclick);
           }

          unclick = function() {
            document.removeEventListener('mouseup',unclick);
            document.removeEventListener('touchend',unclick);

            /*
            hlps.h.unobserve('numericValue.dragging');
            hlps.k.unobserve('numericValue.dragging');
            hlps.p.unobserve('numericValue.dragging');

            if(vars.dragged===true) {
              vars.dragged=false;
              o.desmos.setExpressions([
                {id:'h',latex:'h='+vars.H},
                {id:'k',latex:'k='+vars.K},
                {id:'p',latex:'p='+vars.P}
               ]);
            }
            */
            setTimeout(function(){o.desmos.setExpressions([
              {id:'equation',hidden:false},
              {id:'liveParabola',hidden:true}
              ]);},cs.delay.SET_EXPRESSION);

            document.addEventListener('mousedown',click);
            document.addEventListener('touchstart',click);
           };

          document.addEventListener('mousedown',click);
          document.addEventListener('touchstart',click); //*/
         }
       };

      /* ←— A0597768 FUNCTIONS ——————————————————————————————————————————————→ */
       fs.A0597768 = {
        /* ←— init ———————————————————————————————————————————————→ *\
         | stuff
         * ←—————————————————————————————————————————————————————————————————→ */
         init: function(){
          var o = hs.parseArgs(arguments);
          vs[o.uniqueId] = {draggingPoint:null,dragging:false};
          var vars = vs[o.uniqueId];
          var hlps = hxs[o.uniqueId];
          vars.belayUntil = Date.now()+cs.delay.LOAD;

          mergeObjects(hlps,{
            x_0:hlps.maker({latex:'x_0'}),
            y_0:hlps.maker({latex:'y_0'}),
            x_1:hlps.maker({latex:'x_1'}),
            y_1:hlps.maker({latex:'y_1'}),
            x_2:hlps.maker({latex:'x_2'}),
            y_2:hlps.maker({latex:'y_2'}),
            x_3:hlps.maker({latex:'x_3'}),
            y_3:hlps.maker({latex:'y_3'}),

            u_1:hlps.maker({latex:'u_1'}),
            v_1:hlps.maker({latex:'v_1'}),
            u_2:hlps.maker({latex:'u_2'}),
            v_2:hlps.maker({latex:'v_2'}),
            u_3:hlps.maker({latex:'u_3'}),
            v_3:hlps.maker({latex:'v_3'}),

            R_C:hlps.maker({latex:'R'})
          });

          var unclick;

          function isolateHandle(which) {
            // o.log('Isolating Handles');
            objKeys(hlps).forEach(function(helper) {
              if(helper !== 'maker') {
                hlps[helper].unobserve('numericValue.dragging');
                hlps[helper].unobserve('numericValue.checkReplace');
              }
            });

            document.addEventListener('mouseup',unclick);
            document.addEventListener('touchend',unclick);

            // o.log(which+' changed.');

            vars.dragging = true;
            var exprs = [
              {id:'center',hidden:(which[2] !== '0')},
              {id:'vertexHandle',hidden:(which[2] !== '1')},
              {id:'handleM',hidden:(which[2] !== '2')},
              {id:'handleN',hidden:(which[2] !== '3')}
            ];

            if (which[2] === '0') {vars.draggingPoint = 'C';}
            if (which[2] === '1') {vars.draggingPoint = 'D';}
            if (which[2] === '2') {vars.draggingPoint = 'E';}
            if (which[2] === '3') {vars.draggingPoint = 'A';}
            if (which[0] === 'R') {vars.draggingPoint = 'R';}

            if (vars.draggingPoint === 'D') {
              exprs.push({id:'x_1',latex:'x_1=\\left\\{D_{ofE}=0:\\left(u_1\\right)\\max\\left(\\frac{R}{D_H},1\\right),R\\left(cos\\theta_r-sin\\theta_r\\right)\\right\\}'});
              exprs.push({id:'y_1',latex:'y_1=\\left\\{D_{ofE}=0:\\left(v_1\\right)\\max\\left(\\frac{R}{D_H},1\\right),R\\left(sin\\theta_r+cos\\theta_r\\right)\\right\\}'});
              exprs.push({id:'x_2',latex:'x_2=R\\cos\\theta_r'});
              exprs.push({id:'y_2',latex:'y_2=R\\sin\\theta_r'});
              exprs.push({id:'DofE',latex:'D_{ofE}=\\left\\{D_H\\le R:1,0\\right\\}'});
              exprs.push({id:'theta_r',latex:'\\theta_r=\\theta_D-\\theta_h'});
            } else {
              exprs.push({id:'x_1',latex:'x_1=x_2-y_2'});
              exprs.push({id:'y_1',latex:'y_1=y_2+x_2'});
              exprs.push({id:'x_2',latex:'x_2=u_2\\frac{R}{d_M}'});
              exprs.push({id:'y_2',latex:'y_2=v_2\\frac{R}{d_M}'});
              exprs.push({id:'DofE',latex:'D_{ofE}=1'});
              exprs.push({id:'theta_r',latex:'\\theta_r=\\theta_{xy}\\left(u_2,v_2\\right)'});
            }

            o.log('Isolating handle '+which);//+'; setting expressions:',exprs);

            o.desmos.setExpressions(exprs);
          }

          function replaceHandles() {
            // o.log('Replacing Handles');

            var i;

            var vals = {
              x_1: hlps.x_1.numericValue,
              y_1: hlps.y_1.numericValue,
              x_2: hlps.x_2.numericValue,
              y_2: hlps.y_2.numericValue,
              x_3: hlps.x_3.numericValue,
              y_3: hlps.y_3.numericValue
            };

            var exprs = [
              {id:'u_1',latex:('u_1='+vals.x_1)},
              {id:'v_1',latex:('v_1='+vals.y_1)},
              {id:'u_2',latex:('u_2='+vals.x_2)},
              {id:'v_2',latex:('v_2='+vals.y_2)},
              {id:'u_3',latex:('u_3='+vals.x_3)},
              {id:'v_3',latex:('v_3='+vals.y_3)}
            ];

            function checkReplace(n) {
              // o.log('u_'+n+' = '+hlps['u_'+n].numericValue);
              // o.log('x_'+n+' = '+hlps['x_'+n].numericValue);
              // o.log('v_'+n+' = '+hlps['v_'+n].numericValue);
              // o.log('y_'+n+' = '+hlps['y_'+n].numericValue);
              if((Math.abs(hlps['u_'+n].numericValue-vals['x_'+n])<cs.precision.FLOAT_PRECISION) &&
                 (Math.abs(hlps['v_'+n].numericValue-vals['y_'+n])<cs.precision.FLOAT_PRECISION)) {
                hlps['u_'+n].unobserve('numericValue.checkReplace');
                hlps['v_'+n].unobserve('numericValue.checkReplace');
                switch(n) {
                  case 1:
                    o.desmos.setExpression({id:'vertexHandle',hidden:false});
                    break;
                  case 2:
                    o.desmos.setExpression({id:'handleM',hidden:false});
                    break;
                  case 3:
                    o.desmos.setExpression({id:'handleN',hidden:false});
                    break;
                }
                hlps['u_'+n].observe('numericValue.dragging',function(){if(vars.dragging){isolateHandle('u_'+n);}});
                hlps['v_'+n].observe('numericValue.dragging',function(){if(vars.dragging){isolateHandle('v_'+n);}});
              }
            }

            exprs.push({id:'center',hidden:false});
            hlps.x_0.observe('numericValue.dragging',function(){if(vars.dragging){isolateHandle('x_0');}});
            hlps.y_0.observe('numericValue.dragging',function(){if(vars.dragging){isolateHandle('y_0');}});
            hlps.R_C.observe('numericValue.dragging',function(){if(vars.dragging){isolateHandle('x_0');}});

            function loopFunc(k) {
              return function() {
                checkReplace(k);
              };
            }
            for (i = 1; i <= 3; i+=1) {
              hlps['u_'+i].observe('numericValue.checkReplace',loopFunc(i));
              hlps['v_'+i].observe('numericValue.checkReplace',loopFunc(i));
              checkReplace(i);
            }

            // o.log('Replacing handles; setting expressions:',exprs);

            if ((!(myIsNaN(hlps.x_0.numericValue))) &&
                (!(myIsNaN(hlps.y_0.numericValue))) &&
                (!(myIsNaN(hlps.x_1.numericValue))) &&
                (!(myIsNaN(hlps.y_1.numericValue))) &&
                (!(myIsNaN(hlps.x_2.numericValue))) &&
                (!(myIsNaN(hlps.y_2.numericValue))) &&
                (!(myIsNaN(hlps.x_3.numericValue))) &&
                (!(myIsNaN(hlps.y_3.numericValue)))
                ) {o.desmos.setExpressions(exprs);}
          }

          function click() {
            vars.dragging=true;
            // escape();
          }

          var escape;

          unclick = function() {
            vars.dragging=false;
            delete vars.draggingPoint;
            document.removeEventListener('mouseup',unclick);
            document.removeEventListener('touchend',unclick);
            // escape();
            setTimeout(function(){
              if (vars === vs[o.uniqueId]) {replaceHandles();}
              else {escape();}
            },cs.delay.SET_EXPRESSION);
          };

          escape = function() {
            document.removeEventListener('mousedown',click);
            document.removeEventListener('touchstart',click);
            document.removeEventListener('mouseup',unclick);
            document.removeEventListener('touchend',unclick);
          };

          document.addEventListener('mousedown',click);
          document.addEventListener('touchstart',click);

          function loop2Func(which,i) {
            return function() {
              if(vars.dragging) {
                isolateHandle(which+'_'+i);
              }
            };
          }
          setTimeout(function(){
            hlps.x_0.observe('numericValue.dragging',loop2Func('x',0));
            hlps.y_0.observe('numericValue.dragging',loop2Func('y',0));
            hlps.R_C.observe('numericValue.dragging',loop2Func('x',0));
            var i;
            for (i = 1; i <= 3; i+=1) {
              hlps['u_'+i].observe('numericValue.dragging',loop2Func('u',i));
              hlps['v_'+i].observe('numericValue.dragging',loop2Func('v',i));
            }
          },cs.delay.LOAD);
         }
       };

      /* ←— A0597772 FUNCTIONS ——————————————————————————————————————————————→ */
        cs.A0597772 = {
          CENTER_COLOR:cs.color.agaColors.black,
          INTERSECTION_COLOR:cs.color.agaColors.black,
          HIDDEN_COLOR:'#FFFFFF'
         };
       fs.A0597772 = {
        /* ←— circleConstrain ———————————————————————————————————————————————→ *\
         | Monitors x_1 and y_1 and corrects them if they go outside the circle
         |  centered at x_0, y_0 with radius r_0
         | (Initialization option; starts the whole graph)
         * ←—————————————————————————————————————————————————————————————————→ */
         init: function(){
          var o = hs.parseArgs(arguments);
          var vars = vs[o.uniqueId];
          mergeObjects(vars,{draggingPoint:null,dragging:false});
          var hlps = hxs[o.uniqueId];
          vars.belayUntil = Date.now()+cs.delay.LOAD;

          mergeObjects(hlps,{
            u_0:hlps.maker({latex:'u_0'}),
            v_0:hlps.maker({latex:'v_0'}),
            u_1:hlps.maker({latex:'u_1'}),
            v_1:hlps.maker({latex:'v_1'}),
            u_2:hlps.maker({latex:'u_2'}),
            v_2:hlps.maker({latex:'v_2'}),
            u_3:hlps.maker({latex:'u_3'}),
            v_3:hlps.maker({latex:'v_3'}),
            w_2:hlps.maker({latex:'w_2'}),
            z_2:hlps.maker({latex:'z_2'}),
            w_3:hlps.maker({latex:'w_3'}),
            z_3:hlps.maker({latex:'z_3'}),
            R:hlps.maker({latex:'R'}),
            m1_x:hlps.maker({latex:'P_{MC1}\\left[1\\right]'}),
            m1_y:hlps.maker({latex:'P_{MC1}\\left[2\\right]'}),
            m2_x:hlps.maker({latex:'P_{MC2}\\left[1\\right]'}),
            m2_y:hlps.maker({latex:'P_{MC2}\\left[2\\right]'}),
            n1_x:hlps.maker({latex:'P_{NC1}\\left[1\\right]'}),
            n1_y:hlps.maker({latex:'P_{NC1}\\left[2\\right]'}),
            n2_x:hlps.maker({latex:'P_{NC2}\\left[1\\right]'}),
            n2_y:hlps.maker({latex:'P_{NC2}\\left[2\\right]'}),
            D:hlps.maker({latex:'D'}),
            i_nv:hlps.maker({latex:'i_{nv}'}),
            t_ick:hlps.maker({latex:'t_{ick}'})
          });

          var unclick;

          function isolateHandle(which) {
            // o.log('Isolating Handles');
            objKeys(hlps).forEach(function(helper) {
              if(helper !== 'maker') {
                hlps[helper].unobserve('numericValue.dragging');
              }
            });

            document.addEventListener('mouseup',unclick);
            document.addEventListener('touchend',unclick);

            vars.dragging = true;
            var exprs = [
              {id:'intersection',hidden:(which[2] !== '1')},
              {id:'handleM1',hidden:(!((new RegExp('[uv]_2')).test(which)))},
              {id:'handleM2',hidden:(!((new RegExp('[wz]_2')).test(which)))},
              {id:'handleN1',hidden:(!((new RegExp('[uv]_3')).test(which)))},
              {id:'handleN2',hidden:(!((new RegExp('[wz]_3')).test(which)))}//*/
            ];
            switch (which[2]) {
              case '0':
                exprs.push({id:'x_0',latex:'x_0=u_1+\\frac{u_0-u_1}{D}\\min\\left(R-'+cs.distance.CONSTRAIN_BUFFER+',D\\right)'});
                exprs.push({id:'y_0',latex:'y_0=v_1+\\frac{v_0-v_1}{D}\\min\\left(R-'+cs.distance.CONSTRAIN_BUFFER+',D\\right)'});
                vars.draggingPoint = 'center';
                break;
              case '1':
                exprs.push({id:'x_1',latex:'x_1=u_0+\\frac{u_1-u_0}{D}\\min \\left(R-'+cs.distance.CONSTRAIN_BUFFER+',D\\right)'});
                exprs.push({id:'y_1',latex:'y_1=v_0+\\frac{v_1-v_0}{D}\\min \\left(R-'+cs.distance.CONSTRAIN_BUFFER+',D\\right)'});
                vars.draggingPoint = 'intersection';
                break;
              case '2':
                if ((new RegExp('[uv]')).test(which)) {
                  vars.draggingPoint = 'handleM1';
                  exprs.push({id:'x_2',latex:'x_2=u_2'});
                  exprs.push({id:'y_2',latex:'y_2=v_2'});
                } else {
                  vars.draggingPoint = 'handleM2';
                  exprs.push({id:'x_2',latex:'x_2=-w_2'});
                  exprs.push({id:'y_2',latex:'y_2=-z_2'});
                }
                break;
              case '3':
                if ((new RegExp('[uv]')).test(which)) {
                  vars.draggingPoint = 'handleN1';
                  exprs.push({id:'x_3',latex:'x_3=u_3'});
                  exprs.push({id:'y_3',latex:'y_3=v_3'});
                } else {
                  vars.draggingPoint = 'handleN2';
                  exprs.push({id:'x_3',latex:'x_3=-w_3'});
                  exprs.push({id:'y_3',latex:'y_3=-z_3'});
                }
                break;
              default:
                return;
            }
            o.desmos.setExpressions(exprs);
          }

          var activateHandles;

          function adjustHandles() {
            // o.log('Adjusting Handles');
            if (Date.now() <= vars.belayUntil) {setTimeout(adjustHandles,vars.belayUntil-Date.now()+1);return;}

            vars.belayUntil = Date.now()+cs.delay.EXECUTE_HELPER;

            var exprs = [
              {id:'u_2',latex:'u_2='+hs.number(hlps.m1_x.numericValue-hlps.u_1.numericValue)},
              {id:'v_2',latex:'v_2='+hs.number(hlps.m1_y.numericValue-hlps.v_1.numericValue)},
              {id:'w_2',latex:'w_2='+hs.number(hlps.m2_x.numericValue-hlps.u_1.numericValue)},
              {id:'z_2',latex:'z_2='+hs.number(hlps.m2_y.numericValue-hlps.v_1.numericValue)},
              {id:'u_3',latex:'u_3='+hs.number(hlps.n1_x.numericValue-hlps.u_1.numericValue)},
              {id:'v_3',latex:'v_3='+hs.number(hlps.n1_y.numericValue-hlps.v_1.numericValue)},
              {id:'w_3',latex:'w_3='+hs.number(hlps.n2_x.numericValue-hlps.u_1.numericValue)},
              {id:'z_3',latex:'z_3='+hs.number(hlps.n2_y.numericValue-hlps.v_1.numericValue)}
            ];
            o.desmos.setExpressions(exprs);

            vars.belayUntil = Date.now()+cs.delay.SET_EXPRESSION;
            setTimeout(activateHandles,cs.delay.SET_EXPRESSION);
          }

          var clearPlaceholder;

          function replaceHandles() {
            // o.log('Replacing Handles');
            o.log('Placeholder = '+vars.placeholder);
            if (vars.placeholder !== undefined) {clearPlaceholder();}

            adjustHandles();

            var exprs = [
              {id:'x_0',latex:'x_0=u_0'},
              {id:'y_0',latex:'y_0=v_0'},
              {id:'x_1',latex:'x_1=u_1'},
              {id:'y_1',latex:'y_1=v_1'}
            ];

            var intersection = {x:hlps.u_1.numericValue,y:hlps.v_1.numericValue};
            if (Math.pow(hlps.m1_x.numericValue-intersection.x,2)+
              Math.pow(hlps.m1_y.numericValue-intersection.y,2) >
              Math.pow(hlps.m2_x.numericValue-intersection.x,2) +
              Math.pow(hlps.m2_y.numericValue-intersection.y,2)) {
              exprs.push({id:'x_2',latex:'x_2=u_2'});
              exprs.push({id:'y_2',latex:'y_2=v_2'});
            } else {
              exprs.push({id:'x_2',latex:'x_2=-w_2'});
              exprs.push({id:'y_2',latex:'y_2=-z_2'});
            }
            if (Math.pow(hlps.n1_x.numericValue-intersection.x,2)+
              Math.pow(hlps.n1_y.numericValue-intersection.y,2) >
              Math.pow(hlps.n2_x.numericValue-intersection.x,2) +
              Math.pow(hlps.n2_y.numericValue-intersection.y,2)) {
              exprs.push({id:'x_3',latex:'x_3=u_3'});
              exprs.push({id:'y_3',latex:'y_3=v_3'});
            } else {
              exprs.push({id:'x_3',latex:'x_3=-w_3'});
              exprs.push({id:'y_3',latex:'y_3=-z_3'});
            }

            o.desmos.setExpressions(exprs);

            setTimeout(adjustHandles,cs.delay.SET_EXPRESSION);
          }

          activateHandles = function() {
            // o.log('Activating Handles');
            delete vars.constrainingCircle;

            o.desmos.setExpressions([
              {id:'center',hidden:false},
              {id:'intersection',hidden:false},
              {id:'handleM1',hidden:(Math.pow(hlps.m1_x.numericValue-hlps.u_1.numericValue,2)+Math.pow(hlps.m1_y.numericValue-hlps.v_1.numericValue,2)<Math.pow(hlps.t_ick.numericValue,2))},
              {id:'handleM2',hidden:(Math.pow(hlps.m2_x.numericValue-hlps.u_1.numericValue,2)+Math.pow(hlps.m2_y.numericValue-hlps.v_1.numericValue,2)<Math.pow(hlps.t_ick.numericValue,2))},
              {id:'handleN1',hidden:(Math.pow(hlps.n1_x.numericValue-hlps.u_1.numericValue,2)+Math.pow(hlps.n1_y.numericValue-hlps.v_1.numericValue,2)<Math.pow(hlps.t_ick.numericValue,2))},
              {id:'handleN2',hidden:(Math.pow(hlps.n2_x.numericValue-hlps.u_1.numericValue,2)+Math.pow(hlps.n2_y.numericValue-hlps.v_1.numericValue,2)<Math.pow(hlps.t_ick.numericValue,2))}
            ]);

            objKeys(hlps).forEach(function(helper) {
              if ((new RegExp('[uvwz]_')).test(helper)) {
                hlps[helper].observe(
                  'numericValue.dragging',
                  function(){if(vars.dragging){isolateHandle(helper);}}
                );
              }
            });
          };

          // function logChanges() {
          //   hlps.u_0.observe('numericValue.log',function(){o.log('center.u:'+hlps.u_0.numericValue);});
          //   hlps.v_0.observe('numericValue.log',function(){o.log('center.v:'+hlps.v_0.numericValue);});
          //   hlps.u_1.observe('numericValue.log',function(){o.log('intersection.u:'+hlps.u_1.numericValue);});
          //   hlps.v_1.observe('numericValue.log',function(){o.log('intersection.v:'+hlps.v_1.numericValue);});
          // }

          var correctIt;

          function enableCorrection() {
            hlps.D.observe('numericValue.correction',function(){correctIt();});
          }

          function disableCorrection() {
            hlps.D.unobserve('numericValue.correction');
          }

          clearPlaceholder = function(draggingPoint) {
            if(draggingPoint === undefined) {
              draggingPoint=vars.draggingPoint;
            }
            // o.log('Clearing Placeholder');
            if (vars.placeholder === undefined) {return;}
            vars.belayUntil = Date.now() + cs.delay.EXECUTE_HELPER;

            var exprs = [];
            var corrected;

            switch (draggingPoint) {
              case 'center':
                corrected = hs.circleConstrain(
                  {x:hlps.u_0.numericValue,y:hlps.v_0.numericValue},
                  vars.constrainingCircle,cs.keyword.INTERIOR
                );
                exprs.push({id:'center',color:cs.A0597772.CENTER_COLOR});
                break;
              case 'intersection':
                corrected = hs.circleConstrain(
                  {x:hlps.u_1.numericValue,y:hlps.v_1.numericValue},
                  vars.constrainingCircle,cs.keyword.INTERIOR
                );
                exprs.push({id:'intersection',color:cs.A0597772.INTERSECTION_COLOR});
                break;
              default:
                return;
            }

            // o.log('Center: ('+hlps.u_0.numericValue+','+hlps.v_0.numericValue+')');
            // o.log('Intersection: ('+hlps.u_1.numericValue+','+hlps.v_1.numericValue+')');
            // o.log('Constraint: ('+vars.constrainingCircle.x+','+vars.constrainingCircle.y+','+vars.constrainingCircle.r+')');
            // o.log('Distance: '+Math.sqrt(Math.pow(hlps.u_0.numericValue-hlps.u_1.numericValue,2)+Math.pow(hlps.v_0.numericValue-hlps.v_1.numericValue,2)));
            // o.log('Corrected: ('+corrected.x+','+corrected.y+')')

            exprs.push({id:'placeholder',hidden:true});

            exprs.push({id:'u_'+vars.placeholder,latex:'u_'+vars.placeholder+'='+corrected.x});
            exprs.push({id:'v_'+vars.placeholder,latex:'v_'+vars.placeholder+'='+corrected.y});

            disableCorrection();
            o.desmos.setExpressions(exprs);
            delete vars.placeholder;
            setTimeout(enableCorrection,5*cs.delay.SET_EXPRESSION);
            vars.belayUntil = Date.now() + cs.delay.SET_EXPRESSION;
           };

          function setPlaceholder(draggingPoint) {
            if(draggingPoint === undefined) {
              draggingPoint=vars.draggingPoint;
            }
            // o.log('Setting Placeholder');
            var exprs = [];
            if (vars.placeholder === undefined) {
              vars.placeholder = ((draggingPoint === 'center')?0:1);
              exprs.push({id:draggingPoint,color:cs.A0597772.HIDDEN_COLOR});
              var stringBase = '\\left(x_#,y_#\\right)';
              exprs.push({
                id:'placeholder',
                latex:stringBase.replace(new RegExp('#','g'),vars.placeholder),
                hidden:false,
                dragMode:Desmos.DragModes.XY
              });
            } else {return;}
            o.desmos.setExpressions(exprs);
           }

          correctIt = function(draggingPoint) {
            if(draggingPoint === undefined) {
              draggingPoint=vars.draggingPoint;
            }
            var point;
            var corrected;

            o.log('Correcting It; dragging point = '+draggingPoint);
            switch (draggingPoint) {
              case 'center':
                if (hlps.D.numericValue < hlps.R.numericValue-cs.distance.CONSTRAIN_BUFFER) {
                  if (vars.placeholder !== undefined) {clearPlaceholder();}
                  return;
                }
                if (vars.constrainingCircle === undefined) {vars.constrainingCircle = {x:hlps.u_1.numericValue,y:hlps.v_1.numericValue,r:hlps.R.numericValue};}
                if (vars.dragging === true) {setPlaceholder(draggingPoint);}
                else {
                  point = {x:hlps.u_0.numericValue,y:hlps.v_0.numericValue};
                  corrected = hs.circleConstrain(point,vars.constrainingCircle,cs.keyword.INTERIOR);
                  if (corrected !== point) {
                    o.desmos.setExpressions([
                      {id:'u_0',latex:'u_0='+corrected.x},
                      {id:'v_0',latex:'v_0='+corrected.y}
                    ]);
                    setTimeout(adjustHandles,cs.delay.SET_EXPRESSION);
                  }
                }
                break;
              case 'intersection':
                if (hlps.D.numericValue < hlps.R.numericValue-cs.distance.CONSTRAIN_BUFFER) {
                  if (vars.placeholder !== undefined) {clearPlaceholder();}
                  return;
                }
                if (vars.constrainingCircle === undefined) {vars.constrainingCircle = {x:hlps.u_0.numericValue,y:hlps.v_0.numericValue,r:hlps.R.numericValue};}
                if (vars.dragging === true) {setPlaceholder(draggingPoint);}
                else {
                  point = {x:hlps.u_1.numericValue,y:hlps.v_1.numericValue};
                  corrected = hs.circleConstrain(point,vars.constrainingCircle,cs.keyword.INTERIOR);
                  if (corrected !== point) {
                    o.desmos.setExpressions([
                      {id:'u_1',latex:'u_1='+corrected.x},
                      {id:'v_1',latex:'v_1='+corrected.y}
                    ]);
                    setTimeout(adjustHandles,cs.delay.SET_EXPRESSION);
                  }
                }
                break;
              default:
                return;
            }
            return;
           };

          function click() {
            vars.dragging=true;
            // escape();
          }

          var escape;

          unclick = function() {
            vars.dragging=false;
            delete vars.draggingPoint;
            document.removeEventListener('mouseup',unclick);
            document.removeEventListener('touchend',unclick);
            // escape();
            setTimeout(function(){
              if (vars === vs[o.uniqueId]) {replaceHandles();}
              else {escape();}
            },cs.delay.SET_EXPRESSION);
          };

          escape = function() {
            document.removeEventListener('mousedown',click);
            document.removeEventListener('touchstart',click);
            document.removeEventListener('mouseup',unclick);
            document.removeEventListener('touchend',unclick);
          };

          document.addEventListener('mousedown',click);
          document.addEventListener('touchstart',click);

          setTimeout(function(){
            activateHandles();
            enableCorrection();
            // logChanges();
          },cs.delay.LOAD);
         }
       };

      /* ←— A0597773 FUNCTIONS ——————————————————————————————————————————————→ */
        cs.A0597773 = {
          CENTER_COLOR:cs.color.agaColors.black,
          INTERSECTION_COLOR:cs.color.agaColors.black,
          HIDDEN_COLOR:'#FFFFFF',
          LEG_HANDLE:'\\theta_LEGNUM=SIGN\\operatorname{sign}\\left(D_{pl}\\left(\\left[u_{HLEGNUMPOINTID},v_{HLEGNUMPOINTID},1\\right],U_{through}\\left(\\left[0,0,1\\right],\\left[x_V,y_V,1\\right]\\right)\\right)\\right)\\min\\left(\\arcsin\\left(\\min\\left(1,\\frac{r_C}{d}\\right)\\right),\\theta_{LVL}\\left(H_{LEGNUMPOINTID},V,C\\right)\\right)',
          VERTEX_COORDINATE:'COORDINATE_V=COORDINATE_C+HANDLE_V\\max\\left(\\frac{r_C\\left(1+10^{-10}\\right)}{D},\\min\\left(1,\\frac{R}{D}\\right)\\right)',
          R_DEPENDENT_ON_THETAS:'R=\\left\\{\\theta_1=0:\\left\\{\\theta_2=0:10^{100}r_C,R_2\\right\\},\\theta_2=0:R_1,\\min\\left(R_1,R_2\\right)\\right\\}',
          THETAS_DEPENDENT_ON_D:'\\theta_LEGNUM=SIGN\\min\\left(PREVMEASURE,\\arcsin\\left(\\min\\left(1,\\frac{r_C}{d}\\right)\\right)\\right)'
         };
       fs.A0597773 = {
        // TK TODO STUB differentiate parts a, b, c
        /* ←— circleConstrain ———————————————————————————————————————————————→ *\
         | Monitors x_1 and y_1 and corrects them if they go outside the circle
         |  centered at x_0, y_0 with radius r_0
         | (Initialization option; starts the whole graph)
         * ←—————————————————————————————————————————————————————————————————→ */
         init: function(){
          var o = hs.parseArgs(arguments);
          var vars = vs[o.uniqueId];
          mergeObjects(vars,{draggingPoint:null,dragging:false});
          var hlps = hxs[o.uniqueId];
          var cons = cs.A0597773;
          vars.belayUntil = Date.now()+cs.delay.LOAD;

          mergeObjects(hlps,{
            x_C:hlps.maker({latex:'x_C'}),
            y_C:hlps.maker({latex:'y_C'}),
            x_V:hlps.maker({latex:'x_V'}),
            y_V:hlps.maker({latex:'y_V'}),
            u_V:hlps.maker({latex:'u_V'}),
            v_V:hlps.maker({latex:'v_V'}),
            u_H1near:hlps.maker({latex:'u_{H1near}'}),
            v_H1near:hlps.maker({latex:'v_{H1near}'}),
            u_H1far:hlps.maker({latex:'u_{H1far}'}),
            v_H1far:hlps.maker({latex:'v_{H1far}'}),
            u_H2near:hlps.maker({latex:'u_{H2near}'}),
            v_H2near:hlps.maker({latex:'v_{H2near}'}),
            u_H2far:hlps.maker({latex:'u_{H2far}'}),
            v_H2far:hlps.maker({latex:'v_{H2far}'}),

            r_C:hlps.maker({latex:'r_C'}),
            R:hlps.maker({latex:'R'}),
            theta_1:hlps.maker({latex:'\\theta_1'}),
            theta_2:hlps.maker({latex:'\\theta_2'}),

            theta_VC:hlps.maker({latex:'\\theta_{VC}'}),
            theta_1near:hlps.maker({latex:'\\theta_{1near}'}),
            theta_1far:hlps.maker({latex:'\\theta_{1far}'}),
            theta_2near:hlps.maker({latex:'\\theta_{2near}'}),
            theta_2far:hlps.maker({latex:'\\theta_{2far}'}),

            arc_near:hlps.maker({latex:'\\theta_{arc}\\left[1\\right]'}),
            arc_far:hlps.maker({latex:'\\theta_{arc}\\left[2\\right]'}),
            angle:hlps.maker({latex:'\\operatorname{round}\\left(\\left|\\theta_1+\\theta_2\\right|\\right)'}),

            t_ick:hlps.maker({latex:'t_{ick}'})
          });

          var unclick;

          function isolateHandle(which) {
            // o.log('Isolating Handles');
            objKeys(hlps).forEach(function(helper) {
              if(helper !== 'maker') {
                hlps[helper].unobserve('numericValue.dragging');
              }
            });
            document.addEventListener('mouseup',unclick);
            document.addEventListener('touchend',unclick);

            // o.log(which+' changed.');


            vars.dragging = true;
            var exprs = [
              {id:'vertex_handle',hidden:(which[2] !== 'V')},
              {id:'H1near',hidden:(!((new RegExp('H1near')).test(which)))},
              {id:'H1far',hidden:(!((new RegExp('H1far')).test(which)))},
              {id:'H2near',hidden:(!((new RegExp('H2near')).test(which)))},
              {id:'H2far',hidden:(!((new RegExp('H2far')).test(which)))}//*/
            ];

            if (which[2] === 'H') {
              exprs.push({id:('theta_'+which[3]),latex:(cons.LEG_HANDLE.replace(new RegExp('LEGNUM','g'),which[3]).replace(new RegExp('POINTID','g'),which.substring(4,which.length)).replace(new RegExp('SIGN'),((which[3] === '1')?'-':'')))});
              exprs.push({id:'x_V',latex:'x_V=x_C+u_V'});
              exprs.push({id:'y_V',latex:'y_V=y_C+v_V'});
              vars.draggingPoint = which.substring(2,which.length);
            } else if ((new RegExp('[uv]_V')).test(which)) {
              exprs.push({id:'x_V',latex:(cons.VERTEX_COORDINATE.replace(new RegExp('COORDINATE','g'),'x').replace(new RegExp('HANDLE','g'),'u'))});
              exprs.push({id:'y_V',latex:(cons.VERTEX_COORDINATE.replace(new RegExp('COORDINATE','g'),'y').replace(new RegExp('HANDLE','g'),'v'))});
              exprs.push({id:'maximumDistance',latex:'R=10^{100}r_C'});
              exprs.push({id:'theta_1',latex:cons.THETAS_DEPENDENT_ON_D.replace(new RegExp('LEGNUM','g'),'1').replace(new RegExp('SIGN','g'),((hlps.theta_1.numericValue>=0)?'':'-')).replace(new RegExp('PREVMEASURE','g'),''+Math.abs(hlps.theta_1.numericValue))});
              exprs.push({id:'theta_2',latex:cons.THETAS_DEPENDENT_ON_D.replace(new RegExp('LEGNUM','g'),'2').replace(new RegExp('SIGN','g'),((hlps.theta_2.numericValue>=0)?'':'-')).replace(new RegExp('PREVMEASURE','g'),''+Math.abs(hlps.theta_2.numericValue))});
              vars.draggingPoint = 'vertex_handle';
            } else if ((new RegExp('[xy]_C')).test(which)) {
              vars.draggingPoint = 'center';
            } else if (which === 'r_C') {
              exprs.push({id:'u_V',latex:('u_V=\\frac{r_C}{'+vars.lastRadius+'}\\cdot'+hlps.u_V.numericValue)});
              exprs.push({id:'v_V',latex:('v_V=\\frac{r_C}{'+vars.lastRadius+'}\\cdot'+hlps.v_V.numericValue)});
              vars.draggingPoint = 'radius';
            }

            // o.log('Isolating handle '+which+'; setting expressions:',exprs);

            o.desmos.setExpressions(exprs);
          }

          var activateHandles;

          function adjustHandles() {
            // o.log('Adjusting Handles');
            if (Date.now() < vars.belayUntil) {setTimeout(adjustHandles,vars.belayUntil-Date.now());return;}

            vars.belayUntil = Date.now()+cs.delay.EXECUTE_HELPER;

            // o.log('x_C='+hlps.x_C.numericValue,'; y_C='+hlps.r_C.numericValue,'; theta_VC='+hlps.theta_VC.numericValue,'; theta_1near='+hlps.theta_1near.numericValue);

            var exprs = [
              {id:'u_H1near',latex:'u_{H1near}='+hs.number(hlps.r_C.numericValue*Math.cos(Math.PI*(1+(hlps.theta_VC.numericValue+hlps.theta_1near.numericValue)/180)))},
              {id:'v_H1near',latex:'v_{H1near}='+hs.number(hlps.r_C.numericValue*Math.sin(Math.PI*(1+(hlps.theta_VC.numericValue+hlps.theta_1near.numericValue)/180)))},
              {id:'u_H1far',latex:'u_{H1far}='+hs.number(hlps.r_C.numericValue*Math.cos(Math.PI*(1+(hlps.theta_VC.numericValue+hlps.theta_1far.numericValue)/180)))},
              {id:'v_H1far',latex:'v_{H1far}='+hs.number(hlps.r_C.numericValue*Math.sin(Math.PI*(1+(hlps.theta_VC.numericValue+hlps.theta_1far.numericValue)/180)))},
              {id:'u_H2near',latex:'u_{H2near}='+hs.number(hlps.r_C.numericValue*Math.cos(Math.PI*(1+(hlps.theta_VC.numericValue-hlps.theta_2near.numericValue)/180)))},
              {id:'v_H2near',latex:'v_{H2near}='+hs.number(hlps.r_C.numericValue*Math.sin(Math.PI*(1+(hlps.theta_VC.numericValue-hlps.theta_2near.numericValue)/180)))},
              {id:'u_H2far',latex:'u_{H2far}='+hs.number(hlps.r_C.numericValue*Math.cos(Math.PI*(1+(hlps.theta_VC.numericValue-hlps.theta_2far.numericValue)/180)))},
              {id:'v_H2far',latex:'v_{H2far}='+hs.number(hlps.r_C.numericValue*Math.sin(Math.PI*(1+(hlps.theta_VC.numericValue-hlps.theta_2far.numericValue)/180)))}/* ,
              {id:'x_V',latex:(cons.VERTEX_COORDINATE.replace(new RegExp('COORDINATE','g'),'x').replace(new RegExp('HANDLE','g'),'u')},
              {id:'y_V',latex:(cons.VERTEX_COORDINATE.replace(new RegExp('COORDINATE','g'),'y').replace(new RegExp('HANDLE','g'),'v')}// */
            ];

            // o.log('Adjusting handles; setting expressions:',exprs);

            o.desmos.setExpressions(exprs);

            vars.belayUntil = Date.now()+cs.delay.SET_EXPRESSION;
            setTimeout(activateHandles,cs.delay.SET_EXPRESSION);
          }

          function replaceHandles() {
            // o.log('Replacing Handles');

            // adjustHandles();

            // o.log(hlps.x_V.latex+'='+hlps.x_V.numericValue,hlps.x_C.latex+'='+hlps.x_C.numericValue,hlps.y_V.latex+'='+hlps.y_V.numericValue,hlps.y_C.latex+'='+hlps.y_C.numericValue);

            var exprs = [
              {id:'u_V',latex:('u_V='+hs.number(hlps.x_V.numericValue-hlps.x_C.numericValue))},
              {id:'v_V',latex:('v_V='+hs.number(hlps.y_V.numericValue-hlps.y_C.numericValue))},
              {id:'theta_1',latex:('\\theta_1='+hlps.theta_1.numericValue)},
              {id:'theta_2',latex:('\\theta_2='+hlps.theta_2.numericValue)},
              {id:'maximumDistance',latex:cons.R_DEPENDENT_ON_THETAS}
            ];

            // o.log('Replacing handles; setting expressions:',exprs);

            o.desmos.setExpressions(exprs);

            adjustHandles();
            setTimeout(adjustHandles,cs.delay.SET_EXPRESSION*5);
            // setTimeout(activateHandles,cs.delay.SET_EXPRESSION*2);
          }

          activateHandles = function() {
            // o.log('Activating Handles');

            vars.lastRadius = hlps.r_C.numericValue;

            var exprs=[
              {id:'center',hidden:true},
              {id:'vertex_handle',hidden:false},
              {id:'H1near',hidden:(Math.abs(Math.sin(Math.PI*hlps.theta_1near.numericValue/180)*hlps.r_C.numericValue/Math.sin(Math.PI*hlps.theta_1.numericValue/180))<hlps.t_ick.numericValue)},
              {id:'H1far',hidden:false},
              {id:'H2near',hidden:(Math.abs(Math.sin(Math.PI*hlps.theta_2near.numericValue/180)*hlps.r_C.numericValue/Math.sin(Math.PI*hlps.theta_2.numericValue/180))<hlps.t_ick.numericValue)},
              {id:'H2far',hidden:false}
            ];

            // o.log('Activating handles; setting expressions:',exprs);

            o.desmos.setExpressions(exprs);

            objKeys(hlps).forEach(function(helper) {
              if ((new RegExp('(?:[uv]_|_C)')).test(helper)) {
                // o.log('Observing '+helper);
                hlps[helper].observe(
                  'numericValue.dragging',
                  function(){if(vars.dragging){isolateHandle(helper);}}
                );
              }
            });
          };

          function updateEquation() {
            var expr = hlps.angle.numericValue+'=½('+hlps.arc_far.numericValue+'-'+hlps.arc_near.numericValue+')';
            expr = hs.latexToText(expr);
            o.desmos.setExpression({id:'center',label:expr});
          }

          function click() {
            vars.dragging=true;
            //document.removeEventListener('mousedown',click);
            //document.removeEventListener('touchstart',click);
          }

          unclick = function() {
            vars.dragging=false;
            document.removeEventListener('mouseup',unclick);
            document.removeEventListener('touchend',unclick);
            setTimeout(replaceHandles,cs.delay.SET_EXPRESSION);
          };

          function escape() {
            document.removeEventListener('mousedown',click);
            document.removeEventListener('touchstart',click);
            document.removeEventListener('mouseup',unclick);
            document.removeEventListener('touchend',unclick);
          }

          function debug() {
            hlps.theta_1.observe('numericValue',function(){if (myIsNaN(hlps.theta_1.numericValue)) {
              escape();
              return;//*/
            }});
          }

          document.addEventListener('mousedown',click);
          document.addEventListener('touchstart',click);

          setTimeout(function(){
            activateHandles();
            hlps.angle.observe('numericValue',updateEquation);
            hlps.arc_far.observe('numericValue',updateEquation);
            hlps.arc_near.observe('numericValue',updateEquation);
            updateEquation();
            debug();
          },cs.delay.LOAD);
         }
       };

      /* ←— A0597789 FUNCTIONS ——————————————————————————————————————————————→ */
        cs.A0597789 = {
          MARGIN: 18,
          LINE_HEIGHT: 24,
          EX: 8
         };
       fs.A0597789 = {
        /* ←— init ——————————————————————————————————————————————————————→ *\
         | Preps the watcher
         * ←—————————————————————————————————————————————————————————————————→ */
         init: function(){
          var o = hs.parseArgs(arguments);
          o.desmos.observe('graphpaperBounds',function(){
            var cons = cs.A0597789;
            var units = o.desmos.graphpaperBounds.mathCoordinates;
            var pixels = o.desmos.graphpaperBounds.pixelCoordinates;
            var left = units.left+cons.MARGIN*units.width/pixels.width;
            var top = units.top-cons.MARGIN*units.height/pixels.height;
            var second = top-cons.LINE_HEIGHT*units.height/pixels.height;
            o.desmos.setExpression({id:'volumeCone',latex:'\\left('+(left+10.5*cons.EX*units.width/pixels.width)+','+top+'\\right)'});
            o.desmos.setExpression({id:'volumeStack',latex:'\\left('+(left+13*cons.EX*units.width/pixels.width)+','+second+'\\right)'});
          });
         },
        /* ←— volumeCone ——————————————————————————————————————————————————————→ *\
         | Updates the volume of the cone
         * ←—————————————————————————————————————————————————————————————————→ */
         volumeCone: function(){
          var o = hs.parseArgs(arguments);
          o.desmos.setExpression({id:'volumeCone',label:'Volume of cone: '+o.value});
         },
        /* ←— volumeStack ——————————————————————————————————————————————————————→ *\
         | Updates the volume of the stack
         * ←—————————————————————————————————————————————————————————————————→ */
         volumeStack: function(){
          var o = hs.parseArgs(arguments);
          o.desmos.setExpression({id:'volumeStack',label:'Total volume of stack: '+o.value});
         }
       };

      /* ←— A0598528 FUNCTIONS ——————————————————————————————————————————————→ */
       fs.A0598528 = {
        /* ←— showHideQRST ——————————————————————————————————————————————————→ *\
         | Shows or hides QRST
         * ←—————————————————————————————————————————————————————————————————→ */
         showHideQRST: function(){
          var o = hs.parseArgs(arguments);
          o.desmos.setExpressions([
            {id:'EdgesQRST',type:'table',columns:[{},{hidden:o.value}]},
            {id:'Q',hidden:o.value,showLabel:(!(o.value))},
            {id:'R',hidden:o.value,showLabel:(!(o.value))},
            {id:'S',hidden:o.value,showLabel:(!(o.value))},
            {id:'T',hidden:o.value,showLabel:(!(o.value))}
           ]);
         },
        /* ←— showHideEFGH ——————————————————————————————————————————————————→ *\
         | Shows or hides EFGH
         * ←—————————————————————————————————————————————————————————————————→ */
         showHideEFGH: function(){
          var o = hs.parseArgs(arguments);
          o.desmos.setExpressions([
            {id:'EdgesEFGH',type:'table',columns:[{},{hidden:o.value}]},
            {id:'E',hidden:o.value,showLabel:(!(o.value))},
            {id:'F',hidden:o.value,showLabel:(!(o.value))},
            {id:'G',hidden:o.value,showLabel:(!(o.value))},
            {id:'H',hidden:o.value,showLabel:(!(o.value))}
           ]);
         }
       };

      /* ←— A0598652 FUNCTIONS ——————————————————————————————————————————————→ */
       fs.A0598652 = {
        /* ←— updateLabels ————————————————————————————————————————————————————→ *\
         | updates the distance label
         |
         | Hidden point D must be authored with showLabel:true,
         | and the ID distance
         * ←———————————————————————————————————————————————————————————————————→ */
         updateLabels: function(){
          var o = hs.parseArgs(arguments);
          o.desmos.setExpression({id:'distance',label:(o.value+' blocks')});
          }
       };


      /* ←— A0598789A FUNCTIONS ——————————————————————————————————————————————→ */
       fs.A0598789A = {
        /* ←— updateLabels ————————————————————————————————————————————————————→ *\
         | updates the label of absolute value function g(x) = a|x|.
         |
         | Hidden point must be authored with showLabel:true,
         | and the ID 467
         * ←———————————————————————————————————————————————————————————————————→ */
         updateLabels: function(){
          var o = hs.parseArgs(arguments);
          
          if (o.value > 0){
            o.desmos.setExpression({id:'467',label:('g(x) = '+ hs.latexToText(o.value) +'|x|')});
          } else {
            o.desmos.setExpression({id:'467',label:('g(x) = 0')});
          }
         }
       };

      /* ←— A0598789B FUNCTIONS ——————————————————————————————————————————————→ */
       fs.A0598789B = {
        /* ←— updateLabels ————————————————————————————————————————————————————→ *\
         | updates the label of absolute value function h(x) = a|x|.
         |
         | Hidden point must be authored with showLabel:true,
         | and the ID 467
         * ←———————————————————————————————————————————————————————————————————→ */
         updateLabels: function(){
          var o = hs.parseArgs(arguments);
          
          if(o.value < 0){
            o.desmos.setExpression({id:'467',label:('h(x) = '+ hs.latexToText(o.value) +'|x|')});
          } else {
            o.desmos.setExpression({id:'467',label:('h(x) = 0')});
          }
         }
       };

       /* ←— A0598800 FUNCTIONS ——————————————————————————————————————————————→ */
       fs.A0598800 = {
        /* ←— updateAVfunction ————————————————————————————————————————————————————→ */
         updateAVfunction: function(){
          var o = hs.parseArgs(arguments);
        
          if (o.value > 0) {
              o.desmos.setExpression({id:'4',label:('g(x) = |x| + '+ o.value)});
          } else if (o.value < 0) {
            o.desmos.setExpression({id:'4',label:('g(x) = |x| – '+ -o.value)});
          } else {
            o.desmos.setExpression({id:'4',label:('g(x) = |x|')});
          }
          }
       };

      /* ←— A0598801 FUNCTIONS ——————————————————————————————————————————————→ */
       fs.A0598801 = {
        /* ←— updateAVfunction ————————————————————————————————————————————————→ */
         updateAVfunction: function(){
          var o = hs.parseArgs(arguments);
        
          if (o.value > 0) {
              o.desmos.setExpression({id:'9',label:('g(x) = |x – '+ o.value+'|')});
          } else if (o.value < 0) {
            o.desmos.setExpression({id:'9',label:('g(x) = |x + '+ -o.value +'|')});
          } else {
            o.desmos.setExpression({id:'9',label:('g(x) = |x|')});
          }
        }
       };

      /* ←— A0598802 FUNCTIONS ——————————————————————————————————————————————→ */
       fs.A0598802 = {
        /* ←— init ————————————————————————————————————————————————————————————→ *\
         | Initializes the variables
         * ←———————————————————————————————————————————————————————————————————→ */
         init: function(){
          var o = hs.parseArgs(arguments);
          vs[o.uniqueId] = {
            // try changing 'h' with it's id (4) instead same with "k" (3).
            h:4,
            k:-2
          };

         },
        /* ←— updateAVfunction ————————————————————————————————————————————————→ */
         updateAVfunction: function(){
          var o = hs.parseArgs(arguments);
          var k = vs[o.uniqueId].k;
          var h = vs[o.uniqueId].h;
      
          switch (o.name) {
            case 'h':
              vs[o.uniqueId].h = o.value;
              h = o.value;
                if(k > 0){ 
                  if (h > 0){
                    o.desmos.setExpression({id:7,label:'g(x) = |x – '+ h + '| + '+ k });
                  }
                  else if (h < 0) {
                    o.desmos.setExpression({id:7,label:'g(x) = |x + '+ -h + '| + '+ k });
                  }
                  else {
                     o.desmos.setExpression({id:7,label:'g(x) = |x| + '+ k });
                  }
                }
                else if (k < 0) {

                  if (h > 0){
                    o.desmos.setExpression({id:7,label:'g(x) = |x – '+ h + '| – '+ -k });
                  }
                  else if (h < 0) {
                    o.desmos.setExpression({id:7,label:'g(x) = |x + '+ -h + '| – '+ -k });
                  }
                  else {
                     o.desmos.setExpression({id:7,label:'g(x) = |x| – '+ -k });
                  }
                }
                else{
                  if (h > 0){
                    o.desmos.setExpression({id:7,label:'g(x) = |x – '+ h + '|'});
                  }
                  else if (h < 0) {
                    o.desmos.setExpression({id:7,label:'g(x) = |x + '+ -h + '|'});
                  }
                  else {
                     o.desmos.setExpression({id:7,label:'g(x) = |x| '});
                  }
                }
              break;
            case 'k':
              vs[o.uniqueId].k = o.value;
              k = o.value;
                if(h > 0){
                  if (k > 0){
                    o.desmos.setExpression({id:7,label:'g(x) = |x – '+ h + '| + '+ k });
                  }
                  else if (k < 0){
                    o.desmos.setExpression({id:7,label:'g(x) = |x – '+ h + '| – '+ -k });
                  }
                  else{
                     o.desmos.setExpression({id:7,label:'g(x) = |x – '+ h +'|'});
                  }
                }
                else if (h < 0) {

                  if (k > 0){
                    o.desmos.setExpression({id:7,label:'g(x) = |x + '+ -h + '| + '+ k });
                  }
                  else if (k < 0){
                    o.desmos.setExpression({id:7,label:'g(x) = |x + '+ -h + '| – '+ -k });
                  }
                  else{
                     o.desmos.setExpression({id:7,label:'g(x) = |x + '+ -h +'|'});
                  }
                }
                else {
                  if (k > 0){
                    o.desmos.setExpression({id:7,label:'g(x) = |x| + ' + k });
                  }
                  else if (k < 0){
                    o.desmos.setExpression({id:7,label:'g(x) = |x| – '+ -k });
                  }
                  else{
                     o.desmos.setExpression({id:7,label:'g(x) = |x|'});
                  }
                }         
              break;      
            }
           } 
       };

      /* ←— A0598803 FUNCTIONS ——————————————————————————————————————————————→ */
       fs.A0598803 = {
        /* ←— updateAVfunction ————————————————————————————————————————————————→ */
         updateAVfunction: function(){
          var o = hs.parseArgs(arguments);
          o.desmos.setExpression({id:'12',label:('g(x) = '+hs.latexToText(o.value) +'|x|')});
         }
       };

       /* ←— A0598832 FUNCTIONS ——————————————————————————————————————————————→ */
       fs.A0598832 = {
        /* ←— init ——————————————————————————————————————————————————————→ *\
         | Preps the watchers
         * ←—————————————————————————————————————————————————————————————————→ */
         init: function(){
          var o = hs.parseArgs(arguments);
          vs[o.uniqueId] = {
            lastPointCount:0
          };
         },
        /* ←— changeLineType ————————————————————————————————————————————————→ *\
         | Toggle switch should use -n and n to toggle line type on line n
         | positive for SOLID, otherwise, DASHED
         * ←—————————————————————————————————————————————————————————————————→ */
         changeLineType: function(){
          var o = hs.parseArgs(arguments);
          o.desmos.setExpression({
            id:o.id,
            style:((o.value>0)?cs.keyword.lineType.SOLID:cs.keyword.lineType.DASHED)
          });
         },
        /* ←— changeStep ——————————————————————————————————————————————————————→ *\
         | Switches to the next step.
         * ←—————————————————————————————————————————————————————————————————→ */
         regionsAddRemove: function(){
          var o = hs.parseArgs(arguments);
          var vars = vs[o.uniqueId];
          var exprs = [];

          var i;

          // Add
          for(i = vars.lastPointCount+1; i <= o.value; i+=1) {
            exprs.push(
              {id:('R_'+i),hidden:false},
              {id:('T_'+i),hidden:false}
             );
           }

          // Remove
          for(i = o.value+1; i <= vars.lastPointCount; i+=1) {
            exprs.push(
              {id:('T_'+i),hidden:true},
              {id:('R_'+i),hidden:true}
             );
           }

          vars.lastPointCount = o.value;

          o.desmos.setExpressions(exprs);
         }
       };

      /* ←— A0598839 FUNCTIONS ——————————————————————————————————————————————→ */
       fs.A0598839 = {
        /* ←— init ——————————————————————————————————————————————————————————→ *\
         | sets the
         * ←—————————————————————————————————————————————————————————————————→ */
         init: function(){
          var o = hs.parseArgs(arguments);
          vs[o.uniqueId] = {
            orange:1,
            blue:1
          };
         },
         orange: function(){
          var o = hs.parseArgs(arguments);
          vs[o.uniqueId].orange = o.value;
          fs.A0598839.setPlanes(o);
         },
         blue: function(){
          var o = hs.parseArgs(arguments);
          vs[o.uniqueId].blue = o.value;
          fs.A0598839.setPlanes(o);
         },
         setPlanes: function(){
          var o = hs.parseArgs(arguments);
          var orange = vs[o.uniqueId].orange;
          var blue = vs[o.uniqueId].blue;

          o.desmos.setExpressions([
            {id:'orange_boundary',hidden:(!orange)},
            {id:'blue_boundary',hidden:(!blue)},
            {id:'intersection_line',hidden:(!orange || !blue)},
            {id:'blue_intersection',hidden:(!orange || !blue)},
            {id:'orange_intersection',hidden:(!orange || !blue)},
            {id:'blue_plane',latex:('\\left|x\\right|+\\left|y\\right|>-1\\left\\{b_{lue}\\left(x,y\\right)=1\\right\\}'+(orange?'\\left\\{o_{range}\\left(x,y\\right)=-1:1,x_ia_{bove}D_{pl}\\left(\\left[x,y,1\\right],i_{ob}\\right)\\ge0:1\\right\\}':'')),hidden:(!blue)},
            {id:'orange_plane',latex:('\\left|x\\right|+\\left|y\\right|>-1\\left\\{o_{range}\\left(x,y\\right)=1\\right\\}'+(blue?'\\left\\{b_{lue}\\left(x,y\\right)=-1:1,x_ia_{bove}D_{pl}\\left(\\left[x,y,1\\right],i_{ob}\\right)\\le0:1\\right\\}':'')),hidden:(!orange)}
           ]);
         }
       };

      /* ←— A0598945 FUNCTIONS ——————————————————————————————————————————————→ */
       fs.A0598945 = {
        /* ←— updateLabels ————————————————————————————————————————————————————→ *\
         | updates the label of the function.
         |       
         | Hidden point must be authored with showLabel:true,
         | and the ID 394
         * ←———————————————————————————————————————————————————————————————————→ */
         updateLabels: function(){
          var o = hs.parseArgs(arguments);
          o.desmos.setExpression({id:'394',label:('y = '+hs.latexToText(o.value)+' cos x')});
         }
       };

      /* ←— A0599213 FUNCTIONS ——————————————————————————————————————————————→ */
        cs.A0599213 = {
          regionLatex:'\\left|x\\right|>-1L_1\\left(x,y,s_N,t_N\\right)L_2\\left(x,y,s_N,t_N\\right)L_3\\left(x,y,s_N,t_N\\right)L_4\\left(x,y,s_N,t_N\\right)'
         };
       fs.A0599213 = {
        /* ←— init ——————————————————————————————————————————————————————→ *\
         | Preps the watchers
         * ←—————————————————————————————————————————————————————————————————→ */
         init: function(){
          var o = hs.parseArgs(arguments);
          vs[o.uniqueId] = {
            lastPointCount:0
          };
         },
        /* ←— changeLineType ————————————————————————————————————————————————→ *\
         | Toggle switch should use -n and n to toggle line type on line n
         | positive for SOLID, otherwise, DASHED
         * ←—————————————————————————————————————————————————————————————————→ */
         changeLineType: function(){
          var o = hs.parseArgs(arguments);
          o.desmos.setExpression({
            id:o.id,
            style:((o.value>0)?cs.keyword.lineType.SOLID:cs.keyword.lineType.DASHED)
          });
         },
        /* ←— changeStep ——————————————————————————————————————————————————————→ *\
         | Switches to the next step.
         * ←—————————————————————————————————————————————————————————————————→ */
         regionsAddRemove: function(){
          var o = hs.parseArgs(arguments);
          var vars = vs[o.uniqueId];
          var exprs = [];

          var i;

          // Add
          for(i = vars.lastPointCount+1; i <= o.value; i+=1) {
            exprs.push(
              {id:('R_'+i),hidden:false},
              {id:('T_'+i),hidden:false}
             );
           }

          // Remove
          for(i = o.value+1; i <= vars.lastPointCount; i+=1) {
            exprs.push(
              {id:('T_'+i),hidden:true},
              {id:('R_'+i),hidden:true}
             );
           }

          vars.lastPointCount = o.value;

          o.desmos.setExpressions(exprs);
         }
       };

      /* ←— A0669772 FUNCTIONS ——————————————————————————————————————————————→ */
       fs.A0669772 = {
        /* ←— register ——————————————————————————————————————————————————————→ *\
         | records a reference to the widget, and initializes it, if it is     |
         |  not already initialized.                                           |
         * ←—————————————————————————————————————————————————————————————————→ */
         register: function(){
          var o = hs.parseArgs(arguments);
          vs.A0669772 = vs.A0669772 || {};
          var vars = vs.A0669772;

          hxs.A0669772 = hxs.A0669772 || {
            widgets: []
          };

          // First initialization: register widget & either:
          //  record initial state (if no other widgets have been initialized)
          //  update initial state to match already-initialized widgets
          if(hxs.A0669772.widgets.indexOf(o.uniqueId) === -1) {
            o.log('Initializing...');
            o.desmos.removeExpression({id:'initial_state'});

            hxs.A0669772.widgets.push(o.uniqueId);

            if(vars.lastExprList === undefined) {
              vars.lastExprList = JSON.stringify(o.desmos.getExpressions());
              vars.lastState = o.desmos.getState();
              vars.lastDegreeMode = Boolean((o.desmos.getSettings ? o.desmos.getSettings() : o.desmos.settings).degreeMode);
            } else {
              (update())(o.uniqueId);
            }
          } else {
            // If this widget has already been initialized, that means it's being
            //  reset, which means all the other widgets should be reset too.
            o.log('Reinitializing...');
            o.desmos.unobserveAll();
            o.desmos.setExpression({id:'reset_state'});
            vars.lastExprList = JSON.stringify(o.desmos.getExpressions());
            vars.lastState = o.desmos.getState();
            vars.lastDegreeMode = Boolean((o.desmos.getSettings ? o.desmos.getSettings() : o.desmos.settings).degreeMode);
          }

          // After initialization stuff, get ready to share changes
          o.desmos.observeEvent('change',mirror(o.uniqueId));

          // For handling Expressions Topbar Reset Button
          o.desmos.observeEvent('graphReset',function(){
            o.log('Resetting...');
            o.desmos.unobserveAll();
            o.desmos.observeEvent('change',function(){
              o.log('Re-registering after reset...');
              o.desmos.unobserveAll();
              fs.A0669772.register(o);
            });
            // Should immediately trigger the above re-registratioin
            o.desmos.setExpression({id:'reset_state'});
          });

          o.log('Triggering initialization update.');
          o.desmos.removeExpressions([{id:'initial_state'},{id:'reset_state'}]);

          function mirror(source) {
            return function() {
              var desmos = cs.ENUM[source];
              var exprs = JSON.stringify(desmos.getExpressions());
              var state = desmos.getState();
              var degreeMode = Boolean((o.desmos.getSettings ? o.desmos.getSettings() : o.desmos.settings).degreeMode);
              o.log('Sensing update from widget [',source,'].');

              // Gadget Reset button will trigger 'change' before it re-initializes
              //  So we should skip the update so as not to accidentally un-reset
              if(exprs.indexOf('"id":"initial_state"') !== -1) {
                o.log('Widget [',source,'] has been reset.');
                return;
              }

              if(hs.compareJSON(vars.lastExprList,exprs)) {
                o.log('No change in Expression List.');
                if (vars.lastDegreeMode === degreeMode) {
                  o.log('No change in Degree Mode either.');
                  return;
                } else {
                  o.log('But Degree Mode has changed.');
                }
              }

              o.log('Updating other widgets...');
              vars.lastExprList = exprs;
              vars.lastState = state;
              hxs.A0669772.widgets.forEach(update(source));
            };
          }

          // Only update if the expressions (or degree mode) are different; do not update graph settings
          function update(source) {
            return function(target) {
              var desmos = cs.ENUM[target];
              var degreeMode = Boolean((o.desmos.getSettings ? o.desmos.getSettings() : o.desmos.settings).degreeMode);
              if(target === source) {
                o.log('Ignoring [',source,'] => [',target,'].');
                return;
              } else if(hs.compareJSON(vars.lastExprList,JSON.stringify(desmos.getExpressions()))) {
                o.log('No change to Expression List in target widget [',target,'].');
                if(vars.lastDegreeMode === Boolean(degreeMode)) {
                  o.log('No change in Degree Mode either.');
                  return;
                } else {
                  o.log('But Degree Mode has changed.');
                }
              }

              o.log('Updating widget [',target,'].');
              desmos.unobserveEvent('change');
              var newObserver = mirror(target);
              // Rather, remember old graph settings and replace them, since updating
              //  expressions only is otherwise hard.
              var settings = mergeObjects({},
                // Preserve most settings of the target
                (desmos.getSettings ? desmos.getSettings() : desmos.settings),
                // But carry degree mode from the source
                {degreeMode: vars.lastDegreeMode});
              var mathBounds = desmos.graphpaperBounds.mathCoordinates;

              desmos.setState(vars.lastState);
              desmos.updateSettings(settings);
              desmos.setMathBounds(mathBounds);

              desmos.observeEvent('change',newObserver);
            };
          }
         }
       };

      /* ←— A0669770 INT 11-5-2a C.Summary ———————————————————————————————→ *\
       | copies the model onto the residual graph
       * ←————————————————————————————————————————————————————————————————→ */
       fs.A0669770 = {};
      fs.A0669770.init = function() {
        var o = hs.parseArgs(arguments);

        cs.ENUM['A0669770_'+o.name] = o.desmos;
        if(o.name === 'left') {
          hxs.A0669770_left = hxs[o.uniqueId];
        }

        var left = cs.ENUM.A0669770_left;
        var right = cs.ENUM.A0669770_right;

        // Make sure both are initialized
        if(!(left instanceof Desmos.GraphingCalculator && right instanceof Desmos.GraphingCalculator)) {
          return;
        }

        var hlps = hxs.A0669770_left;

        function copyValue(name) {
          // In case one of them gets reset, we need to unlink the old instances.
          if (hlps[name] !== undefined) {
            hlps[name].unobserveAll();
          }
          hlps[name] = hlps.maker(name);
          hlps[name].observe('numericValue.A0669770', function(t,h) {
            right.setExpression({id:name,latex:name+'='+h[t]});
          });
        }

        ['x_1','y_1','x_2','y_2'].forEach(copyValue);

       };


  exports.cs = cs;

  if(window.debugLog) {
    exports.vs = vs;
    exports.hxs = hxs;
    exports.hs = hs;
  }
  mergeObjects(exports,hs.flattenFuncStruct(fs));

  return exports;
 }());
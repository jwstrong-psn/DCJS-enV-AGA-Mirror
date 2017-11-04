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
      enum:{
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
       }
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
        var keys = Object.keys(funcStruct);
        var l = keys.length;

        var i;
        var key;
        var item;
        for(i=0; i<l; i+=1) {
          key = keys[i];
          item = funcStruct[key];
          if (typeof item === 'object') {
            if (!(Object.assign(functions,flattenFuncStruct(item,prefix+key+'_')))) {
              return false;
            }
          } else if (typeof item === 'function') {
            functions[prefix+key] = item;
          } else {
            console.log(prefix+key+' is not a function or object');
            return false;
          }
        }
        return functions;
       },
      /* ←— parseOptions ——————————————————————————————————————————————————→ *\
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
       parseOptions: function(arg,name,desmos) {
        var options = {
          'value': arg,
          'name': name,
          'id': name,
          'desmos': desmos,
          'log':console.log // change to function(){} for production
        };

        if(typeof arg === 'object') {
          Object.assign(options,arg);
        }

        if (desmos === undefined) {
          options.desmos = window.calculator || window.Calc;
        }

        desmos = options.desmos;

        if (options.uniqueId === undefined) {
          options.uniqueId = desmos.guid;
        }

        if(vs[options.uniqueId]===undefined) {
          vs[options.uniqueId] = {};
        }
        if(hxs[options.uniqueId]===undefined) {
          hxs[options.uniqueId] = {};
        }
        if(hxs[options.uniqueId].maker===undefined) {
          hxs[options.uniqueId].maker = function(){
            return options.desmos.HelperExpression.apply(options.desmos,arguments);
          };
        }
        if (window.widget === undefined && options.log === console.log) {
          window.widget = desmos;
          window.reportDesmosError = function() {
            var element = document.createElement('a');
            element.setAttribute('href', 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify({
                id: options.uniqueId,
                state: desmos.getState(),
                variables: vs[options.uniqueId],
                // helpers: hs[options.uniqueId],
                screenshot: desmos.screenshot()
              },null,"\t")));
            element.setAttribute('download', 'Widget Error Report '+((new Date()).toISOString())+'.json');
            element.style.display = 'none';
            document.body.appendChild(element);
            element.click();
            document.body.removeChild(element);
          };
        }
        return options;
       },
      /* ←— latexToText ———————————————————————————————————————————————————————→ *\
       ↑ Convert a latex string to a plaintext string, e.g. for labels
       ↓
       * ←—————————————————————————————————————————————————————————————————————→ */
       latexToText: function(expr){
        expr = ''+expr;
        expr = expr.replace(/\\cdot\s?/g,'\u22c5');
        expr = expr.replace(/._\{([a-zA-Z])Var\}/g,'$1');
        expr = expr.replace(/([+=÷×\u22c5])/g,' $1 ');
        expr = expr.replace(/,/g,',\u202f');
        expr = expr.replace(/\^2/g,'²');
        expr = expr.replace(/\^3/g,'³');
        expr = expr.replace(/\\sqrt\{([^{}]*?)\}/g,'√($1)');
        expr = expr.replace(/\\theta\s?/g,'θ');
        expr = expr.replace(/\\pi\s?/g,'π');
        expr = expr.replace(/_0/g,'₀');
        expr = expr.replace(/_1/g,'₁');
        expr = expr.replace(/_2/g,'₂');
        expr = expr.replace(/\\(?:right|left)\\*([()\[\]|{}])/g,'$1');
        expr = expr.replace(/\\right/g,'');
        expr = expr.replace(/\\left/g,'');
        expr = expr.replace(/([^\s \u202f(\[{])\-/g,'$1 − ');
        expr = expr.replace(/\-/g,'−');
        return expr;
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
       | Point {x,y}, circle {x,y,r}, and side cs.enum.INTERIOR, EXTERIOR, or PERIMETER.
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
          side = cs.enum.PERIMETER;
        }
        if(buffer === undefined) {
          buffer = cs.distance.CONSTRAIN_BUFFER;
        }

        var dSquared = Math.pow(point.x-circle.x,2)+Math.pow(point.y-circle.y,2);
        var scaleBack;

        switch (side) {
          case cs.enum.PERIMETER:
            if (
              (buffer > 0) &&
              (Math.pow(circle.r-buffer,2) < dSquared &&
                dSquared < Math.pow(circle.r+buffer,2))
            ) {
              return point;
            }
            scaleBack = circle.r;
            break;
          case cs.enum.INTERIOR:
            if (dSquared < Math.pow(circle.r-buffer,2)) {
              return point;
            }
            scaleBack = circle.r-buffer*Math.pow(2,cs.ts.BUFFER_BUFFER);
            break;
          case cs.enum.EXTERIOR:
            if (dSquared > Math.pow(circle.r+buffer,2)) {
              return point;
            }
            scaleBack = circle.r+buffer*Math.pow(2,cs.ts.BUFFER_BUFFER);
            break;
          default:
            return null;
        }

        if (scaleBack < 0) {
          console.log('Negative circle constraint '+scaleBack);
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
          Object.assign(func,alphabet);
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
          Object.assign(func,alphabet);
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
        var o = hs.parseOptions.apply(this,arguments);

        if (o.log) {
          o.log('observeZoom activated with '+JSON.stringify(Object.assign({},o,{'desmos':'l'})));
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
        var o = hs.parseOptions.apply(this,arguments);
        o.desmos.setExpression({id:o.name,label:''+o.value});
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
        var o = hs.parseOptions.apply(this,arguments);
        o.desmos.setExpression({id:o.name,label:''+o.value+'°'});
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
        var o = hs.parseOptions.apply(this,[(options || {})]);
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
        var o = hs.parseOptions.apply(this,arguments);
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
        if(pointNames === undefined) {
          pointNames = {A:'A',B:'B',C:'C'};
        }
        if(prec === undefined) {
          prec = cs.precision.DEGREES;
        }
        var o = hs.parseOptions.apply(this,[(options || {})]);
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
        var o = hs.parseOptions.apply(this,[(options || {})]);
        var ps = Object.assign({refreshAll:false,exterior:false},params);
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
            if (measure(name) === undefined || Number.isNaN(measure(name))) {
              o.log('Angles of '+vars.polygonName+' not all defined. Delaying full refresh by '+cs.delay.SET_EXPRESSION+'ms');
              setTimeout(function(){
                fs.shared.label.labelPolyAngles(o,Object.assign({},ps,{refreshAll:true}),prec);
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

          o.log('Measured angles:',Object.assign({},p));

          // Points with the largest error introduce the least error when rounded oppositely
          // So, re-round points with the largest error to get the sum you want (but each one only once)
          var adjusting;
          while (apparentSum > desiredSum && sorted.length>1) 
          {
            adjusting = sorted.shift();
            o.log('Apparent sum of '+apparentSum+' too high; reducing value of angle '+adjusting+' by 1.');
            p[adjusting]-=1;
            apparentSum-=1;
          }
          while (apparentSum < desiredSum && sorted.length>1) 
          {
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

          o.log('Corrected angles:',Object.assign({},p));

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
        
        if (Number.isNaN(prevVal) || Number.isNaN(nextVal) || Number.isNaN(val)) {
          o.log('Angles of vertices '+prev+', '+v+', and '+next+' not all defined. Refreshing polygon '+vars.polygonName+' in '+cs.delay.SET_EXPRESSION+'ms');
          setTimeout(function(){fs.shared.label.labelPolyAngles(o,Object.assign({},ps,{refreshAll:true}),prec);},cs.delay.SET_EXPRESSION*300);
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
        var o = hs.parseOptions.apply(this,arguments);
        o.desmos.setExpression({id:o.id,hidden:(!(o.value))});
       }
     };


    /* ←— A0596342 FUNCTIONS ——————————————————————————————————————————————→ */
     fs.A0596342 = {
      /* ←— updateLabels ————————————————————————————————————————————————————→ *\
       | updates the label of f(x) based on value of a
       |
       | Hidden point must be authored with showLabel:true,
       | and the ID 17
       * ←———————————————————————————————————————————————————————————————————→ */
       updateLabels: function(){
        var o = hs.parseOptions.apply(this,arguments);
        o.desmos.setExpression({id:'17',label:('f(x) = '+o.value+'x²')});
       }
     };


    /* ←— A0596342_2 FUNCTIONS ——————————————————————————————————————————————→ */
     fs.A0596342_2 = {
      /* ←— updateLabels ————————————————————————————————————————————————————→ *\
       | updates the label of f(x) based on value of a
       |
       | Hidden point must be authored with showLabel:true,
       | and the ID 17
       * ←———————————————————————————————————————————————————————————————————→ */
       updateLabels: function(){
        var o = hs.parseOptions.apply(this,arguments);
        o.desmos.setExpression({id:'21',label:('y = '+o.value+'x²')});
        o.desmos.setExpression({id:'20',label:('f(x) = −'+o.value+'x²')});
       }
     };

    /* ←— A0596347 FUNCTIONS ——————————————————————————————————————————————→ */
     fs.A0596347 = {
      /* ←— updateLabels ————————————————————————————————————————————————————→ *\
       | updates the blue equation label 
       |       
       | Hidden point must be authored with showLabel:true,
       | and the ID 782
       * ←———————————————————————————————————————————————————————————————————→ */
       updateLabels: function(){
        var o = hs.parseOptions.apply(this,arguments);
        o.desmos.setExpression({id:'782',label:'y = −2x² + 4x'+(o.value<0?' − '+(-o.value):(o.value>0?' + '+o.value:''))});
       }
     };

    /* ←— A0596370 FUNCTIONS ——————————————————————————————————————————————→ */
     fs.A0596370 = {
      /* ←— init ——————————————————————————————————————————————————————→ *\
       | Preps the watcher
       * ←—————————————————————————————————————————————————————————————————→ */
       init: function(){
        var o = hs.parseOptions.apply(this,arguments);
        vs[o.uniqueId] = {lastStep:1};
       },
      /* ←— changeStep ——————————————————————————————————————————————————————→ *\
       | Switches to the next step.
       * ←—————————————————————————————————————————————————————————————————→ */
       changeStep: function(){
        var o = hs.parseOptions.apply(this,arguments);
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
            {id:'circumCircle',color:'#F15A22',style:cs.enum.lineType.SOLID,latex:
            'P\\left(R,\\operatorname{sign}\\left(y_C-U_y\\right)\\arccos\\left(\\frac{x_C-U_x}{R}\\right)+2\\pi tn_{animate},U_x,U_y\\right)'},
            {id:'traceRadius',latex:
            'P\\left(tR,\\operatorname{sign}\\left(y_C-U_y\\right)\\arccos\\left(\\frac{x_C-U_x}{R}\\right)+2\\pi n_{animate},U_x,U_y\\right)'}
          );
        } else {
          exprs.push({id:'traceRadius',latex:'1'});
          if(lt2) {
            exprs.push({id:'circumCircle',color:'#000000',style:cs.enum.lineType.DASHED,latex:'\\left(x-U_x\\right)^2+\\left(y-U_y\\right)^2=R^2'});
          } else if(lt4) {
            exprs.push({id:'circumCircle',latex:'1'});
          } else if(!lt5) {
            exprs.push({id:'circumCircle',color:'#F15A22',style:cs.enum.lineType.SOLID,latex:'\\left(x-U_x\\right)^2+\\left(y-U_y\\right)^2=R^2'});
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
        var o = hs.parseOptions.apply(this,arguments);
          
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
            {id:'inCircle',color:'#000000',style:cs.enum.lineType.DASHED,latex:
              '\\operatorname{distance}\\left(\\left(x,y\\right),U\\right)=R'
            }
          );
        } else if (o.value === 6) {
          exprs.push(
            {id:'inCircle',color:'#F15A22',style:cs.enum.lineType.SOLID,latex:
              'P\\left(R,\\arccos\\left(\\theta_{xabc}\\left[3\\right]\\right)\\operatorname{sign}\\left(\\theta_{yabc}\\left[3\\right]\\right)+I_{nv}\\frac{\\pi}{2}+2\\pi tn_{animation},U_x,U_y\\right)'
            }
          );
        } else {exprs.push({id:'inCircle',latex:'1'});}

        // radii
        if (o.value === 1) {exprs.push(
          {id:'pointTangents',color:'#000000',hidden:false,latex:
            'P\\left(I_{nv}R,\\theta_{abc}+\\arccos 0,U_x,U_y\\right)'
          },{id:'radii',style:cs.enum.lineType.SOLID,latex:
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
            },{id:'radii',style:cs.enum.lineType.DASHED,latex:
              'P\\left(I_{nv}Rt,\\theta_{abc}\\left[3\\right]+\\arccos 0,U_x,U_y\\right)'
            });
          } else {exprs.push(
            {id:'pointTangents',hidden:true},
            {id:'radii',style:cs.enum.lineType.DASHED,latex:
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

    /* ←— A0596385 FUNCTIONS ——————————————————————————————————————————————→ */
     fs.A0596385 = {
      /* ←— init ————————————————————————————————————————————————————————————→ */
       init: function(){
        var o = hs.parseOptions.apply(this,arguments);
        vs[o.uniqueId] = {triAngleABC:{prevError:0,A:0,B:0,C:0}};
       },
      /* ←— updateAngles ————————————————————————————————————————————————————→ *\
       | updates the labels of the triangle's vertices with their respective
       | angle measures.
       * ←———————————————————————————————————————————————————————————————————→ */
       updateAngles: function(){
        var o = hs.parseOptions.apply(this,arguments);
        var vertex = o.name[o.name.length-1];
        var val = Math.round(180*o.value/Math.PI);
        var vars = vs[o.uniqueId].triAngleABC;
        var oldVal = vars[vertex];

        // Only update stuff if the one of the values has changed
        if (vars.upToDate === true && val === oldVal) {return;}

        fs.shared.label.labelTriAngles(o);

        if ((oldVal-90)*(val-90)<=0) {
          // This angle just became obtuse or non-obtuse.
          if (val>90) {fs.A0596385.drawExtensions(o);} // this angle just became obtuse
          else if ((90-vars.A)*(90-vars.B)*(90-vars.C)>=0) {
            // This angle just became non-obtuse, and neither other angle is obtuse
            o.desmos.setExpressions([
                {id:'ext1',latex:''},
                {id:'ext2',latex:''},
                {id:'extA',latex:''},
                {id:'extB',latex:''},
                {id:'extC',latex:''}
              ]);
          }
        }
       },
      /* ←— drawExtensions ——————————————————————————————————————————————————→ *\
       | Adds any side-extensions necessary; pass in name of obtuse angle
       * ←———————————————————————————————————————————————————————————————————→ */
       drawExtensions: function(){
        var o = hs.parseOptions.apply(this,arguments);
        var obtuse = (o.name[o.name.length-1] === 'A')?1:((o.name[o.name.length-1] === 'B')?2:3);
        var Ext1 = hs.ALPHA[obtuse%3+1];
        var ext1 = hs.alpha[obtuse%3+1];
        var Ext2 = hs.ALPHA[(obtuse+1)%3+1];
        var ext2 = hs.alpha[(obtuse+1)%3+1];
        obtuse = hs.ALPHA[obtuse];
        var exprs = [];

        // Side extensions
        exprs.push({id:'ext1',latex:('e_{xt1}=p_'+obtuse+'\\left(1-t\\left(1-\\frac{t_{ick}}{'+ext1+'}\\right)\\right)+p_{h'+Ext1+'}t-p_'+Ext2+'\\frac{t_{ick}}{'+ext1+'}t')});
        exprs.push({id:'ext2',latex:('e_{xt2}=p_'+obtuse+'\\left(1-t\\left(1-\\frac{t_{ick}}{'+ext2+'}\\right)\\right)+p_{h'+Ext2+'}t-p_'+Ext1+'\\frac{t_{ick}}{'+ext2+'}t')});

        // Altitude extensions
        exprs.push({id:('ext'+obtuse),latex:('h_{ext'+obtuse+'}=p_'+obtuse+'+t\\left(p_O-p_'+obtuse+'\\right)\\left(1+\\frac{t_{ick}}{D_{pp}\\left(p_'+obtuse+',p_O\\right)}\\right)')});
        exprs.push({id:('ext'+Ext1),latex:('h_{ext'+Ext1+'}=p_{h'+Ext1+'}+t\\left(p_O-p_{h'+Ext1+'}\\right)\\left(1+\\frac{t_{ick}}{D_{pp}\\left(p_O,p_{h'+Ext1+'}\\right)}\\right)')});
        exprs.push({id:('ext'+Ext2),latex:('h_{ext'+Ext2+'}=p_{h'+Ext2+'}\\left(1-t\\left(1-\\frac{t_{ick}}{h_'+ext2+'}\\right)\\right)+tp_O-t\\frac{t_{ick}}{h_'+ext2+'}p_'+Ext2)});

        o.desmos.setExpressions(exprs);
       }
     };

    /* ←— A0596392 FUNCTIONS ——————————————————————————————————————————————→ */
     fs.A0596392 = {
      /* ←— init ————————————————————————————————————————————————————————————→ */
       init: function(){
        var o = hs.parseOptions.apply(this,arguments);
        vs[o.uniqueId] = {triAngleABC:{prevError:0,A:0,B:0,C:0}};
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
        if(pointNames === undefined) {
          pointNames = {A:'A',B:'B',C:'C'};
        }
        if(prec === undefined) {
          prec = cs.precision.DEGREES;
        }
        var o = hs.parseOptions.apply(this,[(options || {})]);
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

        var newErr;
        // If all is gravy, update the labels to match.
        if (val === calculated) {
          vars[vertex] = val;
          o.desmos.setExpression({id:'label'+A,label:(/*'m∠'+A+' = '+*/vars[A]+'°')});
          o.desmos.setExpression({id:'label'+B,label:(/*'m∠'+B+' = '+*/vars[B]+'°')});
          o.desmos.setExpression({id:'label'+C,label:(/*'m∠'+C+' = '+*/vars[C]+'°')});
          vars.upToDate = true;
        } else {
          // If this angle is closer to its (re-)calculated value than the last one was, correct this one and let the others keep their original values.
          newErr = Math.abs(180*o.value/Math.PI-calculated);
          if (newErr < vars.prevError && newErr < 1) {
            // Note: <1 makes rounding floor or ceiling only; if there is a spin where the error
            //       is always > 1, something has gone seriously wrong.
            // correct this one and update the 3 labels
            vars[vertex] = Math.round(calculated*Math.pow(10,prec))/Math.pow(10,prec);
            val = vars[vertex];
            o.desmos.setExpression({id:'label'+A,label:(/*'m∠'+A+' = '+*/vars[A]+'°')});
            o.desmos.setExpression({id:'label'+B,label:(/*'m∠'+B+' = '+*/vars[B]+'°')});
            o.desmos.setExpression({id:'label'+C,label:(/*'m∠'+C+' = '+*/vars[C]+'°')});
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
       }
     };

    /* ←— A0596584 FUNCTIONS ——————————————————————————————————————————————→ */
     fs.A0596584 = {
      /* ←— updateLabels ————————————————————————————————————————————————————→ *\
       | updates the labels of Watered Area based on values of r_1, r_2, r_3 
       |       
       | Hidden point must be authored with showLabel:true,
       | and the ID 26
       * ←———————————————————————————————————————————————————————————————————→ */
       updateLabels: function(){
        var o = hs.parseOptions.apply(this,arguments);
        o.desmos.setExpression({id:'26',label:('Watered Area: '+o.value+' m')});
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
        var o = hs.parseOptions.apply(this,arguments);                
          if (o.value > 0){
            o.desmos.setExpression({id:'344',label:('g(x) = x² + '+ o.value)});
            }
          else if (o.value < 0){
            o.desmos.setExpression({id:'344',label:('g(x) = x² – '+(-1)*o.value)});
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
          var o = hs.parseOptions.apply(this,arguments); 
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
        var o = hs.parseOptions.apply(this,arguments);
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
        var o = hs.parseOptions.apply(this,arguments);
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
          label += 0;
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
        var o = hs.parseOptions.apply(this,arguments);
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
        var o = hs.parseOptions.apply(this,arguments);
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
        var o = hs.parseOptions.apply(this,arguments);
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
        var o = hs.parseOptions.apply(this,arguments);
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
        var o = hs.parseOptions.apply(this,arguments);

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

        histMin = Math.min.apply(null,Object.keys(histBarID));
        histMax = Math.max.apply(null,Object.keys(histBarID));

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
        var o = hs.parseOptions.apply(this,arguments);
        vs[o.uniqueId] = {
          globalDiffArray:[],
          histFreq:[]
        };
       },
      /*———————————————————————————————————————————————————————————————
       |    Additional function to reset histogram.
       *————————————————————————————————————————————————*/
       histReset: function(){
        var o = hs.parseOptions.apply(this,arguments);
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
        var o = hs.parseOptions.apply(this,arguments);
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
        var o = hs.parseOptions.apply(this,arguments);
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
        var o = hs.parseOptions.apply(this,arguments);
      
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
             o.desmos.setExpression({id: '600', latex: '(' + n + ','+ ' '+ meanNetPerGame[n-1] +')', color: '#0092C8', showLabel:'true', hidden:false});
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

    /* ←— A0597503 FUNCTIONS ——————————————————————————————————————————————→ */
      cs.A0597503 = {
        HANDLE_COLOR:'#000000',
        HIDDEN_COLOR:'#FFFFFF'
       };
     fs.A0597503 = {
      /* ←— init ———————————————————————————————————————————————→ *\
       | stuff
       * ←—————————————————————————————————————————————————————————————————→ */
       init: function(){
        var o = hs.parseOptions.apply(this,arguments);
        var vars = vs[o.uniqueId];
        var hlps = hxs[o.uniqueId];
        var cons = cs.A0597503;

        Object.assign(hlps,{
          x_1:hlps.maker({latex:'x_1'}),
          y_1:hlps.maker({latex:'y_1'}),
          x_2:hlps.maker({latex:'x_2'}),
          y_2:hlps.maker({latex:'y_2'}),
          x_3:hlps.maker({latex:'x_3'}),
          y_3:hlps.maker({latex:'y_3'}),
          a:hlps.maker({latex:'a'}),
          l:hlps.maker({latex:'l'}),
          c:hlps.maker({latex:'c'}),
          b:hlps.maker({latex:'b'}),
          t:hlps.maker({latex:'t_{ick}'})
        });

        function interact(which) {
          if (vars.handled || !(vars.mouseIsDown)) {return;}

          // Stop listening for interaction
          vars.handled = true;
          Object.keys(hlps).forEach(function(helper) {
            if (helper.length === 3) {
              hlps[helper].unobserve('numericValue.interact');
            }
          });

          // Hide the handle, and start changing 'b' if the handle is being dragged
          if ((which === 'x_3')||(which === 'y_3')) {
            vars.dragging = 'H';
            o.desmos.setExpressions([
              {id:'H',color:cons.HIDDEN_COLOR,showLabel:false},
              {id:'b',latex:'b=\\max\\left(0,\\min\\left(1,d\\right)\\right)'},
              {id:'B',hidden:false,showLabel:true}
             ]);
          } else {o.desmos.setExpressions([
            {id:'H',hidden:true,showLabel:false},
            {id:'B',hidden:false,showLabel:true}
           ]);}
         }

        function updateLabels() {
          var a = hlps.a.numericValue;
          var b = hlps.c.numericValue;
          var c = hlps.l.numericValue;

          if(Math.abs(a+b-c)<Math.pow(10,-cs.precision.FLOAT_PRECISION)) {
            o.desmos.setExpressions([
              {id:'equation',label:hs.latexToText(''+a+'+'+b+'='+c)},
              {id:'a',label:(''+a)},
              {id:'c',label:(''+b)}
           ]);
          }
         }

        function adjustHandle() {
          o.desmos.setExpressions([
            {id:'x_3',latex:('x_3='+vars.x_3)},
            {id:'y_3',latex:('y_3='+vars.y_3)}
           ]);
         }

        function checkHandle() {
          var b = hlps.b.numericValue;
          vars.x_3 = hs.number(hlps.x_1.numericValue*(1-b)+hlps.x_2.numericValue*b);
          vars.y_3 = hs.number(hlps.y_1.numericValue*(1-b)+hlps.y_2.numericValue*b);

          if((Math.abs(hlps.x_3.numericValue-vars.x_3)<Math.pow(10,-cs.precision.FLOAT_PRECISION)) &&
             (Math.abs(hlps.y_3.numericValue-vars.y_3)<Math.pow(10,-cs.precision.FLOAT_PRECISION))) {
            o.desmos.setExpressions([
              {id:'H',hidden:false,showLabel:true},
              {id:'B',hidden:true,showLabel:false}
             ]);

            hlps.x_3.unobserve('numericValue.checkHandle');
            hlps.y_3.unobserve('numericValue.checkHandle');
          } else {
            adjustHandle();
          }
         }

        function checkB() {
          var b = hlps.b.numericValue;
          var x_1 = hlps.x_1.numericValue;
          var y_1 = hlps.y_1.numericValue;
          var x_2 = hlps.x_2.numericValue;
          var y_2 = hlps.y_2.numericValue;
          var bShouldB = Math.max(0,Math.min(1,
                          ((x_2-x_1)*(hlps.x_3.numericValue-x_1)+
                           (y_2-y_1)*(hlps.y_3.numericValue-y_1))/
                          ((x_2-x_1)*(x_2-x_1)+(y_2-y_1)*(y_2-y_1))
                         ));
          if(Math.abs(bShouldB-b)<Math.pow(10,-cs.precision.FLOAT_PRECISION)) {
            hlps.b.unobserve('numericValue.checkB');
            hlps.x_3.unobserve('numericValue.checkB');
            hlps.y_3.unobserve('numericValue.checkB');

            o.desmos.setExpression({id:'b',latex:('b='+hs.number(b))});

            // correct the handles
            hlps.x_3.observe('numericValue.checkHandle',checkHandle);
            hlps.y_3.observe('numericValue.checkHandle',checkHandle);
            checkHandle();
          } else {o.log('b = '+b+' should be '+bShouldB);}
         }

        function dontOverlap() {
          var dx = hlps.x_2.numericValue-hlps.x_1.numericValue;
          var dy = hlps.y_2.numericValue-hlps.y_1.numericValue;
          var d = Math.sqrt(dx*dx+dy*dy);
          if(hlps.b.numericValue*d<hlps.t.numericValue) {
            o.desmos.setExpression({id:'A',dragMode:Desmos.DragModes.NONE});
            o.desmos.setExpression({id:'B',dragMode:Desmos.DragModes.AUTO});
          } else {
            o.desmos.setExpression({id:'A',dragMode:Desmos.DragModes.AUTO});
            if((1-hlps.b.numericValue)*d<hlps.t.numericValue) {
              o.desmos.setExpression({id:'C',dragMode:Desmos.DragModes.NONE});
            } else {
              o.desmos.setExpression({id:'C',dragMode:Desmos.DragModes.AUTO});
            }
          }
        }

        var unclick;
        function click() {
          vars.handled = false;
          vars.mouseIsDown = true;
          document.removeEventListener('mousedown',click);
          document.removeEventListener('touchstart',click);

          Object.keys(hlps).forEach(function(helper) {
            if (helper.length === 3) {
              hlps[helper].observe('numericValue.interact',function(){interact(helper);});
            }
          });

          document.addEventListener('mouseup',unclick);
          document.addEventListener('touchend',unclick);
         }

        unclick = function() {
          vars.mouseIsDown = false;
          vars.handled = true;
          document.removeEventListener('mouseup',unclick);
          document.removeEventListener('touchend',unclick);

          if (vars.dragging === 'H') {
            // Make sure b is up-to-date before moving the handle
            o.desmos.setExpression({id:'H',hidden:true,color:cons.HANDLE_COLOR});
            hlps.b.observe('numericValue.checkB',checkB);
            hlps.x_3.observe('numericValue.checkB',checkB);
            hlps.y_3.observe('numericValue.checkB',checkB);
            checkB();
            delete vars.dragging;
          } else {
            // Just correct the handle
            hlps.x_3.observe('numericValue.checkHandle',checkHandle);
            hlps.y_3.observe('numericValue.checkHandle',checkHandle);
            checkHandle();
          }

          document.addEventListener('mousedown',click);
          document.addEventListener('touchstart',click);
         };

        hlps.a.observe('numericValue.lengths',updateLabels);
        hlps.c.observe('numericValue.lengths',updateLabels);
        hlps.l.observe('numericValue.lengths',updateLabels);
        hlps.b.observe('numericValue.lengths',updateLabels);
        hlps.l.observe('numericValue.overlap',dontOverlap);
        hlps.b.observe('numericValue.overlap',dontOverlap);
        hlps.t.observe('numericValue.overlap',dontOverlap);

        document.addEventListener('mousedown',click);
        document.addEventListener('touchstart',click);

       }
     };

    /* ←— A0597506 FUNCTIONS ——————————————————————————————————————————————→ */
      cs.A0597506 = {
        HANDLE_COLOR:'#000000',
        HIDDEN_COLOR:'#FFFFFF',
        latex:{
          x_1:'x_1=\\frac{u_1R}{d_A}',
          y_1:'y_1=\\frac{v_1R}{d_A}',
          x_3:'x_3=\\frac{u_3R}{d_C}',
          y_3:'y_3=\\frac{v_3R}{d_C}',
          x_4:'x_4=\\frac{u_4\\left(R+\\left\\{R\\sin\\left(\\theta_{LVL}\\left(A,B,D_h\\right)\\right)<t_{ick}:t_{ick},R\\sin\\left(\\theta_{LVL}\\left(C,B,D_h\\right)\\right)<t_{ick}:t_{ick},0\\right\\}\\right)}{d_D}',
          y_4:'y_4=\\frac{v_4\\left(R+\\left\\{R\\sin\\left(\\theta_{LVL}\\left(A,B,D_h\\right)\\right)<t_{ick}:t_{ick},R\\sin\\left(\\theta_{LVL}\\left(C,B,D_h\\right)\\right)<t_{ick}:t_{ick},0\\right\\}\\right)}{d_D}'
        }
       };
     fs.A0597506 = {
      /* ←— init ———————————————————————————————————————————————→ *\
       | stuff
       * ←—————————————————————————————————————————————————————————————————→ */
       init: function(){
        var o = hs.parseOptions.apply(this,arguments);
        var cons = cs.A0597506;
        vs[o.uniqueId] = {
          correcting: false,
          handled:false,
          mouseIsDown:false,
          draggingPoint:undefined,
          constraints:[]
        };
        var vars = vs[o.uniqueId];
        var hlps = hxs[o.uniqueId];

        Object.assign(hlps,{
          u_1:hlps.maker({latex:'u_1'}),
          v_1:hlps.maker({latex:'v_1'}),
          u_3:hlps.maker({latex:'u_3'}),
          v_3:hlps.maker({latex:'v_3'}),
          u_4:hlps.maker({latex:'u_4'}),
          v_4:hlps.maker({latex:'v_4'}),
          x_1:hlps.maker({latex:'x_1'}),
          y_1:hlps.maker({latex:'y_1'}),
          x_3:hlps.maker({latex:'x_3'}),
          y_3:hlps.maker({latex:'y_3'}),
          x_4:hlps.maker({latex:'x_4'}),
          y_4:hlps.maker({latex:'y_4'}),
          m_ABD:hlps.maker({latex:'m_{ABD}'}),
          m_DBC:hlps.maker({latex:'m_{DBC}'}),
          m_ABC:hlps.maker({latex:'m_{ABC}'}),
          tick:hlps.maker({latex:'t_{ick}'}),
          R:hlps.maker({latex:'R'})
        });

        Object.keys(hlps).forEach(function(helper) {
          if (helper.match(/[xy]/)!==null) {
            hlps[helper].observe('numericValue.init',function(){
              vars[helper]=hlps[helper].numericValue;
              hlps[helper].unobserve('numericValue.init');
            });
            vars[helper] = helper.numericValue;
            if (vars[helper]!==undefined) {
              hlps[helper].unobserve('numericValue.init');
            }
          }
        });

        var adjustHandles;
        function resizeGraph() {
          var R = Math.min(o.desmos.graphpaperBounds.mathCoordinates.height,o.desmos.graphpaperBounds.mathCoordinates.width)/3;
          if (Math.abs(Math.log2(R)-Math.log2(hlps.R.numericValue))<cs.ts.ZOOM) {
            return;
          }
          vars.handled = true;
          o.desmos.setExpressions([
            {id:'handleA',hidden:true,color:cons.HANDLE_COLOR},
            {id:'handleC',hidden:true,color:cons.HANDLE_COLOR},
            {id:'handleD',hidden:true,color:cons.HANDLE_COLOR},
            {id:'R',latex:'R='+hs.number(R)}
            ]);
          setTimeout(function(){
            Object.keys(hlps).forEach(function(helper) {
              if(helper.match(/[xy]/)!==null) {
                vars[helper]=hlps[helper].numericValue;
              }
            });
            adjustHandles();
          },cs.delay.SET_EXPRESSION);
         }

        o.desmos.observe('graphpaperBounds',resizeGraph);

        var correctIt;
        function interact(which) {
          if (vars.handled || !(vars.mouseIsDown)) {return;}

          // Stop listening for interaction
          vars.handled = true;
          vars.draggingPoint = which[2];

          Object.keys(hlps).forEach(function(helper) {
            if (helper.match(/[uv]/)!==null) {
              hlps[helper].unobserve('numericValue.interact');
            }
          });

          switch (which[2]) {
            case '1':
              o.desmos.setExpressions([
                {id:'angleABD',latex:'m_{ABD}=\\min\\left(180-m_{DBC},\\operatorname{round}\\left(\\theta_{LVL}\\left(A,B,D\\right)\\right)\\right)'},
                {id:'angleABC',latex:'m_{ABC}=m_{ABD}+m_{DBC}'},
                {id:'angleDBC',latex:'m_{DBC}='+hs.number(hlps.m_DBC.numericValue)},
                {id:'handleA',color:cons.HIDDEN_COLOR}
              ]);
              vars.constraints = [
                hs.lineTwoPoints({x:hlps.x_3.numericValue,y:hlps.y_3.numericValue},{x:0,y:0}),
                hs.lineTwoPoints({x:hlps.x_4.numericValue,y:hlps.y_4.numericValue},{x:0,y:0})
                ];
              break;
            case '3':
              o.desmos.setExpressions([
                {id:'angleDBC',latex:'m_{DBC}=\\min\\left(180-m_{ABD},\\operatorname{round}\\left(\\theta_{LVL}\\left(C,B,D\\right)\\right)\\right)'},
                {id:'angleABC',latex:'m_{ABC}=m_{ABD}+m_{DBC}'},
                {id:'angleABD',latex:'m_{ABD}='+hs.number(hlps.m_ABD.numericValue)},
                {id:'handleC',color:cons.HIDDEN_COLOR}
              ]);
              vars.constraints = [
                hs.lineTwoPoints({x:0,y:0},{x:hlps.x_1.numericValue,y:hlps.y_1.numericValue}),
                hs.lineTwoPoints({x:0,y:0},{x:hlps.x_4.numericValue,y:hlps.y_4.numericValue})
                ];
              break;
            case '4':
              o.desmos.setExpressions([
                {id:'angleABD',latex:'m_{ABD}=\\operatorname{round}\\left(\\theta_{LVL}\\left(A,B,D\\right)\\right)'},
                {id:'angleDBC',latex:'m_{DBC}=m_{ABC}-m_{ABD}'},
                {id:'angleABC',latex:'m_{ABC}='+hs.number(hlps.m_ABC.numericValue)},
                {id:'handleD',color:cons.HIDDEN_COLOR}
              ]);
              vars.constraints = [
                hs.lineTwoPoints({x:0,y:0},{x:hlps.x_1.numericValue,y:hlps.y_1.numericValue}),
                hs.lineTwoPoints({x:hlps.x_3.numericValue,y:hlps.y_3.numericValue},{x:0,y:0})
                ];
              break;
          }
          hlps['u_'+which[2]].observe('numericValue.correction',correctIt);
          hlps['v_'+which[2]].observe('numericValue.correction',correctIt);
         }

        correctIt = function() {
          var x = 'x_'+vars.draggingPoint;
          var y = 'y_'+vars.draggingPoint;
          var handle = {
            x:hlps['u_'+vars.draggingPoint].numericValue,
            y:hlps['v_'+vars.draggingPoint].numericValue
          };

          var corrected = hs.polygonConstrain(handle,vars.constraints);
          var d = Math.sqrt(Math.pow(corrected.x,2)+Math.pow(corrected.y,2));
          var stick;

          // Stick to the nearest edge if the handle is too close to the vertex
          if (d < hlps.tick.numericValue) {
            vars.correcting = true;
            switch (vars.draggingPoint) {
              case '1':
                if (hlps.m_ABC.numericValue>=179) {stick = 3;}
                else {stick = 4;}
                break;
              case '3':
                if (hlps.m_ABC.numericValue>=179) {stick = 3;}
                else {stick = 4;}
                if (hlps.m_ABC.numericValue>=179) {stick = 1;}
                else {stick = 4;}
                break;
              case '4':
                if (hlps.m_ABC.numericValue>=179) {stick = 3;}
                else {stick = 4;}
                if (hlps.m_ABC.numericValue>=179) {stick = 1;}
                else {stick = 4;}
                if (hlps.m_ABD.numericValue>hlps.m_DBC.numericValue) {stick = 3;}
                else {stick = 1;}
                break;
            }

            corrected = {
              x:hlps['x_'+stick].numericValue,
              y:hlps['y_'+stick].numericValue
            };
            
            o.desmos.setExpressions([
              {id:x,latex:(x+'='+corrected.x)},
              {id:y,latex:(y+'='+corrected.y)}
              ]);
          // If no correction necessary, revert to desmos for performance
          } else if (corrected === handle) {
            corrected = {
              x:hlps[x].numericValue,
              y:hlps[y].numericValue
            };
            if (vars.correcting) {
              vars.correcting = false;
              o.desmos.setExpressions([
                {id:x,latex:cons.latex[x]},
                {id:y,latex:cons.latex[y]}
                ]);
              corrected = {
                x:hs.number(hlps.R.numericValue*corrected.x/d),
                y:hs.number(hlps.R.numericValue*corrected.y/d)
              };
            } else {corrected = {
              x:hlps[x].numericValue,
              y:hlps[y].numericValue
            };}
          // Stick to the nearest leg
          } else {
            vars.correcting = true;
            corrected = {
              x:hs.number(hlps.R.numericValue*corrected.x/d),
              y:hs.number(hlps.R.numericValue*corrected.y/d)
            };
            o.desmos.setExpressions([
              {id:x,latex:(x+'='+corrected.x)},
              {id:y,latex:(y+'='+corrected.y)}
              ]);
          }

          vars[x]=corrected.x;
          vars[y]=corrected.y;
         };

        adjustHandles = function() {
          vars.handled = true;
          o.desmos.setExpressions([
            {id:'u_1',latex:'u_1='+hs.number(vars.x_1)},
            {id:'v_1',latex:'v_1='+hs.number(vars.y_1)},
            {id:'u_3',latex:'u_3='+hs.number(vars.x_3)},
            {id:'v_3',latex:'v_3='+hs.number(vars.y_3)},
            {id:'u_4',latex:'u_4='+hs.number(vars.x_4)},
            {id:'v_4',latex:'v_4='+hs.number(vars.y_4)}
            ]);
          setTimeout(function(){
            vars.handled = false;
            o.desmos.setExpressions([
            {id:'handleA',hidden:false,color:cons.HANDLE_COLOR},
            {id:'handleC',hidden:false,color:cons.HANDLE_COLOR},
            {id:'handleD',hidden:false,color:cons.HANDLE_COLOR}
            ]);
          },cs.delay.SET_EXPRESSION);
         };

        var unclick;
        function click() {
          vars.handled = false;
          vars.mouseIsDown = true;
          document.removeEventListener('mousedown',click);
          document.removeEventListener('touchstart',click);

          document.addEventListener('mouseup',unclick);
          document.addEventListener('touchend',unclick);

          Object.keys(hlps).forEach(function(helper) {
            if (helper.match(/[uv]/)!==null) {
              hlps[helper].observe('numericValue.interact',function(){interact(helper);});
            }
          });
         }

        unclick = function() {
          vars.mouseIsDown = false;
          vars.handled = true;
          document.removeEventListener('mouseup',unclick);
          document.removeEventListener('touchend',unclick);

          document.addEventListener('mousedown',click);
          document.addEventListener('touchstart',click);

          var exprs = [];

          Object.keys(hlps).forEach(function(helper) {
            if (helper.match(/[uv]/)!==null) {
              hlps[helper].unobserve('numericValue.interact');
              hlps[helper].unobserve('numericValue.correction');
            } else if (helper.match(/[xy]/)!==null) {
              exprs.push({id:helper,latex:cons.latex[helper]});
              if (helper[2] !== vars.draggingPoint) {vars[helper] = hlps[helper].numericValue;}
            }
          });

          if (vars.draggingPoint!==undefined) {
            o.desmos.setExpression({id:('handle'+hs.ALPHA[vars.draggingPoint]),hidden:true,color:cons.HANDLE_COLOR});
            correctIt();
          }
          delete vars.draggingPoint;

          adjustHandles();

          exprs.push(
            {id:'angleABD',latex:'m_{ABD}='+hlps.m_ABD.numericValue},
            {id:'angleDBC',latex:'m_{DBC}='+hlps.m_DBC.numericValue},
            {id:'angleABC',latex:'m_{ABC}='+hlps.m_ABC.numericValue}
            );
          o.desmos.setExpressions(exprs);

         };

        document.addEventListener('mousedown',click);
        document.addEventListener('touchstart',click);

       }//
     };

     /* ←— A0597514 FUNCTIONS ——————————————————————————————————————————————→ */
     fs.A0597514 = {
      /* ←— init ————————————————————————————————————————————————————————————→ *\
       | Initializes the variables
       * ←———————————————————————————————————————————————————————————————————→ */
       init: function(){
        var o = hs.parseOptions.apply(this,arguments);
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
        var o = hs.parseOptions.apply(this,arguments);
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
        var o = hs.parseOptions.apply(this,arguments);
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


// OUT OF ORDER

    /* ←— A0598528 FUNCTIONS ——————————————————————————————————————————————→ */
     fs.A0598528 = {
      /* ←— showHideQRST ——————————————————————————————————————————————————→ *\
       | Shows or hides QRST
       * ←—————————————————————————————————————————————————————————————————→ */
       showHideQRST: function(){
        var o = hs.parseOptions.apply(this,arguments);
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
        var o = hs.parseOptions.apply(this,arguments);
        o.desmos.setExpressions([
          {id:'EdgesEFGH',type:'table',columns:[{},{hidden:o.value}]},
          {id:'E',hidden:o.value,showLabel:(!(o.value))},
          {id:'F',hidden:o.value,showLabel:(!(o.value))},
          {id:'G',hidden:o.value,showLabel:(!(o.value))},
          {id:'H',hidden:o.value,showLabel:(!(o.value))}
         ]);
       }
     };


     /* ←— A0598832 FUNCTIONS ——————————————————————————————————————————————→ */
     fs.A0598832 = {
      /* ←— init ——————————————————————————————————————————————————————→ *\
       | Preps the watchers
       * ←—————————————————————————————————————————————————————————————————→ */
       init: function(){
        var o = hs.parseOptions.apply(this,arguments);
        vs[o.uniqueId] = {
          lastPointCount:0
        };
       },
      /* ←— changeLineType ————————————————————————————————————————————————→ *\
       | Toggle switch should use -n and n to toggle line type on line n
       | positive for SOLID, otherwise, DASHED
       * ←—————————————————————————————————————————————————————————————————→ */
       changeLineType: function(){
        var o = hs.parseOptions.apply(this,arguments);
        o.desmos.setExpression({
          id:o.id,
          style:((o.value>0)?cs.enum.lineType.SOLID:cs.enum.lineType.DASHED)
        });
       },
      /* ←— changeStep ——————————————————————————————————————————————————————→ *\
       | Switches to the next step.
       * ←—————————————————————————————————————————————————————————————————→ */
       regionsAddRemove: function(){
        var o = hs.parseOptions.apply(this,arguments);
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
        var o = hs.parseOptions.apply(this,arguments);
        vs[o.uniqueId] = {
          orange:1,
          blue:1
        };
       },
       orange: function(){
        var o = hs.parseOptions.apply(this,arguments);
        vs[o.uniqueId].orange = o.value;
        fs.A0598839.setPlanes(o);
       },
       blue: function(){
        var o = hs.parseOptions.apply(this,arguments);
        vs[o.uniqueId].blue = o.value;
        fs.A0598839.setPlanes(o);
       },
       setPlanes: function(){
        var o = hs.parseOptions.apply(this,arguments);
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

    /* ←— A0599213 FUNCTIONS ——————————————————————————————————————————————→ */
      cs.A0599213 = {
        regionLatex:'\\left|x\\right|>-1L_1\\left(x,y,s_N,t_N\\right)L_2\\left(x,y,s_N,t_N\\right)L_3\\left(x,y,s_N,t_N\\right)L_4\\left(x,y,s_N,t_N\\right)'
       };
     fs.A0599213 = {
      /* ←— init ——————————————————————————————————————————————————————→ *\
       | Preps the watchers
       * ←—————————————————————————————————————————————————————————————————→ */
       init: function(){
        var o = hs.parseOptions.apply(this,arguments);
        vs[o.uniqueId] = {
          lastPointCount:0
        };
       },
      /* ←— changeLineType ————————————————————————————————————————————————→ *\
       | Toggle switch should use -n and n to toggle line type on line n
       | positive for SOLID, otherwise, DASHED
       * ←—————————————————————————————————————————————————————————————————→ */
       changeLineType: function(){
        var o = hs.parseOptions.apply(this,arguments);
        o.desmos.setExpression({
          id:o.id,
          style:((o.value>0)?cs.enum.lineType.SOLID:cs.enum.lineType.DASHED)
        });
       },
      /* ←— changeStep ——————————————————————————————————————————————————————→ *\
       | Switches to the next step.
       * ←—————————————————————————————————————————————————————————————————→ */
       regionsAddRemove: function(){
        var o = hs.parseOptions.apply(this,arguments);
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

  Object.assign(exports,hs.flattenFuncStruct(fs));

  return exports;
 }());
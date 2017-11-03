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
    var hs = {
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
                  if (measure(name) === measure(sorted[i])) {if (2*Math.random()>1) {i+=1;}}
                  else if ((measure(name) < measure(sorted[i])) === (thisError > 0)) {i+=1;}
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
        let o = hs.parseOptions.apply(this,arguments);
        o.desmos.setExpression({id:'21',label:('y = '+o.value+'x²')});
        o.desmos.setExpression({id:'20',label:('f(x) = −'+o.value+'x²')});
       }
     };

  Object.assign(exports,hs.flattenFuncStruct(fs));

  return exports;
 }());
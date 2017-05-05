window.PearsonGL = window.PearsonGL || {};
window.PearsonGL.External = window.PearsonGL.External || {};

/*——————————————————————————————————————————————————————————————————————
 | Module: rootJS
* ——————————————————————————————————————————————————————————————————————*/
PearsonGL.External.rootJS = (function() {
  /* ←—PRIVATE VARIABLES———————————————————————————————————————————————————→ *\
       | Variable cache; access with vs[uniqueId].myVariable
       * ←—————————————————————————————————————————————————————————————————→ */
    var vs = {shared:{}}
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
       flattenFuncStruct: function(funcStruct,prefix='') {
        var functions={};
        for (var key in funcStruct) {
          if (typeof funcStruct[key] == 'object') {
            if (!(Object.assign(functions,hs.flattenFuncStruct(funcStruct[key],prefix+key+'_')))) return false;
          }
          else if (typeof funcStruct[key] == 'function') functions[prefix+key] = funcStruct[key];
          else {
            alert(prefix+key+' is not a function or object');
            return false;
          }
        }
        return functions;
       },
      /* ←— parseOptions ——————————————————————————————————————————————————→ *\
       ↑ Returns a new struct merging given options with defaults for those   ↑
       | options not provided.                                                |
       |                                                                      |
       | @Arg1: standard helper function option struct                        |
       |                                                                      |
       | @Returns: standard helper function option struct                     |
       ↓ @Returns: default options if input is empty                          ↓
       * ←—————————————————————————————————————————————————————————————————→ */
       parseOptions: function(options={}) {
        var desmos = options['desmos'] || window['calculator'] || window['Calc'];
        var output = Object.assign({},options,{
          desmos:desmos,
          name:((options['name'] === undefined) ? '' : options['name']),
          value:((options['value'] === undefined) ? NaN : options['value']),
          uniqueId:options['uniqueId'] || ((desmos === undefined) ? 'undefinedId' : desmos['guid']),
          log:options['log'] || function(){}
        });
        if (window.widget === undefined && output.log === console.log) {
          window.widget = output.desmos;
          window.reportDesmosError = function() {
            var element = document.createElement('a');
            element.setAttribute('href', 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify({
                id: output.uniqueId,
                state: output.desmos.getState(),
                variables: vs[output.uniqueId],
                helpers: hs[output.uniqueId],
                screenshot: output.desmos.screenshot()
              },null,"\t")));
            element.setAttribute('download', 'Widget Error Report '+((new Date()).toISOString())+'.json');
            element.style.display = 'none';
            document.body.appendChild(element);
            element.click();
            document.body.removeChild(element);
          };
        };
        return output;
       },
      /* ←— updateExpForm —————————————————————————————————————————————————————→ *\
       ↑ Create a LaTeX expression for an exponential function, given parameters
       |
       | @args: (form, a, b, c, signed)
       |  form: one of cs.enum.expform:
       |    ABXC: a*b^x+c
       |    AEBC: a*e^{bx}+c
       |    EABC: e^{ax+b}+c
       |  options: optional parameters object:
       |    signed: if true, prefixes positive results with '+'
       |    x: LaTeX string for the input of the function; entire input will be
       |       surrounded by parens if it contains any of /[0-9.+-]/
       |
       | @Returns: LaTeX string
       ↓ @Returns: false if form is not one of the given
       * ←—————————————————————————————————————————————————————————————————————→ */
       updateExpForm: function(form,a,b,c,options={}){
        var o = Object.assign({signed:false,x:'x'},options);
        var expr = '';
        switch (form) {
          case cs.enum.expform.ABXC:
            if (o.signed && ((a > 0) && (b != 0) || (a*b == 0) && (c >= 0))) expr += '+';
            if (a*b != 0) {
              expr += (''+a+'\\left\\('+b+'\\right\\)^{'+o.x+'}');
              if (c > 0) expr +='+';
            }
            expr += c;
            break;
          case cs.enum.expform.AEBC:
            if (o.signed && ((a > 0) || (a == 0) && (c >= 0))) expr += '+';
            if (a != 0) {
              if (a == -1) expr += '-';
              else if (a != 1) expr += a;
              if (b != 0) {
                expr += 'e^{';
                if (b == -1) expr += ('-'+hs.groupFactor(o.x));
                else if (b == 1) expr += o.x;
                else expr += (b+''+hs.groupFactor(o.x));
                expr += '}';
              } 
              else expr += 'e^0';
              if (c > 0) expr += '+';
            }
            expr += c;
            break;
          case cs.enum.expform.EABC:
            if (o.signed) expr += '+';
            expr += 'e^{'
            if (a != 0) {
              if (a == -1) expr += ('-'+hs.groupFactor(o.x));
              else if (a == 1) expr += o.x;
              else expr += (a+''+hs.groupFactor(o.x));
              if (b > 0) expr += '+';
            }
            if ((a == 0) || (b != 0)) expr += b;
            expr += '}';
            if (c > 0) expr += '+';
            if (c != 0) expr += c;
            break;
          case cs.enum.expform.EAHK:
            if (o.signed) expr += '+';
            expr += 'e^{';
            if (a != 0) {
              if (a == 1) expr += o.x+((b<0)?'+':'')+((b==0)?'':-b);
              else {
                if (a == -1) expr += ('-');
                else expr += a;
                expr += hs.groupFactor(''+o.x+((b<0)?'+':'')+((b==0)?'':-b));
              }
            }
            else (expr += 0);
            expr += '}';
            if (c > 0) expr += '+';
            if (c != 0) expr += c;
            break;
          default: return false;
        }
        return expr;
       },
      /* ←— groupFactor ———————————————————————————————————————————————————————→ *\
       ↑ Surround an expression with parens if it includes a number or + or -
       ↓ 
       * ←—————————————————————————————————————————————————————————————————————→ */
       groupFactor: function(expr){
        if (/[0-9.+-]/g.test((''+expr))) return '\\left\('+expr+'\\right\)';
        else return expr;
       },
      /* ←— latexToText ———————————————————————————————————————————————————————→ *\
       ↑ Convert a latex string to a plaintext string, e.g. for labels
       ↓ 
       * ←—————————————————————————————————————————————————————————————————————→ */
       latexToText: function(expr){
        expr = ''+expr;
        expr = expr.replace(/([+=])/g,' $1 ');
        expr = expr.replace(/,/g,', ');
        expr = expr.replace(/\^2/g,'²');
        expr = expr.replace(/\^3/g,'³');
        expr = expr.replace(/\\theta ?/g,'θ');
        expr = expr.replace(/\\pi ?/g,'π');
        expr = expr.replace(/_0/g,'₀');
        expr = expr.replace(/_1/g,'₁');
        expr = expr.replace(/_2/g,'₂');
        expr = expr.replace(/\\right\)/g,')');
        expr = expr.replace(/\\left\(/g,'(');
        expr = expr.replace(/\\right/g,'');
        expr = expr.replace(/\\left/g,'');
        expr = expr.replace(/([^  ])\-/g,'$1 − ');
        expr = expr.replace(/\-/g,'−');
        return expr;
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
       labelPoint: function(xVal, yVal, name, id, options={}, precision=cs.precision.COORDINATES) {
        var o = hs.parseOptions(options);
        var expr = name+'('+
          ((xVal<0)?'−':'')+
          Math.abs(Math.round(Math.pow(10,precision)*xVal)/Math.pow(10,precision))+
          ', '+
          ((yVal<0)?'−':'')+
          Math.abs(Math.round(Math.pow(10,precision)*yVal)/Math.pow(10,precision))+
          ')';
        if (o.log) o.log('Setting point label ' + expr);;
        o.desmos.setExpression({id:id,label:expr});
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
       polygonConstrain: function(point, lines, buffer=cs.distance.CONSTRAIN_BUFFER) {

        function viable(testPoint) {
          if (testPoint == null) return false;
          for (var i in lines) {
            if (hs.distancePointLine(testPoint,lines[i])<buffer) return false;
          };
          return true;
        }

        if (viable(point)) return point;

        var buffered = [];

        for (var line in lines) {
          let bufferedLine = {a:lines[line].a,b:lines[line].b,c:lines[line].c-buffer*Math.pow(2,cs.ts.BUFFER_BUFFER)}; // Overcompensate to guarantee success
          if (hs.distancePointLine(point,lines[line])<buffer) {
            // For a convex polygon, if projecting to a crossed boundary results in a valid point, then that point is definitely the closest.
            let projected = hs.projectPointLine(point,bufferedLine);
            if (viable(projected)) return projected;
          };
          // Otherwise, all lines need to be considered to account for acute angles, where projecting may cross from inside one boundary to outside it.
          buffered.push(bufferedLine);
        }

        // If projecting to an edge doesn't work, find the closest vertex of the polygon.
        var constrained = null;
        for (var line in buffered) {
          for (var j = (eval(line)+1);j<buffered.length;j++) {
            let intersected = hs.intersectLines(buffered[line],buffered[j]);
            if (viable(intersected)) {
              if (constrained === null || (
                Math.pow(intersected.x-point.x,2)
                  +Math.pow(intersected.y-point.y,2)
                <Math.pow(constrained.x-point.x,2)
                  +Math.pow(constrained.y-point.y,2)
              )) constrained = {x:intersected.x,y:intersected.y};
            };
          };
        };
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
       circleConstrain: function(point, circle, side=cs.enum.PERIMETER, buffer=cs.distance.CONSTRAIN_BUFFER) {

        var dSquared = Math.pow(point.x-circle.x,2)+Math.pow(point.y-circle.y,2);
        var scaleBack;

        switch (side) {
          case cs.enum.PERIMETER:
            if ((buffer > 0) && (Math.pow(circle.r-buffer,2) < dSquared && dSquared < Math.pow(circle.r+buffer,2))) return point;
            scaleBack = circle.r;
            break;
          case cs.enum.INTERIOR:
            if (dSquared < Math.pow(circle.r-buffer,2)) return point;
            scaleBack = circle.r-buffer*Math.pow(2,cs.ts.BUFFER_BUFFER);
            break;
          case cs.enum.EXTERIOR:
            if (dSquared > Math.pow(circle.r+buffer,2)) return point;
            scaleBack = circle.r+buffer*Math.pow(2,cs.ts.BUFFER_BUFFER);
            break;
          default:
            return null;
        }

        if (scaleBack < 0) {o.log('Negative circle constraint '+scaleBack); return null;}

        if(dSquared != 0) scaleBack /= Math.sqrt(dSquared);
        else scaleBack = 0;

        var output = {
          x:(hs.number(circle.x+(point.x-circle.x)*scaleBack)),
          y:(hs.number(circle.y+(point.y-circle.y)*scaleBack))
        };

        return output;
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

        return {x:x/z,y:y/z};
       },
      /* ←— number to letter (lowercase) —————————————————————————————————→ *\
       | Convert a number to its lowercase letter with `cs.alpha[n]`
       * ←————————————————————————————————————————————————————————————————→ */
       alpha:'_abcdefghijklmnopqrstuvwxyz',
      /* ←— number to letter (uppercase) —————————————————————————————————→ *\
       | Convert a number to its uppercase letter with `cs.ALPHA[n]`
       * ←————————————————————————————————————————————————————————————————→ */
       ALPHA:'_ABCDEFGHIJKLMNOPQRSTUVWXYZ',
      /* ←— subscript ————————————————————————————————————————————————————→ *\
       | Given a variable and an index, return the latex-subscripted variable
       |  e.g. x_11 becomes x_{11}
       | Variable name must be an atomic string
       * ←————————————————————————————————————————————————————————————————→ */
       sub:function(v,i) {
        return v+'_'+(((''+i).length>1)?"{"+i+"}":i);
       },
      /* ←— number ————————————————————————————————————————————————————→ *\
       | Rounds a value to acceptable precision (# of decimal places)
       * ←————————————————————————————————————————————————————————————————→ */
       number:function(val,precision=cs.precision.FLOAT_PRECISION) {
        return Math.round(Math.pow(10,precision)*val)/Math.pow(10,precision);
       }
     }
  /* ←—PRIVATE CONSTANTS———————————————————————————————————————————————————→ *\
       | Constants, e.g. for tolerances or LaTeX strings.
       | Access with cs.type.NAME
       * ←—————————————————————————————————————————————————————————————————————→ */
    const cs = {
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
        expform:{ABXC:'abxc',AEBC:'aebc',EABC:'eabc',EAHK:'eahk'}
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
     }

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
       |  if (o.log) log(name + " was updated to " + val);
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
      exports.reflectParabola = function(options={}) { // for test SCO
        var o = hs.parseOptions(options);
        if (o.log) o.log(o.name + " was updated to " + o.value);
        if (vs['M956353'] === undefined) {
          vs.M956353 = {a:0,h:0,k:0};
          a = o.desmos.HelperExpression({latex:'a'});
          h = o.desmos.HelperExpression({latex:'h'});
          k = o.desmos.HelperExpression({latex:'k'});
          a.observe('numericValue',function(val) {vs.M956353.a=a[val]});
          h.observe('numericValue',function(val) {vs.M956353.h=h[val]});
          k.observe('numericValue',function(val) {vs.M956353.k=k[val]});
        }
        o.desmos.setExpression({id: 'reflected', latex: 'y=-a(x-' + o.value + ')^2-k', color: '#00AA00'});
        o.desmos.setExpression({id: 'exponential', latex: hs.updateExpForm(cs.enum.expform.EAHK,vs.M956353.a,vs.M956353.h,vs.M956353.k), color: '#00AAAA'});
       }
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
       observeZoom: function(options={}) {
        var o = hs.parseOptions(options);

        if (o.log) o.log('observeZoom activated with '+JSON.stringify(Object.assign({},o,{'desmos':'l'})));

        if (vs[o.uniqueId] === undefined) vs[o.uniqueId] = {};
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
          newPxCoords = o.desmos.graphpaperBounds.pixelCoordinates;
          newMthCoords = o.desmos.graphpaperBounds.mathCoordinates;
          newScale = {x: newPxCoords.width/newMthCoords.width, y: newPxCoords.height/newMthCoords.height};

          // log changes in Aspect Ratio
          if (Math.abs(Math.log2(newScale.x/newScale.y)-Math.log2(v.scale.x/v.scale.y))>cs.ts.ZOOM) {
            if (o.log) o.log('Aspect Ratio Change: '+Math.round(100*v.scale.x/v.scale.y)/100+' to '+Math.round(100*newScale.x/newScale.y)/100+'.');

            v.pixelCoordinates = newPxCoords;
            v.mathCoordinates = newMthCoords;
            v.scale = newScale;
          }

          // log changes in Scale
          // note: changes in y-scale alone should be captured by changes in Aspect Ratio
          if (Math.abs(Math.log2(newScale.x)-Math.log2(v.scale.x))>cs.ts.ZOOM) {
            if (o.log) o.log('Scale Change: '+
              Math.round(10*v.scale.x)/10+
              // Only log previous x and y scale separately if the aspect ratio was not square
              (Math.abs(Math.log2(v.scale.x)-Math.log2(v.scale.y))>cs.ts.AR ? 'px/unit by '+Math.round(10*v.scale.y)/10 : '')+
              'px/unit to '+Math.round(10*newScale.x)/10+
              // Only log new x and y scale separately if the aspect ratio is not square
              (Math.abs(Math.log2(newScale.x)-Math.log2(newScale.y))>cs.ts.AR ? 'px/unit by '+Math.round(10*newScale.y)/10 : '')+
              'px/unit');

            v.pixelCoordinates = newPxCoords;
            v.mathCoordinates = newMthCoords;
            v.scale = newScale;
          }

          o.desmos.setExpression({id:'x_pxScale',latex:'x_{pxScale}='+1/newScale.x});
          o.desmos.setExpression({id:'y_pxScale',latex:'y_{pxScale}='+1/newScale.y});

        });
       },
      /* ←— shareState ————————————————————————————————————————————————————→ *\
       | Shares the state of this widget between multiple widgets in the same SCO
       | NOTE: this initialization function is incompatible with state-based
       |       HelperExpressions
       * ←———————————————————————————————————————————————————————————————————→ */
       shareState: function(options={}) {
        let o = hs.parseOptions(options);
        let myGuid = o.desmos.guid;
        if (vs.shared[o.uniqueId] === undefined) vs.shared[o.uniqueId] = {sharingInstances:{},queuedActions:{},recentLoad:{}};
        let vars = vs.shared[o.uniqueId];

        vars.sharingInstances[myGuid] = o.desmos;
        if (vars.sharedState === undefined) {
          o.log('Queueing initial save from '+myGuid);
          vars.queuedActions[myGuid] = setTimeout(delayedSave,cs.delay.SAVE);
        } else {
          o.desmos.setState(vars.sharedState);
          o.log('Loading state from '+vars.lastSavedFrom+' into '+myGuid);
        }

        o.log(myGuid+' initialized.',vars);

        function delayedSave() {
          o.log('Saving state from '+myGuid);
          vars.sharedState = o.desmos.getState();
          vars.lastSavedFrom = myGuid;
          if (vars.queuedActions[myGuid] !== undefined) clearTimeout(vars.queuedActions[myGuid]);
          delete vars.queuedActions[myGuid];

          // Load into all the others
          for (var guid in vars.sharingInstances) {
            if (guid != myGuid) {
              o.log('Loading state from '+myGuid+' into '+guid);
              vars.recentLoad[guid] = true;
              vars.sharingInstances[guid].setState(vars.sharedState);
              // The `'change.save'` event will ensure the load is confirmed
            } else o.log('Skipped loading into '+guid)
          }
        };

        function confirmLoad() {
          o.log('Considering '+myGuid+' loaded.');
          vars.recentLoad[myGuid] = false;
          delete vars.queuedActions[myGuid];
        };

        o.desmos.observeEvent('change.save',function(){
          if (vars.queuedActions[myGuid] !== undefined) clearTimeout(vars.queuedActions[myGuid]);
          if (vars.recentLoad[myGuid]) {
            // o.log('Not saving from '+myGuid+'; loaded too recently.');
            vars.queuedActions[myGuid] = setTimeout(confirmLoad,cs.delay.LOAD);
          } else {
            // o.log('Queueing save from '+myGuid);
            vars.queuedActions[myGuid] = setTimeout(delayedSave,cs.delay.SAVE);
          }
        });
       }
     };
    /* ←— SHARED LATEX FUNCTIONS ——————————————————————————————————————————→ */
     fs.shared.latex = {
      /* ←— reportValue ———————————————————————————————————————————————————→ *\
       | Sets an expression equal to its evaluation.
       | Use for reporting evaluations in line, instead of "=[val]" below.
       |
       | EXPRESSIONS MUST FIRST BE MANUALLY AUTHORED USING API:
       |  calculator.setExpression({
       |    id:'[expressionLaTeX]',
       |    latex:'[expressionLaTeX]=[initialValue]'
       |  });
       | 
       | For testing, use option {log:console.log}, which will log whenever
       |  the expression's value changes.
       * ←————————————————————————————————————————————————————————————————→ */
       reportValue: function(options={}) {
        var o = hs.parseOptions(options);
        var expr = '' + o.name + '=' + o.value;
        if (o.log) o.log('Setting expression \'' + o.name + '\' to \'' + expr + '\'.');
        o.desmos.setExpression({id:o.name,latex:expr});
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
       valueOnly: function(options={}) {
        var o = hs.parseOptions(options);
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
       labelAngle: function(options={}) {
        var o = hs.parseOptions(options);
        o.desmos.setExpression({id:o.name,label:''+o.value+'°'});
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
       labelEquation: function(options={},prec=cs.precision.EVAL) {
        var o = hs.parseOptions(options);
        var expr = hs.latexToText(o.name) + ' = ' + Math.round(o.value*Math.pow(10,prec))/Math.pow(10,prec);
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
       labelTriAngles: function(options={},pointNames={A:'A',B:'B',C:'C'},prec=cs.precision.DEGREES) {
        var o = hs.parseOptions(options);
        var A = pointNames.A;
        var B = pointNames.B;
        var C = pointNames.C;
        var vertex = o.name[o.name.length-1];
        var val = Math.round(180*o.value/Math.PI*Math.pow(10,prec))/Math.pow(10,prec);
        var vars = vs[o.uniqueId]['triAngle'+A+B+C];
        var oldVal = vars[vertex];

        if (vars.upToDate === undefined) o.log('Labeling angles of △'+A+B+C+' to '+prec+' decimal places.');

        // Only update stuff if the one of the values has changed
        if (vars.upToDate === true && val == oldVal) return;

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
        if (val == calculated) {
          vars[vertex] = val;
          o.desmos.setExpression({id:'point'+A,label:('m∠'+A+' = '+vars[A]+'°')});
          o.desmos.setExpression({id:'point'+B,label:('m∠'+B+' = '+vars[B]+'°')});
          o.desmos.setExpression({id:'point'+C,label:('m∠'+C+' = '+vars[C]+'°')});
          vars.upToDate = true;
        } else {
          // If this angle is closer to its (re-)calculated value than the last one was, correct this one and let the others keep their original values.
          var newErr = Math.abs(180*o.value/Math.PI-calculated);
          if (newErr < vars.prevError && newErr < 1) {
            // Note: <1 makes rounding floor or ceiling only; if there is a spin where the error
            //       is always > 1, something has gone seriously wrong.
            // correct this one and update the 3 labels
            vars[vertex] = val = Math.round(calculated*Math.pow(10,prec))/Math.pow(10,prec);
            o.desmos.setExpression({id:'point'+A,label:('m∠'+A+' = '+vars[A]+'°')});
            o.desmos.setExpression({id:'point'+B,label:('m∠'+B+' = '+vars[B]+'°')});
            o.desmos.setExpression({id:'point'+C,label:('m∠'+C+' = '+vars[C]+'°')});
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
       labelPolyAngles: function(options={},params={},prec=cs.precision.DEGREES) {
        var o = hs.parseOptions(options);
        var ps = Object.assign({refreshAll:false,exterior:false},params);
        var v = o.name[o.name.length-1];
        var vars = vs[o.uniqueId];
        var p = vars[vars.polygonName+'_angles'];
        var vertices = vars.polygonName.slice(7,vars.polygonName.length).split('');

        function measure(x) {return (Math.pow(10,prec)*vars['P_'+x]);}

        if (ps.refreshAll) {
          // Sort the points by the error they produce (larger error closer to ends).
          var sorted = [];
          for (name of vertices) {
            // Delay if the value hasn't been reported yet.
            if (measure(name) === undefined || isNaN(measure(name))) {
              o.log('Angles of '+vars.polygonName+' not all defined. Delaying full refresh by '+cs.delay.SET_EXPRESSION+'ms');
              setTimeout(function(){fs.shared.label.labelPolyAngles(o,Object.assign({},ps,{refreshAll:true}),prec);},cs.delay.LOAD);
              return;
            }

            var thisError = Math.round(Math.pow(10,cs.precision.FLOAT_PRECISION)*(Math.round(measure(name))-measure(name)))/Math.pow(10,cs.precision.FLOAT_PRECISION);
            for (var i = 0;i<=sorted.length;i++) {
              var thatError = Math.round(Math.pow(10,cs.precision.FLOAT_PRECISION)*(Math.round(measure(sorted[i]))-measure(sorted[i])))/Math.pow(10,cs.precision.FLOAT_PRECISION);
              if(!(thisError<thatError)) {
                // If the errors are the same, then prioritise the smaller relative error
                if (thisError == thatError) {
                  if (measure(name) == measure(sorted[i])) {if (2*Math.random()>1) i++;}
                  else if ((measure(name) < measure(sorted[i])) == (thisError > 0)) i++;
                }
                sorted.splice(i,0,name);
                break;
              }
            }
          }

          var desiredSum = 180*(vertices.length-2)*Math.pow(10,prec);
          var apparentSum = 0;
          for (name of vertices) {
            var rounded = Math.round(measure(name));
            p[name] = rounded;
            apparentSum += rounded;
          }

          o.log('Measured angles:',Object.assign({},p));

          // Points with the largest error introduce the least error when rounded oppositely
          // So, re-round points with the largest error to get the sum you want (but each one only once)
          while (apparentSum > desiredSum && sorted.length>1) {
            var adjusting = sorted.shift();
            o.log('Apparent sum of '+apparentSum+' too high; reducing value of angle '+adjusting+' by 1.');
            p[adjusting]--;
            apparentSum--;
          }
          while (apparentSum < desiredSum && sorted.length>1) {
            var adjusting = sorted.pop();
            o.log('Apparent sum of '+apparentSum+' too low; increasing value of angle '+adjusting+' by 1.');
            p[adjusting]++;
            apparentSum++;
          }
          if (sorted.length < 1) o.log('Something went wrong trying to fix the angle lengths. Wound up with angle sum of '+apparentSum+' out of '+desiredSum+'. With angle measures:',p);
          else for (name of vertices) {
            o.desmos.setExpression({id:'m_'+name,label:''+(((ps.exterior)?180*Math.pow(10,prec)-p[name]:p[name])/Math.pow(10,prec))+'°'});
            vars.upToDate = true;
          }

          o.log('Corrected angles:',Object.assign({},p));

          return;
         }

        if (vertices.indexOf(v) == -1) {
          o.log('Unable to label angle '+v+' of '+vars.polygonName);
          return;
        }

        if (vars.upToDate !== true) o.log('Labeling angles of '+vars.polygonName+' to '+prec+' decimal places.');

        var prev = vertices[(vertices.indexOf(v)+vertices.length-1)%vertices.length];
        var next = vertices[(vertices.indexOf(v)+1)%vertices.length];

        var prevVal = Math.round(measure(prev));
        var val = Math.round(measure(v));
        var nextVal = Math.round(measure(next));
        
        if (isNaN(prevVal) || isNaN(nextVal) || isNaN(val)) {
          o.log('Angles of vertices '+prev+', '+v+', and '+next+' not all defined. Refreshing polygon '+vars.polygonName+' in '+cs.delay.SET_EXPRESSION+'ms');
          setTimeout(function(){fs.shared.label.labelPolyAngles(o,Object.assign({},ps,{refreshAll:true}),prec);},cs.delay.SET_EXPRESSION*300);
          return;
        }

        // Only update stuff if the one of the values has changed
        if (vars.upToDate === true && val == p[v] && prevVal == p[prev] && nextVal == p[next]) return;

        // The apparent sum of the three affected angles shouldn't change, else other angles will have to change.
        var expectedSum = p[prev] + p[v] + p[next];
        var apparentSum = prevVal + val + nextVal;

        while (apparentSum > expectedSum) {
          var prevError = prevVal - measure(prev);
          var thisError = val - measure(v);
          var nextError = nextVal - measure(next);

          var errors = [prevError,thisError,nextError];

          var pos = errors.indexOf(Math.max.apply(null,errors));

          o.log('Angle sum '+apparentSum+'° too large for expected sum of '+expectedSum+'°; decreasing '+[prev,v,next][pos]+' from '+[prevVal,val,nextVal][pos]+'.');

          if (pos == 0) prevVal--;
          else if (pos == 1) val--;
          else nextVal--;

          apparentSum--;
        }
        while (apparentSum < expectedSum) {
          var prevError = prevVal - measure(prev);
          var thisError = val - measure(v);
          var nextError = nextVal - measure(next);

          var errors = [prevError,thisError,nextError];

          var pos = errors.indexOf(Math.min.apply(null,errors));

          o.log('Angle sum '+apparentSum+'° too small for expected sum of '+expectedSum+'°; increasing '+[prev,v,next][pos]+' from '+[prevVal,val,nextVal][pos]+'.');

          if (pos == 0) prevVal++;
          else if (pos == 1) val++;
          else nextVal++;

          apparentSum++;
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
    /* ←— VALUE STORAGE FUNCTIONS —————————————————————————————————————————→ */
     fs.value = {
      /* ←— * —————————————————————————————————————————————————————————————→ *\
       | Store the value of * for use as a parameter in setting expressions.
       |
       | Variable will be stored in vs.[uniqueId].values['*_#'], where # is
       | any value in the subscript of the variable.
       |
       | The subscript # will be used when setting expressions using the
       | shared function. If the subscript begins with a letter, that will
       | be the function's name; otherwise it will default to y. If the
       | subscript ends with a letter, that will be the argument of the
       | function, otherwise it will default to x. Anything in-between will
       | be the subscript of the function name.
       |  e.g., Using the function on the variable t_2 will save it for y₂=…
       |  e.g., q_{f83} → f₈₃=…
       |  e.g., m_A → A=…
       |  e.g., \theta _{r2theta} → r₂(θ)=…
       |  e.g., L_{finitial} = r_{initia}(l)=…
       | 
       | For testing, use option {log:console.log}, which will log whenever
       |  the expression's value changes.
       * ←————————————————————————————————————————————————————————————————→ */
       };
       for(var i=0;i<52;i++) {
        var varName = 'QWERTYUIOPASDFGHJKLZXCVBNMqwertyuiopasdfghjklzxcvbnm'[i];
        fs.value[varName] = (function(l){
          return function(options={}) {
            var o = hs.parseOptions(options);
            if (vs[o.uniqueId] === undefined) vs[o.uniqueId] = {};
            var name = o.name.match(/(?:[a-zA-Z]|\\(?:alpha|beta|theta|phi|pi|tau) )_(?:{([a-zA-Z0-9]+)}|([a-zA-Z0-9]))/) || [];
            name = l+'_'+((name[1] === undefined) ? ((name[2] === undefined) ? '' : name[2]) : name[1]);
            if (name.length == 2) name = name[0];
            vs[o.uniqueId][name] = o.value;
            if (o.log) o.log('Saving value of ' + o.name + ' as vs.' + o.uniqueId + '.' + name);
           };
         })(varName);
     };

    /* ←— A0597514 FUNCTIONS ——————————————————————————————————————————————→ */
     fs.A0597514 = {
      /* ←— init ————————————————————————————————————————————————————————————→ *\
       | Initializes the variables
       * ←———————————————————————————————————————————————————————————————————→ */
       init: function(options={}) {
        var o = hs.parseOptions(options);
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
       updateLabels: function(options={}) {
        var o = hs.parseOptions(options);
        switch (o.name) {
          case 'x_1':
            vs[o.uniqueId].P_x = o.value;
            vs[o.uniqueId].M_x = (vs[o.uniqueId].Q_x+o.value)/2;
            hs.labelPoint(vs[o.uniqueId].P_x,vs[o.uniqueId].P_y,'P','P_point',o);
            break;
          case 'y_1':
            vs[o.uniqueId].P_y = o.value;
            vs[o.uniqueId].M_y = (vs[o.uniqueId].Q_y+o.value)/2;
            hs.labelPoint(vs[o.uniqueId].P_x,vs[o.uniqueId].P_y,'P','P_point',o);
            break;
          case 'x_2':
            vs[o.uniqueId].Q_x = o.value;
            vs[o.uniqueId].M_x = (vs[o.uniqueId].P_x+o.value)/2;
            hs.labelPoint(vs[o.uniqueId].Q_x,vs[o.uniqueId].Q_y,'Q','Q_point',o);
            break;
          case 'y_2':
            vs[o.uniqueId].Q_y = o.value;
            vs[o.uniqueId].M_y = (vs[o.uniqueId].P_y+o.value)/2;
            hs.labelPoint(vs[o.uniqueId].Q_x,vs[o.uniqueId].Q_y,'Q','Q_point',o);
            break;
        };
        hs.labelPoint(vs[o.uniqueId].M_x,vs[o.uniqueId].M_y,'M','M_point',o);
       }
     };

    /* ←— A0597714 FUNCTIONS ——————————————————————————————————————————————→ */
     fs.A0597714 = {
      /* ←— init ————————————————————————————————————————————————————————————→ *\
       | Initializes the variables
       * ←———————————————————————————————————————————————————————————————————→ */
       init: function(options={}) {
        var o = hs.parseOptions(options);
        vs[o.uniqueId] = {          
        };
       },
      /* ←— updateLabels ————————————————————————————————————————————————————→ *\
       | updates the labels of GH and DF
       |
       | Hidden points J and K must be authored with showLabel:true,
       | and the IDs J and K
       * ←———————————————————————————————————————————————————————————————————→ */
       updateLabels: function(options={}) {
        var o = hs.parseOptions(options);
        switch (o.name) {
          case 'D_1':
            vs[o.uniqueId].D_1 = D_1 = o.value;
            o.desmos.setExpression({id:'J',label:(o.value)});
            break;
          case 'D_2':
            log:console.log(o.value);
            vs[o.uniqueId].D_2 = D_2 = o.value;
            o.desmos.setExpression({id:'K',label:(o.value)});
            break;
          };
        }
     };

    /* ←— A0597552 FUNCTIONS ——————————————————————————————————————————————→ */
     fs.A0597552 = {
      /* ←— init ————————————————————————————————————————————————————————————→ *\
       | Initializes the variables
       * ←———————————————————————————————————————————————————————————————————→ */
       init: function(options={}) {
        var o = hs.parseOptions(options);
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
       updateLabels: function(options={}) {
        var o = hs.parseOptions(options);
        var P_x = vs[o.uniqueId].P_x;
        var P_y = vs[o.uniqueId].P_y;
        var Q_x = vs[o.uniqueId].Q_x;
        var Q_y = vs[o.uniqueId].Q_y;
        switch (o.name) {
          case 'x_1':
            vs[o.uniqueId].P_x = P_x = o.value;
            hs.labelPoint(vs[o.uniqueId].P_x,vs[o.uniqueId].P_y,'P','P_point',o);
            break;
          case 'y_1':
            vs[o.uniqueId].P_y = P_y = o.value;
            hs.labelPoint(vs[o.uniqueId].P_x,vs[o.uniqueId].P_y,'P','P_point',o);
            break;
          case 'x_2':
            vs[o.uniqueId].Q_x = Q_x = o.value;
            hs.labelPoint(vs[o.uniqueId].Q_x,vs[o.uniqueId].Q_y,'Q','Q_point',o);
            break;
          case 'y_2':
            vs[o.uniqueId].Q_y = Q_y = o.value;
            hs.labelPoint(vs[o.uniqueId].Q_x,vs[o.uniqueId].Q_y,'Q','Q_point',o);
            break;
        };
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

    /* ←— A0597534 FUNCTIONS ——————————————————————————————————————————————→ */
     fs.A0597534 = {
      /* ←— init ————————————————————————————————————————————————————————————→ *\
       | Initializes the variables
       * ←———————————————————————————————————————————————————————————————————→ */
       init: function(options={}) {
        var o = hs.parseOptions(options);
        vs[o.uniqueId] = {
        };
       },
      /* ←— updateLabels ————————————————————————————————————————————————————→ *\
       | updates the labels of theta 1, 2, 3, 4 based on changes to two lines
       |
       | Hidden points P_1, P_2, P_3, and P_4 must be authored with showLabel:true,
       | and the IDs a1, a2, a3, a4
       * ←———————————————————————————————————————————————————————————————————→ */
       updateLabels: function(options={}) {
        var o = hs.parseOptions(options);
        switch (o.name) {
          case '\\theta_1':
            o.desmos.setExpression({id:'a1',label:(o.value+'°')});
            break;
          case '\\theta_2':
            o.desmos.setExpression({id:'a2',label:(o.value+'°')});
            break;
          case '\\theta_3':
            o.desmos.setExpression({id:'a3',label:(o.value+'°')});
            break;
          case '\\theta_4':
            o.desmos.setExpression({id:'a4',label:(o.value+'°')});
            break;
          };
        }
     };

    /* ←— A0597544 FUNCTIONS ——————————————————————————————————————————————→ */
     fs.A0597544 = {
      /* ←— init ————————————————————————————————————————————————————————————→ *\
       | Initializes the variables
       * ←———————————————————————————————————————————————————————————————————→ */
       init: function(options={}) {
        var o = hs.parseOptions(options);
        vs[o.uniqueId] = {
        };
       },
      /* ←— updateLabels ————————————————————————————————————————————————————→ *\
       | updates the labels of theta 1, 2 based on changes to two lines
       |
       | Hidden points P_1, P_2 must be authored with showLabel:true,
       | and the IDs P1, P2
       * ←———————————————————————————————————————————————————————————————————→ */
       updateLabels: function(options={}) {
        var o = hs.parseOptions(options);
        switch (o.name) {
          case '\\theta_1':
            o.desmos.setExpression({id:'P1',label:(o.value+'°')});
            break;
          case '\\theta_2':
            o.desmos.setExpression({id:'P2',label:(o.value+'°')});
            break;
          };
        }
     };
     /* ←— A0597546 FUNCTIONS ——————————————————————————————————————————————→ */
     fs.A0597546 = {
      /* ←— init ————————————————————————————————————————————————————————————→ *\
       | Initializes the variables
       * ←———————————————————————————————————————————————————————————————————→ */
       init: function(options={}) {
        var o = hs.parseOptions(options);
        vs[o.uniqueId] = {
        };
       },
      /* ←— updateLabels ————————————————————————————————————————————————————→ *\
       | updates the labels of theta 1, 2 based on changes to two lines
       |
       | Hidden points P_1, P_2 must be authored with showLabel:true,
       | and the IDs P1, P2 *******
       * ←———————————————————————————————————————————————————————————————————→ */
       updateLabels: function(options={}) {
        var o = hs.parseOptions(options);
        switch (o.name) {
          case '\\theta_1':
            o.desmos.setExpression({id:'100',label:(o.value+'°')});
            break;
          case '\\theta_2':
            o.desmos.setExpression({id:'101',label:(o.value+'°')});
            break;
          };
        }
     };

    /* ←— A0597538 FUNCTIONS ——————————————————————————————————————————————→ */
     fs.A0597538 = {
      /* ←— init ————————————————————————————————————————————————————————————→ *\
       | Initializes the variables
       * ←———————————————————————————————————————————————————————————————————→ */
       init: function(options={}) {
        var o = hs.parseOptions(options);
        vs[o.uniqueId] = {
        };
       },
      /* ←— updateLabels ————————————————————————————————————————————————————→ *\
       | updates the labels of theta 1 and 2 based on change to ray 
       |       
       | Hidden points must be authored with showLabel:true,
       | and the IDs a1, a2, a3
       * ←———————————————————————————————————————————————————————————————————→ */
       updateLabels: function(options={}) {
        var o = hs.parseOptions(options);
        switch (o.name) {
          case '\\theta_1':
            o.desmos.setExpression({id:'a1',label:('𝑚∠2 = '+o.value+'°')});
            break;
          case '\\theta_2':
            o.desmos.setExpression({id:'a2',label:('𝑚∠1 = '+o.value+'°')});
            break;
          };
        }
     };

    /* ←— A0598652 FUNCTIONS ——————————————————————————————————————————————→ */
     fs.A0598652 = {
      /* ←— init ————————————————————————————————————————————————————————————→ *\
       | Initializes the variables
       * ←———————————————————————————————————————————————————————————————————→ */
       init: function(options={}) {
        var o = hs.parseOptions(options);
        vs[o.uniqueId] = {
        };
       },
      /* ←— updateLabels ————————————————————————————————————————————————————→ *\
       | updates the distance label 
       |       
       | Hidden point D must be authored with showLabel:true,
       | and the ID distance
       * ←———————————————————————————————————————————————————————————————————→ */
       updateLabels: function(options={}) {
        var o = hs.parseOptions(options);
        switch (o.name) {
          case 'd_2':
            o.desmos.setExpression({id:'distance',label:(o.value+' blocks')});
            break;
          };
        }
     };

    /* ←— A0597598_A FUNCTIONS ——————————————————————————————————————————————→ */
     fs.A0597598_A = {
      /* ←— labelAngle ————————————————————————————————————————————————————→ *\
       | updates the label of the angle of rotation
       | observe with \theta_x
       * ←———————————————————————————————————————————————————————————————————→ */
       labelAngle: function(options={}) {
        var o = hs.parseOptions(options);
        o.desmos.setExpression({id:'angle_label',label:('a = '+hs.latexToText(o.value)+'°')});
       }
     };

    /* ←— A0597616 FUNCTIONS ——————————————————————————————————————————————→ */
     cs.A0597616 = {CM_PRECISION:1};
     fs.A0597616 = {
      /* ←— label —————————————————————————————————————————————————————————→ */
       label: function(options={}) {
        var o = hs.parseOptions(options);
        /* switch (o.name) {
          case 'm_B': */
            var value = vs[o.uniqueId].B = Math.round(o.value);
            o.desmos.setExpression({id:'labelB',label:''+value+'°'});
            if (0 < value && value < 155) {
              o.desmos.setExpression({id:'labelX',label:''+Math.round(155-value)+'°',showLabel:true});
              var AX = Math.round(Math.pow(10,cs.A0597616.CM_PRECISION)*3*Math.sin(Math.PI*value/180)/Math.sin(Math.PI*((155-value)/180)))/Math.pow(10,cs.A0597616.CM_PRECISION);
              var BX = Math.round(Math.pow(10,cs.A0597616.CM_PRECISION)*3*Math.sin(Math.PI*25/180)/Math.sin(Math.PI*((155-value)/180)))/Math.pow(10,cs.A0597616.CM_PRECISION);
              o.desmos.setExpressions([
                {id:'labelAX',label:''+AX+' cm',showLabel:true},
                {id:'labelBX',label:''+BX+' cm',showLabel:true}
              ]);
            } else o.desmos.setExpressions([
              {id:'labelX',showLabel:false},
              {id:'labelAX',showLabel:false},
              {id:'labelBX',showLabel:false}
            ]);
          /*   break;
          case 'd_{AX}':
            var value = Math.round(o.value*Math.pow(10,cs.A0597616.CM_PRECISION))/Math.pow(10,cs.A0597616.CM_PRECISION);
            value = Math.max(value,1/Math.pow(10,cs.A0597616.CM_PRECISION));
            o.desmos.setExpression({id:'labelAX',label:''+value+' cm'});
            break;
          case 'd_{BX}':
            var value = Math.round(o.value*Math.pow(10,cs.A0597616.CM_PRECISION))/Math.pow(10,cs.A0597616.CM_PRECISION);
            value = Math.max(value,1/Math.pow(10,cs.A0597616.CM_PRECISION));
            if (vs[o.uniqueId].B !== undefined && vs[o.uniqueId].B < 65) value = Math.min(value,Math.round(Math.pow(10,cs.A0597616.CM_PRECISION)*3-1)/Math.pow(10,cs.A0597616.CM_PRECISION));
            o.desmos.setExpression({id:'labelBX',label:''+value+' cm'});
            break;
        } */
       },
      /* ←— label_noCorrection ————————————————————————————————————————————→ */
       label_noCorrection: function(options={}) {
        var o = hs.parseOptions(options);
        var value = vs[o.uniqueId].B = Math.round(o.value);
        o.desmos.setExpression({id:'labelB',label:''+value+'°'});
        if (0 < value && value < 155) {
          o.desmos.setExpression({id:'labelX',label:''+Math.round(155-value)+'°',showLabel:true});
          var AX = Math.round(Math.pow(10,cs.A0597616.CM_PRECISION)*3*Math.sin(Math.PI*o.value/180)/Math.sin(Math.PI*((155-o.value)/180)))/Math.pow(10,cs.A0597616.CM_PRECISION);
          var BX = Math.round(Math.pow(10,cs.A0597616.CM_PRECISION)*3*Math.sin(Math.PI*25/180)/Math.sin(Math.PI*((155-o.value)/180)))/Math.pow(10,cs.A0597616.CM_PRECISION);
          o.desmos.setExpressions([
            {id:'labelAX',label:''+AX+' cm',showLabel:true},
            {id:'labelBX',label:''+BX+' cm',showLabel:true}
          ]);
        } else o.desmos.setExpressions([
          {id:'labelX',showLabel:false},
          {id:'labelAX',showLabel:false},
          {id:'labelBX',showLabel:false}
        ]);
       }
     };

    /* ←— A0596392 FUNCTIONS ——————————————————————————————————————————————→ */
     fs.A0596392 = {
      /* ←— init ————————————————————————————————————————————————————————————→ */
       init: function(options={}) {
        var o = hs.parseOptions(options);
        vs[o.uniqueId] = {triAngleABC:{prevError:0,A:0,B:0,C:0}};
       }
     };

    /* ←— A0597720 FUNCTIONS ——————————————————————————————————————————————→ */
     fs.A0597720 = {
      /* ←— labelEquation ————————————————————————————————————————————————————→ */
       labelEquation: function(options={}) {
        var o = hs.parseOptions(options);
        o.desmos.setExpression({id:'equation',label:''+(180-o.value)+'° + '+o.value+'° = 180°'});
       }
     };

    /* ←— A0597724 FUNCTIONS ——————————————————————————————————————————————→ */
     fs.A0597724 = {
      /* ←— init ——————————————————————————————————————————————————————→ *\
       | Prepares the widget to listen to user input
       * ←—————————————————————————————————————————————————————————————————→ */
       init: function(options={}) {
        let o = hs.parseOptions(options);
        let vars = vs[o.uniqueId] = {
          x_1:8,
          y_1:4,
          x_2:-2,
          y_2:4,
          dragging:0
        };
        vars.d1 = o.desmos.HelperExpression({latex:'d_1'});
        vars.d2 = o.desmos.HelperExpression({latex:'d_2'});

        function startDragging(){
          vars.dragging = -1;
        }

        function stopDragging(){
          if (vars.dragging > 0) o.desmos.setExpressions([
            {id:'x_1',latex:'x_1='+vars['x_1']},
            {id:'y_1',latex:'y_1='+vars['y_1']},
            {id:'x_2',latex:'x_2='+vars['x_2']},
            {id:'y_2',latex:'y_2='+vars['y_2']}
          ]);
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
       dragging: function(options={}){
        var o = hs.parseOptions(options);
        var vars = vs[o.uniqueId];

        vars[o.name] = o.value;

        if (vars.dragging > -1) return;

        vars.dragging = o.name[o.name.length-1];

        o.desmos.setExpression({id:'x_'+(3-vars.dragging),latex:'x_'+(3-vars.dragging)+'='+vars['d'+(3-vars.dragging)].numericValue+'\\frac{'+((vars.dragging == 1)?'':'-')+'y_'+vars.dragging+'}{d_'+vars.dragging+'}'});
        o.desmos.setExpression({id:'y_'+(3-vars.dragging),latex:'y_'+(3-vars.dragging)+'='+vars['d'+(3-vars.dragging)].numericValue+'\\frac{'+((vars.dragging == 1)?'-':'')+'x_'+vars.dragging+'}{d_'+vars.dragging+'}'});
       }
     };

    /* ←— A0597631 FUNCTIONS ——————————————————————————————————————————————→ */
     fs.A0597631 = {
      /* ←— equation ——————————————————————————————————————————————————————→ *\
       | Updates the equation (expression) with the new value of `n`
       * ←—————————————————————————————————————————————————————————————————→ */
       equation: function(options={}) {
        var o = hs.parseOptions(options);
        o.desmos.setExpression({id:'equation',latex:'\\frac{180\\left('+o.value+'-2\\right)}{'+o.value+'}'});
       }
     };

    /* ←— A0596385 FUNCTIONS ——————————————————————————————————————————————→ */
     fs.A0596385 = {
      /* ←— init ————————————————————————————————————————————————————————————→ */
       init: function(options={}) {
        var o = hs.parseOptions(options);
        vs[o.uniqueId] = {triAngleABC:{prevError:0,A:0,B:0,C:0}};
       },
      /* ←— updateAngles ————————————————————————————————————————————————————→ *\
       | updates the labels of the triangle's vertices with their respective
       | angle measures.
       * ←———————————————————————————————————————————————————————————————————→ */
       updateAngles: function(options={}) {
        var o = hs.parseOptions(options);
        var vertex = o.name[o.name.length-1];
        var val = Math.round(180*o.value/Math.PI);
        var vars = vs[o.uniqueId].triAngleABC;
        var oldVal = vars[vertex];

        // Only update stuff if the one of the values has changed
        if (vars.upToDate === true && val == oldVal) return;

        fs.shared.label.labelTriAngles(o);

        if ((oldVal-90)*(val-90)<=0) {
          // This angle just became obtuse or non-obtuse.
          if (val>90) fs.A0596385.drawExtensions(o); // this angle just became obtuse
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
       drawExtensions: function(options={}) {
        var o = hs.parseOptions(options);
        var obtuse = (o.name[o.name.length-1] == 'A')?1:((o.name[o.name.length-1] == 'B')?2:3);
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


        // Backup: expr = '\\left(x_1+\\frac{O_x-x_1}{o_A}\\left(t\\max \\left(o_a,h_a,o_A\\right)+\\left\\{\\theta_A\\ge \\frac{\\pi}{2}:tt_{ick}-h_a,\\max \\left(\\theta_B,\\theta_C\\right)\\ge \\frac{\\pi}{2}:tt_{ick},0\\right\}\\right),y_1+\\frac{O_y-y_1}{o_A}\\left(t\\max \\left(o_a,h_a,o_A\\right)+\\left\\{\\theta_A\\ge \\frac{\\pi}{2}:tt_{ick}-h_a,\\max \\left(\\theta_B,\\theta_C\\right)\\ge \\frac{\\pi}{2}:tt_{ick},0\\right\\}\\right)\\right)'
       }
     };

    /* ←— A0597629 FUNCTIONS ——————————————————————————————————————————————→ */
      cs.A0597629 = {
        MAX_VERTICES:14,
        RADIUS:10,
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
       init: function(options={}) {
        let o = hs.parseOptions(options);
        let vars = vs[o.uniqueId] = {lastDragged:0,placeholder:0};
        let hfs = vars.helperFunctions = {n:o.desmos.HelperExpression({latex:'n'}),showDiagonals:o.desmos.HelperExpression({latex:'d_{iags}'})};
        o.log(hfs);
        let cons = cs.A0597629;

        vars.belayCorrection = true;

        // Set up variables and observers for vertices of each polygon
         for(let i=1;i<=cons.MAX_VERTICES;i++) {
          // Track x & y for this vertex
          vars["x_"+i] = o.desmos.HelperExpression({latex:hs.sub('x',i)});
          vars["y_"+i] = o.desmos.HelperExpression({latex:hs.sub('y',i)});
          vars[i]={};
          if (i >= 3) for(var j=1;j<=i;j++) {
            if (i == vars.n) {
              // Initialize active polygon to current state
              vars[i]['x_'+j] = vars['x_'+i].numericValue;
              vars[i]['y_'+j] = vars['y_'+i].numericValue;
            } else {
              // Initialize inactive polygons to default
              vars[i]['x_'+j] = cons.RADIUS*Math.round(Math.pow(10,cons.INITIAL_COORDINATES_PRECISION)*Math.sin(2*Math.PI*((j-1)/i)))/Math.pow(10,cons.INITIAL_COORDINATES_PRECISION);
              vars[i]['y_'+j] = cons.RADIUS*Math.round(Math.pow(10,cons.INITIAL_COORDINATES_PRECISION)*Math.cos(2*Math.PI*((j-1)/i)))/Math.pow(10,cons.INITIAL_COORDINATES_PRECISION);
            }
          };
          // Set up observers for when the user drags a point
          hfs["x_"+i] = function(){fs.A0597629.coordinateChanged({
            name:hs.sub('x',i),
            value:vars['x_'+i].numericValue,
            desmos:o.desmos,
            uniqueId:o.uniqueId,
            log:o.log
          })};
          hfs['y_'+i] = function(){fs.A0597629.coordinateChanged({
            name:hs.sub('y',i),
            value:vars['y_'+i].numericValue,
            desmos:o.desmos,
            uniqueId:o.uniqueId,
            log:o.log
          })};
          vars["x_"+i].observe('numericValue.correction',hfs['x_'+i]);
          vars['y_'+i].observe('numericValue.correction',hfs['y_'+i]);
         };

         // 

        // Let the user turn the diagonals on and off
        hfs.showDiagonals.observe('numericValue',function(){
          var exprs = [];
          for (var i = 3; i < hfs.n.numericValue; i++) {
            exprs.push({
              id:'segment_'+hs.ALPHA[i]+'A',
              hidden:(vars.helperFunctions.showDiagonals.numericValue == 0)
            });
          };
          exprs.push({
            id:'centroid-1',
            showLabel:(vars.helperFunctions.showDiagonals.numericValue == 1)
          });
          o.desmos.setExpressions(exprs);
        });

        // Wait until the state fully loads before initializing the switchPolygon observer
        hfs.n.observe('numericValue.init',function(){
          if (hfs.n.numericValue !== undefined && hfs.n.numericValue>2) {
            vars.n = hfs.n.numericValue;
            o.log('n initialized to '+vars.n);
            hfs.n.unobserve('numericValue.init');
            hfs.n.observe('numericValue.switchingPolygon',function(){
              fs.A0597629.switchPolygon({
                name:'n',
                value:hfs.n.numericValue,
                desmos:o.desmos,
                uniqueId:o.uniqueId,
                log:o.log
              });
            });
          };
        });

        // prepare to clear placeholders
        document.addEventListener('mouseup',function(){fs.A0597629.clearPlaceholder(o);});
        document.addEventListener('touchend',function(){fs.A0597629.clearPlaceholder(o);});
        
        o.log("Observers initialized:",vars);

        hfs.correctionBuffer = window.setTimeout(function(){vars.belayCorrection = false;},cs.delay.LOAD);
       },
      /* ←— setPlaceholder ——————————————————————————————————————————————————→ *\
       | Attaches all segments from a vertex to the placeholder vertex
       * ←———————————————————————————————————————————————————————————————————→ */
       setPlaceholder: function(options={},i) {
        let o = hs.parseOptions(options);
        let vars = vs[o.uniqueId];
        let n = vars.n;

        // move the placeholder to the location of the vertex to hold place
        o.desmos.setExpression({id:'x_0',latex:'x_0='+Math.round(vars[n]['x_'+i]*Math.pow(10,cs.precision.FLOAT_PRECISION))/Math.pow(10,cs.precision.FLOAT_PRECISION)});
        o.desmos.setExpression({id:'y_0',latex:'y_0='+Math.round(vars[n]['y_'+i]*Math.pow(10,cs.precision.FLOAT_PRECISION))/Math.pow(10,cs.precision.FLOAT_PRECISION)});

        if (i == vars.placeholder) return; // The rest of this stuff only needs to be done the first time

        o.log('Adding placeholder '+hs.ALPHA[i]);

        vars.placeholder = i;
        let cons = cs.A0597629;

        // make the placeholder visible, and the dragged vertex invisible
        o.desmos.setExpression({id:'placeholder_vertex',hidden:false,showLabel:true,label:hs.ALPHA[i],dragMode:Desmos.DragModes.NONE});
        o.desmos.setExpression({id:'vertex_'+hs.ALPHA[i],showLabel:false,color:cons.HIDDEN_COLOR});

        // Attach the vertex to its edges and diagonals
        if (i == 1) {
          // Attach placeholder to B
          o.desmos.setExpression({
            id:'segment_AB',
            latex:cons.SEGMENT_TEMPLATE.replace(/U/g,'0').replace(/V/g,'2')
          });
          // Attach every other vertex to placeholder
          for (var j = 3;j<=n;j++) {
            o.desmos.setExpression({
              id:'segment_'+hs.ALPHA[j]+'A',
              latex:cons.SEGMENT_TEMPLATE.replace(/([xy])_U/g,hs.sub('$1',j)).replace(/V/g,'0')
            });
          }
        } else {
          if (i == 2) {
            o.desmos.setExpression({
              id:'segment_AB',
              latex:cons.SEGMENT_TEMPLATE.replace(/U/g,'0').replace(/V/g,'1')
            });
          } else {
            // attach to previous vertex
            o.desmos.setExpression({
              id:'segment_'+hs.ALPHA[i-1]+hs.ALPHA[i],
              latex:cons.SEGMENT_TEMPLATE.replace(/([xy])_U/g,hs.sub('$1',i-1)).replace(/V/g,'0')
            });
            // attach diagonal to A
            if (2 < i < n) o.desmos.setExpression({
                id:'segment_'+hs.ALPHA[i]+'A',
                latex:cons.SEGMENT_TEMPLATE.replace(/U/g,'0').replace(/V/g,'1')
              });
          }
          // Attach to the next vertex
          o.desmos.setExpression({
            id:'segment_'+hs.ALPHA[i]+hs.ALPHA[i%n+1],
            latex:cons.SEGMENT_TEMPLATE.replace(/U/g,'0').replace(/([xy])_V/g,hs.sub('$1',i%n+1))
          });
        }
       },
      /* ←— clearPlaceholder ————————————————————————————————————————————————→ *\
       | moves the last dragged vertex back to the placeholder vertex's location
       | 
       * ←———————————————————————————————————————————————————————————————————→ */
       clearPlaceholder: function(options={}) {
        let o = hs.parseOptions(options);
        let vars = vs[o.uniqueId];
        let hfs = vars.helperFunctions;
        let cons = cs.A0597629;
        let i = vars.placeholder;
        let n = vars.n;

        if (i == 0) return; // if it ain't broke, don't fix it

        o.log('Now clearing placeholder '+hs.ALPHA[i]);

        // Don't recorrect while clearing the placeholder
        if (hfs.correctionBuffer !== undefined) window.clearTimeout(hfs.correctionBuffer);
        vars.belayCorrection = true;

        // Move the place-held point to the placeholder
        o.desmos.setExpression({id:'x_'+i,latex:hs.sub('x',i)+'='+Math.round(vars[n]['x_'+i]*Math.pow(10,cs.precision.FLOAT_PRECISION))/Math.pow(10,cs.precision.FLOAT_PRECISION)});
        o.desmos.setExpression({id:'y_'+i,latex:hs.sub('y',i)+'='+Math.round(vars[n]['y_'+i]*Math.pow(10,cs.precision.FLOAT_PRECISION))/Math.pow(10,cs.precision.FLOAT_PRECISION)});

        hfs.correctionBuffer = window.setTimeout(function(){vars.belayCorrection = false;},cs.delay.SET_EXPRESSION);

        // Make the place-held point visible, and the placeholder invisible
        o.desmos.setExpression({id:'placeholder_vertex',hidden:true,showLabel:false});
        o.desmos.setExpression({id:'vertex_'+hs.ALPHA[i],showLabel:true,color:cons.VERTEX_COLOR});

        // Attach the vertex to its edges and diagonals
        if (i == 1) {
          // Attach A to B
          o.desmos.setExpression({
            id:'segment_AB',
            latex:cons.SEGMENT_TEMPLATE.replace(/U/g,'1').replace(/V/g,'2')
          });
          // Attach A to every other vertex
          for (var j = 3;j<=n;j++) {
            o.desmos.setExpression({
              id:'segment_'+hs.ALPHA[j]+'A',
              latex:cons.SEGMENT_TEMPLATE.replace(/([xy])_U/g,hs.sub('$1',j)).replace(/V/g,'1')
            });
          }
        } else {
          if (i == 2) {
            o.desmos.setExpression({
              id:'segment_AB',
              latex:cons.SEGMENT_TEMPLATE.replace(/U/g,'1').replace(/V/g,'2')
            });
          } else {
            // attach to previous vertex
            o.desmos.setExpression({
              id:'segment_'+hs.ALPHA[i-1]+hs.ALPHA[i],
              latex:cons.SEGMENT_TEMPLATE.replace(/([xy])_U/g,hs.sub('$1',i-1)).replace(/([xy])_V/g,hs.sub('$1',i))
            });
            // attach diagonal to A
            o.desmos.setExpression({
                id:'segment_'+hs.ALPHA[i]+'A',
                latex:cons.SEGMENT_TEMPLATE.replace(/([xy])_U/g,hs.sub('$1',i)).replace(/V/g,'1')
              });
          }
          // Attach to the next vertex
          o.desmos.setExpression({
            id:'segment_'+hs.ALPHA[i]+hs.ALPHA[i%n+1],
            latex:cons.SEGMENT_TEMPLATE.replace(/([xy])_U/g,hs.sub('$1',i)).replace(/([xy])_V/g,hs.sub('$1',i%n+1))
          });
        }

        vars.placeholder = 0;
       },
      /* ←— coordinateChanged ———————————————————————————————————————————————→ *\
       | updates variables, and corrects if the user tries to cross diagonals
       * ←———————————————————————————————————————————————————————————————————→ */
       coordinateChanged: function(options={}) {
        let o = hs.parseOptions(options);
        let vars = vs[o.uniqueId];
        if (vars.belayCorrection === true) return;
        let n = vars.n;
        let i = eval(o.name.match(/[0-9]+/)[0]);
        let newPoint = {x:vars['x_'+i].numericValue,y:vars['y_'+i].numericValue};

        if (i != vars.lastDragged) {
          o.log('Now dragging n='+n+',i='+i);
          vars.lastDragged = i;

          // First, put the last dragged vertex back.
          fs.A0597629.clearPlaceholder(o);

          // Now create a list of all the new boundaries
          vars.dragBoundaries = [];
          if (i == 1) {
            // All edges are boundaries, except [n]A and AB
            // NOTE: Since the vertices are numbered clockwise, edges must be defined in reverse so the positive-orientation of the polygon constrain function will work
            for (var j=2;j<n;j++) {
              vars.dragBoundaries.push(hs.lineTwoPoints(
                {x:vars[n]['x_'+(j+1)],y:vars[n]['y_'+(j+1)]},
                {x:vars[n]['x_'+j],y:vars[n]['y_'+j]}
              ));
            };
          } else {
            // Bind by the previous diagonal
            if (2 < i) vars.dragBoundaries.push(hs.lineTwoPoints(
                {x:vars[n]['x_'+(i-1)],y:vars[n]['y_'+(i-1)]},
                {x:vars[n]['x_1'],y:vars[n]['y_1']}
              ));
            // Bind by the next diagonal
            if (i < n) vars.dragBoundaries.push(hs.lineTwoPoints(
                {x:vars[n]['x_1'],y:vars[n]['y_1']},
                {x:vars[n]['x_'+(i%n+1)],y:vars[n]['y_'+(i%n+1)]}
              ));
          };

          o.log('Now constraining by:',vars.dragBoundaries);

          // Note: in previous versions, bound instead to keep the polygon convex.
          //  This meant binding by line(i-1,i+1), line(i-1,i-2), and line(i+2,i+1).
        };

        var constrained = hs.polygonConstrain(newPoint,vars.dragBoundaries);

        vars[n]['x_'+i] = constrained.x;
        vars[n]['y_'+i] = constrained.y;

        if (constrained == newPoint) {
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
        };
       },
      /* ←— switchPolygon ———————————————————————————————————————————————————→ *\
       | Adds and removes vertices and edges
       | Restyles diagonals
       | Restores coordinates
       * ←———————————————————————————————————————————————————————————————————→ */
       switchPolygon: function(options={}) {
        var o = hs.parseOptions(options);
        let vars = vs[o.uniqueId];
        let hfs = vars.helperFunctions;
        let cons = cs.A0597629;
        vars.belayCorrection = true;

        fs.A0597629.clearPlaceholder(o);

        let prevn = vars.n;
        var n = vars.n = o.value;

        o.log("Changing from "+prevn+" sides to "+n+" sides");

        var exprs = [];

        // Delete extra vertices
        for (var i = cons.MAX_VERTICES; i >= n+1; i--) {
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
        };

        // Add new vertices
        for (var i = 3; i < n; i++) {
          exprs.push({
            id:'vertex_'+hs.ALPHA[i+1],
            hidden:false,
            showLabel:true
          });
          exprs.push({
              id:'segment_'+hs.ALPHA[i]+'A',
              hidden:(vars.helperFunctions.showDiagonals.numericValue == 0),
              style:'dashed',
              color:cs.color.agaColors.red
          });
          exprs.push({
              id:'segment_'+hs.ALPHA[i]+hs.ALPHA[i+1],
              hidden:false,
              style:'normal',
              color:cs.color.agaColors.black
          });
        };

        // Style terminal edge
        exprs.push({
          id:'segment_'+hs.ALPHA[n]+'A',
          hidden:false,
          style:'normal',
          color:cs.color.agaColors.black
        });

        // Update centroid and labels
        var x_centroid = 'x_{centroid}=\\frac{';
        for (i = 1; i < n; i++) x_centroid+=(hs.sub('x',i)+'+');
        x_centroid += (hs.sub('x',n)+'}{n}');
        exprs.push({
          id:'x_centroid',
          latex:x_centroid
        });
        exprs.push({
          id:'y_centroid',
          latex:x_centroid.replace(/x/g,'y')
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
        for (var i = 1; i <= n; i++) {
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
        for(var i=1;i<=cons.MAX_VERTICES;i++){
          vars['x_'+i].unobserve('numericValue.correction');
          vars['y_'+i].unobserve('numericValue.correction');
        };

        if (hfs.correctionBuffer !== undefined) window.clearTimeout(hfs.correctionBuffer);

        o.desmos.setExpressions(exprs);

        // Reinitialize observers.
         for(var i=1;i<=n;i++) {
          // Observe x
          vars["x_"+i].observe('numericValue.correction',hfs["x_"+i]);
          // Observe y
          vars["y_"+i].observe('numericValue.correction',hfs["y_"+i]);
         };

        hfs.correctionBuffer = window.setTimeout(function(){vars.belayCorrection = false;},cs.delay.LOAD);

       }
     };

    /* ←— A0597630 FUNCTIONS ——————————————————————————————————————————————→ */
      cs.A0597630 = {
        MAX_VERTICES:14,
        RADIUS:4,
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
     fs.A0597630 = {
      /* ←— init ————————————————————————————————————————————————————————————→ *\
       | Initializes the variables
       * ←———————————————————————————————————————————————————————————————————→ */
       init: function(options={}) {
        let o = hs.parseOptions(options);
        let vars = vs[o.uniqueId] = Object.assign(((vs[o.uniqueId] === undefined)?{}:vs[o.uniqueId]),{lastDragged:0,placeholder:0});
        let hfs = vars.helperFunctions = ((vars.helperFunctions === undefined)?{n:o.desmos.HelperExpression({latex:'n'})}:vars.helperFunctions);
        o.log(hfs);
        let cons = cs.A0597630;

        vars.belayCorrection = true;


        // Set up watchers for each vertex of each polygon
         for(let i=1;i<=cons.MAX_VERTICES;i++) {
          if (vars[i]==undefined) {
            vars["x_"+i] = o.desmos.HelperExpression({latex:hs.sub('x',i)});
            vars["y_"+i] = o.desmos.HelperExpression({latex:hs.sub('y',i)});
            vars[i]={};
          }
         }

        // Initialize Vertices
         if (hfs.n.numericValue === undefined) {
          o.log('n not yet initialized; delaying initialization by '+cs.delay.SET_EXPRESSION+'ms');
          setTimeout(function(){fs.A0597630.init(o);},cs.delay.SET_EXPRESSION);
          return;
         } else var n = vars.n = hfs.n.numericValue;

         for(let i=1;i<=cons.MAX_VERTICES;i++) {
          if (i >= 3) for(var j=1;j<=i;j++) {
            if (i == n) {
              if (vars['x_'+j].numericValue === undefined || vars['y_'+j].numericValue === undefined) {
                o.log('Vertex '+hs.ALPHA[j]+' not yet initialized; delaying initialization by '+cs.delay.SET_EXPRESSION+'ms')
                setTimeout(function(){fs.A0597630.init(o);},cs.delay.SET_EXPRESSION);
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
          };
         };

        // Initialize angles and set observers
         vars.polygonName = 'polygonABC';
         vars.polygonABC_angles = {A:60,B:60,C:60};
         for(let i=1;i<=cons.MAX_VERTICES;i++) {
          // Set up polygon angle values for the polygon terminating in this vertex
          if (i > 3) {
            var newPoly = Object.assign({},vars[vars.polygonName+'_angles']);
            newPoly[hs.ALPHA[i]]=0;
            vars.polygonName+=hs.ALPHA[i];
            vars[vars.polygonName+'_angles'] = newPoly;
            vars[vars.polygonName+'_vertices'] = vars[i];
            o.log('Initializing '+vars.polygonName+' with angles:',vars[vars.polygonName+'_angles']);
          }
          // Set up observers for when the user drags a point
          hfs["x_"+i] = function(){fs.A0597630.coordinateChanged({
            name:hs.sub('x',i),
            value:vars['x_'+i].numericValue,
            desmos:o.desmos,
            uniqueId:o.uniqueId,
            log:o.log
          })};
          hfs['y_'+i] = function(){fs.A0597630.coordinateChanged({
            name:hs.sub('y',i),
            value:vars['y_'+i].numericValue,
            desmos:o.desmos,
            uniqueId:o.uniqueId,
            log:o.log
          })};
          vars["x_"+i].observe('numericValue.correction',hfs['x_'+i]);
          vars['y_'+i].observe('numericValue.correction',hfs['y_'+i]);
          o.log('Vertex '+hs.ALPHA[i]+' initialized at ('+vars['x_'+i].numericValue+', '+vars['y_'+i].numericValue+')');
         };
         vars.polygonName = vars.polygonName.slice(0,7+n);

         for (var i = 1; i <= n; i++) {
          var asquared = Math.pow(vars[n]['x_'+((i+n-2)%n+1)]-vars[n]['x_'+i],2)+Math.pow(vars[n]['y_'+((i+n-2)%n+1)]-vars[n]['y_'+i],2);
          var bsquared = Math.pow(vars[n]['x_'+(i%n+1)]-vars[n]['x_'+i],2)+Math.pow(vars[n]['y_'+(i%n+1)]-vars[n]['y_'+i],2);
          var csquared = Math.pow(vars[n]['x_'+((i+n-2)%n+1)]-vars[n]['x_'+(i%n+1)],2)+Math.pow(vars[n]['y_'+((i+n-2)%n+1)]-vars[n]['y_'+(i%n+1)],2);
          vars['P_'+hs.ALPHA[i]] = 180*Math.acos((asquared+bsquared-csquared)/(2*Math.sqrt(asquared*bsquared)))/Math.PI;
         };

         fs.shared.label.labelPolyAngles(o,{refreshAll:true},cons.ANGLE_PRECISION);

        var expr = '';
        for (var j = 1;j <= n;j++) expr+=((vars[vars.polygonName+'_angles'][hs.ALPHA[j]]/Math.pow(10,cons.ANGLE_PRECISION))+'+');
        expr = expr.slice(0,expr.length-1);
        o.desmos.setExpression({id:'sum',latex:expr});
        o.desmos.setExpression({id:'product',latex:'180\\left('+n+'-2\\right)'});

        hfs.n.observe('numericValue.switchingPolygon',function(){
          fs.A0597630.switchPolygon({
            name:'n',
            value:hfs.n.numericValue,
            desmos:o.desmos,
            uniqueId:o.uniqueId,
            log:o.log
          });
        });

        // prepare to clear placeholders
        document.addEventListener('mouseup',function(){fs.A0597630.clearPlaceholder(o);});
        document.addEventListener('touchend',function(){fs.A0597630.clearPlaceholder(o);});
      
        o.log("Observers initialized:",vars);

        hfs.correctionBuffer = window.setTimeout(function(){
          // set up the initial angles
          fs.shared.label.labelPolyAngles(o,{refreshAll:true},cons.ANGLE_PRECISION);

          vars.belayCorrection = false;
        },cs.delay.LOAD);
       },
      /* ←— setPlaceholder ——————————————————————————————————————————————————→ *\
       | Attaches all segments from a vertex to the placeholder vertex
       * ←———————————————————————————————————————————————————————————————————→ */
       setPlaceholder: function(options={},i) {
        let o = hs.parseOptions(options);
        let vars = vs[o.uniqueId];
        let n = vars.n;

        // move the placeholder to the location of the vertex to hold place
        o.desmos.setExpression({id:'x_0',latex:'x_0='+Math.round(vars[n]['x_'+i]*Math.pow(10,cs.precision.FLOAT_PRECISION))/Math.pow(10,cs.precision.FLOAT_PRECISION)});
        o.desmos.setExpression({id:'y_0',latex:'y_0='+Math.round(vars[n]['y_'+i]*Math.pow(10,cs.precision.FLOAT_PRECISION))/Math.pow(10,cs.precision.FLOAT_PRECISION)});

        if (i == vars.placeholder) return; // The rest of this stuff only needs to be done the first time

        o.log('Adding placeholder '+hs.ALPHA[i]);

        vars.placeholder = i;
        let cons = cs.A0597630;

        // make the placeholder visible, and the dragged vertex invisible
        o.desmos.setExpression({id:'placeholder_vertex',hidden:false,showLabel:true,label:hs.ALPHA[i],dragMode:Desmos.DragModes.NONE});
        o.desmos.setExpression({id:'vertex_'+hs.ALPHA[i],showLabel:false,color:cons.HIDDEN_COLOR});

        // Attach the angle label to the placeholder
        o.desmos.setExpression({
          id:'m_'+hs.ALPHA[i],
          latex:cs.A0597630.LABEL_TEMPLATE.replace(/U/g,hs.sub('',0)).replace(/Z/g,hs.sub('',i%n+1)).replace(/W/g,'P').replace(/Q/g,hs.ALPHA[(i+n-2)%n+1]).replace(/S/g,hs.ALPHA[i%n+1]).replace(/P_{label/g,hs.ALPHA[i]+'_{label')
        });
        o.desmos.setExpression({
          id:'m_'+hs.ALPHA[(i+n-2)%n+1],
          latex:cs.A0597630.LABEL_TEMPLATE.replace(/U/g,hs.sub('',((i+n-2)%n+1))).replace(/Z/g,hs.sub('',0)).replace(/W/g,hs.ALPHA[(i+n-2)%n+1]).replace(/Q/g,'P').replace(/S/g,hs.ALPHA[(i+n-3)%n+1]).replace(/P_{label/g,hs.ALPHA[(i+n-2)%n+1]+'_{label')
        });
        o.desmos.setExpression({
          id:'m_'+hs.ALPHA[i%n+1],
          latex:cs.A0597630.LABEL_TEMPLATE.replace(/U/g,hs.sub('',i%n+1)).replace(/Z/g,hs.sub('',(i+1)%n+1)).replace(/W/g,hs.ALPHA[i%n+1]).replace(/Q/g,hs.ALPHA[(i+1)%n+1]).replace(/S/g,'P').replace(/P_{label/g,hs.ALPHA[i%n+1]+'_{label')
        });

        // Attach the vertex to its edges and diagonals
        if (i == 1) {
          // Attach placeholder to B
          o.desmos.setExpression({
            id:'segment_AB',
            latex:cons.SEGMENT_TEMPLATE.replace(/U/g,'0').replace(/V/g,'2')
          });
          // Attach every other vertex to placeholder
          for (var j = 3;j<=n;j++) {
            o.desmos.setExpression({
              id:'segment_'+hs.ALPHA[j]+'A',
              latex:cons.SEGMENT_TEMPLATE.replace(/([xy])_U/g,hs.sub('$1',j)).replace(/V/g,'0')
            });
          }
        } else {
          if (i == 2) {
            o.desmos.setExpression({
              id:'segment_AB',
              latex:cons.SEGMENT_TEMPLATE.replace(/U/g,'0').replace(/V/g,'1')
            });
          } else {
            // attach to previous vertex
            o.desmos.setExpression({
              id:'segment_'+hs.ALPHA[i-1]+hs.ALPHA[i],
              latex:cons.SEGMENT_TEMPLATE.replace(/([xy])_U/g,hs.sub('$1',i-1)).replace(/V/g,'0')
            });
            // attach diagonal to A
            if (2 < i < n) o.desmos.setExpression({
                id:'segment_'+hs.ALPHA[i]+'A',
                latex:cons.SEGMENT_TEMPLATE.replace(/U/g,'0').replace(/V/g,'1')
              });
          }
          // Attach to the next vertex
          o.desmos.setExpression({
            id:'segment_'+hs.ALPHA[i]+hs.ALPHA[i%n+1],
            latex:cons.SEGMENT_TEMPLATE.replace(/U/g,'0').replace(/([xy])_V/g,hs.sub('$1',i%n+1))
          });
        }
       },
      /* ←— clearPlaceholder ————————————————————————————————————————————————→ *\
       | moves the last dragged vertex back to the placeholder vertex's location
       | 
       * ←———————————————————————————————————————————————————————————————————→ */
       clearPlaceholder: function(options={}) {
        let o = hs.parseOptions(options);
        let vars = vs[o.uniqueId];
        let hfs = vars.helperFunctions;
        let cons = cs.A0597630;
        let i = vars.placeholder;
        let n = vars.n;

        if (i == 0) return; // if it ain't broke, don't fix it

        o.log('Now clearing placeholder '+hs.ALPHA[i]);

        // Don't recorrect while clearing the placeholder
        if (hfs.correctionBuffer !== undefined) window.clearTimeout(hfs.correctionBuffer);
        vars.belayCorrection = true;

        // Move the place-held point to the placeholder
        o.desmos.setExpression({id:'x_'+i,latex:hs.sub('x',i)+'='+Math.round(vars[n]['x_'+i]*Math.pow(10,cs.precision.FLOAT_PRECISION))/Math.pow(10,cs.precision.FLOAT_PRECISION)});
        o.desmos.setExpression({id:'y_'+i,latex:hs.sub('y',i)+'='+Math.round(vars[n]['y_'+i]*Math.pow(10,cs.precision.FLOAT_PRECISION))/Math.pow(10,cs.precision.FLOAT_PRECISION)});

        // Detach the angle label from the placeholder
        o.desmos.setExpression({
            id:'m_'+hs.ALPHA[i],
            latex:cs.A0597630.LABEL_TEMPLATE.replace(/U/g,hs.sub('',i)).replace(/Z/g,hs.sub('',i%n+1)).replace(/W/g,hs.ALPHA[i]).replace(/Q/g,hs.ALPHA[(i+n-2)%n+1]).replace(/S/g,hs.ALPHA[i%n+1])
        });
        o.desmos.setExpression({
          id:'m_'+hs.ALPHA[(i+n-2)%n+1],
          latex:cs.A0597630.LABEL_TEMPLATE.replace(/U/g,hs.sub('',((i+n-2)%n+1))).replace(/Z/g,hs.sub('',i)).replace(/W/g,hs.ALPHA[(i+n-2)%n+1]).replace(/Q/g,hs.ALPHA[i]).replace(/S/g,hs.ALPHA[(i+n-3)%n+1]).replace(/P_{label/g,hs.ALPHA[(i+n-2)%n+1]+'_{label')
        });
        o.desmos.setExpression({
          id:'m_'+hs.ALPHA[i%n+1],
          latex:cs.A0597630.LABEL_TEMPLATE.replace(/U/g,hs.sub('',i%n+1)).replace(/Z/g,hs.sub('',(i+1)%n+1)).replace(/W/g,hs.ALPHA[i%n+1]).replace(/Q/g,hs.ALPHA[(i+1)%n+1]).replace(/S/g,hs.ALPHA[i]).replace(/P_{label/g,hs.ALPHA[i%n+1]+'_{label')
        });

        hfs.correctionBuffer = window.setTimeout(function(){vars.belayCorrection = false;},cs.delay.SET_EXPRESSION);

        // Make the place-held point visible, and the placeholder invisible
        o.desmos.setExpression({id:'placeholder_vertex',hidden:true,showLabel:false});
        o.desmos.setExpression({id:'vertex_'+hs.ALPHA[i],showLabel:true,color:cons.VERTEX_COLOR});

        // Attach the vertex to its edges and diagonals
        if (i == 1) {
          // Attach A to B
          o.desmos.setExpression({
            id:'segment_AB',
            latex:cons.SEGMENT_TEMPLATE.replace(/U/g,'1').replace(/V/g,'2')
          });
          // Attach A to every other vertex
          for (var j = 3;j<=n;j++) {
            o.desmos.setExpression({
              id:'segment_'+hs.ALPHA[j]+'A',
              latex:cons.SEGMENT_TEMPLATE.replace(/([xy])_U/g,hs.sub('$1',j)).replace(/V/g,'1')
            });
          }
        } else {
          if (i == 2) {
            o.desmos.setExpression({
              id:'segment_AB',
              latex:cons.SEGMENT_TEMPLATE.replace(/U/g,'1').replace(/V/g,'2')
            });
          } else {
            // attach to previous vertex
            o.desmos.setExpression({
              id:'segment_'+hs.ALPHA[i-1]+hs.ALPHA[i],
              latex:cons.SEGMENT_TEMPLATE.replace(/([xy])_U/g,hs.sub('$1',i-1)).replace(/([xy])_V/g,hs.sub('$1',i))
            });
            // attach diagonal to A
            o.desmos.setExpression({
                id:'segment_'+hs.ALPHA[i]+'A',
                latex:cons.SEGMENT_TEMPLATE.replace(/([xy])_U/g,hs.sub('$1',i)).replace(/V/g,'1')
              });
          }
          // Attach to the next vertex
          o.desmos.setExpression({
            id:'segment_'+hs.ALPHA[i]+hs.ALPHA[i%n+1],
            latex:cons.SEGMENT_TEMPLATE.replace(/([xy])_U/g,hs.sub('$1',i)).replace(/([xy])_V/g,hs.sub('$1',i%n+1))
          });
        }

        vars.placeholder = 0;
       },
      /* ←— coordinateChanged ———————————————————————————————————————————————→ *\
       | updates variables, and corrects if the user tries to cross diagonals
       * ←———————————————————————————————————————————————————————————————————→ */
       coordinateChanged: function(options={}) {
        let o = hs.parseOptions(options);
        let vars = vs[o.uniqueId];
        let cons = cs.A0597634;
        if (vars.belayCorrection === true) {
          o.log('Belaying order to correct '+o.name);
          return;
        }
        let n = vars.n;
        let i = eval(o.name.match(/[0-9]+/)[0]);
        let newPoint = {x:vars['x_'+i].numericValue,y:vars['y_'+i].numericValue};

        if (i != vars.lastDragged) {
          o.log('Now dragging n='+n+',i='+i);
          vars.lastDragged = i;

          // First, put the last dragged vertex back.
          fs.A0597630.clearPlaceholder(o);

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

          if (o.log === console.log) for (var id in vars.dragBoundaries) {
            let line = vars.dragBoundaries[id];
            o.desmos.setExpression({id:'boundary'+id,latex:'b_'+id+'\\left(x,y\\right)='+line.a+'x+'+line.b+'y+'+line.c});
          }
        };

        var constrained = hs.polygonConstrain(newPoint,vars.dragBoundaries);

        if (constrained !== null) {
          vars[n]['x_'+i] = constrained.x;
          vars[n]['y_'+i] = constrained.y;
        }

        for (var j of [(i+n-2)%n+1,i,i%n+1]) {
          var asquared = Math.pow(vars[n]['x_'+((j+n-2)%n+1)]-vars[n]['x_'+j],2)+Math.pow(vars[n]['y_'+((j+n-2)%n+1)]-vars[n]['y_'+j],2);
          var bsquared = Math.pow(vars[n]['x_'+(j%n+1)]-vars[n]['x_'+j],2)+Math.pow(vars[n]['y_'+(j%n+1)]-vars[n]['y_'+j],2);
          var csquared = Math.pow(vars[n]['x_'+((j+n-2)%n+1)]-vars[n]['x_'+(j%n+1)],2)+Math.pow(vars[n]['y_'+((j+n-2)%n+1)]-vars[n]['y_'+(j%n+1)],2);
          vars['P_'+hs.ALPHA[j]] = 180*Math.acos((asquared+bsquared-csquared)/(2*Math.sqrt(asquared*bsquared)))/Math.PI;
        }

        fs.shared.label.labelPolyAngles(Object.assign({},o,{name:'m_'+hs.ALPHA[i],value:vars['P_'+hs.ALPHA[i]]}),{},cons.ANGLE_PRECISION);

        var expr = '';
        for (var j = 1;j <= n;j++) expr+=((vars[vars.polygonName+'_angles'][hs.ALPHA[j]]/Math.pow(10,cons.ANGLE_PRECISION))+'+');
        expr = expr.slice(0,expr.length-1);
        o.desmos.setExpression({id:'sum',latex:expr});
        o.desmos.setExpression({id:'product',latex:'180\\left('+n+'-2\\right)'});

        if (constrained == newPoint) {
          fs.A0597630.clearPlaceholder(o);
        } else {
          fs.A0597630.setPlaceholder(o,i);
        };
       },
      /* ←— switchPolygon ———————————————————————————————————————————————————→ *\
       | Adds and removes vertices and edges
       | Restyles diagonals
       | Restores coordinates
       * ←———————————————————————————————————————————————————————————————————→ */
       switchPolygon: function(options={}) {
        var o = hs.parseOptions(options);
        let vars = vs[o.uniqueId];
        let hfs = vars.helperFunctions;
        let cons = cs.A0597630;
        vars.belayCorrection = true;

        fs.A0597630.clearPlaceholder(o);

        let prevn = vars.n;
        var n = vars.n = o.value;
        vars.polygonName = 'polygonABCDEFGHIJKLMNOPQRSTUVWXYZ'.slice(0,7+n);

        o.log("Changing from "+prevn+" sides to "+n+" sides");

        var exprs = [];

        // Move terminal vertex
         exprs.push({
          id:'segment_'+hs.ALPHA[prevn]+'A',
          hidden:true,
         });
         exprs.push({
          id:'m_A',
          latex:cs.A0597630.LABEL_TEMPLATE.replace(/U/g,hs.sub('',1)).replace(/Z/g,hs.sub('',2)).replace(/W/g,'A').replace(/Q/g,hs.ALPHA[n]).replace(/S/g,'B')
         });

        // Delete extra vertices
         for (var i = cons.MAX_VERTICES; i >= n+1; i--) {
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
         };

        // Add new vertices
         for (var i = 3; i <= n; i++) {
          exprs.push({
            id:'vertex_'+hs.ALPHA[i%n+1],
            hidden:false,
            showLabel:true
          });
          exprs.push({
            id:'segment_'+hs.ALPHA[i]+hs.ALPHA[i%n+1],
            hidden:false,
          });
          o.log(cs.A0597630.LABEL_TEMPLATE.replace(/U/g,hs.sub('',i)).replace(/Z/g,hs.sub('',i%n+1)).replace(/W/g,hs.ALPHA[i]).replace(/Q/g,hs.ALPHA[(i+n-2)%n+1]).replace(/S/g,hs.ALPHA[i%n+1]));
          exprs.push({
            id:'m_'+hs.ALPHA[i],
            showLabel:true,
            latex:cs.A0597630.LABEL_TEMPLATE.replace(/U/g,hs.sub('',i)).replace(/Z/g,hs.sub('',i%n+1)).replace(/W/g,hs.ALPHA[i]).replace(/Q/g,hs.ALPHA[(i+n-2)%n+1]).replace(/S/g,hs.ALPHA[i%n+1])
          });
         };

        // Update centroid and labels
         var x_centroid = 'x_{centroid}=\\frac{';
         for (i = 1; i < n; i++) x_centroid+=(hs.sub('x',i)+'+');
         x_centroid += (hs.sub('x',n)+'}{n}');
         exprs.push({
          id:'x_centroid',
          latex:x_centroid
         });
         exprs.push({
          id:'y_centroid',
          latex:x_centroid.replace(/x/g,'y')
         });
         exprs.push({
          id:'centroid',
          label:'180°⋅('+n+' − 2) = '+(180*(n-2))+'°'
         });
         exprs.push({
          id:'centroid-1',
          label:' ' // Placeholder (TK)
         });

        // o.log('Changed figures:',exprs);

        o.desmos.setExpressions(exprs);

        for (var i = 1; i <= n; i++) {
          var asquared = Math.pow(vars[n]['x_'+((i+n-2)%n+1)]-vars[n]['x_'+i],2)+Math.pow(vars[n]['y_'+((i+n-2)%n+1)]-vars[n]['y_'+i],2);
          var bsquared = Math.pow(vars[n]['x_'+(i%n+1)]-vars[n]['x_'+i],2)+Math.pow(vars[n]['y_'+(i%n+1)]-vars[n]['y_'+i],2);
          var csquared = Math.pow(vars[n]['x_'+((i+n-2)%n+1)]-vars[n]['x_'+(i%n+1)],2)+Math.pow(vars[n]['y_'+((i+n-2)%n+1)]-vars[n]['y_'+(i%n+1)],2);
          vars['P_'+hs.ALPHA[i]] = 180*Math.acos((asquared+bsquared-csquared)/(2*Math.sqrt(asquared*bsquared)))/Math.PI;
        };

        fs.shared.label.labelPolyAngles(o,{refreshAll:true},cons.ANGLE_PRECISION);

        var expr = '';
        for (var j = 1;j <= n;j++) expr+=((vars[vars.polygonName+'_angles'][hs.ALPHA[j]]/Math.pow(10,cons.ANGLE_PRECISION))+'+');
        expr = expr.slice(0,expr.length-1);
        o.desmos.setExpression({id:'sum',latex:expr});
        o.desmos.setExpression({id:'product',latex:'180\\left('+n+'-2\\right)'});

        exprs = [];

        // Update coordinates
        for (var i = 1; i <= n; i++) {
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

        if (hfs.correctionBuffer !== undefined) window.clearTimeout(hfs.correctionBuffer);

        o.desmos.setExpressions(exprs);

        hfs.correctionBuffer = window.setTimeout(function(){
          vars.belayCorrection = false;
        },cs.delay.LOAD);

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
       init: function(options={}) {
        let o = hs.parseOptions(options);
        let vars = vs[o.uniqueId] = Object.assign(((vs[o.uniqueId] === undefined)?{}:vs[o.uniqueId]),{lastDragged:0,placeholder:0});
        let hfs = vars.helperFunctions = ((vars.helperFunctions === undefined)?{n:o.desmos.HelperExpression({latex:'n'})}:vars.helperFunctions);
        o.log(hfs);
        let cons = cs.A0597634;
        cons.EXTENSION_TEMPLATE = cons.EXTENSION_TEMPLATE.replace(/W/g,cons.EXTENSION_LENGTH);

        vars.belayCorrection = true;


        // Set up watchers for each vertex of each polygon
         for(let i=1;i<=cons.MAX_VERTICES;i++) {
          if (vars[i]==undefined) {
            vars["x_"+i] = o.desmos.HelperExpression({latex:hs.sub('x',i)});
            vars["y_"+i] = o.desmos.HelperExpression({latex:hs.sub('y',i)});
            vars[i]={};
          }
         }

        // Initialize Vertices
         if (hfs.n.numericValue === undefined) {
          o.log('n not yet initialized; delaying initialization by '+cs.delay.SET_EXPRESSION+'ms');
          setTimeout(function(){fs.A0597634.init(o);},cs.delay.SET_EXPRESSION);
          return;
         } else var n = vars.n = hfs.n.numericValue;

         for(let i=1;i<=cons.MAX_VERTICES;i++) {
          if (i >= 3) for(var j=1;j<=i;j++) {
            if (i == n) {
              if (vars['x_'+j].numericValue === undefined || vars['y_'+j].numericValue === undefined) {
                o.log('Vertex '+hs.ALPHA[j]+' not yet initialized; delaying initialization by '+cs.delay.SET_EXPRESSION+'ms')
                setTimeout(function(){fs.A0597634.init(o);},cs.delay.SET_EXPRESSION);
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
          };
         };

        // Initialize angles and set observers
         vars.polygonName = 'polygonABC';
         vars.polygonABC_angles = {A:60,B:60,C:60};
         for(let i=1;i<=cons.MAX_VERTICES;i++) {
          // Set up polygon angle values for the polygon terminating in this vertex
          if (i > 3) {
            var newPoly = Object.assign({},vars[vars.polygonName+'_angles']);
            newPoly[hs.ALPHA[i]]=0;
            vars.polygonName+=hs.ALPHA[i];
            vars[vars.polygonName+'_angles'] = newPoly;
            vars[vars.polygonName+'_vertices'] = vars[i];
            o.log('Initializing '+vars.polygonName+' with angles:',vars[vars.polygonName+'_angles']);
          }
          // Set up observers for when the user drags a point
          hfs["x_"+i] = function(){fs.A0597634.coordinateChanged({
            name:hs.sub('x',i),
            value:vars['x_'+i].numericValue,
            desmos:o.desmos,
            uniqueId:o.uniqueId,
            log:o.log
          })};
          hfs['y_'+i] = function(){fs.A0597634.coordinateChanged({
            name:hs.sub('y',i),
            value:vars['y_'+i].numericValue,
            desmos:o.desmos,
            uniqueId:o.uniqueId,
            log:o.log
          })};
          vars["x_"+i].observe('numericValue.correction',hfs['x_'+i]);
          vars['y_'+i].observe('numericValue.correction',hfs['y_'+i]);
          o.log('Vertex '+hs.ALPHA[i]+' initialized at ('+vars['x_'+i].numericValue+', '+vars['y_'+i].numericValue+')');
         };
         vars.polygonName = vars.polygonName.slice(0,7+n);

         for (var i = 1; i <= n; i++) {
          var asquared = Math.pow(vars[n]['x_'+((i+n-2)%n+1)]-vars[n]['x_'+i],2)+Math.pow(vars[n]['y_'+((i+n-2)%n+1)]-vars[n]['y_'+i],2);
          var bsquared = Math.pow(vars[n]['x_'+(i%n+1)]-vars[n]['x_'+i],2)+Math.pow(vars[n]['y_'+(i%n+1)]-vars[n]['y_'+i],2);
          var csquared = Math.pow(vars[n]['x_'+((i+n-2)%n+1)]-vars[n]['x_'+(i%n+1)],2)+Math.pow(vars[n]['y_'+((i+n-2)%n+1)]-vars[n]['y_'+(i%n+1)],2);
          vars['P_'+hs.ALPHA[i]] = 180*Math.acos((asquared+bsquared-csquared)/(2*Math.sqrt(asquared*bsquared)))/Math.PI;
         };

         fs.shared.label.labelPolyAngles(o,{refreshAll:true,exterior:true},cons.ANGLE_PRECISION);

        var expr = '';
        for (var j = 1;j <= n;j++) expr+=((Math.round(180*Math.pow(10,cons.ANGLE_PRECISION)-vars[vars.polygonName+'_angles'][hs.ALPHA[j]])/Math.pow(10,cons.ANGLE_PRECISION))+'+');
        expr = expr.slice(0,expr.length-1);
        o.desmos.setExpression({id:'sum',latex:expr});

        hfs.n.observe('numericValue.switchingPolygon',function(){
          fs.A0597634.switchPolygon({
            name:'n',
            value:hfs.n.numericValue,
            desmos:o.desmos,
            uniqueId:o.uniqueId,
            log:o.log
          });
        });

        // prepare to clear placeholders
        document.addEventListener('mouseup',function(){fs.A0597634.clearPlaceholder(o);});
        document.addEventListener('touchend',function(){fs.A0597634.clearPlaceholder(o);});
      
        o.log("Observers initialized:",vars);

        hfs.correctionBuffer = window.setTimeout(function(){
          // set up the initial angles
          fs.shared.label.labelPolyAngles(o,{refreshAll:true,exterior:true},cons.ANGLE_PRECISION);

          vars.belayCorrection = false;
        },cs.delay.LOAD);
       },
      /* ←— setPlaceholder ——————————————————————————————————————————————————→ *\
       | Attaches all segments from a vertex to the placeholder vertex
       * ←———————————————————————————————————————————————————————————————————→ */
       setPlaceholder: function(options={},i) {
        let o = hs.parseOptions(options);
        let vars = vs[o.uniqueId];
        let n = vars.n;

        // move the placeholder to the location of the vertex to hold place
        o.desmos.setExpression({id:'x_0',latex:'x_0='+Math.round(vars[n]['x_'+i]*Math.pow(10,cs.precision.FLOAT_PRECISION))/Math.pow(10,cs.precision.FLOAT_PRECISION)});
        o.desmos.setExpression({id:'y_0',latex:'y_0='+Math.round(vars[n]['y_'+i]*Math.pow(10,cs.precision.FLOAT_PRECISION))/Math.pow(10,cs.precision.FLOAT_PRECISION)});

        if (i == vars.placeholder) return; // The rest of this stuff only needs to be done the first time

        o.log('Adding placeholder '+hs.ALPHA[i]);

        vars.placeholder = i;
        let cons = cs.A0597634;

        // make the placeholder visible, and the dragged vertex invisible
        o.desmos.setExpression({id:'placeholder_vertex',hidden:false,showLabel:true,label:hs.ALPHA[i],dragMode:Desmos.DragModes.NONE});
        o.desmos.setExpression({id:'vertex_'+hs.ALPHA[i],showLabel:false,color:cons.HIDDEN_COLOR});

        // Attach the angle label to the placeholder
        o.desmos.setExpression({
          id:'m_'+hs.ALPHA[i],
          latex:cs.A0597634.LABEL_TEMPLATE.replace(/U/g,hs.sub('',0)).replace(/Z/g,hs.sub('',i%n+1)).replace(/W/g,'P').replace(/Q/g,hs.ALPHA[(i+n-2)%n+1]).replace(/S/g,hs.ALPHA[i%n+1]).replace(/P_{label/g,hs.ALPHA[i]+'_{label')
        });
        o.desmos.setExpression({
          id:'m_'+hs.ALPHA[(i+n-2)%n+1],
          latex:cs.A0597634.LABEL_TEMPLATE.replace(/U/g,hs.sub('',((i+n-2)%n+1))).replace(/Z/g,hs.sub('',0)).replace(/W/g,hs.ALPHA[(i+n-2)%n+1]).replace(/Q/g,'P').replace(/S/g,hs.ALPHA[(i+n-3)%n+1]).replace(/P_{label/g,hs.ALPHA[(i+n-2)%n+1]+'_{label')
        });
        o.desmos.setExpression({
          id:'m_'+hs.ALPHA[i%n+1],
          latex:cs.A0597634.LABEL_TEMPLATE.replace(/U/g,hs.sub('',i%n+1)).replace(/Z/g,hs.sub('',(i+1)%n+1)).replace(/W/g,hs.ALPHA[i%n+1]).replace(/Q/g,hs.ALPHA[(i+1)%n+1]).replace(/S/g,'P').replace(/P_{label/g,hs.ALPHA[i%n+1]+'_{label')
        });

        // Attach the vertex to its edges and diagonals
        if (i == 1) {
          // Attach placeholder to B
          o.desmos.setExpression({
            id:'segment_AB',
            latex:cons.SEGMENT_TEMPLATE.replace(/U/g,'0').replace(/V/g,'2')
          });
          o.desmos.setExpression({
            id:'extend_AB',
            latex:cons.EXTENSION_TEMPLATE.replace(/U/g,'_2').replace(/V/g,'_0').replace(/Z/g,'B').replace(/Q/g,'P')
          });
          // Attach every other vertex to placeholder
          for (var j = 3;j<=n;j++) {
            o.desmos.setExpression({
              id:'segment_'+hs.ALPHA[j]+'A',
              latex:cons.SEGMENT_TEMPLATE.replace(/([xy])_U/g,hs.sub('$1',j)).replace(/V/g,'0')
            });
            o.desmos.setExpression({
              id:'extend_'+hs.ALPHA[j]+'A',
              latex:cons.EXTENSION_TEMPLATE.replace(/U/g,'_0').replace(/V/g,hs.sub('',j)).replace(/Z/g,'P').replace(/Q/g,hs.ALPHA[j])
            });
          }
        } else {
          if (i == 2) {
            o.desmos.setExpression({
              id:'segment_AB',
              latex:cons.SEGMENT_TEMPLATE.replace(/U/g,'0').replace(/V/g,'1')
            });
          } else {
            // attach to previous vertex
            o.desmos.setExpression({
              id:'segment_'+hs.ALPHA[i-1]+hs.ALPHA[i],
              latex:cons.SEGMENT_TEMPLATE.replace(/([xy])_U/g,hs.sub('$1',i-1)).replace(/V/g,'0')
            });
            // attach diagonal to A
            if (2 < i < n) o.desmos.setExpression({
                id:'segment_'+hs.ALPHA[i]+'A',
                latex:cons.SEGMENT_TEMPLATE.replace(/U/g,'0').replace(/V/g,'1')
              });
          }
          // Attach exterior angle
          o.desmos.setExpression({
            id:'extend_'+hs.ALPHA[i-1]+hs.ALPHA[i],
            latex:cons.EXTENSION_TEMPLATE.replace(/U/g,'_0').replace(/V/g,hs.sub('',i-1)).replace(/Z/g,'P').replace(/Q/g,hs.ALPHA[i-1])
          });
          // Attach to the next vertex
          o.desmos.setExpression({
            id:'segment_'+hs.ALPHA[i]+hs.ALPHA[i%n+1],
            latex:cons.SEGMENT_TEMPLATE.replace(/U/g,'0').replace(/([xy])_V/g,hs.sub('$1',i%n+1))
          });
          o.desmos.setExpression({
            id:'extend_'+hs.ALPHA[i]+hs.ALPHA[i%n+1],
            latex:cons.EXTENSION_TEMPLATE.replace(/U/g,hs.sub('',i%n+1)).replace(/V/g,'_0').replace(/Z/g,hs.ALPHA[i%n+1]).replace(/Q/g,'P')
          });
        }
       },
      /* ←— clearPlaceholder ————————————————————————————————————————————————→ *\
       | moves the last dragged vertex back to the placeholder vertex's location
       | 
       * ←———————————————————————————————————————————————————————————————————→ */
       clearPlaceholder: function(options={}) {
        let o = hs.parseOptions(options);
        let vars = vs[o.uniqueId];
        let hfs = vars.helperFunctions;
        let cons = cs.A0597634;
        let i = vars.placeholder;
        let n = vars.n;

        if (i == 0) return; // if it ain't broke, don't fix it

        o.log('Now clearing placeholder '+hs.ALPHA[i]);

        // Don't recorrect while clearing the placeholder
        if (hfs.correctionBuffer !== undefined) window.clearTimeout(hfs.correctionBuffer);
        vars.belayCorrection = true;

        // Move the place-held point to the placeholder
        o.desmos.setExpression({id:'x_'+i,latex:hs.sub('x',i)+'='+Math.round(vars[n]['x_'+i]*Math.pow(10,cs.precision.FLOAT_PRECISION))/Math.pow(10,cs.precision.FLOAT_PRECISION)});
        o.desmos.setExpression({id:'y_'+i,latex:hs.sub('y',i)+'='+Math.round(vars[n]['y_'+i]*Math.pow(10,cs.precision.FLOAT_PRECISION))/Math.pow(10,cs.precision.FLOAT_PRECISION)});

        // Detach the angle label from the placeholder
        o.desmos.setExpression({
            id:'m_'+hs.ALPHA[i],
            latex:cs.A0597634.LABEL_TEMPLATE.replace(/U/g,hs.sub('',i)).replace(/Z/g,hs.sub('',i%n+1)).replace(/W/g,hs.ALPHA[i]).replace(/Q/g,hs.ALPHA[(i+n-2)%n+1]).replace(/S/g,hs.ALPHA[i%n+1])
        });
        o.desmos.setExpression({
          id:'m_'+hs.ALPHA[(i+n-2)%n+1],
          latex:cs.A0597634.LABEL_TEMPLATE.replace(/U/g,hs.sub('',((i+n-2)%n+1))).replace(/Z/g,hs.sub('',i)).replace(/W/g,hs.ALPHA[(i+n-2)%n+1]).replace(/Q/g,hs.ALPHA[i]).replace(/S/g,hs.ALPHA[(i+n-3)%n+1]).replace(/P_{label/g,hs.ALPHA[(i+n-2)%n+1]+'_{label')
        });
        o.desmos.setExpression({
          id:'m_'+hs.ALPHA[i%n+1],
          latex:cs.A0597634.LABEL_TEMPLATE.replace(/U/g,hs.sub('',i%n+1)).replace(/Z/g,hs.sub('',(i+1)%n+1)).replace(/W/g,hs.ALPHA[i%n+1]).replace(/Q/g,hs.ALPHA[(i+1)%n+1]).replace(/S/g,hs.ALPHA[i]).replace(/P_{label/g,hs.ALPHA[i%n+1]+'_{label')
        });

        hfs.correctionBuffer = window.setTimeout(function(){vars.belayCorrection = false;},cs.delay.SET_EXPRESSION);

        // Make the place-held point visible, and the placeholder invisible
        o.desmos.setExpression({id:'placeholder_vertex',hidden:true,showLabel:false});
        o.desmos.setExpression({id:'vertex_'+hs.ALPHA[i],showLabel:true,color:cons.VERTEX_COLOR});

        // Attach the vertex to its edges and diagonals
        if (i == 1) {
          // Attach A to B
          o.desmos.setExpression({
            id:'segment_AB',
            latex:cons.SEGMENT_TEMPLATE.replace(/U/g,'1').replace(/V/g,'2')
          });
          o.desmos.setExpression({
            id:'extend_AB',
            latex:cons.EXTENSION_TEMPLATE.replace(/U/g,'_2').replace(/V/g,'_1').replace(/Z/g,'B').replace(/Q/g,'A')
          });
          // Attach A to every other vertex
          for (var j = 3;j<=n;j++) {
            o.desmos.setExpression({
              id:'segment_'+hs.ALPHA[j]+'A',
              latex:cons.SEGMENT_TEMPLATE.replace(/([xy])_U/g,hs.sub('$1',j)).replace(/V/g,'1')
            });
            o.desmos.setExpression({
              id:'extend_'+hs.ALPHA[j]+'A',
              latex:cons.EXTENSION_TEMPLATE.replace(/U/g,'_1').replace(/V/g,hs.sub('',j)).replace(/Z/g,'A').replace(/Q/g,hs.ALPHA[j])
            });
          }
        } else {
          if (i == 2) {
            o.desmos.setExpression({
              id:'segment_AB',
              latex:cons.SEGMENT_TEMPLATE.replace(/U/g,'1').replace(/V/g,'2')
            });
          } else {
            // attach to previous vertex
            o.desmos.setExpression({
              id:'segment_'+hs.ALPHA[i-1]+hs.ALPHA[i],
              latex:cons.SEGMENT_TEMPLATE.replace(/([xy])_U/g,hs.sub('$1',i-1)).replace(/([xy])_V/g,hs.sub('$1',i))
            });
            // attach diagonal to A
            o.desmos.setExpression({
                id:'segment_'+hs.ALPHA[i]+'A',
                latex:cons.SEGMENT_TEMPLATE.replace(/([xy])_U/g,hs.sub('$1',i)).replace(/V/g,'1')
              });
          }
          // Attach exterior angle
          o.desmos.setExpression({
            id:'extend_'+hs.ALPHA[i-1]+hs.ALPHA[i],
            latex:cons.EXTENSION_TEMPLATE.replace(/U/g,hs.sub('',i)).replace(/V/g,hs.sub('',i-1)).replace(/Z/g,hs.ALPHA[i]).replace(/Q/g,hs.ALPHA[i-1])
          });
          // Attach to the next vertex
          o.desmos.setExpression({
            id:'segment_'+hs.ALPHA[i]+hs.ALPHA[i%n+1],
            latex:cons.SEGMENT_TEMPLATE.replace(/([xy])_U/g,hs.sub('$1',i)).replace(/([xy])_V/g,hs.sub('$1',i%n+1))
          });
          o.desmos.setExpression({
            id:'extend_'+hs.ALPHA[i]+hs.ALPHA[i%n+1],
            latex:cons.EXTENSION_TEMPLATE.replace(/U/g,hs.sub('',i%n+1)).replace(/V/g,hs.sub('',i)).replace(/Z/g,hs.ALPHA[i%n+1]).replace(/Q/g,hs.ALPHA[i])
          });
        }

        vars.placeholder = 0;
       },
      /* ←— coordinateChanged ———————————————————————————————————————————————→ *\
       | updates variables, and corrects if the user tries to cross diagonals
       * ←———————————————————————————————————————————————————————————————————→ */
       coordinateChanged: function(options={}) {
        let o = hs.parseOptions(options);
        let vars = vs[o.uniqueId];
        let cons = cs.A0597634;
        if (vars.belayCorrection === true) {
          o.log('Belaying order to correct '+o.name);
          return;
        }
        let n = vars.n;
        let i = eval(o.name.match(/[0-9]+/)[0]);
        let newPoint = {x:vars['x_'+i].numericValue,y:vars['y_'+i].numericValue};

        if (i != vars.lastDragged) {
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

          if (o.log === console.log) for (var id in vars.dragBoundaries) {
            let line = vars.dragBoundaries[id];
            o.desmos.setExpression({id:'boundary'+id,latex:'b_'+id+'\\left(x,y\\right)='+line.a+'x+'+line.b+'y+'+line.c});
          }
        };

        var constrained = hs.polygonConstrain(newPoint,vars.dragBoundaries);

        if (constrained !== null) {
          vars[n]['x_'+i] = constrained.x;
          vars[n]['y_'+i] = constrained.y;
        }

        for (var j of [(i+n-2)%n+1,i,i%n+1]) {
          var asquared = Math.pow(vars[n]['x_'+((j+n-2)%n+1)]-vars[n]['x_'+j],2)+Math.pow(vars[n]['y_'+((j+n-2)%n+1)]-vars[n]['y_'+j],2);
          var bsquared = Math.pow(vars[n]['x_'+(j%n+1)]-vars[n]['x_'+j],2)+Math.pow(vars[n]['y_'+(j%n+1)]-vars[n]['y_'+j],2);
          var csquared = Math.pow(vars[n]['x_'+((j+n-2)%n+1)]-vars[n]['x_'+(j%n+1)],2)+Math.pow(vars[n]['y_'+((j+n-2)%n+1)]-vars[n]['y_'+(j%n+1)],2);
          vars['P_'+hs.ALPHA[j]] = 180*Math.acos((asquared+bsquared-csquared)/(2*Math.sqrt(asquared*bsquared)))/Math.PI;
        }

        fs.shared.label.labelPolyAngles(Object.assign({},o,{name:'m_'+hs.ALPHA[i],value:vars['P_'+hs.ALPHA[i]]}),{exterior:true},cons.ANGLE_PRECISION);

        var expr = '';
        for (var j = 1;j <= n;j++) expr+=((Math.round(180*Math.pow(10,cons.ANGLE_PRECISION)-vars[vars.polygonName+'_angles'][hs.ALPHA[j]])/Math.pow(10,cons.ANGLE_PRECISION))+'+');
        expr = expr.slice(0,expr.length-1);
        o.desmos.setExpression({id:'sum',latex:expr});

        if (constrained == newPoint) {
          fs.A0597634.clearPlaceholder(o);
        } else {
          fs.A0597634.setPlaceholder(o,i);
        };
       },
      /* ←— switchPolygon ———————————————————————————————————————————————————→ *\
       | Adds and removes vertices and edges
       | Restyles diagonals
       | Restores coordinates
       * ←———————————————————————————————————————————————————————————————————→ */
       switchPolygon: function(options={}) {
        var o = hs.parseOptions(options);
        let vars = vs[o.uniqueId];
        let hfs = vars.helperFunctions;
        let cons = cs.A0597634;
        vars.belayCorrection = true;

        fs.A0597634.clearPlaceholder(o);

        let prevn = vars.n;
        var n = vars.n = o.value;
        vars.polygonName = 'polygonABCDEFGHIJKLMNOPQRSTUVWXYZ'.slice(0,7+n);

        o.log("Changing from "+prevn+" sides to "+n+" sides");

        var exprs = [];

        // Move terminal vertex
         exprs.push({
          id:'segment_'+hs.ALPHA[prevn]+'A',
          hidden:true,
         });
         exprs.push({
          id:'extend_'+hs.ALPHA[prevn]+'A',
          hidden:true,
         });
         exprs.push({
          id:'m_A',
          latex:cs.A0597634.LABEL_TEMPLATE.replace(/U/g,hs.sub('',1)).replace(/Z/g,hs.sub('',2)).replace(/W/g,'A').replace(/Q/g,hs.ALPHA[n]).replace(/S/g,'B')
         });

        // Delete extra vertices
         for (var i = cons.MAX_VERTICES; i >= n+1; i--) {
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
         };

        // Add new vertices
         for (var i = 3; i <= n; i++) {
          exprs.push({
            id:'vertex_'+hs.ALPHA[i%n+1],
            hidden:false,
            showLabel:true
          });
          exprs.push({
            id:'segment_'+hs.ALPHA[i]+hs.ALPHA[i%n+1],
            hidden:false,
          });
          exprs.push({
            id:'extend_'+hs.ALPHA[i]+hs.ALPHA[i%n+1],
            hidden:false,
          });
          o.log(cs.A0597634.LABEL_TEMPLATE.replace(/U/g,hs.sub('',i)).replace(/Z/g,hs.sub('',i%n+1)).replace(/W/g,hs.ALPHA[i]).replace(/Q/g,hs.ALPHA[(i+n-2)%n+1]).replace(/S/g,hs.ALPHA[i%n+1]));
          exprs.push({
            id:'m_'+hs.ALPHA[i],
            showLabel:true,
            latex:cs.A0597634.LABEL_TEMPLATE.replace(/U/g,hs.sub('',i)).replace(/Z/g,hs.sub('',i%n+1)).replace(/W/g,hs.ALPHA[i]).replace(/Q/g,hs.ALPHA[(i+n-2)%n+1]).replace(/S/g,hs.ALPHA[i%n+1])
          });
         };

        // Update centroid and labels
         var x_centroid = 'x_{centroid}=\\frac{';
         for (i = 1; i < n; i++) x_centroid+=(hs.sub('x',i)+'+');
         x_centroid += (hs.sub('x',n)+'}{n}');
         exprs.push({
          id:'x_centroid',
          latex:x_centroid
         });
         exprs.push({
          id:'y_centroid',
          latex:x_centroid.replace(/x/g,'y')
         });
         exprs.push({
          id:'centroid',
          label:'180°⋅('+n+' − 2) = '+(180*(n-2))+'°'
         });
         exprs.push({
          id:'centroid-1',
          label:' ' // Placeholder (TK)
         });

        // o.log('Changed figures:',exprs);

        o.desmos.setExpressions(exprs);

        for (var i = 1; i <= n; i++) {
          var asquared = Math.pow(vars[n]['x_'+((i+n-2)%n+1)]-vars[n]['x_'+i],2)+Math.pow(vars[n]['y_'+((i+n-2)%n+1)]-vars[n]['y_'+i],2);
          var bsquared = Math.pow(vars[n]['x_'+(i%n+1)]-vars[n]['x_'+i],2)+Math.pow(vars[n]['y_'+(i%n+1)]-vars[n]['y_'+i],2);
          var csquared = Math.pow(vars[n]['x_'+((i+n-2)%n+1)]-vars[n]['x_'+(i%n+1)],2)+Math.pow(vars[n]['y_'+((i+n-2)%n+1)]-vars[n]['y_'+(i%n+1)],2);
          vars['P_'+hs.ALPHA[i]] = 180*Math.acos((asquared+bsquared-csquared)/(2*Math.sqrt(asquared*bsquared)))/Math.PI;
        };

        fs.shared.label.labelPolyAngles(o,{refreshAll:true,exterior:true},cons.ANGLE_PRECISION);

        var expr = '';
        for (var j = 1;j <= n;j++) expr+=((Math.round(180*Math.pow(10,cons.ANGLE_PRECISION)-vars[vars.polygonName+'_angles'][hs.ALPHA[j]])/Math.pow(10,cons.ANGLE_PRECISION))+'+');
        expr = expr.slice(0,expr.length-1);
        o.desmos.setExpression({id:'sum',latex:expr});

        exprs = [];

        // Update coordinates
        for (var i = 1; i <= n; i++) {
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

        if (hfs.correctionBuffer !== undefined) window.clearTimeout(hfs.correctionBuffer);

        o.desmos.setExpressions(exprs);

        hfs.correctionBuffer = window.setTimeout(function(){
          vars.belayCorrection = false;
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
       init: function(options={}) {
        let o = hs.parseOptions(options);
        let vars = vs[o.uniqueId] = (vs[o.uniqueId] || {draggingPoint:null,dragging:false});
        let hxs = vars.helperExpressions = {};
        vars.belayUntil = Date.now()+cs.delay.LOAD;

        Object.assign(hxs,{
          u_0:o.desmos.HelperExpression({latex:'u_0'}),
          v_0:o.desmos.HelperExpression({latex:'v_0'}),
          u_1:o.desmos.HelperExpression({latex:'u_1'}),
          v_1:o.desmos.HelperExpression({latex:'v_1'}),
          u_2:o.desmos.HelperExpression({latex:'u_2'}),
          v_2:o.desmos.HelperExpression({latex:'v_2'}),
          u_3:o.desmos.HelperExpression({latex:'u_3'}),
          v_3:o.desmos.HelperExpression({latex:'v_3'}),
          w_2:o.desmos.HelperExpression({latex:'w_2'}),
          z_2:o.desmos.HelperExpression({latex:'z_2'}),
          w_3:o.desmos.HelperExpression({latex:'w_3'}),
          z_3:o.desmos.HelperExpression({latex:'z_3'}),
          R:o.desmos.HelperExpression({latex:'R'}),
          m1_x:o.desmos.HelperExpression({latex:'P_{MC1}\\left[1\\right]'}),
          m1_y:o.desmos.HelperExpression({latex:'P_{MC1}\\left[2\\right]'}),
          m2_x:o.desmos.HelperExpression({latex:'P_{MC2}\\left[1\\right]'}),
          m2_y:o.desmos.HelperExpression({latex:'P_{MC2}\\left[2\\right]'}),
          n1_x:o.desmos.HelperExpression({latex:'P_{NC1}\\left[1\\right]'}),
          n1_y:o.desmos.HelperExpression({latex:'P_{NC1}\\left[2\\right]'}),
          n2_x:o.desmos.HelperExpression({latex:'P_{NC2}\\left[1\\right]'}),
          n2_y:o.desmos.HelperExpression({latex:'P_{NC2}\\left[2\\right]'}),
          D:o.desmos.HelperExpression({latex:'D'}),
          i_nv:o.desmos.HelperExpression({latex:'i_{nv}'}),
          t_ick:o.desmos.HelperExpression({latex:'t_{ick}'})
        });

        function isolateHandle(which) {
          // o.log('Isolating Handles');
          for (helper in hxs) hxs[helper].unobserve('numericValue.dragging');
          vars.dragging = true;
          var exprs = [
            {id:'intersection',hidden:(which[2]!='1')},
            {id:'handleM1',hidden:(!(/[uv]_2/.test(which)))},
            {id:'handleM2',hidden:(!(/[wz]_2/.test(which)))},
            {id:'handleN1',hidden:(!(/[uv]_3/.test(which)))},
            {id:'handleN2',hidden:(!(/[wz]_3/.test(which)))}//*/
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
              if (/[uv]/.test(which)) {
                vars.draggingPoint = 'handleM1';
                exprs.push({id:'x_2',latex:'x_2=u_2'});
                exprs.push({id:'y_2',latex:'y_2=v_2'});
              } else {
                vars.draggingPoint = 'handleM2';
                exprs.push({id:'x_2',latex:'x_2=-w_2'});
                exprs.push({id:'y_2',latex:'y_2=-z_2'});
              };
              break;
            case '3':
              if (/[uv]/.test(which)) {
                vars.draggingPoint = 'handleN1';
                exprs.push({id:'x_3',latex:'x_3=u_3'});
                exprs.push({id:'y_3',latex:'y_3=v_3'});
              } else {
                vars.draggingPoint = 'handleN2';
                exprs.push({id:'x_3',latex:'x_3=-w_3'});
                exprs.push({id:'y_3',latex:'y_3=-z_3'});
              };
              break;
            default:
              return;
          }
          o.desmos.setExpressions(exprs);
        }

        function adjustHandles() {
          // o.log('Adjusting Handles');
          if (Date.now() <= vars.belayUntil) {setTimeout(adjustHandles,vars.belayUntil-Date.now()+1);return;}

          vars.belayUntil = Date.now()+cs.delay.EXECUTE_HELPER;

          var exprs = [
            {id:'u_2',latex:'u_2='+hs.number(hxs.m1_x.numericValue-hxs.u_1.numericValue)},
            {id:'v_2',latex:'v_2='+hs.number(hxs.m1_y.numericValue-hxs.v_1.numericValue)},
            {id:'w_2',latex:'w_2='+hs.number(hxs.m2_x.numericValue-hxs.u_1.numericValue)},
            {id:'z_2',latex:'z_2='+hs.number(hxs.m2_y.numericValue-hxs.v_1.numericValue)},
            {id:'u_3',latex:'u_3='+hs.number(hxs.n1_x.numericValue-hxs.u_1.numericValue)},
            {id:'v_3',latex:'v_3='+hs.number(hxs.n1_y.numericValue-hxs.v_1.numericValue)},
            {id:'w_3',latex:'w_3='+hs.number(hxs.n2_x.numericValue-hxs.u_1.numericValue)},
            {id:'z_3',latex:'z_3='+hs.number(hxs.n2_y.numericValue-hxs.v_1.numericValue)}
          ];
          o.desmos.setExpressions(exprs);

          vars.belayUntil = Date.now()+cs.delay.SET_EXPRESSION;
          setTimeout(activateHandles,cs.delay.SET_EXPRESSION);
        }

        function replaceHandles() {
          // o.log('Replacing Handles');
          o.log('Placeholder = '+vars.placeholder);
          if (vars.placeholder !== undefined) clearPlaceholder();

          adjustHandles();

          var exprs = [
            {id:'x_0',latex:'x_0=u_0'},
            {id:'y_0',latex:'y_0=v_0'},
            {id:'x_1',latex:'x_1=u_1'},
            {id:'y_1',latex:'y_1=v_1'}
          ];

          var intersection = {x:hxs.u_1.numericValue,y:hxs.v_1.numericValue};
          if (Math.pow(hxs.m1_x.numericValue-intersection.x,2)+
            Math.pow(hxs.m1_y.numericValue-intersection.y,2) > 
            Math.pow(hxs.m2_x.numericValue-intersection.x,2) +
            Math.pow(hxs.m2_y.numericValue-intersection.y,2)) {
            exprs.push({id:'x_2',latex:'x_2=u_2'});
            exprs.push({id:'y_2',latex:'y_2=v_2'});
          } else {
            exprs.push({id:'x_2',latex:'x_2=-w_2'});
            exprs.push({id:'y_2',latex:'y_2=-z_2'});
          }
          if (Math.pow(hxs.n1_x.numericValue-intersection.x,2)+
            Math.pow(hxs.n1_y.numericValue-intersection.y,2) > 
            Math.pow(hxs.n2_x.numericValue-intersection.x,2) +
            Math.pow(hxs.n2_y.numericValue-intersection.y,2)) {
            exprs.push({id:'x_3',latex:'x_3=u_3'});
            exprs.push({id:'y_3',latex:'y_3=v_3'});
          } else {
            exprs.push({id:'x_3',latex:'x_3=-w_3'});
            exprs.push({id:'y_3',latex:'y_3=-z_3'});
          }

          o.desmos.setExpressions(exprs);

          setTimeout(adjustHandles,cs.delay.SET_EXPRESSION);
        }

        function activateHandles() {
          // o.log('Activating Handles');
          delete vars.constrainingCircle;

          o.desmos.setExpressions([
            {id:'center',hidden:false},
            {id:'intersection',hidden:false},
            {id:'handleM1',hidden:(Math.pow(hxs.m1_x.numericValue-hxs.u_1.numericValue,2)+Math.pow(hxs.m1_y.numericValue-hxs.v_1.numericValue,2)<Math.pow(hxs.t_ick.numericValue,2))},
            {id:'handleM2',hidden:(Math.pow(hxs.m2_x.numericValue-hxs.u_1.numericValue,2)+Math.pow(hxs.m2_y.numericValue-hxs.v_1.numericValue,2)<Math.pow(hxs.t_ick.numericValue,2))},
            {id:'handleN1',hidden:(Math.pow(hxs.n1_x.numericValue-hxs.u_1.numericValue,2)+Math.pow(hxs.n1_y.numericValue-hxs.v_1.numericValue,2)<Math.pow(hxs.t_ick.numericValue,2))},
            {id:'handleN2',hidden:(Math.pow(hxs.n2_x.numericValue-hxs.u_1.numericValue,2)+Math.pow(hxs.n2_y.numericValue-hxs.v_1.numericValue,2)<Math.pow(hxs.t_ick.numericValue,2))}
          ]);

          for (let helper in hxs) {
            if (/[uvwz]_/.test(helper)) hxs[helper].observe(
              'numericValue.dragging',
              function(){if(vars.dragging)isolateHandle(helper);}
            );
          }
        }

        function logChanges() {
          hxs.u_0.observe('numericValue.log',function(){o.log('center.u:'+hxs.u_0.numericValue);});
          hxs.v_0.observe('numericValue.log',function(){o.log('center.v:'+hxs.v_0.numericValue);});
          hxs.u_1.observe('numericValue.log',function(){o.log('intersection.u:'+hxs.u_1.numericValue);});
          hxs.v_1.observe('numericValue.log',function(){o.log('intersection.v:'+hxs.v_1.numericValue);});
        }

        function enableCorrection() {
          hxs.D.observe('numericValue.correction',function(){correctIt();});
        }

        function disableCorrection() {
          hxs.D.unobserve('numericValue.correction');
        }

        function clearPlaceholder(draggingPoint=vars.draggingPoint) {
          // o.log('Clearing Placeholder');
          if (vars.placeholder === undefined) return;
          vars.belayUntil = Date.now() + cs.delay.EXECUTE_HELPER;

          var exprs = [];
          var corrected;

          switch (draggingPoint) {
            case 'center':
              var center = {x:hxs.u_0.numericValue,y:hxs.v_0.numericValue};
              corrected = hs.circleConstrain(center,vars.constrainingCircle,cs.enum.INTERIOR);
              exprs.push({id:'center',color:cs.A0597772.CENTER_COLOR});
              break;
            case 'intersection':
              var intersection = {x:hxs.u_1.numericValue,y:hxs.v_1.numericValue};
              corrected = hs.circleConstrain(intersection,vars.constrainingCircle,cs.enum.INTERIOR);
              exprs.push({id:'intersection',color:cs.A0597772.INTERSECTION_COLOR});
              break;
            default:
              return;
          }

          // o.log('Center: ('+hxs.u_0.numericValue+','+hxs.v_0.numericValue+')');
          // o.log('Intersection: ('+hxs.u_1.numericValue+','+hxs.v_1.numericValue+')');
          // o.log('Constraint: ('+vars.constrainingCircle.x+','+vars.constrainingCircle.y+','+vars.constrainingCircle.r+')');
          // o.log('Distance: '+Math.sqrt(Math.pow(hxs.u_0.numericValue-hxs.u_1.numericValue,2)+Math.pow(hxs.v_0.numericValue-hxs.v_1.numericValue,2)));
          // o.log('Corrected: ('+corrected.x+','+corrected.y+')')

          exprs.push({id:'placeholder',hidden:true});

          exprs.push({id:'u_'+vars.placeholder,latex:'u_'+vars.placeholder+'='+corrected.x});
          exprs.push({id:'v_'+vars.placeholder,latex:'v_'+vars.placeholder+'='+corrected.y});

          disableCorrection();
          o.desmos.setExpressions(exprs);
          delete vars.placeholder;
          setTimeout(enableCorrection,5*cs.delay.SET_EXPRESSION);
          vars.belayUntil = Date.now() + cs.delay.SET_EXPRESSION;
         }

        function setPlaceholder(draggingPoint=vars.draggingPoint) {
          // o.log('Setting Placeholder');
          exprs = [];
          if (vars.placeholder === undefined) {
            vars.placeholder = ((draggingPoint == 'center')?0:1);
            exprs.push({id:draggingPoint,color:cs.A0597772.HIDDEN_COLOR});
            exprs.push({
              id:'placeholder',
              latex:'\\left(x_#,y_#\\right)'.replace(/#/g,vars.placeholder),
              hidden:false,
              dragMode:Desmos.DragModes.XY
            });
          } else return;
          o.desmos.setExpressions(exprs);
         }

        function correctIt(draggingPoint=vars.draggingPoint) {
          o.log('Correcting It; dragging point = '+draggingPoint);
          switch (draggingPoint) {
            case 'center':
              if (hxs.D.numericValue < hxs.R.numericValue-cs.distance.CONSTRAIN_BUFFER) {
                if (vars.placeholder !== undefined) clearPlaceholder();
                return;
              }
              if (vars.constrainingCircle === undefined) vars.constrainingCircle = {x:hxs.u_1.numericValue,y:hxs.v_1.numericValue,r:hxs.R.numericValue};
              if (vars.dragging === true) setPlaceholder(draggingPoint);
              else {
                var point = {x:hxs.u_0.numericValue,y:hxs.v_0.numericValue};
                var corrected = hs.circleConstrain(point,vars.constrainingCircle,cs.enum.INTERIOR);
                if (corrected != point) {
                  o.desmos.setExpressions([
                    {id:'u_0',latex:'u_0='+corrected.x},
                    {id:'v_0',latex:'v_0='+corrected.y}
                  ]);
                  setTimeout(adjustHandles,cs.delay.SET_EXPRESSION);
                }
              }
              break;
            case 'intersection':
              if (hxs.D.numericValue < hxs.R.numericValue-cs.distance.CONSTRAIN_BUFFER) {
                if (vars.placeholder !== undefined) clearPlaceholder();
                return;
              }
              if (vars.constrainingCircle === undefined) vars.constrainingCircle = {x:hxs.u_0.numericValue,y:hxs.v_0.numericValue,r:hxs.R.numericValue};
              if (vars.dragging === true) setPlaceholder(draggingPoint);
              else {
                var point = {x:hxs.u_1.numericValue,y:hxs.v_1.numericValue};
                var corrected = hs.circleConstrain(point,vars.constrainingCircle,cs.enum.INTERIOR);
                if (corrected != point) {
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
         }

        // prepare to clear placeholders
        document.addEventListener('mousedown',function(){vars.dragging=true;});
        document.addEventListener('touchstart',function(){vars.dragging=true;});
        document.addEventListener('mouseup',function(){setTimeout(function(){vars.dragging=false;replaceHandles();},cs.delay.LOAD)});
        document.addEventListener('touchend',function(){setTimeout(function(){vars.dragging=false;replaceHandles();},cs.delay.LOAD)});

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
        LEG_HANDLE:'\\theta_LEGNUM=SIGN\\operatorname{sign}\\left(D_{pl}\\left(\\left[u_{HLEGNUMPOINTID},v_{HLEGNUMPOINTID},1\\right],U_{through}\\left(\\left[0,0,1\\right],\\left[x_V,y_V,1\\right]\\right)\\right)\\right)\\min\\left(\\arcsin\\left(\\frac{r_C}{d}\\right),\\theta_{LVL}\\left(H_{LEGNUMPOINTID},V,C\\right)\\right)',
        VERTEX_COORDINATE:'COORDINATE_V=COORDINATE_C+HANDLE_V\\max\\left(\\frac{r_C\\left(1+10^{-10}\\right)}{D},\\min\\left(1,\\frac{R}{D}\\right)\\right)',
        R_DEPENDENT_ON_THETAS:'R=\\left\\{\\theta_1=0:\\left\\{\\theta_2=0:10^{100}r_C,R_2\\right\\},\\theta_2=0:R_1,\\min\\left(R_1,R_2\\right)\\right\\}',
        THETAS_DEPENDENT_ON_D:'\\theta_LEGNUM=SIGN\\min\\left(PREVMEASURE,\\arcsin\\left(\\frac{r_C}{d}\\right)\\right)'
       };
     fs.A0597773 = {
      /* ←— circleConstrain ———————————————————————————————————————————————→ *\
       | Monitors x_1 and y_1 and corrects them if they go outside the circle
       |  centered at x_0, y_0 with radius r_0
       | (Initialization option; starts the whole graph)
       * ←—————————————————————————————————————————————————————————————————→ */
       init: function(options={}) {
        let o = hs.parseOptions(options);
        let vars = vs[o.uniqueId] = (vs[o.uniqueId] || {draggingPoint:null,dragging:false});
        let hxs = vars.helperExpressions = {};
        let cons = cs.A0597773;
        vars.belayUntil = Date.now()+cs.delay.LOAD;

        Object.assign(hxs,{
          x_C:o.desmos.HelperExpression({latex:'x_C'}),
          y_C:o.desmos.HelperExpression({latex:'y_C'}),
          x_V:o.desmos.HelperExpression({latex:'x_V'}),
          y_V:o.desmos.HelperExpression({latex:'y_V'}),
          u_V:o.desmos.HelperExpression({latex:'u_V'}),
          v_V:o.desmos.HelperExpression({latex:'v_V'}),
          u_H1near:o.desmos.HelperExpression({latex:'u_{H1near}'}),
          v_H1near:o.desmos.HelperExpression({latex:'v_{H1near}'}),
          u_H1far:o.desmos.HelperExpression({latex:'u_{H1far}'}),
          v_H1far:o.desmos.HelperExpression({latex:'v_{H1far}'}),
          u_H2near:o.desmos.HelperExpression({latex:'u_{H2near}'}),
          v_H2near:o.desmos.HelperExpression({latex:'v_{H2near}'}),
          u_H2far:o.desmos.HelperExpression({latex:'u_{H2far}'}),
          v_H2far:o.desmos.HelperExpression({latex:'v_{H2far}'}),

          r_C:o.desmos.HelperExpression({latex:'r_C'}),
          R:o.desmos.HelperExpression({latex:'R'}),
          theta_1:o.desmos.HelperExpression({latex:'\\theta_1'}),
          theta_2:o.desmos.HelperExpression({latex:'\\theta_2'}),

          theta_VC:o.desmos.HelperExpression({latex:'\\theta_{VC}'}),
          theta_1near:o.desmos.HelperExpression({latex:'\\theta_{1near}'}),
          theta_1far:o.desmos.HelperExpression({latex:'\\theta_{1far}'}),
          theta_2near:o.desmos.HelperExpression({latex:'\\theta_{2near}'}),
          theta_2far:o.desmos.HelperExpression({latex:'\\theta_{2far}'}),

          arc_near:o.desmos.HelperExpression({latex:'\\theta_{arc}\\left[1\\right]'}),
          arc_far:o.desmos.HelperExpression({latex:'\\theta_{arc}\\left[2\\right]'}),
          angle:o.desmos.HelperExpression({latex:'\\operatorname{round}\\left(\\left|\\theta_1+\\theta_2\\right|\\right)'}),

          t_ick:o.desmos.HelperExpression({latex:'t_{ick}'})
        });

        function isolateHandle(which) {
          // o.log('Isolating Handles');
          for (helper in hxs) hxs[helper].unobserve('numericValue.dragging');

          // o.log(which+' changed.');


          vars.dragging = true;
          var exprs = [
            {id:'vertex_handle',hidden:(which[2]!='V')},
            {id:'H1near',hidden:(!(/H1near/.test(which)))},
            {id:'H1far',hidden:(!(/H1far/.test(which)))},
            {id:'H2near',hidden:(!(/H2near/.test(which)))},
            {id:'H2far',hidden:(!(/H2far/.test(which)))}//*/
          ];

          if (which[2]=='H') {
            exprs.push({id:('theta_'+which[3]),latex:(cons.LEG_HANDLE.replace(/LEGNUM/g,which[3]).replace(/POINTID/g,which.substring(4,which.length)).replace(/SIGN/,((which[3]==1)?'-':'')))});
            exprs.push({id:'x_V',latex:'x_V=x_C+u_V'});
            exprs.push({id:'y_V',latex:'y_V=y_C+v_V'});
            vars.draggingPoint = which.substring(2,which.length);
          } else if (/[uv]_V/.test(which)) {
            exprs.push({id:'x_V',latex:(cons.VERTEX_COORDINATE.replace(/COORDINATE/g,'x').replace(/HANDLE/g,'u'))});
            exprs.push({id:'y_V',latex:(cons.VERTEX_COORDINATE.replace(/COORDINATE/g,'y').replace(/HANDLE/g,'v'))});
            exprs.push({id:'maximumDistance',latex:'R=10^{100}r_C'});
            exprs.push({id:'theta_1',latex:cons.THETAS_DEPENDENT_ON_D.replace(/LEGNUM/g,'1').replace(/SIGN/g,((hxs.theta_1.numericValue>=0)?'':'-')).replace(/PREVMEASURE/g,''+Math.abs(hxs.theta_1.numericValue))});
            exprs.push({id:'theta_2',latex:cons.THETAS_DEPENDENT_ON_D.replace(/LEGNUM/g,'2').replace(/SIGN/g,((hxs.theta_2.numericValue>=0)?'':'-')).replace(/PREVMEASURE/g,''+Math.abs(hxs.theta_2.numericValue))});
            vars.draggingPoint = 'vertex_handle';
          } else if (/[xy]_C/.test(which)) {
            vars.draggingPoint = 'center';
          } else if (which == 'r_C') {
            exprs.push({id:'u_V',latex:('u_V=\\frac{r_C}{'+vars.lastRadius+'}\\cdot'+hxs.u_V.numericValue)});
            exprs.push({id:'v_V',latex:('v_V=\\frac{r_C}{'+vars.lastRadius+'}\\cdot'+hxs.v_V.numericValue)});
            vars.draggingPoint = 'radius';
          }

          // o.log('Isolating handle '+which+'; setting expressions:',exprs);

          o.desmos.setExpressions(exprs);
        }

        function adjustHandles() {
          // o.log('Adjusting Handles');
          if (Date.now() <= vars.belayUntil) {setTimeout(adjustHandles,vars.belayUntil-Date.now()+1);return;}

          vars.belayUntil = Date.now()+cs.delay.EXECUTE_HELPER;

          // o.log('x_C='+hxs.x_C.numericValue,'; y_C='+hxs.r_C.numericValue,'; theta_VC='+hxs.theta_VC.numericValue,'; theta_1near='+hxs.theta_1near.numericValue);

          var exprs = [
            {id:'u_H1near',latex:'u_{H1near}='+hs.number(hxs.r_C.numericValue*Math.cos(Math.PI*(1+(hxs.theta_VC.numericValue+hxs.theta_1near.numericValue)/180)))},
            {id:'v_H1near',latex:'v_{H1near}='+hs.number(hxs.r_C.numericValue*Math.sin(Math.PI*(1+(hxs.theta_VC.numericValue+hxs.theta_1near.numericValue)/180)))},
            {id:'u_H1far',latex:'u_{H1far}='+hs.number(hxs.r_C.numericValue*Math.cos(Math.PI*(1+(hxs.theta_VC.numericValue+hxs.theta_1far.numericValue)/180)))},
            {id:'v_H1far',latex:'v_{H1far}='+hs.number(hxs.r_C.numericValue*Math.sin(Math.PI*(1+(hxs.theta_VC.numericValue+hxs.theta_1far.numericValue)/180)))},
            {id:'u_H2near',latex:'u_{H2near}='+hs.number(hxs.r_C.numericValue*Math.cos(Math.PI*(1+(hxs.theta_VC.numericValue-hxs.theta_2near.numericValue)/180)))},
            {id:'v_H2near',latex:'v_{H2near}='+hs.number(hxs.r_C.numericValue*Math.sin(Math.PI*(1+(hxs.theta_VC.numericValue-hxs.theta_2near.numericValue)/180)))},
            {id:'u_H2far',latex:'u_{H2far}='+hs.number(hxs.r_C.numericValue*Math.cos(Math.PI*(1+(hxs.theta_VC.numericValue-hxs.theta_2far.numericValue)/180)))},
            {id:'v_H2far',latex:'v_{H2far}='+hs.number(hxs.r_C.numericValue*Math.sin(Math.PI*(1+(hxs.theta_VC.numericValue-hxs.theta_2far.numericValue)/180)))}/*,
            {id:'x_V',latex:(cons.VERTEX_COORDINATE.replace(/COORDINATE/g,'x').replace(/HANDLE/g,'u')},
            {id:'y_V',latex:(cons.VERTEX_COORDINATE.replace(/COORDINATE/g,'y').replace(/HANDLE/g,'v')}//*/
          ];

          o.log('Adjusting handles');// setting expressions:',exprs);

          o.desmos.setExpressions(exprs);

          vars.belayUntil = Date.now()+cs.delay.SET_EXPRESSION;
          setTimeout(activateHandles,cs.delay.SET_EXPRESSION);
        }

        function replaceHandles() {
          // o.log('Replacing Handles');

          // adjustHandles();

          // o.log(hxs.x_V.latex+'='+hxs.x_V.numericValue,hxs.x_C.latex+'='+hxs.x_C.numericValue,hxs.y_V.latex+'='+hxs.y_V.numericValue,hxs.y_C.latex+'='+hxs.y_C.numericValue);

          var exprs = [
            {id:'u_V',latex:('u_V='+hs.number(hxs.x_V.numericValue-hxs.x_C.numericValue))},
            {id:'v_V',latex:('v_V='+hs.number(hxs.y_V.numericValue-hxs.y_C.numericValue))},
            {id:'theta_1',latex:('\\theta_1='+hxs.theta_1.numericValue)},
            {id:'theta_2',latex:('\\theta_2='+hxs.theta_2.numericValue)},
            {id:'maximumDistance',latex:cons.R_DEPENDENT_ON_THETAS}
          ];

          // STUB TK place handles

          // o.log('Replacing handles; setting expressions:',exprs);

          o.desmos.setExpressions(exprs);

          setTimeout(adjustHandles,cs.delay.SET_EXPRESSION);
          // setTimeout(activateHandles,cs.delay.SET_EXPRESSION*2);
        }

        function activateHandles() {
          // o.log('Activating Handles');

          vars.lastRadius = hxs.r_C.numericValue;

          var exprs=[
            {id:'center',hidden:false},
            {id:'vertex_handle',hidden:false},
            {id:'H1near',hidden:false}, // TK STUB hide handles that crash with each other
            {id:'H1far',hidden:false},
            {id:'H2near',hidden:false}, // TK
            {id:'H2far',hidden:false}
          ];

          // o.log('Activating handles; setting expressions:',exprs);

          o.desmos.setExpressions(exprs);

          for (let helper in hxs) {
            if (/(?:[uv]_|_C)/.test(helper)) {
              // o.log('Observing '+helper);
              hxs[helper].observe(
                'numericValue.dragging',
                function(){if(vars.dragging)isolateHandle(helper);}
              );
            }
          }
        }

        function updateEquation() {
          var expr = hxs.angle.numericValue+'°=½('+hxs.arc_far.numericValue+'°-'+hxs.arc_near.numericValue+'°)';
          expr = hs.latexToText(expr);
          o.desmos.setExpression({id:'center',label:expr});
        }

        function logChanges() {
        }

        function click() {
          vars.dragging=true;
          //document.removeEventListener('mousedown',click);
          //document.removeEventListener('touchstart',click);
        }

        function unclick() {
          vars.dragging=false;
          //document.removeEventListener('mouseup',unclick);
          //document.removeEventListener('touchend',unclick);
          setTimeout(replaceHandles,cs.delay.LOAD);
        }

        document.addEventListener('mousedown',click);
        document.addEventListener('touchstart',click);
        document.addEventListener('mouseup',unclick);
        document.addEventListener('touchend',unclick);

        setTimeout(function(){
          activateHandles();
          hxs.angle.observe('numericValue',updateEquation);
          hxs.arc_far.observe('numericValue',updateEquation);
          hxs.arc_near.observe('numericValue',updateEquation);
          updateEquation();
          // logChanges();
        },cs.delay.LOAD);
       }
     };

    /* ←— TESTING_TESTING_123 FUNCTIONS ——————————————————————————————————————————————→ */
     fs.TESTING_TESTING_123 = {
      /* ←— circleConstrain ———————————————————————————————————————————————→ *\
       | Monitors x_1 and y_1 and corrects them if they go outside the circle
       |  centered at x_0, y_0 with radius r_0
       | (Initialization option; starts the whole graph)
       * ←—————————————————————————————————————————————————————————————————→ */
       circleConstrain: function(options={}) {
        let o = hs.parseOptions(options);
        let vars = vs[o.uniqueId] = (vs[o.uniqueId] || {});
        let hxs = vars.helperExpressions = {};
        vars.belayUntil = Date.now()+cs.delay.LOAD;

        o.desmos.setExpressions([
          {id:'circle',latex:'\\left(x-x_0\\right)^2+\\left(y-y_0\\right)^2=r_0^2'},
          {id:'center',latex:'\\left(x_0,y_0\\right)'},
          {id:'draggable',latex:'\\left(x_1,y_1\\right)'},
          {id:'adjusted',latex:'\\left(x_{adjusted},y_{adjusted}\\right)',hidden:true,dragMode:"NONE"},
          {id:'x_0',latex:'x_0=0'},
          {id:'y_0',latex:'y_0=0'},
          {id:'r_0',latex:'r_0=1'},
          {id:'x_1',latex:'x_1=0.5'},
          {id:'y_1',latex:'y_1=0.5'},
          {id:'x_adjusted',latex:'x_{adjusted}=x_1'},
          {id:'y_adjusted',latex:'y_{adjusted}=y_1'}
        ]);

        Object.assign(hxs,{
          x_0:o.desmos.HelperExpression({latex:'x_0'}),
          y_0:o.desmos.HelperExpression({latex:'y_0'}),
          r_0:o.desmos.HelperExpression({latex:'r_0'}),
          x_1:o.desmos.HelperExpression({latex:'x_1'}),
          y_1:o.desmos.HelperExpression({latex:'y_1'})
        });

        function clearPlaceholder() {
          vars.belayUntil = Date.now() + cs.delay.SET_EXPRESSION;
          var corrected = hs.circleConstrain(
            {x:hxs.x_1.numericValue,y:hxs.y_1.numericValue},
            {x:hxs.x_0.numericValue,y:hxs.y_0.numericValue,r:hxs.r_0.numericValue},
            cs.enum.EXTERIOR
          );
          o.desmos.setExpressions([
            {id:'x_1',latex:'x_1='+corrected.x},
            {id:'y_1',latex:'y_1='+corrected.y},
            {id:'x_adjusted',latex:'x_{adjusted}=x_1'},
            {id:'y_adjusted',latex:'y_{adjusted}=y_1'},
            {id:'adjusted',hidden:true},
            {id:'draggable',color:cs.color.agaColors.green}
          ]);
          setTimeout(function(){vars.placeholder = false;},cs.delay.SET_EXPRESSION);
         }

        function setPlaceholder() {
          vars.placeholder = true;
          vars.belayUntil = Date.now() + cs.delay.SET_EXPRESSION;
          o.desmos.setExpressions([
            {id:'x_adjusted',latex:'x_{adjusted}=x_0+\\left(x_1-x_0\\right)\\frac{r_0}{\\sqrt{\\left(x_1-x_0\\right)^2+\\left(y_1-y_0\\right)^2}}'},
            {id:'y_adjusted',latex:'y_{adjusted}=y_0+\\left(y_1-y_0\\right)\\frac{r_0}{\\sqrt{\\left(x_1-x_0\\right)^2+\\left(y_1-y_0\\right)^2}}'},
            {id:'adjusted',hidden:false},
            {id:'draggable',color:cs.color.HIDDEN_COLOR}
          ]);
         }

        function correctIt(coord) {
          if(coord == 'x_1' || coord == 'y_1') {
            if (vars.belayUntil > Date.now()) return;
            if (Math.pow(hxs.x_1.numericValue-hxs.x_0.numericValue,2)+Math.pow(hxs.y_1.numericValue-hxs.y_0.numericValue,2) <= Math.pow(hxs.r_0.numericValue,2)) {
              if (!(vars.placeholder)) setPlaceholder();
            } else {
              if (vars.placeholder) clearPlaceholder();
            }
          } else {
            var point = {x:hxs.x_1.numericValue,y:hxs.y_1.numericValue}
            var corrected = hs.circleConstrain(
              point,
              {x:hxs.x_0.numericValue,y:hxs.y_0.numericValue,r:hxs.r_0.numericValue},
              cs.enum.EXTERIOR
            );
            if (point != corrected) setPlaceholder();
            else clearPlaceholder();
          }
          return;
         }
        // prepare to clear placeholders
        document.addEventListener('mouseup',function(){clearPlaceholder();});
        document.addEventListener('touchend',function(){clearPlaceholder();});

        setTimeout(function(){
          clearPlaceholder();
          hxs.x_0.observe('numericValue',function(){correctIt('x_0');});
          hxs.y_0.observe('numericValue',function(){correctIt('y_0');});
          hxs.x_1.observe('numericValue',function(){correctIt('x_1');});
          hxs.y_1.observe('numericValue',function(){correctIt('y_1');});
          hxs.r_0.observe('numericValue',function(){correctIt('r_0');});
        },cs.delay.LOAD);
       }
     };

  Object.assign(exports,hs.flattenFuncStruct(fs));

  return exports;
})();
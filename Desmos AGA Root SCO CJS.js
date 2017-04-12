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
        return Object.assign({
          desmos:desmos,
          name:((options['name'] === undefined) ? '' : options['name']),
          value:((options['value'] === undefined) ? NaN : options['value']),
          uniqueId:options['uniqueId'] || ((desmos === undefined) ? 'undefinedId' : desmos['guid']),
          log:options['log'] || function(){}
        })
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
        expr = expr.replace(/\+/g,' + ');
        expr = expr.replace(/,/g,', ');
        expr = expr.replace(/\^2/g,'²');
        expr = expr.replace(/\^3/g,'³');
        expr = expr.replace(/\\theta /g,'θ');
        expr = expr.replace(/\\pi /g,'π');
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
       }
     }
  /* ←—PRIVATE CONSTANTS———————————————————————————————————————————————————→ *\
       | Constants, e.g. for tolerances or LaTeX strings.
       | Access with cs.type.NAME
       * ←—————————————————————————————————————————————————————————————————————→ */
    const cs = {
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
        SET_EXPRESSION:100 // consider a `setExpression` complete after this amount of time
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
       labelPolyAngles: function(options={},refreshAll=false,prec=cs.precision.DEGREES) {
        var o = hs.parseOptions(options);
        var v = o.name[o.name.length-1];
        var vars = vs[o.uniqueId];
        var p = vars[vars.polygonName+'_angles'];
        var vertices = vars.polygonName.slice(7,vars.polygonName.length).split('');

        function measure(x) {return ((vars.values == undefined)?undefined:Math.pow(10,prec)*vars.values['P_'+x]);}

        if (refreshAll) {
          // Sort the points by the error they produce (larger error closer to ends).
          var sorted = [];
          for (name of vertices.values()) {
            // Delay if the value hasn't been reported yet.
            if (measure(name) === undefined) {
              o.log('Angles of '+vars.polygonName+' not all defined. Delaying full refresh by '+cs.delay.SET_EXPRESSION+'ms');
              setTimeout(function(){fs.shared.label.labelPolyAngles(o,true,prec);},cs.delay.LOAD);
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
          for (name of vertices.values()) {
            var rounded = Math.round(measure(name));
            p[name] = rounded;
            apparentSum += rounded;
          }

          // Points with the largest error introduce the least error when rounded oppositely
          // So, re-round points with the largest error to get the sum you want (but each one only once)
          while (apparentSum > desiredSum && sorted.length>1) {
            var adjusting = sorted.shift();
            p[adjusting]--;
            apparentSum--;
          }
          while (apparentSum < desiredSum && sorted.length>1) {
            p[sorted.pop()]++;
            apparentSum++;
          }
          if (sorted.length>1) o.log('Something went wrong trying to fix the angle lengths. Wound up with angle sum of '+apparentSum+' out of '+desiredSum+'. With angle measures:',p);
          else for (name of vertices.values()) {
            o.desmos.setExpression({id:'m_'+name,label:''+(p[name]/Math.pow(10,prec))+'°'});
            vars.upToDate = true;
          }
          return;
         }

        if (vertices.indexOf(v) == -1) {
          o.log('Unable to label angle '+v+' of '+vars.polygonName);
          return;
        }

        if (vars.upToDate === undefined) o.log('Labeling angles of '+vars.polygonName+' to '+prec+' decimal places.');

        var prev = vertices[(vertices.indexOf[v]+vertices.length-1)%vertices.length];
        var next = vertices[(vertices.indexOf[v]+1)%vertices.length];

        var prevVal = Math.round(measure(prev));
        var val = Math.round(measure(v));
        var nextVal = Math.round(measure(next));
        
        if (isNaN(prevVal) || isNaN(nextVal) || isNaN(val)) {
          o.log('Angles of vertices '+prev+', '+v+', and '+next+' not all defined. Refreshing polygon '+vars.polygonName+' in '+cs.delay.SET_EXPRESSION+'ms');
          setTimeout(function(){hs.labelPolyAngles(o,true,prec);},cs.delay.SET_EXPRESSION);
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

          var pos = errors.indexOf(Math.max(errors));

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

          var pos = errors.indexOf(Math.min(errors));

          if (pos == 0) prevVal++;
          else if (pos == 1) val++;
          else nextVal++;

          apparentSum++;
        }

        p[prev] = prevVal;
        p[v] = val;
        p[next] = nextVal;
        o.desmos.setExpression({id:'m_'+prev,label:((prevVal/Math.pow(10,prec))+'°')});
        o.desmos.setExpression({id:'m_'+v,label:((val/Math.pow(10,prec))+'°')});
        o.desmos.setExpression({id:'m_'+next,label:((nextVal/Math.pow(10,prec))+'°')});
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
        switch (o.name) {
          case 'm_B':
            var value = vs[o.uniqueId].B = Math.round(o.value);
            o.desmos.setExpression({id:'labelB',label:''+value+'°'});
            if (0 < value < 155) o.desmos.setExpressions([
              {id:'labelX',label:''+Math.round(155-value)+'°',showLabel:true},
              {id:'labelAX',showLabel:true},
              {id:'labelBX',showLabel:true}
              ]);
            else o.desmos.setExpressions([
              {id:'labelX',showLabel:false},
              {id:'labelAX',showLabel:false},
              {id:'labelBX',showLabel:false}
              ]);
            break;
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
        }
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


        // Backup: expr = '\\left(x_1+\\frac{O_x-x_1}{o_A}\\left(t\\max \\left(o_a,h_a,o_A\\right)+\\left\\{\\theta _A\\ge \\frac{\\pi }{2}:tt_{ick}-h_a,\\max \\left(\\theta _B,\\theta _C\\right)\\ge \\frac{\\pi }{2}:tt_{ick},0\\right\}\\right),y_1+\\frac{O_y-y_1}{o_A}\\left(t\\max \\left(o_a,h_a,o_A\\right)+\\left\\{\\theta _A\\ge \\frac{\\pi }{2}:tt_{ick}-h_a,\\max \\left(\\theta _B,\\theta _C\\right)\\ge \\frac{\\pi }{2}:tt_{ick},0\\right\\}\\right)\\right)'
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
              color:cs.agaColors.red
          });
          exprs.push({
              id:'segment_'+hs.ALPHA[i]+hs.ALPHA[i+1],
              hidden:false,
              style:'normal',
              color:cs.agaColors.black
          });
        };

        // Style terminal edge
        exprs.push({
          id:'segment_'+hs.ALPHA[n]+'A',
          hidden:false,
          style:'normal',
          color:cs.agaColors.black
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
        RADIUS:10,
        INITIAL_COORDINATES_PRECISION:6,
        DRAG_BUFFER:0.25,
        DRAG_BUFFER_REBOUND:0.1, // How much to bounce back when going past the buffer
        SEGMENT_TEMPLATE:'\\left(x_U\\left(1-t\\right)+x_Vt,y_U\\left(1-t\\right)+y_Vt\\right)',
        MEASURE_TEMPLATE:'m_U=\\theta _{LVL}\\left(W,U,Z\\right)',
        HIDDEN_COLOR:'#FFFFFF', // white is close enough to hidden
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
         } else vars.n = hfs.n.numericValue;

         for(let i=1;i<=cons.MAX_VERTICES;i++) {
          if (i >= 3) for(var j=1;j<=i;j++) {
            if (i == vars.n) {
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
         vars.polygonABC = {A:0,B:0,C:0};
         for(let i=1;i<=cons.MAX_VERTICES;i++) {
          // Set up polygon angle values for the polygon terminating in this vertex
          if (i > 3) {
            var newPoly = Object.assign({},vars[vars.polygonName]);
            newPoly[hs.ALPHA[i]]=0;
            vars.polygonName+=hs.ALPHA[i];
            vars[vars.polygonName] = newPoly;
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
         vars.polygonName = vars.polygonName.slice(0,7+vars.n);

        hfs.n.observe('numericValue.switchingPolygon',function(){
          fs.A0597630.switchPolygon({
            name:'n',
            value:hfs.n.numericValue,
            desmos:o.desmos,
            uniqueId:o.uniqueId,
            log:o.log
          });
        });
      
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
        let cons = cs.A0597630;

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

          // Note: in previous versions, bound instead to keep the polygon convex.
          //  This meant binding by line(i-1,i+1), line(i-1,i-2), and line(i+2,i+1).
        };

        var constrained = hs.polygonConstrain(newPoint,vars.dragBoundaries);

        if (constrained !== null) {
          vars[n]['x_'+i] = constrained.x;
          vars[n]['y_'+i] = constrained.y;
        }

        if (constrained == newPoint) {
          fs.A0597630.clearPlaceholder(o);
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

        o.log("Changing from "+prevn+" sides to "+n+" sides");

        var exprs = [];

        // Move terminal vertex
         exprs.push({
          id:'measure'+hs.ALPHA[prevn],
          latex:cons.MEASURE_TEMPLATE.replace(/U/g,hs.ALPHA[prevn]).replace(/W/g,hs.ALPHA[prevn-1]).replace(/Z/g,hs.ALPHA[prevn%cons.MAX_VERTICES+1])
         });
         exprs.push({
          id:'measureA',
          latex:cons.MEASURE_TEMPLATE.replace(/U/g,'A').replace(/W/g,hs.ALPHA[n]).replace(/Z/g,'B')
         });
         exprs.push({
          id:'measure'+hs.ALPHA[n],
          latex:cons.MEASURE_TEMPLATE.replace(/U/g,hs.ALPHA[n]).replace(/W/g,hs.ALPHA[n-1]).replace(/Z/g,'A')
         });
         exprs.push({
          id:'segment_'+hs.ALPHA[n]+'A',
          hidden:false,
         });
         exprs.push({
          id:'segment_'+hs.ALPHA[prevn]+'A',
          hidden:true,
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
         for (var i = 3; i < n; i++) {
          exprs.push({
            id:'vertex_'+hs.ALPHA[i+1],
            hidden:false,
            showLabel:true
          });
          exprs.push({
            id:'segment_'+hs.ALPHA[i]+hs.ALPHA[i+1],
            hidden:false,
          });
          exprs.push({
            id:'m_'+hs.ALPHA[i],
            showLabel:true
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
 //         fs.A0597630.updateLabels(o,true);
        },cs.delay.LOAD);

       }
     };

  Object.assign(exports,hs.flattenFuncStruct(fs));

  return exports;
})();
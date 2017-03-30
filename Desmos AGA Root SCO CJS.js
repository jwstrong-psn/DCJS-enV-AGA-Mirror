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
        for (key in funcStruct) {
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
       ALPHA:'_ABCDEFGHIJKLMNOPQRSTUVWXYZ'
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
        ZOOM:0.3 // For reporting coarse changes in the zoom level
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
        DEGREES:0
       },
      delay:{ // delay values for timed events, in ms
        SAVE:1000, // delay to save after the most recent modification
        LOAD:1000 // delay to load after each save
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
        if (vs.shared[o.uniqueId] === undefined) vs.shared[o.uniqueId] = {sharingInstances:{},queuedActions:{}};
        let vars = vs.shared[o.uniqueId];

        vars.sharingInstances[myGuid] = o.desmos;
        if (vars.sharedState !== undefined) o.desmos.setState(vars.sharedState);

        var delayedSave = function() {

          vars.sharedState = o.desmos.getState();

          for (guid in vars.sharingInstances) {
            if (guid != myGuid) {
              let instance = vars.sharingInstances[guid];
              if (queuedActions[guid] !== undefined) clearTimeout(queuedActions[guid]);
              queuedActions[guid] = setTimeout(function(){
                  instance.setState(vars.sharedState);
              },cs.delay.LOAD);
            }
          }

          delete vars.queuedActions[myGuid];
        }

        o.desmos.observeEvent('change.save',function(){
          if (queuedActions[myGuid] !== undefined) clearTimeout(queuedActions[myGuid]);
          queuedActions[myGuid] = setTimeout(delayedSave,cs.delay.SAVE);
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
       valueOnly: function(options={}) {
        var o = hs.parseOptions(options);
        if (o.log) o.log('Setting point label equal to the value of ' + o.name + ': ' + o.value);;
        o.desmos.setExpression({id:o.name,label:''+o.value});
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
       labelEquation: function(options={}) {
        var o = hs.parseOptions(options);
        var expr = hs.latexToText(o.name) + ' = ' + o.value;
        if (o.log) o.log('Setting point label ' + expr);;
        o.desmos.setExpression({id:o.name,label:expr});
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
       for(i=0;i<52;i++) {
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

    /* ←— A0596385 FUNCTIONS ——————————————————————————————————————————————→ */
     fs.A0596385 = {
      /* ←— init ————————————————————————————————————————————————————————————→ */
       init: function(options={}) {
        var o = hs.parseOptions(options);
        vs[o.uniqueId] = {prevError:0,A:0,B:0,C:0};
       },
      /* ←— updateAngles ————————————————————————————————————————————————————→ *\
       | updates the labels of the triangle's vertices with their respective
       | angle measures.
       * ←———————————————————————————————————————————————————————————————————→ */
       updateAngles: function(options={}) {
        var o = hs.parseOptions(options);
        var vertex = o.name[o.name.length-1];
        var val = Math.round(180*o.value/Math.PI);
        var oldVal = vs[o.uniqueId][vertex];

        // Only update stuff if the one of the values has changed
        if (vs[o.uniqueId].upToDate === true && val == oldVal) return;

        // Calculate the value it should have to match the other two angles
        var calculated;
        switch (vertex) {
          case 'A':
            calculated = 180-(vs[o.uniqueId].B+vs[o.uniqueId].C);
            break;
          case 'B':
            calculated = 180-(vs[o.uniqueId].A+vs[o.uniqueId].C);
            break;
          default:
            calculated = 180-(vs[o.uniqueId].A+vs[o.uniqueId].B);
        }

        // If all is gravy, update the labels to match.
        if (val == calculated) {
          vs[o.uniqueId][vertex] = val;
          o.desmos.setExpression({id:'pointA',label:('m∠A = '+vs[o.uniqueId].A+'°')});
          o.desmos.setExpression({id:'pointB',label:('m∠B = '+vs[o.uniqueId].B+'°')});
          o.desmos.setExpression({id:'pointC',label:('m∠C = '+vs[o.uniqueId].C+'°')});
          vs[o.uniqueId].upToDate = true;
        } else {
          // If this angle is closer to its (re-)calculated value than the last one was, correct this one and let the others keep their original values.
          var newErr = Math.abs(180*o.value/Math.PI-calculated);
          if (newErr < vs[o.uniqueId].prevError && newErr < 1) {
            // Note: <1 makes rounding floor or ceiling only; if there is a spin where the error
            //       is always > 1, something has gone seriously wrong.
            // correct this one and update the 3 labels
            vs[o.uniqueId][vertex] = val = calculated;
            o.desmos.setExpression({id:'pointA',label:('m∠A = '+vs[o.uniqueId].A+'°')});
            o.desmos.setExpression({id:'pointB',label:('m∠B = '+vs[o.uniqueId].B+'°')});
            o.desmos.setExpression({id:'pointC',label:('m∠C = '+vs[o.uniqueId].C+'°')});
            vs[o.uniqueId].prevError = newErr;
            vs[o.uniqueId].upToDate = true;
          } else {
            // If the other angles are closer, this one should keep its given value, and will be updated
            // when the closer angles' measures are next polled.
            vs[o.uniqueId][vertex] = val;
            vs[o.uniqueId].prevError = newErr;
            vs[o.uniqueId].upToDate = false;
          }
        }

        if ((oldVal-90)*(val-90)<=0) {
          // This angle just became obtuse or non-obtuse.
          if (val>90) fs.A0596385.drawExtensions(o); // this angle just became obtuse
          else if ((90-vs[o.uniqueId].A)*(90-vs[o.uniqueId].B)*(90-vs[o.uniqueId].C)>=0) {
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
        DRAG_BUFFER:0.25,
        DRAG_BUFFER_REBOUND:1.1 // How much to bounce back when going past the buffer
       };
     fs.A0597629 = {
      /* ←— init ————————————————————————————————————————————————————————————→ *\
       | Initializes the variables
       * ←———————————————————————————————————————————————————————————————————→ */
       init: function(options={}) {
        let o = hs.parseOptions(options);
        hs[o.uniqueId] = {n:o.desmos.HelperExpression({latex:'n'})};
        vs[o.uniqueId] = {n:hs[o.uniqueId].n.numericValue};


        // Set up variables for vertices of each polygon
         for(var i=3;i<=cs.A0597629.MAX_VERTICES;i++) {
          vs[o.uniqueId][i]={};
          for(var j=1;j<=i;j++) {
            vs[o.uniqueId][i]["x_"+((j>9)?"{"+j+"}":j)] = cs.A0597629.RADIUS*Math.round(1000000*Math.sin(2*Math.PI*((j-1)/i)))/1000000;
            vs[o.uniqueId][i]["y_"+((j>9)?"{"+j+"}":j)] = cs.A0597629.RADIUS*Math.round(1000000*Math.cos(2*Math.PI*((j-1)/i)))/1000000;
          };
         };

        // Set up observers for all the coordinates.
         for(let i=1;i<=cs.A0597629.MAX_VERTICES;i++) {
          // Observe x
          vs[o.uniqueId]["x_"+((i>9)?"{"+i+"}":i)] = o.desmos.HelperExpression({
            latex:"x_"+((i>9)?"{"+i+"}":i)
          });
          hs[o.uniqueId]["x_"+((i>9)?"{"+i+"}":i)] = function(){fs.A0597629.coordinateChanged({
            name:"x_"+((i>9)?"{"+i+"}":i),
            value:vs[o.uniqueId]["x_"+((i>9)?"{"+i+"}":i)].numericValue,
            desmos:o.desmos,
            uniqueId:o.uniqueId,
            log:o.log || function(){}
          })};
          vs[o.uniqueId]["x_"+((i>9)?"{"+i+"}":i)].observe('numericValue.correction',hs[o.uniqueId]["x_"+((i>9)?"{"+i+"}":i)]);
          // Observe y
          vs[o.uniqueId]["y_"+((i>9)?"{"+i+"}":i)] = o.desmos.HelperExpression({
            latex:"y_"+((i>9)?"{"+i+"}":i)
          });
          hs[o.uniqueId]["y_"+((i>9)?"{"+i+"}":i)] = function(){fs.A0597629.coordinateChanged({
            name:"y_"+((i>9)?"{"+i+"}":i),
            value:vs[o.uniqueId]["y_"+((i>9)?"{"+i+"}":i)].numericValue,
            desmos:o.desmos,
            uniqueId:o.uniqueId,
            log:o.log || function(){}
          })};
          vs[o.uniqueId]["y_"+((i>9)?"{"+i+"}":i)].observe('numericValue.correction',hs[o.uniqueId]["y_"+((i>9)?"{"+i+"}":i)]);
         };
        /*
        hs[o.uniqueId].n.observe('numericValue',function(){fs.A0597629.switchPolygon({
          name:'n',
          value:hs[o.uniqueId].n.numericValue,
          desmos:o.desmos,
          uniqueId:o.uniqueId,
          log:o.log || function(){}
        })});
        */
        
        o.log("Observers initialized:",vs[o.uniqueId]);
       },
      /* ←— coordinateChanged ———————————————————————————————————————————————→ *\
       | updates variables, and corrects if the user tries to cross diagonals
       * ←———————————————————————————————————————————————————————————————————→ */
       coordinateChanged: function(options={}) {
        let o = hs.parseOptions(options);
        if (vs[o.uniqueId].lastDragged === null) return;
        let n = vs[o.uniqueId].n;
        let i = eval(o.name.match(/[0-9]+/)[0]);
        let oldPoint = {x:vs[o.uniqueId][n]['x_'+((i>9)?"{"+i+"}":i)],y:vs[o.uniqueId][n]['y_'+((i>9)?"{"+i+"}":i)]};
        let newPoint = {x:vs[o.uniqueId]["x_"+((i>9)?"{"+i+"}":i)].numericValue,y:vs[o.uniqueId]["y_"+((i>9)?"{"+i+"}":i)].numericValue};

        if (i != vs[o.uniqueId].lastDragged) {

          let g = (n+i-3)%n+1;
          let h = g%n+1;
          let j = i%n+1;
          let k = j%n+1;

          // o.log('Checking vertices '+hs.ALPHA[g]+hs.ALPHA[h]+hs.ALPHA[i]+hs.ALPHA[j]+hs.ALPHA[k]);

          // Line formed by the 2 previous vertices
          vs[o.uniqueId].dragBoundaryLeft = hs.lineTwoPoints(
            {
              x:vs[o.uniqueId][n]['x_'+((g>9)?"{"+g+"}":g)],
              y:vs[o.uniqueId][n]['y_'+((g>9)?"{"+g+"}":g)]
            },
            {
              x:vs[o.uniqueId][n]['x_'+((h>9)?"{"+h+"}":h)],
              y:vs[o.uniqueId][n]['y_'+((h>9)?"{"+h+"}":h)]
            }
           );

           var vertexPad = ((n>3)?hs.distancePointLine({
              x:vs[o.uniqueId][n]['x_'+((j>9)?"{"+j+"}":j)],
              y:vs[o.uniqueId][n]['y_'+((j>9)?"{"+j+"}":j)]
            },vs[o.uniqueId].dragBoundaryLeft)/3:-cs.A0597629.DRAG_BUFFER);

           vs[o.uniqueId].dragBoundaryLeft.c -= Math.max( // Max because these will all be clockwise
            -cs.A0597629.DRAG_BUFFER, // base amount of padding from the boundaries
            vertexPad,
            hs.distancePointLine({ // Don't pad past the starting location
                x:vs[o.uniqueId][n]['x_'+((i>9)?"{"+i+"}":i)],
                y:vs[o.uniqueId][n]['y_'+((i>9)?"{"+i+"}":i)]
              },vs[o.uniqueId].dragBoundaryLeft)/3
            );

          // Line formed by the 2 following vertices
          vs[o.uniqueId].dragBoundaryRight = hs.lineTwoPoints(
            {
              x:vs[o.uniqueId][n]['x_'+((j>9)?"{"+j+"}":j)],
              y:vs[o.uniqueId][n]['y_'+((j>9)?"{"+j+"}":j)]
            },
            {
              x:vs[o.uniqueId][n]['x_'+((k>9)?"{"+k+"}":k)],
              y:vs[o.uniqueId][n]['y_'+((k>9)?"{"+k+"}":k)]
            }
           );

           vertexPad = ((n>3)?hs.distancePointLine({
              x:vs[o.uniqueId][n]['x_'+((h>9)?"{"+h+"}":h)],
              y:vs[o.uniqueId][n]['y_'+((h>9)?"{"+h+"}":h)]
            },vs[o.uniqueId].dragBoundaryRight)/3:-cs.A0597629.DRAG_BUFFER);

           vs[o.uniqueId].dragBoundaryRight.c -= Math.max( // Max because these will all be clockwise
            -cs.A0597629.DRAG_BUFFER, // base amount of padding from the boundaries
            vertexPad,
            hs.distancePointLine({ // Don't pad past the starting location
                x:vs[o.uniqueId][n]['x_'+((i>9)?"{"+i+"}":i)],
                y:vs[o.uniqueId][n]['y_'+((i>9)?"{"+i+"}":i)]
              },vs[o.uniqueId].dragBoundaryRight)/3
            );

          // Line formed by the 2 adjacent vertices
          vs[o.uniqueId].dragBoundaryBase = hs.lineTwoPoints(
            {
              x:vs[o.uniqueId][n]['x_'+((h>9)?"{"+h+"}":h)],
              y:vs[o.uniqueId][n]['y_'+((h>9)?"{"+h+"}":h)]
            },
            {
              x:vs[o.uniqueId][n]['x_'+((j>9)?"{"+j+"}":j)],
              y:vs[o.uniqueId][n]['y_'+((j>9)?"{"+j+"}":j)]
            }
           );

           vs[o.uniqueId].dragBoundaryBase.c -= Math.min( // Min because these will all be clockwise
            cs.A0597629.DRAG_BUFFER, // base amount of padding from the boundaries
            hs.distancePointLine({ // Don't pad past the starting location
                x:vs[o.uniqueId][n]['x_'+((i>9)?"{"+i+"}":i)],
                y:vs[o.uniqueId][n]['y_'+((i>9)?"{"+i+"}":i)]
              },vs[o.uniqueId].dragBoundaryBase)/3
            );

          vs[o.uniqueId].lastDragged = i;

          if(o.log === console.log) {
            o.desmos.setExpressions([
            {
              id:'left',
              latex:vs[o.uniqueId].dragBoundaryLeft.a+'x+'+vs[o.uniqueId].dragBoundaryLeft.b+'y+'+vs[o.uniqueId].dragBoundaryLeft.c+'=0',
              color:cs.agaColors.red
            },
            {
              id:'right',
              latex:vs[o.uniqueId].dragBoundaryRight.a+'x+'+vs[o.uniqueId].dragBoundaryRight.b+'y+'+vs[o.uniqueId].dragBoundaryRight.c+'=0',
              color:cs.agaColors.blue
            },
            {
              id:'base',
              latex:vs[o.uniqueId].dragBoundaryBase.a+'x+'+vs[o.uniqueId].dragBoundaryBase.b+'y+'+vs[o.uniqueId].dragBoundaryBase.c+'=0',
              color:cs.agaColors.green
            }]);
          };
        };
        /**
          var newDistL=hs.distancePointLine(newPoint,vs[o.uniqueId].dragBoundaryLeft);
          var newDistR=hs.distancePointLine(newPoint,vs[o.uniqueId].dragBoundaryRight);
          var newDistB=hs.distancePointLine(newPoint,vs[o.uniqueId].dragBoundaryBase);
          var giveUp = false;
          window.setTimeout(function(){giveUp=true;},100);

          while ((newDistL >= 0 || newDistR >= 0 || newDistB <= 0) && !giveUp) { 
            var newDist = newDistL;
            if(newDist>=0) {
              var oldDist = hs.distancePointLine(oldPoint,vs[o.uniqueId].dragBoundaryLeft);
              var distOldNew = Math.sqrt(Math.pow(oldPoint.x-newPoint.x,2)+Math.pow(oldPoint.y-newPoint.y,2));
              var t = newDist*distOldNew/(newDist-oldDist)*cs.A0597629.DRAG_BUFFER_REBOUND;
              newPoint.x = oldPoint.x+(newPoint.x-oldPoint.x)*t;
              newPoint.y = oldPoint.x+(newPoint.x-oldPoint.x)*t;
            };

            newDist = newDistR;
            if(newDist>=0) {
              var oldDist = hs.distancePointLine(oldPoint,vs[o.uniqueId].dragBoundaryRight);
              var distOldNew = Math.sqrt(Math.pow(oldPoint.x-newPoint.x,2)+Math.pow(oldPoint.y-newPoint.y,2));
              var t = newDist*distOldNew/(newDist-oldDist)*cs.A0597629.DRAG_BUFFER_REBOUND;
              newPoint.x = oldPoint.x+(newPoint.x-oldPoint.x)*t;
              newPoint.y = oldPoint.x+(newPoint.x-oldPoint.x)*t;
            };

            newDist = newDistB;
            if(newDist<=0) {
              var oldDist = hs.distancePointLine(oldPoint,vs[o.uniqueId].dragBoundaryBase);
              var distOldNew = Math.sqrt(Math.pow(oldPoint.x-newPoint.x,2)+Math.pow(oldPoint.y-newPoint.y,2));
              var t = newDist*distOldNew/(newDist-oldDist)*cs.A0597629.DRAG_BUFFER_REBOUND;
              newPoint.x = oldPoint.x+(newPoint.x-oldPoint.x)*t;
              newPoint.y = oldPoint.x+(newPoint.x-oldPoint.x)*t;
            };

            o.log('Correcting to '+hs.ALPHA[i]+'('+newPoint.x+','+newPoint.y+')');

            newDistL=hs.distancePointLine(newPoint,vs[o.uniqueId].dragBoundaryLeft);
            newDistR=hs.distancePointLine(newPoint,vs[o.uniqueId].dragBoundaryRight);
            newDistB=hs.distancePointLine(newPoint,vs[o.uniqueId].dragBoundaryBase);
          }
        **/

        if(newPoint[o.name[0]]==o.value) {
          vs[o.uniqueId][n][o.name]=o.value;
        } else {

          o.log('Adjusting vertex '+hs.ALPHA[i]+'_'+n+'('+vs[o.uniqueId][n][o.name.replace('y','x')]+','+vs[o.uniqueId][n][o.name.replace('x','y')]+'); bounded by:');
          o.log({
            left:vs[o.uniqueId].dragBoundaryLeft,
            right:vs[o.uniqueId].dragBoundaryRight,
            base:vs[o.uniqueId].dragBoundaryBase
          });

          vs[o.uniqueId][o.name.replace('y','x')].unobserve('numericValue.correction');
          vs[o.uniqueId][o.name.replace('x','y')].unobserve('numericValue.correction');
          o.desmos.setExpressions([
            {
              id:o.name.replace('y','x'),
              latex:o.name.replace('y','x')+'='+newPoint.x
            },
            {
              id:o.name.replace('x','y'),
              latex:o.name.replace('x','y')+'='+newPoint.y
            }
          ]);
          vs[o.uniqueId][o.name.replace('y','x')].observe('numericValue.correction',hs[o.uniqueId][o.name.replace('y','x')]);
          vs[o.uniqueId][o.name.replace('x','y')].observe('numericValue.correction',hs[o.uniqueId][o.name.replace('x','y')]);
        };

       },
      /* ←— switchPolygon ———————————————————————————————————————————————————→ *\
       | Adds and removes vertices and edges
       | Restyles diagonals
       | Restores coordinates
       * ←———————————————————————————————————————————————————————————————————→ */
       switchPolygon: function(options={}) {
        var o = hs.parseOptions(options);
        var prevn = vs[o.uniqueId].n;
        var n = vs[o.uniqueId].n = o.value;

        // Clear dragging memory
        vs[o.uniqueId].lastDragged = null;


        o.log("Changed from "+prevn+" sides to "+n+" sides");

        var exprs = [];

        // Delete extra vertices
        for (var i = cs.A0597629.MAX_VERTICES; i >= n+1; i--) {
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
              hidden:false,
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

        // o.log('Changed figures:',exprs);

        o.desmos.setExpressions(exprs);

        exprs = [];

        // Update coordinates
        for (var i = 1; i <= n; i++) {
          exprs.push({
            id:'x_'+i,
            latex:'x_'+((i>9)?"{"+i+"}":i)+'='+vs[o.uniqueId][n]['x_'+((i>9)?"{"+i+"}":i)]
          });
          exprs.push({
            id:'y_'+i,
            latex:'y_'+((i>9)?"{"+i+"}":i)+'='+vs[o.uniqueId][n]['y_'+((i>9)?"{"+i+"}":i)]
          });
          //o.log('Moving vertex '+hs.ALPHA[i]+' to ('+vs[o.uniqueId][n]['x_'+((i>9)?"{"+i+"}":i)]+','+vs[o.uniqueId][n]['y_'+((i>9)?"{"+i+"}":i)]+')');
        }

        // o.log('Changed coordinates:',exprs);

        // clear observers
        for(let i=1;i<=cs.A0597629.MAX_VERTICES;i++){
          vs[o.uniqueId]["x_"+((i>9)?"{"+i+"}":i)].unobserve('numericValue.correction');
          vs[o.uniqueId]["y_"+((i>9)?"{"+i+"}":i)].unobserve('numericValue.correction');
        };

        if (hs[o.uniqueId].correctionBuffer !== undefined) window.clearTimeout(hs[o.uniqueId].correctionBuffer);

        o.desmos.setExpressions(exprs);

        // Reinitialize observers.
         for(let i=1;i<=n;i++) {
          // Observe x
          vs[o.uniqueId]["x_"+((i>9)?"{"+i+"}":i)].observe('numericValue.correction',hs[o.uniqueId]["x_"+((i>9)?"{"+i+"}":i)]);
          // Observe y
          vs[o.uniqueId]["y_"+((i>9)?"{"+i+"}":i)].observe('numericValue.correction',hs[o.uniqueId]["y_"+((i>9)?"{"+i+"}":i)]);
         };
        hs[o.uniqueId].correctionBuffer = window.setTimeout(function(){vs[o.uniqueId].lastDragged = -1;},2000);

       }
     };

  Object.assign(exports,hs.flattenFuncStruct(fs));

  return exports;
})();
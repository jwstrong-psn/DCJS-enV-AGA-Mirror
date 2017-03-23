window.PearsonGL = window.PearsonGL || {};
window.PearsonGL.External = window.PearsonGL.External || {};

/*——————————————————————————————————————————————————————————————————————
 | Module: rootJS
* ——————————————————————————————————————————————————————————————————————*/
PearsonGL.External.rootJS = (function() {
  /* ←—PRIVATE VARIABLES———————————————————————————————————————————————————→ *\
       | Variable cache; access with vs[uniqueId].myVariable
       * ←—————————————————————————————————————————————————————————————————→ */
    var vs = {
      shared:{}
    }
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
        expr = expr.replace(/\-/g,' − ');
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
       | The coefficients are not normalized.
       * ←————————————————————————————————————————————————————————————————→ */
       lineTwoPoints: function(point1, point2) {
        return {
          a:point1.y-point2.y,
          b:point2.x-point1.y,
          c:point1.x*point2.y-point1.y*point2.x
        };
       }
     }
  /* ←—PRIVATE CONSTANTS———————————————————————————————————————————————————→ *\
       | Constants, e.g. for tolerances or LaTeX strings.
       | Access with cs.type.NAME
       * ←—————————————————————————————————————————————————————————————————————→ */
    const cs = {
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
        var expr = '' + o.name + ' = ' + o.value;
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
        var expr = hs.latexToText(o.name) + ' = ' + o.value;
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

    /* ←— A0597629 FUNCTIONS ——————————————————————————————————————————————→ */
     cs.A0597629 = {
      MAX_VERTICES:14,
      RADIUS:10
     };

     fs.A0597629 = {
      /* ←— init ————————————————————————————————————————————————————————————→ *\
       | Initializes the variables
       * ←———————————————————————————————————————————————————————————————————→ */
       init: function(options={}) {
        let o = hs.parseOptions(options);
        vs[o.uniqueId] = {};

        // Set up observers for all the coordinates.
         for(let i=1;i<=cs.A0597629.MAX_VERTICES;i++) {
          // Observe x
          vs[o.uniqueId]["x_"+((i>9)?"{"+i+"}":i)] = o.desmos.HelperExpression({
            latex:"x_"+((i>9)?"{"+i+"}":i)
          });
          vs[o.uniqueId]["x_"+((i>9)?"{"+i+"}":i)].observe('numericValue',function(){fs.A0597629.coordinateChanged({
            name:"x_"+((i>9)?"{"+i+"}":i),
            value:vs[o.uniqueId]["x_"+((i>9)?"{"+i+"}":i)].numericValue,
            desmos:o.desmos,
            uniqueId:o.uniqueId,
            log:o.log || function(){}
          })});
          // Observe y
          vs[o.uniqueId]["y_"+((i>9)?"{"+i+"}":i)] = o.desmos.HelperExpression({
            latex:"y_"+((i>9)?"{"+i+"}":i)
          });
          vs[o.uniqueId]["y_"+((i>9)?"{"+i+"}":i)].observe('numericValue',function(){fs.A0597629.coordinateChanged({
            name:"y_"+((i>9)?"{"+i+"}":i),
            value:vs[o.uniqueId]["y_"+((i>9)?"{"+i+"}":i)].numericValue,
            desmos:o.desmos,
            uniqueId:o.uniqueId,
            log:o.log || function(){}
          })});
         };
         o.log("Observers initialized:",vs[o.uniqueId]);

        // Set up variables for vertices of each polygon
         for(var i=3;i<=cs.A0597629.MAX_VERTICES;i++) {
          vs[o.uniqueId][i]={};
          for(var j=1;j<=i;j++) {
            vs[o.uniqueId][i]["x_"+((j>9)?"{"+j+"}":j)] = cs.A0597629.RADIUS*Math.round(1000000*Math.sin(2*Math.PI*(1-(j-1)/i)))/1000000;
            vs[o.uniqueId][i]["y_"+((j>9)?"{"+j+"}":j)] = cs.A0597629.RADIUS*Math.round(1000000*Math.cos(2*Math.PI*(1-(j-1)/i)))/1000000;
          };
          o.log("Variables initialized for "+i+" vertices:",vs[o.uniqueId][i]);
         };
       },
      /* ←— coordinateChanged ———————————————————————————————————————————————→ *\
       | Initializes the variables
       |  NOTE: N should be logged in the helper functions with value_n
       * ←———————————————————————————————————————————————————————————————————→ */
       coordinateChanged: function(options={}) {
        var o = hs.parseOptions(options);
        var n = vs[o.uniqueId].n;
        var i = eval(o.name.match(/[0-9]+/));
        console.log("Changed:",o);
       }
     }

  Object.assign(exports,hs.flattenFuncStruct(fs));

  return exports;
})();
"use strict";

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
       flattenFuncStruct: function(funcStruct,prefix) {
        if(prefix === undefined) prefix = '';
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
            if (!(Object.assign(functions,hs.flattenFuncStruct(item,prefix+key+'_')))) {
              return false;
            }
          } else if (typeof item === 'function') {
            functions[prefix+key] = item;
          } else {
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
          desmos = options.desmos;
        }

        if (desmos === undefined) {
          desmos = options.desmos = window.calculator || window.Calc;
        }

        if (options.uniqueId === undefined) {
          options.uniqueId = desmos.guid;
        }

        if(vs[options.uniqueId]===undefined) {
          vs[options.uniqueId] = {};
        }
        if (window.widget === undefined && options.log === console.log) {
          window.widget = desmos;
          window.reportDesmosError = function() {
            let element = document.createElement('a');
            element.setAttribute('href', 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify({
                id: options.uniqueId,
                state: desmos.getState(),
                variables: vs[options.uniqueId],
                helpers: hs[options.uniqueId],
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
      /* ←— eval ——————————————————————————————————————————————————————————→ *\
       ↑ Evaluate a LaTeX expression in a given calculator.
       * ←—————————————————————————————————————————————————————————————————————→ */
       eval: function(expression,options,callback = function(){}){
        // Basic prep/init
        let o = hs.parseOptions(options);
        let vars = vs[o.uniqueId];
        if(vars.hxs===undefined) vars.hxs={};

        // Access Helper Expression
        if(vars.hxs[expression]===undefined)
          vars.hxs[expression] = o.desmos.HelperExpression({latex:expression});
        let helper = vars.hxs[expression];

        // Toss the callback into a thread
        if(helper.numericValue!==undefined)
          setTimeout(function(){callback(helper.numericValue);},0);
        else {
          let thiscall = Date.now();
          helper.observe('numericValue.'+thiscall,function(){
            helper.unobserve('numericValue.'+thiscall);
            callback(helper.numericValue);
          });
        }
        return helper.numericValue;
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
       |       surrounded by parens if it contains any of /[0-9.+\-]/
       |
       | @Returns: LaTeX string
       ↓ @Returns: false if form is not one of the given
       * ←—————————————————————————————————————————————————————————————————————→ */
       updateExpForm: function(form,a,b,c,options={}){
        let o = Object.assign({signed:false,x:'x'},options);
        let expr = '';
        switch (form) {
          case cs.enum.expform.ABXC:
            if (o.signed && ((a > 0) && (b !== 0) || (a*b === 0) && (c >= 0))) {expr += '+';}
            if (a*b !== 0) {
              expr += (''+a+'\\left\\('+b+'\\right\\)^{'+o.x+'}');
              if (c > 0) {expr +='+';}
            }
            expr += c;
            break;
          case cs.enum.expform.AEBC:
            if (o.signed && ((a > 0) || (a === 0) && (c >= 0))) {expr += '+';}
            if (a !== 0) {
              if (a === -1) {expr += '-';}
              else if (a !== 1) {expr += a;}
              if (b !== 0) {
                expr += 'e^{';
                if (b === -1) {expr += ('-'+hs.groupFactor(o.x));}
                else if (b === 1) {expr += o.x;}
                else {expr += (b+''+hs.groupFactor(o.x));}
                expr += '}';
              } 
              else {expr += 'e^0';}
              if (c > 0) {expr += '+';}
            }
            expr += c;
            break;
          case cs.enum.expform.EABC:
            if (o.signed) {expr += '+';}
            expr += 'e^{';
            if (a !== 0) {
              if (a === -1) {expr += ('-'+hs.groupFactor(o.x));}
              else if (a === 1) {expr += o.x;}
              else {expr += (a+''+hs.groupFactor(o.x));}
              if (b > 0) {expr += '+';}
            }
            if ((a === 0) || (b !== 0)) {expr += b;}
            expr += '}';
            if (c > 0) {expr += '+';}
            if (c !== 0) {expr += c;}
            break;
          case cs.enum.expform.EAHK:
            if (o.signed) {expr += '+';}
            expr += 'e^{';
            if (a !== 0) {
              if (a === 1) {expr += o.x+((b<0)?'+':'')+((b === 0)?'':-b);}
              else {
                if (a === -1) {expr += ('-');}
                else {expr += a;}
                expr += hs.groupFactor(''+o.x+((b<0)?'+':'')+((b === 0)?'':-b));
              }
            }
            else {expr += 0;}
            expr += '}';
            if (c > 0) {expr += '+';}
            if (c !== 0) {expr += c;}
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
        if (/[0-9.+\-]/g.test(''+expr)) {return '\\left('+expr+'\\right)';}
        else {return expr;}
       },
      /* ←— latexToText ———————————————————————————————————————————————————————→ *\
       ↑ Convert a latex string to a plaintext string, e.g. for labels
       ↓ 
       * ←—————————————————————————————————————————————————————————————————————→ */
       latexToText: function(expr){
        expr = ''+expr;
        expr = expr.replace(/\\cdot\s?/g,'\u22c5');
        expr = expr.replace(/._{([a-zA-Z])Var}/g,'$1');
        expr = expr.replace(/([+=÷×\u22c5])/g,' $1 ');
        expr = expr.replace(/,/g,',\u202f');
        expr = expr.replace(/\^2/g,'²');
        expr = expr.replace(/\^3/g,'³');
        expr = expr.replace(/\\sqrt{([^{}]*?)}/g,'√($1)');
        expr = expr.replace(/\\theta\s?/g,'θ');
        expr = expr.replace(/\\pi\s?/g,'π');
        expr = expr.replace(/_0/g,'₀');
        expr = expr.replace(/_1/g,'₁');
        expr = expr.replace(/_2/g,'₂');
        expr = expr.replace(/\\(?:right|left)\\*([()[\]|{}])/g,'$1');
        expr = expr.replace(/\\right/g,'');
        expr = expr.replace(/\\left/g,'');
        expr = expr.replace(/([^\s \u202f(\[{])\-/g,'$1 − ');
        expr = expr.replace(/\-/g,'−');
        return expr;
       },
      /* ←— quadraticForm —————————————————————————————————————————————————————→ *\
       ↑ Produce a simplified ('--'→'+' etc) quadratic expression given parameters
       |  params: a, b, c, h, k, r1, r2, x
       |  optional x changes independent variable
       |  if b or c are given, outputs ax^2+bx+c
       |  if h or k are given, outputs a\\left(x-h\\right)^2+k
       |  if r1 or r2 are given, outputs a\\left(x-r1\\right)\\left(x-r2\\right)
       |  if none or some combination, gets confused and outputs ''
       |  assumes a=1 if not given
       |  assumes b=0, c=0, h=0, k=0 if not given
       |  if r1 or r2 are not given, assumes linear factor
       ↓ 
       * ←—————————————————————————————————————————————————————————————————————→ */
       quadraticForm: function(params){
        let output = ''+((Math.abs(params.a)>0)?((params.a===1)?'':((params.a===-1)?'-':params.a)):'');
        let pmask = eval('0b'+
                            1*(params.a!==undefined)+
                            1*(params.b!==undefined)+
                            1*(params.c!==undefined)+
                            1*(params.h!==undefined)+
                            1*(params.k!==undefined)+
                            1*(params.r1!==undefined)+
                            1*(params.r2!==undefined)+
                            1*(params.x!==undefined));

        switch (true) {
          case ((pmask&0b01100000)&&(!(pmask&0b00011110))): //b,c
            if(params.a===0) {
              if(((params.b===undefined)||(params.b===0))&&((params.c===undefined)||(params.c===0))) return '0';
            } else {
              output+=((params.x===undefined)?'x':params.x);
              output+='^2';
              if((params.b>0)||(((params.b===undefined)||(params.b===0))&&(params.c>0))) output+='+';
            }
            if((params.b===undefined)||(params.b===0));
            else {
              if(params.b===1);
              else if(params.b===-1) output+='-'
              else output+=params.b;
              output+=((params.x===undefined)?'x':params.x);
              if(params.c>0) output+='+';
            }
            if((params.c===undefined)||(params.c===0));
            else output+= params.c;
            break;
          case ((pmask&0b00011000)&&(!(pmask&0b01100110))): //h,k
            if(params.a===0) {
              if((params.k===undefined)||(params.k===0)) return '0';
            } else {
              if(Math.abs(params.h)>0) output+='\\left(';
              output+=((params.x===undefined)?'x':params.x);
              if(params.h<0) output+='+';
              if(Math.abs(params.h)>0) {
                output+=(-params.h);
                output+='\\right)';
              }
              output+='^2';
              if(params.k>0) output+='+';
            }
            if(Math.abs(params.k)>0) output+=params.k;
            break;
          case ((pmask&0b00000110)&&(!(pmask&0b01111000))): //r1,r2
            if(params.a===0) return '0';
            if(params.r1===undefined);
            else {
              if(params.r1===0) output+=((params.x===undefined)?'x':params.x);
              else {
                output+='\\left(';
                output+=((params.x===undefined)?'x':params.x);
                if(params.r1<0) output+='+';
                output+=(-params.r1);
                output+='\\right)';
              }
            }
            if(params.r2===undefined);
            else {
              if(params.r2===0) {
                if(params.r1===0) output+='^2';
                else output+=((params.x===undefined)?'x':params.x);
              } else {
                output+='\\left(';
                output+=((params.x===undefined)?'x':params.x);
                if(params.r2<0) output+='+';
                output+=(-params.r1);
                output+='\\right)';
              }
            }
            break;
          default:
            output='';
        }
        return output;
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
        let o = hs.parseOptions(options);
        let expr = name+'('+
          ((xVal<0)?'−':'')+
          Math.abs(Math.round(Math.pow(10,precision)*xVal)/Math.pow(10,precision))+
          ',\u202f'+
          ((yVal<0)?'−':'')+
          Math.abs(Math.round(Math.pow(10,precision)*yVal)/Math.pow(10,precision))+
          ')';
        if (o.log) {o.log('Setting point label ' + expr);}
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
       | Output: {a:_,b:_,c:_} in ax+by+c=0
       * ←————————————————————————————————————————————————————————————————→ */
       lineTwoPoints: function(point1, point2) {
        let line = {
          a:point1.y-point2.y,
          b:point2.x-point1.x,
          c:point1.x*point2.y-point1.y*point2.x
        };

        let magnitude = Math.sqrt(line.a*line.a+line.b*line.b);

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
          if (testPoint === null) {return false;}
          let i;
          for (i=0;i<lines.length;i+=1) {
            if (hs.distancePointLine(testPoint,lines[i])<buffer) {return false;}
          }
          return true;
        }

        if (viable(point)) {return point;}

        let buffered = [];

        for (i=0;i<lines.length;i+=1) {
          let bufferedLine = {a:lines[i].a,b:lines[i].b,c:lines[i].c-buffer*Math.pow(2,cs.ts.BUFFER_BUFFER)}; // Overcompensate to guarantee success
          if (hs.distancePointLine(point,lines[i])<buffer) {
            // For a convex polygon, if projecting to a crossed boundary results in a valid point, then that point is definitely the closest.
            let projected = hs.projectPointLine(point,bufferedLine);
            if (viable(projected)) {return projected;}
          }
          // Otherwise, all lines need to be considered to account for acute angles, where projecting may cross from inside one boundary to outside it.
          buffered.push(bufferedLine);
        }

        // If projecting to an edge doesn't work, find the closest vertex of the polygon.
        let constrained = null;
        for (i=0;i<buffered.length;i+=1) {
          let j;
          for (j=(i+1);j<buffered.length;j+=1) {
            let intersected = hs.intersectLines(buffered[i],buffered[j]);
            if (viable(intersected)) {
              if (constrained === null || (
                Math.pow(intersected.x-point.x,2)
                  +Math.pow(intersected.y-point.y,2)
                <Math.pow(constrained.x-point.x,2)
                  +Math.pow(constrained.y-point.y,2)
              )) {constrained = {x:intersected.x,y:intersected.y};}
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
       circleConstrain: function(point, circle, side=cs.enum.PERIMETER, buffer=cs.distance.CONSTRAIN_BUFFER) {

        let dSquared = Math.pow(point.x-circle.x,2)+Math.pow(point.y-circle.y,2);
        let scaleBack;

        switch (side) {
          case cs.enum.PERIMETER:
            if ((buffer > 0) && (Math.pow(circle.r-buffer,2) < dSquared && dSquared < Math.pow(circle.r+buffer,2))) {return point;}
            scaleBack = circle.r;
            break;
          case cs.enum.INTERIOR:
            if (dSquared < Math.pow(circle.r-buffer,2)) {return point;}
            scaleBack = circle.r-buffer*Math.pow(2,cs.ts.BUFFER_BUFFER);
            break;
          case cs.enum.EXTERIOR:
            if (dSquared > Math.pow(circle.r+buffer,2)) {return point;}
            scaleBack = circle.r+buffer*Math.pow(2,cs.ts.BUFFER_BUFFER);
            break;
          default:
            return null;
        }

        if (scaleBack < 0) {o.log('Negative circle constraint '+scaleBack); return null;}

        if(dSquared !== 0) {scaleBack /= Math.sqrt(dSquared);}
        else {scaleBack = 0;}

        let output = {
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
        let x = line1.b*line2.c-line2.b*line1.c;
        let y = line2.a*line1.c-line1.a*line2.c;
        let z = line1.a*line2.b-line2.a*line1.b;

        return {x:x/z,y:y/z};
       },
      /* ←— number to letter (lowercase) —————————————————————————————————→ *\
       | Convert a number to its lowercase letter with cs.alpha[n]`
       * ←————————————————————————————————————————————————————————————————→ */
       alpha:(function(x){
        let func=function(x){return func[x];};
        Object.assign(func,'_abcdefghijklmnopqrstuvwxyz');
        return func;})(),
      /* ←— number to letter (uppercase) —————————————————————————————————→ *\
       | Convert a number to its uppercase letter with `cs.ALPHA[n]`
       * ←————————————————————————————————————————————————————————————————→ */
       ALPHA:(function(x){
        let func=function(x){return func[x];};
        Object.assign(func,'_ABCDEFGHIJKLMNOPQRSTUVWXYZ');
        return func;})(),
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
       number:function(val,precision=cs.precision.FLOAT_PRECISION) {
        return Math.round(Math.pow(10,precision)*val)/Math.pow(10,precision);
       }
     };
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
          SOLID:((Desmos.Styles!==undefined)?Desmos.Styles.SOLID:'normal'),
          DASHED:((Desmos.Styles!==undefined)?Desmos.Styles.DASHED:'dashed')
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
 }());
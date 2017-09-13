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
  /* ←—PRIVATE VARIABLES———————————————————————————————————————————————————→ *\
       | Variable cache; access with vs[uniqueId].myVariable
       * ←—————————————————————————————————————————————————————————————————→ */
    let vs = {shared:{}};
  /* ←—PRIVATE HELPER FUNCTIONS————————————————————————————————————————————→ *\
       | Subroutines; access with hs.functionName(args)
       * ←—————————————————————————————————————————————————————————————————→ */
    let hs = {
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
        let functions={};
        let keys = Object.keys(funcStruct);
        let i; let l = keys.length;
        for(i=0; i<l; i+=1) {
          if (typeof funcStruct[keys[i]] === 'object') {
            if (!(Object.assign(functions,hs.flattenFuncStruct(funcStruct[keys[i]],prefix+keys[i]+'_')))) {return false;}
          }
          else if (typeof funcStruct[keys[i]] === 'function') {functions[prefix+keys[i]] = funcStruct[keys[i]];}
          else {
            alert(prefix+keys[i]+' is not a function or object');
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
       parseOptions: function(options={}) {
        let desmos = options.desmos || window.calculator || window.Calc;
        let output = Object.assign({},options,{
          desmos:desmos,
          name:((options.name === undefined) ? '' : options.name),
          value:((options.value === undefined) ? NaN : options.value),
          uniqueId:desmos.guid, //options.uniqueId || ((desmos === undefined) ? 'undefinedId' : desmos.guid),
          log:options.log // || function(){} // 
        });
        if (window.widget === undefined && output.log === console.log) {
          window.widget = output.desmos;
          window.reportDesmosError = function() {
            let element = document.createElement('a');
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
        }
        if(vs[output.uniqueId]===undefined) {vs[output.uniqueId] = {};}
        return output;
       },
      /* ←— eval ——————————————————————————————————————————————————————————→ *\
       ↑ Evaluate a LaTeX expression in a given calculator.
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
       eval: function(expression,options,callback){
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
   let exports = {}; // This object is used to export public functions/variables
      exports.reflectParabola = function(options={}) { // for test SCO
        let o = hs.parseOptions(options);
        if (o.log) {o.log(o.name + " was updated to " + o.value);}
        if (vs.M956353 === undefined) {
          vs.M956353 = {a:0,h:0,k:0};
          a = o.desmos.HelperExpression({latex:'a'});
          h = o.desmos.HelperExpression({latex:'h'});
          k = o.desmos.HelperExpression({latex:'k'});
          a.observe('numericValue',function(val) {vs.M956353.a=a[val];});
          h.observe('numericValue',function(val) {vs.M956353.h=h[val];});
          k.observe('numericValue',function(val) {vs.M956353.k=k[val];});
        }
        o.desmos.setExpression({id: 'reflected', latex: 'y=-a(x-' + o.value + ')^2-k', color: '#00AA00'});
        o.desmos.setExpression({id: 'exponential', latex: hs.updateExpForm(cs.enum.expform.EAHK,vs.M956353.a,vs.M956353.h,vs.M956353.k), color: '#00AAAA'});
       };
   let fs = {shared:{}}; // Function structure; define with fs[WIDGET_ID].myFunction()
  
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
        let o = hs.parseOptions(options);

        if (o.log) {o.log('observeZoom activated with '+JSON.stringify(Object.assign({},o,{'desmos':'l'})));}

        if (vs[o.uniqueId] === undefined) {vs[o.uniqueId] = {};}
        let v = vs[o.uniqueId];

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
      /* ←— shareState ————————————————————————————————————————————————————→ *\
       | Shares the state of this widget between multiple widgets in the same SCO
       | NOTE: this initialization function is incompatible with state-based
       |       HelperExpressions
       * ←———————————————————————————————————————————————————————————————————→ */
       shareState: function(options={}) {
        let o = hs.parseOptions(options);
        let myGuid = o.desmos.guid;
        let vars = vs.shared[o.uniqueId];
        if (vars.sharingInstances === undefined) {vars.sharingInstances={};}
        if (vars.sharingInstances === undefined) {vars.recentLoad={};}
        if (vars.sharingInstances === undefined) {vars.queuedActions={};}

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
          if (vars.queuedActions[myGuid] !== undefined) {clearTimeout(vars.queuedActions[myGuid]);}
          delete vars.queuedActions[myGuid];

          // Load into all the others
          let i;
          let guid;
          for (i=0;i<vars.sharingInstances.length;guid = vars.sharingInstances[i+=1]) {
            if (guid !== myGuid) {
              o.log('Loading state from '+myGuid+' into '+guid);
              vars.recentLoad[guid] = true;
              vars.sharingInstances[guid].setState(vars.sharedState);
              // The `'change.save'` event will ensure the load is confirmed
            } else {o.log('Skipped loading into '+guid);}
          }
        }

        function confirmLoad() {
          o.log('Considering '+myGuid+' loaded.');
          vars.recentLoad[myGuid] = false;
          delete vars.queuedActions[myGuid];
        }

        o.desmos.observeEvent('change.save',function(){
          if (vars.queuedActions[myGuid] !== undefined) {clearTimeout(vars.queuedActions[myGuid]);}
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
        let o = hs.parseOptions(options);
        let expr = '' + o.name + '=' + o.value;
        if (o.log) {o.log('Setting expression \'' + o.name + '\' to \'' + expr + '\'.');}
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
        let o = hs.parseOptions(options);
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
        let o = hs.parseOptions(options);
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
        let o = hs.parseOptions(options);
        let expr = hs.latexToText(o.name+'='+Math.round(o.value*Math.pow(10,prec))/Math.pow(10,prec));
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
        let o = hs.parseOptions(options);
        let A = pointNames.A;
        let B = pointNames.B;
        let C = pointNames.C;
        let vertex = o.name[o.name.length-1];
        let val = Math.round(180*o.value/Math.PI*Math.pow(10,prec))/Math.pow(10,prec);
        let vars = vs[o.uniqueId]['triAngle'+A+B+C];
        let oldVal = vars[vertex];

        if (vars.upToDate === undefined) {o.log('Labeling angles of △'+A+B+C+' to '+prec+' decimal places.');}

        // Only update stuff if the one of the values has changed
        if (vars.upToDate === true && val === oldVal) {return;}

        // Calculate the value it should have to match the other two angles
        let calculated;
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
          let newErr = Math.abs(180*o.value/Math.PI-calculated);
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
       labelPolyAngles: function(options={},params={},prec=cs.precision.DEGREES) {
        let o = hs.parseOptions(options);
        let ps = Object.assign({refreshAll:false,exterior:false},params);
        let v = o.name[o.name.length-1];
        let vars = vs[o.uniqueId];
        let p = vars[vars.polygonName+'_angles'];
        let vertices = vars.polygonName.slice(7,vars.polygonName.length).split('');
        let apparentSum;
        let prevError;
        let nextError;
        let errors;
        let vals;
        let pos;

        function measure(x) {return (Math.pow(10,prec)*vars['P_'+x]);}

        if (ps.refreshAll) {
          // Sort the points by the error they produce (larger error closer to ends).
          let sorted = [];
          vertices.forEach(function(name) {
            // Delay if the value hasn't been reported yet.
            if (measure(name) === undefined || Number.isNaN(measure(name))) {
              o.log('Angles of '+vars.polygonName+' not all defined. Delaying full refresh by '+cs.delay.SET_EXPRESSION+'ms');
              setTimeout(function(){fs.shared.label.labelPolyAngles(o,Object.assign({},ps,{refreshAll:true}),prec);},cs.delay.LOAD);
              return;
            }

            let thisError = Math.round(Math.pow(10,cs.precision.FLOAT_PRECISION)*(Math.round(measure(name))-measure(name)))/Math.pow(10,cs.precision.FLOAT_PRECISION);
            let i;
            for (i = 0;i<=sorted.length;i+=1) {
              let thatError = Math.round(Math.pow(10,cs.precision.FLOAT_PRECISION)*(Math.round(measure(sorted[i]))-measure(sorted[i])))/Math.pow(10,cs.precision.FLOAT_PRECISION);
              if(!(thisError<thatError)) {
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

          let desiredSum = 180*(vertices.length-2)*Math.pow(10,prec);
          apparentSum = 0;
          vertices.forEach(function(name){
            let rounded = Math.round(measure(name));
            p[name] = rounded;
            apparentSum += rounded;
          });

          o.log('Measured angles:',Object.assign({},p));

          // Points with the largest error introduce the least error when rounded oppositely
          // So, re-round points with the largest error to get the sum you want (but each one only once)
          let adjusting;
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

        let prev = vertices[(vertices.indexOf(v)+vertices.length-1)%vertices.length];
        let next = vertices[(vertices.indexOf(v)+1)%vertices.length];

        let prevVal = Math.round(measure(prev));
        let val = Math.round(measure(v));
        let nextVal = Math.round(measure(next));

        let thisError;
        
        if (Number.isNaN(prevVal) || Number.isNaN(nextVal) || Number.isNaN(val)) {
          o.log('Angles of vertices '+prev+', '+v+', and '+next+' not all defined. Refreshing polygon '+vars.polygonName+' in '+cs.delay.SET_EXPRESSION+'ms');
          setTimeout(function(){fs.shared.label.labelPolyAngles(o,Object.assign({},ps,{refreshAll:true}),prec);},cs.delay.SET_EXPRESSION*300);
          return;
        }

        // Only update stuff if the one of the values has changed
        if (vars.upToDate === true && val === p[v] && prevVal === p[prev] && nextVal === p[next]) {return;}

        // The apparent sum of the three affected angles shouldn't change, else other angles will have to change.
        let expectedSum = p[prev] + p[v] + p[next];
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
       (function(){let i;
       for(i=0;i<52;i+=1) {
        let varName = 'QWERTYUIOPASDFGHJKLZXCVBNMqwertyuiopasdfghjklzxcvbnm'[i];
        fs.value[varName] = (function(l){
          return function(options={}) {
            let o = hs.parseOptions(options);
            if (vs[o.uniqueId] === undefined) {vs[o.uniqueId] = {};}
            let name = o.name.match(/(?:[a-zA-Z]|\\(?:alpha|beta|theta|phi|pi|tau)\s)_(?:\{([a-zA-Z0-9]+)\}|([a-zA-Z0-9]))/) || [];
            name = l+'_'+((name[1] === undefined) ? ((name[2] === undefined) ? '' : name[2]) : name[1]);
            if (name.length === 2) {name = name[0];}
            vs[o.uniqueId][name] = o.value;
            if (o.log) {o.log('Saving value of ' + o.name + ' as vs.' + o.uniqueId + '.' + name);}
           };
         })(varName);
       }})();
    /* ←— SHARED EXPRESSION FUNCTIONS —————————————————————————————————————→ */
     fs.shared.expression = {
      /* ←— showHide —————————————————————————————————————————————————————→ *\
       | Show or hide an expression. Pass the expression id and 0 or 1 as value
       |    0 is hidden
       |    1 is visible
       * ←————————————————————————————————————————————————————————————————→ */
       showHide: function(options={}) {
        let o = hs.parseOptions(options);
        o.desmos.setExpression({id:o.id,hidden:(!(o.value))});
       }
     };

    /* ←— A0598801 FUNCTIONS ——————————————————————————————————————————————→ */
     fs.A0598801 = {
      
      /* ←— updateLabels ————————————————————————————————————————————————————→ *\
       | updates the labels of the function g(x) = |x - h|  with the value of "h"
       |
       * ←———————————————————————————————————————————————————————————————————→ */
       updateAVfunction: function(options={}) {
        let o = hs.parseOptions(options);
      
          if (o.value > 0) {
              o.desmos.setExpression({id:'9',label:('g(x) = |x –'+' '+ o.value+'|')});
          } else if (o.value < 0) {
            o.desmos.setExpression({id:'9',label:('g(x) = |x +'+' '+ ((-1)*o.value)+'|')});
          }else {
            o.desmos.setExpression({id:'9',label:('g(x) = |x|')});}       
        }      
     };

    /* ←— A0598803 FUNCTIONS ——————————————————————————————————————————————→ */
     fs.A0598803 = {
      
       updateAVfunction: function(options={}) {
        let o = hs.parseOptions(options);
          
          o.desmos.setExpression({id:'12',label:('g(x) ='+' '+o.value +'|x|')});
        }
     };

     /* ←— A0598800 FUNCTIONS ——————————————————————————————————————————————→ */
     fs.A0598800 = {
      
       updateAVfunction: function(options={}) {
        let o = hs.parseOptions(options);
      
          if (o.value > 0) {
              o.desmos.setExpression({id:'4',label:('g(x) = |x| +'+' '+ o.value)});
          } 
          else if (o.value < 0) {
            o.desmos.setExpression({id:'4',label:('g(x) = |x| –'+' '+ ((-1)*o.value))});
          } 
          else {
            o.desmos.setExpression({id:'4',label:('g(x) = |x|')});
          }          
        }
     };

     /* ←— A0597514 FUNCTIONS ——————————————————————————————————————————————→ */
     fs.A0597514 = {
      /* ←— init ————————————————————————————————————————————————————————————→ *\
       | Initializes the variables
       * ←———————————————————————————————————————————————————————————————————→ */
       init: function(options={}) {
        let o = hs.parseOptions(options);
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
        let o = hs.parseOptions(options);
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
        }
        hs.labelPoint(vs[o.uniqueId].M_x,vs[o.uniqueId].M_y,'M','M_point',o);
       }
     };


    /* ←— A0597552 FUNCTIONS ——————————————————————————————————————————————→ */
     fs.A0597552 = {
      /* ←— init ————————————————————————————————————————————————————————————→ *\
       | Initializes the variables
       * ←———————————————————————————————————————————————————————————————————→ */
       init: function(options={}) {
        let o = hs.parseOptions(options);
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
        let o = hs.parseOptions(options);
        let P_x = vs[o.uniqueId].P_x;
        let P_y = vs[o.uniqueId].P_y;
        let Q_x = vs[o.uniqueId].Q_x;
        let Q_y = vs[o.uniqueId].Q_y;
        switch (o.name) {
          case 'x_1':
            vs[o.uniqueId].P_x = o.value;
            P_x = o.value;
            hs.labelPoint(vs[o.uniqueId].P_x,vs[o.uniqueId].P_y,'P','P_point',o);
            break;
          case 'y_1':
            vs[o.uniqueId].P_y = o.value;
            P_y = o.value;
            hs.labelPoint(vs[o.uniqueId].P_x,vs[o.uniqueId].P_y,'P','P_point',o);
            break;
          case 'x_2':
            vs[o.uniqueId].Q_x = o.value;
            Q_x = o.value;
            hs.labelPoint(vs[o.uniqueId].Q_x,vs[o.uniqueId].Q_y,'Q','Q_point',o);
            break;
          case 'y_2':
            vs[o.uniqueId].Q_y = o.value;
            Q_y = o.value;
            hs.labelPoint(vs[o.uniqueId].Q_x,vs[o.uniqueId].Q_y,'Q','Q_point',o);
            break;
        }
        let distance = Math.round(100*Math.sqrt(Math.pow(Q_x-P_x,2)+Math.pow(Q_y-P_y,2)))/100;
        let x_distance = Math.abs(Q_x-P_x);
        let y_distance = Math.abs(Q_y-P_y);

        o.desmos.setExpressions([
          {id:'distance',label:('√('+x_distance+'² + '+y_distance+'²) = '+distance)},
          {id:'x_distance',label:x_distance},
          {id:'y_distance',label:y_distance}
        ]);
       }
     };


    /* ←— A0598802 FUNCTIONS ——————————————————————————————————————————————→ */
     fs.A0598802 = {
      /* ←— init ————————————————————————————————————————————————————————————→ *\
       | Initializes the variables
       * ←———————————————————————————————————————————————————————————————————→ */
       init: function(options={}) {
        let o = hs.parseOptions(options);
        vs[o.uniqueId] = {
          // try changing 'h' with it's id (4) instead same with "k" (3).
          h:4,
          k:-2
        };

       },
      /* ←— updateLabels ————————————————————————————————————————————————————→ *\
       | updates the label of function based  the values of h and k 
       | 
       * ←———————————————————————————————————————————————————————————————————→ */
       updateAVfunction: function(options={}) {
        let o = hs.parseOptions(options);
        let k = vs[o.uniqueId].k;
        let h = vs[o.uniqueId].h;
    
        switch (o.name) {
          case 'h':
            vs[o.uniqueId].h = o.value;
            h = o.value;
              if(k > 0){ 
                if (h > 0){
                  o.desmos.setExpression({id:7,label:'g(x) = |x – '+' '+ h + '| +'+ ' '+ k });
                }
                else if (h < 0) {
                  o.desmos.setExpression({id:7,label:'g(x) = |x + '+' '+ (-1)*h + '| +'+ ' '+ k });
                }
                else {
                   o.desmos.setExpression({id:7,label:'g(x) = |x| +'+ ' '+ k });
                }
              }
              else if (k < 0) {

                if (h > 0){
                  o.desmos.setExpression({id:7,label:'g(x) = |x – '+' '+ h + '| –'+ ' '+ (-1)*k });
                }
                else if ( h < 0) {
                  o.desmos.setExpression({id:7,label:'g(x) = |x + '+' '+ (-1)*h + '| –'+ ' '+(-1)*k });
                }
                else {
                   o.desmos.setExpression({id:7,label:'g(x) = |x| –'+ ' '+(-1)*k });
                }
              }
              else{
                if (h > 0){
                  o.desmos.setExpression({id:7,label:'g(x) = |x – '+' '+ h + '|'});
                }
                else if (h < 0) {
                  o.desmos.setExpression({id:7,label:'g(x) = |x + '+' '+ (-1)*h + '|'});
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
                  o.desmos.setExpression({id:7,label:'g(x) = |x – '+' '+ h + '| +'+ ' '+ k });
                }
                else if ( k < 0){
                  o.desmos.setExpression({id:7,label:'g(x) = |x – '+' '+ h + '| –'+ ' '+ (-1)*k });
                }
                else{
                   o.desmos.setExpression({id:7,label:'g(x) = |x – '+' '+ h +'|'});
                }
              }
              else if (h < 0) {

                if (k > 0){
                  o.desmos.setExpression({id:7,label:'g(x) = |x + '+' '+ (-1)*h + '| +'+ ' '+ k });
                }
                else if ( k < 0){
                  o.desmos.setExpression({id:7,label:'g(x) = |x + '+' '+ (-1)*h + '| –'+ ' '+ (-1)*k });
                }
                else{
                   o.desmos.setExpression({id:7,label:'g(x) = |x + '+' '+ (-1)*h +'|'});
                }
              }
              else {
                if (k > 0){
                  o.desmos.setExpression({id:7,label:'g(x) = |x|'+ ' '+'+'+' ' + k });
                }
                else if ( k < 0){
                  o.desmos.setExpression({id:7,label:'g(x) = |x|'+ ' '+ '–' +' '+(-1)*k });
                }
                else{
                   o.desmos.setExpression({id:7,label:'g(x) = |x|'});
                }
              }         
            break;      
          }
         } 
     };

    /* ←— A0597206 FUNCTIONS ——————————————————————————————————————————————→ */
     fs.A0597206 = {
      /* ←— init ————————————————————————————————————————————————————————————→ *\
       | Initializes the variables
       * ←———————————————————————————————————————————————————————————————————→ */
       init: function(options={}) {
        let o = hs.parseOptions(options);
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
       updateLabels: function(options={}) {
        let o = hs.parseOptions(options);
        let vars = vs[o.uniqueId];
        vars[o.name] = o.value;

        o.desmos.setExpression({id:390,label:hs.latexToText('f(x)='+
                                                              hs.quadraticForm({
                                                                a:vars.a,
                                                                b:vars.b,
                                                                c:vars.c
                                                              })
                                                            )});
       } 
     };

    /* ←— A0597207 FUNCTIONS ——————————————————————————————————————————————→ */
     fs.A0597207 = {
      /* ←— init ————————————————————————————————————————————————————————————→ *\
       | Initializes the variables
       * ←———————————————————————————————————————————————————————————————————→ */
       init: function(options={}) {
        let o = hs.parseOptions(options);
        vs[o.uniqueId] = {
          x:3,
          y:2
        };
       },
      /* ←— updateTriangle ———————————————————————————————————————————————————→ *\
       | updates the labels of function based  the values of x and y
      | 
       * ←———————————————————————————————————————————————————————————————————→ */
       updateTriangle: function(options={}) {
        let o = hs.parseOptions(options);
        let vars = vs[o.uniqueId];
        vars[o.name[0]] = o.value;

        let x = vars.x;
        let y = vars.y;

        o.desmos.setExpressions([
          {id:'1',latex:'x_0='+x},
          {id:'373',latex:'y_0='+y},
          {id:'a',label:hs.latexToText(''+x+'^2-'+y+'^2='+(x*x-y*y))},
          {id:'b',label:hs.latexToText('2\\cdot '+x+'\\cdot '+y+'='+(2*x*y))},
          {id:'c',label:hs.latexToText(''+x+'^2+'+y+'^2='+(x*x+y*y))}
          ]);
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
       updateLabels: function(options={}) {
        let o = hs.parseOptions(options);
        switch (o.name) {
          case 'a':
            o.desmos.setExpression({id:'17',label:('f(x) = '+o.value+'x²')});
            break;
          }
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
       updateLabels: function(options={}) {
        let o = hs.parseOptions(options);
        switch (o.name) {
          case 'a':
            o.desmos.setExpression({id:'21',label:('y = '+o.value+'x²')});
            o.desmos.setExpression({id:'20',label:('f(x) = −'+o.value+'x²')});
            break;
          }
        }
     };


    /* ←— A0597534 FUNCTIONS ——————————————————————————————————————————————→ */
     fs.A0597534 = {
      /* ←— updateLabels ————————————————————————————————————————————————————→ *\
       | updates the labels of theta 1, 2, 3, 4 based on changes to two lines
       |
       | Hidden points P_1, P_2, P_3, and P_4 must be authored with showLabel:true,
       | and the IDs a1, a2, a3, a4
       * ←———————————————————————————————————————————————————————————————————→ */
       updateLabels: function(options={}) {
        let o = hs.parseOptions(options);
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
          }
        }
     };

    /* ←— A0597544 FUNCTIONS ——————————————————————————————————————————————→ */
     fs.A0597544 = {
      /* ←— init ————————————————————————————————————————————————————————————→ *\
       | Initializes the variables
       * ←———————————————————————————————————————————————————————————————————→ */
       init: function(options={}) {
        let o = hs.parseOptions(options);
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
        let o = hs.parseOptions(options);
        switch (o.name) {
          case '\\theta_1':
            o.desmos.setExpression({id:'P1',label:(o.value+'°')});
            break;
          case '\\theta_2':
            o.desmos.setExpression({id:'P2',label:(o.value+'°')});
            break;
          }
        }
     };
     /* ←— A0597546 FUNCTIONS ——————————————————————————————————————————————→ */
     fs.A0597546 = {
      /* ←— init ————————————————————————————————————————————————————————————→ *\
       | Initializes the variables
       * ←———————————————————————————————————————————————————————————————————→ */
       init: function(options={}) {
        let o = hs.parseOptions(options);
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
        let o = hs.parseOptions(options);
        switch (o.name) {
          case '\\theta_1':
            o.desmos.setExpression({id:'100',label:(o.value+'°')});
            break;
          case '\\theta_2':
            o.desmos.setExpression({id:'101',label:(o.value+'°')});
            break;
          }
        }
     };

    /* ←— A0597220 FUNCTIONS ——————————————————————————————————————————————→ */
     fs.A0597220 = {
      /* ←— updateLabels ————————————————————————————————————————————————————→ *\
       | update function could be used later
       |
       | H
       * ←———————————————————————————————————————————————————————————————————→ */
       simulation: function(options={}) {
        let o = hs.parseOptions(options);

        if(o.name == 'p') {
          vs[o.uniqueId].p = o.value;

          o.desmos.setExpressions([
            // {id:'405',latex:'N_{ewSample}=0'}, // Alternate functionality: leave the old graph, but mark it as old
            {id:'sides',color:cs.color.agaColors.red,hidden:true},
            {id:'bars',color:cs.color.agaColors.red,hidden:true}
          ]);

          return;
        } else if(o.value===0) {
          /* // Alternate functionality: turn bar grey when toggling off.
          o.desmos.setExpressions([
            {id:'sides',color:cs.color.agaColors.grey},
            {id:'bars',color:cs.color.agaColors.grey}
            ]);
          */
          return;
        }
        
        o.desmos.setExpression({id:'405',latex:'N_{ewSample}=0'}); // Comment out if using alternate functionality

        let p = vs[o.uniqueId].p || 0,
          histBarID = {},
          histLeft =[],
          histFreq = [],
          histHeight=[],
          numberofSamples = 1000,
          numberofSims = 1000,
          sample, sim, pSim, pCount, histMax, histMin, bar;

        // REVISED STUFF

        // Run simulations
        for(sim = 0; sim < numberofSims ; sim+=1){

          // Count # of "successes"
           pCount = 0;
           for (sample = 0; sample < numberofSamples; sample+=1){
            if (Math.random() <= p) pCount+=1;
           }

          // Log sample proportion in appropriate bin (bin n: n<p<=n+1)
          pSim = Math.ceil(100*(pCount/numberofSamples))-1;

          if(pSim<0) pSim=0; // p=0 included in bin 0

          if(histBarID[pSim]===undefined) histBarID[pSim]=1;
          else histBarID[pSim]+=1;
        }

        histMin = Math.min.apply(null,Object.keys(histBarID));
        histMax = Math.max.apply(null,Object.keys(histBarID));

        for(bar = histMin; bar <= histMax; bar+=1) {

          histLeft.push(bar/100);

          if(histBarID[bar]===undefined) histFreq.push(0);
          else histFreq.push(histBarID[bar]);

          if(bar===histMin) histHeight.push(histFreq[0]);
          else histHeight.push(Math.max(histFreq[histFreq.length-2],histFreq[histFreq.length-1]));
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
       init: function(options={}) {
        let o = hs.parseOptions(options);
        vs[o.uniqueId] = {
          globalDiffArray:[],
          histFreq:[]
        };
       },
      /*———————————————————————————————————————————————————————————————
       |    Additional function to reset histogram.
       *————————————————————————————————————————————————*/
       histReset: function(options={}) {
        let o = hs.parseOptions(options);
        let vars = vs[o.uniqueId];
        let globalDiffArray=vars.globalDiffArray;
        let histFreq = vars.histFreq;
        if(o.value===0) return;
        globalDiffArray = [];
        histFreq =[0,0,0,0,0,0,0,0,0,0];
     
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
       resample: function(options={}) {
        let o = hs.parseOptions(options);
        let vars = vs[o.uniqueId];

        if(o.value===0) return;
    
        let oGroup = [184, 186, 183, 182, 170, 182, 178, 170, 187, 185, 188, 183, 202, 188, 193, 182, 179, 190, 189, 164, 177, 173, 183, 172, 154, 177, 168, 180, 167, 170, 178, 180, 168, 178, 197, 188, 167, 174, 177, 173];
        let assignGroup =[];
        let assignSum;
        let exGroup1 = [];
        let exGroup2 = [];

        let globalDiffArray=vars.globalDiffArray;
        //  let globalDiffArray=[0];
        let meanDiff;
        let numberofResamples;
        let histMin = -10;
        let histMax = 10;
        let histBandWidth = 2;
        let histLeft =[-10,-8,-6,-4,-2,0,2,4,6,8];
        let histRight =[-8,-6,-4,-2,0,2,4,6,8,10];
        let histFreq = vars.histFreq;
        let arrayMean;
        let arraySum;
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
       init: function(options={}) {
        let o = hs.parseOptions(options);
        vs[o.uniqueId] = {                
          n:1,
          p:0.5,
          A:0,
          C:0,
          on:true
        };
       },
      //←———————————————————————————————————————————————————————————————————
       simulation: function(options={}) {
        let o = hs.parseOptions(options);
      
        let win = false;
        let net = 0;
        let totalNet = 0;
        let currentMeanNet = 0;   
        let meanNetPerGame=[];
        let xMeanNet =[];

        //vars for rescaling graph.
        let leftBound;
        let rightBound;
        let topBound;
        let bottomBound;

        if (o.name === 'R_{unSimulation}') {
            if(o.value===0) return;
            else o.desmos.setExpression({id:5,latex:'R_{unSimulation}=0'});
            vs[o.uniqueId].on = true;
        } else {
          vs[o.uniqueId][o.name] = o.value;
          if (vs[o.uniqueId].on) {
            vs[o.uniqueId].on = false;
            o.desmos.setExpressions([
              {id:'600',hidden:true,showLabel:false},
              {id:'601',type:'table',columns:[{},{hidden:true}]}
            ]);
          }
          return;
        }

            let n = vs[o.uniqueId].n;
            let p = vs[o.uniqueId].p;
            let A = vs[o.uniqueId].A;
            let C = vs[o.uniqueId].C;

            meanNetPerGame=[];
            xMeanNet =[];

            for(i = 1 ; i <= n; i+=1){
              // play the game, did you win?
              // r = Math.round(100*Math.random())/100;
               if(Math.random() <= p){
                 win = true;                
                  }
               else{
                 win = false;
                  }
              // compute winning/losses.      
              if(win === true){
                net = (-1) * C + A;
                }
              else{
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
                }
              else if (A < C){
                  bottomBound = (-1)* C * 1.3;
                  topBound = Math.abs(A-C)* 1.3;
                }
              else{
                  if (C === 0){
                    bottomBound = -5;
                    topBound = 5;
                    }
                  else{
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

    /* ←— A0597217 FUNCTIONS ——————————————————————————————————————————————→ */
     fs.A0597217 = {
       /* Initializes the variables
       ←———————————————————————————————————————————————————————————————————→ */
       init: function(options={}) {
        let o = hs.parseOptions(options);
        let n = 9;
        let i;

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

        // Initialize labeling
        for(i=1;i<=n;i+=1) {
          vs[o.uniqueId]['dpfx'+i+'y'+i]=o.desmos.HelperExpression({latex:'d_{pf}\\left(x_'+i+',y_'+i+'\\right)'});
          vs[o.uniqueId]['dpdx'+i+'y'+i]=o.desmos.HelperExpression({latex:'d_{pd}\\left(x_'+i+',y_'+i+'\\right)'});

          vs[o.uniqueId]['dpfx'+i+'y'+i].observe('numericValue',(function(x){
            return function(){
              o.desmos.setExpression({label:vs[o.uniqueId]['dpfx'+x+'y'+x].numericValue,id:(511+2*x)});
              };
            })(i));
          vs[o.uniqueId]['dpdx'+i+'y'+i].observe('numericValue',(function(x){
            return function(){
              o.desmos.setExpression({label:vs[o.uniqueId]['dpdx'+x+'y'+x].numericValue,id:(512+2*x)});
              };
            })(i));
        }
       },
       /* if widget is unlocked, to change focus or directrix reset the 
        the parabola points.*/

       reset: function(options={}) {
        let o = hs.parseOptions(options);
        let n = vs[o.uniqueId].n;
        let ids = vs[o.uniqueId].ids;
        let i;

          o.log("new lock value is"+ ' '+ o.value);

          if(vs[o.uniqueId].last_l_ock == 1 && o.value == 0){

            for(i=1;i<=n;i+=1) {
              o.desmos.setExpression({id:ids['x'+i+'off'],latex:('x_{'+i+'off}=0')});
              o.desmos.setExpression({id:ids['y'+i+'off'],latex:('y_{'+i+'off}=0')});
            }
          }
          vs[o.uniqueId].last_l_ock = o.value;
        }
     };

    /* ←— A0597538 FUNCTIONS ——————————————————————————————————————————————→ */
     fs.A0597538 = {
      /* ←— updateLabels ————————————————————————————————————————————————————→ *\
       | updates the labels of theta 1 and 2 based on change to ray 
       |       
       | Hidden points must be authored with showLabel:true,
       | and the IDs a1, a2, a3
       * ←———————————————————————————————————————————————————————————————————→ */
       updateLabels: function(options={}) {
        let o = hs.parseOptions(options);
        switch (o.name) {
          case '\\theta_1':
            o.desmos.setExpression({id:'a1',label:('𝑚∠2 = '+o.value)});
            break;
          case '\\theta_2':
            o.desmos.setExpression({id:'a2',label:('𝑚∠1 = '+o.value)});
            break;
          }
        }
     };

    /* ←— A0596584 FUNCTIONS ——————————————————————————————————————————————→ */
     fs.A0596584 = {
      /* ←— init ————————————————————————————————————————————————————————————→ *\
       | Initializes the variables
       * ←———————————————————————————————————————————————————————————————————→ */
       init: function(options={}) {
        let o = hs.parseOptions(options);
        vs[o.uniqueId] = {
        };
       },
      /* ←— updateLabels ————————————————————————————————————————————————————→ *\
       | updates the labels of Watered Area based on values of r_1, r_2, r_3 
       |       
       | Hidden point must be authored with showLabel:true,
       | and the ID 26
       * ←———————————————————————————————————————————————————————————————————→ */
       updateLabels: function(options={}) {
        let o = hs.parseOptions(options);
        switch (o.name) {
          case 'w':
            o.desmos.setExpression({id:'26',label:('Watered Area: '+o.value+' m')});
            break;
          }
        }
     };

    /* ←— A0596986 FUNCTIONS ——————————————————————————————————————————————→ */
     fs.A0596986 = {
      /* ←— init ————————————————————————————————————————————————————————————→ *\
       | Initializes the variables
       * ←———————————————————————————————————————————————————————————————————→ */
       init: function(options={}) {
        let o = hs.parseOptions(options);
        vs[o.uniqueId] = {
        };
       },
      /* ←— updateLabels ————————————————————————————————————————————————————→ *\
       | updates the labels of Watered Area based on values of r_1, r_2, r_3 
       |       
       | Hidden equation point must be authored with showLabel:true,
       | and the ID 639, hidden dashed line point must be authored 
       | with showLabel:true, and ID 636.
       * ←———————————————————————————————————————————————————————————————————→ */
       updateLabels: function(options={}) {
        let o = hs.parseOptions(options);
        switch (o.name) {
          case 'k':
            o.desmos.setExpression({id:'636',label:(o.value)});
            break;
          }
        }
     };

    /* ←— A0598945 FUNCTIONS ——————————————————————————————————————————————→ */
     fs.A0598945 = {
      /* ←— init ————————————————————————————————————————————————————————————→ *\
       | Initializes the variables
       * ←———————————————————————————————————————————————————————————————————→ */
       init: function(options={}) {
        let o = hs.parseOptions(options);
        vs[o.uniqueId] = {
        };
       },
      /* ←— updateLabels ————————————————————————————————————————————————————→ *\
       | updates the label of the function.
       |       
       | Hidden point must be authored with showLabel:true,
       | and the ID 394
       * ←———————————————————————————————————————————————————————————————————→ */
       updateLabels: function(options={}) {
        let o = hs.parseOptions(options);
        switch (o.name) {
          case 'a':
            o.desmos.setExpression({id:'394',label:('y = '+o.value+' cos x')});
            break;
          }
        }
     };

    /* ←— A0596417 FUNCTIONS ——————————————————————————————————————————————→ */
     fs.A0596417 = {
      /* ←— init ————————————————————————————————————————————————————————————→ *\
       | Initializes the variables
       * ←———————————————————————————————————————————————————————————————————→ */
       init: function(options={}) {
        let o = hs.parseOptions(options);
        vs[o.uniqueId] = {
        };
       },
      /* ←— updateLabels ————————————————————————————————————————————————————→ *\
       | updates the label of asymptote k.
       |       
       | Hidden point must be authored with showLabel:true,
       | and the ID 125
       * ←———————————————————————————————————————————————————————————————————→ */
       updateLabels: function(options={}) {
        let o = hs.parseOptions(options);
        switch (o.name) {
          case 'k':
            o.desmos.setExpression({id:'104',label:('k = '+o.value)});
            break;
          }
        }
     };

    /* ←— A0596417_MO2 FUNCTIONS ——————————————————————————————————————————————→ */
     fs.A0596417_MO2 = {
      /* ←— init ————————————————————————————————————————————————————————————→ *\
       | Initializes the variables
       * ←———————————————————————————————————————————————————————————————————→ */
       init: function(options={}) {
        let o = hs.parseOptions(options);
        vs[o.uniqueId] = {
        };
       },
      /* ←— random Sample ————————————————————————————————————————————————————→ *\
       | populates a list with random points when a variable "r" is changed.
       |       
       | also random samples the list 100 time and generates a list of 100 means.
       | 
       * ←———————————————————————————————————————————————————————————————————→ */
       randomSample: function(options={}) {
        let o = hs.parseOptions(options);
        switch (o.name) {
          case 'R':
            break;
          default:
            return;
          }
            let myPop =[];
            let sampleList =[];
            let meansList =[];
            let sampleSum = 0;
            let trueMean = 0;
            let sMean = 0;
            let n = 100;

          function arrayToList(arr) {
            return `[${arr}]`;
            }
        // fill up population 100 random numbers from 1 to 100
       
        for (i = 0; i < n; i+=1){
            myPop[i]=Math.floor(Math.random()*100)+1;
        }

       // create list of population in Desmos
        
        o.desmos.setExpression({id: 'list11', latex: `P=${arrayToList(myPop)}`});

       // Large loop to repeat n trials to create n sample means.//
       // Use t as the "trial" variable.//

        for(t = 0; t < n; t+=1){
  
       //take a random sample//
  
          for (i = 0; i < n; i+=1){
              sampleList[i]=myPop[Math.floor(Math.random()*(n-1))+1]; 
           }
        // to compute the sample mean, first find the sum.
      
              sampleSum = 0;
              for(i = 0; i < n; i+=1) {
                sampleSum = sampleSum + sampleList[i];
              }
            sampleMean = sampleSum/n;
            meansList[t]= sampleMean;
        }
  
       //create list of sample in Desmos.
  
        o.desmos.setExpression({id: 'list12', latex: `S=${arrayToList(sampleList)}`});

       //create list of sample Means in Desmos.

          o.desmos.setExpression({id: 'list13', latex: `M=${arrayToList(meansList)}`});

        }
     };

    /* ←— A0596417_MO FUNCTIONS ——————————————————————————————————————————————→ */
     fs.A0596417_MO = {
      /* ←— init ————————————————————————————————————————————————————————————→ *\
       | Initializes the variables
       * ←———————————————————————————————————————————————————————————————————→ */
       init: function(options={}) {
        let o = hs.parseOptions(options);
        vs[o.uniqueId] = {
        };
       },
      /* ←— generatePoints ————————————————————————————————————————————————————→ *\
       | generatespoints when a variable "g" is changed.
       |       
       | H
       | 
       * ←———————————————————————————————————————————————————————————————————→ */
       generatePoints: function(options={}) {
        let o = hs.parseOptions(options);
        switch (o.name) {
          case 'g':
            break;
          default:
            return;
          }
            let n = 500;
            let xMin = 1;
            let xMax = 40;
            let yMin = 1;
            let yMax = 40;
            for (i = 1; i <= n; i+=1){
              let xVal = Math.floor(Math.random()*(xMax-xMin))+xMin;
              let yVal = Math.floor(Math.random()*(yMax-yMin))+yMin;
              o.desmos.setExpression({id:500+i,latex:'\\left('+xVal+','+yVal+'\\right)',color:'#5d50b2'});
            }
        
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
       updateLabels: function(options={}) {
        let o = hs.parseOptions(options);                
          if (o.value > 0){
            o.desmos.setExpression({id:'344',label:('g(x) = x² +'+' '+ o.value)});
            }
          else if (o.value < 0){
            o.desmos.setExpression({id:'344',label:('g(x) = x² –'+' '+(-1)*o.value)});
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
       | Hidden point must be authored with showLabel:true, (decided to show "0 in front of the square root when  k = 1)")
       | and the ID 357
       * ←———————————————————————————————————————————————————————————————————→ */
       updateLabels: function(options={}) {
        let o = hs.parseOptions(options);                
          
          if (o.value == 1){
            o.desmos.setExpression({id:'357',label:('j(x) = √(x)')});
            }
          else{
            o.desmos.setExpression({id:'357',label:('j(x) = '+ o.value +'√(x)')});
            }    
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
       updateLabels: function(options={}) {
        let o = hs.parseOptions(options);
        
          if (o.value > 0){
            o.desmos.setExpression({id:'467',label:('g(x) = '+ o.value +'|x|')});
          }
          else {
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
       updateLabels: function(options={}) {
        let o = hs.parseOptions(options);
        
          if(o.value < 0){
            o.desmos.setExpression({id:'467',label:('h(x) = '+ o.value +'|x|')});
            }
            else{
            o.desmos.setExpression({id:'467',label:('h(x) = 0')});
            }
        }
     };

    /* ←— A0598652 FUNCTIONS ——————————————————————————————————————————————→ */
     fs.A0598652 = {
      /* ←— init ————————————————————————————————————————————————————————————→ *\
       | Initializes the variables
       * ←———————————————————————————————————————————————————————————————————→ */
       init: function(options={}) {
        let o = hs.parseOptions(options);
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
        let o = hs.parseOptions(options);
        switch (o.name) {
          case 'd_2':
            o.desmos.setExpression({id:'distance',label:(o.value+' blocks')});
            break;
          }
        }
     };

    /* ←— A0597598_A FUNCTIONS ——————————————————————————————————————————————→ */
     fs.A0597598_A = {
      /* ←— labelAngle ————————————————————————————————————————————————————→ *\
       | updates the label of the angle of rotation
       | observe with \theta_x
       * ←———————————————————————————————————————————————————————————————————→ */
       labelAngle: function(options={}) {
        let o = hs.parseOptions(options);
        o.desmos.setExpression({id:'angle_label',label:(hs.latexToText(o.value)+'°')});
       }
     };

    /* ←— A0597616 FUNCTIONS ——————————————————————————————————————————————→ */
     cs.A0597616 = {CM_PRECISION:1};
     fs.A0597616 = {
      /* ←— label —————————————————————————————————————————————————————————→ */
       label: function(options={}) {
        let o = hs.parseOptions(options);
        /* switch (o.name) {
          case 'm_B': */
            let value = Math.round(o.value);
            vs[o.uniqueId].B = value;
            o.desmos.setExpression({id:'labelB',label:''+value+'°'});
            if (0 < value && value < 155) {
              o.desmos.setExpression({id:'labelX',label:''+Math.round(155-value)+'°',showLabel:true});
              let AX = Math.round(Math.pow(10,cs.A0597616.CM_PRECISION)*3*Math.sin(Math.PI*value/180)/Math.sin(Math.PI*((155-value)/180)))/Math.pow(10,cs.A0597616.CM_PRECISION);
              let BX = Math.round(Math.pow(10,cs.A0597616.CM_PRECISION)*3*Math.sin(Math.PI*25/180)/Math.sin(Math.PI*((155-value)/180)))/Math.pow(10,cs.A0597616.CM_PRECISION);
              o.desmos.setExpressions([
                {id:'labelAX',label:''+AX+' cm',showLabel:true},
                {id:'labelBX',label:''+BX+' cm',showLabel:true}
              ]);
            } else {o.desmos.setExpressions([
              {id:'labelX',showLabel:false},
              {id:'labelAX',showLabel:false},
              {id:'labelBX',showLabel:false}
            ]);}
          /*   break;
          case 'd_{AX}':
            let value = Math.round(o.value*Math.pow(10,cs.A0597616.CM_PRECISION))/Math.pow(10,cs.A0597616.CM_PRECISION);
            value = Math.max(value,1/Math.pow(10,cs.A0597616.CM_PRECISION));
            o.desmos.setExpression({id:'labelAX',label:''+value+' cm'});
            break;
          case 'd_{BX}':
            let value = Math.round(o.value*Math.pow(10,cs.A0597616.CM_PRECISION))/Math.pow(10,cs.A0597616.CM_PRECISION);
            value = Math.max(value,1/Math.pow(10,cs.A0597616.CM_PRECISION));
            if (vs[o.uniqueId].B !== undefined && vs[o.uniqueId].B < 65) {value = Math.min(value,Math.round(Math.pow(10,cs.A0597616.CM_PRECISION)*3-1)/Math.pow(10,cs.A0597616.CM_PRECISION));}
            o.desmos.setExpression({id:'labelBX',label:''+value+' cm'});
            break;
        } */
       },
      /* ←— label_noCorrection ————————————————————————————————————————————→ */
       label_noCorrection: function(options={}) {
        let o = hs.parseOptions(options);
        let value = Math.round(o.value);
        vs[o.uniqueId].B = value;
        o.desmos.setExpression({id:'labelB',label:''+value+'°'});
        if (0 < value && value < 155) {
          o.desmos.setExpression({id:'labelX',label:''+Math.round(155-value)+'°',showLabel:true});
          let AX = Math.round(Math.pow(10,cs.A0597616.CM_PRECISION)*3*Math.sin(Math.PI*o.value/180)/Math.sin(Math.PI*((155-o.value)/180)))/Math.pow(10,cs.A0597616.CM_PRECISION);
          let BX = Math.round(Math.pow(10,cs.A0597616.CM_PRECISION)*3*Math.sin(Math.PI*25/180)/Math.sin(Math.PI*((155-o.value)/180)))/Math.pow(10,cs.A0597616.CM_PRECISION);
          o.desmos.setExpressions([
            {id:'labelAX',label:''+AX+' cm',showLabel:true},
            {id:'labelBX',label:''+BX+' cm',showLabel:true}
          ]);
        } else {o.desmos.setExpressions([
          {id:'labelX',showLabel:false},
          {id:'labelAX',showLabel:false},
          {id:'labelBX',showLabel:false}
        ]);}
       }
     };

    /* ←— A0596392 FUNCTIONS ——————————————————————————————————————————————→ */
     fs.A0596392 = {
      /* ←— init ————————————————————————————————————————————————————————————→ */
       init: function(options={}) {
        let o = hs.parseOptions(options);
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
       labelTriAngles: function(options={},pointNames={A:'A',B:'B',C:'C'},prec=cs.precision.DEGREES) {
        let o = hs.parseOptions(options);
        let A = pointNames.A;
        let B = pointNames.B;
        let C = pointNames.C;
        let vertex = o.name[o.name.length-1];
        let val = Math.round(180*o.value/Math.PI*Math.pow(10,prec))/Math.pow(10,prec);
        let vars = vs[o.uniqueId]['triAngle'+A+B+C];
        let oldVal = vars[vertex];

        if (vars.upToDate === undefined) {o.log('Labeling angles of △'+A+B+C+' to '+prec+' decimal places.');}

        // Only update stuff if the one of the values has changed
        if (vars.upToDate === true && val === oldVal) {return;}

        // Calculate the value it should have to match the other two angles
        let calculated;
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
          o.desmos.setExpression({id:'label'+A,label:(/*'m∠'+A+' = '+*/vars[A]+'°')});
          o.desmos.setExpression({id:'label'+B,label:(/*'m∠'+B+' = '+*/vars[B]+'°')});
          o.desmos.setExpression({id:'label'+C,label:(/*'m∠'+C+' = '+*/vars[C]+'°')});
          vars.upToDate = true;
        } else {
          // If this angle is closer to its (re-)calculated value than the last one was, correct this one and let the others keep their original values.
          let newErr = Math.abs(180*o.value/Math.PI-calculated);
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

    /* ←— A0596347 FUNCTIONS ——————————————————————————————————————————————→ */
     fs.A0596347 = {
      /* ←— updateLabels ————————————————————————————————————————————————————→ *\
       | updates the blue equation label 
       |       
       | Hidden point must be authored with showLabel:true,
       | and the ID 782
       * ←———————————————————————————————————————————————————————————————————→ */
       updateLabels: function(options={}) {
        let o = hs.parseOptions(options);
        o.desmos.setExpression({id:'782',label:'y = −2x² + 4x'+(o.value<0?' − '+(-o.value):(o.value>0?' + '+o.value:''))});
       }
     };

    /* ←— A0597720 FUNCTIONS ——————————————————————————————————————————————→ */
     fs.A0597720 = {
      /* ←— labelEquation ————————————————————————————————————————————————————→ */
       labelEquation: function(options={}) {
        let o = hs.parseOptions(options);
        o.desmos.setExpression({id:'equation',label:''+(180-o.value)/*+'°'*/+' + '+o.value/*+'°'*/+' = 180'/*+'°'*/});
       }
     };

    /* ←— A0597522 FUNCTIONS ——————————————————————————————————————————————→ */
     fs.A0597522 = {
      /* ←— labelDiags ————————————————————————————————————————————————————→ */
       labelDiags: function(options={}) {
        let o = hs.parseOptions(options);
        function diags(n) {
          if(n === 3) {return 0;}
          else if((n<1)||(n%1 !== 0)) {return undefined;}
          else {return diags(n-1)+n-2;}
        }
        o.desmos.setExpressions([
          {id:'n_sides',latex:'n_{sides}='+o.value},
          {id:'diagLabel',label:''+diags(o.value)+' diagonals'}
          ]);
       }
     };

    /* ←— A0597744 FUNCTIONS ——————————————————————————————————————————————→ */
      /* ←— A0597744 Constants ——————————————————————————————————————————————→ */
       cs.A0597744 = {PRECISION:10};
     fs.A0597744 = {
      /* ←— init ————————————————————————————————————————————————————→ */
       init: function(options={}) {
        let o = hs.parseOptions(options);
        vs[o.uniqueId] = {};
        let vars = vs[o.uniqueId];
        let cons = cs.A0597744;

        vars.h = o.desmos.HelperExpression({latex:'h'});
        vars.k = o.desmos.HelperExpression({latex:'k'});
        vars.p = o.desmos.HelperExpression({latex:'p'});
        vars.a = o.desmos.HelperExpression({latex:'a'});
        vars.t = o.desmos.HelperExpression({latex:'P\\left(a\\right)'});

        vars.h.observe('numericValue.dragging',dragging);
        vars.k.observe('numericValue.dragging',dragging);
        vars.p.observe('numericValue.dragging',dragging);
        vars.a.observe('numericValue.dragging',dragging);
        vars.t.observe('numericValue.dragging',dragging);
        

        function dragging() {
          vars.dragged=true;

          vars.H=Math.round(cons.PRECISION*vars.h.numericValue)/cons.PRECISION;
          vars.K=Math.round(cons.PRECISION*vars.k.numericValue)/cons.PRECISION;
          vars.P=Math.round(cons.PRECISION*vars.p.numericValue)/cons.PRECISION;
          vars.A=Math.round(cons.PRECISION*vars.a.numericValue)/cons.PRECISION;
          vars.T=Math.round(cons.PRECISION*vars.t.numericValue)/cons.PRECISION;
          let f = Math.round(cons.PRECISION*(vars.K+vars.P))/cons.PRECISION;
          let d = Math.round(cons.PRECISION*(vars.K-vars.P))/cons.PRECISION;
          let tx = Math.round(cons.PRECISION*(vars.H+vars.A))/cons.PRECISION;
          let ty = Math.round(cons.PRECISION*(vars.K+vars.T))/cons.PRECISION;

          o.desmos.setExpressions([
            {id:'liveParabola',hidden:false},
            {id:'focus',label:'focus '+hs.latexToText('('+vars.H+','+f+')')},
            {id:'vertex',label:'vertex '+hs.latexToText('('+vars.H+','+vars.K+')')},
            {id:'pMeasure',label:hs.latexToText('p='+vars.P)},
            {id:'directrix',label:'directrix '+hs.latexToText('y='+d)},
            {id:'equation',hidden:true,
              latex:'y'+((vars.K === 0)?'':((vars.K<0)?'+'+Math.abs(vars.K):'-'+vars.K))
                      +'='+((vars.P<0)?'-':'')+'\\frac{1}{4\\left('+Math.abs(vars.P)+'\\right)}'
                      +((vars.H === 0)?'x':
                        '\\left(x'
                         +((vars.H<0)?'+'+Math.abs(vars.H):'-'+vars.H)
                         +'\\right)')
                      +'^2'},
            {id:'tracePoint',label:hs.latexToText('\\left('+tx+','+ty+'\\right)')}
           ]);
         }
        
        function click() {
          document.removeEventListener('mousedown',click);
          document.removeEventListener('touchstart',click);

          o.desmos.setExpressions([
            {id:'equation',hidden:true},
            {id:'liveParabola',hidden:false}
           ]);
          /*
          vars.h.observe('numericValue.dragging',dragging);
          vars.k.observe('numericValue.dragging',dragging);
          vars.p.observe('numericValue.dragging',dragging);
          */
          document.addEventListener('mouseup',unclick);
          document.addEventListener('touchend',unclick);
         }

        function unclick() {
          document.removeEventListener('mouseup',unclick);
          document.removeEventListener('touchend',unclick);

          /*
          vars.h.unobserve('numericValue.dragging');
          vars.k.unobserve('numericValue.dragging');
          vars.p.unobserve('numericValue.dragging');

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
         }

        document.addEventListener('mousedown',click);
        document.addEventListener('touchstart',click); //*/
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
       dragging: function(options={}){
        let o = hs.parseOptions(options);
        let vars = vs[o.uniqueId];

        vars[o.name] = o.value;

        if (vars.dragging > -1) {return;}

        vars.dragging = o.name[o.name.length-1];

        o.desmos.setExpression({id:'x_'+(3-vars.dragging),latex:'x_'+(3-vars.dragging)+'='+vars['d'+(3-vars.dragging)].numericValue+'\\frac{'+((vars.dragging === 1)?'':'-')+'y_'+vars.dragging+'}{d_'+vars.dragging+'}'});
        o.desmos.setExpression({id:'y_'+(3-vars.dragging),latex:'y_'+(3-vars.dragging)+'='+vars['d'+(3-vars.dragging)].numericValue+'\\frac{'+((vars.dragging === 1)?'-':'')+'x_'+vars.dragging+'}{d_'+vars.dragging+'}'});
       }
     };

    /* ←— A0597631 FUNCTIONS ——————————————————————————————————————————————→ */
     fs.A0597631 = {
      /* ←— equation ——————————————————————————————————————————————————————→ *\
       | Updates the equation (expression) with the new value of `n`
       * ←—————————————————————————————————————————————————————————————————→ */
       equation: function(options={}) {
        let o = hs.parseOptions(options);
        o.desmos.setExpression({id:'equation',latex:'\\frac{180\\left('+o.value+'-2\\right)}{'+o.value+'}'});
        o.desmos.setExpression({id:'centroid',label:hs.latexToText('180⋅\\left('+o.value+'-2\\right)÷'+o.value+'='+(Math.round(18000*(o.value-2)/o.value)/100))});
       }
     };

    /* ←— A0597560 FUNCTIONS ——————————————————————————————————————————————→ */
     fs.A0597560 = {
      /* ←— init ——————————————————————————————————————————————————————————→ *\
       | Updates the equation (expression) with the new angles
       * ←—————————————————————————————————————————————————————————————————→ */
       init: function(options={}) {
        let o = hs.parseOptions(options);
        let vars = vs[o.uniqueId] = {
          A:o.desmos.HelperExpression({latex:'m_A'}),
          B:o.desmos.HelperExpression({latex:'m_B'}),
          C:o.desmos.HelperExpression({latex:'m_C'})
        };

        function updateEquation() {
          o.desmos.setExpression({
            id:'equation',
            label:''+vars.A.numericValue+' + '
                    +vars.B.numericValue+' + '
                    +vars.C.numericValue+' = 180'
          });
        }

        vars.A.observe('numericValue',updateEquation);
        vars.B.observe('numericValue',updateEquation);
        vars.C.observe('numericValue',updateEquation);

        o.desmos.observe('graphpaperBounds',function(){
          o.desmos.setExpression({
            id:'equation',
            latex:'\\left(0,'+hs.number(o.desmos.graphpaperBounds.mathCoordinates.bottom+
                                (36*o.desmos.graphpaperBounds.mathCoordinates.height/
                                  o.desmos.graphpaperBounds.pixelCoordinates.height
                                ))+'\\right)'
          });
        });
      }
     };

    /* ←— A0598528 FUNCTIONS ——————————————————————————————————————————————→ */
     fs.A0598528 = {
      /* ←— showHideQRST ——————————————————————————————————————————————————→ *\
       | Shows or hides QRST
       * ←—————————————————————————————————————————————————————————————————→ */
       showHideQRST: function(options={}) {
        let o = hs.parseOptions(options);
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
       showHideEFGH: function(options={}) {
        let o = hs.parseOptions(options);
        o.desmos.setExpressions([
          {id:'EdgesEFGH',type:'table',columns:[{},{hidden:o.value}]},
          {id:'E',hidden:o.value,showLabel:(!(o.value))},
          {id:'F',hidden:o.value,showLabel:(!(o.value))},
          {id:'G',hidden:o.value,showLabel:(!(o.value))},
          {id:'H',hidden:o.value,showLabel:(!(o.value))}
         ]);
       }
     };

    /* ←— A0597563 FUNCTIONS ——————————————————————————————————————————————→ */
     fs.A0597563 = {
      /* ←— init ——————————————————————————————————————————————————————————→ *\
       | Updates the equation (expression) with the new angles
       * ←—————————————————————————————————————————————————————————————————→ */
       init: function(options={}) {
        let o = hs.parseOptions(options);
        let vars = vs[o.uniqueId] = {
          A:o.desmos.HelperExpression({latex:'m_A'}),
          B:o.desmos.HelperExpression({latex:'m_B'}),
          C:o.desmos.HelperExpression({latex:'m_C'})
        };

        function updateEquation() {
          o.desmos.setExpression({
            id:'equation',
            label:''+vars.A.numericValue+' = '
                    +vars.B.numericValue+' + '
                    +vars.C.numericValue
          });
        }

        vars.A.observe('numericValue',updateEquation);
        vars.B.observe('numericValue',updateEquation);
        vars.C.observe('numericValue',updateEquation);

        o.desmos.observe('graphpaperBounds',function(){
          o.desmos.setExpression({
            id:'equation',
            latex:'\\left(0,'+hs.number(o.desmos.graphpaperBounds.mathCoordinates.bottom+
                                (36*o.desmos.graphpaperBounds.mathCoordinates.height/
                                  o.desmos.graphpaperBounds.pixelCoordinates.height
                                ))+'\\right)'
          });
        });
      }
     };

    /* ←— A0598839 FUNCTIONS ——————————————————————————————————————————————→ */
     fs.A0598839 = {
      /* ←— init ——————————————————————————————————————————————————————————→ *\
       | sets the
       * ←—————————————————————————————————————————————————————————————————→ */
       init: function(options={}) {
        let o = hs.parseOptions(options);
        let vars = vs[o.uniqueId] = {
          orange:1,
          blue:1
        };
       },
       orange: function(options={}) {
        let o = hs.parseOptions(options);
        vs[o.uniqueId].orange = o.value;
        fs.A0598839.setPlanes(options);
       },
       blue: function(options={}) {
        let o = hs.parseOptions(options);
        vs[o.uniqueId].blue = o.value;
        fs.A0598839.setPlanes(options);
       },
       setPlanes: function(options={}) {
        let o = hs.parseOptions(options);
        let orange = vs[o.uniqueId].orange;
        let blue = vs[o.uniqueId].blue;

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

    /* ←— A0596385 FUNCTIONS ——————————————————————————————————————————————→ */
     fs.A0596385 = {
      /* ←— init ————————————————————————————————————————————————————————————→ */
       init: function(options={}) {
        let o = hs.parseOptions(options);
        vs[o.uniqueId] = {triAngleABC:{prevError:0,A:0,B:0,C:0}};
       },
      /* ←— updateAngles ————————————————————————————————————————————————————→ *\
       | updates the labels of the triangle's vertices with their respective
       | angle measures.
       * ←———————————————————————————————————————————————————————————————————→ */
       updateAngles: function(options={}) {
        let o = hs.parseOptions(options);
        let vertex = o.name[o.name.length-1];
        let val = Math.round(180*o.value/Math.PI);
        let vars = vs[o.uniqueId].triAngleABC;
        let oldVal = vars[vertex];

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
       drawExtensions: function(options={}) {
        let o = hs.parseOptions(options);
        let obtuse = (o.name[o.name.length-1] === 'A')?1:((o.name[o.name.length-1] === 'B')?2:3);
        let Ext1 = hs.ALPHA[obtuse%3+1];
        let ext1 = hs.alpha[obtuse%3+1];
        let Ext2 = hs.ALPHA[(obtuse+1)%3+1];
        let ext2 = hs.alpha[(obtuse+1)%3+1];
        obtuse = hs.ALPHA[obtuse];
        let exprs = [];

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
       init: function(options={}) {
        let o = hs.parseOptions(options);
        let vars = vs[o.uniqueId] = {lastDragged:0,placeholder:0};
        let hfs = vars.helperFunctions = {n:o.desmos.HelperExpression({latex:'n'}),showDiagonals:o.desmos.HelperExpression({latex:'d_{iags}'})};
        o.log(hfs);
        let cons = cs.A0597629;
        let i;
        let j;

        vars.belayCorrection = true;

        // Set up variables and observers for vertices of each polygon
         for(i=1;i<=cons.MAX_VERTICES;i+=1) {
          // Track x & y for this vertex
          vars["x_"+i] = o.desmos.HelperExpression({latex:hs.sub('x',i)});
          vars["y_"+i] = o.desmos.HelperExpression({latex:hs.sub('y',i)});
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
          hfs["x_"+i] = (function(i){return function(){
            fs.A0597629.coordinateChanged({
              name:hs.sub('x',i),
              value:vars['x_'+i].numericValue,
              desmos:o.desmos,
              uniqueId:o.uniqueId,
              log:o.log
            });
          };})(i);
          hfs['y_'+i] = (function(i){return function(){fs.A0597629.coordinateChanged({
            name:hs.sub('y',i),
            value:vars['y_'+i].numericValue,
            desmos:o.desmos,
            uniqueId:o.uniqueId,
            log:o.log
          });};})(i);
          vars["x_"+i].observe('numericValue.correction',hfs['x_'+i]);
          vars['y_'+i].observe('numericValue.correction',hfs['y_'+i]);
         }

         // 

        // Let the user turn the diagonals on and off
        hfs.showDiagonals.observe('numericValue',function(){
          let exprs = [];
          for (i = 3; i < hfs.n.numericValue; i+=1) {
            exprs.push({
              id:'segment_'+hs.ALPHA[i]+'A',
              hidden:(vars.helperFunctions.showDiagonals.numericValue === 0)
            });
          }
          exprs.push({
            id:'centroid-1',
            showLabel:(vars.helperFunctions.showDiagonals.numericValue === 1)
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
          }
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
       setPlaceholder: function(options={},i=0) {
        let o = hs.parseOptions(options);
        let vars = vs[o.uniqueId];
        let n = vars.n;

        let j;

        // move the placeholder to the location of the vertex to hold place
        o.desmos.setExpression({id:'x_0',latex:'x_0='+Math.round(vars[n]['x_'+i]*Math.pow(10,cs.precision.FLOAT_PRECISION))/Math.pow(10,cs.precision.FLOAT_PRECISION)});
        o.desmos.setExpression({id:'y_0',latex:'y_0='+Math.round(vars[n]['y_'+i]*Math.pow(10,cs.precision.FLOAT_PRECISION))/Math.pow(10,cs.precision.FLOAT_PRECISION)});

        if (i === vars.placeholder) {return;} // The rest of this stuff only needs to be done the first time

        o.log('Adding placeholder '+hs.ALPHA[i]);

        vars.placeholder = i;
        let cons = cs.A0597629;

        // make the placeholder visible, and the dragged vertex invisible
        o.desmos.setExpression({id:'placeholder_vertex',hidden:false,showLabel:true,label:hs.ALPHA[i],dragMode:Desmos.DragModes.NONE});
        o.desmos.setExpression({id:'vertex_'+hs.ALPHA[i],showLabel:false,color:cons.HIDDEN_COLOR});

        // Attach the vertex to its edges and diagonals
        if (i === 1) {
          // Attach placeholder to B
          o.desmos.setExpression({
            id:'segment_AB',
            latex:cons.SEGMENT_TEMPLATE.replace(/U/g,'0').replace(/V/g,'2')
          });
          // Attach every other vertex to placeholder
          for (j = 3;j<=n;j+=1) {
            o.desmos.setExpression({
              id:'segment_'+hs.ALPHA[j]+'A',
              latex:cons.SEGMENT_TEMPLATE.replace(/([xy])_U/g,hs.sub('$1',j)).replace(/V/g,'0')
            });
          }
        } else {
          if (i === 2) {
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
            if (2 < i < n) {
              o.desmos.setExpression({
                id:'segment_'+hs.ALPHA[i]+'A',
                latex:cons.SEGMENT_TEMPLATE.replace(/U/g,'0').replace(/V/g,'1')
              });
            }
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

        let j;

        if (i === 0) {return;} // if it ain't broke, don't fix it

        o.log('Now clearing placeholder '+hs.ALPHA[i]);

        // Don't recorrect while clearing the placeholder
        if (hfs.correctionBuffer !== undefined) {window.clearTimeout(hfs.correctionBuffer);}
        vars.belayCorrection = true;

        // Move the place-held point to the placeholder
        o.desmos.setExpression({id:'x_'+i,latex:hs.sub('x',i)+'='+Math.round(vars[n]['x_'+i]*Math.pow(10,cs.precision.FLOAT_PRECISION))/Math.pow(10,cs.precision.FLOAT_PRECISION)});
        o.desmos.setExpression({id:'y_'+i,latex:hs.sub('y',i)+'='+Math.round(vars[n]['y_'+i]*Math.pow(10,cs.precision.FLOAT_PRECISION))/Math.pow(10,cs.precision.FLOAT_PRECISION)});

        hfs.correctionBuffer = window.setTimeout(function(){vars.belayCorrection = false;},cs.delay.SET_EXPRESSION);

        // Make the place-held point visible, and the placeholder invisible
        o.desmos.setExpression({id:'placeholder_vertex',hidden:true,showLabel:false});
        o.desmos.setExpression({id:'vertex_'+hs.ALPHA[i],showLabel:true,color:cons.VERTEX_COLOR});

        // Attach the vertex to its edges and diagonals
        if (i === 1) {
          // Attach A to B
          o.desmos.setExpression({
            id:'segment_AB',
            latex:cons.SEGMENT_TEMPLATE.replace(/U/g,'1').replace(/V/g,'2')
          });
          // Attach A to every other vertex
          for (j = 3;j<=n;j+=1) {
            o.desmos.setExpression({
              id:'segment_'+hs.ALPHA[j]+'A',
              latex:cons.SEGMENT_TEMPLATE.replace(/([xy])_U/g,hs.sub('$1',j)).replace(/V/g,'1')
            });
          }
        } else {
          if (i === 2) {
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
        if (vars.belayCorrection === true) {return;}
        let n = vars.n;
        let i = eval(o.name.match(/[0-9]+/)[0]);
        let newPoint = {x:vars['x_'+i].numericValue,y:vars['y_'+i].numericValue};

        let j;

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

        let constrained = hs.polygonConstrain(newPoint,vars.dragBoundaries);

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
       switchPolygon: function(options={}) {
        let o = hs.parseOptions(options);
        let vars = vs[o.uniqueId];
        let hfs = vars.helperFunctions;
        let cons = cs.A0597629;
        vars.belayCorrection = true;

        let i;

        fs.A0597629.clearPlaceholder(o);

        let prevn = vars.n;
        let n = vars.n = o.value;

        o.log("Changing from "+prevn+" sides to "+n+" sides");

        let exprs = [];

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
              hidden:(vars.helperFunctions.showDiagonals.numericValue === 0),
              style:cs.enum.lineType.DASHED,
              color:cs.color.agaColors.red
          });
          exprs.push({
              id:'segment_'+hs.ALPHA[i]+hs.ALPHA[i+1],
              hidden:false,
              style:cs.enum.lineType.SOLID,
              color:cs.color.agaColors.black
          });
        }

        // Style terminal edge
        exprs.push({
          id:'segment_'+hs.ALPHA[n]+'A',
          hidden:false,
          style:cs.enum.lineType.SOLID,
          color:cs.color.agaColors.black
        });

        // Update centroid and labels
        let x_centroid = 'x_{centroid}=\\frac{';
        for (i = 1; i < n; i+=1) {x_centroid+=(hs.sub('x',i)+'+');}
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

        if (hfs.correctionBuffer !== undefined) {window.clearTimeout(hfs.correctionBuffer);}

        o.desmos.setExpressions(exprs);

        // Reinitialize observers.
         for(i=1;i<=n;i+=1) {
          // Observe x
          vars["x_"+i].observe('numericValue.correction',hfs["x_"+i]);
          // Observe y
          vars["y_"+i].observe('numericValue.correction',hfs["y_"+i]);
         }

        hfs.correctionBuffer = window.setTimeout(function(){vars.belayCorrection = false;},cs.delay.LOAD);

       }
     };

    /* ←— A0597630 FUNCTIONS ——————————————————————————————————————————————→ */
      cs.A0597630 = {
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
     fs.A0597630 = {
      /* ←— init ————————————————————————————————————————————————————————————→ *\
       | Initializes the variables
       * ←———————————————————————————————————————————————————————————————————→ */
       init: function(options={},varparam={}) {
        let o = hs.parseOptions(options);
        let vars = vs[o.uniqueId] = Object.assign(varparam,{lastDragged:0,placeholder:0});
        let hfs = vars.helperFunctions = ((vars.helperFunctions === undefined)?{n:o.desmos.HelperExpression({latex:'n'})}:vars.helperFunctions);
        o.log(hfs);
        let cons = cs.A0597630;

        let i;
        let j;
        let n;

        vars.belayCorrection = true;


        // Set up watchers for each vertex of each polygon
         for(i=1;i<=cons.MAX_VERTICES;i+=1) {
          if (vars[i] === undefined) {
            vars["x_"+i] = o.desmos.HelperExpression({latex:hs.sub('x',i)});
            vars["y_"+i] = o.desmos.HelperExpression({latex:hs.sub('y',i)});
            vars[i]={};
          }
         }

        // Initialize Vertices
         if (hfs.n.numericValue === undefined) {
          o.log('n not yet initialized; delaying initialization by '+cs.delay.SET_EXPRESSION+'ms');
          setTimeout(function(){fs.A0597630.init(o,vars);},cs.delay.SET_EXPRESSION);
          return;
         }

         vars.n = hfs.n.numericValue;
         n = vars.n;
         

         for(i=1;i<=cons.MAX_VERTICES;i+=1) {
          if (i >= 3) {
            for(j=1;j<=i;j+=1) {
              if (i === n) {
                if (vars['x_'+j].numericValue === undefined || vars['y_'+j].numericValue === undefined) {
                  o.log('Vertex '+hs.ALPHA[j]+' not yet initialized; delaying initialization by '+cs.delay.SET_EXPRESSION+'ms');
                  setTimeout(function(){fs.A0597630.init(o,vars);},cs.delay.SET_EXPRESSION);
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
         for(i=1;i<=cons.MAX_VERTICES;i+=1) {
          // Set up polygon angle values for the polygon terminating in this vertex
          if (i > 3) {
            let newPoly = Object.assign({},vars[vars.polygonName+'_angles']);
            newPoly[hs.ALPHA[i]]=0;
            vars.polygonName+=hs.ALPHA[i];
            vars[vars.polygonName+'_angles'] = newPoly;
            vars[vars.polygonName+'_vertices'] = vars[i];
            o.log('Initializing '+vars.polygonName+' with angles:',vars[vars.polygonName+'_angles']);
          }
          // Set up observers for when the user drags a point
          hfs["x_"+i] = (function(i){return function(){fs.A0597630.coordinateChanged({
            name:hs.sub('x',i),
            value:vars['x_'+i].numericValue,
            desmos:o.desmos,
            uniqueId:o.uniqueId,
            log:o.log
          });};})(i);
          hfs['y_'+i] = (function(i){return function(){fs.A0597630.coordinateChanged({
            name:hs.sub('y',i),
            value:vars['y_'+i].numericValue,
            desmos:o.desmos,
            uniqueId:o.uniqueId,
            log:o.log
          });};})(i);
          vars["x_"+i].observe('numericValue.correction',hfs['x_'+i]);
          vars['y_'+i].observe('numericValue.correction',hfs['y_'+i]);
          o.log('Vertex '+hs.ALPHA[i]+' initialized at ('+vars['x_'+i].numericValue+', '+vars['y_'+i].numericValue+')');
         }
         vars.polygonName = vars.polygonName.slice(0,7+n);

         for (i = 1; i <= n; i+=1) {
          let asquared = Math.pow(vars[n]['x_'+((i+n-2)%n+1)]-vars[n]['x_'+i],2)+Math.pow(vars[n]['y_'+((i+n-2)%n+1)]-vars[n]['y_'+i],2);
          let bsquared = Math.pow(vars[n]['x_'+(i%n+1)]-vars[n]['x_'+i],2)+Math.pow(vars[n]['y_'+(i%n+1)]-vars[n]['y_'+i],2);
          let csquared = Math.pow(vars[n]['x_'+((i+n-2)%n+1)]-vars[n]['x_'+(i%n+1)],2)+Math.pow(vars[n]['y_'+((i+n-2)%n+1)]-vars[n]['y_'+(i%n+1)],2);
          vars['P_'+hs.ALPHA[i]] = 180*Math.acos((asquared+bsquared-csquared)/(2*Math.sqrt(asquared*bsquared)))/Math.PI;
         }

         fs.shared.label.labelPolyAngles(o,{refreshAll:true},cons.ANGLE_PRECISION);

        let expr = '';
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
       setPlaceholder: function(options={},i=0) {
        let o = hs.parseOptions(options);
        let vars = vs[o.uniqueId];
        let n = vars.n;

        let j;

        // move the placeholder to the location of the vertex to hold place
        o.desmos.setExpression({id:'x_0',latex:'x_0='+Math.round(vars[n]['x_'+i]*Math.pow(10,cs.precision.FLOAT_PRECISION))/Math.pow(10,cs.precision.FLOAT_PRECISION)});
        o.desmos.setExpression({id:'y_0',latex:'y_0='+Math.round(vars[n]['y_'+i]*Math.pow(10,cs.precision.FLOAT_PRECISION))/Math.pow(10,cs.precision.FLOAT_PRECISION)});

        if (i === vars.placeholder) {return;} // The rest of this stuff only needs to be done the first time

        o.log('Adding placeholder '+hs.ALPHA[i]);

        vars.placeholder = i;
        let cons = cs.A0597630;

        // make the placeholder visible, and the dragged vertex invisible
        o.desmos.setExpression({id:'placeholder_vertex',hidden:false,showLabel:true,label:hs.ALPHA[i],dragMode:Desmos.DragModes.NONE});
        o.desmos.setExpression({id:'vertex_'+hs.ALPHA[i],showLabel:false,color:cons.HIDDEN_COLOR});

        // Attach the angle label to the placeholder
        o.desmos.setExpression({
          id:'m_'+hs.ALPHA[i],
          latex:cs.A0597630.LABEL_TEMPLATE.replace(/U/g,hs.sub('',0)).replace(/Z/g,hs.sub('',i%n+1)).replace(/W/g,'P').replace(/Q/g,hs.ALPHA[(i+n-2)%n+1]).replace(/S/g,hs.ALPHA[i%n+1]).replace(/P_\{label/g,hs.ALPHA[i]+'_{label')
        });
        o.desmos.setExpression({
          id:'m_'+hs.ALPHA[(i+n-2)%n+1],
          latex:cs.A0597630.LABEL_TEMPLATE.replace(/U/g,hs.sub('',((i+n-2)%n+1))).replace(/Z/g,hs.sub('',0)).replace(/W/g,hs.ALPHA[(i+n-2)%n+1]).replace(/Q/g,'P').replace(/S/g,hs.ALPHA[(i+n-3)%n+1]).replace(/P_\{label/g,hs.ALPHA[(i+n-2)%n+1]+'_{label')
        });
        o.desmos.setExpression({
          id:'m_'+hs.ALPHA[i%n+1],
          latex:cs.A0597630.LABEL_TEMPLATE.replace(/U/g,hs.sub('',i%n+1)).replace(/Z/g,hs.sub('',(i+1)%n+1)).replace(/W/g,hs.ALPHA[i%n+1]).replace(/Q/g,hs.ALPHA[(i+1)%n+1]).replace(/S/g,'P').replace(/P_\{label/g,hs.ALPHA[i%n+1]+'_{label')
        });

        // Attach the vertex to its edges and diagonals
        if (i === 1) {
          // Attach placeholder to B
          o.desmos.setExpression({
            id:'segment_AB',
            latex:cons.SEGMENT_TEMPLATE.replace(/U/g,'0').replace(/V/g,'2')
          });
          // Attach every other vertex to placeholder
          for (j = 3;j<=n;j+=1) {
            o.desmos.setExpression({
              id:'segment_'+hs.ALPHA[j]+'A',
              latex:cons.SEGMENT_TEMPLATE.replace(/([xy])_U/g,hs.sub('$1',j)).replace(/V/g,'0')
            });
          }
        } else {
          if (i === 2) {
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
            if (2 < i < n) {
              o.desmos.setExpression({
                id:'segment_'+hs.ALPHA[i]+'A',
                latex:cons.SEGMENT_TEMPLATE.replace(/U/g,'0').replace(/V/g,'1')
              });
            }
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

        let j;

        if (i === 0) {return;} // if it ain't broke, don't fix it

        o.log('Now clearing placeholder '+hs.ALPHA[i]);

        // Don't recorrect while clearing the placeholder
        if (hfs.correctionBuffer !== undefined) {window.clearTimeout(hfs.correctionBuffer);}
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
          latex:cs.A0597630.LABEL_TEMPLATE.replace(/U/g,hs.sub('',((i+n-2)%n+1))).replace(/Z/g,hs.sub('',i)).replace(/W/g,hs.ALPHA[(i+n-2)%n+1]).replace(/Q/g,hs.ALPHA[i]).replace(/S/g,hs.ALPHA[(i+n-3)%n+1]).replace(/P_\{label/g,hs.ALPHA[(i+n-2)%n+1]+'_{label')
        });
        o.desmos.setExpression({
          id:'m_'+hs.ALPHA[i%n+1],
          latex:cs.A0597630.LABEL_TEMPLATE.replace(/U/g,hs.sub('',i%n+1)).replace(/Z/g,hs.sub('',(i+1)%n+1)).replace(/W/g,hs.ALPHA[i%n+1]).replace(/Q/g,hs.ALPHA[(i+1)%n+1]).replace(/S/g,hs.ALPHA[i]).replace(/P_\{label/g,hs.ALPHA[i%n+1]+'_{label')
        });

        hfs.correctionBuffer = window.setTimeout(function(){vars.belayCorrection = false;},cs.delay.SET_EXPRESSION);

        // Make the place-held point visible, and the placeholder invisible
        o.desmos.setExpression({id:'placeholder_vertex',hidden:true,showLabel:false});
        o.desmos.setExpression({id:'vertex_'+hs.ALPHA[i],showLabel:true,color:cons.VERTEX_COLOR});

        // Attach the vertex to its edges and diagonals
        if (i === 1) {
          // Attach A to B
          o.desmos.setExpression({
            id:'segment_AB',
            latex:cons.SEGMENT_TEMPLATE.replace(/U/g,'1').replace(/V/g,'2')
          });
          // Attach A to every other vertex
          for (j = 3;j<=n;j+=1) {
            o.desmos.setExpression({
              id:'segment_'+hs.ALPHA[j]+'A',
              latex:cons.SEGMENT_TEMPLATE.replace(/([xy])_U/g,hs.sub('$1',j)).replace(/V/g,'1')
            });
          }
        } else {
          if (i === 2) {
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
        let cons = cs.A0597630;
        if (vars.belayCorrection === true) {
          o.log('Belaying order to correct '+o.name);
          return;
        }
        let n = vars.n;
        let i = eval(o.name.match(/[0-9]+/)[0]);
        let newPoint = {x:vars['x_'+i].numericValue,y:vars['y_'+i].numericValue};

        if (i !== vars.lastDragged) {
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

          if (o.log === console.log) {
            vars.dragBoundaries.forEach(function(line,id) {
              o.desmos.setExpression({id:'boundary'+id,latex:'b_'+id+'\\left(x,y\\right)='+line.a+'x+'+line.b+'y+'+line.c});
            });
          }
        }

        let constrained = hs.polygonConstrain(newPoint,vars.dragBoundaries);

        if (constrained !== null) {
          vars[n]['x_'+i] = constrained.x;
          vars[n]['y_'+i] = constrained.y;
        }

        [(i+n-2)%n+1,i,i%n+1].forEach(function(j) {
          let asquared = Math.pow(vars[n]['x_'+((j+n-2)%n+1)]-vars[n]['x_'+j],2)+Math.pow(vars[n]['y_'+((j+n-2)%n+1)]-vars[n]['y_'+j],2);
          let bsquared = Math.pow(vars[n]['x_'+(j%n+1)]-vars[n]['x_'+j],2)+Math.pow(vars[n]['y_'+(j%n+1)]-vars[n]['y_'+j],2);
          let csquared = Math.pow(vars[n]['x_'+((j+n-2)%n+1)]-vars[n]['x_'+(j%n+1)],2)+Math.pow(vars[n]['y_'+((j+n-2)%n+1)]-vars[n]['y_'+(j%n+1)],2);
          vars['P_'+hs.ALPHA[j]] = 180*Math.acos((asquared+bsquared-csquared)/(2*Math.sqrt(asquared*bsquared)))/Math.PI;
        });

        fs.shared.label.labelPolyAngles(Object.assign({},o,{name:'m_'+hs.ALPHA[i],value:vars['P_'+hs.ALPHA[i]]}),{},cons.ANGLE_PRECISION);

        let expr = '';
        let j;
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
          fs.A0597630.clearPlaceholder(o);
        } else {
          fs.A0597630.setPlaceholder(o,i);
        }
       },
      /* ←— switchPolygon ———————————————————————————————————————————————————→ *\
       | Adds and removes vertices and edges
       | Restyles diagonals
       | Restores coordinates
       * ←———————————————————————————————————————————————————————————————————→ */
       switchPolygon: function(options={}) {
        let o = hs.parseOptions(options);
        let vars = vs[o.uniqueId];
        let hfs = vars.helperFunctions;
        let cons = cs.A0597630;
        vars.belayCorrection = true;

        let i;

        fs.A0597630.clearPlaceholder(o);

        let prevn = vars.n;
        let n = vars.n = o.value;
        vars.polygonName = 'polygonABCDEFGHIJKLMNOPQRSTUVWXYZ'.slice(0,7+n);

        o.log("Changing from "+prevn+" sides to "+n+" sides");

        let exprs = [];

        // Move terminal vertex
         exprs.push({
          id:'segment_'+hs.ALPHA[prevn]+'A',
          hidden:true
         });
         exprs.push({
          id:'m_A',
          latex:cs.A0597630.LABEL_TEMPLATE.replace(/U/g,hs.sub('',1)).replace(/Z/g,hs.sub('',2)).replace(/W/g,'A').replace(/Q/g,hs.ALPHA[n]).replace(/S/g,'B')
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
          o.log(cs.A0597630.LABEL_TEMPLATE.replace(/U/g,hs.sub('',i)).replace(/Z/g,hs.sub('',i%n+1)).replace(/W/g,hs.ALPHA[i]).replace(/Q/g,hs.ALPHA[(i+n-2)%n+1]).replace(/S/g,hs.ALPHA[i%n+1]));
          exprs.push({
            id:'m_'+hs.ALPHA[i],
            showLabel:true,
            latex:cs.A0597630.LABEL_TEMPLATE.replace(/U/g,hs.sub('',i)).replace(/Z/g,hs.sub('',i%n+1)).replace(/W/g,hs.ALPHA[i]).replace(/Q/g,hs.ALPHA[(i+n-2)%n+1]).replace(/S/g,hs.ALPHA[i%n+1])
          });
         }

        // Update centroid and labels
         let x_centroid = 'x_{centroid}=\\frac{';
         for (i = 1; i < n; i+=1) {x_centroid+=(hs.sub('x',i)+'+');}
         x_centroid += (hs.sub('x',n)+'}{n}');
         exprs.push({
          id:'x_centroid',
          latex:x_centroid
         });
         exprs.push({
          id:'y_centroid',
          latex:x_centroid.replace(/x/g,'y')
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

        for (i = 1; i <= n; i+=1) {
          let asquared = Math.pow(vars[n]['x_'+((i+n-2)%n+1)]-vars[n]['x_'+i],2)+Math.pow(vars[n]['y_'+((i+n-2)%n+1)]-vars[n]['y_'+i],2);
          let bsquared = Math.pow(vars[n]['x_'+(i%n+1)]-vars[n]['x_'+i],2)+Math.pow(vars[n]['y_'+(i%n+1)]-vars[n]['y_'+i],2);
          let csquared = Math.pow(vars[n]['x_'+((i+n-2)%n+1)]-vars[n]['x_'+(i%n+1)],2)+Math.pow(vars[n]['y_'+((i+n-2)%n+1)]-vars[n]['y_'+(i%n+1)],2);
          vars['P_'+hs.ALPHA[i]] = 180*Math.acos((asquared+bsquared-csquared)/(2*Math.sqrt(asquared*bsquared)))/Math.PI;
        }

        fs.shared.label.labelPolyAngles(o,{refreshAll:true},cons.ANGLE_PRECISION);

        let expr = '';
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

        if (hfs.correctionBuffer !== undefined) {window.clearTimeout(hfs.correctionBuffer);}

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
       init: function(options={},varparam={}) {
        let o = hs.parseOptions(options);
        let vars = vs[o.uniqueId] = Object.assign(varparam,{lastDragged:0,placeholder:0});
        let hfs = vars.helperFunctions = ((vars.helperFunctions === undefined)?{n:o.desmos.HelperExpression({latex:'n'})}:vars.helperFunctions);
        o.log(hfs);
        let cons = cs.A0597634;
        cons.EXTENSION_TEMPLATE = cons.EXTENSION_TEMPLATE.replace(/W/g,cons.EXTENSION_LENGTH);

        let i;
        let j;

        vars.belayCorrection = true;


        // Set up watchers for each vertex of each polygon
         for(i=1;i<=cons.MAX_VERTICES;i+=1) {
          if (vars[i] === undefined) {
            vars["x_"+i] = o.desmos.HelperExpression({latex:hs.sub('x',i)});
            vars["y_"+i] = o.desmos.HelperExpression({latex:hs.sub('y',i)});
            vars[i]={};
          }
         }

        // Initialize Vertices
         if (hfs.n.numericValue === undefined) {
          o.log('n not yet initialized; delaying initialization by '+cs.delay.SET_EXPRESSION+'ms');
          setTimeout(function(){fs.A0597634.init(o,vars);},cs.delay.SET_EXPRESSION);
          return;
         }
         // else
         let n = vars.n = hfs.n.numericValue;

         for(i=1;i<=cons.MAX_VERTICES;i+=1) {
          if (i >= 3) {
            for(j=1;j<=i;j+=1) {
              if (i === n) {
                if (vars['x_'+j].numericValue === undefined || vars['y_'+j].numericValue === undefined) {
                  o.log('Vertex '+hs.ALPHA[j]+' not yet initialized; delaying initialization by '+cs.delay.SET_EXPRESSION+'ms');
                  setTimeout(function(){fs.A0597634.init(o,vars);},cs.delay.SET_EXPRESSION);
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
         for(i=1;i<=cons.MAX_VERTICES;i+=1) {
          // Set up polygon angle values for the polygon terminating in this vertex
          if (i > 3) {
            let newPoly = Object.assign({},vars[vars.polygonName+'_angles']);
            newPoly[hs.ALPHA[i]]=0;
            vars.polygonName+=hs.ALPHA[i];
            vars[vars.polygonName+'_angles'] = newPoly;
            vars[vars.polygonName+'_vertices'] = vars[i];
            o.log('Initializing '+vars.polygonName+' with angles:',vars[vars.polygonName+'_angles']);
          }
          // Set up observers for when the user drags a point
          hfs["x_"+i] = (function(i){return function(){fs.A0597634.coordinateChanged({
            name:hs.sub('x',i),
            value:vars['x_'+i].numericValue,
            desmos:o.desmos,
            uniqueId:o.uniqueId,
            log:o.log
          });};})(i);
          hfs['y_'+i] = (function(i){return function(){fs.A0597634.coordinateChanged({
            name:hs.sub('y',i),
            value:vars['y_'+i].numericValue,
            desmos:o.desmos,
            uniqueId:o.uniqueId,
            log:o.log
          });};})(i);
          vars["x_"+i].observe('numericValue.correction',hfs['x_'+i]);
          vars['y_'+i].observe('numericValue.correction',hfs['y_'+i]);
          o.log('Vertex '+hs.ALPHA[i]+' initialized at ('+vars['x_'+i].numericValue+', '+vars['y_'+i].numericValue+')');
         }
         vars.polygonName = vars.polygonName.slice(0,7+n);

         for (i = 1; i <= n; i+=1) {
          let asquared = Math.pow(vars[n]['x_'+((i+n-2)%n+1)]-vars[n]['x_'+i],2)+Math.pow(vars[n]['y_'+((i+n-2)%n+1)]-vars[n]['y_'+i],2);
          let bsquared = Math.pow(vars[n]['x_'+(i%n+1)]-vars[n]['x_'+i],2)+Math.pow(vars[n]['y_'+(i%n+1)]-vars[n]['y_'+i],2);
          let csquared = Math.pow(vars[n]['x_'+((i+n-2)%n+1)]-vars[n]['x_'+(i%n+1)],2)+Math.pow(vars[n]['y_'+((i+n-2)%n+1)]-vars[n]['y_'+(i%n+1)],2);
          vars['P_'+hs.ALPHA[i]] = 180*Math.acos((asquared+bsquared-csquared)/(2*Math.sqrt(asquared*bsquared)))/Math.PI;
         }

         fs.shared.label.labelPolyAngles(o,{refreshAll:true,exterior:true},cons.ANGLE_PRECISION);

        let expr = '';
        for (j = 1;j <= n;j+=1) {expr+=((Math.round(180*Math.pow(10,cons.ANGLE_PRECISION)-vars[vars.polygonName+'_angles'][hs.ALPHA[j]])/Math.pow(10,cons.ANGLE_PRECISION))+'+');}
        expr = expr.slice(0,expr.length-1);
        o.desmos.setExpression({id:'sum',latex:expr});
        o.desmos.setExpression({id:'centroid',label:hs.latexToText(expr+'=360')});

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
       setPlaceholder: function(options={},i=0) {
        let o = hs.parseOptions(options);
        let vars = vs[o.uniqueId];
        let n = vars.n;

        let j;

        // move the placeholder to the location of the vertex to hold place
        o.desmos.setExpression({id:'x_0',latex:'x_0='+Math.round(vars[n]['x_'+i]*Math.pow(10,cs.precision.FLOAT_PRECISION))/Math.pow(10,cs.precision.FLOAT_PRECISION)});
        o.desmos.setExpression({id:'y_0',latex:'y_0='+Math.round(vars[n]['y_'+i]*Math.pow(10,cs.precision.FLOAT_PRECISION))/Math.pow(10,cs.precision.FLOAT_PRECISION)});

        if (i === vars.placeholder) {return;} // The rest of this stuff only needs to be done the first time

        o.log('Adding placeholder '+hs.ALPHA[i]);

        vars.placeholder = i;
        let cons = cs.A0597634;

        // make the placeholder visible, and the dragged vertex invisible
        o.desmos.setExpression({id:'placeholder_vertex',hidden:false,showLabel:true,label:hs.ALPHA[i],dragMode:Desmos.DragModes.NONE});
        o.desmos.setExpression({id:'vertex_'+hs.ALPHA[i],showLabel:false,color:cons.HIDDEN_COLOR});

        // Attach the angle label to the placeholder
        o.desmos.setExpression({
          id:'m_'+hs.ALPHA[i],
          latex:cs.A0597634.LABEL_TEMPLATE.replace(/U/g,hs.sub('',0)).replace(/Z/g,hs.sub('',i%n+1)).replace(/W/g,'P').replace(/Q/g,hs.ALPHA[(i+n-2)%n+1]).replace(/S/g,hs.ALPHA[i%n+1]).replace(/P_\{label/g,hs.ALPHA[i]+'_{label')
        });
        o.desmos.setExpression({
          id:'m_'+hs.ALPHA[(i+n-2)%n+1],
          latex:cs.A0597634.LABEL_TEMPLATE.replace(/U/g,hs.sub('',((i+n-2)%n+1))).replace(/Z/g,hs.sub('',0)).replace(/W/g,hs.ALPHA[(i+n-2)%n+1]).replace(/Q/g,'P').replace(/S/g,hs.ALPHA[(i+n-3)%n+1]).replace(/P_\{label/g,hs.ALPHA[(i+n-2)%n+1]+'_{label')
        });
        o.desmos.setExpression({
          id:'m_'+hs.ALPHA[i%n+1],
          latex:cs.A0597634.LABEL_TEMPLATE.replace(/U/g,hs.sub('',i%n+1)).replace(/Z/g,hs.sub('',(i+1)%n+1)).replace(/W/g,hs.ALPHA[i%n+1]).replace(/Q/g,hs.ALPHA[(i+1)%n+1]).replace(/S/g,'P').replace(/P_\{label/g,hs.ALPHA[i%n+1]+'_{label')
        });

        // Attach the vertex to its edges and diagonals
        if (i === 1) {
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
          for (j = 3;j<=n;j+=1) {
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
          if (i === 2) {
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
            if (2 < i < n) {
              o.desmos.setExpression({
                id:'segment_'+hs.ALPHA[i]+'A',
                latex:cons.SEGMENT_TEMPLATE.replace(/U/g,'0').replace(/V/g,'1')
              });
            }
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

        let j;

        if (i === 0) {return;} // if it ain't broke, don't fix it

        o.log('Now clearing placeholder '+hs.ALPHA[i]);

        // Don't recorrect while clearing the placeholder
        if (hfs.correctionBuffer !== undefined) {window.clearTimeout(hfs.correctionBuffer);}
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
          latex:cs.A0597634.LABEL_TEMPLATE.replace(/U/g,hs.sub('',((i+n-2)%n+1))).replace(/Z/g,hs.sub('',i)).replace(/W/g,hs.ALPHA[(i+n-2)%n+1]).replace(/Q/g,hs.ALPHA[i]).replace(/S/g,hs.ALPHA[(i+n-3)%n+1]).replace(/P_\{label/g,hs.ALPHA[(i+n-2)%n+1]+'_{label')
        });
        o.desmos.setExpression({
          id:'m_'+hs.ALPHA[i%n+1],
          latex:cs.A0597634.LABEL_TEMPLATE.replace(/U/g,hs.sub('',i%n+1)).replace(/Z/g,hs.sub('',(i+1)%n+1)).replace(/W/g,hs.ALPHA[i%n+1]).replace(/Q/g,hs.ALPHA[(i+1)%n+1]).replace(/S/g,hs.ALPHA[i]).replace(/P_\{label/g,hs.ALPHA[i%n+1]+'_{label')
        });

        hfs.correctionBuffer = window.setTimeout(function(){vars.belayCorrection = false;},cs.delay.SET_EXPRESSION);

        // Make the place-held point visible, and the placeholder invisible
        o.desmos.setExpression({id:'placeholder_vertex',hidden:true,showLabel:false});
        o.desmos.setExpression({id:'vertex_'+hs.ALPHA[i],showLabel:true,color:cons.VERTEX_COLOR});

        // Attach the vertex to its edges and diagonals
        if (i === 1) {
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
          for (j = 3;j<=n;j+=1) {
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
          if (i === 2) {
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

        let j;

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

        let constrained = hs.polygonConstrain(newPoint,vars.dragBoundaries);

        if (constrained !== null) {
          vars[n]['x_'+i] = constrained.x;
          vars[n]['y_'+i] = constrained.y;
        }

        [(i+n-2)%n+1,i,i%n+1].forEach(function(j){
          let asquared = Math.pow(vars[n]['x_'+((j+n-2)%n+1)]-vars[n]['x_'+j],2)+Math.pow(vars[n]['y_'+((j+n-2)%n+1)]-vars[n]['y_'+j],2);
          let bsquared = Math.pow(vars[n]['x_'+(j%n+1)]-vars[n]['x_'+j],2)+Math.pow(vars[n]['y_'+(j%n+1)]-vars[n]['y_'+j],2);
          let csquared = Math.pow(vars[n]['x_'+((j+n-2)%n+1)]-vars[n]['x_'+(j%n+1)],2)+Math.pow(vars[n]['y_'+((j+n-2)%n+1)]-vars[n]['y_'+(j%n+1)],2);
          vars['P_'+hs.ALPHA[j]] = 180*Math.acos((asquared+bsquared-csquared)/(2*Math.sqrt(asquared*bsquared)))/Math.PI;
        });

        fs.shared.label.labelPolyAngles(Object.assign({},o,{name:'m_'+hs.ALPHA[i],value:vars['P_'+hs.ALPHA[i]]}),{exterior:true},cons.ANGLE_PRECISION);

        let expr = '';
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
       switchPolygon: function(options={}) {
        let o = hs.parseOptions(options);
        let vars = vs[o.uniqueId];
        let hfs = vars.helperFunctions;
        let cons = cs.A0597634;
        vars.belayCorrection = true;

        let i;
        let j;

        fs.A0597634.clearPlaceholder(o);

        let prevn = vars.n;
        let n = vars.n = o.value;
        vars.polygonName = 'polygonABCDEFGHIJKLMNOPQRSTUVWXYZ'.slice(0,7+n);

        o.log("Changing from "+prevn+" sides to "+n+" sides");

        let exprs = [];

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
          latex:cs.A0597634.LABEL_TEMPLATE.replace(/U/g,hs.sub('',1)).replace(/Z/g,hs.sub('',2)).replace(/W/g,'A').replace(/Q/g,hs.ALPHA[n]).replace(/S/g,'B')
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
          o.log(cs.A0597634.LABEL_TEMPLATE.replace(/U/g,hs.sub('',i)).replace(/Z/g,hs.sub('',i%n+1)).replace(/W/g,hs.ALPHA[i]).replace(/Q/g,hs.ALPHA[(i+n-2)%n+1]).replace(/S/g,hs.ALPHA[i%n+1]));
          exprs.push({
            id:'m_'+hs.ALPHA[i],
            showLabel:true,
            latex:cs.A0597634.LABEL_TEMPLATE.replace(/U/g,hs.sub('',i)).replace(/Z/g,hs.sub('',i%n+1)).replace(/W/g,hs.ALPHA[i]).replace(/Q/g,hs.ALPHA[(i+n-2)%n+1]).replace(/S/g,hs.ALPHA[i%n+1])
          });
         }

        // Update centroid and labels
         let x_centroid = 'x_{centroid}=\\frac{';
         for (i = 1; i < n; i+=1) {x_centroid+=(hs.sub('x',i)+'+');}
         x_centroid += (hs.sub('x',n)+'}{n}');
         exprs.push({
          id:'x_centroid',
          latex:x_centroid
         });
         exprs.push({
          id:'y_centroid',
          latex:x_centroid.replace(/x/g,'y')
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

        for (i = 1; i <= n; i+=1) {
          let asquared = Math.pow(vars[n]['x_'+((i+n-2)%n+1)]-vars[n]['x_'+i],2)+Math.pow(vars[n]['y_'+((i+n-2)%n+1)]-vars[n]['y_'+i],2);
          let bsquared = Math.pow(vars[n]['x_'+(i%n+1)]-vars[n]['x_'+i],2)+Math.pow(vars[n]['y_'+(i%n+1)]-vars[n]['y_'+i],2);
          let csquared = Math.pow(vars[n]['x_'+((i+n-2)%n+1)]-vars[n]['x_'+(i%n+1)],2)+Math.pow(vars[n]['y_'+((i+n-2)%n+1)]-vars[n]['y_'+(i%n+1)],2);
          vars['P_'+hs.ALPHA[i]] = 180*Math.acos((asquared+bsquared-csquared)/(2*Math.sqrt(asquared*bsquared)))/Math.PI;
        }

        fs.shared.label.labelPolyAngles(o,{refreshAll:true,exterior:true},cons.ANGLE_PRECISION);

        let expr = '';
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

        if (hfs.correctionBuffer !== undefined) {window.clearTimeout(hfs.correctionBuffer);}

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
        let vars = vs[o.uniqueId] = {draggingPoint:null,dragging:false};
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
          Object.keys(hxs).forEach(function(helper) {hxs[helper].unobserve('numericValue.dragging');});

          document.addEventListener('mouseup',unclick);
          document.addEventListener('touchend',unclick);

          vars.dragging = true;
          let exprs = [
            {id:'intersection',hidden:(which[2] !== '1')},
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
              }
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
              }
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

          let exprs = [
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
          if (vars.placeholder !== undefined) {clearPlaceholder();}

          adjustHandles();

          let exprs = [
            {id:'x_0',latex:'x_0=u_0'},
            {id:'y_0',latex:'y_0=v_0'},
            {id:'x_1',latex:'x_1=u_1'},
            {id:'y_1',latex:'y_1=v_1'}
          ];

          let intersection = {x:hxs.u_1.numericValue,y:hxs.v_1.numericValue};
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

          Object.keys(hxs).forEach(function(helper) {
            if (/[uvwz]_/.test(helper)) {
              hxs[helper].observe(
                'numericValue.dragging',
                function(){if(vars.dragging){isolateHandle(helper);}}
              );
            }
          });
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
          if (vars.placeholder === undefined) {return;}
          vars.belayUntil = Date.now() + cs.delay.EXECUTE_HELPER;

          let exprs = [];
          let corrected;

          switch (draggingPoint) {
            case 'center':
              corrected = hs.circleConstrain(
                {x:hxs.u_0.numericValue,y:hxs.v_0.numericValue},
                vars.constrainingCircle,cs.enum.INTERIOR
              );
              exprs.push({id:'center',color:cs.A0597772.CENTER_COLOR});
              break;
            case 'intersection':
              corrected = hs.circleConstrain(
                {x:hxs.u_1.numericValue,y:hxs.v_1.numericValue},
                vars.constrainingCircle,cs.enum.INTERIOR
              );
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
            vars.placeholder = ((draggingPoint === 'center')?0:1);
            exprs.push({id:draggingPoint,color:cs.A0597772.HIDDEN_COLOR});
            exprs.push({
              id:'placeholder',
              latex:'\\left(x_#,y_#\\right)'.replace(/#/g,vars.placeholder),
              hidden:false,
              dragMode:Desmos.DragModes.XY
            });
          } else {return;}
          o.desmos.setExpressions(exprs);
         }

        function correctIt(draggingPoint=vars.draggingPoint) {
          let point;
          let corrected;

          o.log('Correcting It; dragging point = '+draggingPoint);
          switch (draggingPoint) {
            case 'center':
              if (hxs.D.numericValue < hxs.R.numericValue-cs.distance.CONSTRAIN_BUFFER) {
                if (vars.placeholder !== undefined) {clearPlaceholder();}
                return;
              }
              if (vars.constrainingCircle === undefined) {vars.constrainingCircle = {x:hxs.u_1.numericValue,y:hxs.v_1.numericValue,r:hxs.R.numericValue};}
              if (vars.dragging === true) {setPlaceholder(draggingPoint);}
              else {
                point = {x:hxs.u_0.numericValue,y:hxs.v_0.numericValue};
                corrected = hs.circleConstrain(point,vars.constrainingCircle,cs.enum.INTERIOR);
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
              if (hxs.D.numericValue < hxs.R.numericValue-cs.distance.CONSTRAIN_BUFFER) {
                if (vars.placeholder !== undefined) {clearPlaceholder();}
                return;
              }
              if (vars.constrainingCircle === undefined) {vars.constrainingCircle = {x:hxs.u_0.numericValue,y:hxs.v_0.numericValue,r:hxs.R.numericValue};}
              if (vars.dragging === true) {setPlaceholder(draggingPoint);}
              else {
                point = {x:hxs.u_1.numericValue,y:hxs.v_1.numericValue};
                corrected = hs.circleConstrain(point,vars.constrainingCircle,cs.enum.INTERIOR);
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
         }

        function click() {
          vars.dragging=true;
          // escape();
        }

        function unclick() {
          vars.dragging=false;
          vars.draggingPoint = undefined;
          document.removeEventListener('mouseup',unclick);
          document.removeEventListener('touchend',unclick);
          // escape();
          setTimeout(function(){
            if (vars === vs[o.uniqueId]) {replaceHandles();}
            else {escape();}
          },cs.delay.SET_EXPRESSION);
        }

        function escape() {
          document.removeEventListener('mousedown',click);
          document.removeEventListener('touchstart',click);
          document.removeEventListener('mouseup',unclick);
          document.removeEventListener('touchend',unclick);
        }

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
       init: function(options={}) {
        let o = hs.parseOptions(options);
        let vars = vs[o.uniqueId] = {draggingPoint:null,dragging:false};
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
          Object.keys(hxs).forEach(function(helper) {hxs[helper].unobserve('numericValue.dragging');});
          document.addEventListener('mouseup',unclick);
          document.addEventListener('touchend',unclick);

          // o.log(which+' changed.');


          vars.dragging = true;
          let exprs = [
            {id:'vertex_handle',hidden:(which[2] !== 'V')},
            {id:'H1near',hidden:(!(/H1near/.test(which)))},
            {id:'H1far',hidden:(!(/H1far/.test(which)))},
            {id:'H2near',hidden:(!(/H2near/.test(which)))},
            {id:'H2far',hidden:(!(/H2far/.test(which)))}//*/
          ];

          if (which[2] === 'H') {
            exprs.push({id:('theta_'+which[3]),latex:(cons.LEG_HANDLE.replace(/LEGNUM/g,which[3]).replace(/POINTID/g,which.substring(4,which.length)).replace(/SIGN/,((which[3] === 1)?'-':'')))});
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
          } else if (which === 'r_C') {
            exprs.push({id:'u_V',latex:('u_V=\\frac{r_C}{'+vars.lastRadius+'}\\cdot'+hxs.u_V.numericValue)});
            exprs.push({id:'v_V',latex:('v_V=\\frac{r_C}{'+vars.lastRadius+'}\\cdot'+hxs.v_V.numericValue)});
            vars.draggingPoint = 'radius';
          }

          // o.log('Isolating handle '+which+'; setting expressions:',exprs);

          o.desmos.setExpressions(exprs);
        }

        function adjustHandles() {
          // o.log('Adjusting Handles');
          if (Date.now() < vars.belayUntil) {setTimeout(adjustHandles,vars.belayUntil-Date.now());return;}

          vars.belayUntil = Date.now()+cs.delay.EXECUTE_HELPER;

          // o.log('x_C='+hxs.x_C.numericValue,'; y_C='+hxs.r_C.numericValue,'; theta_VC='+hxs.theta_VC.numericValue,'; theta_1near='+hxs.theta_1near.numericValue);

          let exprs = [
            {id:'u_H1near',latex:'u_{H1near}='+hs.number(hxs.r_C.numericValue*Math.cos(Math.PI*(1+(hxs.theta_VC.numericValue+hxs.theta_1near.numericValue)/180)))},
            {id:'v_H1near',latex:'v_{H1near}='+hs.number(hxs.r_C.numericValue*Math.sin(Math.PI*(1+(hxs.theta_VC.numericValue+hxs.theta_1near.numericValue)/180)))},
            {id:'u_H1far',latex:'u_{H1far}='+hs.number(hxs.r_C.numericValue*Math.cos(Math.PI*(1+(hxs.theta_VC.numericValue+hxs.theta_1far.numericValue)/180)))},
            {id:'v_H1far',latex:'v_{H1far}='+hs.number(hxs.r_C.numericValue*Math.sin(Math.PI*(1+(hxs.theta_VC.numericValue+hxs.theta_1far.numericValue)/180)))},
            {id:'u_H2near',latex:'u_{H2near}='+hs.number(hxs.r_C.numericValue*Math.cos(Math.PI*(1+(hxs.theta_VC.numericValue-hxs.theta_2near.numericValue)/180)))},
            {id:'v_H2near',latex:'v_{H2near}='+hs.number(hxs.r_C.numericValue*Math.sin(Math.PI*(1+(hxs.theta_VC.numericValue-hxs.theta_2near.numericValue)/180)))},
            {id:'u_H2far',latex:'u_{H2far}='+hs.number(hxs.r_C.numericValue*Math.cos(Math.PI*(1+(hxs.theta_VC.numericValue-hxs.theta_2far.numericValue)/180)))},
            {id:'v_H2far',latex:'v_{H2far}='+hs.number(hxs.r_C.numericValue*Math.sin(Math.PI*(1+(hxs.theta_VC.numericValue-hxs.theta_2far.numericValue)/180)))}/* ,
            {id:'x_V',latex:(cons.VERTEX_COORDINATE.replace(/COORDINATE/g,'x').replace(/HANDLE/g,'u')},
            {id:'y_V',latex:(cons.VERTEX_COORDINATE.replace(/COORDINATE/g,'y').replace(/HANDLE/g,'v')}// */
          ];

          // o.log('Adjusting handles; setting expressions:',exprs);

          o.desmos.setExpressions(exprs);

          vars.belayUntil = Date.now()+cs.delay.SET_EXPRESSION;
          setTimeout(activateHandles,cs.delay.SET_EXPRESSION);
        }

        function replaceHandles() {
          // o.log('Replacing Handles');

          // adjustHandles();

          // o.log(hxs.x_V.latex+'='+hxs.x_V.numericValue,hxs.x_C.latex+'='+hxs.x_C.numericValue,hxs.y_V.latex+'='+hxs.y_V.numericValue,hxs.y_C.latex+'='+hxs.y_C.numericValue);

          let exprs = [
            {id:'u_V',latex:('u_V='+hs.number(hxs.x_V.numericValue-hxs.x_C.numericValue))},
            {id:'v_V',latex:('v_V='+hs.number(hxs.y_V.numericValue-hxs.y_C.numericValue))},
            {id:'theta_1',latex:('\\theta_1='+hxs.theta_1.numericValue)},
            {id:'theta_2',latex:('\\theta_2='+hxs.theta_2.numericValue)},
            {id:'maximumDistance',latex:cons.R_DEPENDENT_ON_THETAS}
          ];

          // o.log('Replacing handles; setting expressions:',exprs);

          o.desmos.setExpressions(exprs);

          adjustHandles();
          setTimeout(adjustHandles,cs.delay.SET_EXPRESSION*5);
          // setTimeout(activateHandles,cs.delay.SET_EXPRESSION*2);
        }

        function activateHandles() {
          // o.log('Activating Handles');

          vars.lastRadius = hxs.r_C.numericValue;

          let exprs=[
            {id:'center',hidden:true},
            {id:'vertex_handle',hidden:false},
            {id:'H1near',hidden:(Math.abs(Math.sin(Math.PI*hxs.theta_1near.numericValue/180)*hxs.r_C.numericValue/Math.sin(Math.PI*hxs.theta_1.numericValue/180))<hxs.t_ick.numericValue)},
            {id:'H1far',hidden:false},
            {id:'H2near',hidden:(Math.abs(Math.sin(Math.PI*hxs.theta_2near.numericValue/180)*hxs.r_C.numericValue/Math.sin(Math.PI*hxs.theta_2.numericValue/180))<hxs.t_ick.numericValue)},
            {id:'H2far',hidden:false}
          ];

          // o.log('Activating handles; setting expressions:',exprs);

          o.desmos.setExpressions(exprs);

          Object.keys(hxs).forEach(function(helper) {
            if (/(?:[uv]_|_C)/.test(helper)) {
              // o.log('Observing '+helper);
              hxs[helper].observe(
                'numericValue.dragging',
                function(){if(vars.dragging){isolateHandle(helper);}}
              );
            }
          });
        }

        function updateEquation() {
          let expr = hxs.angle.numericValue+'=½('+hxs.arc_far.numericValue+'-'+hxs.arc_near.numericValue+')';
          expr = hs.latexToText(expr);
          o.desmos.setExpression({id:'center',label:expr});
        }

        function debug() {
          hxs.theta_1.observe('numericValue',function(){if (Number.isNaN(hxs.theta_1.numericValue)) {
            escape();
            return;//*/
          }});
        }

        function click() {
          vars.dragging=true;
          //document.removeEventListener('mousedown',click);
          //document.removeEventListener('touchstart',click);
        }

        function unclick() {
          vars.dragging=false;
          document.removeEventListener('mouseup',unclick);
          document.removeEventListener('touchend',unclick);
          setTimeout(replaceHandles,cs.delay.SET_EXPRESSION);
        }

        function escape() {
          document.removeEventListener('mousedown',click);
          document.removeEventListener('touchstart',click);
          document.removeEventListener('mouseup',unclick);
          document.removeEventListener('touchend',unclick);
        }

        document.addEventListener('mousedown',click);
        document.addEventListener('touchstart',click);

        setTimeout(function(){
          activateHandles();
          hxs.angle.observe('numericValue',updateEquation);
          hxs.arc_far.observe('numericValue',updateEquation);
          hxs.arc_near.observe('numericValue',updateEquation);
          updateEquation();
          debug();
        },cs.delay.LOAD);
       }
     };

    /* ←— A0597777 FUNCTIONS ——————————————————————————————————————————————→ */
      cs.A0597777 = {
        CENTER_COLOR:cs.color.agaColors.black,
        INTERSECTION_COLOR:cs.color.agaColors.black,
        HIDDEN_COLOR:'#FFFFFF',
        PRECISION:2,
        MAX_ERROR:10
       };
     fs.A0597777 = {
      // TK TODO STUB differentiate parts a, b, c
      /* ←— init ———————————————————————————————————————————————→ *\
       | stuff
       * ←—————————————————————————————————————————————————————————————————→ */
       init: function(options={}) {
        let o = hs.parseOptions(options);
        let vars = vs[o.uniqueId] = {draggingPoint:null,dragging:false};
        let hxs = vars.helperExpressions = {};
        let cons = cs.A0597777;
        vars.belayUntil = Date.now()+cs.delay.LOAD;

        Object.assign(hxs,{
          x_0:o.desmos.HelperExpression({latex:'x_0'}),
          y_0:o.desmos.HelperExpression({latex:'y_0'}),
          x_1:o.desmos.HelperExpression({latex:'x_1'}),
          y_1:o.desmos.HelperExpression({latex:'y_1'}),
          x_2:o.desmos.HelperExpression({latex:'x_2'}),
          y_2:o.desmos.HelperExpression({latex:'y_2'}),
          x_3:o.desmos.HelperExpression({latex:'x_3'}),
          y_3:o.desmos.HelperExpression({latex:'y_3'}),

          m2_x:o.desmos.HelperExpression({latex:'P_{M2}\\left[1\\right]'}),
          m2_y:o.desmos.HelperExpression({latex:'P_{M2}\\left[2\\right]'}),
          n2_x:o.desmos.HelperExpression({latex:'P_{N2}\\left[1\\right]'}),
          n2_y:o.desmos.HelperExpression({latex:'P_{N2}\\left[2\\right]'}),
          
          R_C:o.desmos.HelperExpression({latex:'R'}),
          D_E:o.desmos.HelperExpression({latex:'D'}),
          D_H:o.desmos.HelperExpression({latex:'D_H'}),
          D_M:o.desmos.HelperExpression({latex:'D_M'}),
          D_N:o.desmos.HelperExpression({latex:'D_N'}),

          t_M1:o.desmos.HelperExpression({latex:'t_{M1}'}),
          t_M2:o.desmos.HelperExpression({latex:'t_{M2}'}),
          t_N1:o.desmos.HelperExpression({latex:'t_{N1}'}),
          t_N2:o.desmos.HelperExpression({latex:'t_{N2}'}),
          
          m_tangent:o.desmos.HelperExpression({latex:'m_{tngnt}'}),
          n_tangent:o.desmos.HelperExpression({latex:'n_{tngnt}'}),
          p_erimeter:o.desmos.HelperExpression({latex:'p_{erim}'}),

          t_ick:o.desmos.HelperExpression({latex:'t_{ick}'})
        });

        function isolateHandle(which) {
          // o.log('Isolating Handles');
          Object.keys(hxs).forEach(function(helper){hxs[helper].unobserve('numericValue.dragging');});
          document.addEventListener('mouseup',unclick);
          document.addEventListener('touchend',unclick);

          // o.log(which+' changed.');


          vars.dragging = true;
          let exprs = [
            {id:'center',hidden:(which[2] !== '0')},
            {id:'vertexHandle',hidden:(which[2] !== '1')},
            {id:'handleM',hidden:(which[2] !== '2')},
            {id:'handleN',hidden:(which[2] !== '3')}
          ];

          if (which[2] === '0') {vars.draggingPoint = 'C';}
          if (which[2] === '1') {vars.draggingPoint = 'V';}
          if (which[2] === '2') {vars.draggingPoint = 'M';}
          if (which[2] === '3') {vars.draggingPoint = 'N';}
          if (which[0] === 'R') {vars.draggingPoint = 'R';}

          o.log('Isolating handle '+which+'; setting expressions:',exprs);

          o.desmos.setExpressions(exprs);
        }

        function replaceHandles() {
          // o.log('Replacing Handles');

          let exprs = [
            {id:'u_1',latex:('u_1='+hxs.x_1.numericValue)},
            {id:'v_1',latex:('v_1='+hxs.y_1.numericValue)},
            {id:'u_2',latex:('u_2='+hs.number(hxs.m2_x.numericValue-hxs.x_0.numericValue))},
            {id:'v_2',latex:('v_2='+hs.number(hxs.m2_y.numericValue-hxs.y_0.numericValue))},
            {id:'u_3',latex:('u_3='+hs.number(hxs.n2_x.numericValue-hxs.x_0.numericValue))},
            {id:'v_3',latex:('v_3='+hs.number(hxs.n2_y.numericValue-hxs.y_0.numericValue))}
          ];

          // o.log('Replacing handles; setting expressions:',exprs);

          if ((!(Number.isNaN(hxs.x_0.numericValue))) &&
              (!(Number.isNaN(hxs.y_0.numericValue))) &&
              (!(Number.isNaN(hxs.x_1.numericValue))) &&
              (!(Number.isNaN(hxs.y_1.numericValue))) &&
              (!(Number.isNaN(hxs.m2_x.numericValue))) &&
              (!(Number.isNaN(hxs.m2_y.numericValue))) &&
              (!(Number.isNaN(hxs.n2_x.numericValue))) &&
              (!(Number.isNaN(hxs.n2_y.numericValue)))
              ) {o.desmos.setExpressions(exprs);}

          setTimeout(activateHandles,cs.delay.SET_EXPRESSION);
        }

        function activateHandles() {
          // o.log('Activating Handles');

          vars.lastRadius = hxs.R_C.numericValue;

          let exprs=[
            {id:'center',hidden:false},
            {id:'vertexHandle',hidden:false},
            {id:'handleM',hidden:false},
            {id:'handleN',hidden:false}
          ];

          // o.log('Activating handles; setting expressions:',exprs);

          o.desmos.setExpressions(exprs);

          Object.keys(hxs).forEach(function(helper) {
            if (/(?:[xy]_|_C)/.test(helper)) {
              // o.log('Observing '+helper);
              hxs[helper].observe(
                'numericValue.dragging',
                function(){if(vars.dragging){isolateHandle(helper);}}
              );
            }
          });
        }

        function recalculateLabels(draggingPoint = vars.draggingPoint) {
          if(vars.recalculating) {vars.recalculateFor = draggingPoint; return;}
          if (vars.recalculateFor === draggingPoint) {delete vars.recalculateFor;}
          if (draggingPoint === undefined) {return;}
          vars.recalculating = true;
          let prec = cons.PRECISION;
          let t_M1 = vars.t_M1;
          let t_M2 = vars.t_M2;
          let t_N1 = vars.t_N1;
          let t_N2 = vars.t_N2;
          let a = vars.a;
          let b = vars.b;
          let c = vars.c;
          let d = vars.d;

          let i;
          let j;

          // If the vertex is on the perimeter, the near lengths must both be 0.
          if (hxs.p_erimeter.numericValue === 1) {
            vars.a = 0;
            vars.b = Math.round(Math.pow(10,prec)*t_M2)/Math.pow(10,prec);
            vars.c = 0;
            vars.d = Math.round(Math.pow(10,prec)*t_N2)/Math.pow(10,prec);
            o.desmos.setExpressions([
              {id:'d_{M1}',label:'0'},
              {id:'d_{M2}',label:vars.b},
              {id:'d_{N1}',label:'0'},
              {id:'d_{N2}',label:vars.d}
            ]);
            vars.recalculating = false;
            return;
          }


          let mTan = ((hxs.m_tangent.numericValue === 1)?true:false);
          let nTan = ((hxs.n_tangent.numericValue === 1)?true:false);

          let inv = (t_M1*t_M2 < 0 || t_N1*t_N2 < 0);

          let product = Math.abs(Math.round((hxs.D_E.numericValue*hxs.D_E.numericValue-hxs.R_C.numericValue*hxs.R_C.numericValue)*Math.pow(10,prec)));
          let tangent = true;
          let baseP; // Integer representation of rounded values
          let baseQ;
          let fixLeg;

          // Determine the actual values of the moving pair.
          if (draggingPoint === 'M') {
            // product = Math.round(Math.pow(10,prec)*c*d);
            if(mTan) {
              baseQ = Math.abs(Math.round(Math.pow(10,prec)*(t_M1+t_M2)/2));
              baseP = baseQ;
            } else {
              baseP = Math.abs(Math.round(Math.pow(10,prec)*t_M1));
              baseQ = Math.abs(Math.round(Math.pow(10,prec)*t_M2));
              tangent = false;
            }
            fixLeg = 'M';
          } else if (draggingPoint === 'N') {
            // product = Math.round(Math.pow(10,prec)*a*b);
            if(nTan) {
              baseQ = Math.abs(Math.round(Math.pow(10,prec)*(t_N1+t_N2)/2));
              baseP = baseQ;
            } else {
              baseP = Math.abs(Math.round(Math.pow(10,prec)*t_N1));
              baseQ = Math.abs(Math.round(Math.pow(10,prec)*t_N2));
              tangent = false;
            }
            fixLeg = 'N';
          } else if (
            draggingPoint === 'C' ||
            draggingPoint === 'V' ||
            draggingPoint === 'R'
            ) {
            // Both pairs are moving, so choose the pair with the rounded product
            // closest to the actual product as the fixed pair, and vary the other.
            let productAB = Math.round(Math.pow(10,prec)*
              (mTan?Math.pow(t_M1+t_M2,2)/4:t_M1*t_M2));
            let productCD = Math.round(Math.pow(10,prec)*
              (nTan?Math.pow(t_N1+t_N2,2)/4:t_N1*t_N2));
            let actualProduct = product; // t_N1*t_N2;
            if (Math.abs(productAB-actualProduct) < Math.abs(productCD-actualProduct)) {
              a = Math.round(Math.pow(10,prec)*Math.abs(t_M1))/Math.pow(10,prec);
              b = Math.round(Math.pow(10,prec)*Math.abs(t_M2))/Math.pow(10,prec);
              // product = productAB;
              if(nTan) {
                baseQ = Math.abs(Math.round(Math.pow(10,prec)*(t_N1+t_N2)/2));
                baseP = baseQ;
              } else {
                baseP = Math.abs(Math.round(Math.pow(10,prec)*t_N1));
                baseQ = Math.abs(Math.round(Math.pow(10,prec)*t_N2));
                tangent = false;
              }
              fixLeg = 'N';
            } else {
              c = Math.round(Math.pow(10,prec)*Math.abs(t_N1))/Math.pow(10,prec);
              d = Math.round(Math.pow(10,prec)*Math.abs(t_N2))/Math.pow(10,prec);
              // product = productCD;
              if(mTan) {
                baseQ = Math.abs(Math.round(Math.pow(10,prec)*(t_M1+t_M2)/2));
                baseP = baseQ;
              } else {
                baseP = Math.abs(Math.round(Math.pow(10,prec)*t_M1));
                baseQ = Math.abs(Math.round(Math.pow(10,prec)*t_M2));
                tangent = false;
              }
              fixLeg = 'M';
            }
          } else {
            o.log('Something went wrong: dragging point '+draggingPoint+' is not M, N, vertex, center, or radius.');
          }

          let closestP = baseP;
          let closestQ = baseQ;
          let closestProduct = Math.round(closestP*closestQ/Math.pow(10,prec));
          let minimumSquaredError = 0;
          let test = function(n,k) {
            let newProduct = Math.round((baseP+n)*(baseQ+k)/Math.pow(10,prec));
            if ((Math.abs(newProduct-product) < Math.abs(closestProduct-product)) ||
                ((Math.abs(newProduct-product) === Math.abs(closestProduct-product)) &&
                 (n*n+k*k < minimumSquaredError))) {
              closestP = baseP+n;
              closestQ = baseQ+k;
              closestProduct = newProduct;
              minimumSquaredError = n*n+k*k;
            }
          };

          for (
              i = 1;
              ((closestProduct !== product || minimumSquaredError > i*i) && 
                (i < Math.abs(baseP)-1) && 
                (i < Math.abs(baseQ)-1) &&
                (i < cons.MAX_ERROR));
              i+=1
          ) {

            if (tangent) {
              test(i,i);
              test(-i,-i);
            } else {

              // test axes
              test(i,0);
              test(-i,0);
              test(0,i);
              test(0,-i);

              // test edges
              for (j = 1; j < i; j+=1) {
                test(i,j);
                test(i,-j);
                test(-i,j);
                test(-i,-j);
                test(j,i);
                test(j,-i);
                test(-j,i);
                test(-j,-i);
              }

              // test corners
              test(i,i);
              test(i,-i);
              test(-i,i);
              test(-i,-i);
            }
          }

          if (fixLeg === 'M') {
            vars.a = closestP/Math.pow(10,prec);
            vars.b = closestQ/Math.pow(10,prec);
            vars.c = c;
            vars.d = d;
          } else if (fixLeg === 'N') {
            vars.a = a;
            vars.b = b;
            vars.c = closestP/Math.pow(10,prec);
            vars.d = closestQ/Math.pow(10,prec);
          } else {o.log('Something went wrong: computed labels but no leg chosen.');}

          let exprs = [
            {id:'d_{M1}',label:vars.a},
            {id:'d_{M2}',label:((inv)?vars.b:hs.number(vars.b-vars.a,prec)),showLabel:(!(mTan))},
            {id:'d_{N1}',label:vars.c},
            {id:'d_{N2}',label:((inv)?vars.d:hs.number(vars.d-vars.c,prec)),showLabel:(!(nTan))}
          ];

          let err = Math.abs(Math.round(Math.pow(10,prec)*(vars.a*vars.b-vars.c*vars.d))/Math.pow(10,prec));
          let LHS = ((inv)?'('+vars.a+')('+vars.b+')':((mTan)?vars.a+'²':'('+vars.a+' + '+hs.number(vars.b-vars.a,prec)+')('+vars.a+')'));
          let RHS = ((inv)?'('+vars.c+')('+vars.d+')':((nTan)?vars.c+'²':'('+vars.c+' + '+hs.number(vars.d-vars.c,prec)+')('+vars.c+')'));
          let EQ = ((err === 0)?' = ':' ≈ ');

          exprs.push({id:'equation',label:(LHS+EQ+RHS)});

          if (!(Number.isNaN(vars.a)) &&
              !(Number.isNaN(vars.b)) &&
              !(Number.isNaN(vars.c)) &&
              !(Number.isNaN(vars.d))
            ) {o.desmos.setExpressions(exprs);}

          // o.log('Error: '+Math.round((Math.abs(vars.a-vars.t_M1)+Math.abs(vars.b-vars.t_M2))*Math.pow(10,prec))/Math.pow(10,prec));

          vars.recalculating = false;
          if (vars.recalculateFor !== undefined) {setTimeout(function(){recalculateLabels(vars.recalculateFor);},cs.delay.SET_EXPRESSION);}
          return;
        }

        function click() {
          vars.dragging=true;
          // escape();
        }

        function unclick() {
          vars.dragging=false;
          vars.draggingPoint = undefined;
          document.removeEventListener('mouseup',unclick);
          document.removeEventListener('touchend',unclick);
          // escape();
          setTimeout(function(){
            if (vars === vs[o.uniqueId]) {replaceHandles();}
            else {escape();}
          },cs.delay.SET_EXPRESSION);
        }

        function escape() {
          document.removeEventListener('mousedown',click);
          document.removeEventListener('touchstart',click);
          document.removeEventListener('mouseup',unclick);
          document.removeEventListener('touchend',unclick);
        }

        document.addEventListener('mousedown',click);
        document.addEventListener('touchstart',click);

        setTimeout(function(){
          activateHandles();

          vars.t_M1 = hxs.t_M1.numericValue;
          vars.a = hxs.t_M1.numericValue;
          vars.t_M2 = hxs.t_M2.numericValue;
          vars.b = hxs.t_M2.numericValue;
          vars.t_N1 = hxs.t_N1.numericValue;
          vars.c = hxs.t_N1.numericValue;
          vars.t_N2 = hxs.t_N2.numericValue;
          vars.d = hxs.t_N2.numericValue;

          recalculateLabels('V');

          hxs.t_M1.observe('numericValue.readValue',function(p){vars.t_M1 = hxs.t_M1[p];});
          hxs.t_M2.observe('numericValue.readValue',function(p){vars.t_M2 = hxs.t_M2[p];});
          hxs.t_N1.observe('numericValue.readValue',function(p){vars.t_N1 = hxs.t_N1[p];});
          hxs.t_N2.observe('numericValue.readValue',function(p){vars.t_N2 = hxs.t_N2[p];});

          hxs.x_0.observe('numericValue.updateLabels',function(){setTimeout(function(){recalculateLabels('C');},0);});
          hxs.y_0.observe('numericValue.updateLabels',function(){setTimeout(function(){recalculateLabels('C');},0);});
          hxs.x_1.observe('numericValue.updateLabels',function(){setTimeout(function(){recalculateLabels('V');},0);});
          hxs.y_1.observe('numericValue.updateLabels',function(){setTimeout(function(){recalculateLabels('V');},0);});
          hxs.m_tangent.observe('numericValue.updateLabels',function(){setTimeout(function(){recalculateLabels('M');},0);});
          hxs.x_2.observe('numericValue.updateLabels',function(){setTimeout(function(){recalculateLabels('M');},0);});
          hxs.y_2.observe('numericValue.updateLabels',function(){setTimeout(function(){recalculateLabels('M');},0);});
          hxs.n_tangent.observe('numericValue.updateLabels',function(){setTimeout(function(){recalculateLabels('N');},0);});
          hxs.x_3.observe('numericValue.updateLabels',function(){setTimeout(function(){recalculateLabels('N');},0);});
          hxs.y_3.observe('numericValue.updateLabels',function(){setTimeout(function(){recalculateLabels('N');},0);});
        },cs.delay.LOAD);
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
       init: function(options={}) {
        let o = hs.parseOptions(options);
        vs[o.uniqueId] = {};
        let vars = vs[o.uniqueId];
        vars.helperExpressions = {};
        let hxs = vars.helperExpressions;
        let cons = cs.A0597503;

        Object.assign(hxs,{
          x_1:o.desmos.HelperExpression({latex:'x_1'}),
          y_1:o.desmos.HelperExpression({latex:'y_1'}),
          x_2:o.desmos.HelperExpression({latex:'x_2'}),
          y_2:o.desmos.HelperExpression({latex:'y_2'}),
          x_3:o.desmos.HelperExpression({latex:'x_3'}),
          y_3:o.desmos.HelperExpression({latex:'y_3'}),
          a:o.desmos.HelperExpression({latex:'a'}),
          l:o.desmos.HelperExpression({latex:'l'}),
          c:o.desmos.HelperExpression({latex:'c'}),
          b:o.desmos.HelperExpression({latex:'b'}),
          t:o.desmos.HelperExpression({latex:'t_{ick}'})
        });

        function interact(which) {
          if (vars.handled || !(vars.mouseIsDown)) {return;}

          // Stop listening for interaction
          vars.handled = true;
          Object.keys(hxs).forEach(function(helper) {
            if (helper.length === 3) {hxs[helper].unobserve('numericValue.interact');}
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
          let a = hxs.a.numericValue;
          let b = hxs.c.numericValue;
          let c = hxs.l.numericValue;

          if(Math.abs(a+b-c)<Math.pow(10,-cs.precision.FLOAT_PRECISION)) {
            o.desmos.setExpressions([
              {id:'equation',label:hs.latexToText(''+a+'+'+b+'='+c)},
              {id:'a',label:(''+a)},
              {id:'c',label:(''+b)}
           ]);
          }
         }

        function checkHandle() {
          let b = hxs.b.numericValue;
          vars.x_3 = hs.number(hxs.x_1.numericValue*(1-b)+hxs.x_2.numericValue*b);
          vars.y_3 = hs.number(hxs.y_1.numericValue*(1-b)+hxs.y_2.numericValue*b);

          if((Math.abs(hxs.x_3.numericValue-vars.x_3)<Math.pow(10,-cs.precision.FLOAT_PRECISION)) &&
             (Math.abs(hxs.y_3.numericValue-vars.y_3)<Math.pow(10,-cs.precision.FLOAT_PRECISION))) {
            o.desmos.setExpressions([
              {id:'H',hidden:false,showLabel:true},
              {id:'B',hidden:true,showLabel:false}
             ]);

            hxs.x_3.unobserve('numericValue.checkHandle');
            hxs.y_3.unobserve('numericValue.checkHandle');
          } else {adjustHandle();}
         }

        function checkB() {
          let b = hxs.b.numericValue;
          let x_1 = hxs.x_1.numericValue;
          let y_1 = hxs.y_1.numericValue;
          let x_2 = hxs.x_2.numericValue;
          let y_2 = hxs.y_2.numericValue;
          let bShouldB = Math.max(0,Math.min(1,
                          ((x_2-x_1)*(hxs.x_3.numericValue-x_1)+
                           (y_2-y_1)*(hxs.y_3.numericValue-y_1))/
                          ((x_2-x_1)*(x_2-x_1)+(y_2-y_1)*(y_2-y_1))
                         ));
          if(Math.abs(bShouldB-b)<Math.pow(10,-cs.precision.FLOAT_PRECISION)) {
            hxs.b.unobserve('numericValue.checkB');
            hxs.x_3.unobserve('numericValue.checkB');
            hxs.y_3.unobserve('numericValue.checkB');

            o.desmos.setExpression({id:'b',latex:('b='+hs.number(b))});

            // correct the handles
            hxs.x_3.observe('numericValue.checkHandle',checkHandle);
            hxs.y_3.observe('numericValue.checkHandle',checkHandle);
            checkHandle();
          } else {o.log('b = '+b+' should be '+bShouldB);}
         }

        function dontOverlap() {
          let dx = hxs.x_2.numericValue-hxs.x_1.numericValue;
          let dy = hxs.y_2.numericValue-hxs.y_1.numericValue;
          let d = Math.sqrt(dx*dx+dy*dy);
          if(hxs.b.numericValue*d<hxs.t.numericValue) {
            o.desmos.setExpression({id:'A',dragMode:Desmos.DragModes.NONE});
            o.desmos.setExpression({id:'B',dragMode:Desmos.DragModes.AUTO});
          } else {
            o.desmos.setExpression({id:'A',dragMode:Desmos.DragModes.AUTO});
            if((1-hxs.b.numericValue)*d<hxs.t.numericValue) {
              o.desmos.setExpression({id:'C',dragMode:Desmos.DragModes.NONE});
            } else {
              o.desmos.setExpression({id:'C',dragMode:Desmos.DragModes.AUTO});
            }
          }
        }

        function adjustHandle() {
          o.desmos.setExpressions([
            {id:'x_3',latex:('x_3='+vars.x_3)},
            {id:'y_3',latex:('y_3='+vars.y_3)}
           ]);
         }

        function click() {
          vars.handled = false;
          vars.mouseIsDown = true;
          document.removeEventListener('mousedown',click);
          document.removeEventListener('touchstart',click);

          Object.keys(hxs).forEach(function(helper) {
            if (helper.length === 3) {hxs[helper].observe('numericValue.interact',function(){interact(helper);});}
          });

          document.addEventListener('mouseup',unclick);
          document.addEventListener('touchend',unclick);
         }

        function unclick() {
          vars.mouseIsDown = false;
          vars.handled = true;
          document.removeEventListener('mouseup',unclick);
          document.removeEventListener('touchend',unclick);

          if (vars.dragging === 'H') {
            // Make sure b is up-to-date before moving the handle
            o.desmos.setExpression({id:'H',hidden:true,color:cons.HANDLE_COLOR});
            hxs.b.observe('numericValue.checkB',checkB);
            hxs.x_3.observe('numericValue.checkB',checkB);
            hxs.y_3.observe('numericValue.checkB',checkB);
            checkB();
            delete vars.dragging;
          } else {
            // Just correct the handle
            hxs.x_3.observe('numericValue.checkHandle',checkHandle);
            hxs.y_3.observe('numericValue.checkHandle',checkHandle);
            checkHandle();
          }

          document.addEventListener('mousedown',click);
          document.addEventListener('touchstart',click);
         }

        hxs.a.observe('numericValue.lengths',updateLabels);
        hxs.c.observe('numericValue.lengths',updateLabels);
        hxs.l.observe('numericValue.lengths',updateLabels);
        hxs.b.observe('numericValue.lengths',updateLabels);
        hxs.l.observe('numericValue.overlap',dontOverlap);
        hxs.b.observe('numericValue.overlap',dontOverlap);
        hxs.t.observe('numericValue.overlap',dontOverlap);

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
       init: function(options={}) {
        let o = hs.parseOptions(options);
        let cons = cs.A0597506;
        vs[o.uniqueId] = {
          correcting: false,
          handled:false,
          mouseIsDown:false,
          draggingPoint:undefined,
          constraints:[]
        };
        let vars = vs[o.uniqueId];
        vars.helperExpressions = {
          u_1:o.desmos.HelperExpression({latex:'u_1'}),
          v_1:o.desmos.HelperExpression({latex:'v_1'}),
          u_3:o.desmos.HelperExpression({latex:'u_3'}),
          v_3:o.desmos.HelperExpression({latex:'v_3'}),
          u_4:o.desmos.HelperExpression({latex:'u_4'}),
          v_4:o.desmos.HelperExpression({latex:'v_4'}),
          x_1:o.desmos.HelperExpression({latex:'x_1'}),
          y_1:o.desmos.HelperExpression({latex:'y_1'}),
          x_3:o.desmos.HelperExpression({latex:'x_3'}),
          y_3:o.desmos.HelperExpression({latex:'y_3'}),
          x_4:o.desmos.HelperExpression({latex:'x_4'}),
          y_4:o.desmos.HelperExpression({latex:'y_4'}),
          m_ABD:o.desmos.HelperExpression({latex:'m_{ABD}'}),
          m_DBC:o.desmos.HelperExpression({latex:'m_{DBC}'}),
          m_ABC:o.desmos.HelperExpression({latex:'m_{ABC}'}),
          tick:o.desmos.HelperExpression({latex:'t_{ick}'}),
          R:o.desmos.HelperExpression({latex:'R'})
        };
        let hxs = vars.helperExpressions;

        Object.keys(hxs).forEach(function(helper) {
          if (helper.match(/[xy]/)!==null) {
            hxs[helper].observe('numericValue.init',function(){
              vars[helper]=hxs[helper].numericValue;
              hxs[helper].unobserve('numericValue.init');
            });
            vars[helper] = helper.numericValue;
            if (vars[helper]!==undefined) {hxs[helper].unobserve('numericValue.init');}
          }
        });

        o.desmos.observe('graphpaperBounds',resizeGraph);
        function resizeGraph() {
          let R = Math.min(o.desmos.graphpaperBounds.mathCoordinates.height,o.desmos.graphpaperBounds.mathCoordinates.width)/3;
          if (Math.abs(Math.log2(R)-Math.log2(hxs.R.numericValue))<cs.ts.ZOOM) {return;}
          vars.handled = true;
          o.desmos.setExpressions([
            {id:'handleA',hidden:true,color:cons.HANDLE_COLOR},
            {id:'handleC',hidden:true,color:cons.HANDLE_COLOR},
            {id:'handleD',hidden:true,color:cons.HANDLE_COLOR},
            {id:'R',latex:'R='+hs.number(R)}
            ]);
          setTimeout(function(){
            Object.keys(hxs).forEach(function(helper) {
              if(helper.match(/[xy]/)!==null) {
                vars[helper]=hxs[helper].numericValue;
              }
            });
            adjustHandles();
          },cs.delay.SET_EXPRESSION);
         }

        function interact(which) {
          if (vars.handled || !(vars.mouseIsDown)) {return;}

          // Stop listening for interaction
          vars.handled = true;
          vars.draggingPoint = which[2];

          Object.keys(hxs).forEach(function(helper) {
            if (helper.match(/[uv]/)!==null) {hxs[helper].unobserve('numericValue.interact');}
          });

          switch (which[2]) {
            case '1':
              o.desmos.setExpressions([
                {id:'angleABD',latex:'m_{ABD}=\\min\\left(180-m_{DBC},\\operatorname{round}\\left(\\theta_{LVL}\\left(A,B,D\\right)\\right)\\right)'},
                {id:'angleABC',latex:'m_{ABC}=m_{ABD}+m_{DBC}'},
                {id:'angleDBC',latex:'m_{DBC}='+hs.number(hxs.m_DBC.numericValue)},
                {id:'handleA',color:cons.HIDDEN_COLOR}
              ]);
              vars.constraints = [
                hs.lineTwoPoints({x:hxs.x_3.numericValue,y:hxs.y_3.numericValue},{x:0,y:0}),
                hs.lineTwoPoints({x:hxs.x_4.numericValue,y:hxs.y_4.numericValue},{x:0,y:0})
                ];
              break;
            case '3':
              o.desmos.setExpressions([
                {id:'angleDBC',latex:'m_{DBC}=\\min\\left(180-m_{ABD},\\operatorname{round}\\left(\\theta_{LVL}\\left(C,B,D\\right)\\right)\\right)'},
                {id:'angleABC',latex:'m_{ABC}=m_{ABD}+m_{DBC}'},
                {id:'angleABD',latex:'m_{ABD}='+hs.number(hxs.m_ABD.numericValue)},
                {id:'handleC',color:cons.HIDDEN_COLOR}
              ]);
              vars.constraints = [
                hs.lineTwoPoints({x:0,y:0},{x:hxs.x_1.numericValue,y:hxs.y_1.numericValue}),
                hs.lineTwoPoints({x:0,y:0},{x:hxs.x_4.numericValue,y:hxs.y_4.numericValue})
                ];
              break;
            case '4':
              o.desmos.setExpressions([
                {id:'angleABD',latex:'m_{ABD}=\\operatorname{round}\\left(\\theta_{LVL}\\left(A,B,D\\right)\\right)'},
                {id:'angleDBC',latex:'m_{DBC}=m_{ABC}-m_{ABD}'},
                {id:'angleABC',latex:'m_{ABC}='+hs.number(hxs.m_ABC.numericValue)},
                {id:'handleD',color:cons.HIDDEN_COLOR}
              ]);
              vars.constraints = [
                hs.lineTwoPoints({x:0,y:0},{x:hxs.x_1.numericValue,y:hxs.y_1.numericValue}),
                hs.lineTwoPoints({x:hxs.x_3.numericValue,y:hxs.y_3.numericValue},{x:0,y:0})
                ];
              break;
          }
          hxs['u_'+which[2]].observe('numericValue.correction',correctIt);
          hxs['v_'+which[2]].observe('numericValue.correction',correctIt);
         }

        function correctIt() {
          let x = 'x_'+vars.draggingPoint;
          let y = 'y_'+vars.draggingPoint;
          let handle = {
            x:hxs['u_'+vars.draggingPoint].numericValue,
            y:hxs['v_'+vars.draggingPoint].numericValue
          };

          let corrected = hs.polygonConstrain(handle,vars.constraints);
          let d = Math.sqrt(Math.pow(corrected.x,2)+Math.pow(corrected.y,2));

          // Stick to the nearest edge if the handle is too close to the vertex
          if (d < hxs.tick.numericValue) {
            vars.correcting = true;
            let stick;
            switch (vars.draggingPoint) {
              case '1':
                if (hxs.m_ABC.numericValue>=179) {stick = 3;}
                else {stick = 4;}
                break;
              case '3':
                if (hxs.m_ABC.numericValue>=179) {stick = 3;}
                else {stick = 4;}
                if (hxs.m_ABC.numericValue>=179) {stick = 1;}
                else {stick = 4;}
                break;
              case '4':
                if (hxs.m_ABC.numericValue>=179) {stick = 3;}
                else {stick = 4;}
                if (hxs.m_ABC.numericValue>=179) {stick = 1;}
                else {stick = 4;}
                if (hxs.m_ABD.numericValue>hxs.m_DBC.numericValue) {stick = 3;}
                else {stick = 1;}
                break;
            }

            corrected = {
              x:hxs['x_'+stick].numericValue,
              y:hxs['y_'+stick].numericValue
            };
            
            o.desmos.setExpressions([
              {id:x,latex:(x+'='+corrected.x)},
              {id:y,latex:(y+'='+corrected.y)}
              ]);
          // If no correction necessary, revert to desmos for performance
          } else if (corrected === handle) {
            corrected = {
              x:hxs[x].numericValue,
              y:hxs[y].numericValue
            };
            if (vars.correcting) {
              vars.correcting = false;
              o.desmos.setExpressions([
                {id:x,latex:cons.latex[x]},
                {id:y,latex:cons.latex[y]}
                ]);
              corrected = {
                x:hs.number(hxs.R.numericValue*corrected.x/d),
                y:hs.number(hxs.R.numericValue*corrected.y/d)
              };
            } else {corrected = {
              x:hxs[x].numericValue,
              y:hxs[y].numericValue
            };}
          // Stick to the nearest leg
          } else {
            vars.correcting = true;
            corrected = {
              x:hs.number(hxs.R.numericValue*corrected.x/d),
              y:hs.number(hxs.R.numericValue*corrected.y/d)
            };
            o.desmos.setExpressions([
              {id:x,latex:(x+'='+corrected.x)},
              {id:y,latex:(y+'='+corrected.y)}
              ]);
          }

          vars[x]=corrected.x;
          vars[y]=corrected.y;
         }

        function adjustHandles() {
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
         }

        function click() {
          vars.handled = false;
          vars.mouseIsDown = true;
          document.removeEventListener('mousedown',click);
          document.removeEventListener('touchstart',click);

          document.addEventListener('mouseup',unclick);
          document.addEventListener('touchend',unclick);

          Object.keys(hxs).forEach(function(helper) {
            if (helper.match(/[uv]/)!==null) {hxs[helper].observe('numericValue.interact',function(){interact(helper);});}
          });
         }

        function unclick() {
          vars.mouseIsDown = false;
          vars.handled = true;
          document.removeEventListener('mouseup',unclick);
          document.removeEventListener('touchend',unclick);

          document.addEventListener('mousedown',click);
          document.addEventListener('touchstart',click);

          let exprs = [];

          Object.keys(hxs).forEach(function(helper) {
            if (helper.match(/[uv]/)!==null) {
              hxs[helper].unobserve('numericValue.interact');
              hxs[helper].unobserve('numericValue.correction');
            } else if (helper.match(/[xy]/)!==null) {
              exprs.push({id:helper,latex:cons.latex[helper]});
              if (helper[2] !== vars.draggingPoint) {vars[helper] = hxs[helper].numericValue;}
            }
          });

          if (vars.draggingPoint!==undefined) {
            o.desmos.setExpression({id:('handle'+hs.ALPHA[vars.draggingPoint]),hidden:true,color:cons.HANDLE_COLOR});
            correctIt();
          }
          vars.draggingPoint = undefined;

          adjustHandles();

          exprs.push(
            {id:'angleABD',latex:'m_{ABD}='+hxs.m_ABD.numericValue},
            {id:'angleDBC',latex:'m_{DBC}='+hxs.m_DBC.numericValue},
            {id:'angleABC',latex:'m_{ABC}='+hxs.m_ABC.numericValue}
            );
          o.desmos.setExpressions(exprs);

         }

        document.addEventListener('mousedown',click);
        document.addEventListener('touchstart',click);

       }//
     };

    /* ←— A0597768 FUNCTIONS ——————————————————————————————————————————————→ */
     fs.A0597768 = {
      /* ←— init ———————————————————————————————————————————————→ *\
       | stuff
       * ←—————————————————————————————————————————————————————————————————→ */
       init: function(options={}) {
        let o = hs.parseOptions(options);
        vs[o.uniqueId] = {draggingPoint:null,dragging:false};
        let vars = vs[o.uniqueId];
        vars.helperExpressions = {};
        let hxs = vars.helperExpressions;
        vars.belayUntil = Date.now()+cs.delay.LOAD;

        Object.assign(hxs,{
          x_0:o.desmos.HelperExpression({latex:'x_0'}),
          y_0:o.desmos.HelperExpression({latex:'y_0'}),
          x_1:o.desmos.HelperExpression({latex:'x_1'}),
          y_1:o.desmos.HelperExpression({latex:'y_1'}),
          x_2:o.desmos.HelperExpression({latex:'x_2'}),
          y_2:o.desmos.HelperExpression({latex:'y_2'}),
          x_3:o.desmos.HelperExpression({latex:'x_3'}),
          y_3:o.desmos.HelperExpression({latex:'y_3'}),

          u_1:o.desmos.HelperExpression({latex:'u_1'}),
          v_1:o.desmos.HelperExpression({latex:'v_1'}),
          u_2:o.desmos.HelperExpression({latex:'u_2'}),
          v_2:o.desmos.HelperExpression({latex:'v_2'}),
          u_3:o.desmos.HelperExpression({latex:'u_3'}),
          v_3:o.desmos.HelperExpression({latex:'v_3'}),

          R_C:o.desmos.HelperExpression({latex:'R'})
        });

        function isolateHandle(which) {
          // o.log('Isolating Handles');
          Object.keys(hxs).forEach(function(helper) {
            hxs[helper].unobserve('numericValue.dragging');
            hxs[helper].unobserve('numericValue.checkReplace');
          });

          document.addEventListener('mouseup',unclick);
          document.addEventListener('touchend',unclick);

          // o.log(which+' changed.');

          vars.dragging = true;
          let exprs = [
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

          let i;

          let vals = {
            x_1: hxs.x_1.numericValue,
            y_1: hxs.y_1.numericValue,
            x_2: hxs.x_2.numericValue,
            y_2: hxs.y_2.numericValue,
            x_3: hxs.x_3.numericValue,
            y_3: hxs.y_3.numericValue
          };

          let exprs = [
            {id:'u_1',latex:('u_1='+vals.x_1)},
            {id:'v_1',latex:('v_1='+vals.y_1)},
            {id:'u_2',latex:('u_2='+vals.x_2)},
            {id:'v_2',latex:('v_2='+vals.y_2)},
            {id:'u_3',latex:('u_3='+vals.x_3)},
            {id:'v_3',latex:('v_3='+vals.y_3)}
          ];

          function checkReplace(n) {
            // o.log('u_'+n+' = '+hxs['u_'+n].numericValue);
            // o.log('x_'+n+' = '+hxs['x_'+n].numericValue);
            // o.log('v_'+n+' = '+hxs['v_'+n].numericValue);
            // o.log('y_'+n+' = '+hxs['y_'+n].numericValue);
            if((Math.abs(hxs['u_'+n].numericValue-vals['x_'+n])<cs.precision.FLOAT_PRECISION) &&
               (Math.abs(hxs['v_'+n].numericValue-vals['y_'+n])<cs.precision.FLOAT_PRECISION)) {
              hxs['u_'+n].unobserve('numericValue.checkReplace');
              hxs['v_'+n].unobserve('numericValue.checkReplace');
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
              hxs['u_'+n].observe('numericValue.dragging',function(){if(vars.dragging){isolateHandle('u_'+n);}});
              hxs['v_'+n].observe('numericValue.dragging',function(){if(vars.dragging){isolateHandle('v_'+n);}});
            }
          }

          exprs.push({id:'center',hidden:false});
          hxs.x_0.observe('numericValue.dragging',function(){if(vars.dragging){isolateHandle('x_0');}});
          hxs.y_0.observe('numericValue.dragging',function(){if(vars.dragging){isolateHandle('y_0');}});
          hxs.R_C.observe('numericValue.dragging',function(){if(vars.dragging){isolateHandle('x_0');}});

          for (i = 1; i <= 3; i+=1) {
            hxs['u_'+i].observe('numericValue.checkReplace',function(){checkReplace(i);});
            hxs['v_'+i].observe('numericValue.checkReplace',function(){checkReplace(i);});
            checkReplace(i);
          }

          // o.log('Replacing handles; setting expressions:',exprs);

          if ((!(Number.isNaN(hxs.x_0.numericValue))) &&
              (!(Number.isNaN(hxs.y_0.numericValue))) &&
              (!(Number.isNaN(hxs.x_1.numericValue))) &&
              (!(Number.isNaN(hxs.y_1.numericValue))) &&
              (!(Number.isNaN(hxs.x_2.numericValue))) &&
              (!(Number.isNaN(hxs.y_2.numericValue))) &&
              (!(Number.isNaN(hxs.x_3.numericValue))) &&
              (!(Number.isNaN(hxs.y_3.numericValue)))
              ) {o.desmos.setExpressions(exprs);}
        }

        function click() {
          vars.dragging=true;
          // escape();
        }

        function unclick() {
          vars.dragging=false;
          vars.draggingPoint = undefined;
          document.removeEventListener('mouseup',unclick);
          document.removeEventListener('touchend',unclick);
          // escape();
          setTimeout(function(){
            if (vars === vs[o.uniqueId]) {replaceHandles();}
            else {escape();}
          },cs.delay.SET_EXPRESSION);
        }

        function escape() {
          document.removeEventListener('mousedown',click);
          document.removeEventListener('touchstart',click);
          document.removeEventListener('mouseup',unclick);
          document.removeEventListener('touchend',unclick);
        }

        document.addEventListener('mousedown',click);
        document.addEventListener('touchstart',click);

        setTimeout(function(){
          hxs.x_0.observe('numericValue.dragging',function(){if(vars.dragging){isolateHandle('x_0');}});
          hxs.y_0.observe('numericValue.dragging',function(){if(vars.dragging){isolateHandle('y_0');}});
          hxs.R_C.observe('numericValue.dragging',function(){if(vars.dragging){isolateHandle('x_0');}});
          for (i = 1; i <= 3; i+=1) {
            hxs['u_'+i].observe('numericValue.dragging',function(){if(vars.dragging){isolateHandle('u_'+i);}});
            hxs['v_'+i].observe('numericValue.dragging',function(){if(vars.dragging){isolateHandle('v_'+i);}});
          }
        },cs.delay.LOAD);
       }
     };

    /* ←— A0597789 FUNCTIONS ——————————————————————————————————————————————→ */
      cs.A0597789 = {
        MARGIN: 18,
        LINE_HEIGHT: 24
       };
     fs.A0597789 = {
      /* ←— init ——————————————————————————————————————————————————————→ *\
       | Preps the watcher
       * ←—————————————————————————————————————————————————————————————————→ */
       init: function(options={}) {
        let o = hs.parseOptions(options);
        o.desmos.observe('graphpaperBounds',function(){
          let cons = cs.A0597789;
          let units = o.desmos.graphpaperBounds.mathCoordinates;
          let pixels = o.desmos.graphpaperBounds.pixelCoordinates;
          let left = units.left+cons.MARGIN*units.width/pixels.width;
          let top = units.top-cons.MARGIN*units.height/pixels.height;
          let second = top-cons.LINE_HEIGHT*units.height/pixels.height;
          o.desmos.setExpression({id:'volumeCone',latex:'\\left('+left+','+top+'\\right)'});
          o.desmos.setExpression({id:'volumeStack',latex:'\\left('+left+','+second+'\\right)'});
        });
       },
      /* ←— volumeCone ——————————————————————————————————————————————————————→ *\
       | Updates the volume of the cone
       * ←—————————————————————————————————————————————————————————————————→ */
       volumeCone: function(options={}) {
        let o = hs.parseOptions(options);
        o.desmos.setExpression({id:'volumeCone',label:'Volume of cone: '+o.value});
       },
      /* ←— volumeStack ——————————————————————————————————————————————————————→ *\
       | Updates the volume of the stack
       * ←—————————————————————————————————————————————————————————————————→ */
       volumeStack: function(options={}) {
        let o = hs.parseOptions(options);
        o.desmos.setExpression({id:'volumeStack',label:'Total volume of stack: '+o.value});
       }
     };

    /* ←— A0596370 FUNCTIONS ——————————————————————————————————————————————→ */
      cs.A0596370 = {
        ANIM_VAR_NAME:'n_{SlideToAnimate}'
       };
     fs.A0596370 = {
      /* ←— init ——————————————————————————————————————————————————————→ *\
       | Preps the watcher
       * ←—————————————————————————————————————————————————————————————————→ */
       init: function(options={}) {
        let o = hs.parseOptions(options);
        let cons = cs.A0596370;
        vs[o.uniqueId] = {lastStep:1};
       },
      /* ←— resetAnimation ——————————————————————————————————————————————————————→ *\
       | Sets the animation slider to 0
       | Call observing the Step slider
       | Plays the animation if given a value of -1, so you can call with an
       | animation toggle with a max of -1 (hopefully you don't have a Step -1)
       * ←—————————————————————————————————————————————————————————————————→ */
       resetAnimation: function(options={}) {
        let o = hs.parseOptions(options);
        let cons = cs.A0596370;
        o.desmos.setExpression({
          id:'animationSlider',
          latex:(cons.ANIM_VAR_NAME+'=0')//,
          // sliderIsPlaying:(o.value === -1)
        });
       },
      /* ←— changeStep ——————————————————————————————————————————————————————→ *\
       | Switches to the next step.
       * ←—————————————————————————————————————————————————————————————————→ */
       changeStep: function(options={}) {
        let o = hs.parseOptions(options);
        let cons = cs.A0596370;
        let lastStep = vs[o.uniqueId].lastStep;
        vs[o.uniqueId].lastStep = o.value;

        let gt1 = (o.value>1);
        let lt2 = (!gt1);
        let lt3 = (o.value<3);
        let lt4 = (o.value<4);
        let lt5 = (o.value<5);
          
        let exprs = [
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
          {id:"pointCircumcenter",hidden:(gt1&&lt4),color:((lt5)?"#F15A22":"#000000")}/*,
          // Step 5: show circumcircle
          // Step 6: show that c's bisector also passes through circumcenter
          {id:"tickSideCLeft",hidden:lt6},
          {id:"tickSideCRight",hidden:lt6},
          {id:"midpointC",hidden:lt6} // */
        ];

        if(lt2) {exprs.push({id:'rightAngleA',latex:'1'},{id:'bisectorA',latex:'1'});}
        else if(lt3) {
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

        if(lt3) {if(lastStep>2) {exprs.push({id:'rightAngleB',latex:'1'},{id:'bisectorB',latex:'1'});}}
        else if((lastStep<3)||((lastStep === 3) !== lt4)) {
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
          if(lt2) {exprs.push({id:'circumCircle',color:'#000000',style:cs.enum.lineType.DASHED,latex:'\\left(x-U_x\\right)^2+\\left(y-U_y\\right)^2=R^2'});}
          else if(lt4) {exprs.push({id:'circumCircle',latex:'1'});}
          else if(!lt5) {exprs.push({id:'circumCircle',color:'#F15A22',style:cs.enum.lineType.SOLID,latex:'\\left(x-U_x\\right)^2+\\left(y-U_y\\right)^2=R^2'});}
        }

        /* if(lt5&&(lastStep === 5)) {exprs.push({id:'rightAngleC',latex:'1'},{id:'bisectorC',latex:'1'});}
        else {
          if((lastStep<5)&&(!lt5)) {
            exprs.push(
              {id:'rightAngleC',latex:
                '\\left(M_{xabc}\\left[3\\right]+n_{animate}I_{nv}\\left[3\\right]t_{ick}\\left(\\left[t,1\\right]\\theta_{yabc}\\left[3\\right]-\\left[1,t\\right]\\theta_{xabc}\\left[3\\right]\\right),M_{yabc}\\left[3\\right]-n_{animate}I_{nv}\\left[3\\right]t_{ick}\\left(\\left[t,1\\right]\\theta_{xabc}\\left[3\\right]+\\left[1,t\\right]\\theta_{yabc}\\left[3\\right]\\right)\\right)'
              }, {id:'bisectorC',latex:
                '\\left(\\left(M_{xabc}\\left[3\\right]-t_{ick}I_{nv}\\left[3\\right]\\theta_{yabc}\\left[3\\right]\\right)\\left(1-tn_{animate}\\right)+\\left(U_x+t_{ick}I_{nv}\\left[3\\right]\\theta_{yabc}\\left[3\\right]\\right)tn_{animate},\\left(M_{yabc}\\left[3\\right]+t_{ick}I_{nv}\\left[3\\right]\\theta_{xabc}\\left[3\\right]\\right)\\left(1-tn_{animate}\\right)+\\left(U_y-t_{ick}I_{nv}\\left[3\\right]\\theta_{xabc}\\left[3\\right]\\right)tn_{animate}\\right)'
              }
            );
          }
        } // */


        o.desmos.setExpressions(exprs);
       }
     };

    /* ←— A0596373 FUNCTIONS ——————————————————————————————————————————————→ */
      cs.A0596373 = {
        ANIM_VAR_NAME:'n_{SlideToAnimate}'
       };
     fs.A0596373 = {
      /* ←— init ——————————————————————————————————————————————————————→ *\
       | Preps the watcher
       * ←—————————————————————————————————————————————————————————————————→ */
       init: function(options={}) {
        let o = hs.parseOptions(options);
        let cons = cs.A0596373;
        vs[o.uniqueId] = {lastStep:1};
       },
      /* ←— resetAnimation ——————————————————————————————————————————————————————→ *\
       | Sets the animation slider to 0
       | Call observing the Step slider
       | Plays the animation if given a value of -1, so you can call with an
       | animation toggle with a max of -1 (hopefully you don't have a Step -1)
       * ←—————————————————————————————————————————————————————————————————→ */
       resetAnimation: function(options={}) {
        let o = hs.parseOptions(options);
        let cons = cs.A0596373;
        o.desmos.setExpression({
          id:'animationSlider',
          latex:(cons.ANIM_VAR_NAME+'=0')//,
          //sliderIsPlaying:(o.value === -1)
        });
       },
      /* ←— changeStep ——————————————————————————————————————————————————————→ *\
       | Switches to the next step.
       * ←—————————————————————————————————————————————————————————————————→ */
       changeStep: function(options={}) {
        let o = hs.parseOptions(options);
        let cons = cs.A0596373;
        let lastStep = vs[o.uniqueId].lastStep;
        vs[o.uniqueId].lastStep = o.value;
          
        let exprs = [
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

    /* ←— A0599213 FUNCTIONS ——————————————————————————————————————————————→ */
      cs.A0599213 = {
        regionLatex:'\\left|x\\right|>-1L_1\\left(x,y,s_N,t_N\\right)L_2\\left(x,y,s_N,t_N\\right)L_3\\left(x,y,s_N,t_N\\right)L_4\\left(x,y,s_N,t_N\\right)'
       };
     fs.A0599213 = {
      /* ←— init ——————————————————————————————————————————————————————→ *\
       | Preps the watchers
       * ←—————————————————————————————————————————————————————————————————→ */
       init: function(options={}) {
        let o = hs.parseOptions(options);
        vs[o.uniqueId] = {
          lastPointCount:0/*,
          hxs:{
            x_c:o.desmos.HelperExpression({latex:'\\operatorname{mean}\\left(x_1,u_1,x_2,u_2,x_3,u_3,x_4,u_4\\right)'}),
            y_c:o.desmos.HelperExpression({latex:'\\operatorname{mean}\\left(y_1,v_1,y_2,v_2,y_3,v_3,y_4,v_4\\right)'})
          }*/
        };
       },
      /* ←— changeLineType ————————————————————————————————————————————————→ *\
       | Toggle switch should use -n and n to toggle line type on line n
       | positive for SOLID, otherwise, DASHED
       * ←—————————————————————————————————————————————————————————————————→ */
       changeLineType: function(options={}) {
        let o = hs.parseOptions(options);
        o.desmos.setExpression({
          id:o.id,
          style:((o.value>0)?cs.enum.lineType.SOLID:cs.enum.lineType.DASHED)
        });
       },
      /* ←— changeStep ——————————————————————————————————————————————————————→ *\
       | Switches to the next step.
       * ←—————————————————————————————————————————————————————————————————→ */
       regionsAddRemove: function(options={}) {
        let o = hs.parseOptions(options);
        let cons = cs.A0599213;
        let vars = vs[o.uniqueId];
        //let x_c = vars.hxs.x_c.numericValue;
        //let y_c = vars.hxs.y_c.numericValue;
        let exprs = [];

        let i;

        // Add
        for(i = vars.lastPointCount+1; i <= o.value; i+=1) {
          exprs.push(
            {id:('R_'+i),hidden:false},//,latex:cons.regionLatex.replace(/_N/g,hs.sub('',i))},
            {id:('T_'+i),hidden:false}
           );
         }

        // Remove
        for(i = o.value+1; i <= vars.lastPointCount; i+=1) {
          exprs.push(
            {id:('T_'+i),hidden:true},
            {id:('R_'+i),hidden:true}//,latex:'1'}
           );
         }

        vars.lastPointCount = o.value;

        o.desmos.setExpressions(exprs);
       }
     };


     /* ←— A0598832 FUNCTIONS ——————————————————————————————————————————————→ */
      cs.A0598832 = {
        regionLatex:'\\left|x\\right|>-1L_1\\left(x,y,s_N,t_N\\right)L_2\\left(x,y,s_N,t_N\\right)L_3\\left(x,y,s_N,t_N\\right)L_4\\left(x,y,s_N,t_N\\right)'
       };
     fs.A0598832 = {
      /* ←— init ——————————————————————————————————————————————————————→ *\
       | Preps the watchers
       * ←—————————————————————————————————————————————————————————————————→ */
       init: function(options={}) {
        let o = hs.parseOptions(options);
        vs[o.uniqueId] = {
          lastPointCount:0/*,
          hxs:{
            x_c:o.desmos.HelperExpression({latex:'\\operatorname{mean}\\left(x_1,u_1,x_2,u_2,x_3,u_3,x_4,u_4\\right)'}),
            y_c:o.desmos.HelperExpression({latex:'\\operatorname{mean}\\left(y_1,v_1,y_2,v_2,y_3,v_3,y_4,v_4\\right)'})
          }*/
        };
       },
      /* ←— changeLineType ————————————————————————————————————————————————→ *\
       | Toggle switch should use -n and n to toggle line type on line n
       | positive for SOLID, otherwise, DASHED
       * ←—————————————————————————————————————————————————————————————————→ */
       changeLineType: function(options={}) {
        let o = hs.parseOptions(options);
        o.desmos.setExpression({
          id:o.id,
          style:((o.value>0)?cs.enum.lineType.SOLID:cs.enum.lineType.DASHED)
        });
       },
      /* ←— changeStep ——————————————————————————————————————————————————————→ *\
       | Switches to the next step.
       * ←—————————————————————————————————————————————————————————————————→ */
       regionsAddRemove: function(options={}) {
        let o = hs.parseOptions(options);
        let cons = cs.A0598832;
        let vars = vs[o.uniqueId];
        //let x_c = vars.hxs.x_c.numericValue;
        //let y_c = vars.hxs.y_c.numericValue;
        let exprs = [];

        let i;

        // Add
        for(i = vars.lastPointCount+1; i <= o.value; i+=1) {
          exprs.push(
            {id:('R_'+i),hidden:false},//,latex:cons.regionLatex.replace(/_N/g,hs.sub('',i))},
            {id:('T_'+i),hidden:false}
           );
         }

        // Remove
        for(i = o.value+1; i <= vars.lastPointCount; i+=1) {
          exprs.push(
            {id:('T_'+i),hidden:true},
            {id:('R_'+i),hidden:true}//,latex:'1'}
           );
         }

        vars.lastPointCount = o.value;

        o.desmos.setExpressions(exprs);
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
        vs[o.uniqueId] = (vs[o.uniqueId] || {});
        let vars = vs[o.uniqueId];
        vars.helperExpressions = {};
        let hxs = vars.helperExpressions;
        vars.belayUntil = Date.now()+cs.delay.LOAD;

        o.desmos.setExpressions([
          {id:'circle',latex:'\\left(x-x_0\\right)^2+\\left(y-y_0\\right)^2=r_0^2'},
          {id:'center',latex:'\\left(x_0,y_0\\right)'},
          {id:'draggable',latex:'\\left(x_1,y_1\\right)'},
          {id:'adjusted',latex:'\\left(x_{adjusted},y_{adjusted}\\right)',hidden:true,dragMode:Desmos.DragModes.NONE},
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
          let corrected = hs.circleConstrain(
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
          if(coord === 'x_1' || coord === 'y_1') {
            if (vars.belayUntil > Date.now()) {return;}
            if (Math.pow(hxs.x_1.numericValue-hxs.x_0.numericValue,2)+Math.pow(hxs.y_1.numericValue-hxs.y_0.numericValue,2) <= Math.pow(hxs.r_0.numericValue,2)) {
              if (!(vars.placeholder)) {setPlaceholder();}
            } else {
              if (vars.placeholder) {clearPlaceholder();}
            }
          } else {
            let point = {x:hxs.x_1.numericValue,y:hxs.y_1.numericValue}
            let corrected = hs.circleConstrain(
              point,
              {x:hxs.x_0.numericValue,y:hxs.y_0.numericValue,r:hxs.r_0.numericValue},
              cs.enum.EXTERIOR
            );
            if (point !== corrected) {setPlaceholder();}
            else {clearPlaceholder();}
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
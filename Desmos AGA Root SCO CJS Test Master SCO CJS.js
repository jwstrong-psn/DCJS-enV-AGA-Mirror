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

/******************************************************************************
* Module: masterJS
******************************************************************************/
PearsonGL.External.masterJS = (function() {
  
  /***********************************************************************************
   * PRIVATE VARIABLES / FUNCTIONS
   **********************************************************************************/
  var exports = {};  // This object is used to export public functions/variables

  /********************************************************************************
   * flattenFuncStruct: Turn a nested function structure into a single layer, with
   *                    nested functions' names prefixed by their parent objects'
   *                    names, connected by underscores
   *
   * @Arg1: a hierarchical structure containing only Functions and Objects
   * @Arg2: (Optional) a string to prefix all function names
   *
   * @Returns: object whose members are all references to functions
   * @Returns: false if input contains members/sub-members that are not functions
  ********************************************************************************/
  function flattenFuncStruct(funcStruct,prefix='') {
    var functions={};
    for (key in funcStruct) {
      if (typeof funcStruct[key] == 'object') {
        if (!(Object.assign(functions,flattenFuncStruct(funcStruct[key],prefix+key+'_')))) return false;
      }
      else if (typeof funcStruct[key] == 'function') functions[prefix+key] = funcStruct[key];
      else {
        alert(prefix+key+' is not a function or object');
        return false;
      }
    }
    return functions;
  }

  var vs = {shared:{}}; // Variable cache; use vs[uniqueID].myvariable to access
  
  var ts = { // test functions only
    shared:{ // Shared Helpers have functions that can be called by any Widget.
      init:{ // Initialization Helpers are called only once, using HelperExpression({latex:"1"})
        observeZoom:''}, // Tracks zoom level in units/px as x_{pxScale} and y_{pxScale}
      label:{} // Label functions are used for labeling points with certain values
    },
    sliderVal:function(val,name,desmos){return PearsonGL.External.rootJS.shared_label_valueOnly({'value':val,'name':name,'desmos':desmos,'log':console.log});}
  }

  /***********************************************************************************
   * EXPORTS / PUBLIC FUNCTIONS
   *
   * To declare your function
   * exports.myFunc1 = function() {};
   * exports.myFunc2 = function() {};
   * 
   * The Desmos gadget can be authored to use helper expressions which call custom JavaScript
   * when observed variables are updated. For example, if a Desmos graph were authored to show
   * a parabola "y=a(x-h)^2+k" a helper expression with Observed Variable "h" and JavaScript
   * Function Name "reflectParabola" would cause the below function to run whenever h was
   * updated and would draw another parabola reflected across the x axis.
   * 
   * exports.reflectParabola = function(val, name, desmos) {
   *  console.log(name + " was updated to " + val);
   *  desmos.setExpression({id: "reflected", latex: "y=-a(x-" + val + ")^2-k", color: "#00AA00"});
   * };
   * 
   * The three values passed in to the CJS function are the variable's new value, the
   * name of the variable, and a reference to the Desmos object.
   * 
   * Note that console logging should only be used for debugging and should is not
   * recommended for production.
  **********************************************************************************/

  exports.reflectParabola = function(val, name, desmos) {
    console.log('redirecting from Master to Root SCO for testing')
    return PearsonGL.External.rootJS.reflectParabola({'value':val,'name':name,'desmos':desmos,'log':console.log});
    //console.log(name + " was updated to " + val);
    //desmos.setExpression({id: 'reflected', latex: 'y=-a(x-' + val + ')^2-k', color: '#00AA00'});
  }

  /** FUNCTIONS TRANSLATE OLD API (value, name, desmos)
      INTO NEW API ({value:…,name:…,desmos:…,uniqueId:…})
      AND ADD LOGGING FUNCTIONALITY FOR TEST PURPOSES
      DELETE ALL WHEN API IS UPDATED
      **/

  ts.shared.init.observeZoom = (val, name, desmos)=>PearsonGL.External.rootJS.shared_init_observeZoom({'value':val,'name':name,'desmos':desmos,'log':console.log});

  ts.shared.init.shareState = (val, name, desmos)=>PearsonGL.External.rootJS.shared_init_shareState({'value':val,'name':name,'desmos':desmos,'log':console.log, 'uniqueId':'shared'});

  ts.shared.label.labelEquation = (val, name, desmos)=>PearsonGL.External.rootJS.shared_label_labelEquation({'value':val,'name':name,'desmos':desmos,'log':console.log});

  ts.shared.label.valueOnly = (val, name, desmos)=>PearsonGL.External.rootJS.shared_label_valueOnly({'value':val,'name':name,'desmos':desmos,'log':console.log});

  ts.shared.label.labelAngle = (val, name, desmos)=>PearsonGL.External.rootJS.shared_label_labelAngle({'value':val,'name':name,'desmos':desmos,'log':console.log});

  ts.shared.label.labelTriAngles = (val, name, desmos)=>PearsonGL.External.rootJS.shared_label_labelTriAngles({'value':val,'name':name,'desmos':desmos,'log':console.log});

  ts.A0597514_init = (val, name, desmos)=>PearsonGL.External.rootJS.A0597514_init({'value':val,'name':name,'desmos':desmos,'log':console.log});

  ts.A0597514_updateLabels = (val, name, desmos)=>PearsonGL.External.rootJS.A0597514_updateLabels({'value':val,'name':name,'desmos':desmos,'log':console.log});

  ts.A0597534_init = (val, name, desmos)=>PearsonGL.External.rootJS.A0597534_init({'value':val,'name':name,'desmos':desmos,'log':console.log});

  ts.A0597534_updateLabels = (val, name, desmos)=>PearsonGL.External.rootJS.A0597534_updateLabels({'value':val,'name':name,'desmos':desmos,'log':console.log});

  ts.A0597552_init = (val, name, desmos)=>PearsonGL.External.rootJS.A0597552_init({'value':val,'name':name,'desmos':desmos,'log':console.log});

  ts.A0597552_updateLabels = (val, name, desmos)=>PearsonGL.External.rootJS.A0597552_updateLabels({'value':val,'name':name,'desmos':desmos,'log':console.log});

  ts.A0597534_init = (val, name, desmos)=>PearsonGL.External.rootJS.A0597534_init({'value':val,'name':name,'desmos':desmos,'log':console.log});

  ts.A0597534_updateLabels = (val, name, desmos)=>PearsonGL.External.rootJS.A0597534_updateLabels({'value':val,'name':name,'desmos':desmos,'log':console.log});

  ts.A0597544_init = (val, name, desmos)=>PearsonGL.External.rootJS.A0597544_init({'value':val,'name':name,'desmos':desmos,'log':console.log});

  ts.A0597544_updateLabels = (val, name, desmos)=>PearsonGL.External.rootJS.A0597544_updateLabels({'value':val,'name':name,'desmos':desmos,'log':console.log});

  ts.A0597546_init = (val, name, desmos)=>PearsonGL.External.rootJS.A0597546_init({'value':val,'name':name,'desmos':desmos,'log':console.log});

  ts.A0597546_updateLabels = (val, name, desmos)=>PearsonGL.External.rootJS.A0597546_updateLabels({'value':val,'name':name,'desmos':desmos,'log':console.log});

  ts.A0597772_init = (val, name, desmos)=>PearsonGL.External.rootJS.A0597772_init({'value':val,'name':name,'desmos':desmos,'log':console.log});

  ts.A0597789_init = (val, name, desmos)=>PearsonGL.External.rootJS.A0597789_init({'value':val,'name':name,'desmos':desmos,'log':console.log});

  ts.A0597789_volumeCone = (val, name, desmos)=>PearsonGL.External.rootJS.A0597789_volumeCone({'value':val,'name':name,'desmos':desmos,'log':console.log});

  ts.A0597789_volumeStack = (val, name, desmos)=>PearsonGL.External.rootJS.A0597789_volumeStack({'value':val,'name':name,'desmos':desmos,'log':console.log});

  ts.A0597768_init = (val, name, desmos)=>PearsonGL.External.rootJS.A0597768_init({'value':val,'name':name,'desmos':desmos,'log':console.log});

  ts.A0597777_init = (val, name, desmos)=>PearsonGL.External.rootJS.A0597777_init({'value':val,'name':name,'desmos':desmos,'log':console.log});

  ts.A0598652_init = (val, name, desmos)=>PearsonGL.External.rootJS.A0598652_init({'value':val,'name':name,'desmos':desmos,'log':console.log});

  ts.A0598652_updateLabels = (val, name, desmos)=>PearsonGL.External.rootJS.A0598652_updateLabels({'value':val,'name':name,'desmos':desmos,'log':console.log});

  ts.A0597714_init = (val, name, desmos)=>PearsonGL.External.rootJS.A0597714_init({'value':val,'name':name,'desmos':desmos,'log':console.log});

  ts.A0597773_init = (val, name, desmos)=>PearsonGL.External.rootJS.A0597773_init({'value':val,'name':name,'desmos':desmos,'log':console.log});

  ts.A0596373_init = (val, name, desmos)=>PearsonGL.External.rootJS.A0596373_init({'value':val,'name':name,'desmos':desmos,'log':console.log});

  ts.A0596373_changeStep = (val, name, desmos)=>PearsonGL.External.rootJS.A0596373_changeStep((arguments.length>1)?{'value':val,'name':name,'desmos':desmos,'log':console.log}:val);

  ts.A0596370_init = (val, name, desmos)=>PearsonGL.External.rootJS.A0596370_init({'value':val,'name':name,'desmos':desmos,'log':console.log});

  ts.A0596370_changeStep = (val, name, desmos)=>PearsonGL.External.rootJS.A0596370_changeStep((arguments.length>1)?{'value':val,'name':name,'desmos':desmos,'log':console.log}:val);

  ts.A0597714_updateLabels = (val, name, desmos)=>PearsonGL.External.rootJS.A0597714_updateLabels({'value':val,'name':name,'desmos':desmos,'log':console.log});

  ts.A0597538_init = (val, name, desmos)=>PearsonGL.External.rootJS.A0597538_init({'value':val,'name':name,'desmos':desmos,'log':console.log});

  ts.A0597538_updateLabels = (val, name, desmos)=>PearsonGL.External.rootJS.A0597538_updateLabels({'value':val,'name':name,'desmos':desmos,'log':console.log});

  ts.A0597616_label = (val, name, desmos)=>PearsonGL.External.rootJS.A0597616_label({'value':val,'name':name,'desmos':desmos,'log':console.log});

  ts.A0597616_label_noCorrection = (val, name, desmos)=>PearsonGL.External.rootJS.A0597616_label_noCorrection({'value':val,'name':name,'desmos':desmos,'log':console.log});

  ts.A0597720_labelEquation = (val, name, desmos)=>PearsonGL.External.rootJS.A0597720_labelEquation({'value':val,'name':name,'desmos':desmos,'log':console.log});

  ts.A0597598_A_labelAngle = (val, name, desmos)=>PearsonGL.External.rootJS.A0597598_A_labelAngle({'value':val,'name':name,'desmos':desmos,'log':console.log});

  ts.A0596385_init = (val, name, desmos)=>PearsonGL.External.rootJS.A0596385_init({'value':val,'name':name,'desmos':desmos,'log':console.log});

  ts.A0597503_init = (val, name, desmos)=>PearsonGL.External.rootJS.A0597503_init({'value':val,'name':name,'desmos':desmos,'log':console.log});

  ts.A0596385_updateAngles = (val, name, desmos)=>PearsonGL.External.rootJS.A0596385_updateAngles({'value':val,'name':name,'desmos':desmos,'log':console.log});

  ts.A0596392_init = (val, name, desmos)=>PearsonGL.External.rootJS.A0596392_init({'value':val,'name':name,'desmos':desmos,'log':console.log});

  ts.A0597629_init = (val, name, desmos)=>PearsonGL.External.rootJS.A0597629_init({'value':val,'name':name,'desmos':desmos,'log':console.log});

  ts.A0597630_init = (val, name, desmos)=>PearsonGL.External.rootJS.A0597630_init({'value':val,'name':name,'desmos':desmos,'log':console.log});

  ts.A0597631_equation = (val, name, desmos)=>PearsonGL.External.rootJS.A0597631_equation({'value':val,'name':name,'desmos':desmos,'log':console.log});

  ts.A0597634_init = (val, name, desmos)=>PearsonGL.External.rootJS.A0597634_init({'value':val,'name':name,'desmos':desmos,'log':console.log});

  ts.A0596385_drawExtensions = (val, name, desmos)=>PearsonGL.External.rootJS.A0596385_drawExtensions({'value':val,'name':name,'desmos':desmos,'log':console.log});

  ts.A0597724_init = (val, name, desmos)=>PearsonGL.External.rootJS.A0597724_init({'value':val,'name':name,'desmos':desmos,'log':console.log});

  ts.A0597724_dragging = (val, name, desmos)=>PearsonGL.External.rootJS.A0597724_dragging({'value':val,'name':name,'desmos':desmos,'log':console.log});

  exports.gcf = function(arr) {
    var arr = arr.value;
    var i, y,
        n = arr.length,
        x = Math.abs(arr[0]);
   
    for (i = 1; i < n; i++) {
      y = Math.abs(arr[i]);
   
      while (x && y) {
        (x > y) ? x %= y : y %= x;
      }
      x += y;
    }
   
     return new PearsonGL.Parameters.Parameter(x,"single","integer");
   }
  
  Object.assign(exports,flattenFuncStruct(ts));

  return exports;
})();
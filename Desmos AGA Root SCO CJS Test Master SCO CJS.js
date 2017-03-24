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
        observeZoom:'' // Tracks zoom level in units/px as x_{pxScale} and y_{pxScale}
      }
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

  //* functions for test purposes only
  ts.shared.init.observeZoom = function(val, name, desmos) {
    return PearsonGL.External.rootJS.shared_init_observeZoom({'value':val,'name':name,'desmos':desmos,'log':console.log});
  }

  //* functions for test purposes only
  ts.A0597514_init = function(val, name, desmos) {
    return PearsonGL.External.rootJS.A0597514_init({'value':val,'name':name,'desmos':desmos,'log':console.log});
  }

  //* functions for test purposes only
  ts.A0597514_updateLabels = function(val, name, desmos) {
    return PearsonGL.External.rootJS.A0597514_updateLabels({'value':val,'name':name,'desmos':desmos,'log':console.log});
  }

 //* functions for test purposes only
  ts.A0597534_init = function(val, name, desmos) {
    return PearsonGL.External.rootJS.A0597534_init({'value':val,'name':name,'desmos':desmos,'log':console.log});
  }

  //* functions for test purposes only
  ts.A0597534_updateLabels = function(val, name, desmos) {
    return PearsonGL.External.rootJS.A0597534_updateLabels({'value':val,'name':name,'desmos':desmos,'log':console.log});
  }

 //* functions for test purposes only
  ts.A0597552_init = function(val, name, desmos) {
    return PearsonGL.External.rootJS.A0597552_init({'value':val,'name':name,'desmos':desmos,'log':console.log});
  }

  //* functions for test purposes only
  ts.A0597552_updateLabels = function(val, name, desmos) {
    return PearsonGL.External.rootJS.A0597552_updateLabels({'value':val,'name':name,'desmos':desmos,'log':console.log});
  }

  //* functions for test purposes only
  ts.A0597534_init = function(val, name, desmos) {
    return PearsonGL.External.rootJS.A0597534_init({'value':val,'name':name,'desmos':desmos,'log':console.log});
  }

  //* functions for test purposes only
  ts.A0597534_updateLabels = function(val, name, desmos) {
    return PearsonGL.External.rootJS.A0597534_updateLabels({'value':val,'name':name,'desmos':desmos,'log':console.log});
  }

  //* functions for test purposes only
  ts.A0597538_init = function(val, name, desmos) {
    return PearsonGL.External.rootJS.A0597538_init({'value':val,'name':name,'desmos':desmos,'log':console.log});
  }

  //* functions for test purposes only
  ts.A0597538_updateLabels = function(val, name, desmos) {
    return PearsonGL.External.rootJS.A0597538_updateLabels({'value':val,'name':name,'desmos':desmos,'log':console.log});
  }

  //* functions for test purposes only
  ts.A0597598_A_labelAngle = function(val, name, desmos) {
    return PearsonGL.External.rootJS.A0597598_A_labelAngle({'value':val,'name':name,'desmos':desmos,'log':console.log});
  }

  
  Object.assign(exports,flattenFuncStruct(ts));

  return exports;
})();
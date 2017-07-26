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
      label:{}, // Label functions are used for labeling points with certain values
      expression:{} // Expression functions are used for manipulating the expression list
    },
    sliderVal:function(val,name,desmos){return PearsonGL.External.rootJS.shared_label_valueOnly((desmos!==undefined)?{'value':val,'name':name,'desmos':desmos,'log':console.log}:val);}
  };

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
    console.log('redirecting from Master to Root SCO for testing');
    return PearsonGL.External.rootJS.reflectParabola((desmos!==undefined)?{'value':val,'name':name,'desmos':desmos,'log':console.log}:val);
    //console.log(name + " was updated to " + val);
    //desmos.setExpression({id: 'reflected', latex: 'y=-a(x-' + val + ')^2-k', color: '#00AA00'});
  };

  /** FUNCTIONS TRANSLATE OLD API (value, name, desmos)
      INTO NEW API ({value:…,name:…,desmos:…,uniqueId:…})
      AND ADD LOGGING FUNCTIONALITY FOR TEST PURPOSES
      DELETE ALL WHEN API IS UPDATED
      **/

  ts.shared.init.observeZoom = (val, name, desmos)=>PearsonGL.External.rootJS.shared_init_observeZoom((desmos!==undefined)?{'value':val,'name':name,'desmos':desmos,'log':console.log}:val);

  ts.shared.init.shareState = (val, name, desmos)=>PearsonGL.External.rootJS.shared_init_shareState((desmos!==undefined)?{'value':val,'name':name,'desmos':desmos,'log':console.log, 'uniqueId':'shared'}:val);

  ts.shared.label.labelEquation = (val, name, desmos)=>PearsonGL.External.rootJS.shared_label_labelEquation((desmos!==undefined)?{'value':val,'name':name,'desmos':desmos,'log':console.log}:val);

  ts.shared.label.valueOnly = (val, name, desmos)=>PearsonGL.External.rootJS.shared_label_valueOnly((desmos!==undefined)?{'value':val,'name':name,'desmos':desmos,'log':console.log}:val);

  ts.shared.label.labelAngle = (val, name, desmos)=>PearsonGL.External.rootJS.shared_label_labelAngle((desmos!==undefined)?{'value':val,'name':name,'desmos':desmos,'log':console.log}:val);

  ts.shared.label.labelTriAngles = (val, name, desmos)=>PearsonGL.External.rootJS.shared_label_labelTriAngles((desmos!==undefined)?{'value':val,'name':name,'desmos':desmos,'log':console.log}:val);

  ts.shared.expression.showHide = (val, name, desmos)=>PearsonGL.External.rootJS.shared_expression_showHide((desmos!==undefined)?{'value':val,'name':name,'desmos':desmos,'log':console.log}:val);

  ts.A0597514_init = (val, name, desmos)=>PearsonGL.External.rootJS.A0597514_init((desmos!==undefined)?{'value':val,'name':name,'desmos':desmos,'log':console.log}:val);

  ts.A0597514_updateLabels = (val, name, desmos)=>PearsonGL.External.rootJS.A0597514_updateLabels((desmos!==undefined)?{'value':val,'name':name,'desmos':desmos,'log':console.log}:val);

  ts.A0596342_init = (val, name, desmos)=>PearsonGL.External.rootJS.A0596342_init((desmos!==undefined)?{'value':val,'name':name,'desmos':desmos,'log':console.log}:val);

  ts.A0596342_updateLabels = (val, name, desmos)=>PearsonGL.External.rootJS.A0596342_updateLabels((desmos!==undefined)?{'value':val,'name':name,'desmos':desmos,'log':console.log}:val);

   ts.A0596342_2_init = (val, name, desmos)=>PearsonGL.External.rootJS.A0596342_2_init((desmos!==undefined)?{'value':val,'name':name,'desmos':desmos,'log':console.log}:val);

  ts.A0596342_2_updateLabels = (val, name, desmos)=>PearsonGL.External.rootJS.A0596342_2_updateLabels((desmos!==undefined)?{'value':val,'name':name,'desmos':desmos,'log':console.log}:val);

  ts.A0596347_init = (val, name, desmos)=>PearsonGL.External.rootJS.A0596347_init((desmos!==undefined)?{'value':val,'name':name,'desmos':desmos,'log':console.log}:val);

  ts.A0596347_updateLabels = (val, name, desmos)=>PearsonGL.External.rootJS.A0596347_updateLabels((desmos!==undefined)?{'value':val,'name':name,'desmos':desmos,'log':console.log}:val);


   ts.A0597217_init = (val, name, desmos)=>PearsonGL.External.rootJS.A0597217_init((desmos!==undefined)?{'value':val,'name':name,'desmos':desmos,'log':console.log}:val);

  ts.A0597217_reset = (val, name, desmos)=>PearsonGL.External.rootJS.A0597217_reset((desmos!==undefined)?{'value':val,'name':name,'desmos':desmos,'log':console.log}:val);

  ts.A0597206_init = (val, name, desmos)=>PearsonGL.External.rootJS.A0597206_init((desmos!==undefined)?{'value':val,'name':name,'desmos':desmos,'log':console.log}:val);

  ts.A0597206_updateLabels = (val, name, desmos)=>PearsonGL.External.rootJS.A0597206_updateLabels((desmos!==undefined)?{'value':val,'name':name,'desmos':desmos,'log':console.log}:val);

  ts.A0597220_init = (val, name, desmos)=>PearsonGL.External.rootJS.A0597220_init((desmos!==undefined)?{'value':val,'name':name,'desmos':desmos,'log':console.log}:val);

  ts.A0597220_simulation = (val, name, desmos)=>PearsonGL.External.rootJS.A0597220_simulation((desmos!==undefined)?{'value':val,'name':name,'desmos':desmos,'log':console.log}:val);

  ts.A0597225_init = (val, name, desmos)=>PearsonGL.External.rootJS.A0597225_init((desmos!==undefined)?{'value':val,'name':name,'desmos':desmos,'log':console.log}:val);

  ts.A0597225_resample = (val, name, desmos)=>PearsonGL.External.rootJS.A0597225_resample((desmos!==undefined)?{'value':val,'name':name,'desmos':desmos,'log':console.log}:val);

  ts.A0597227_init = (val, name, desmos)=>PearsonGL.External.rootJS.A0597227_init((desmos!==undefined)?{'value':val,'name':name,'desmos':desmos,'log':console.log}:val);

  ts.A0597227_simulation = (val, name, desmos)=>PearsonGL.External.rootJS.A0597227_simulation((desmos!==undefined)?{'value':val,'name':name,'desmos':desmos,'log':console.log}:val);



ts.A0597225_histReset = (val, name, desmos)=>PearsonGL.External.rootJS.A0597225_histReset((desmos!==undefined)?{'value':val,'name':name,'desmos':desmos,'log':console.log}:val);

  ts.A0598945_updateLabels = (val, name, desmos)=>PearsonGL.External.rootJS.A0598945_updateLabels((desmos!==undefined)?{'value':val,'name':name,'desmos':desmos,'log':console.log}:val);

  ts.A0598945_init = (val, name, desmos)=>PearsonGL.External.rootJS.A0598945_init((desmos!==undefined)?{'value':val,'name':name,'desmos':desmos,'log':console.log}:val);

  ts.A0597534_updateLabels = (val, name, desmos)=>PearsonGL.External.rootJS.A0597534_updateLabels((desmos!==undefined)?{'value':val,'name':name,'desmos':desmos,'log':console.log}:val);

  ts.A0597552_init = (val, name, desmos)=>PearsonGL.External.rootJS.A0597552_init((desmos!==undefined)?{'value':val,'name':name,'desmos':desmos,'log':console.log}:val);

  ts.A0597552_updateLabels = (val, name, desmos)=>PearsonGL.External.rootJS.A0597552_updateLabels((desmos!==undefined)?{'value':val,'name':name,'desmos':desmos,'log':console.log}:val);

  ts.A0598839_init = (val, name, desmos)=>PearsonGL.External.rootJS.A0598839_init((desmos!==undefined)?{'value':val,'name':name,'desmos':desmos,'log':console.log}:val);

  ts.A0598839_orange = (val, name, desmos)=>PearsonGL.External.rootJS.A0598839_orange((desmos!==undefined)?{'value':val,'name':name,'desmos':desmos,'log':console.log}:val);

  ts.A0598839_blue = (val, name, desmos)=>PearsonGL.External.rootJS.A0598839_blue((desmos!==undefined)?{'value':val,'name':name,'desmos':desmos,'log':console.log}:val);

  ts.A0597534_init = (val, name, desmos)=>PearsonGL.External.rootJS.A0597534_init((desmos!==undefined)?{'value':val,'name':name,'desmos':desmos,'log':console.log}:val);

  ts.A0597534_updateLabels = (val, name, desmos)=>PearsonGL.External.rootJS.A0597534_updateLabels((desmos!==undefined)?{'value':val,'name':name,'desmos':desmos,'log':console.log}:val);

  ts.A0597544_init = (val, name, desmos)=>PearsonGL.External.rootJS.A0597544_init((desmos!==undefined)?{'value':val,'name':name,'desmos':desmos,'log':console.log}:val);

  ts.A0597544_updateLabels = (val, name, desmos)=>PearsonGL.External.rootJS.A0597544_updateLabels((desmos!==undefined)?{'value':val,'name':name,'desmos':desmos,'log':console.log}:val);

  ts.A0597546_init = (val, name, desmos)=>PearsonGL.External.rootJS.A0597546_init((desmos!==undefined)?{'value':val,'name':name,'desmos':desmos,'log':console.log}:val);

  ts.A0597546_updateLabels = (val, name, desmos)=>PearsonGL.External.rootJS.A0597546_updateLabels((desmos!==undefined)?{'value':val,'name':name,'desmos':desmos,'log':console.log}:val);

  ts.A0597772_init = (val, name, desmos)=>PearsonGL.External.rootJS.A0597772_init((desmos!==undefined)?{'value':val,'name':name,'desmos':desmos,'log':console.log}:val);

  ts.A0597506_init = (val, name, desmos)=>PearsonGL.External.rootJS.A0597506_init((desmos!==undefined)?{'value':val,'name':name,'desmos':desmos,'log':console.log}:val);

  ts.A0597522_labelDiags = (val, name, desmos)=>PearsonGL.External.rootJS.A0597522_labelDiags((desmos!==undefined)?{'value':val,'name':name,'desmos':desmos,'log':console.log}:val);

  ts.A0598528_showHideQRST = (val, name, desmos)=>PearsonGL.External.rootJS.A0598528_showHideQRST((desmos!==undefined)?{'value':val,'name':name,'desmos':desmos,'log':console.log}:val);

  ts.A0598528_showHideEFGH = (val, name, desmos)=>PearsonGL.External.rootJS.A0598528_showHideEFGH((desmos!==undefined)?{'value':val,'name':name,'desmos':desmos,'log':console.log}:val);

  ts.A0597789_init = (val, name, desmos)=>PearsonGL.External.rootJS.A0597789_init((desmos!==undefined)?{'value':val,'name':name,'desmos':desmos,'log':console.log}:val);

  ts.A0597789_volumeCone = (val, name, desmos)=>PearsonGL.External.rootJS.A0597789_volumeCone((desmos!==undefined)?{'value':val,'name':name,'desmos':desmos,'log':console.log}:val);

  ts.A0597789_volumeStack = (val, name, desmos)=>PearsonGL.External.rootJS.A0597789_volumeStack((desmos!==undefined)?{'value':val,'name':name,'desmos':desmos,'log':console.log}:val);

  ts.A0597563_init = (val, name, desmos)=>PearsonGL.External.rootJS.A0597563_init((desmos!==undefined)?{'value':val,'name':name,'desmos':desmos,'log':console.log}:val);

  ts.A0597560_init = (val, name, desmos)=>PearsonGL.External.rootJS.A0597560_init((desmos!==undefined)?{'value':val,'name':name,'desmos':desmos,'log':console.log}:val);

  ts.A0597768_init = (val, name, desmos)=>PearsonGL.External.rootJS.A0597768_init((desmos!==undefined)?{'value':val,'name':name,'desmos':desmos,'log':console.log}:val);

  ts.A0597777_init = (val, name, desmos)=>PearsonGL.External.rootJS.A0597777_init((desmos!==undefined)?{'value':val,'name':name,'desmos':desmos,'log':console.log}:val);

  ts.A0598652_init = (val, name, desmos)=>PearsonGL.External.rootJS.A0598652_init((desmos!==undefined)?{'value':val,'name':name,'desmos':desmos,'log':console.log}:val);

  ts.A0598652_updateLabels = (val, name, desmos)=>PearsonGL.External.rootJS.A0598652_updateLabels((desmos!==undefined)?{'value':val,'name':name,'desmos':desmos,'log':console.log}:val);

  ts.A0597714_init = (val, name, desmos)=>PearsonGL.External.rootJS.A0597714_init((desmos!==undefined)?{'value':val,'name':name,'desmos':desmos,'log':console.log}:val);

  ts.A0597773_init = (val, name, desmos)=>PearsonGL.External.rootJS.A0597773_init((desmos!==undefined)?{'value':val,'name':name,'desmos':desmos,'log':console.log}:val);

  ts.A0596373_init = (val, name, desmos)=>PearsonGL.External.rootJS.A0596373_init((desmos!==undefined)?{'value':val,'name':name,'desmos':desmos,'log':console.log}:val);

  ts.A0596373_changeStep = (val, name, desmos)=>PearsonGL.External.rootJS.A0596373_changeStep((desmos!==undefined)?{'value':val,'name':name,'desmos':desmos,'log':console.log}:val);

  ts.A0596370_init = (val, name, desmos)=>PearsonGL.External.rootJS.A0596370_init((desmos!==undefined)?{'value':val,'name':name,'desmos':desmos,'log':console.log}:val);

  ts.A0596370_changeStep = (val, name, desmos)=>PearsonGL.External.rootJS.A0596370_changeStep((desmos!==undefined)?{'value':val,'name':name,'desmos':desmos,'log':console.log}:val);

  ts.A0597714_updateLabels = (val, name, desmos)=>PearsonGL.External.rootJS.A0597714_updateLabels((desmos!==undefined)?{'value':val,'name':name,'desmos':desmos,'log':console.log}:val);

  ts.A0597538_updateLabels = (val, name, desmos)=>PearsonGL.External.rootJS.A0597538_updateLabels((desmos!==undefined)?{'value':val,'name':name,'desmos':desmos,'log':console.log}:val);

  ts.A0596584_init = (val, name, desmos)=>PearsonGL.External.rootJS.A0596584_init((desmos!==undefined)?{'value':val,'name':name,'desmos':desmos,'log':console.log}:val);

  ts.A0596584_updateLabels = (val, name, desmos)=>PearsonGL.External.rootJS.A0596584_updateLabels((desmos!==undefined)?{'value':val,'name':name,'desmos':desmos,'log':console.log}:val);
    
    ts.A0596417_init = (val, name, desmos)=>PearsonGL.External.rootJS.A0596417_init((desmos!==undefined)?{'value':val,'name':name,'desmos':desmos,'log':console.log}:val);

  ts.A0596417_updateLabels = (val, name, desmos)=>PearsonGL.External.rootJS.A0596417_updateLabels((desmos!==undefined)?{'value':val,'name':name,'desmos':desmos,'log':console.log}:val);

  ts.A0598800_init = (val, name, desmos)=>PearsonGL.External.rootJS.A0598800_init((desmos!==undefined)?{'value':val,'name':name,'desmos':desmos,'log':console.log}:val);

  ts.A0598800_updateAVfunction = (val, name, desmos)=>PearsonGL.External.rootJS.A0598800_updateAVfunction((desmos!==undefined)?{'value':val,'name':name,'desmos':desmos,'log':console.log}:val);

 ts.A0598801_init = (val, name, desmos)=>PearsonGL.External.rootJS.A0598801_init((desmos!==undefined)?{'value':val,'name':name,'desmos':desmos,'log':console.log}:val);

  ts.A0598801_updateAVfunction = (val, name, desmos)=>PearsonGL.External.rootJS.A0598801_updateAVfunction((desmos!==undefined)?{'value':val,'name':name,'desmos':desmos,'log':console.log}:val);

   ts.A0598802_init = (val, name, desmos)=>PearsonGL.External.rootJS.A0598802_init((desmos!==undefined)?{'value':val,'name':name,'desmos':desmos,'log':console.log}:val);

  ts.A0598802_updateAVfunction = (val, name, desmos)=>PearsonGL.External.rootJS.A0598802_updateAVfunction((desmos!==undefined)?{'value':val,'name':name,'desmos':desmos,'log':console.log}:val);

ts.A0598803_init = (val, name, desmos)=>PearsonGL.External.rootJS.A0598803_init((desmos!==undefined)?{'value':val,'name':name,'desmos':desmos,'log':console.log}:val);

  ts.A0598803_updateAVfunction = (val, name, desmos)=>PearsonGL.External.rootJS.A0598803_updateAVfunction((desmos!==undefined)?{'value':val,'name':name,'desmos':desmos,'log':console.log}:val);


   ts.A0598789A_init = (val, name, desmos)=>PearsonGL.External.rootJS.A0598789A_init((desmos!==undefined)?{'value':val,'name':name,'desmos':desmos,'log':console.log}:val);

  ts.A0598789A_updateLabels = (val, name, desmos)=>PearsonGL.External.rootJS.A0598789A_updateLabels((desmos!==undefined)?{'value':val,'name':name,'desmos':desmos,'log':console.log}:val);

     ts.A0598789B_init = (val, name, desmos)=>PearsonGL.External.rootJS.A0598789B_init((desmos!==undefined)?{'value':val,'name':name,'desmos':desmos,'log':console.log}:val);

  ts.A0598789B_updateLabels = (val, name, desmos)=>PearsonGL.External.rootJS.A0598789B_updateLabels((desmos!==undefined)?{'value':val,'name':name,'desmos':desmos,'log':console.log}:val);

      ts.A0596417_MO_init = (val, name, desmos)=>PearsonGL.External.rootJS.A0596417_MO_init((desmos!==undefined)?{'value':val,'name':name,'desmos':desmos,'log':console.log}:val);

  ts.A0596417_MO_generatePoints = (val, name, desmos)=>PearsonGL.External.rootJS.A0596417_MO_generatePoints((desmos!==undefined)?{'value':val,'name':name,'desmos':desmos,'log':console.log}:val);

  ts.A0596417_MO2_init = (val, name, desmos)=>PearsonGL.External.rootJS.A0596417_MO2_init((desmos!==undefined)?{'value':val,'name':name,'desmos':desmos,'log':console.log}:val);

  ts.A0596417_MO2_randomSample = (val, name, desmos)=>PearsonGL.External.rootJS.A0596417_MO2_randomSample((desmos!==undefined)?{'value':val,'name':name,'desmos':desmos,'log':console.log}:val);

  ts.A0598832_init = (val, name, desmos)=>PearsonGL.External.rootJS.A0598832_init((desmos!==undefined)?{'value':val,'name':name,'desmos':desmos,'log':console.log}:val);

  ts.A0598832_changeLineType = (val, name, desmos)=>PearsonGL.External.rootJS.A0598832_changeLineType((desmos!==undefined)?{'value':val,'name':name,'desmos':desmos,'log':console.log}:val);

  ts.A0598832_regionsAddRemove = (val, name, desmos)=>PearsonGL.External.rootJS.A0598832_regionsAddRemove((desmos!==undefined)?{'value':val,'name':name,'desmos':desmos,'log':console.log}:val);

   ts.A0599213_init = (val, name, desmos)=>PearsonGL.External.rootJS.A0599213_init((desmos!==undefined)?{'value':val,'name':name,'desmos':desmos,'log':console.log}:val);

  ts.A0599213_changeLineType = (val, name, desmos)=>PearsonGL.External.rootJS.A0599213_changeLineType((desmos!==undefined)?{'value':val,'name':name,'desmos':desmos,'log':console.log}:val);

  ts.A0597616_label = (val, name, desmos)=>PearsonGL.External.rootJS.A0597616_label((desmos!==undefined)?{'value':val,'name':name,'desmos':desmos,'log':console.log}:val);

  ts.A0597616_label_noCorrection = (val, name, desmos)=>PearsonGL.External.rootJS.A0597616_label_noCorrection((desmos!==undefined)?{'value':val,'name':name,'desmos':desmos,'log':console.log}:val);

  ts.A0597720_labelEquation = (val, name, desmos)=>PearsonGL.External.rootJS.A0597720_labelEquation((desmos!==undefined)?{'value':val,'name':name,'desmos':desmos,'log':console.log}:val);

  ts.A0597598_A_labelAngle = (val, name, desmos)=>PearsonGL.External.rootJS.A0597598_A_labelAngle((desmos!==undefined)?{'value':val,'name':name,'desmos':desmos,'log':console.log}:val);

  ts.A0596385_init = (val, name, desmos)=>PearsonGL.External.rootJS.A0596385_init((desmos!==undefined)?{'value':val,'name':name,'desmos':desmos,'log':console.log}:val);

  ts.A0597503_init = (val, name, desmos)=>PearsonGL.External.rootJS.A0597503_init((desmos!==undefined)?{'value':val,'name':name,'desmos':desmos,'log':console.log}:val);

  ts.A0596385_updateAngles = (val, name, desmos)=>PearsonGL.External.rootJS.A0596385_updateAngles((desmos!==undefined)?{'value':val,'name':name,'desmos':desmos,'log':console.log}:val);

  ts.A0596392_init = (val, name, desmos)=>PearsonGL.External.rootJS.A0596392_init((desmos!==undefined)?{'value':val,'name':name,'desmos':desmos,'log':console.log}:val);

  ts.A0596392_labelTriAngles = (val, name, desmos)=>PearsonGL.External.rootJS.A0596392_labelTriAngles((desmos!==undefined)?{'value':val,'name':name,'desmos':desmos,'log':console.log}:val);

  ts.A0597629_init = (val, name, desmos)=>PearsonGL.External.rootJS.A0597629_init((desmos!==undefined)?{'value':val,'name':name,'desmos':desmos,'log':console.log}:val);

  ts.A0597630_init = (val, name, desmos)=>PearsonGL.External.rootJS.A0597630_init((desmos!==undefined)?{'value':val,'name':name,'desmos':desmos,'log':console.log}:val);

  ts.A0597631_equation = (val, name, desmos)=>PearsonGL.External.rootJS.A0597631_equation((desmos!==undefined)?{'value':val,'name':name,'desmos':desmos,'log':console.log}:val);

  ts.A0597744_init = (val, name, desmos)=>PearsonGL.External.rootJS.A0597744_init((desmos!==undefined)?{'value':val,'name':name,'desmos':desmos,'log':console.log}:val);

  ts.A0597634_init = (val, name, desmos)=>PearsonGL.External.rootJS.A0597634_init((desmos!==undefined)?{'value':val,'name':name,'desmos':desmos,'log':console.log}:val);

  ts.A0596385_drawExtensions = (val, name, desmos)=>PearsonGL.External.rootJS.A0596385_drawExtensions((desmos!==undefined)?{'value':val,'name':name,'desmos':desmos,'log':console.log}:val);

  ts.A0597724_init = (val, name, desmos)=>PearsonGL.External.rootJS.A0597724_init((desmos!==undefined)?{'value':val,'name':name,'desmos':desmos,'log':console.log}:val);

  ts.A0597724_dragging = (val, name, desmos)=>PearsonGL.External.rootJS.A0597724_dragging((desmos!==undefined)?{'value':val,'name':name,'desmos':desmos,'log':console.log}:val);

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

  exports.numberWithCommas = function(x) {
    var x = x.toString();
    x= String(x);
    var pattern = /(-?\d+)(\d{3})/;
    while (pattern.test(x))
        x = String(x).replace(pattern, "$1,$2");
    return new PearsonGL.Parameters.Parameter(x,"single","string");
   }
  
  Object.assign(exports,flattenFuncStruct(ts));

  return exports;
})();
/******************************************************************************
* !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! NOTICE !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! *
* !!!!!!!!!! This file is managed through the envision-aga      !!!!!!!!!!!!! *
* !!!!!!!!!!  repository on Github. Changes made directly in    !!!!!!!!!!!!! *
* !!!!!!!!!!  DCAT will be overwritten periodically when new    !!!!!!!!!!!!! *
* !!!!!!!!!!  versions are pushed.                              !!!!!!!!!!!!! *
* !!!!!!!!!! If you need access to the Github repository,       !!!!!!!!!!!!! *
* !!!!!!!!!!  please contact: joseph.strong@savvas.com          !!!!!!!!!!!!! *
* !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! *
******************************************************************************/


window.PearsonGL = window.PearsonGL || {};
window.PearsonGL.External = window.PearsonGL.External || {};

/******************************************************************************
* Module: masterJS
******************************************************************************/
PearsonGL.External.masterJS = (function() {

  "use strict";
  /******* DEBUG: SET EMPTY FUNCTION TO DISABLE CONSOLE MESSAGES ********/

  // window.debugLog = console.log

  var debugLog = (function(){
    if(window.debugLog) {
      return window.debugLog;
    } else {
      return function(){};
    }
  })();

  /***********************************************************************************
   * PRIVATE VARIABLES / FUNCTIONS
   **********************************************************************************/
  var exports = {};  // This object is used to export public functions/variables

  /* ←— myIsNaN —————————————————————————————————————————————————→ *\
   | replaces Number.isNaN in case of *shudder* IE
   * ←————————————————————————————————————————————————————————————————→ */
   var myIsNaN = (function(){
    if(typeof Number.isNaN !== "function") {
      return function(obj) {
        return (typeof obj === "number" && obj !== obj);
      };
    } else {
      return Number.isNaN;
    }
   })();

  /* ←— objKeys —————————————————————————————————————————————————→ *\
   | replaces Object.keys in case of *shudder* IE
   * ←————————————————————————————————————————————————————————————————→ */
   var objKeys = (function(){
    if(typeof Object.keys === "function"){
      return Object.keys;
    } else {
      // From https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/keys
      return (function () {
        var hasOwnProperty = Object.prototype.hasOwnProperty,
        hasDontEnumBug = !({toString: null}).propertyIsEnumerable('toString'),
        dontEnums = [
          'toString',
          'toLocaleString',
          'valueOf',
          'hasOwnProperty',
          'isPrototypeOf',
          'propertyIsEnumerable',
          'constructor'
        ],
        dontEnumsLength = dontEnums.length;

        return function (obj) {
          if (typeof obj !== 'object' && (typeof obj !== 'function' || obj === null)) {
            throw new TypeError('Object.keys called on non-object');
          }

          var result = [], prop, i;

          for (prop in obj) {
            if (hasOwnProperty.call(obj, prop)) {
              result.push(prop);
            }
          }

          if (hasDontEnumBug) {
            for (i = 0; i < dontEnumsLength; i++) {
              if (hasOwnProperty.call(obj, dontEnums[i])) {
                result.push(dontEnums[i]);
              }
            }
          }
          return result;
        };
      }());
    }
   })();

  /* ←— mergeObjects —————————————————————————————————————————————————→ *\
   | replaces Object.assign in case of *shudder* IE
   * ←————————————————————————————————————————————————————————————————→ */
   var mergeObjects = (function() {
    if (typeof Object.assign === "function") {
      return Object.assign;
    } else {
      return function(){
        var obj = arguments[0];

        [].forEach.call(arguments, function(arg,i) {
          var keys = [];
          if(typeof arg === "string") {
            while(keys.length < arg.length) {
              keys.push(keys.length);
            }
          } else {
            keys = objKeys(arg);
          }

          if(i > 0) {
            keys.forEach(function(key) {
              obj[key] = arg[key];
            });
          }
        });

        return obj;
      };
    }
   })();

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
  function flattenFuncStruct(funcStruct,prefix) {
    if (prefix === undefined) {
      prefix = '';
    }
    var functions={};
    objKeys(funcStruct).forEach(function(key) {
      if (typeof funcStruct[key] === 'object') {
        if (!(mergeObjects(functions,flattenFuncStruct(funcStruct[key],prefix+key+'_')))) {
          return false;
        }
      } else if (typeof funcStruct[key] === 'function') {
        functions[prefix+key] = funcStruct[key];
      } else {
        debugLog(prefix+key+' is not a function or object');
        return false;
      }
    });
    return functions;
  }

  var ts = { // test functions only
    shared:{ // Shared Helpers have functions that can be called by any Widget.
      init:{}, // Initialization Helpers are called only once, using HelperExpression({latex:"1"})
      label:{}, // Label functions are used for labeling points with certain values
      expression:{} // Expression functions are used for manipulating the expression list
    }
  };

  var vs;
  var hxs;
  var cs;
  var hs;
  var hsAttempts = 0;
  vs = setInterval(function(){
    if (PearsonGL.External.rootJS && typeof PearsonGL.External.rootJS.vs === 'object') {
      clearInterval(vs);
      vs = PearsonGL.External.rootJS.vs;
      hxs = PearsonGL.External.rootJS.hxs;
      cs = PearsonGL.External.rootJS.cs;
      hs = PearsonGL.External.rootJS.hs;
      debugLog('rootJS catalogs updated in masterJS on '+hsAttempts+'th attempt');
    } else {
      hsAttempts += 1;
    }
  },10);

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
    debugLog('redirecting from Master to Root SCO for testing');
    return PearsonGL.External.rootJS.reflectParabola((desmos!==undefined)?{'value':val,'name':name,'desmos':desmos,'log':debugLog}:val);
    //debugLog(name + " was updated to " + val);
    //desmos.setExpression({id: 'reflected', latex: 'y=-a(x-' + val + ')^2-k', color: '#00AA00'});
  };

  //  DEPRECATED
    var deprecated = [
      'A0596342_init',
      'A0596342_2_init',
      'A0596370_resetAnimation',
      'A0596373_init',
      'A0596373_resetAnimation',
      'A0596539_updateLabels',
      'A0596584_init',
      'A0596986_updateLabels',
      'A0597534_updateLabels',
      'A0597544_updateLabels',
      'A0597546_updateLabels',
      'A0597544_init',
      'A0597546_init',
      'A0597598_A_labelAngle',
      'A0598652_init',
      'A0597538_updateLabels',
      'A0596417_MO_init',
      'A0596417_MO2_init'
    ];

    deprecated.forEach(function(funcName){ts[funcName] = function(){
      debugLog(funcName+' has been deprecated; see tracker for updated info');
    };});

   //  END DEPRECATED

  // DCJS Test/Miscellaneous Functions

    /* ←— A0596417_MO2 FUNCTIONS ——————————————————————————————————————————————→ */
     ts.A0596417_MO2 = {
      /* ←— random Sample ————————————————————————————————————————————————————→ *\
       | populates a list with random points when a variable "r" is changed.
       |       
       | also random samples the list 100 time and generates a list of 100 means.
       | 
       * ←———————————————————————————————————————————————————————————————————→ */
       randomSample: function(){
        var o = hs.parseArgs(arguments);
        switch (o.name) {
          case 'R':
            break;
          default:
            return;
          }
            var myPop =[];
            var sampleList =[];
            var meansList =[];
            var sampleSum = 0;
            // var trueMean = 0;
            // var sMean = 0;
            var sampleMean;
            var n = 100;
            var i;
            var t;

          function arrayToList(arr) {
            return '['+arr+']';
            }
        // fill up population 100 random numbers from 1 to 100
       
        for (i = 0; i < n; i+=1){
            myPop[i]=Math.floor(Math.random()*100)+1;
        }

       // create list of population in Desmos
        
        o.desmos.setExpression({id: 'list11', latex: 'P='+arrayToList(myPop)});

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
  
        o.desmos.setExpression({id: 'list12', latex: 'S='+arrayToList(sampleList)});

       //create list of sample Means in Desmos.

          o.desmos.setExpression({id: 'list13', latex: 'M='+arrayToList(meansList)});

        }
     };

    /* ←— A0596417_MO FUNCTIONS (transpiled) ——————————————————————————————————————————————→ */
     ts.A0596417_MO = {
      /* ←— generatePoints ————————————————————————————————————————————————————→ *\
       | generatespoints when a variable "g" is changed.
       |       
       | H
       | 
       * ←———————————————————————————————————————————————————————————————————→ */
       generatePoints: function(){
        var o = hs.parseArgs(arguments);
        switch (o.name) {
          case 'g':
            break;
          default:
            return;
          }
            var n = 500;
            var xMin = 1;
            var xMax = 40;
            var yMin = 1;
            var yMax = 40;
            var xVal;
            var yVal;
            var i;
            for (i = 1; i <= n; i+=1){
              xVal = Math.floor(Math.random()*(xMax-xMin))+xMin;
              yVal = Math.floor(Math.random()*(yMax-yMin))+yMin;
              o.desmos.setExpression({id:500+i,latex:'\\left('+xVal+','+yVal+'\\right)',color:'#5d50b2'});
            }
        
        }
     };

    /* ←— usabilityTestNumberLine FUNCTIONS ————————————————————————————————→ */
     ts.usabilityTestNumberLine = {
      /* ←— init —————————————————————————————————————————————————————————→ *\
       | stuff
       * ←—————————————————————————————————————————————————————————————————→ */
       init: (function(){
        // Helper Functions
          var o = {log:debugLog}; //function(){}}; // change log to console.log to debug

          // Methods: next(), last(), all(), reset(start)
          var PrimeGenerator = (function() {

            //  Composites is an object so as to allow indexing by number,
            //  and is not an array, because length would be misleading
            var composites = {};
            mergeObjects(composites,{
              toArray: function() {
                var compositeList = [];
                objKeys(composites).forEach(function(key) {
                  if (composites[key] === true) {
                    compositeList.push(key);
                  }
                });
                return compositeList;
              },
              toString: function() {
                return composites.toArray().toString();
              },
              length: function() {
                return objKeys(composites).length-3;
              }
            });
            var primes = [2];
            var lastMax = 2;
            var hardMax = 3; // product of all known primes; add 1 for hard max. Credit Euclid.

            var lastChecked = 2;

            function sieve(min,max) {
              var i;
              var prime;
              var composite;
              o.log('Sieving from '+min+' to '+max+' with primes '+primes+' over composites '+composites);
              for(i = 0; i < primes.length; i += 1) {

                prime = primes[i];
                
                for(composite = (1+Math.floor(min/prime))*prime; composite <= max; composite += prime) {
                  composites[composite] = true;
                }
              }
            }

            function advance() {
              var j;
              var max;
              while (lastChecked <= hardMax) {
                // keep checking the sieve until you find one
                while(lastChecked < lastMax) {
                  lastChecked += 1;
                  if (!(composites[lastChecked])) {
                    
                    primes.push(lastChecked);

                    if(lastChecked > 2) {
                      hardMax = (hardMax - 1) * lastChecked + 1;
                    }

                    for (j = lastChecked*2; j < lastMax; j += lastChecked) {
                      composites[j] = true;
                    }

                    return(lastChecked);
                  }
                }
                // increase max by another reasonable interval, e.g. the largest known prime
                max = lastMax + primes[primes.length-1];
                sieve(lastMax,max);
                lastMax = max;
              }

              throw new Error("For some reason can't find the next prime number after "+primes[primes.length-1]+", despite looking all the way up to "+max+" = 2×3×5×…×"+primes[primes.length-1]);
            }

            var generator = function(n){
              if (n === undefined) {
                n = 1;
              }
              //  generates prime numbers greater than or equal to n
              if (this === window) {
                return;
              }

              var firstPrimeIndex = 0;

              var nextPrimeIndex = 0;

              this.all = function(){
                return primes.filter(function(e,i){
                  e = e;
                  return (i >= firstPrimeIndex && i < nextPrimeIndex);
                });
              };

              this.last = function(){
                if (nextPrimeIndex === firstPrimeIndex) {
                  throw new Error("Generator has not been run yet.");
                }
                return primes[nextPrimeIndex-1];
              };

              this.reset = function(start){
                if(start === undefined) {
                  start = primes[firstPrimeIndex];
                }
                nextPrimeIndex = 0;
                var i = 0;
                while (this.next() < start) {
                  i += 1;
                }
                nextPrimeIndex = nextPrimeIndex - 1;
                firstPrimeIndex = nextPrimeIndex;
              };

              this.next = function(){
                var nextPrime = primes[nextPrimeIndex];
                while(primes.length <= nextPrimeIndex) {
                  nextPrime = advance();
                }
                nextPrimeIndex += 1;
                return nextPrime;
              };

              this.reset(n);

              return this;
            };

            generator.getPrimes = function(max,min){
              if (min === undefined) {
                min = 2;
              }
              max = max || lastMax;

              while(max > lastMax) {
                advance();
              }

              return primes.slice(function(e){
                return (e >= min && e <= max);
              });
            };

            return generator;
          }());

          function getPrimes(max,min) {
            if (min === undefined) {
              min = 2;
            }
            //  returns a list of prime numbers less than or equal to max

            // uses a PrimeGenerator if possible
            if (PrimeGenerator) {
              return PrimeGenerator.getPrimes(max,min);
            }

            var composites = {};
            var primes = [];

            var k;
            var j;

            for (k = 2; k < max; k += 1) {

              if (!(composites[k])) {
                
                primes.push(k);

                for (j = k*2; j < max; j += k) {
                  composites[j] = true;
                }
              }
            }

            return primes;
          }

          var divisors = (function() {
            var catalog = {};

            return function(n) {

              var noDivide;
              var myDivisors;
              var dividends;
              var maxDivisor;
              var k;
              var j;

              if(!(catalog[n])) {

                //  returns an array of all whole number divisors of number n, in ascending order
                //  includes 1 and n, even if n is not a whole number
                noDivide = {};
                myDivisors = [1];
                dividends = [n];
                maxDivisor = n;

                for (k = 2; k < maxDivisor; k += 1) {

                  if (!(noDivide[k])) {
                    
                    if (n % k !== 0) {

                      for (j = k; j < maxDivisor; j += k) {
                        noDivide[j] = true;
                      }

                    } else {

                      myDivisors.push(k);
                      maxDivisor = n/k;
                      if (maxDivisor !== k) {
                        dividends.push(maxDivisor);
                      }

                    }
                  }
                }

                while(dividends.length>0) {
                  myDivisors.push(dividends.pop());
                }

                catalog[n] = myDivisors;
              }

              return catalog[n].slice();
            };
          }());

          var factor = (function(){
            var catalog = {};

            return function(n,factors) {
              //  returns an array of multiplicities of each number in the factorization of n
              //  if optional argument factors is given, uses only those factors
              //  otherwise, uses a list of prime factors up to the greatest prime divisor
              //  Note: if given factor list is not relatively prime to itself and n, the total product
              //  will be greater than n
              // 
              //  Returned array will have the additional property "factorList", a copy of factors

              catalog[n] = catalog[n] || {};

              var mults;
              var factorList;
              var i;
              var myFactor;
              var k;

              if(!(catalog[n][factors])) {

                mults = [];
                factorList = factors || getPrimes(n);

                for (i = 0; i < factorList.length; i += 1) {
                  mults[i] = 0;
                  myFactor = factorList[i];
                  k = n;
                  while (k > 1 && k % myFactor === 0) {
                    mults[i] += 1;
                    k /= myFactor;
                  }
                }

                catalog[n][factors] = {
                  factors: factorList,
                  multiplicities: mults
                };

              }

              var out = catalog[n][factors].multiplicities.slice();
              out.factorList = catalog[n][factors].factors.slice();

              return out;
            };
          }());

          var intervalPreferences = (function(){
            var catalog = {};

            return function(n, min, max, excludeRelativePrimes) {
              if (min === undefined) {
                min = 1;
              }
              if (excludeRelativePrimes === undefined) {
                excludeRelativePrimes = false;
              }
              //  returns array of integers from minIntervals to maxIntervals or n, whichever is lower
              //  
              //  sorted as, from lowest to highest at each level:
              //    1. divisors of n
              //    2. divisors of 2^k*n (unless excluded as a relative prime)
              //    3. divisors of 10n (unless excluded as a relative prime)
              //    4*. divisors of n*(each prime divisor of n, in order)
              //    5*. divisors of n*(each prime divisor of n, in order, squared)
              //    6*. divisors of n^2
              //    7*. all other integers less than n (unless excludeRelativePrimes is set)
              //
              //  the array will have additional properties:
              //    order: array of values of m = k*n considered above, in order they were considered

              max = max || n;

              var orderInclusive = [];
              var orderExclusive = [];
              var m;
              var k;
              var primes;
              var listInclusive = [];
              var coveredInclusive = [];
              var listExclusive = [];
              var coveredExclusive = [];
              var answer;
              var out;
              var i;

              if(!(catalog[n])) {

                catalog[n] = {
                  inclusive:{},
                  exclusive:{}
                };

                // 1. divisors of n
                orderInclusive.push(n);
                orderExclusive.push(n);

                // 2. divisors of 2^k*n
                m = n;
                k = 2;
                while(m % 2 === 0) {
                  m /= 2;
                  k *= 2;
                }
                while(k < n) {
                  orderInclusive.push(k*m);
                  if(n % 2 === 0) {
                    orderExclusive.push(k*m);
                  }
                  k *= 2;
                }

                // 3. divisors of 10n
                orderInclusive.push(10*n);
                if(n % 10 === 0) {
                  orderExclusive.push(10*n);
                }

                // 4. prime divisors of n
                primes = factor(n).map(function(e,i,a){
                  if(e === 0) {
                    return 0;
                  } else {
                    return a.factorList[i];
                  }
                }).filter(function(e) {
                  return (e >= 2);
                });
                primes.forEach(function(e) {
                  orderInclusive.push(e*n);
                  orderExclusive.push(e*n);
                });

                // 5. prime divisors of n, squared
                primes.forEach(function(e) {
                  orderInclusive.push(e*e*n);
                  orderExclusive.push(e*e*n);
                });

                // 6. divisors n^2
                orderInclusive.push(n*n);
                orderExclusive.push(n*n);

                catalog[n].inclusive.order = orderInclusive.filter(function(e,i,a) {
                  return (a.indexOf(e) === i);
                });

                catalog[n].exclusive.order = orderExclusive.filter(function(e,i,a) {
                  return (a.indexOf(e) === i);
                });

                orderInclusive.forEach(function(e) {
                  var divs = divisors(e);
                  divs.forEach(function(e) {
                    if(!(coveredInclusive[e])) {
                      coveredInclusive[e] = true;
                      listInclusive.push(e);
                    }
                  });
                });
                catalog[n].inclusive.list = listInclusive;

                orderExclusive.forEach(function(e) {
                  var divs = divisors(e);
                  divs.forEach(function(e) {
                    if(!(coveredExclusive[e])) {
                      coveredExclusive[e] = true;
                      listExclusive.push(e);
                    }
                  });
                });
                catalog[n].exclusive.list = listExclusive;
              }

              if (excludeRelativePrimes) {
                answer = catalog[n].exclusive;
              } else {
                answer = catalog[n].inclusive;
              }

              out = answer.list.filter(function(e){
                return (min <= e && e <= max);
              });
              out.order = answer.order.slice();

              if(!excludeRelativePrimes) {
                for(i = min; i <= max; i += 1) {
                  if(out.indexOf(i) === -1) {
                    out.push(i);
                  }
                }
              }

              return out;
            };
          }());

          function alignPreferences(list1,list2,distance) {
            if(distance === undefined) {
              distance = function(l1,l2,a,b){
                l1 = l1;
                l2 = l2;
                return a+b;
              };
            }
            var preferences = [];
            var i;
            var j;
            var k;

            // start with taxicab distance, preferring list2 ([1,0] comes before [0,1])
            for(i = 0; i <= list1.length+list2.length; i += 1) {
              j = Math.min(i,list1.length);
              for(k = i - j; j >= 0 && k < list2.length; k += 1) {
                if(list1[j] === list2[k]) {
                  preferences.push({'1':j,'2':k});
                }
                j -= 1;
              }
            }

            preferences.sort(function(a,b){
              var d1 = distance(list1,list2,a[1],a[2]);
              var d2 = distance(list1,list2,b[1],b[2]);
              var p;
              var q;

              // slight preference for the smaller value, if two preferences are equal
              if (d1 === d2) {
                p = list1[a[1]];
                q = list1[b[1]];

                if(typeof p === "number" && !(myIsNaN(p)) &&
                  typeof q === "number" && !(myIsNaN(q))) {
                  return (p - q);
                }
              }

              return (d1 - d2);
            });

            var coords;

            for (i = 0; i < preferences.length; i += 1) {
              coords = preferences[i];
              if (list1[coords[1]] !== list2[coords[2]]) {
                o.log("NOOOOOOO");
              }
              preferences[i] = list1[coords[1]];
            }

            return preferences;
          }

          // function divideWholeForPart(whole,part,wholePreferences) {

            //   if(wholePreferences === undefined) wholePreferences = intervalPreferences(whole);

            //   var preferences = Array.from(wholePreferences);

            //   var evenDivisors = [];
            //   var catalog = {};
            //   var i;
            //   var j;
            //   var newPref;

            //   for(i = 0; i < wholePreferences.length; i += 1) {
            //     catalog[i] = true;
            //     if(whole%wholePreferences[i] === 0) evenDivisors.push(wholePreferences[i]);
            //   }
            //   for(i = 0; i < evenDivisors.length; i += 1) {
            //     for(j = i; j < evenDivisors.length; j += 1) {
            //       newPref = evenDivisors[i]*evenDivisors[j];
            //       if(!(catalog[newPref])) {
            //         catalog[newPref] = true;
            //         preferences.push(newPref);
            //       }
            //     }
            //   }

            //   var scaledParts = preferences.map(function(i){return part*i;});

            //   var simpleErrors = scaledParts.map(function(p){return p%whole;}).map(function(E){return Math.min(E,whole-E);});

            //   var intervalRelativeError = simpleErrors.map(function(r){return r/whole;});

            //   var wholeRelativeError = [];
            //   for(i = 0; i < intervalRelativeError.length; i += 1) {
            //     wholeRelativeError[i] = intervalRelativeError[i]/preferences[i];
            //   }

            //   var indices = [];
            //   for(i = 0; i < preferences.length; i += 1) {
            //     indices.push(i);
            //   }

            //   indices.sort((a,b)=>{
            //     var preferA;
            //     if(simpleErrors[a]===0 && simpleErrors[b] === 0) {
            //       o.log('both '+preferences[a]+' and '+preferences[b]+' divide');
            //       return (a - b);
            //     } else if (simpleErrors[a] === 0) {
            //       o.log(preferences[a]+' divides');
            //       return -1;
            //     } else if (simpleErrors[b] === 0) {
            //       o.log(preferences[b]+' divides');
            //       return 1;
            //     } else if (intervalRelativeError[a] <= 0.1 && intervalRelativeError[b] <= 0.1) {
            //       o.log('close contenders '+preferences[a]+','+preferences[b]);
            //       return (a - b);
            //     } else if ((a < wholePreferences.length) == (b < wholePreferences.length)) {
            //       preferA = (wholeRelativeError[a] - wholeRelativeError[b]);
            //       if(preferA < 0) o.log(preferences[a]+' is better than '+preferences[b]);
            //       else o.log(preferences[b]+' is better than '+preferences[a]);
            //       return preferA;
            //     } else if (a < wholePreferences.length) {
            //       o.log(preferences[b]+' was fabricated; '+preferences[a]+' was not.')
            //       return -1;
            //     } else if (b < wholePreferences.length) {
            //       o.log(preferences[a]+' was fabricated; '+preferences[b]+' was not.')
            //       return 1;
            //     }
            //     o.log('something\'s wrong');
            //     return 0;
            //   });

            //   preferences = indices.map(function(i){return preferences[i];});

            //   return preferences;
            // }

          function chooseIntervals(W,p,min,maxMajor,maxMinor) {
            p = p;
            if(min === undefined) {
              min = 1;
            }
            if(maxMajor === undefined) {
              maxMajor = 20;
            }
            if(maxMinor === undefined) {
              maxMinor = 100;
            }

            var majorIntervalsW = 1;
            var minorIntervalsW;
            var majorIntervals100 = 2;
            var minorIntervals100;

            // Prefer divisors of both.
            var preferencesW = intervalPreferences(W,1,maxMinor,true);
            var preferences100 = intervalPreferences(100,2,maxMinor,true);
            var preferences = alignPreferences(preferencesW,preferences100,
              function(w,c,iw,ic) {
                w = w;
                c = c;
                return iw*10+ic*Math.sqrt(W);
              }
            );

            o.log('W',preferencesW,'100',preferences100,'joint',preferences);

            var i;
            var interval;
            if(preferences.length > 0) {
              for(i = 0; i < preferences.length; i += 1) {
                interval = preferences[i];
                if((i === 0 ||
                  interval > majorIntervalsW) &&
                  interval <= maxMajor &&
                  interval % 2 === 0 && // Always show 50%
                  100 % interval === 0 &&
                  W % interval === 0) {
                  majorIntervalsW = interval;
                  majorIntervals100 = interval;
                }
              }
            }

            // Subdivide based on chosen Major Interval (if any)
            minorIntervalsW = 1;
            for(i = 0; i < preferencesW.length; i += 1) {
              interval = preferencesW[i];
              if(interval > minorIntervalsW &&
                interval % majorIntervalsW === 0 &&
                W % interval === 0) {
                minorIntervalsW = interval;
              }
            }

            minorIntervals100 = 2;
            for(i = 0; i < preferences100.length; i += 1) {
              interval = preferences100[i];
              if(interval > minorIntervals100 &&
                interval % majorIntervals100 === 0 &&
                100 % interval === 0) {
                minorIntervals100 = interval;
              }
            }

            // Increase Major Interval resolution, aligning with subdivisions
            var betterMajor = majorIntervalsW;
            for(i = 0; i < preferencesW.length; i += 1) {
              interval = preferencesW[i];
              if(interval > betterMajor &&
                interval <= maxMajor &&
                interval % majorIntervalsW === 0 &&
                minorIntervalsW % interval === 0 &&
                W % interval === 0) {
                betterMajor = interval;
              }
            }
            majorIntervalsW = betterMajor;

            betterMajor = majorIntervals100;
            for(i = 0; i < preferences100.length; i += 1) {
              interval = preferences100[i];
              if(interval > betterMajor &&
                interval <= maxMajor &&
                interval % majorIntervals100 === 0 &&
                minorIntervals100 % interval === 0 &&
                100 % interval === 0) {
                betterMajor = interval;
              }
            }
            majorIntervals100 = betterMajor;

            o.log('W Major:',majorIntervalsW,'100 Major:',majorIntervals100);


            var out = {
              majorIntervalsW: majorIntervalsW,
              minorIntervalsW: minorIntervalsW,
              majorIntervals100: majorIntervals100,
              minorIntervals100: minorIntervals100
            };

            return out;
          }

          var mostMajorIntervals = 29;

        return function(){
          var obj = hs.parseArgs(arguments);
          var hlps = hxs[obj.uniqueId];
          mergeObjects(hlps,{
            W:hlps.maker({latex:'W'}),
            p:hlps.maker({latex:'p'}),
            scalex:hlps.maker({latex:'t_{ickx}'})
          });

          function updateBar() {
            var p = hlps.p.numericValue;
            var W = hlps.W.numericValue;

            obj.desmos.setExpressions([
              {
                id:'p_labelP',
                label:''+(Math.round(100*p)/100)
              },
              {
                id:'p_label100',
                label:''+(Math.round(100*100*p/W)/100)+'%'
              }
            ]);
          }

          function updateIntervals() {
            var W = hlps.W.numericValue;
            if(W <= 0) {
              return;
            }
            var p = hlps.p.numericValue;
            var tick = hlps.scalex.numericValue;
            var spacing = 2*tick/3;
            var width = 100;
            var maxMinorIntervals = Math.max(2,Math.floor(width/spacing));
            var maxMajorIntervals = Math.max(2,Math.floor(width/(4*spacing)));
            var minIntervals = Math.max(2,Math.floor(width/(7*spacing)));

            var choices = chooseIntervals(W,p,minIntervals,maxMajorIntervals,maxMinorIntervals);
            obj.log(choices);
            var pSlider = {
              id:'pSlider',
              sliderBounds:{min:0,max:W}//,step:1} // apparently the step breaks everything
            };
            debugLog('pSlider:',pSlider);
            obj.desmos.setExpressions([
              {
                id:'majorIntervalsW',
                latex:'I_w='+choices.majorIntervalsW
              },
              {
                id:'majorIntervals100',
                latex:'I='+choices.majorIntervals100
              },
              {
                id:'minorIntervalsW',
                latex:'I_W='+choices.minorIntervalsW
              },
              {
                id:'minorIntervals100',
                latex:'I_{100}='+choices.minorIntervals100
              },
              {
                id:'p_labelW',
                label:''+(Math.round(100*W)/100)
              }// ,pSlider // apparently this removes the snapping interval
            ]);
            var newMostMajors = Math.max(choices.majorIntervals100,choices.majorIntervalsW);
            var exprs = [];
            var i;
            if(newMostMajors > mostMajorIntervals) {
              for (i = mostMajorIntervals+1; i <= newMostMajors; i += 1) {
                exprs.push(
                  {
                    id:'label100_'+i,
                    latex:'\\left(\\frac{100\\cdot'+i+'}{I},h_{100}-t_{icky}\\right)',
                    label:''+(Math.round(100*i*100/choices.majorIntervals100)/100)+'%',
                    showLabel:false,
                    hidden:true,
                    secret:true,
                    color:cs.color.agaColors.black
                  },
                  {
                    id:'labelP_'+i,
                    latex:'\\left(\\frac{100\\cdot'+i+'}{I_w},h_W-t_{icky}\\right)',
                    label:''+(Math.round(100*i*W/choices.majorIntervalsW)/100),
                    showLabel:false,
                    hidden:true,
                    secret:true,
                    color:cs.color.agaColors.black
                  },
                  {
                    id:'labelFrac_'+i,
                    latex:'\\left(\\frac{100\\cdot'+i+'}{I_w},h_W-1.4\\cdot t_{icky}\\right)',
                    label:''+(Math.round(100*W)/100),
                    showLabel:false,
                    hidden:true,
                    secret:true,
                    color:cs.color.agaColors.black
                  },
                  {
                    id:'labelW_'+i,
                    latex:'\\left(\\frac{100\\cdot'+i+'}{I_w},h_W-2\\cdot t_{icky}\\right)',
                    label:''+(Math.round(100*W)/100),
                    showLabel:false,
                    hidden:true,
                    secret:true,
                    color:cs.color.agaColors.black
                  }
                );
              }
              obj.desmos.setExpressions(exprs);
              mostMajorIntervals = newMostMajors;
            }
            exprs = [];
            for (i = 0; i <= mostMajorIntervals; i += 1) {
              if(i <= choices.majorIntervals100) {
                exprs.push(
                  {
                    id:'label100_'+i,
                    label:''+(Math.round(100*i*100/choices.majorIntervals100)/100),
                    showLabel:true
                  }
                );
              } else {
                exprs.push(
                  {
                    id:'label100_'+i,
                    showLabel:false
                  }
                );
              }

              if(i <= choices.majorIntervalsW) {
                exprs.push(
                  {
                    id:'labelP_'+i,
                    label:''+(Math.round(100*i*W/choices.majorIntervalsW)/100),
                    showLabel:true
                  // },
                  // {
                  //   id:'labelFrac_'+i,
                  //   showLabel:false
                  // },
                  // {
                  //   id:'labelW_'+i,
                  //   label:''+(Math.round(100*W)/100),
                  //   showLabel:false
                  }
                );
              } else {
                exprs.push(
                  {
                    id:'labelP_'+i,
                    showLabel:false
                  // },
                  // {
                  //   id:'labelFrac_'+i,
                  //   showLabel:false
                  // },
                  // {
                  //   id:'labelW_'+i,
                  //   showLabel:false
                  }
                );
              }
            }
            obj.desmos.setExpressions(exprs);
            updateBar();
          }

          hlps.W.observe('numericValue',updateIntervals);
          hlps.scalex.observe('numericValue',updateIntervals);
          hlps.p.observe('numericValue',updateBar);
        };
       }())
     };

    /* ←— decemberSales68 FUNCTIONS ————————————————————————————————→ */
     ts.decemberSales68 = {
      /* ←— updateLabels —————————————————————————————————————————————————————————→ *\
       | Updates labels on the number line
       * ←—————————————————————————————————————————————————————————————————→ */
       updateLabels: function(){
        var o = hs.parseArgs(arguments);

        var val = o.value;

        o.desmos.setExpressions([
        {
          id:'interval1Label',
          label:'|'+val+'| = '+val
        },
        {
          id:'interval2Label',
          label:'|−'+(-val)+'| = '+(-val)
        },
        {
          id:'point1Label',
          label:''+val
        },
        {
          id:'point2Label',
          label:'−'+(-val)
        },
        {
          id:'154',
          label:'Distance from 0 to '+val+' is '+val
        },
        {
          id:'155',
          label:'Distance from 0 to −'+(-val)+' is '+(-val)
        },
        {
          id:'6',
          color:(val >= 0 ? "#2D70B3" : "#C74440")
        },
        {
          id:'7',
          color:(val > 0 ? "#C74440" : "#2D70B3")
        }]);
       }
     };


  // Non-DCJS Functions

    exports.gcf = function(arr) {
      arr = arr.value;
      var i;
      var y;
      var n = arr.length;
      var x = Math.abs(arr[0]);
     
      for (i = 1; i < n; i += 1) {
        y = Math.abs(arr[i]);
     
        while (x && y) {
          if (x > y) {
            x %= y;
          } else {
            y %= x;
          }
        }
        x += y;
      }
     
       return new PearsonGL.Parameters.Parameter(x,"single","integer");
     };

    exports.numberWithCommas = function(x) {
      x = x.toString();
      x = String(x);
      var pattern = new RegExp('(-?\\d+)(\\d{3})');
      while (pattern.test(x)) {
        x = String(x).replace(pattern, "$1,$2");
      }
      return new PearsonGL.Parameters.Parameter(x,"single","string");
     };

        // reducedFractionDenoms(max_denominator, include_1, include_0);

    hs = {
      /* ←— factorize(n) (memoized) ———————————————————————————————————————→ *\
       ↑ Converts a number into a catalog of prime factors and their          |
       |  multiplicities.                                                     |
       |                                                                      |
       | @arg0: number ≥ 1                                                    |
       |                                                                      |
       | @Returns: catalog of the form {f1:m1,f2:m2,...}                      ↓
       * ←—————————————————————————————————————————————————————————————————→ */
      factorize: (function(){
        var catalog = {};
       return function(n) {
        if (n < 1) {
          throw new Error('Cannot factor numbers less than 1');
        }
        if (n % 1 !== 0) {
          throw new Error('Cannot factor non-integer values');
        }

        if (catalog[n]) {
         return mergeObjects({},catalog[n]);
        }

        var factorList = hs.getPrimes(2,n);
        var factorization = {};
        var k;
        var multiplicity;
        factorList.forEach(function(prime){
          k = n;
          multiplicity = 0;
          while (k > 1 && k % prime === 0) {
            multiplicity += 1;
            k /= prime;
          }
          if(multiplicity > 0) {
            factorization[prime] = multiplicity;
          }
        });

        catalog[n] = factorization;

        return mergeObjects({},factorization);
        };
       }()),
      /* ←— divisors(n) (memoized) ————————————————————————————————————————→ *\
       ↑ Converts a number into a catalog of prime factors and their          |
       |  multiplicities.                                                     |
       |                                                                      |
       | @arg0: number n ≥ 1                                                    |
       |                                                                      |
       | @Returns: array of divisors, sorted from 1 to n                      ↓
       * ←—————————————————————————————————————————————————————————————————→ */
      divisors: (function() {
        var catalog = {};

       return function(n) {

        if(!catalog[n]) {
          catalog[n] = hs.powerSet(hs.factorize(n)).sort(function(a,b){return (a-b);});
        }

        return catalog[n].slice();
        };
       }()),
      /* ←— getPrimes(min,max) (memoized) —————————————————————————————————→ *\
       ↑ Returns a list of prime numbers between min and max, inclusive       ↑
       |                                                                      |
       |                                                                      |
       | @arg0: Lower bound on prime numbers—defaults to 2                    |
       | @arg1: Upper bound on prime numbers—defaults to the maximum found    |
       |                                                                      |
       |                                                                      |
       | @Returns: array of values, in order                                  ↓
       * ←—————————————————————————————————————————————————————————————————→ */
      getPrimes: (function(){
        //  Composites is an object so as to allow indexing by number,
        //  and is not an array, because length would be misleading
        var composites = {};
        mergeObjects(composites,{
          toArray: function() {
            return objKeys(composites).filter(function(key) {
              return composites[key] === true;
            });
          },
          toString: function() {
            return composites.toArray().toString();
          },
          length: function() {
            // Subtract 3 for these 3 functions
            return objKeys(composites).length-3;
          }
        });
        var primes = [2];
        var lastChecked = 2;
        var lastMax = 2;
        var hardMax = 3; // product of all known primes plus 1. Credit Euclid.

        function sieve(min,max) {
          var i;
          var prime;
          var composite;
          debugLog('Sieving from '+min+' to '+max+' with primes '+primes+' over composites '+composites);
          for(i = 0; i < primes.length; i += 1) {

            prime = primes[i];
            
            for(composite = (1+Math.floor(min/prime))*prime; composite <= max; composite += prime) {
              composites[composite] = true;
            }
          }
        }

        function advance() {
          var j;
          var max;
          while (lastChecked <= hardMax) {
            // keep checking the sieve until you find one
            while(lastChecked < lastMax) {
              lastChecked += 1;
              if (!(composites[lastChecked])) {
                
                primes.push(lastChecked);

                hardMax = (hardMax - 1) * lastChecked + 1;

                // Add this new prime to the sieve.
                for (j = lastChecked*2; j <= lastMax; j += lastChecked) {
                  composites[j] = true;
                }

                return(lastChecked);
              }
            }
            // increase max by another reasonable interval, e.g. the largest known prime
            max = lastMax + primes[primes.length-1];
            sieve(lastMax,max);
            lastMax = max;
          }

          throw new Error("For some reason can't find the next prime number after "+primes[primes.length-1]+", despite looking all the way up to "+max+" = 2×3×5×…×"+primes[primes.length-1]);
        }

        return function(min,max) {
          min = min || 2;
          max = max || lastChecked;
          while(lastChecked < max) {
            advance();
          }
          return primes.filter(function(p){return (p <= max && p >= min);});
        };
       }()),
      /* ←— powerSet ——————————————————————————————————————————————————————→ *\
       ↑ Returns a list of all products, given a catalog of factors and       ↑
       |  multiplicities.                                                     |
       |                                                                      |
       | @arg0: catalog of the form {f1:m1,f2:m2,...}                         |
       |                                                                      |
       | @Returns: array of products, in no particular order                  ↓
       * ←—————————————————————————————————————————————————————————————————→ */
      powerSet: function powerSet(factorization) {
        factorization = mergeObjects({},factorization);
        var factorList = objKeys(factorization);

        var factor;
        var mult; //-iplicity

        // Clear factors with multiplicity 0
        while (!mult) {
          // If there are no remaining factors, then 1 is the loneliest
          if(factorList.length === 0) {
            debugLog('No more factors');
            return [1];
          }
          factor = Number(factorList.shift());
          mult = factorization[factor];
          delete factorization[factor];
          debugLog('Choosing factor '+factor+':'+mult);
        }

        // Start with the products of everything else
        var products = powerSet(factorization);

        // Multiply this factor by each product
        products.forEach(function(product){
          var multiplier = factor;
          var i;
          for(i = 1; i <= mult; i += 1) {
            products.push(product*multiplier);
            multiplier *= factor;
          }
        });
        debugLog(products);
        return products;
       },

      /* ←— gcf ———————————————————————————————————————————————————————————→ *\
       ↑ Finds the greatest common factor of two numbers                      |
       |                                                                      |
       | @arg0 {number}                                                       |
       | @arg1 {number}                                                       |
       | @Returns: greatest common factor of the two inputs (1 if rel.prime)  ↓
       * ←—————————————————————————————————————————————————————————————————→ */
       gcf: function(a,b){
        if(a === b || a === 1) {
          return a;
        } else if (b === 1) {
          return b;
        }
        var divisors_a = hs.divisors(a);
        var divisors_b = hs.divisors(b);
        var gcf = 1;

        var i = 0;
        var j = 0;

        while(i < divisors_a.length) {
          while(j < divisors_b.length && divisors_b[j] < divisors_a[i]) {
            j += 1;
          }

          if(j < divisors_b.length && divisors_b[j] === divisors_a[i]) {
            gcf = divisors_b[j];
          }

          i += 1;
        }

        return gcf;
       }
     };
    // Gets a list of denominators for reduced fractions.
    // Optionaly includes 1 (as 1/1) and/or 0 (as 0/1).
    exports.reducedFractionDenominators = function(max_denom, include_1, include_0) {
      max_denom = max_denom.value;
      include_1 = include_1.value;
      include_0 = include_0.value;

      var denoms = [];

      if (include_1) {
        denoms.push(1);
      }

      if (include_0) {
        denoms.push(1);
      }

      var denom;
      var num;
      for (denom = 2; denom <= max_denom; denom +=1) {
        for (num = 1; num < denom; num += 1) {
        if (hs.gcf(num, denom) === 1) {
            denoms.push(denom);
          }
        }
      }
      return new PearsonGL.Parameters.Parameter(denoms, "ordered", "integer");
     };

    // reducedFractionNums(max_denominator, include_1, include_0);
    // Gets a list of denominators for reduced fractions.
    // Optionaly includes 1 (as 1/1) and/or 0 (as 0/1).
    exports.reducedFractionNumerators = function(max_denom, include_1, include_0) {
      max_denom = max_denom.value;
      include_1 = include_1.value;
      include_0 = include_0.value;

      var nums = [];

      if (include_0) {
        nums.push(0);
      }

      if (include_1) {
        nums.push(1);
      }

      var denom;
      var num;
      for (denom = 2; denom <= max_denom; denom +=1) {
        for (num = 1; num < denom; num += 1) {
        if (hs.gcf(num, denom) === 1) {
            nums.push(num);
          }
        }
      }
      
      return new PearsonGL.Parameters.Parameter(nums, "ordered", "integer");
     };
  
  mergeObjects(exports,flattenFuncStruct(ts));

  console.log("Master CJS loaded");
  return exports;
}());
var appModuleName = (function () {
  // Properties
  ///////////////////////////
  var styleSheetLoc = "stylesheets/";
  var styleSheetDay = "jeeSite.css";
  var styleSheetNight = "jeeSiteNight.css"
  var moonPhasePercent = "0%";
  //TODO: ensure you have all possible cases here. Cases are from data returned by
  //the navy API call
  var moonPhaseDict = {
    "New Moon":"10%",
    "First Quarter":"25%",
    "Half Moon":"50%",
    "Full Moon":"100%",
    "Last Quarter":"25%"
  };

  //ANGULAR MODULE: A module is a collection of services, directives, controllers,
  //filters, and configuration information. You can think of a module as a container
  // for the different parts of your app – controllers, services, filters, directives, etc.
  //https://docs.angularjs.org/guide/module
  var appNameApp =  angular.module('appName', []);
  //ANGULAR CONTROLLER. This is where values and functions for the application
  //are defined. The purpose of controllers is to expose variables and functionality to expressions and directives.
  appNameApp.controller('TestController', function(){

  });
  // Private Methods
  ///////////////////////////
  //sets the global moon percent var
  var setMoonPhasePercent = function (astroData){
    //sanity check
    if($.isEmptyObject(astroData)) {
      alert("No astro data found");
      return;
    }
    //check if 'fracillum' property from astroData exists
    if(astroData.hasOwnProperty("fracillum")) {
      moonPhasePercent = astroData.fracillum;
    } else {
      //if no property, get the phase property from the 'closestphase' object in astroData
      var textPhase = astroData.closestphase.phase;
      moonPhasePercent = moonPhaseDict[textPhase];
    }
    console.log("Moon phase is: "+moonPhasePercent);
  }

  //change the CSS: used to switch between day/night UI modes
  var changeCSS = function (cssFile) {
    $("head link#swapSheet").attr('href',cssFile);
  }

  var drawMoon = function () {
    var moonElem = $(".moon");
    $(moonElem).attr("title","The moon is "+moonPhasePercent+" full");
    //TODO: Bonus points: use angular to do this
    //set css properties for moon element to portray current moon phase
    //up to half moon (if percentage between 0 - 50)
    var moonPhaseToInt = moonPhasePercent.replace(/%/g, "");
    moonPhaseToInt = parseInt(moonPhaseToInt);

    //TODO: works but flashes daytime UI before loading night style and is probably super sloppy
    //if the moon is near or at full, change stylesheet to night style
    if (moonPhaseToInt >= 95) {
      changeCSS(styleSheetLoc+styleSheetNight);
    } else changeCSS(styleSheetLoc+styleSheetDay);

    if(moonPhaseToInt >= 0 && moonPhaseToInt <= 50){
      //some weird math to make the pixel values map to the percentage better
      var moonMath = moonPhaseToInt * 0.6;
      var moonPhaseToPx = moonMath.toString();
      moonPhaseToPx = moonPhaseToPx+"px";
      $(moonElem).css("background-color","#1f235d");
      $(moonElem).css("border-right-color","#ccc");
      $(moonElem).css("border-right-width",moonPhaseToPx);
      $(moonElem).css("border-right-style","solid");
      //reset conflicting styles
      $(moonElem).css("border-left-width","0px");
      $(moonElem).css("border-left-style","none");
    } else {
      //TODO: test
    //After half moon (if percentage between 50 and 100):
    //apply different styles to simulate greater disc illumination.
      //First, subtract the moon phase value from 100 to set a proper border width
      moonPhaseToInt = 100-moonPhaseToInt;
      //some math to make the pixel values map to the percentage better (30px border)
      //width ends up being half moon phase, so mult. by 0.6 adjusts the values
      var moonMath = moonPhaseToInt * 0.6;
      //convert back to string
      var moonPhaseToPx = moonMath.toString();
      moonPhaseToPx = moonPhaseToPx+"px";
      $(moonElem).css("background-color","#ccc");
      $(moonElem).css("border-left-width",moonPhaseToPx);
      $(moonElem).css("border-left-style","solid");
      $(moonElem).css("border-left-color","#1f235d");
      //reset conflicting styles
      $(moonElem).css("border-right-width","0px");
      $(moonElem).css("border-right-style","none");
    }
  }

  // Public Methods, must be exposed in return statement below
  ///////////////////////////
  var navyAPICall = function () {
    //get all astronomical data for sun and moon from a US Navy API. Params needed:
    var loc = "Washington%20,%20DC";
    //TODO: do this server side eventually
    var today = new Date();
    //format date to mm/dd/yyyy for date param in api call
    today = today.getMonth()+1+"/"+today.getDate()+"/"+today.getFullYear();
    //TODO: note the URL is NOT https and potentially insecure
    var apiURL = "http://api.usno.navy.mil/rstt/oneday?date="+today+"&loc="+loc;

    //ajax call to navy api to get moon phase
    $.ajax({
       url: apiURL,
       data: {
          format: 'json'
       },
       error: function() {
          alert("error");
       },
       success: function(data) {
          setMoonPhasePercent(data);
          drawMoon();
       },
       type: 'GET'
    });
  };

  // Init
  ///////////////////////////
  // x = 10 + x;

  // Reveal public methods
  return {
    'navyAPICall': navyAPICall
  };
})();
appModuleName.navyAPICall();

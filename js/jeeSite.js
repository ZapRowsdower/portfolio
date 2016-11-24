var homePage = (function () {
  // Properties
  ///////////////////////////
  var styleSheetLoc = "stylesheets/",
      styleSheetDay = "jeeSite.css",
      styleSheetNight = "jeeSiteNight.css",
      moonPhasePercent = "0%",
      moonPhaseInt = 0,
      moonPeriod = "Waxing",
      //TODO: ensure you have all possible cases here. Cases are from data returned by
      //the navy API call
      moonPhaseDict = {
        "New Moon":"10%",
        "First Quarter":"25%",
        "Half Moon":"50%",
        "Full Moon":"100%",
        "Last Quarter":"25%"
      };

  // Private Methods
  ///////////////////////////
  //TODO: move to a utility file?
  // convert percent to int for comparisions
  var convertPercentToInt = function (percentage) {
    var removeSymbol = percentage.replace(/%/g, "");
    var int = parseInt(removeSymbol);
    return int;
  };
  //use navy data to set the moon period (waxing/waning)
  var setMoonPeriod = function (astroData) {
    //sanity check
    if($.isEmptyObject(astroData)) {
      alert("No astro data found");
      return;
    }
    if(astroData.hasOwnProperty("curphase")) {
      moonPeriod = astroData.curphase;
    }
  };
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
  };
  //set an int version of the moon phase (ex: '100%' == 100)
  var setMoonPhaseInt = function () {
    moonPhaseInt = convertPercentToInt(moonPhasePercent);
  };
  //change the CSS: used to switch between day/night UI modes
  var changeCSS = function (cssFile) {
    $("head link#swapSheet").attr('href',cssFile);
  };
  //change which CSS file to use based on moon phase
  var changeCSSByMoon = function () {
    //TODO: works but flashes daytime UI before loading night style and is probably super sloppy
    //if the moon is near or at full, change stylesheet to night style
    if (moonPhaseInt >= 80) {
      changeCSS(styleSheetLoc+styleSheetNight);
    } else changeCSS(styleSheetLoc+styleSheetDay);
    //
  };
  //sets styles to simulate moon phase
  var drawMoon = function () {
    //TODO: test over the course of the month
    var moonElem = $(".moon");
    var multiplier = 0.6;
    $(moonElem).attr("title","The moon is "+moonPhasePercent+" full");
    //set css properties for moon element to portray current moon phase
    //up to half moon (if percentage between 0 - 50)
    if(moonPhaseInt >= 0 && moonPhaseInt <= 50){
      //some weird math to make the pixel values map to the percentage better
      var moonMath = moonPhaseInt * multiplier;
      var moonPhaseToPx = moonMath.toString();
      moonPhaseToPx = moonPhaseToPx+"px";
      //apply class and phase
      $(moonElem).removeClass("after-half");
      $(moonElem).addClass("before-half");
      $(moonElem).css("border-right-width",moonPhaseToPx);
    } else {
    //After half moon (if percentage between 50 and 100):
    //apply different styles to simulate greater disc illumination.
      //First, subtract the moon phase value from 100 to set a proper border width
      moonPhaseInt = 100-moonPhaseInt;
      //some math to make the pixel values map to the percentage better (30px border)
      //width ends up being half moon phase, so mult. by 0.6 adjusts the values
      var moonMath = moonPhaseInt * multiplier;
      //convert back to string
      var moonPhaseToPx = moonMath.toString();
      moonPhaseToPx = moonPhaseToPx+"px";
      //apply class and phase
      $(moonElem).removeClass("before-half");
      $(moonElem).addClass("after-half");
      $(moonElem).css("border-left-width",moonPhaseToPx);
    }
  };
  //based on waxing/waning, rotate moon to simulate waxing/waning appearance
  var rotateMoon = function () {
    var moonElem = $(".moon");
    var reWaning = new RegExp('Waning','g');
    // var reWaxing = new RegExp('/Wax/g');
    //if its waning, rotate the moon 180
    if(reWaning.test(moonPeriod) === true) {
      moonElem.css("transform","rotate(180deg)");
    } else moonElem.css("transform","rotate(0deg)");
  };
  //get the requested object from local storage and convert back to an object
  var getData = function (keyStr){
    var data = localStorage.getItem(keyStr);
    if (data !== null) {
      data = JSON.parse(data);
    }
    return data;
  };
  //take the data object param, stringify it, and store it in localStorage
  var setData = function (keyStr,data) {
    localStorage.setItem(keyStr,JSON.stringify(data));
  };
  // Public Methods, must be exposed in return statement below
  ///////////////////////////
  //wrapper to do everything needed to show the proper moon phase based on navy data
  var buildMoonWrapper = function (moonData) {
    setMoonPhasePercent(moonData);
    setMoonPeriod(moonData);
    setMoonPhaseInt();
    // changeCSSByMoon();
    drawMoon();
    rotateMoon();
  };
  //check if the browser supports HTML5 local storage
  var hasLocalStorage = function () {
    //TODO: use if(Storage) instead
    if(typeof(Storage) !== "undefined") {
      return true;
    } else {
      return false;
    }
  };
  //check date of api call
  var hasCurrentData = function (keyStr, dateProp) {
    //check if requested data has been stored...
    var storedData = getData(keyStr);
    if(storedData !== null) {
      //if stored, check if today's UTC day matches stored UTC day
      var storedDataDate = storedData[dateProp];
      var today = new Date().getUTCDate();
      if(storedDataDate === today) {
        return true;
      } else return false;
    } else return false;
  };
  var navyAPICall = function () {
    //get all astronomical data for sun and moon from a US Navy API. Params needed:
    var loc = "Washington%20,%20DC";
    var today = new Date();
    //TODO: move to utility file
    // format date to mm/dd/yyyy for date param in api call
    today = today.getMonth()+1+"/"+today.getDate()+"/"+today.getFullYear();
    //TODO: note the URL is NOT https and potentially insecure
    var apiURL = "http://api.usno.navy.mil/rstt/oneday?date="+today+"&loc="+loc;

    //ajax call to navy api to get moon phase
    $.ajax({
       url: apiURL,
       data: {
          format: 'json'
       },
       error: function(error) {
         console.log(error);
       },
       success: function(data) {
          //if local storage support exists, store the date of the request
          if(hasLocalStorage() === true){
            var utcDay = new Date().getUTCDate();
            data.reqUTCDay = utcDay;
            setData("moonDataJSON",data);
          }
          buildMoonWrapper(data);
       },
       type: 'GET'
    });
  };
  var flickrNano = function (galleryElem) {
    $(galleryElem).nanoGallery({
      kind: 'flickr',
      userID: '142772868@N08',
      photoset: '72157667342772360',
      thumbnailWidth:'auto',
      thumbnailHeight:250,
      thumbnailHoverEffect: [{ name: 'labelAppear75', duration: 300 }],
      thumbnailLazyLoad: true,
      theme: 'light',
      viewerToolbar: {style: 'fullWidth'} ,
      thumbnailGutterWidth : 0,
      thumbnailGutterHeight : 0,
      fnInitGallery: function () {
        $(galleryElem).hide();
      }
     });
  };
  //code for nano gallery if using local images. not using this.
  var initNanoGalleryLocal = function (galleryElem) {
    $(galleryElem).nanoGallery({
        thumbnailWidth:'auto',thumbnailHeight:500,
        thumbnailHoverEffect: [{ name: 'labelAppear75', duration: 300 }],
        thumbnailLazyLoad: true,
        theme: 'light',
        viewerToolbar: {style: 'fullWidth'} ,
        items: photoMap
    });
  };
  // Reveal public methods
  return {
    'getData': getData,
    'hasLocalStorage': hasLocalStorage,
    'hasCurrentData': hasCurrentData,
    'navyAPICall': navyAPICall,
    'buildMoonWrapper': buildMoonWrapper,
    'initNanoGallery': flickrNano
  };
})();
homePage.initNanoGallery('#photoPortfolio');

//if browser has local storage, check if any stored moon data exists and fire off ajax call if it doesn't
if(homePage.hasLocalStorage() === true) {
  //moon data is out of date so call the navy api
  if(homePage.hasCurrentData("moonDataJSON", "reqUTCDay") === false) {
    homePage.navyAPICall();
  //not out of date so retrieve stored data and draw the moon
  } else homePage.buildMoonWrapper(homePage.getData("moonDataJSON"));
} else homePage.navyAPICall();

//init bootstrap scrollspy for nav section highlighting behavior
$('body').scrollspy({
  target: '.navbar',
  offset: 160
});

//smooth scrolling jquery library init
$('.navbar-fixed-top a, .back-to-top-wrapper a, .portfolio-nav').bind('click', function () {
  //portfolio nav behavior for showing/hiding selected sections
  if($(this).hasClass("portfolio-nav")) {
    $(".portfolio-section").hide();
    $($(this).attr("href")).show();
  }
  $('html, body').stop().animate({
    scrollTop: $($(this).attr('href')).offset().top-140
  }, 500, 'easeInOutExpo');
  event.preventDefault();
});

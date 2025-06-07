// ==UserScript==
// @name         TrackContributionTraffic
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       https://www.mountainproject.com/user/107585679/aaron-wait
// @match        https://www.mountainproject.com/aaronsScripts*
// @match        https://www.mountainproject.com/user/*/*/routes*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=mountainproject.com
// @grant        none
// @require      https://code.jquery.com/jquery-3.6.0.min.js
// @require      https://maxcdn.bootstrapcdn.com/bootstrap/3.4.1/js/bootstrap.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/Chart.js/2.9.4/Chart.min.js
// @resource     CHART_JS_CSS https://cdnjs.cloudflare.com/ajax/libs/Chart.js/2.9.4/Chart.min.css
// @grant        GM_addStyle
// @grant        GM_getResourceText
// ==/UserScript==


const SAVED_ROUTE_URL_TO_TRACK = [
    "https://www.mountainproject.com/route/105790187/dairy-freeze",
    "https://www.mountainproject.com/route/118958743/hadleys-roof",
    "https://www.mountainproject.com/route/124969670/finished-business",
    "https://www.mountainproject.com/route/124969741/business-before-pleasure",
    "https://www.mountainproject.com/route/126257316/shih-tzu-jiu-jitsu-19-apex-predator",
];

(function() {
   /*
        ######################################################
        Initialize Constants, add the options/buttons to the page
        ######################################################
*/
    'use strict';
    var CURRENT_PAGE = window.location.href;
    const urlParams = new URLSearchParams(window.location.search);

    $('body').prepend("<div id='graphSpace'></div>");

    $('body').prepend("<table>"+
      "<tr>"+
         // start first tool option
         "<td>"+
           "<table style='border: 1px solid black; margin:35px;' class='rex_padding'>"+
             "<tr>"+
               "<th class='rex_padding'>"+
                  "<button type='button' id='generateUserGraph'>Generate Graphs For User:</button>"+
               "</th>" +
	           "<td class='rex_padding'>"+
                 "<textarea style='height:35px; width:100%;' id='userUrl'></textarea>"+
               "</td>"+
             "</tr>"+
	         "<tr>"+
               "<td class='rex_padding'>"+
                 "<p style=width:250px;>Only Supplies first page worth of data from user's \"shared routes\" page. Enter User URL ending in user alias - e.g. https://www.mountainproject.com/user/107585679/aaron-wait</p>"+
               "</td>"+
             "</tr>"+
           "</table>"+
         "</td>" +
         // start second tool option
	     "<td>"+
           "<table style='border: 1px solid black; margin:35px;' class='rex_padding'>"+
             "<tr>"+
               "<th class='rex_padding'><button type='button' id='generateGraphFromArray'>"+
    	         "Generate Graph From Array</button>"+
               "</th>"+
             "</tr>"+
	         "<tr>"+
               "<td class='rex_padding'>"+
                 "<p style=width:250px;>Generates graph using route URL written directly in this scripts source as part of the SAVED_ROUTE_URL_TO_TRACK constant</p>"+
               "</td>"+
             "</tr>"+
           "</table>"+
         "</td>"+
         // start third tool option
         "<td>"+
           "<table style='border: 1px solid black; margin:35px;' class='rex_padding'>"+
             "<tr>"+
               "<th class='rex_padding'>"+
                  "<button type='button' id='generateGraphFromInputRoutes'>Generate Graphs From Text:</button>"+
               "</th>" +
	           "<td class='rex_padding'>"+
                 "<textarea style='height:35px; width:100%;' id='routUrlInputs'></textarea>"+
               "</td>"+
             "</tr>"+
	         "<tr>"+
               "<td class='rex_padding'>"+
                 "<p style=width:250px;>enter comma separated routes here - e.g. https://www.mountainproject.com/route/125000175/corruption,https://www.mountainproject.com/route/125046246/man-flesh</p>"+
               "</td>"+
             "</tr>"+
           "</table>"+
         "</td>" +
       "<tr>"+
     "</table>");



    $('head').prepend(generatePageStyleSheet());
    // give the styles a few ms to get applied before scrolling to 'new' top of page.
    pausecomp(10);
    window.scrollTo(0, 0);


    /*
        ######################################################
        Graphs Stuff START
        ######################################################
    */
  const createChartFor = (chartLabel, dataForChart, chartNum) => {
    document.body.prepend(createElement('div', {
      props: {
        className: 'chart-wrapper-'+chartNum
      },
      children: [
        createElement('canvas', {
          attrs: { id: 'my-canvas' }
        })
      ]
    }));

    const chartData = {
      label: chartLabel,
      data: dataForChart
    };

    const myChart = createSimpleBarChart('#my-canvas', chartData);

  };

  const createChart = (canvas, settings) => new Chart((typeof canvas === 'string' ? document.querySelector(canvas) : canvas).getContext('2d'), settings);

  const createElement = (tagName, config = {}) => {
    const el = document.createElement(tagName);
    if (config.attrs) Object.entries(config.attrs).forEach(([attr, val]) => el.setAttribute(attr, val));
    if (config.props) Object.entries(config.props).forEach(([prop, val]) => el[prop] = val);
    if (config.css) Object.entries(config.css).forEach(([prop, val]) => el.style[prop] = val);
    if (config.children) config.children.forEach(child => el.append(child));
    return el;
  };

  const createSimpleBarChart = (selector, chartData) => {
    const { data, label } = chartData;
    return createChart(selector, {
      type: 'line',
      data: {
        labels: data.map(({ key }) => key),
        datasets: [{
          label: label,
          data: data.map(({ value }) => value),
          //backgroundColor: data.map(({ backgroundColor }) => backgroundColor),
          borderColor: data.map(({ borderColor }) => borderColor),
          borderWidth: 1
        }]
      },
      options: {
        scales: {
          yAxes: [{
            ticks: {
              beginAtZero: true
            }
          }]
        }
      }
    });
  };



   /*
        ######################################################
        Main control state machine
        ######################################################
*/
    // need to do a redirect for user
    if (urlParams.get('generateGraphForUser')) {
    	generateGraphs({"mode":"fromUser"});
    }


    // initiate graph building
	$("#generateGraphFromInputRoutes").click(function(){
        if ("" == $("#routUrlInputs").val()) {
           alert("you need to actuall pass something in");
        } else {
           generateGraphs({"mode":"fromRouteTextInput","routeUrlString": $("#routUrlInputs").val()});
        }
	});
    $("#generateGraphFromArray").click(function(){
		generateGraphs({"mode":"fromArray"});
	});
	$("#generateUserGraph").click(function(){
        if ("" == $("#userUrl").val()) {
            alert("you need to actuall pass something in");
        } else {
            window.location.href = $("#userUrl").val()+"/routes?generateGraphForUser=1";
        }
	});

    function generateGraphs(input) {
        var loadingMessage = "LOADING...";
        var stats;
        switch (input.mode) {
            case "fromArray":
                loadingMessage = "Loading tick stats from array..."
                stats = getStatsFromArray();
                break;
            case "fromUser":
                loadingMessage = "Loading tick stats for user..."
                stats = getStatsFromUserPage();
                break;
            case "fromRouteTextInput":
                loadingMessage = "Loading tick stats for: " + input.routeUrlString;
                stats = getStatsFromRouteTextInput(input.routeUrlString);
                break;
            default:
                alert("no mode passed in for graph generation");
                return;
        }

        var noneFound = stats.noneFound;
	    var routeStats = stats.routeStats;

        // create "loading" space
	    if (!noneFound) {
	        // create space for chart
	        $("#graphSpace").append("<div style='width:893px;height:892px;' id='graphSpaceloading'><p style='margin:150px;'>"+loadingMessage+"</p></div>");
	        pausecomp(10);
            window.scrollTo(0, 0);
	    }

	    // now visit each url
	    var last2WeeksTickData = [];
	    var totalTickData = [];
	    var tickPromises = [];
	    routeStats.forEach(function (routeStat) {
	        var promise1 = fetch(routeStat.url)
	            .then(function(response) {
	                return response.json();
	            })
	            .then(routetotalTickData => {
	                last2WeeksTickData.push({ key: routeStat.name, value: getTickCountForLastTwoWeeks(routetotalTickData)});
	                totalTickData.push({ key: routeStat.name, value: routetotalTickData.total});
	                return true;
	            });
	        tickPromises.push(promise1);
	    });

	    Promise.allSettled(tickPromises).then(() => {
	        if (!noneFound) {
                 $("#graphSpaceloading").remove();

                totalTickData.sort((a,b) => {
                    if (a.value < b.value) return 1;
                    if (a.value > b.value) return -1;
                });
	            createChartFor('Total Ticks', totalTickData, 1);
	            $('#graphSpace').prepend( $('.chart-wrapper-1') );

                last2WeeksTickData.sort((a,b) => {
                    if (a.value < b.value) return 1;
                    if (a.value > b.value) return -1;
                });
	            createChartFor('Ticks in Last 2 Weeks', last2WeeksTickData, 2);
	            $('#graphSpace').prepend( $('.chart-wrapper-2') );
	        } else {
                alert("none found!");
            }
	    });
    }

    function getStatsFromRouteTextInput(routeUrlString) {
                var noneFound = true;
        var routeStats = [];
        routeUrlString.split(',').forEach(function (routeUrl) {
            if (routeUrl != null) {
                // get the route name
                var routeUrlParts =  routeUrl.split('/');
                var routeName = routeUrlParts[routeUrlParts.length-1];
                console.log(routeName);

                noneFound = false;
                // from the main route url build the 'stat' url
                var routeId = routeUrl.match(/\d/g);
                routeId = routeId.join("")
                routeStats.push({
                    'url' : "https://www.mountainproject.com/api/v2/routes/"+ routeId +"/ticks?per_page=50&page=0",
                    'name' : routeName,
                });
            }
        });
        return {
            'routeStats' : routeStats,
            'noneFound' : noneFound
        };
    }

    function getStatsFromUserPage() {
        var noneFound = true;
	    var routeStats = [];
	    var routeRows = $('#user-profile > div:nth-child(2) > div > div.table-responsive > table.table.route-table.hidden-xs-down > tbody > tr > td');
	    Array.from(routeRows).forEach(function (routeRow) {
	        var routeUrlElement = $(routeRow).find('a').first();
	        if (routeUrlElement != null && routeUrlElement[0] != null) {
	            noneFound = false;
	            var routeUrl = routeUrlElement[0].href;

	            if (routeUrl != null) {
	                // from the main route url build the 'stat' url
	                var routeId = routeUrl.match(/\d/g);
	                routeId = routeId.join("")
	                routeStats.push({
	                    'url' : "https://www.mountainproject.com/api/v2/routes/"+ routeId +"/ticks?per_page=50&page=0",
	                    'name' : removeStrongTags(routeUrlElement[0].innerHTML),
	                });
	            }
	        }
	    });
        return {
           'routeStats' : routeStats,
            'noneFound' : noneFound
        };
    }

    function getStatsFromArray() {
        var noneFound = true;
        var routeStats = [];
        SAVED_ROUTE_URL_TO_TRACK.forEach(function (routeUrl) {
            if (routeUrl != null) {
                // get the route name
                var routeUrlParts =  routeUrl.split('/');
                var routeName = routeUrlParts[routeUrlParts.length-1];
                console.log(routeName);

                noneFound = false;
                // from the main route url build the 'stat' url
                var routeId = routeUrl.match(/\d/g);
                routeId = routeId.join("")
                routeStats.push({
                    'url' : "https://www.mountainproject.com/api/v2/routes/"+ routeId +"/ticks?per_page=50&page=0",
                    'name' : routeName,
                });
            }
        });
        return {
            'routeStats' : routeStats,
            'noneFound' : noneFound
        };
    }

    function getTickCountForLastTwoWeeks(routetotalTickData) {
        var tickCount = 0;
        if (routetotalTickData === null || routetotalTickData.data === null) {
            return 0;
        }
        routetotalTickData.data.forEach(function (tick) {
           var dateTick = tick.date;


           var now = new Date();
           now = now.getTime();

           var dayOfTick = Date.parse(dateTick);  // some date

           var diff = now - dayOfTick;

           // is diff from tick date and now less than 2 weeks of ms?
           if (diff <= 1210000000) {
              tickCount++;
           }
        });
        return tickCount;
    }

    function removeStrongTags(text) {
       return text.replace(/<\/?strong>/gi, '');
    }

    function generatePageStyleSheet() {
	    var styleSheet = "<style>";
	    styleSheet += ".rex_padding { margin: 20px; margin-top: 20px;  }";
	    styleSheet += "th, td { padding: 15px; }";
	    styleSheet += "</style>";
	    return styleSheet;
	}

	function pausecomp(millis)
	{
	    var date = new Date();
	    var curDate = null;
	    do { curDate = new Date(); }
	    while(curDate-date < (millis+50));
	}

    function getCookie(cname) {
        let name = cname + "=";
        let decodedCookie = decodeURIComponent(document.cookie);
        let ca = decodedCookie.split(';');
        for(let i = 0; i <ca.length; i++) {
            let c = ca[i];
            while (c.charAt(0) == ' ') {
                c = c.substring(1);
            }
            if (c.indexOf(name) == 0) {
                return c.substring(name.length, c.length);
            }
        }
        return "";
    }

})();








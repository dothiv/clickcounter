/**
 * This is the dotHIV banner control.
 */
(function() {

    @@include('domready.js')

    // -------- This is the main procedure -------- //
    // Check if this is the first visit and if we can set cookies
    var firstVisit = false;
    if (!getCookie())
        firstVisit = setCookie() ? true : false;

    // Fetch banner configuration from dotHIV server and add banner to DOM
    requestConfig(firstVisit);
    // -------- End of main procedure -------- //

    /**
     * Gets the dothiv status cookie and returns its value. If the cookie 
     * cannot be found, 'null' is returned.
     */
    function getCookie() {
        var cookieArray = document.cookie.split(';');
        for (var i = 0; i < cookieArray.length; i++)
            if (cookieArray[i] == 'dothivstatus=returning')
                return true;
        return false;
    }

    /**
     * Set a cookie to be able to distinguish new visitors from those who have
     * already seen the banner. Returns 'true' on success and 'false' otherwise.
     */
    function setCookie() {
        var value=escape(value);
        document.cookie='dothivstatus=returning';
        return getCookie() ? true : false;
    }

    /**
     * Sends a POST request to the server and receive banner configuration. The
     * server will be informed whether this is the first visit.
     */
    function requestConfig(firstVisit) {
        // Create new request
        var request;
        if (window.XMLHttpRequest)
            request = new XMLHttpRequest();
        else
            request = new ActiveXObject("Microsoft.XMLHTTP");

        // Define callback function
        request.onreadystatechange=function() {
            if (request.readyState==4 && request.status==200) {
                var config = (eval("(function(){return " + request.responseText + ";})()"));
                manipulateDOM(config);
            }
        }

        // Send request TODO: send instead POST to correct url
        //request.open("GET", "/data.json?firstvisit=" + firstVisit, true);
        //request.send();
        var config = {status: 45,money: '736.241',clickcount: '3.257.283',firstvisit: 'center',secondvisit: 'center',heading: 'Vielen Dank!',subheading: 'Dein Klick auf domain.hiv hat soeben einen Gegenwert von 1&thinsp;ct ausgel&ouml;st.',claim: 'Wir sind Teil der Bewegung',about: '&Uuml;ber dotHIV',vote: 'Vote',activated: 'Bisher aktiviert:',currency: '&euro;',corresponding: 'entspricht',clicks: 'Klicks'};
        registerMessageHandling(config);
        manipulateDOM(config);
    }

    /**
     * Register message handling. Supported messages are:
     *
     *  - 'get config': config object requested, send it back
     *  - 'remove':     iframe removal requested, delete it from DOM
     */
    function registerMessageHandling(config) {
        var eventMethod = window.addEventListener ? "addEventListener" : "attachEvent";
        var eventer = window[eventMethod];
        var messageEvent = eventMethod == "attachEvent" ? "onmessage" : "message";
        eventer(messageEvent, function(e) {
            switch (e.data) {
                case 'get config':
                    document.getElementById('dothiv-clickcounter').contentWindow.postMessage(config, "*");
                    break;
                case 'remove':
                    document.body.removeChild(document.getElementById('dothiv-clickcounter'));
                    if (document.getElementById('dothiv-background')) 
                        document.body.removeChild(document.getElementById('dothiv-background'));
                  break;
            }
        }, false);
    }

    /**
     * Manipulate the DOM by inserting dotHIV banner and css code. This will be
     * done once the DOM is ready.
     */
    function manipulateDOM(config) {
        domready(function () {
            // Determine which of the three banner versions to render
            if (firstVisit || (config.secondvisit != 'top' && config.secondvisit != 'right' && config.secondvisit != 'center'))
                switch(config.firstvisit) {
                    case 'center':
                        createCenterBanner(config);
                        break;
                    case 'right':
                        //createRightBanner(config, shortBar);
                        break;
                    default:
                        //createTopBanner(config, shortBar);
                        break;
                }
            else
               switch(config.secondvisit) {
                     case 'top':
                         //createTopBanner(config, shortBar);
                         break;
                     case 'center':
                        createCenterBanner(config);
                        break;
                     default:
                         //createRightBanner(config, shortBar);
                         break;
                }
        });
    }

    /**
     * Creates the 'center' version of the banner and inserts it into the DOM.
     */
    function createCenterBanner(config) {
        // Create banner iframe
        var bannerContainer = document.createElement('iframe');
        bannerContainer.id = 'dothiv-clickcounter';
        bannerContainer.src = 'banner-center.html';
        bannerContainer.scrolling = 'no';
        document.body.insertBefore(bannerContainer, document.body.firstChild);

        // Create background HTML structure
        var bannerBackground = document.createElement('div');
        bannerBackground.id = 'dothiv-background';
        document.body.insertBefore(bannerBackground, document.body.firstChild);

        // Include styles for banner
        var styleElement = document.createElement('style');
        var styleRules = "@@include('../css/iframe.css')";
        styleElement.type = 'text/css';
        if (styleElement.styleSheet) {
            styleElement.styleSheet.cssText = styleRules;
        } else {
           var textnode = document.createTextNode(styleRules);
            styleElement.appendChild(textnode);
        }
        document.head.appendChild(styleElement);

        // Register event for removing the banner when clicking on background
        document.getElementById("dothiv-background").onclick = function() {
            document.body.removeChild(document.getElementById('dothiv-clickcounter'));
            document.body.removeChild(document.getElementById('dothiv-background'));
        };
    }
})();

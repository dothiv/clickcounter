/**
 * This is the dotHIV banner control.
 */
(function() {
    // These are grunt includes
    //@@include('domready.js')
    //@@include('json2.js')
    //@@include('helpers.js')

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
        document.cookie='dothivstatus=returning';
        return getCookie() ? true : false;
    }

    /**
     * Sends a POST request to the server and receive banner configuration. The
     * server will be informed whether this is the first visit.
     */
    function requestConfig(firstVisit) {
        try {
            var request;
            if (window.XDomainRequest) {
                request = new XDomainRequest();
                request.onload = function() { ajaxCallback(request.responseText); };
                request.onprogress = function() {};
            } else {
                request = new XMLHttpRequest();
                request.onreadystatechange = function() {
                    if (request.readyState == 4 && request.status == 200) 
                        ajaxCallback(request.responseText);
                }
            }
            // Send request.
            // @ifdef DEBUG
            request.open("GET", "demo.json", true);
            // @endif
            // @ifndef DEBUG
            var pt = getPreviousVisit();
            var ct = Date.now();
            setPreviousVisit(ct);
            request.open("POST", "https://dothiv-registry.appspot.com/c?from=outside&domain=" + document.domain + '&pt=' + pt + '&ct=' + ct, true);
            // @endif
            request.send();
        } catch(e) {
            // Use default config if request fails
            var responseText = '{"secondvisit":"top","firstvisit":"top"}';
            ajaxCallback(responseText);
        }
    }

    /**
     * Saves time t as time last visited in a cookie.
     * 
     * @param t
     */
    function setPreviousVisit(t)
    {
        var lifetime = 2592000;
        var d = new Date();
        var expires = d.setTime(d.getTime() + lifetime * 1000);
        document.cookie = "dothivpt=" + t + ";path=/;max-age=" + lifetime + ";expires=" + d.toGMTString() + ";";
    }

    /**
     * Returns the timestamp in milliseconds of the previous visit (as stored in a cookie) or an empty string.
     * 
     * @return ''|int
     */
    function getPreviousVisit() 
    {
        var pt = '';
        var ptmatch = document.cookie.match('dothivpt=([0-9]{13})');
        if (ptmatch) {
            pt = ptmatch[1];
        }
        return pt;
    }

    /**
     * Callback function for handling config data and moving on.
     */
    function ajaxCallback(responseText) {
        var config = JSON.parse(responseText);
        if (hasMessaging()) {
            registerMessageHandling(config);
        }
        manipulateDOM(config);
    }

    /**
     * Returns whether window.postMessage is supported in this browser.
     *
     * @returns {boolean}
     */
    function hasMessaging()
    {
        return !!window.postMessage;
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
            var iframe = document.getElementById('dothiv-clickcounter');
            switch (e.data) {
                case 'get config':
                    iframe.contentWindow.postMessage(JSON.stringify(config), "*");
                    break;
                case 'remove':
                    if (document.getElementById('dothiv-outer'))
                        document.body.removeChild(document.getElementById('dothiv-outer'));
                    if (document.getElementById('dothiv-clickcounter'))
                        document.body.removeChild(document.getElementById('dothiv-clickcounter'));
                    if (document.getElementById('dothiv-background'))
                        document.body.removeChild(document.getElementById('dothiv-background'));
                  break;
                case 'expand':
                    iframe.className += ' dothiv-expanded';
                    break;
                case 'compact':
                    iframe.className = iframe.className.replace('dothiv-expanded', '');
                    break;
            }
        }, false);
    }

    /**
     * Manipulate the DOM by inserting dotHIV banner and css code. This will be
     * done once the DOM is ready.
     */
    function manipulateDOM(config) {
        // Enable a switch to force the rendering of a specific format.
        // Use #dothiv:{format} in the hash.
        if (window.location.hash.substr(1,7) == "dothiv:") {
            var forceFormat = window.location.hash.substr(8);
            switch(forceFormat) {
                case 'center':
                case 'right':
                case 'top':
                    config.firstvisit = config.secondvisit = forceFormat;
                    break;
            }
        }
        domready(function () {
            // Determine which of the three banner versions to render
            if (firstVisit || (config.secondvisit != 'top' && config.secondvisit != 'right' && config.secondvisit != 'center'))
                switch(config.firstvisit) {
                    case 'center':
                        createCenterBanner(config);
                        break;
                    case 'right':
                        createRightBanner(config);
                        break;
                    default:
                        createTopBanner(config);
                        break;
                }
            else
               switch(config.secondvisit) {
                     case 'right':
                         createRightBanner(config);
                         break;
                     case 'center':
                         createCenterBanner(config);
                         break;
                     default:
                         createTopBanner(config);
                         break;
    }});}

    /**
     * Inserts style rules for the iframes into the DOM.
     */
    function includeCSS() {
        var styleElement = document.createElement('style');
        var styleRules = "//@@include('../css/iframe.css')";
        styleElement.type = 'text/css';
        if (styleElement.styleSheet) {
            styleElement.styleSheet.cssText = styleRules;
        } else {
           var textNode = document.createTextNode(styleRules);
            styleElement.appendChild(textNode);
        }
        document.getElementsByTagName('head')[0].appendChild(styleElement);
    }

    /**
     * Returns an iframe DOM element configured for the given position. 
     * Supported positions are 'top', 'center' and 'right'.
     */
    function createIframeElement(position) {
        var bannerContainer = document.createElement('iframe');
        bannerContainer.id = 'dothiv-clickcounter';
        bannerContainer.className = 'dothiv-clickcounter-' + position;
        // @ifdef DEBUG
        bannerContainer.src = 'banner-' + position + '.html?' + Date.now();
        // @endif
        // @ifndef DEBUG
        bannerContainer.src = 'https://dothiv-registry.appspot.com/static/banner-' + position + '.html';
        // @endif
        bannerContainer.scrolling = 'no';
        bannerContainer.frameBorder = 0;
        bannerContainer.allowTransparency = true;
        bannerContainer.setAttribute("allowtransparency", "true");
        return bannerContainer;
    }

    /**
     * Creates the 'center' version of the banner and inserts it into the DOM.
     */
    function createCenterBanner(config) {
        var outerContainer = document.createElement('div');
        outerContainer.id = 'dothiv-outer';
        outerContainer.style.zIndex = 1;

        // Create banner iframe
        var bannerContainer = createIframeElement('center');

        // Create background HTML structure
        var bannerBackground = document.createElement('div');
        bannerBackground.id = 'dothiv-background';

        // If we have to deal with IE and it's running in Quirks mode...
        if(navigator.appName.indexOf("Internet Explorer")!=-1 && document.compatMode!=='CSS1Compat')
            bannerContainer.style.position = 'absolute';

        // Specials for IE6 standard mode
        if (isIE(6) && document.compatMode=='CSS1Compat') {
            bannerContainer.style.position = 'absolute';
            bannerBackground.style.height = '1200px';
        }

        outerContainer.appendChild(bannerBackground);
        outerContainer.appendChild(bannerContainer);

        document.body.insertBefore(outerContainer, null);

        // Insert CSS rules
        includeCSS();

        // Register event for removing the banner when clicking on background
        document.getElementById("dothiv-background").onclick = function() {
            document.body.removeChild(document.getElementById('dothiv-outer'));
        };
    }

    /**
     * Creates the 'right' version of the banner and inserts it into the DOM.
     */
    function createRightBanner(config) {
        // Create banner iframe
        var bannerContainer = createIframeElement('right');
        document.body.insertBefore(bannerContainer, null);

        // If we have to deal with IE and it's running in Quirks mode...
        var msie = getIE();
        if(navigator.appName.indexOf("Internet Explorer")!=-1 && document.compatMode!=='CSS1Compat') {
            bannerContainer.style.position = 'absolute';
            bannerContainer.style.bottom = '120px';
            bannerContainer.style.height = '56px'; // 48 + 8
            bannerContainer.style.right = '0';
        } else if (msie <= 9 && document.compatMode==='CSS1Compat') {
            bannerContainer.style.bottom = '240px';
            bannerContainer.style.right = '-240px';
            bannerContainer.style.height = '89px'; // 48 + 36 + 5
        }

        // Insert CSS rules
        includeCSS();

        if(navigator.appName.indexOf("Internet Explorer")!=-1 && document.compatMode!=='CSS1Compat') {
            bannerContainer.onmouseover = function() {
                bannerContainer.style.height = '84px'; // 48 + 36
            };
            bannerContainer.onmouseout = function() {
                bannerContainer.style.height = '56px'; // 48 + 8
            };
        } else if (msie <= 9 && document.compatMode==='CSS1Compat') {
            bannerContainer.onmouseover = function() {
                bannerContainer.style.right = '-212px'; // 240px - (36 - 8)
            };
            bannerContainer.onmouseout = function() {
                bannerContainer.style.right = '-240px';
            };
        } else {
            if (!isTouchDevice()) {
                // Register event for mouseover on iframe if messaging is not supported
                if (!hasMessaging()) {
                    bannerContainer.onmouseover = function() {
                        bannerContainer.className = 'dothiv-clickcounter-right dothiv-rb-mouseover';
                    };
                    bannerContainer.onmouseout = function() {
                        bannerContainer.className = 'dothiv-clickcounter-right';
                    };
                }
            }
        }
    }

    function createTopBanner(config) {
        // Create banner iframe
        var bannerContainer = createIframeElement('top');
        document.body.insertBefore(bannerContainer, null);

        // Insert CSS rules
        includeCSS();

        // Register event for mouseover on iframe
        bannerContainer.onmouseover = function() {
            bannerContainer.style.height = '90px';
        };
        bannerContainer.onmouseout = function() {
            bannerContainer.style.height = '60px';
        };
    }
})();

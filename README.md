jQueryMobile-Router
================================================================================

jQuery Mobile router is a plugin for jQuery Mobile to enhance the framework
with a client side router/controller that works with jQuery Mobile events
(pagebeforecreate, pagecreate, pagebeforeshow, pageshow, pagebeforehide, pagehide,
pageremove).

In addition, it extends jQM with a client-side parameters in the hash part of the url
(yay!!!)

The jQuery Mobile router javascript file must be loaded before jQuery Mobile.

This plugin can be used alone or (better) with Backbone.js or Spine.js, because it's
originally meant to replace their router with something integrated with jQM.


Why
=====================
A lot of people wonder why this router uses jQuery Mobile events instead of simply listening for hashchange, as a normal controller would do.

The main reason is to preserve the granularity offered by jQuery Mobile while giving the programmer a simple way to tap into "unusual" page transition states, such as "pageinit" or "pageremove", as if they were standard routes. The outcome is a controller which is more powerful and versatile, in the jQM realm, than its purely hashchange based counterpart.

Without a tight integration with the framework one would lose a lot of the possibilities offered by jQuery Mobile and this is not only a pity, but also very frustrating, especially when things get complicated (as it always does in real-life projects) and you need to resort to its most advanced functions.

In addition, if you want to use standard hashchange-based routers, you have to disable some of the features that make jQuery Mobile so unique among similar libraries and do a few things "by hand", just to fill an irreconcilable gap between how jQuery Mobile works and how we are used to handle routes in normal web applications.


What's new in the latest versions
=====================
* New options for pagebeforechange events: you can choose what kind of `toPage` argument your handler is
expecting: a string, a jQuery object or both
* Slightly changed the special support for pagebeforechange events. You have to call e.preventDefault()
to pause the transition and use the deferred object
* Added a "special" support for the pagebeforechange event, modeled after the pagebeforeload event
* Support for jQM 1.3.0. Older jQM version are still supported in the legacy version
  (jquery.mobile.router-legacy.js)
* Form parameters are now correctly handled
* support for pagebeforechange, pagebeforeload, pageload
* Added a parameter in the configuration object to execute only the first route handler found
* Support for a different syntax defining your routes
* Added a nice getParams() function to actually 'parse' parameters in the hash and get
a simple object to play with them.
* Support for the pageinit event.
* Bugfixes to support events for the first displayed page.
* Default handler support
* The original jquery mobile event is passed down to route handlers

Upgrade notes
=====================
v20130515 to v20130525
	Your bC handlers need to explicitly invoke e.preventDefault()

0.5 to 0.6
	You can define a default handler in the "conf" object. This will be called when
	no matching routes are found in the set you've provided

0.3 to 0.4
	The main javascript file has been renamed to jquery.mobile.router.js

0.2 to 0.3
	There's no need to use the data-params="true" anymore in your anchors since hash params
	are enabled by default.

**The reuseQueriedAjaxPages extension was removed since it wasn't so useful and
a similar behaviour can be achieved with the new jquery mobile caching mechanism
(but if you need it please mail me).**


The router/controller
=====================

Whenever jQuery Mobile changes the url (usually the fragment part) the router checks
if that particular url matches one of your routes and calls the handler you've
provided with a bunch of useful arguments.

When you define a route, you'll provide:

* a regular expression to test the url/hash against
* a handler (a function)
* when your handler must be called (for example, you may decide to setup a route only when the pagecreate and pagebeforeshow jQM events are dispatched)


The plugin exports a class in $.mobile.Router and you can instantiate your routers
with the following arguments:

`var approuter=new $.mobile.Router(myRoutes, myHandlers, options);`

* myRoutes is an object or an array defining your routes
* myHandlers is an object with your function handlers
* options is an object with a certain configuration (see below)


Here are a few examples:

```javascript
var router=new $.mobile.Router([
        { "/index.html": { events: "i", handler: "index" } },
        { "/restaurant.html[?]id=(\\d+)": { events: "i", handler: "restaurantDetail" } }, // handwritten regexp
        { "/events.html(?:[?](.*))?": { events: "i", handler: "events" } }, // handwritten regexp
        { "/eventDetail.html": { events: "i", handler: "eventDetail", argsre: true } },
        { "/accomodations.html": { events: "i", handler: "accomodationsTaxonomy", argsre: true } },
        { "/accomodationList.html(?:[?](.*))?": { events: "i", handler: "accomodations" } } // handwritten regexp
], ControllerObject, { ajaxApp: true} );

var router=new $.mobile.Router([
        { "#ticketPlanner(?:[?](.*))?$": "ticketPlannerShown" },
        { "#ticketConfirm": "ticketConfirmShown" },
        { "#ticketDetail": { handler: "ticketDetailPage", events: "bs,h", argsre: true } },
        { "#ticketHistory": "ticketHistoryShown" },
        { "#map": { handler: "mapHidden", events: "bh" } },
        { "#map": { handler: "mapShown", events: "s" } }
], ControllerObject);
```

**----- IMPORTANT (no kidding!) -----**

* By default, the router will match the routes against the hash part of the url.
	  If you need the FULL PATH (pathname+search+hash), please set the "ajaxApp" configuration
	  parameter to TRUE (see below)

* If you're using a multipage template in your jquerymobile application, the first displayed page is quite an "anomaly" in the navigation model, because, even if it has its own id, this
	  is not reflected in the hash. This doesn't happen for other pages. This "empty hash" problem
	  may come into play when the back button is used by the user.
	  Since writing an "empty" regular expression such as "^$" to match this page seems really
	  strange, the router will accept *only* a route with the page id, for example "#foobar"

* If you need to use backslashes (as in: \d, \s, etc) in your regular expressions, please make sure to escape them (\\\\d, \\\\s). You may test your regexp by using: "path to be matched".match( new RegExp("matching regexp") ).
 However, you'll hardly need to write any regular expression in your routes. If you want to match parameters, you should use the `argsre` property (or the `defaultArgsRe` configuration setting). See below for an explanation.



myRoutes object
---------------
`myRoutes` supports the following formats:

1. This one binds a certain route to the pagebeforeshow event and calls the handler, which can be an inline function or a function name (a string) that must be defined
	  in the myHandlers object

```javascript		
	{
		"regularExpression": "handlerName",

		/* or */
		
		"regularExpression": function(){
			// your inline function here ...
		}

		/* or */
		
		"regularExpression": someobject.functionReference
	}
```

2. This is the full syntax to specify various jQM events you want your route to be
	  bound to.
	  The object defines a "handler" property with a string value: this is the name
	  of a function defined in the myHandlers object. Again, you may also put an inline
	  function in the "handler" property instead of a string.
	  The object also defines an "events" property with a string value: this is a list
	  of (shortened) jQM events, separated by a ",". Your route will be called only when
	  these events are fired. 

```javascript	  
	{
		"regularExpression": { 
			handler: "handlerName",
			events: "bc,c,bs,s,bh,h",
			argsre: true  //a boolean, can be omitted if false. see below
		},

		/* or */

		"regularExpression": { 
			handler: function(){ ... },
			events: "bc,c,bs,s,bh,h",
			argsre: true  //a boolean, can be omitted if false. see below
		},
	}		
```

Please refer to the following schema to understand event codes (it's really straightforward)

```javascript
	bc	=> pagebeforecreate
	c	=> pagecreate
	i	=> pageinit
	bs	=> pagebeforeshow
	s	=> pageshow
	bh	=> pagebeforehide
	h	=> pagehide
	rm	=> pageremove
	bC	=> pagebeforechange
	bl	=> pagebeforeload
	l	=> pageload

```

* The above syntax, however, doesn't let one use the same regular expression to call different handlers (this is due to the fact that the regexp is a key into an hashmap,
	  so it must be unique). If you need, for instance, to call the function "foo" when a
	  certain page has been shown, and the function "bar" when the same page has been hidden,
	  you could use the following syntax:

```javascript
	var approuter=new $.mobile.Router([
		{ "#certainPage": { handler: "foo", events: "s", argsre: true } },
		{ "#certainPage": { handler: "bar", events: "h" } }
	], {
		foo: function(...){...},
		bar: function(...){...}
	}, options);
```

By using an array, you can specify the **SAME REGULAR EXPRESSION** multiple times, but for **DIFFERENT EVENT TYPES**.

The pagebeforechange event supports an additional parameter `step`, whose values can be:

	* `page`: invoke the handler when `data.toPage` is a jQuery object.
	  This is the default when step is omitted

	* `url` (or `string`): invoke the handler when `data.toPage` is a string

	* `all`: always invoke the handler

This parameter is a convenient way to let the router know what kind of `data.toPage` parameter your handler is expecting. Please note that when the handler is invoked with a string argument, the `page` argument won't be available for manipulation.


The "argsre" property is a boolean setting you can use to automatically append:
```
	(?:[?](.*))?$
```
to the end of each regular expression.
It's a really convenient way to:

	1) avoid the most common mistake in using the router (forgetting the $ operator)
	2) define a route that supports hash parameters
	3) use the router even without knowing what a regular expression is

You'll *hardly* need to write complex regular expressions, everything you may need can be accomplished
by setting argsre to true. You can also set the `defaultArgsRe` configuration switch to true,
so that every single route will automatically use the arguments-catcher regexp (you can override this
setting on a per-route basis with `argsre: false`)

Please remember that you can split the parameters and get them in a nice javascript object by using:
```
	routerInstance.getParams(string)
```
See below for an example.


This is an example of a common `myRoutes` object:

Syntax 1:

```javascript
	{
		"#localpage": {
			handler: "localpage", events: "bs,bh", argsre: true
		},

		"ajaxPage.html(?:[?](.*))?": {
			handler: "ajaxPage", events: "c,bs"
		}
	}
```

Syntax 2:

```javascript
	[
		{ "#localpage": { handler: "localpage", events: "bs,bh", argsre: true } },

		{ "ajaxPage.html(?:[?](.*))?": { handler: "ajaxPage", events: "c,bs" } }
	]
```

Choosing the right event
-----------------
In order to successfully exploit routing under jQuery Mobile, the developer should have
at least a minimal knowledge of its event system (among other things!):
http://api.jquerymobile.com/category/events/

Once you're familiar with page change events, you can choose the right one in order to achieve
the desired behaviour in your application.
I know this may be a difficult choice, at least initially, so I'll try to sort things out for you.
Bear in mind that the following are just suggestions that cannot replace a deep knowledge
of the jQuery Mobile framework.

For single-file multipage applications (you have an html file containing a lot of jQM pages):

 * pagebeforeshow or pageshow:
	These events are called every time a particular page is shown.
	This is perfect to render and update a page, often using the parameters in the hash part of the url

 * pagebeforehide or pagehide:
	These events are called every time a particular page is hidden.
	You can use these events to clean views or models, to free resources and clean the DOM

 * pagebeforechange:
	Use this event if you want to STOP the transition from happening until you resolve a certain deferred
	object. There's a paragraph describing this technique below

For ajax applications (multiple files containing a single jQM page):

 * You can still use the events described above... but keep on reading, you may find a better option

 * pagebeforecreate, pagecreate or pageinit:
	These events are called before/after a jQuery Mobile page has been initialized. Remember that initialization
	happens ***just once*** for a particular page (unless it's removed from the DOM, see below).
	If you make changes to the DOM before a page or a widget is initialized, you won't have to update
	or refresh it. But please note that if your models need to be refreshed through an ajax call,
	you'll probably get your results back from the remote server when the page has already been widget-ified
	by jQuery Mobile, so pay attention to this scenario and prefer the "pageinit" event, unless you know
	what you're doing.

 * pageremove:
	This one is called when a page is automatically removed from the DOM by the framework. This applies only
	to pages that were fetched via ajax.
	When the user navigates away from a certain page, jQuery Mobile will remove it from the DOM to keep its
	size small, unless otherwise specified (see the data-dom-cache="true" option in the doc).
	Use this event to clean models and views references.


myHandlers object
-----------------
There isn't much to say about this object. Simply provide the function handlers you've
specified in the myRoutes object.
By default, your route handlers are executed in the myHandlers scope.

For example:

```javascript
	{
		handlerName: function(eventType, matchObj, ui, page, evt){
			// your code here
		}
	}
```

Your handlers will be called with the following arguments:

* eventType: the name of the jQM event that's triggering the handler (pagebeforeshow,
	pagecreate, pagehide, etc)

* matchObj: the handler is called when your regular expression matches the current
	url or fragment. This is the match object of the regular expression.
	If the regular expression uses groups, they will be available in this object.
	Cool eh?

* ui: this is the second argument provided by the jQuery Mobile event. Usually holds
	the reference to either the next page (nextPage) or previous page (prevPage).
	More information here: (http://jquerymobile.com/demos/1.0/docs/api/events.html)[http://jquerymobile.com/demos/1.0/docs/api/events.html]

* page: the dom element that originated the jquery mobile page event

* evt: the original event that comes from jquery mobile. You can use this to
	prevent the default behaviour and, for instance, stop a certain page from being
	removed from the dom during the pageremove event.


About pagebeforechange
----------------------
This is a special event withing jQuery Mobile, so it deserves a "special" support in the router.

When you want to "stop" a certain transition until you've done something to the page, this is the
right event to use. 
Re-routing to another location works as well, more on that later.

I've modeled the way it works after the pagebeforeload event. When your bC route is matched,
you can call e.preventDefault() to temporarily stop the transition and make your modifications
to the page.

You should know from jQM documentation that pagebeforechange is usually invoked twice, the first
time with a string parameter and eventually with a jQuery object.
By specifying the `step` parameter (see above), you can choose if you want your handler to be invoked
either with the string url, the page object or both. If `step` is omitted, it defaults to `page`.

The page reference is normalized by the router whenever it's possible (but when toPage is a string, page is
set to null) so that you get a nice jQuery object as if it was a standard pagebeforeshow event.

Take this simple handler as an example:
```
  beforeChangeHandler: function(type, match, ui, page, e){
	e.preventDefault();
	console.log(page); // this is the page reference or null if ui.toPage is a string
	console.log("Waiting 6 seconds before resolving the deferred...");
	setTimeout(function(){
		ui.bCDeferred.resolve();
	},6000);
  }
```

If you invoke preventDefault(), YOU MUST CALL: `ui.bCDeferred.resolve();` to continue the transition.

Please DON'T call $.mobile.changePage(...) in this handler, because the router
does that for you, but if you're trying to achieve something different (that is to say, the scenario
described above does not match your situation) you may have to bind to pagebeforechange yourself and
implement your own logic.

You can also change the ui.toPage property from your handler, in order to re-route the transition
to another location. This seems to work but I've not tested it extensively, so use it with caution.
Remember to also change the ui.options.dataUrl property if you want the url to reflect this change.


Common mistakes
--------------
jQuery Mobile is a wonderful framework and it seems really easy to use at first.
While this may be true for server-side generated mobile pages, things are very different
once you have to do a full client-side web application, using backbone.js or spine.js and
possibly Phonegap/Cordova.

The whole hash handling performed by jQuery Mobile may be confusing, dynamic page loading/injection
must be understood in order to be successfully exploited, and you should also know the jQM
event system to have a fine grained control over page switching.

Here is a list of things you should check when you're in trouble, based on my experience but,
more importantly, on the email I've received from other users of the jQM router.

* the router should be instantiated as soon as possible, possibly just after loading jquery mobile.
This ensures that even the first pageinit event can be catched and handled by the router

* please make sure that the router is not instantiated multiple times by mistake. This will lead to
routes being fired twice, at least

* do not assign id's to page divs, unless you're using a single-file multipage template. In fact,
ids will interfere with data-url generation (at jquery mobile level) in ajax applications

* do not call $.mobile.changePage during a page transition with the destination page being the one
the framework is already transitioning to.
That is to say, if you click on a link to #foo and you have a pagebeforeshow route bound to it,
DO NOT invoke $.mobile.changePage("#foo") in your handler (the result will be an epic failure due to
a bug in jquery mobile)

* pay attention to the ORDER in which events are fired. Remember that pagebeforeshow is fired *before*
pagebeforehide, so if you're cleaning the dom when the page is being hidden and do your rendering stuff
in pagebeforeshow, you have to be careful during same-page transitions or you'll get a blank page.
You can use a certain counter (incremented during *show events and decremented during the hiding) and
clean the dom only when it's 0, or examine window.location, or (better) use the "ui" argument passed to
the handler (.nextPage is the property that you need)

* DOUBLE CHECK your REGULAR EXPRESSIONS! A typical mistake is forgetting the $ operator.
If you have two pages, such as #product and #productList, a hypothetical route "#product" would
match both pages, leading to unexpected behaviors. Use the $ operator when unsure: "#product$"
or (better) the `argsre` (or `defaultArgsRe`) property set to true. See the `argsre` explanation above.

* use setTimeout to avoid doing time-consuming tasks in a page-transition handler. If you have
a route bound to pagebeforeshow (or even other events) and your code takes too much to execute
(for instance, very long foreach loops, synchronous ajax calls, complex manupulations
of markers in a google map), jquery mobile may throw an error.


Public methods
--------------

Router objects have the following public methods:

* `add(myRoutes,myHandlers)`:
	You can dynamically add routes on an already instantiated router.
	The myRoutes and myHandlers objects were already described above.

* `destroy()`:
	Unbind events and deactivate this router instance

* `getParams(hashPartOfTheUrl)`:
	Returns an object with the parameters encoded in the url or null
	if nothing's found. It's particularly useful when used with a general regexp
	such as the following one:
		`#page(?:[?](.*))?`
	or with the `argsre` property set to true.

	For instance, if you have this url:  `#page?id=3&foo=bar`
	and call:
	`routerInstance.getParams("?id=3&foo=bar")`
	or (if you used the regexp or the argsre property)
	`routerInstance.getParams(match[1])`

	you'll get this object:
	
```javascript				
	{
		id: "3",
		foo: "bar"
	}
```

**There's an example under examples/backbone-example !**


jQM Configuration
==================

jQuery Mobile Router supports the following parameters:

*`ajaxApp`: tells the plugin to use the full page path for its matches instead of
		 the hash part of the url

*`firstMatchOnly`: stop searching for other route matches once the first one has been found
		(only the first handler is executed). Defaults to false 

*`defaultArgsRe`: always append the default arguments-catcher regular expression to the end of
		each route, unless argsre is false. *I strongly suggest you set this to true*.
		Please see the `argsre` explanation above. Defaults to false.

*`defaultHandler`: a function reference or a function name to be called when no matching
		route is found. You MUST also define the `defaultHandlerEvents` property when using
		this one

*`defaultHandlerEvents`: the defaultHandler will be called for these events, if
		no routes are matched. Please note that THESE EVENTS MUST BE DEFINED 
		AT LEAST ONCE IN ANOTHER ROUTE, otherwise the defaultHandler won't be executed.
		That is to say, if your routes are defined for "pagebeforeshow" and "pageshow"
		events only, a defaultHandler for the "pagehide" event won't work!

*`debugHandler`: a function reference or a function name that will be called with  
		debugging information. If none supplied, this will default to ``console.log`` if 
		such exists. Set this to `false` to disable debugging completely.


You can pass an object with the above properties to the single router instance or set it
globally with this code (must be used BEFORE loading jquery.mobile.router.js):

```javascript
	$(document).bind("mobileinit",function(){
		$.mobile.jqmRouter={
			ajaxApp: true
		};
	});
```


Phonegap/Cordova
==============

There is nothing to do to use the router in a Phonegap/Cordova environment, just include the
cordova javascript file and you're done.

However, you must pay attention to a super-stupid bug of the Android platform that impacts on the
ability to use jQuery Mobile (not the router) in "ajax mode" on certain Android 3.x and 4.0.x versions:

	http://code.google.com/p/android/issues/detail?id=17535

Cordova 2.x includes a workaround for this, but if you need to use an older version for whatever reason,
you may experience the dreaded "chromium error: -6". 
However, there's a simple patch you can apply using the router and the pagebeforeload event.
I won't put it here in the documentation since it's not a general use-case, but if you really need it,
just open an issue on github or send me a private email.



Notes on jQM router
==============

Have you ever wanted client-side parameters in the hash part of the url in jQuery Mobile?

Well, jquery mobile router automatically enables this feature for you and fixes what's actually
broken in the partial support offered by jQM itself. 

For bugs, comments, patches and requests mail me!

License
==============

Copyright 2011 (c) Andrea Zicchetti

You may use jQueryMobile-Router under the terms of either the MIT License or the GNU General Public License (GPL) Version 2.

You don’t have to do anything special to choose one license or the other and you don’t have to notify anyone which license you are using. You are free to use a jQueryMobile-Router in commercial projects as long as the copyright header is left intact.

**For more information see:**

* [MIT License](http://github.com/azicchetti/jquerymobile-router/blob/master/MIT-LICENSE.txt) [(More Information)](http://en.wikipedia.org/wiki/MIT_License)
* [GPL](http://github.com/azicchetti/jquerymobile-router/blob/master/GPL-LICENSE.txt) [(More Information)](http://en.wikipedia.org/wiki/GNU_General_Public_License)

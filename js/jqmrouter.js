/* jQueryMobile-router v0.3
 * Copyright 2011, Andrea Zicchetti
 */
(function($){

$(document).bind("mobileinit",function(){

	/* supports the following configurations:
		$.mobile.jqmRouter.fixFirstPageDataUrl=true
		$.mobile.jqmRouter.firstPageDataUrl="index.html"
			jQM doesn't handle correctly the dataurl of the first page you display
			in a single-page template mode. In fact, the page is fetched again
			from the server the first time you try to access it through a link.
			If this option is set to true, jquery mobile router extensions will
			try to fix this problem. In order to set the data url, you have to
			provide the name of the file containing the first page into the
			"firstPageDataUrl" property (for example: index.html)

	*/

	var config=$.extend({
		fixFirstPageDataUrl: false, firstPageDataUrl: "index.html"
	},$.mobile.jqmRouter || {});


	var DEBUG=true;
	function debug(err){
		if (DEBUG) console.log(err);
	}

	var previousUrl=null, nextUrl=null;

	$(document).bind("pagebeforechange", function( e, data ) {
		// We only want to handle changePage() calls where the caller is
		// asking us to load a page by URL.
		if ( typeof data.toPage === "string" ) {
			// We are being asked to load a page by URL, but we only
			// want to handle URLs that request the data for a specific
			// category.
			var u = $.mobile.path.parseUrl( data.toPage );
			previousUrl=nextUrl;
			nextUrl=u;

			if ( u.hash.indexOf("?") !== -1 ) {
				var page=u.hash.replace( /\?.*$/, "" );
				// We don't want the data-url of the page we just modified
				// to be the url that shows up in the browser's location field,
				// so set the dataUrl option to the URL for the category
				// we just loaded.
				data.options.dataUrl = u.href;
				// Now call changePage() and tell it to switch to
				// the page we just modified, but only in case it's different
				// from the current page
				if (	$.mobile.activePage &&
					page.replace(/^#/,"")==$.mobile.activePage.jqmData("url")
				){
					var ui={ prevPage: $.mobile.activePage };
					$.mobile.activePage
						.trigger("pagebeforeshow",[ui])
						.trigger("pageshow",[ui])
					;
				} else {
					$.mobile.changePage( $(page), data.options );
				}

				// Make sure to tell changePage() we've handled this call so it doesn't
				// have to do anything.
				e.preventDefault();
			}
		}
	});


	if (config.fixFirstPageDataUrl){
		$(document).ready(function(){
			var page=$(":jqmData(role='page')").first();
			var	dataUrl=page.jqmData("url"),
				guessedDataUrl=
					window.location.pathname.slice(-1)=="/"?
						window.location.pathname
						+config.firstPageDataUrl
						:window.location.pathname
			;
			if (dataUrl!=guessedDataUrl){
				page.attr("data-url",guessedDataUrl)
					.jqmData("url",guessedDataUrl);
			}
		});
	}

	$.mobile.Router=function(userRoutes,userHandlers,conf){
		/* userRoutes format:
			{
				"regexp": "function name", // defaults to jqm pagebeforeshow event
				"regexp": function(){ ... }, // defaults to jqm pagebeforeshow event
				"regexp": { handler: "function name", events: "bc,c,bs,s,bh,h"	},
				"regexp": { handler: function(){ ... }, events: "bc,c,bs,s,bh,h" }
			}
		*/
		this.routes={
			pagebeforecreate: null, pagecreate: null,
			pagebeforeshow: null, pageshow: null,
			pagebeforehide: null, pagehide: null
		};
		this.routesRex={};
		this.conf=$.extend({
			pushState: false
		}, config || {});
		this.add(userRoutes,userHandlers);
	}
	$.extend($.mobile.Router.prototype,{
		add: function(userRoutes,userHandlers){
			if (!userRoutes) return;

			var _self=this, evtList=[], evtLookup={
				bc: "pagebeforecreate", c: "pagecreate",
				bs: "pagebeforeshow", s: "pageshow",
				bh: "pagebeforehide", h: "pagehide"
			};
			$.each(userRoutes,function(r,el){
				if(typeof(el)=="string" || typeof(el)=="function"){
					if (_self.routes.pagebeforeshow===null) _self.routes.pagebeforeshow={};
					_self.routes.pagebeforeshow[r]=el;
					if (! _self.routesRex.hasOwnProperty(r)){
						_self.routesRex[r]=new RegExp(r);
					}
				} else {
					var i,trig=el.events.split(","),evt;
					for(i in trig){
						evt=evtLookup[trig[i]];
						if (_self.routes.hasOwnProperty(evt)){
							if (_self.routes[evt]===null) _self.routes[evt]={};
							_self.routes[evt][r]=el.handler;
							if (! _self.routesRex.hasOwnProperty(r)){
								_self.routesRex[r]=new RegExp(r);
							}
						} else {
							debug("can't set unsupported route "+trig[i]);
						}
					}
				}
			});
			$.each(_self.routes,function(evt,el){
				if (el!==null){
					evtList.push(evt);
				}
			});
			if (!this.userHandlers) this.userHandlers={};
			$.extend(this.userHandlers,userHandlers||{});
			this._detachEvents();
			if (evtList.length>0){
				this._liveData={
					events: evtList.join(" "),
					handler: function(e,ui){ _self._processRoutes(e,ui,this); }
				};
				$("div:jqmData(role='page'),div:jqmData(role='dialog')").live(
					this._liveData.events, this._liveData.handler
				);
			}
		},

		_processRoutes: function(e,ui,page){
			var 	_self=this, refUrl;
			if (e.type in {
				"pagebeforehide":true, "pagehide":true
			}){
				refUrl=previousUrl;
			} else {
				refUrl=nextUrl || window.location;
			}
			if (!refUrl) return;
			url=( !this.conf.pushState ?
				refUrl.hash	
				:refUrl.pathname + refUrl.search + refUrl.hash
			);
			$.each(this.routes[e.type],function(route,handler){
				var res, handleFn;
				if ( (res=url.match(_self.routesRex[route])) ){
					if (typeof(handler)=="function"){
						handleFn=handler;
					} else if (typeof(_self.userHandlers[handler])=="function"){
						handleFn=_self.userHandlers[handler];
					}
					if (handleFn){
						try { handleFn(e.type,res,ui,page);
						}catch(err){ debug(err); }
					}
				}
			});
		},

		_detachEvents: function(){
			if (this._liveData){
				$("div:jqmData(role='page'),div:jqmData(role='dialog')").die(
					this._liveData.events, this._liveData.handler
				);
			}
		} ,
		
		destroy: function(){
			this._detachEvents();
			this.routes=this.routesRex=null;
		}
	});

});

})(jQuery);

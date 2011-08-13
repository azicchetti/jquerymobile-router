/* jQueryMobile-router v0.3
 * Copyright 2011, Andrea Zicchetti
 */
(function($){

$(document).bind("mobileinit",function(){

	/* supports the following configurations:
		
		$.mobile.jqmRouter.supportHashParams=true
			Anchors with parameters encoded into the hash will be accepted by
			jquery mobile and the jqm router.
			Hash parameters *MUST* have one of these formats:
				#page?foo=bar&bar=foo
				#/page?foo=bar&bar=foo
				#/page/parameter/parameter2
			When you define your page please remember to set the correct id or
			data-url. For the example above they would be:
				data-url="page"
				data-url="/page"
				data-url="/page"
			Please remember that since we want bookmarkable urls, this plugin
			also has to route the initial url. If pushState isn't used by jQM,
			there's no way to tell whether a page is local or to be fetched via
			ajax, so please, *DON'T USE PAGE IDs WITH THE SAME NAME OF DIRECTORIES
			ON THE FILESYSTEM*

		$.mobile.jqmRouter.reuseQueriedAjaxPages=true
			Tells the framework to reuse already fetched ajax pages instead of
			getting them each time the query string differs from the previous ones

		$.mobile.jqmRouter.fixFirstPageDataUrl=true
		$.mobile.jqmRouter.firstPageDataUrl="index.html"
			jQM doesn't handle correctly the dataurl of the first page you display
			in a single-page template mode. In fact, the page is fetched again
			from the server the first time you try to access it through a link.
			If this option is set to true, jquery mobile router extensions will
			try to fix this problem. In order to set the data url, you have to
			provide the name of the file containing the first page into the
			"firstPageDataUrl" property (for example: index.html)

		By default, the plugin handles only anchors with the data-params attribute defined.

		*** supportHashParams and reuseQueriedAjaxPages only work with the latest github
		version of jQM (with 1.0b1 they don't work) ***
		
	*/

	var config=$.extend({
		supportHashParams: false,
		reuseQueriedAjaxPages: false,
		fixFirstPageDataUrl: false, firstPageDataUrl: "index.html"
	},$.mobile.jqmRouter || {});


	var DEBUG=true;
	function debug(err){
		if (DEBUG) console.log(err);
	}

	function changePageDataUrl(href,isHash){
		var	HASH_QUERY_STRING_RE=/(.+?)(?:[?\/](.*))?$/,
			QUERY_STRING_RE=/(.+?)(?:[?](.*))?$/,
			qs=isHash?HASH_QUERY_STRING_RE:QUERY_STRING_RE,
			res=href.match(qs), page=res[1]
		;
		$(':jqmData(url^="'+ page +'")').each(function(){
			var dataUrlQS=$(this).jqmData("url").match(qs);
			if (dataUrlQS[1]==page){
				$(this).attr("data-url",res[0]).jqmData("url",res[0]);
				try {
					if ($.mobile.activePage && this==$.mobile.activePage[0]){
						var ui={ prevPage: $.mobile.activePage };
						$.mobile.urlHistory.ignoreNextHashChange=true;
						window.location.hash=res[0];
						$.mobile.activePage
							.trigger("pagebeforeshow",[ui])
							.trigger("pageshow",[ui])
						;
					}
				}catch(err){console.log(err);}
			}
		});
	}
	if (config.supportHashParams || config.reuseQueriedAjaxPages){
		$("a[data-params]").live("click",function(e){
			var 	PROTOCOL_HOST_RE=/(http?|ftp|file):\/\/[^\/]*/,
				href
			;
			href=$(this).attr("href");
			if (href.charAt(0)=="#"){
				if (!config.supportHashParams || href.length<2) return;
				changePageDataUrl(href.slice(1),true);
			} else if (config.reuseQueriedAjaxPages){
				href=this.href.replace(PROTOCOL_HOST_RE,"");
				changePageDataUrl(href);
			}
		});
		if (config.supportHashParams){
			// we have to route the initial url
			if (window.location.hash.length>1){
				$(document).ready(function(){
					changePageDataUrl(window.location.hash.slice(1),true);
				});
			}
		}
	}
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
		}, conf || {});
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
			var 	_self=this,
				url=( !this.conf.pushState ?
					window.location.hash
					:window.location.pathname
						+window.location.search
						+window.location.hash
				)
			;
			// when pagebeforecreate and pagecreate are fired, the url is still pointing
			// to the previous page
			if (!url || e.type in {
				"pagebeforecreate":true, "pagecreate": true,
				"pagebeforehide":true, "pagehide":true
			}){
				var dataUrl=$(page).jqmData("url");
				if (dataUrl){
					url=(	!this.conf.pushState &&
						window.location.hash>0 ?
							"#":""
					) + dataUrl;
				} else {
					url=window.location.pathname+window.location.search;
				}
			}
			if (url) url=url.replace(/^#\//,"/");
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

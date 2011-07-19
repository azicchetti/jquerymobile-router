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

		By default, the plugin handles only anchors with the data-params attribute defined.

		*** supportHashParams and reuseQueriedAjaxPages only work with the latest github
		version of jQM (with 1.0b1 they don't work) ***
		
	*/

	var config=$.extend({
		supportHashParams: false,
		reuseQueriedAjaxPages: false
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
			var dataUrlQS=$(this).attr("data-url").match(qs);
			if (dataUrlQS[1]==page){
				$(this).attr("data-url",res[0]).jqmData("url",res[0]);
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

	$.mobile.Router=function(userRoutes,userHandlers,conf){
		/* userRoutes format:
			{
				"regexp": "function name", // defaults to jqm pagebeforeshow event
				"regexp": { handler: "function name", events: "bc,c,bs,s,bh,h"	}
			}
		*/
		var routes={
			pagebeforecreate: null, pagecreate: null,
			pagebeforeshow: null, pageshow: null,
			pagebeforehide: null, pagehide: null
		}, routesRex={}, evtLookup={
			bc: "pagebeforecreate", c: "pagecreate",
			bs: "pagebeforeshow", s: "pageshow",
			bh: "pagebeforehide", h: "pagehide"
		};
		userRoutes=userRoutes||{};
		userHandlers=userHandlers||{};
		this.conf=$.extend({
			pushState: false
		}, conf || {});
		$.each(userRoutes,function(r,el){
			if(typeof(el)=="string"){
				if (routes.pagebeforeshow===null) routes.pagebeforeshow={};
				routes.pagebeforeshow[r]=el;
				if (! routesRex.hasOwnProperty(r)){
					routesRex[r]=new RegExp(r);
				}
			} else {
				var i,trig=el.events.split(","),evt;
				for(i in trig){
					evt=evtLookup[trig[i]];
					if (routes.hasOwnProperty(evt)){
						if (routes[evt]===null) routes[evt]={};
						routes[evt][r]=el.handler;
						if (! routesRex.hasOwnProperty(r)){
							routesRex[r]=new RegExp(r);
						}
					} else {
						debug("can't set unsupported route "+trig[i]);
					}
				}
			}
		});
		var _self=this, evtList=[];
		$.each(routes,function(evt,el){
			if (el!==null){
				evtList.push(evt);
			}
		});
		this._liveData={
			events: evtList.join(" "),
			handler: function(e,ui){ _self._processRoutes(e,ui,this); }
		};
		$("div:jqmData(role='page'),div:jqmData(role='dialog')").live(
			this._liveData.events, this._liveData.handler
		);
		this.routes=routes;
		this.routesRex=routesRex;
		$.extend(this,userHandlers);
	}
	$.extend($.mobile.Router.prototype,{
		_processRoutes: function(e,ui,page){
			var 	_self=this,
				url=( !this.conf.pushState ?
					window.location.hash
					:window.location.pathname+window.location.search+window.location.hash
				)
			;
			// when pagebeforecreate and pagecreate are fired, the url is still pointing
			// to the previous page
			if (e.type in {"pagebeforecreate":true, "pagecreate": true}){
				url=(!this.conf.pushState?"#":"")+$(page).jqmData("url");
			}
			$.each(this.routes[e.type],function(route,handler){
				var res;
				if ( (res=url.match(_self.routesRex[route])) ){
					if (typeof(_self[handler])=="function"){
						try { _self[handler](e.type,res,ui);
						}catch(err){ debug(err); }
					}
				}
			});
		},
		
		destroy: function(){
			$("div:jqmData(role='page'),div:jqmData(role='dialog')").die(
				this._liveData.events, this._liveData.handler
			);
			this.routes=this.routesRex=null;
		}
	});

});

})(jQuery);

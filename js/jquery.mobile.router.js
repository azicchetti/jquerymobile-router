/*!
 * jQueryMobile-router v20130527
 * http://github.com/azicchetti/jquerymobile-router
 *
 * Copyright 2011-2013 (c) Andrea Zicchetti
 * Dual licensed under the MIT or GPL Version 2 licenses.
 * http://github.com/azicchetti/jquerymobile-router/blob/master/MIT-LICENSE.txt
 * http://github.com/azicchetti/jquerymobile-router/blob/master/GPL-LICENSE.txt
 */
(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    define(['jquery'], factory);
  } else {
    factory(jQuery);
  }
}(this, function($) {

$(document).on("mobileinit", function(){
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

  var config = $.extend({
    fixFirstPageDataUrl: false, firstPageDataUrl: "index.html",
    ajaxApp: false, firstMatchOnly: false, defaultArgsRe: false
  }, $.mobile.jqmRouter || {});


  var previousUrl = null, nextUrl = null, ignoreNext = false;

  $(document).on("pagebeforechange", function(e, data) {
    if ( data.options.hasOwnProperty("_jqmrouter_handled") ){ return; }

    var toPage;
    if ( typeof data.toPage === "string" ){
      toPage = data.toPage;
    } else {
      toPage = data.toPage.jqmData("url") || "";
      if (data.toPage.attr("id") == toPage){ toPage = "#" + toPage; }
    }

    data.options._jqmrouter_handled = true;

    // handle form submissions
    if ( data.options.data && (data.options.type+"").toLowerCase() == "get" ){
      toPage += "?" + data.options.data;
    }
    var u = $.mobile.path.parseUrl( toPage );
    previousUrl = nextUrl;
    nextUrl = u;

    if (u.hash.indexOf("?") != -1){
      data.options.dataUrl = u.hash.replace(/^#/,"");
    }

    // conditions to possibly set allowSamePageTransitions: we have a "?" or we're transitioning from
    //  #foo?params to #foo
    var noparamsRE = /^#|\?.*$/g;
    if (  previousUrl && u.hash != previousUrl.hash &&
          u.hash.replace(noparamsRE,"") == previousUrl.hash.replace(noparamsRE,"")
    ){
      data.options.allowSamePageTransition = true && !ignoreNext;
    }
    ignoreNext = false;
    if ( window.location.hash.indexOf("&ui-state=dialog") != -1 ){
      // prevent popups from triggering unwanted pageshow events by forcing allowSamePageTransition=false
      ignoreNext = true;
    }
  });


  if ( config.fixFirstPageDataUrl ){
    $(document).ready(function(){
      if ( !window.location.pathname.match("/$") ){
        return;
      }     
      var page = $(":jqmData(role='page')").first();
      var dataUrl = page.jqmData("url"),
          guessedDataUrl = window.location.pathname
            + config.firstPageDataUrl
            + window.location.search
            + window.location.hash
      ;

      if (dataUrl != guessedDataUrl){
        page.attr( "data-url",guessedDataUrl ).jqmData( "url",guessedDataUrl );
      }
    });
  }

  $.mobile.Router = function(userRoutes,userHandlers,conf){
    /* userRoutes format:
      {
        "regexp": "function name", // defaults to jqm pagebeforeshow event
        "regexp": function(){ ... }, // defaults to jqm pagebeforeshow event
        "regexp": { handler: "function name", events: "bc,c,bs,s,bh,h"  },
        "regexp": { handler: function(){ ... }, events: "bc,c,bs,s,bh,h" }
      }
    */
    this.routes = {
      pagebeforecreate: null, pagecreate: null,
      pagebeforeshow: null, pageshow: null,
      pagebeforehide: null, pagehide: null,
      pageinit: null, pageremove: null,
      pagebeforechange: null, pagebeforeload: null,
      pageload: null,
      popupbeforeposition: null, popupafteropen: null, popupafterclose: null
    };
    this.evtLookup = {
      bC: "pagebeforechange", bl: "pagebeforeload",
      l: "pageload",
      bc: "pagebeforecreate", c: "pagecreate",
      bs: "pagebeforeshow", s: "pageshow",
      bh: "pagebeforehide", h: "pagehide",
      i: "pageinit", rm: "pageremove",
      pbp: "popupbeforeposition", pao: "popupafteropen", pac: "popupafterclose"
    };
    this.routesRex = {};
    this.conf = $.extend({}, config, conf || {});
    this.defaultHandlerEvents = {};
    if (this.conf.defaultHandlerEvents) {
      var evts = this.conf.defaultHandlerEvents.split(",");
      for (var i = 0; i < evts.length; i++) {
        this.defaultHandlerEvents[this.evtLookup[evts[i]]] = evts[i];
      }
    }
    this.add(userRoutes,userHandlers);
  }
  $.extend($.mobile.Router.prototype,{
    documentEvts: { pagebeforechange:1, pagebeforeload:1, pageload:1 },

    debug: function(err){ 
      var conf = this.conf; 
      if (conf.debugHandler){
        conf.debugHandler.apply(this, arguments);
      } else if (conf.debugHandler !== false && typeof(console) != "undefined" && console.log){
	console.log.apply(console, arguments);
        // for webkit
        if (err.stack){ console.log(err.stack); }
      }
    },

    add: function(userRoutes,userHandlers,_skipAttach){
      if (!userRoutes) { return; }

      var _self=this, evtList=[], docEvtList=[];
      if (userRoutes instanceof Array){
        $.each(userRoutes, $.proxy(function(k,v){
          this.add(v,userHandlers,true);
        },this));
      } else {
        $.each(userRoutes,function(r,el){
          if( typeof(el) == "string" || typeof(el) == "function" ){
            if (_self.routes.pagebeforeshow === null){
              _self.routes.pagebeforeshow = {};
            }
	    if (_self.conf.defaultArgsRe){
	      r += '(?:[?](.*))?$';
	    }
            _self.routes.pagebeforeshow[r] = { handler: el, events: 'bs' };
            if ( ! _self.routesRex.hasOwnProperty(r) ){
              _self.routesRex[r] = new RegExp(r);
            }
          } else {
            var i, trig = el.events.split(","), evt;
	    if (el.argsre !== false && (el.argsre || _self.conf.defaultArgsRe) ){
	      r += '(?:[?](.*))?$';
	    }
            for( i = 0; i < trig.length; i++ ){
              evt = _self.evtLookup[trig[i]];
              if ( _self.routes.hasOwnProperty(evt) ){
                if ( _self.routes[evt] === null ){
                  _self.routes[evt] = {};
                }
                _self.routes[evt][r] = el;
                if ( ! _self.routesRex.hasOwnProperty(r) ){
                  _self.routesRex[r] = new RegExp(r);
                }
              } else {
                _self.debug("can't set unsupported route " + trig[i]);
              }
            }
          }
        });
      }
      if ( _skipAttach === true ) { return; }
      if ( !this.userHandlers ) {
        this.userHandlers = userHandlers || {};
      } else {
        $.extend(this.userHandlers,userHandlers || {});
      }
      $.each(_self.routes, function(evt,el){
        if ( el !== null ){
          if ( !_self.documentEvts[evt] ){
            evtList.push(evt);
          } else {
            docEvtList.push(evt);
          }
        }
      });
      this._detachEvents();
      var routeHandler = function(e,ui){ _self._processRoutes(e,ui,this); };
      if ( evtList.length > 0 ){
        this._eventData = {
          events: evtList.join(" "),
          selectors: ":jqmData(role='page'),:jqmData(role='dialog')",
          handler: routeHandler
        };
        $(document).on( this._eventData.events, this._eventData.selectors, this._eventData.handler );
      }
      if ( docEvtList.length > 0 ){
        this._docEventData = { events: docEvtList.join(" "), handler: routeHandler };
        $(document).on( this._docEventData.events, this._docEventData.handler );
      }
    },

    _processRoutes: function(e,ui,page) {
      var _self=this, refUrl, url, retry = 0, bCData = null;
      if (e.type == "pagebeforechange"){
	if (ui.options._jqmrouter_bC){
	  // we must return when _jqmrouter_bC is set to avoid loops
          return;
	}
        bCData = {
          isString: typeof ui.toPage === "string",
          deferred: $.Deferred(),
          toPage: ui.toPage
        };
        // normalizing the "page" reference whenever it's possible, 'cause we want to pass it to the handler
        page = !bCData.isString ? ui.toPage : null;
      }
      if ( e.type in { "pagebeforehide":true, "pagehide":true, "pageremove": true } ){
        refUrl = previousUrl;
      } else {
        refUrl = nextUrl;
      }

      url = !this.conf.ajaxApp ?
        refUrl.hash : (refUrl.pathname + refUrl.search + refUrl.hash)
      ;
      if (url.length == 0){
        // if ajaxApp is false, url may be "" when the user clicks the back button
        // and returns to the first page of the application (which is usually
        // loaded without the hash part of the url). Let's handle this...
        refUrl = null;
        if (!this.documentEvts[e.type] && page){
          refUrl = $(page).jqmData("url");
        } else {
          // mhm, we should be visiting the first page of the app
          refUrl = $.mobile.firstPage.jqmData("url");
          //refUrl = $(":jqmData(role=page):first").jqmData("url");
        }
        if (refUrl){
          refUrl = $.mobile.path.parseUrl("#" + refUrl);
          url = !this.conf.ajaxApp ?
            refUrl.hash : (refUrl.pathname + refUrl.search + refUrl.hash)
          ;
        }
      }
      if (url.length == 0){ return; }

      var bHandled = false;
      $.each(this.routes[e.type], function(route,routeConf){
        var res, handleFn;
        if (bCData && routeConf.step != 'all'){
          routeConf.step = routeConf.step || 'page';  // default step is page
          if ( (bCData.isString && routeConf.step == 'page') || (!bCData.isString && routeConf.step != 'page') ){
            return;
          }
        }
        if ( (res = url.match(_self.routesRex[route])) ) {
          if ( typeof(routeConf.handler) == "function" ){
            handleFn = routeConf.handler;
          } else if ( typeof(_self.userHandlers[routeConf.handler]) == "function" ) {
            handleFn = _self.userHandlers[routeConf.handler];
          }
          if ( handleFn ){
            try {
              if (bCData && ui){
                ui.bCDeferred = bCData.deferred;
              }
              handleFn.apply(_self.userHandlers, [e.type,res,ui,page,e]);
              bHandled = true;
            } catch(err){
              _self.debug(err);
            }
          }
        }
        if ( bHandled && _self.conf.firstMatchOnly ){ return false; }
      });
      //Pass to default if specified and can handle this event type
      if ( !bHandled && this.conf.defaultHandler && this.defaultHandlerEvents[e.type] ) {
        var handleFn;
        if ( typeof(this.conf.defaultHandler) == "function" ) {
          handleFn = this.conf.defaultHandler;
        } else if ( typeof(this.userHandlers[this.conf.defaultHandler]) == "function" ) {
          handleFn = this.userHandlers[this.conf.defaultHandler];
        }
	try {
	  handleFn.apply(this.userHandlers, [e.type, ui, page, e]);
	} catch(err){
          this.debug(err);
        }
      }

      if (bCData && e.isDefaultPrevented()){
        bCData.deferred.done(function(){
	  // if the user re-routed the bC, we shouldn't set _jqmrouter_handled or _jqmrouter_bC
	  var extraOpt = (bCData.toPage === ui.toPage ?
            { _jqmrouter_handled: true, _jqmrouter_bC: true } : null
          );
	  // destination page is refUrl.href, ui.toPage or page.
	  // I'm using ui.toPage so that really crazy users may try to re-route the transition to
	  //   another location by modifying this property from the handler.
          $.mobile.changePage(ui.toPage, $.extend({
            allowSamePageTransition: ui.options.allowSamePageTransition,
            changeHash: ui.options.changeHash,
            data: ui.options.data,
            dataUrl: ui.options.dataUrl,
            pageContainer: ui.options.pageContainer,
            reloadPage: ui.options.reloadPage,
            reverse: ui.options.reverse,
            role: ui.options.role,
            showLoadMsg: ui.options.showLoadMsg,
            transition: ui.options.transition,
            type: ui.options.type
          }, extraOpt));
	});
      }
    },

    _detachEvents: function(){
      if (this._eventData){
        $(document).off( this._eventData.events, this._eventData.selectors, this._eventData.handler );
      }
      if (this._docEventData){
        $(document).off( this._docEventData.events, this._docEventData.handler );
      }
    } ,

    destroy: function(){
      this._detachEvents();
      this.routes = this.routesRex = null;
    } ,

    getParams: function(hashparams) {
      if (!hashparams) { return null; }
      var params = {}, tmp;
      var tokens = hashparams.slice( hashparams.indexOf('?') + 1 ).split("&");
      $.each(tokens, function(k,v){
        tmp = v.split("=");
        tmp[0] = decodeURIComponent(tmp[0]);
        if ( params[tmp[0]] ){
          if ( !(params[tmp[0]] instanceof Array) ) {
            params[tmp[0]] = [ params[tmp[0]] ];
          }
          params[tmp[0]].push( decodeURIComponent(tmp[1]) );
        } else {
          params[tmp[0]] = decodeURIComponent(tmp[1]);
        }
      });
      if ( $.isEmptyObject(params) ) { return null; }
      return params;
    }
  });

});
return {};

}));

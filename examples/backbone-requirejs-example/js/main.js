require.config({
	paths : {
		backbone : 'libs/backbone-min',
		underscore : 'libs/underscore-min',
		jquery : 'libs/jquery-1.8.2.min',
		jqm : 'libs/jquery.mobile-1.3.1',
		jqmr : 'libs/jquery.mobile.router',
		app : 'src/app',
		'collection.data' : 'src/collection/data',
		'view.detail' : 'src/view/Detail'
	}    
});

require(
	/* No AMD support in jQuery 1.6.4, underscore 1.3 and backbone 0.5.3 :(
	   Using this shim instead to ensure proper load sequence*/

	['require', 'jquery', 'underscore', 'backbone', 'jqmr'],
	function (require, $, _, Backbone, jqmr) {

		// Exposing globals just in case that we are switching to AMD version of the lib later
		var global = this;

		global.$ = global.$ || $;
		global._ = global._ || _;
		global.Backbone = global.Backbone || Backbone;

		console.log('core libs + router loaded');

		require(
			['app'],
			function (app){
				console.log('app loaded');

				require(
					['require', 'jqm'],
					function (require, $jqm) {
					console.log("jquery mobile loaded");
					require('app').init();
					}
			       );
			}
	       );
	}
);


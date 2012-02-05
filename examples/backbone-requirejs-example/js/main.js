require.config({
    paths : {
        backbone : 'libs/backbone-0.5.3',
        underscore : 'libs/underscore-1.3.0',
        jquery : 'libs/jquery-1.6.4',
        jqm : 'libs/jquery.mobile-1.0',
        order : 'libs/order-1.0.0',
        jqmr : 'libs/jquery.mobile.router',
        app : 'src/app',
        'collection.data' : 'src/collection/data',
        'view.detail' : 'src/view/Detail'
    }
});



require(
    /* No AMD support in jQuery 1.6.4, underscore 1.3 and backbone 0.5.3 :(
    Using this shim instead to ensure proper load sequence*/

    ['require', 'jquery', 'underscore', 'order!backbone' ],
    function (require, $, _, Backbone) {

        // Exposing globals just in case that we are switching to AMD version of the lib later
        var global = this;

        global.$ = global.$ || $;
        global._ = global._ || _;
        global.Backbone = global.Backbone || Backbone;

        console.log('core libs loaded');

        require(
            ['require', 'jqmr', 'order!jqm', 'order!app'],
            function (require, jqmr, $$,  app) {
                console.log('jquery.mobile.router loaded');
                require('app').init();
            });
    });


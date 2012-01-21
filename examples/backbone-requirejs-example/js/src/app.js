/*!
 * jQuery, jQueryMobile, Underscore and Backbone are exposed  as globals. No need to include them in the
 * define dependency array.
 *
 * Initialize namespacing (jQMRouterNamespace) and app setup.
 *
 * */
define(['collection.data', 'view.detail'],
    function (Data, DetailView) {
        // Using ECMAScript 5 strict mode during development. By default r.js will ignore that.
        "use strict";

        var init = function () {
            var ExampleNS = window.ExampleNS || {};

            ExampleNS = {
                M : {
                    data : new Data()
                },
                V : {

                },
                C : {
                    renderDetail : function (type, match, ui) {
                        if (!match) {
                            return;
                        }
                        if (!ExampleNS.V.detail) {
                            ExampleNS.V.detail = new DetailView({
                                model : ExampleNS.M.data, detailId : null, el : $("#detail :jqmData(role='content')")
                            });
                        }
                        var params = ExampleNS.C.router.getParams(match[1]);
                        if (params) {
                            ExampleNS.V.detail.options.detailId = params.id;
                        }
                        if (ExampleNS.M.data.isEmpty()) {
                            ExampleNS.M.data.fetch();
                        }
                        else {
                            ExampleNS.V.detail.render();
                        }

                    }
                }
            };

            ExampleNS.C.router = new $.mobile.Router({
                "#index" : function () {
                    console.log("INDEX!");
                },
                "#detail([?].*)?" : {
                    handler : ExampleNS.C.renderDetail, events : "bs"
                }
            });

            // in order to prevent foc
            $('body').show();
        };

        return { init : init };
    })
;

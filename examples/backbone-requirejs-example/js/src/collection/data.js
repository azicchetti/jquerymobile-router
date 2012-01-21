define([],
    function () {
        // Using ECMAScript 5 strict mode during development. By default r.js will ignore that.
        "use strict";


        var Data = Backbone.Collection.extend({
            url : 'services/getData.js'
        });

        return Data;
    });




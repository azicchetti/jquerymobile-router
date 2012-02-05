define([],
    function () {
        // Using ECMAScript 5 strict mode during development. By default r.js will ignore that.
        "use strict";


        var DetailView = Backbone.View.extend({
            template : _.template('<div class="id">Id: <%= id %></div><div class="title">Titolo: <%= title %></div><div class="text">Testo: <%= text %></div>'),

            initialize : function () {
                this.collection.bind("reset", this.render, this);
            },

            render : function () {
                if (!this.options.detailId) {
                    return;
                }
                var reqInstance = this.collection.get(this.options.detailId);
                if (!reqInstance) {
                    return;
                }
                this.el.html(this.template(reqInstance.toJSON()));
                return this;
            }
        });

        return DetailView;
    });




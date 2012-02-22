var M={}, V={}, C={};

var Data=Backbone.Collection.extend({
	url: "services/getData.js"
});

var DetailView=Backbone.View.extend({
	template: _.template('<div class="id">Id: <%= id %></div><div class="title">Titolo: <%= title %></div><div class="text">Testo: <%= text %></div>'),

	initialize: function(){
		this.model.bind("reset",this.render,this);
	},

	render: function(){
		if (!this.options.detailId) return;
		var reqInstance=this.model.get(this.options.detailId);
		if (!reqInstance) return; /* mhm? */
		this.$el.html( this.template(reqInstance.toJSON()) );
		return this;
	}
});


M.data=new Data();

C.renderDetail=function(type,match,ui){
	if (!match) return;
	if (!V.detail){
		V.detail=new DetailView({
			model: M.data, detailId: null, el: $("#detail :jqmData(role='content')")
		});
	}
	var params=C.router.getParams(match[1]);
	if (params){
		V.detail.options.detailId=params.id;
	}
	if (M.data.isEmpty()){
		M.data.fetch();
	} else {
		V.detail.render();
	}
};


C.renderPage = function (type, match, ui) {
	console.log('render Page - ' + type, 'match: ' + match);
};

C.router=new $.mobile.Router({
	"#index": function(){ console.log("INDEX!"); },
	"#detail([?].*)?": {
		handler: C.renderDetail, events: "bs"
	},
	".": {
		handler: C.renderPage, events: "bc"
	}
});


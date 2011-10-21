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
		this.el.html( this.template(reqInstance.toJSON()) );
		return this;
	}
});


M.data=new Data();

C.renderDetail=function(type,match,ui){
	if (!match) return;
	if (M.data.isEmpty()){
		M.data.fetch();
	}
	C.appBooted.then(function(){
		var params=C.router.getParams(match[1]);
		if (params){
			V.detail.options.detailId=params.id;
			V.detail.render();
		}
	});
};

C.router=new $.mobile.Router({
	"#detail([?].*)?": {
		handler: C.renderDetail, events: "bs"
	}
});

C.appBooted=$.Deferred();

$(function(){
	V.detail=new DetailView({
		model: M.data, detailId: null, el: $("#detail :jqmData(role='content')")
	});
	C.appBooted.resolve();
});


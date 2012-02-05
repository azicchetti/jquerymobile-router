var M={}, V={}, C={};

var Data=Backbone.Collection.extend({
	url: "services/getData.js"
});

M.data=new Data();






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


C.renderForm = function (type, match, ui) {
    console.log('renderForm - #dynForm id: ' + C.router.getParams(match[1]).formId);
};

C.pageInit = function (type, match, ui, page) {
    console.log('This page '+$(page).jqmData("url")+" has been initialized");
};



C.router=new $.mobile.Router({
	"#index": function(){ console.log("INDEX!"); },
	"#detail([?].*)?": {
		handler: C.renderDetail, events: "bs"
	},
	"#dynForm([?].*)?" : {
		handler : C.renderForm, events : "bs"
	},
	".": {
		handler: C.pageInit, events: "i"
	}
});


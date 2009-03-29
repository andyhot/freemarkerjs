var freemarker = {
	symbols: {	
		'replace': {start:'${', end:'}'},
		'if': {start:'<#if', end:'>'},
		'endif': {start:'</#if', end:'>'},
		'else': {start:'<#else', end:'>'},
		'list': {start:'<#list', end:'>'},
		'endlist': {start:'</#list', end:'>'},
	},
	_o : function(cmd) {
		return "p.push(\"" + escape(cmd) + "\");";
	},
	_p : function(cmd) {
		return "p.push(this." + cmd + ");";
	},
	_d : function(cmd) {
		return "console.debug(this, \"" + escape(cmd) + "\");";
	},
	_setlocalvarscode: function(obj) {
		var buf = [];
		for (var p in obj) {
			buf.push("var ", p, " = this['", p, "'];\n");
		}
		return buf.join('');
	},
	nextToken: function(template, pos) {
		var newPos;
		var endPos;
		var found={newPos:-1};
		for (var i in this.symbols) {
			var symbol = this.symbols[i];
			var n = template.indexOf(symbol.start, pos);
			if (n>=0 && (!found.newPos || n<found.newPos)) {
				var e = template.indexOf(symbol.end, n);
				if (e>=0) {
					found.newPos = n;
					found.endPos = e;
					found.start = n + symbol.start.length;
					found.symbol = symbol;
				}
			}
		}
		return found;
	},
	create: function(template) {
		var parts = [];
		parts.push("var p=[];");
		var pos=0;
		while (pos>=0) {
			var token = this.nextToken(template, pos);
			var newPos = template.indexOf("${", pos);
			if (newPos<0) {
				parts.push(this._o(template.substring(pos)));
				break;
			}
			var endPos = template.indexOf("}", newPos);
			if (endPos<0) {
				parts.push(this._o(template.substring(pos)));
				break;
			}
			parts.push(this._o(template.substring(pos, newPos)));
			parts.push(this._p(template.substring(newPos+2, endPos)));
			
			pos = endPos+1;
		}
		parts.push("this._out = unescape(p.join(''));");
		console.debug(parts);
		var engine={
			compiled:parts.join(''),
			template:template
		};
		return engine;
	},

	render: function(engine, context) {
		context = context || {};
		//var vars = this._setlocalvarscode(context);
		(function(){eval(/*vars+*/engine.compiled);}).call(context);
		return context._out;
	}
}; 

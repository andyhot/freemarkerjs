var freemarker = {
	symbols: {	
		'replace': {start:'${', end:'}', process:function(parts, cmd) {
			parts.push(freemarker._p(cmd));
		}},
		'if': {start:'<#if', end:'>', process:function(parts, cmd) {
			if (cmd.indexOf('??')) {
				var expr = cmd.substring(0, cmd.length-2);
				var pos = expr.lastIndexOf('.');
				if (pos<0) {
					expr = "window." + expr;
				}
				parts.push("if (" /*+ "this."*/ + expr + ") {");
			} else {
				parts.push("if (" + cmd + ") {");
			}
		}},
		'endif': {start:'</#if', end:'>', process:function(parts, cmd) {
			parts.push("}");
		}},
		'else': {start:'<#else', end:'>', process:function(parts, cmd) {
			parts.push("} else {");
		}},
		'list': {start:'<#list', end:'>', process:function(parts, cmd) {
			// <#list envelopes as envelope >
			var match = cmd.match(/\s*(\S*)\s*as\s*(\S*)\s*/);
			if (match) {
				parts.push("for (var " + match[2] + "_index in " + match[1] + ")");
			}
			parts.push("{");
            if (match) {
                parts.push("var " + match[2] + "=" + match[1] + "[" + match[2] + "_index];");
            }
		}},
		'endlist': {start:'</#list', end:'>', process:function(parts, cmd) {			
			parts.push("}");
		}}
	},
	_o : function(cmd) {
		return "p.push(\"" + escape(cmd) + "\");";
	},
	_p : function(cmd) {
		return "p.push(" /*+ "this."*/ + cmd + ");";
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
		var found={};
		for (var i in this.symbols) {
			var symbol = this.symbols[i];
			var n = template.indexOf(symbol.start, pos);
			if (n>=0 && (!found.symbol || n<found.newPos)) {
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
			if (!token.symbol) {
				parts.push(this._o(template.substring(pos)));
				break;
			}
			parts.push(this._o(template.substring(pos, token.newPos)));
			if (token.symbol.process) {
				token.symbol.process(parts, template.substring(token.start, token.endPos));
			}
			
			pos = token.endPos+1;
		}
		parts.push("this._out = unescape(p.join(''));");

		var engine={
			compiled:parts.join(''),
			template:template
		};
		return engine;
	},

	render: function(engine, context) {
		context = context || {};
		var vars = this._setlocalvarscode(context);
		(function(){eval(vars+engine.compiled);}).call(context);
		return context._out;
	}
}; 

/* Webapp */
var wapp = 
{	font:{},
	oldfont:{},
	oldglyph:{}
};

/** Mimic ol.style.addDefs */
var ol = {};
ol.style = {}
ol.style.FontSymbol = {}
ol.style.FontSymbol.addDefs = function(f,g)
{	wapp.oldfont[f.font] = f;
	$.extend (wapp.oldglyph, g);
}

/** Load css for the font
*/
wapp.loadcss = function(cssId, font)
{	var filename = cssId+"/css/"+font+'.css?'+Number(new Date());
	
	var css = $("#fonts")
	if (!css.length)
	{	css = $("<link>", {
			"id": "fonts",
			"rel" : "stylesheet",
			"type" :  "text/css",
			"href" : filename
		});
		$("head").append(css);
	}
	else css.attr('href', filename);
	return;
}

wapp.loaddef = function(cssId, font)
{	var filename = cssId+"/"+font+'.def.js';
	$("#defs").remove();
	var js = $("<script>", {
			"id": "defs",
			"type" :  "text/javascript",
			"src" : filename
		});
	$("head").append(js);
}

wapp.load = function(name)
{	var idiv = $("#icons").html("");
	var f = name+"/config.json"; //"_fontdef/../"+name+"/config.json";
	$.getJSON( f, function (font) 
	{	wapp.font=font;
		document.title = "Font "+font.name;
		wapp.loadcss (name, font.name);
		$("h1 .title").text(font.name);
		//$("#footer").text(font.copyright);

		wapp.loaddef(name, font.name);
		wapp.export();

		var prefix = font.css_prefix_text;
		var theme = "";
		var icons = { };
		for (var i=0; i<font.glyphs.length; i++)
		{	var icon = font.glyphs[i];
			var t = icon.css.split("-");
			if (wapp.glyphs[prefix+icon.css]) theme = wapp.glyphs[prefix+icon.css].theme;
			else theme = (t.length>1 ? t[0] : "default");
			if (!icons[theme]) icons[theme] = [];
			icons[theme].push(icon);
		}
		for (theme in icons)
		{	$("<h2>").text(theme).appendTo(idiv);
			for (var i=0; i< icons[theme].length; i++)
				$("<div>").addClass("icon")
					.click (wapp.edit)
					.append ( $("<i>").addClass(prefix+icons[theme][i].css).addClass(theme) )
					.append ( $("<span>").addClass("iname").text(prefix+icons[theme][i].css) )
					.append ( $("<span>").addClass("icode").text("0x"+icons[theme][i].code.toString(16)) )
					.append ( $("<span>").addClass("keys").text(wapp.glyphs[prefix+icons[theme][i].css].search) )
					.appendTo(idiv);
		}
	});
}


wapp.edit = function(input)
{	var g = $(".iname", this).text();
	var c =  $("#back .content");
	$("i", c).removeClass().addClass(g);
	$("input.theme", c).val(wapp.glyphs[g].theme);
	$("input.search", c).val(wapp.glyphs[g].search);
	$("#back").show();
}

wapp.valid = function(input)
{	var c =  $("#back .content");
	var g = $("i", c).attr('class');
	wapp.glyphs[g].search = $("input.search", c).val();
	wapp.glyphs[g].theme = $("input.theme", c).val();
	wapp.export(true);
	$("#back").hide();
}

wapp.export = function(nocalc)
{	var json = wapp.font;
	var font = wapp.oldfont[json.name];
	var glyphs = wapp.glyphs;

	if (!nocalc)
	{	glyphs = wapp.glyphs = {};
		if (!font)
		{	font={};
			font.name = json.name;
			font.font = json.name;
			font.copyright = json.copyright;
			font.prefix = json.css_prefix_text.replace(/-$/,"");
		}
		// Tri alphabetic avec les "form" en premier
		json.glyphs = json.glyphs.sort(function(a,b)
		{	if ((/^form-/).test(a.css) && !(/^form-/).test(b.css)) return -1;
			else if (!(/^form-/).test(a.css) && (/^form-/).test(b.css)) return 1;
			return a.css<b.css ? -1:1; 
		});
		// export
		for (var k=0; k<json.glyphs.length; k++)
		{	var name = font.prefix+"-"+json.glyphs[k].css;
			var g = glyphs[name] = {};
			g.font = font.font;
			g.code = json.glyphs[k].code; 
			// g.code = "\\u"+json.glyphs[k].code.toString(16);
			var css = json.glyphs[k].css.split('-');
			if (css.length>1)
			{	g.theme = css[0];
				g.name = css[1];
			}
			else
			{	g.name = css[0];
			}
			if (wapp.oldglyph[font.prefix+"-"+json.glyphs[k].css]) 
			{	g.search = wapp.oldglyph[font.prefix+"-"+json.glyphs[k].css].search;
				g.theme = wapp.oldglyph[font.prefix+"-"+json.glyphs[k].css].theme;
			}
			else g.search = json.glyphs[k].search[0].replace("-",",");
		}
	}

	var t = JSON.stringify(font,null,"\t")
	t+= ",\n"+JSON.stringify(glyphs).replace(/:/g,": ").replace("{","{\t").replace(/\},/g,"},\n\t").replace("}}","}\n}");
//	$("textarea").val("ol.style.FontSymbol.addDefs\n("+t+");");

	$("#footer").html(wapp.font.name+" - "+(font.copyright||"CC0"));
	return t;
};

wapp.save = function()
{	var name = wapp.font.name;
	var copy = "/* Copyright "+(wapp.oldfont[name].copyright||"CC0")+ " - "+name+"\n"
		+" *\n"
		+" * Font definiton to use with fontsymbols\n"
		+" */\n"
		+"ol.style.FontSymbol.addDefs\n(";
	var blob = new Blob([copy+wapp.export(true)+");"], {type: "text/javascript;charset=utf-8"});
	FileSaver.saveAs(blob, name+".def.js");
};

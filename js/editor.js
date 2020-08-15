var abc = null, transpose = '%%transpose CC\n';

// eval can't be in strict block
function abcSelectSample(me) {
//	console.log(me.innerHTML);
	var abcContent = eval(me.innerHTML);
	source.value = abcContent;
	$EDITOR.render(abcContent);
}

var $EDITOR = (function ()
{
	'use strict';
	var library = {},
		samples = [
			"notes1", "notes2", "notes3", "temps1", "temps2", "barres", "clefs", "modes", "voix", "|",
			"symboles1", "symboles2", "symboles3", "texte", "pagination", "couleurs", "|", "piano1", "piano2", "arrows", "br",
			"missa", "verum", "bach", "chopin", "ipanema", "|", "chorus", "piano2V", "piano2V_C", "piano2V_CD", "piano4V", "piano4V_C", "piano4V_CD", "piano4V_CDF", "|",
			"jazz1","jazz2"
		],
		tone = null,
		timeout = null,
		msg = $('div.error .text'),
		docSource =	document.getElementById("source"),
		docScore = document.getElementById("target");

	function _abcAutoRender() {
		try {
			library.render();
			msg.html('').hide();
		} catch (e) {
			msg.html(e.toString()).show();
		}
	}

	function _buildTonalitySelector(){
		var text =
			'<table>' +
				'<tr>' +
					'<th></th><td class="alt">7b</td><td class="alt">6b</td><td class="alt">5b</td><td class="alt">4b</td><td class="alt">3b</td><td class="alt">2b</td><td class="alt">1b</td>' +
					'<td></td><td class="alt">1#</td><td class="alt">2#</td><td class="alt">3#</td><td class="alt">4#</td><td class="alt">5#</td><td class="alt">6#</td><td class="alt">7#</td>' +
					'<th><span class="mini">Altérations</span></th><td rowspan="3"></td>'+
				'</tr>' +
				'<tr><th rowspan="2"><span class="mini">Sélection<br>de la<br>tonalité</span></th>';

		var i, l, tone, tmp, tonalities;
		tonalities = $HARMONY.getTonalities(false);
		for (i=0, l=tonalities.length, tmp=''; i<l; i++) {
			tone = tonalities[i];
			tmp += '<td><button class="tonality major" name="M' + tone + '" value="M' + tone + '">' + tone + '</button></td>';
		}
		text += tmp + '<th>Majeur</th></tr><tr>';

		tonalities = $HARMONY.getTonalities(true);
		for (i=0, l=tonalities.length, tmp=''; i<l; i++) {
			tone = tonalities[i];
			tmp += '<td><button class="tonality minor" name="m' + tone + '" value="m' + tone + '">' + tone + 'm</button></td>';
		}
		text += tmp + '<th>Mineur</th></tr></table>';

		var doc = document.querySelector('#tonality-selector');
		if (doc != null) {
			doc.innerHTML = text;
		}

		tonalities = document.querySelectorAll(".tonality");
		for (i=0, l=tonalities.length; i<l; i++) {
			tonalities[i].addEventListener('click', function() {
				document.querySelector(".tonality.selected").classList.toggle('selected');
				this.classList.toggle('selected');
				_updateTonality(this.value);
			});
		}
		var tonality = 'MC';
		document.getElementsByName(tonality)[0].classList.toggle('selected');
		return tonality;
	}

	function _abcTranspose(abcContent, tonality) {
		// ABC-2.2: transpose svg & audio
		// K: score= sound= shift=
		var tm = $HARMONY.getToneAndMinor(tonality);
		var key = tm.tone + (tm.minor ? 'm':'');

		// remap # and b
		var note = tone;
		if (tone.indexOf("#") != -1) {
			note = '^' + tone[0];
		}
		else if (tone.indexOf("b") != -1) {
			note = '_' + tone[0];
		}

		if (note === 'C') {
			return abcContent;
		}

		// transpose low
		if ((note.indexOf("B") !== -1) || (note.indexOf("A") !== -1)) {
			note += ',';
		}

		var abcOut = abcContent;
		var start = 0, end;
		while (1) {
			start = abcOut.indexOf("K:", start+1);
			if (start !== -1) {
				end = abcOut.indexOf("\n", start+1);

				// get original key
				var original = abcOut.substring(start, end);
				var transposition = original + ' shift=C' + note + '\n';
//console.log('_abcTranspose:', transposition);
				if (end !== -1) {
					abcOut = abcOut.substring(0, start) + transposition + abcOut.substring(end+1, abcOut.length);
				}
				else {
					break;
				}
			}
			else {
				break;
			}
		}
		return abcOut;
	}

	function _updateTonality(tonality) {
		tone = tonality.substring(1, tonality.length);
		library.render();
	}


	function _get_abc_data() {
		function _extractUrlParams() {
			var t = location.search.substring(1).split('&');
			var f = [];
			for (var i=0; i<t.length; i++) {
				var x = t[i].split('=');
				f[x[0]] = x[1];
			}
			return f;
		}

		var params = _extractUrlParams();
		// no param ?abc="base64...."
		if (params.abc === undefined) {
			return undefined;
		}

		// Create Base64 Object
		var Base64={
			_keyStr:"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",
			_utf8_decode:function(r){for(var t="",e=0,o=0,a=0,h=0;e<r.length;)(o=r.charCodeAt(e))<128?(t+=String.fromCharCode(o),e++):o>191&&o<224?(a=r.charCodeAt(e+1),t+=String.fromCharCode((31&o)<<6|63&a),e+=2):(a=r.charCodeAt(e+1),h=r.charCodeAt(e+2),t+=String.fromCharCode((15&o)<<12|(63&a)<<6|63&h),e+=3);return t},
			decode:function(r){var t,e,o,a,h,n,d="",C=0;for(r=r.replace(/[^A-Za-z0-9\+\/\=]/g,"");C<r.length;)t=this._keyStr.indexOf(r.charAt(C++))<<2|(a=this._keyStr.indexOf(r.charAt(C++)))>>4,e=(15&a)<<4|(h=this._keyStr.indexOf(r.charAt(C++)))>>2,o=(3&h)<<6|(n=this._keyStr.indexOf(r.charAt(C++))),d+=String.fromCharCode(t),64!=h&&(d+=String.fromCharCode(e)),64!=n&&(d+=String.fromCharCode(o));return d=Base64._utf8_decode(d)}
		};

		// retrieve abc text given as html parameter
		var abcContent = Base64.decode(params.abc);

		// remove ending zeros
		var start = abcContent.indexOf("\0");
		if (start !== -1) {
			abcContent = abcContent.substring(0, start);
		}
		return abcContent;
	}

	function _init() {
		var options = {
			"instruments": ["acoustic_grand_piano"]
		};
		$ABC_UI.init(options);

		// Get the version of last published lib
		var doc = document.getElementById("abc2svg");
		doc.innerHTML = 'abc2svg-' + abc2svg.version + ' du ' + abc2svg.vdate + '';

		var tonality = 'MC';
		_buildTonalitySelector();
		tone = tonality.substring(1, tonality.length);

		// Add samples
		var text = '';
		for (var i=0, l=samples.length; i<l; i++) {
			if (samples[i]=="br") {
				text += '<br>';
			} else if (samples[i]=="|") {
				text += ' | ';
			} else {
				text += '<a href="#' + samples[i] + '" onclick="abcSelectSample(this)">' + samples[i] + '</a> ';
			}
		}
		doc = document.getElementById("samples");
		doc.innerHTML = text;

		// get abc from html param ?abc="base64..."
		var abc = _get_abc_data();
		if (abc !== undefined) {
			docSource.value = abc;
		}

		$('#source').on('blur keyup paste', function() {
			if (timeout) {
				clearTimeout(timeout);
			}
			timeout = setTimeout(_abcAutoRender, 1600);
		});

		_abcAutoRender();
	}

	library.render = function(abcContent) {
		if ((undefined === abcContent) || (null === abcContent)) {
			abcContent = docSource.value;
		}
		abcContent = "%%player_top/n%%pagescale 1.2/n" + _abcTranspose(abcContent, tone);
		$ABC_UI.buildScore(docScore, abcContent);
	};

	_init();
	return library;
}());

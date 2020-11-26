var $j = jQuery.noConflict(); //avoid conflicts on John's fork (state.js)

var maxNoCharts = 0;
var currentNoCharts = 0;

var interfacelist = "";
var interfacescomplete = [];
var interfacesdisabled = [];

var ShowLines = GetCookie("ShowLines","string");
var ShowFill = GetCookie("ShowFill","string");
if(ShowFill == ""){
	ShowFill = "origin";
}

var DragZoom = true;
var ChartPan = false;

Chart.defaults.global.defaultFontColor = "#CCC";
Chart.Tooltip.positioners.cursor = function(chartElements, coordinates){
	return coordinates;
};

var chartlist = ["daily","weekly","monthly"];
var timeunitlist = ["hour","day","day"];
var intervallist = [24,7,30];
var bordercolourlist_Combined = ["#fc8500","#42ecf5"];
var backgroundcolourlist_Combined = ["rgba(252,133,0,0.5)","rgba(66,236,245,0.5)"];
var bordercolourlist_Quality = ["#53047a","#07f242","#ffffff"];
var backgroundcolourlist_Quality = ["rgba(83,4,122,0.5)","rgba(7,242,66,0.5)","rgba(255,255,255,0.5)"];

var typelist = ["Combined","Quality"];

function keyHandler(e){
	if(e.keyCode == 27){
		$j(document).off("keydown");
		ResetZoom();
	}
}

$j(document).keydown(function(e){keyHandler(e);});
$j(document).keyup(function(e){
	$j(document).keydown(function(e){
		keyHandler(e);
	});
});

function Draw_Chart_NoData(txtchartname,txtcharttype){
	document.getElementById("divLineChart_"+txtchartname+"_"+txtcharttype).width="730";
	document.getElementById("divLineChart_"+txtchartname+"_"+txtcharttype).height="500";
	document.getElementById("divLineChart_"+txtchartname+"_"+txtcharttype).style.width="730px";
	document.getElementById("divLineChart_"+txtchartname+"_"+txtcharttype).style.height="500px";
	var ctx = document.getElementById("divLineChart_"+txtchartname+"_"+txtcharttype).getContext("2d");
	ctx.save();
	ctx.textAlign = 'center';
	ctx.textBaseline = 'middle';
	ctx.font = "normal normal bolder 48px Arial";
	ctx.fillStyle = 'white';
	ctx.fillText('No data to display', 365, 250);
	ctx.restore();
}

function Draw_Chart(txtchartname,txtcharttype){
	var txtunity = "";
	var txtunity2 = "";
	var txttitle = "";
	var metric0 = "";
	var metric1 = "";
	var metric2 = "";
	var showyaxis2 = false;
	
	if(txtcharttype == "Combined"){
		txtunity = "Mbps";
		txttitle = "Bandwidth";
		metric0 = "Download";
		metric1 = "Upload";
	}
	else if(txtcharttype == "Quality"){
		txtunity = "ms";
		txtunity2 = "%";
		txttitle = "Quality";
		metric0 = "Latency";
		metric1 = "Jitter";
		metric2 = "PktLoss";
		showyaxis2 = true;
	}
	
	var chartperiod = getChartPeriod($j("#" + txtchartname + "_Period_" + txtcharttype + " option:selected").val());
	var txtunitx = timeunitlist[$j("#" + txtchartname + "_Period_" + txtcharttype + " option:selected").val()];
	var numunitx = intervallist[$j("#" + txtchartname + "_Period_" + txtcharttype + " option:selected").val()];
	var dataobject = window[chartperiod+"_"+txtchartname+"_"+txtcharttype];
	if(typeof dataobject === 'undefined' || dataobject === null){ Draw_Chart_NoData(txtchartname,txtcharttype); return; }
	if(dataobject.length == 0){ Draw_Chart_NoData(txtchartname,txtcharttype); return; }
	
	var chartData = dataobject.map(function(d){return {x: d.Time, y: d.Value}});
	
	var unique = [];
	var chartTrafficTypes = [];
	for( let i = 0; i < dataobject.length; i++){
		if(!unique[dataobject[i].Metric]){
			chartTrafficTypes.push(dataobject[i].Metric);
			unique[dataobject[i].Metric] = 1;
		}
	}
	
	var chartData0 = dataobject.filter(function(item){
		return item.Metric == metric0;
	}).map(function(d){return {x: d.Time, y: d.Value}});
	
	var chartData1 = dataobject.filter(function(item){
		return item.Metric == metric1;
	}).map(function(d){return {x: d.Time, y: d.Value}});
	
	var chartData2 = dataobject.filter(function(item){
		return item.Metric == metric2;
	}).map(function(d){return {x: d.Time, y: d.Value}});
	
	var objchartname=window["LineChart_"+txtchartname+"_"+txtcharttype];
	
	var timeaxisformat = getTimeFormat($j("#Time_Format option:selected").val(),"axis");
	var timetooltipformat = getTimeFormat($j("#Time_Format option:selected").val(),"tooltip");
	
	factor=0;
	if(txtunitx=="hour"){
		factor=60*60*1000;
	}
	else if(txtunitx=="day"){
		factor=60*60*24*1000;
	}
	if(objchartname != undefined) objchartname.destroy();
	var ctx = document.getElementById("divLineChart_"+txtchartname+"_"+txtcharttype).getContext("2d");
	var lineOptions = {
		segmentShowStroke : false,
		segmentStrokeColor : "#000",
		animationEasing : "easeOutQuart",
		animationSteps : 100,
		maintainAspectRatio: false,
		animateScale : true,
		hover: { mode: "point" },
		legend: {
			display: true,
			position: "top",
			reverse: true,
			onClick: function (e, legendItem){
				var index = legendItem.datasetIndex;
				var ci = this.chart;
				var meta = ci.getDatasetMeta(index);
				
				meta.hidden = meta.hidden === null ? !ci.data.datasets[index].hidden : null;
				
				if(ShowLines == "line"){
					var annotationline = ""
					if(meta.hidden != true){
						annotationline = "line";
					}
					
					if(ci.data.datasets[index].label == "Latency" || ci.data.datasets[index].label == "Download"){
						for (aindex = 0; aindex < 3; aindex++){
							ci.options.annotation.annotations[aindex].type=annotationline;
						}
					}
					else if(ci.data.datasets[index].label == "Jitter" || ci.data.datasets[index].label == "Upload"){
						for (aindex = 3; aindex < 6; aindex++){
							ci.options.annotation.annotations[aindex].type=annotationline;
						}
					}
					else if(ci.data.datasets[index].label == "Packet Loss"){
						for (aindex = 6; aindex < 9; aindex++){
							ci.options.annotation.annotations[aindex].type=annotationline;
						}
					}
				}
				
				if(ci.data.datasets[index].label == "Packet Loss"){
					var showaxis = false;
					if(meta.hidden != true){
						showaxis = true;
					}
					ci.scales["right-y-axis"].options.display = showaxis;
				}
				
				ci.update();
			}
		},
		title: { display: true, text: txttitle },
		tooltips: {
			callbacks: {
					title: function (tooltipItem, data){ return (moment(tooltipItem[0].xLabel,"X").format(timetooltipformat)); },
					label: function (tooltipItem, data){ var txtunitytip=txtunity; if(data.datasets[tooltipItem.datasetIndex].label == "Packet Loss"){txtunitytip=txtunity2}; return round(data.datasets[tooltipItem.datasetIndex].data[tooltipItem.index].y,2).toFixed(2) + ' ' + txtunitytip;}
				},
			itemSort: function(a, b){
				return b.datasetIndex - a.datasetIndex;
			},
			mode: 'point',
			position: 'cursor',
			intersect: true
		},
		scales: {
			xAxes: [{
				type: "time",
				gridLines: { display: true, color: "#282828" },
				ticks: {
					min: moment().subtract(numunitx, txtunitx+"s"),
					display: true
				},
				time: {
					parser: "X",
					unit: txtunitx,
					stepSize: 1,
					displayFormats: timeaxisformat
				}
			}],
			yAxes: [{
				gridLines: { display: false, color: "#282828" },
				scaleLabel: { display: false, labelString: "" },
				id: 'left-y-axis',
				position: 'left',
				ticks: {
					display: true,
					beginAtZero: true,
					callback: function (value, index, values){
						return round(value,2).toFixed(2) + ' ' + txtunity;
					}
				},
			},
			{
				gridLines: { display: false, color: "#282828" },
				scaleLabel: { display: false, labelString: "" },
				id: 'right-y-axis',
				position: 'right',
				ticks: {
					display: showyaxis2,
					beginAtZero: true,
					callback: function (value, index, values){
						return round(value,2).toFixed(2) + ' ' + txtunity2;
					}
				},
			}]
		},
		plugins: {
			zoom: {
				pan: {
					enabled: ChartPan,
					mode: 'xy',
					rangeMin: {
						x: new Date().getTime() - (factor * numunitx),
						y: 0,
					},
					rangeMax: {
						x: new Date().getTime()//,
						//y: getLimit(chartData,"y","max",false) + getLimit(chartData,"y","max",false)*0.1,
					},
				},
				zoom: {
					enabled: true,
					drag: DragZoom,
					mode: 'xy',
					rangeMin: {
						x: new Date().getTime() - (factor * numunitx),
						y: 0,
					},
					rangeMax: {
						x: new Date().getTime()//,
						//y: getLimit(chartData,"y","max",false) + getLimit(chartData,"y","max",false)*0.1,
					},
					speed: 0.1
				},
			},
		},
		annotation: {
			drawTime: 'afterDatasetsDraw',
			annotations: [{
				//id: 'avgline',
				type: ShowLines,
				mode: 'horizontal',
				scaleID: 'left-y-axis',
				value: getAverage(chartData0),
				borderColor: window["bordercolourlist_"+txtcharttype][0],
				borderWidth: 1,
				borderDash: [5, 5],
				label: {
					backgroundColor: 'rgba(0,0,0,0.3)',
					fontFamily: "sans-serif",
					fontSize: 10,
					fontStyle: "bold",
					fontColor: "#fff",
					xPadding: 6,
					yPadding: 6,
					cornerRadius: 6,
					position: "center",
					enabled: true,
					xAdjust: 0,
					yAdjust: 0,
					content: "Avg. "+metric0+"=" + round(getAverage(chartData0),2).toFixed(2)+txtunity,
				}
			},
			{
				//id: 'maxline',
				type: ShowLines,
				mode: 'horizontal',
				scaleID: 'left-y-axis',
				value: getLimit(chartData0,"y","max",true),
				borderColor: window["bordercolourlist_"+txtcharttype][0],
				borderWidth: 1,
				borderDash: [5, 5],
				label: {
					backgroundColor: 'rgba(0,0,0,0.3)',
					fontFamily: "sans-serif",
					fontSize: 10,
					fontStyle: "bold",
					fontColor: "#fff",
					xPadding: 6,
					yPadding: 6,
					cornerRadius: 6,
					position: "right",
					enabled: true,
					xAdjust: 15,
					yAdjust: 0,
					content: "Max. "+metric0+"=" + round(getLimit(chartData0,"y","max",true),2).toFixed(2)+txtunity,
				}
			},
			{
				//id: 'minline',
				type: ShowLines,
				mode: 'horizontal',
				scaleID: 'left-y-axis',
				value: getLimit(chartData0,"y","min",true),
				borderColor: window["bordercolourlist_"+txtcharttype][0],
				borderWidth: 1,
				borderDash: [5, 5],
				label: {
					backgroundColor: 'rgba(0,0,0,0.3)',
					fontFamily: "sans-serif",
					fontSize: 10,
					fontStyle: "bold",
					fontColor: "#fff",
					xPadding: 6,
					yPadding: 6,
					cornerRadius: 6,
					position: "left",
					enabled: true,
					xAdjust: 15,
					yAdjust: 0,
					content: "Min. "+metric0+"=" + round(getLimit(chartData0,"y","min",true),2).toFixed(2)+txtunity,
				}
			},
			{
				//id: 'avgline',
				type: ShowLines,
				mode: 'horizontal',
				scaleID: 'left-y-axis',
				value: getAverage(chartData1),
				borderColor: window["bordercolourlist_"+txtcharttype][1],
				borderWidth: 1,
				borderDash: [5, 5],
				label: {
					backgroundColor: 'rgba(0,0,0,0.3)',
					fontFamily: "sans-serif",
					fontSize: 10,
					fontStyle: "bold",
					fontColor: "#fff",
					xPadding: 6,
					yPadding: 6,
					cornerRadius: 6,
					position: "center",
					enabled: true,
					xAdjust: 0,
					yAdjust: 0,
					content: "Avg. "+metric1+"=" + round(getAverage(chartData1),2).toFixed(2)+txtunity,
				}
			},
			{
				//id: 'maxline',
				type: ShowLines,
				mode: 'horizontal',
				scaleID: 'left-y-axis',
				value: getLimit(chartData1,"y","max",true),
				borderColor: window["bordercolourlist_"+txtcharttype][1],
				borderWidth: 1,
				borderDash: [5, 5],
				label: {
					backgroundColor: 'rgba(0,0,0,0.3)',
					fontFamily: "sans-serif",
					fontSize: 10,
					fontStyle: "bold",
					fontColor: "#fff",
					xPadding: 6,
					yPadding: 6,
					cornerRadius: 6,
					position: "right",
					enabled: true,
					xAdjust: 15,
					yAdjust: 0,
					content: "Max. "+metric1+"=" + round(getLimit(chartData1,"y","max",true),2).toFixed(2)+txtunity,
				}
			},
			{
				//id: 'minline',
				type: ShowLines,
				mode: 'horizontal',
				scaleID: 'left-y-axis',
				value: getLimit(chartData1,"y","min",true),
				borderColor: window["bordercolourlist_"+txtcharttype][1],
				borderWidth: 1,
				borderDash: [5, 5],
				label: {
					backgroundColor: 'rgba(0,0,0,0.3)',
					fontFamily: "sans-serif",
					fontSize: 10,
					fontStyle: "bold",
					fontColor: "#fff",
					xPadding: 6,
					yPadding: 6,
					cornerRadius: 6,
					position: "left",
					enabled: true,
					xAdjust: 15,
					yAdjust: 0,
					content: "Min. "+metric1+"=" + round(getLimit(chartData1,"y","min",true),2).toFixed(2)+txtunity,
				}
			},
			{
				//id: 'avgline',
				type: ShowLines,
				mode: 'horizontal',
				scaleID: 'right-y-axis',
				value: getAverage(chartData2),
				borderColor: window["bordercolourlist_"+txtcharttype][2],
				borderWidth: 1,
				borderDash: [5, 5],
				label: {
					backgroundColor: 'rgba(0,0,0,0.3)',
					fontFamily: "sans-serif",
					fontSize: 10,
					fontStyle: "bold",
					fontColor: "#fff",
					xPadding: 6,
					yPadding: 6,
					cornerRadius: 6,
					position: "center",
					enabled: true,
					xAdjust: 0,
					yAdjust: 0,
					content: "Avg. "+metric2+"=" + round(getAverage(chartData2),2).toFixed(2)+txtunity2,
				}
			},
			{
				//id: 'maxline',
				type: ShowLines,
				mode: 'horizontal',
				scaleID: 'right-y-axis',
				value: getLimit(chartData2,"y","max",true),
				borderColor: window["bordercolourlist_"+txtcharttype][2],
				borderWidth: 1,
				borderDash: [5, 5],
				label: {
					backgroundColor: 'rgba(0,0,0,0.3)',
					fontFamily: "sans-serif",
					fontSize: 10,
					fontStyle: "bold",
					fontColor: "#fff",
					xPadding: 6,
					yPadding: 6,
					cornerRadius: 6,
					position: "right",
					enabled: true,
					xAdjust: 15,
					yAdjust: 0,
					content: "Max. "+metric2+"=" + round(getLimit(chartData2,"y","max",true),2).toFixed(2)+txtunity2,
				}
			},
			{
				//id: 'minline',
				type: ShowLines,
				mode: 'horizontal',
				scaleID: 'right-y-axis',
				value: getLimit(chartData2,"y","min",true),
				borderColor: window["bordercolourlist_"+txtcharttype][2],
				borderWidth: 1,
				borderDash: [5, 5],
				label: {
					backgroundColor: 'rgba(0,0,0,0.3)',
					fontFamily: "sans-serif",
					fontSize: 10,
					fontStyle: "bold",
					fontColor: "#fff",
					xPadding: 6,
					yPadding: 6,
					cornerRadius: 6,
					position: "left",
					enabled: true,
					xAdjust: 15,
					yAdjust: 0,
					content: "Min. "+metric2+"=" + round(getLimit(chartData2,"y","min",true),2).toFixed(2)+txtunity2,
				}
			}
			
		]}
	};
	var lineDataset = {
		datasets: getDataSets(txtcharttype, dataobject, chartTrafficTypes)
	};
	objchartname = new Chart(ctx, {
		type: 'line',
		options: lineOptions,
		data: lineDataset
	});
	window["LineChart_"+txtchartname+"_"+txtcharttype]=objchartname;
}

function getDataSets(charttype, objdata, objTrafficTypes){
	var datasets = [];
	colourname="#fc8500";
	
	for(var i = 0; i < objTrafficTypes.length; i++){
		var traffictypedata = objdata.filter(function(item){
			return item.Metric == objTrafficTypes[i];
		}).map(function(d){return {x: d.Time, y: d.Value}});
		var axisid = "left-y-axis";
		if(objTrafficTypes[i] == "PktLoss"){
			axisid = "right-y-axis";
		}
		
		datasets.push({ label: objTrafficTypes[i].replace("PktLoss","Packet Loss"), data: traffictypedata, yAxisID: axisid, borderWidth: 1, pointRadius: 1, lineTension: 0, fill: true, backgroundColor: window["backgroundcolourlist_"+charttype][i], borderColor: window["bordercolourlist_"+charttype][i]});
	}
	datasets.reverse();
	return datasets;
}

function getLimit(datasetname,axis,maxmin,isannotation){
	var limit=0;
	var values;
	if(axis == "x"){
		values = datasetname.map(function(o){ return o.x } );
	}
	else{
		values = datasetname.map(function(o){ return o.y } );
	}
	
	if(maxmin == "max"){
		limit=Math.max.apply(Math, values);
	}
	else{
		limit=Math.min.apply(Math, values);
	}
	if(maxmin == "max" && limit == 0 && isannotation == false){
		limit = 1;
	}
	return limit;
}

function getAverage(datasetname){
	var total = 0;
	for(var i = 0; i < datasetname.length; i++){
		total += (datasetname[i].y*1);
	}
	var avg = total / datasetname.length;
	return avg;
}

function round(value, decimals){
	return Number(Math.round(value+'e'+decimals)+'e-'+decimals);
}

function ToggleLines(){
	var interfacetextarray = interfacelist.split(',');
	if(ShowLines == ""){
		ShowLines = "line";
		SetCookie("ShowLines","line");
	}
	else{
		ShowLines = "";
		SetCookie("ShowLines","");
	}
	for (i = 0; i < interfacetextarray.length; i++){
		for (i2 = 0; i2 < typelist.length; i2++){
			var chartobj = window["LineChart_"+interfacetextarray[i]+"_"+typelist[i2]];
			if(typeof chartobj === 'undefined' || chartobj === null){ continue; }
			var maxlines = 6;
			if(typelist[i2] == "Quality"){
				maxlines = 9;
			}
			for (i3 = 0; i3 < maxlines; i3++){
				chartobj.options.annotation.annotations[i3].type=ShowLines;
			}
			chartobj.update();
		}
	}
}

function ToggleFill(){
	var interfacetextarray = interfacelist.split(',');
	if(ShowFill == "origin"){
		ShowFill = false;
		SetCookie("ShowFill",false);
	}
	else{
		ShowFill = "origin";
		SetCookie("ShowFill","origin");
	}
	
	for (i = 0; i < interfacetextarray.length; i++){
		for (i2 = 0; i2 < typelist.length; i2++){
			var chartobj = window["LineChart_"+interfacetextarray[i]+"_"+typelist[i2]];
			if(typeof chartobj === 'undefined' || chartobj === null){ continue; }
			chartobj.data.datasets[0].fill=ShowFill;
			chartobj.data.datasets[1].fill=ShowFill;
			if(typelist[i2] == "Quality"){
				chartobj.data.datasets[2].fill=ShowFill;
			}
			chartobj.update();
		}
	}
}

function RedrawAllCharts(){
	var interfacetextarray = interfacelist.split(',');
	var i;
	for (i2 = 0; i2 < chartlist.length; i2++){
		for (i3 = 0; i3 < interfacetextarray.length; i3++){
			$j("#"+interfacetextarray[i3]+"_Period_Combined").val(GetCookie(interfacetextarray[i3]+"_Period_Combined","number"));
			$j("#"+interfacetextarray[i3]+"_Period_Quality").val(GetCookie(interfacetextarray[i3]+"_Period_Quality","number"));
			d3.csv('/ext/spdmerlin/csv/Combined'+chartlist[i2]+"_"+interfacetextarray[i3]+'.htm').then(SetGlobalDataset.bind(null,chartlist[i2]+"_"+interfacetextarray[i3]+"_Combined"));
			d3.csv('/ext/spdmerlin/csv/Quality'+chartlist[i2]+"_"+interfacetextarray[i3]+'.htm').then(SetGlobalDataset.bind(null,chartlist[i2]+"_"+interfacetextarray[i3]+"_Quality"));
		}
	}
}

function getTimeFormat(value,format){
	var timeformat;
	
	if(format == "axis"){
		if(value == 0){
			timeformat = {
				millisecond: 'HH:mm:ss.SSS',
				second: 'HH:mm:ss',
				minute: 'HH:mm',
				hour: 'HH:mm'
			}
		}
		else if(value == 1){
			timeformat = {
				millisecond: 'h:mm:ss.SSS A',
				second: 'h:mm:ss A',
				minute: 'h:mm A',
				hour: 'h A'
			}
		}
	}
	else if(format == "tooltip"){
		if(value == 0){
			timeformat = "YYYY-MM-DD HH:mm:ss";
		}
		else if(value == 1){
			timeformat = "YYYY-MM-DD h:mm:ss A";
		}
	}
	
	return timeformat;
}

function GetCookie(cookiename,returntype){
	var s;
	if((s = cookie.get("spd_"+cookiename)) != null){
		return cookie.get("spd_"+cookiename);
	}
	else{
		if(returntype == "string"){
			return "";
		}
		else if(returntype == "number"){
			return 0;
		}
	}
}

function SetCookie(cookiename,cookievalue){
	cookie.set("spd_"+cookiename, cookievalue, 31);
}

$j.fn.serializeObject = function(){
	var o = custom_settings;
	var a = this.serializeArray();
	$j.each(a, function(){
		if(o[this.name] !== undefined && this.name.indexOf("spdmerlin") != -1 && this.name.indexOf("version") == -1 && this.name.indexOf("spdmerlin_iface_enabled") == -1 && this.name.indexOf("spdmerlin_usepreferred") == -1){
			if(!o[this.name].push){
				o[this.name] = [o[this.name]];
			}
			o[this.name].push(this.value || '');
		} else if(this.name.indexOf("spdmerlin") != -1 && this.name.indexOf("version") == -1 && this.name.indexOf("spdmerlin_iface_enabled") == -1 && this.name.indexOf("spdmerlin_usepreferred") == -1){
			o[this.name] = this.value || '';
		}
	});
	
	$j.each($j("input[name^='spdmerlin_usepreferred']"), function(){
		o[this.id] = this.checked.toString();
	});
	
	var ifacesenabled = [];
	$j.each($j("input[name='spdmerlin_iface_enabled']:checked"), function(){
		ifacesenabled.push(this.value);
	});
	var ifacesenabledstring = ifacesenabled.join(",");
	o["spdmerlin_ifaces_enabled"] = ifacesenabledstring;
	return o;
};

function SetCurrentPage(){
	document.form.next_page.value = window.location.pathname.substring(1);
	document.form.current_page.value = window.location.pathname.substring(1);
}

function initial(){
	SetCurrentPage();
	LoadCustomSettings();
	show_menu();
	$j("#Time_Format").val(GetCookie("Time_Format","number"));
	ScriptUpdateLayout();
	SetSPDStatsTitle();
	get_interfaces_file();
}

function SetGlobalDataset(txtchartname,dataobject){
	window[txtchartname] = dataobject;
	currentNoCharts++;
	if(currentNoCharts == maxNoCharts){
		var interfacetextarray = interfacelist.split(',');
		for (i = 0; i < interfacetextarray.length; i++){
			Draw_Chart(interfacetextarray[i],"Combined");
			Draw_Chart(interfacetextarray[i],"Quality");
		}
	}
}

function ScriptUpdateLayout(){
	var localver = GetVersionNumber("local");
	var serverver = GetVersionNumber("server");
	$j("#scripttitle").text($j("#scripttitle").text()+" - "+localver);
	$j("#spdmerlin_version_local").text(localver);
	
	if(localver != serverver && serverver != "N/A"){
		$j("#spdmerlin_version_server").text("Updated version available: "+serverver);
		showhide("btnChkUpdate", false);
		showhide("spdmerlin_version_server", true);
		showhide("btnDoUpdate", true);
	}
}

function reload(){
	location.reload(true);
}

function getChartPeriod(period){
	var chartperiod = "daily";
	if(period == 0) chartperiod = "daily";
	else if(period == 1) chartperiod = "weekly";
	else if(period == 2) chartperiod = "monthly";
	return chartperiod;
}

function ResetZoom(){
	var interfacetextarray = interfacelist.split(',');
	for (i = 0; i < interfacetextarray.length; i++){
		for (i2 = 0; i2 < typelist.length; i2++){
			var chartobj = window["LineChart_"+interfacetextarray[i]+"_"+typelist[i2]];
			if(typeof chartobj === 'undefined' || chartobj === null){ continue; }
			chartobj.resetZoom();
		}
	}
}

function ToggleDragZoom(button){
	var drag = true;
	var pan = false;
	var buttonvalue = "";
	if(button.value.indexOf("On") != -1){
		drag = false;
		pan = true;
		DragZoom = false;
		ChartPan = true;
		buttonvalue = "Drag Zoom Off";
	}
	else{
		drag = true;
		pan = false;
		DragZoom = true;
		ChartPan = false;
		buttonvalue = "Drag Zoom On";
	}
	
	var interfacetextarray = interfacelist.split(',');
	for (i = 0; i < interfacetextarray.length; i++){
		for (i2 = 0; i2 < typelist.length; i2++){
			var chartobj = window["LineChart_"+interfacetextarray[i]+"_"+typelist[i2]];
			if(typeof chartobj === 'undefined' || chartobj === null){ continue; }
			chartobj.options.plugins.zoom.zoom.drag = drag;
			chartobj.options.plugins.zoom.pan.enabled = pan;
			chartobj.update();
		}
		button.value = buttonvalue;
	}
}

function ExportCSV(){
	location.href = "/ext/spdmerlin/csv/spdmerlindata.zip";
	return 0;
}

function update_status(){
	$j.ajax({
		url: '/ext/spdmerlin/detect_update.js',
		dataType: 'script',
		timeout: 3000,
		error: function(xhr){
			setTimeout(update_status, 1000);
		},
		success: function(){
			if(updatestatus == "InProgress"){
				setTimeout(update_status, 1000);
			}
			else{
				document.getElementById("imgChkUpdate").style.display = "none";
				showhide("spdmerlin_version_server", true);
				if(updatestatus != "None"){
					$j("#spdmerlin_version_server").text("Updated version available: "+updatestatus);
					showhide("btnChkUpdate", false);
					showhide("btnDoUpdate", true);
				}
				else{
					$j("#spdmerlin_version_server").text("No update available");
					showhide("btnChkUpdate", true);
					showhide("btnDoUpdate", false);
				}
			}
		}
	});
}

function CheckUpdate(){
	showhide("btnChkUpdate", false);
	document.formScriptActions.action_script.value="start_spdmerlincheckupdate"
	document.formScriptActions.submit();
	document.getElementById("imgChkUpdate").style.display = "";
	setTimeout(update_status, 2000);
}

function DoUpdate(){
	var action_script_tmp = "start_spdmerlindoupdate";
	document.form.action_script.value = action_script_tmp;
	var restart_time = 10;
	document.form.action_wait.value = restart_time;
	showLoading();
	document.form.submit();
}

function getAllIndexes(arr, val){
	var indexes = [];
	for(var i = 0; i < arr.length; i++){
		if (arr[i].id == val){
			indexes.push(i);
		}
	}
	return indexes;
}

function get_spdtestservers_file(ifacename){
	$j.ajax({
		url: '/ext/spdmerlin/spdmerlin_serverlist_'+ifacename.toUpperCase()+'.htm?cachebuster='+ new Date().getTime(),
		dataType: 'text',
		timeout: 2000,
		error: function(xhr){
			setTimeout(get_spdtestservers_file, 1000, ifacename);
		},
		success: function(data){
			var servers = [];
			$j.each(data.split('\n').filter(Boolean), function (key, entry){
				var obj = {};
				obj["id"] = entry.split('|')[0];
				obj["name"] = entry.split('|')[1];
				servers.push(obj);
			});
			
			$j("#spdmerlin_preferredserver_"+ifacename).prop("disabled",false);
			$j("#spdmerlin_preferredserver_"+ifacename).removeClass("disabled");
			
			let dropdown = $j("#spdmerlin_preferredserver_"+ifacename);
			dropdown.empty();
			$j.each(servers, function (key, entry){
				dropdown.append($j('<option></option>').attr('value', entry.id+'|'+entry.name).text(entry.id+'|'+entry.name));
			});
			dropdown.prop('selectedIndex', 0);
			
			$j("#spdmerlin_preferredserver_"+ifacename)[0].style.display = "";
			showhide("imgServerList_"+ifacename, false);
		}
	});
}

function get_manualspdtestservers_file(){
	$j.ajax({
		url: '/ext/spdmerlin/spdmerlin_manual_serverlist.htm?cachebuster='+ new Date().getTime(),
		dataType: 'text',
		timeout: 2000,
		error: function(xhr){
			setTimeout(get_manualspdtestservers_file, 2000);
		},
		success: function(data){
			var servers = [];
			$j.each(data.split('\n').filter(Boolean), function (key, entry){
				var obj = {};
				obj["id"] = entry.split('|')[0];
				obj["name"] = entry.split('|')[1];
				servers.push(obj);
			});
			
			if(document.form.spdtest_enabled.value == "All"){
				var arrifaceindex = getAllIndexes(servers,"-----");
				for(var i = 0; i < arrifaceindex.length; i++){
					let dropdown = $j($j("select[name^=spdtest_serverprefselect]")[i]);
					dropdown.empty();
					var arrtmp = [];
					if(i == 0){
						arrtmp = servers.slice(0, arrifaceindex[i]);
					}
					else if(i == arrifaceindex.length-1){
						arrtmp = servers.slice(arrifaceindex[i-1]+1,servers.length-1);
					}
					else{
						arrtmp = servers.slice(arrifaceindex[i-1]+1, arrifaceindex[i]);
					}
					$j.each(arrtmp, function (key, entry){
						dropdown.append($j('<option></option>').attr('value', entry.id+'|'+entry.name).text(entry.id+'|'+entry.name));
					});
					dropdown.prop('selectedIndex', 0);
				}
				
				$j.each($j("select[name^=spdtest_serverprefselect]"), function(){
					this.style.display = "inline-block";
				});
				$j.each($j("span[id^=spdtest_serverprefselectspan]"), function(){
					this.style.display = "inline-block";
				});
				showhide("imgManualServerList",false);
			}
			else{
				let dropdown = $j('select[name=spdtest_serverprefselect]');
				dropdown.empty();
				$j.each(servers, function (key, entry){
					dropdown.append($j('<option></option>').attr('value', entry.id+'|'+entry.name).text(entry.id+'|'+entry.name));
				});
				dropdown.prop('selectedIndex', 0);
				showhide("spdtest_serverprefselect",true);
				showhide("imgManualServerList",false);
			}
			for (var i = 0; i < interfacescomplete.length; i++){
				if(interfacesdisabled.includes(interfacescomplete[i]) == false){
					$j('#spdtest_enabled_'+interfacescomplete[i].toLowerCase()).prop("disabled",false);
					$j('#spdtest_enabled_'+interfacescomplete[i].toLowerCase()).removeClass("disabled");
				}
			}
			$j.each($j("input[name=spdtest_serverpref]"), function(){
				$j(this).prop("disabled",false);
				$j(this).removeClass("disabled");
			});
		}
	});
}

function get_spdtestresult_file(){
	$j.ajax({
		url: '/ext/spdmerlin/spd-result.htm',
		dataType: 'text',
		timeout: 1000,
		error: function(xhr){
			setTimeout(get_spdtestresult_file, 500);
		},
		success: function(data){
			var lines = data.trim().split('\n');
			data = lines.join('\n');
			$j("#spdtest_output").html(data);
		}
	});
}

function get_spdtest_file(){
	$j.ajax({
		url: '/ext/spdmerlin/spd-stats.htm',
		dataType: 'text',
		timeout: 1000,
		error: function(xhr){
			//do nothing
		},
		success: function(data){
			var lines = data.trim().split('\n');
			var arrlastLine = lines.slice(-1)[0].split('%').filter(Boolean);
			
			if(lines.length > 5){
				$j("#spdtest_output").html(lines[0] + '\n' + lines[1] + '\n' + lines[2] + '\n' + lines[3] + '\n' + lines[4] + '\n' + arrlastLine[arrlastLine.length-1] + "%");
			}
			else{
				$j("#spdtest_output").html("");
			}
		}
	});
}

function update_spdtest(){
	$j.ajax({
		url: '/ext/spdmerlin/detect_spdtest.js',
		dataType: 'script',
		timeout: 1000,
		error: function(xhr){
			//do nothing
		},
		success: function(){
			if(spdteststatus.indexOf("InProgress") != -1){
				if(spdteststatus.indexOf("_") != -1){
					showhide("imgSpdTest", true);
					showhide("spdtest_text", true);
					document.getElementById("spdtest_text").innerHTML = "Speedtest in progress for " + spdteststatus.substring(spdteststatus.indexOf("_")+1);
					document.getElementById("spdtest_output").parentElement.parentElement.style.display = "";
					get_spdtest_file();
				}
			}
			else if(spdteststatus == "Done"){
				get_spdtestresult_file();
				document.getElementById("spdtest_text").innerHTML = "Refreshing tables and charts...";
				clearInterval(myinterval);
				PostSpeedTest();
			}
			else if(spdteststatus == "LOCKED"){
				showhide("imgSpdTest", false);
				document.getElementById("spdtest_text").innerHTML = "Scheduled speedtest already running!";
				showhide("spdtest_text", true);
				document.getElementById("spdtest_output").parentElement.parentElement.style.display = "none";
				showhide("btnRunSpeedtest", true);
				clearInterval(myinterval);
			}
			else if(spdteststatus == "NoLicense"){
				showhide("imgSpdTest", false);
				document.getElementById("spdtest_text").innerHTML = "Please accept Ookla license at command line via spdmerlin";
				showhide("spdtest_text", true);
				document.getElementById("spdtest_output").parentElement.parentElement.style.display = "none";
				showhide("btnRunSpeedtest", true);
				clearInterval(myinterval);
			}
			else if(spdteststatus == "Error"){
				showhide("imgSpdTest", false);
				document.getElementById("spdtest_text").innerHTML = "Error running speedtest";
				showhide("spdtest_text", true);
				document.getElementById("spdtest_output").parentElement.parentElement.style.display = "none";
				showhide("btnRunSpeedtest", true);
				clearInterval(myinterval);
			}
			else if(spdteststatus == "NoSwap"){
				showhide("imgSpdTest", false);
				document.getElementById("spdtest_text").innerHTML = "No Swap file configured/detected";
				showhide("spdtest_text", true);
				document.getElementById("spdtest_output").parentElement.parentElement.style.display = "none";
				showhide("btnRunSpeedtest", true);
				clearInterval(myinterval);
			}
		}
	});
}

function PostSpeedTest(){
	$j("#table_allinterfaces").remove();
	$j("#rowautomaticspdtest").remove();
	$j("#rowautospdprefserver").remove();
	$j("#rowautospdprefserverselect").remove();
	$j("#rowmanualspdtest").remove();
	currentNoCharts = 0;
	reload_js('/ext/spdmerlin/spdjs.js');
	reload_js('/ext/spdmerlin/spdtitletext.js');
	$j("#Time_Format").val(GetCookie("Time_Format","number"));
	SetSPDStatsTitle();
	setTimeout(get_interfaces_file, 3000);
}

function RunSpeedtest(){
	showhide("btnRunSpeedtest", false);
	$j("#spdtest_output").html("");
	
	var spdtestservers = "";
	if(document.form.spdtest_serverpref.value == "onetime"){
		if(document.form.spdtest_enabled.value == "All"){
			$j.each($j("select[name^=spdtest_serverprefselect]"), function(){
				spdtestservers += this.value.substring(0,this.value.indexOf('|')) + '+';
			});
			spdtestservers = spdtestservers.slice(0,-1);
		}
		else{
			spdtestservers = document.form.spdtest_serverprefselect.value.substring(0,document.form.spdtest_serverprefselect.value.indexOf('|'));
		}
	}
	document.formScriptActions.action_script.value="start_spdmerlinspdtest_" + document.form.spdtest_serverpref.value + "_" + document.form.spdtest_enabled.value + "_" + spdtestservers.replace(/ /g,'%');
	document.formScriptActions.submit();
	showhide("imgSpdTest", true);
	showhide("spdtest_text", false);
	setTimeout(StartSpeedTestInterval, 1500);
}

var myinterval;
function StartSpeedTestInterval(){
	myinterval = setInterval("update_spdtest();", 500);
}

function reload_js(src){
	$j('script[src="' + src + '"]').remove();
	$j('<script>').attr('src', src+'?cachebuster='+ new Date().getTime()).appendTo('head');
}

function SaveConfig(){
	if(Validate_All()){
		for (var i = 0; i < interfacescomplete.length; i++){
			$j('#spdmerlin_iface_enabled_'+interfacescomplete[i].toLowerCase()).prop("disabled",false);
			$j('#spdmerlin_iface_enabled_'+interfacescomplete[i].toLowerCase()).removeClass("disabled");
			$j('#spdmerlin_usepreferred_'+interfacescomplete[i].toLowerCase()).prop("disabled",false);
			$j('#spdmerlin_usepreferred_'+interfacescomplete[i].toLowerCase()).removeClass("disabled");
			$j('#changepref_'+interfacescomplete[i].toLowerCase()).prop("disabled",false);
			$j('#changepref_'+interfacescomplete[i].toLowerCase()).removeClass("disabled");
		}
		$j('input[name=spdmerlin_testfrequency]').prop("disabled",false);
		$j('input[name=spdmerlin_testfrequency]').removeClass("disabled");
		$j('input[name^=spdmerlin_autobw]').removeClass("disabled");
		$j('input[name^=spdmerlin_autobw]').prop("disabled",false);
		document.getElementById('amng_custom').value = JSON.stringify($j('form').serializeObject());
		var action_script_tmp = "start_spdmerlinconfig";
		document.form.action_script.value = action_script_tmp;
		var restart_time = 5;
		document.form.action_wait.value = restart_time;
		showLoading();
		document.form.submit();
	}
	else{
		return false;
	}
}

function GetVersionNumber(versiontype){
	var versionprop;
	if(versiontype == "local"){
		versionprop = custom_settings.spdmerlin_version_local;
	}
	else if(versiontype == "server"){
		versionprop = custom_settings.spdmerlin_version_server;
	}
	
	if(typeof versionprop == 'undefined' || versionprop == null){
		return "N/A";
	}
	else{
		return versionprop;
	}
}

function get_conf_file(){
	$j.ajax({
		url: '/ext/spdmerlin/config.htm',
		dataType: 'text',
		error: function(xhr){
			setTimeout(get_conf_file, 1000);
		},
		success: function(data){
			var configdata=data.split("\n");
			configdata = configdata.filter(Boolean);
			
			for (var i = 0; i < configdata.length; i++){
				if(configdata[i].indexOf("PREFERRED") == -1){
					eval("document.form.spdmerlin_"+configdata[i].split("=")[0].toLowerCase()).value = configdata[i].split("=")[1].replace(/(\r\n|\n|\r)/gm,"");
				}
				else if(configdata[i].indexOf("USEPREFERRED") != -1){
					if(configdata[i].split("=")[1].replace(/(\r\n|\n|\r)/gm,"") == "true"){
						eval("document.form.spdmerlin_"+configdata[i].split("=")[0].toLowerCase()).checked = true;
					}
				}
				else if(configdata[i].indexOf("PREFERREDSERVER") != -1){
					$j("#span_spdmerlin_"+configdata[i].split("=")[0].toLowerCase()).html(configdata[i].split("=")[0].split("_")[1]+" - "+configdata[i].split("=")[1].replace(/(\r\n|\n|\r)/gm,""));
				}
				
				if(configdata[i].indexOf("AUTOMATED") != -1){
					AutomaticInterfaceEnableDisable($j("#spdmerlin_auto_"+document.form.spdmerlin_automated.value)[0]);
				}
				else if(configdata[i].indexOf("TESTFREQUENCY") != -1){
					Toggle_ScheduleFrequency($j("#spdmerlin_freq_"+document.form.spdmerlin_testfrequency.value)[0]);
				}
				else if(configdata[i].indexOf("AUTOBW") != -1){
					AutoBWEnableDisable($j("#spdmerlin_autobw_"+document.form.spdmerlin_autobw_enabled.value)[0]);
				}
			}
		}
	});
}

function get_interfaces_file(){
	$j.ajax({
		url: '/ext/spdmerlin/interfaces_user.htm',
		dataType: 'text',
		error: function(xhr){
			setTimeout(get_interfaces_file, 1000);
		},
		success: function(data){
			showhide("spdtest_text", false);
			showhide("imgSpdTest", false);
			showhide("btnRunSpeedtest", true);
			var interfaces=data.split("\n");
			interfaces=interfaces.filter(Boolean);
			interfacelist="";
			interfacescomplete = [];
			interfacesdisabled = [];

			var interfacecharttablehtml='<div style="line-height:10px;">&nbsp;</div>';
			interfacecharttablehtml+='<table width="100%" border="1" align="center" cellpadding="4" cellspacing="0" bordercolor="#6b8fa3" class="FormTable" id="table_allinterfaces">';
			interfacecharttablehtml+='<thead class="collapsible-jquery" id="thead_allinterfaces">';
			interfacecharttablehtml+='<tr><td>Interfaces (click to expand/collapse)</td></tr>';
			interfacecharttablehtml+='</thead>';
			interfacecharttablehtml+='<tr><td align="center" style="padding: 0px;">';
			
			var interfaceconfigtablehtml='<tr id="rowautomaticspdtest"><th width="40%">Interfaces to use for automatic speedtests</th><td class="settingvalue">';
			
			var prefserverconfigtablehtml='<tr id="rowautospdprefserver"><th width="40%">Interfaces that use a preferred server</th><td class="settingvalue">';
			
			var prefserverselecttablehtml='<tr id="rowautospdprefserverselect"><th width="40%">Preferred servers for interfaces</th><td class="settingvalue">';
			
			var speedtestifaceconfigtablehtml='<tr id="rowmanualspdtest"><th width="40%">Interfaces to use for manual speedtest</th><td class="settingvalue">';
			speedtestifaceconfigtablehtml+='<input type="radio" name="spdtest_enabled" id="spdtest_enabled_all" onchange="Change_SpdTestInterface(this)" class="input" settingvalueradio" value="All" checked>';
			speedtestifaceconfigtablehtml+='<label for="spdtest_enabled_all" class="settingvalue">All</label>';
			
			var interfacecount=interfaces.length;
			for (var i = 0; i < interfacecount; i++){
				var interfacename = "";
				if(interfaces[i].indexOf("#") != -1){
					interfacename = interfaces[i].substring(0,interfaces[i].indexOf("#")).trim();
					interfacescomplete.push(interfacename);
					var interfacedisabled = "";
					var ifacelabel = interfacename.toUpperCase();
					var changelabel = "Change?";
					if(interfaces[i].indexOf("interface not up") != -1){
						interfacesdisabled.push(interfacename);
						interfacedisabled = "disabled";
						ifacelabel = '<a class="hintstyle" href="javascript:void(0);" onclick="SettingHint(1);">'+interfacename.toUpperCase()+'</a>';
						changelabel = '<a class="hintstyle" href="javascript:void(0);" onclick="SettingHint(1);">Change?</a>';
					}
					interfaceconfigtablehtml+='<input type="checkbox" name="spdmerlin_iface_enabled" id="spdmerlin_iface_enabled_'+ interfacename.toLowerCase() +'" class="input ' + interfacedisabled + ' settingvalue" value="'+interfacename.toUpperCase()+'" ' + interfacedisabled + '>';
					interfaceconfigtablehtml+='<label for="spdmerlin_iface_enabled_'+ interfacename.toLowerCase() +'" class="settingvalue">'+ifacelabel+'</label>';
					
					prefserverconfigtablehtml+='<input type="checkbox" name="spdmerlin_usepreferred_' + interfacename.toLowerCase() + '" id="spdmerlin_usepreferred_'+ interfacename.toLowerCase() +'" class="input ' + interfacedisabled + ' settingvalue" value="'+interfacename.toUpperCase()+'" ' + interfacedisabled + '>';
					prefserverconfigtablehtml+='<label for="spdmerlin_usepreferred_'+ interfacename.toLowerCase() +'" class="settingvalue">'+ifacelabel+'</label>';
					
					prefserverselecttablehtml+='<span style="margin-left:4px;vertical-align:top;max-width:465px;display:inline-block;" id="span_spdmerlin_preferredserver_'+interfacename.toLowerCase()+'">'+interfacename.toUpperCase()+':</span><br />';
					prefserverselecttablehtml+='<input type="checkbox" name="changepref_' + interfacename.toLowerCase() + '" id="changepref_'+ interfacename.toLowerCase() +'" class="input settingvalue ' + interfacedisabled + '" ' + interfacedisabled + ' onchange="Toggle_ChangePrefServer(this)">';
					prefserverselecttablehtml+='<label for="changepref_'+ interfacename.toLowerCase() +'" class="settingvalue">'+changelabel+'</label>';
					prefserverselecttablehtml+='<img id="imgServerList_'+ interfacename.toLowerCase() +'" style="display:none;vertical-align:middle;" src="images/InternetScan.gif"/>';
					prefserverselecttablehtml+='<select class="disabled" name="spdmerlin_preferredserver_'+interfacename.toLowerCase()+'" id="spdmerlin_preferredserver_'+interfacename.toLowerCase()+'" style="min-width:100px;max-width:400px;display:none;vertical-align:top;" disabled></select><br />';
					
					speedtestifaceconfigtablehtml+='<input autocomplete="off" autocapitalize="off" type="radio" name="spdtest_enabled" id="spdtest_enabled_'+ interfacename.toLowerCase() +'" onchange="Change_SpdTestInterface(this)" class="input ' + interfacedisabled + ' settingvalueradio" value="'+interfacename.toUpperCase()+'" ' + interfacedisabled + '>';
					speedtestifaceconfigtablehtml+='<label for="spdtest_enabled_'+ interfacename.toLowerCase() +'" class="settingvalue">'+ifacelabel+'</label>';
				}
				else{
					interfacename = interfaces[i].trim();
					interfacescomplete.push(interfacename);
					
					interfaceconfigtablehtml+='<input type="checkbox" name="spdmerlin_iface_enabled" id="spdmerlin_iface_enabled_'+ interfacename.toLowerCase() +'" class="input settingvalue" value="'+interfacename.toUpperCase()+'" checked>';
					interfaceconfigtablehtml+='<label for="spdmerlin_iface_enabled_'+ interfacename.toLowerCase() +'" class="settingvalue">'+interfacename.toUpperCase()+'</label>';
					
					prefserverconfigtablehtml+='<input type="checkbox" name="spdmerlin_usepreferred_' + interfacename.toLowerCase() + '" id="spdmerlin_usepreferred_'+ interfacename.toLowerCase() +'" class="input settingvalue" value="'+interfacename.toUpperCase()+'" checked>';
					prefserverconfigtablehtml+='<label for="spdmerlin_usepreferred_'+ interfacename.toLowerCase() +'" class="settingvalue">'+interfacename.toUpperCase()+'</label>';
					
					prefserverselecttablehtml+='<span style="margin-left:4px;vertical-align:top;max-width:465px;display:inline-block;" id="span_spdmerlin_preferredserver_'+interfacename.toLowerCase()+'">'+interfacename.toUpperCase()+':</span><br />';
					prefserverselecttablehtml+='<input type="checkbox" name="changepref_' + interfacename.toLowerCase() + '" id="changepref_'+ interfacename.toLowerCase() +'" class="input settingvalue" onchange="Toggle_ChangePrefServer(this)">';
					prefserverselecttablehtml+='<label for="changepref_'+ interfacename.toLowerCase() +'" class="settingvalue">Change?</label>';
					prefserverselecttablehtml+='<img id="imgServerList_'+ interfacename.toLowerCase() +'" style="display:none;vertical-align:middle;" src="images/InternetScan.gif"/>';
					prefserverselecttablehtml+='<select class="disabled" name="spdmerlin_preferredserver_'+interfacename.toLowerCase()+'" id="spdmerlin_preferredserver_'+interfacename.toLowerCase()+'" style="min-width:100px;max-width:400px;display:none;vertical-align:top;" disabled></select><br />';
					
					speedtestifaceconfigtablehtml+='<input type="radio" name="spdtest_enabled" id="spdtest_enabled_'+ interfacename.toLowerCase() +'" onchange="Change_SpdTestInterface(this)" class="input settingvalueradio" value="'+interfacename.toUpperCase()+'">';
					speedtestifaceconfigtablehtml+='<label for="spdtest_enabled_'+ interfacename.toLowerCase() +'" class="settingvalue">'+interfacename.toUpperCase()+'</label>';
				}
				
				interfacecharttablehtml += BuildInterfaceTable(interfacename);
				
				interfacelist+=interfacename+',';
			}
			
			interfacecharttablehtml+='</td></tr></table>';
			
			interfaceconfigtablehtml+='</td></tr>';
			
			prefserverconfigtablehtml+='</td></tr>';
			
			prefserverselecttablehtml+='</td></tr>';
			
			speedtestifaceconfigtablehtml+='</td></tr>';
			
			$j("#rowautomatedtests").after(prefserverselecttablehtml);
			$j("#rowautomatedtests").after(prefserverconfigtablehtml);
			$j("#rowautomatedtests").after(interfaceconfigtablehtml);
			$j("#thead_manualspeedtests").after(speedtestifaceconfigtablehtml);
			
			GenerateManualSpdTestServerPrefSelect();
			document.form.spdtest_serverpref.value = "auto";
			
			if(interfacelist.charAt(interfacelist.length-1) == ","){
				interfacelist = interfacelist.slice(0, -1);
			}
			
			$j("#table_buttons2").after(interfacecharttablehtml);
			maxNoCharts = interfacelist.split(',').length*3*2;
			RedrawAllCharts();
			
			AddEventHandlers();
			get_conf_file();
		}
	});
}

function changeAllCharts(e){
	value = e.value * 1;
	name = e.id.substring(0, e.id.indexOf("_"));
	SetCookie(e.id,value);
	var interfacetextarray = interfacelist.split(',');
	for (i = 0; i < interfacetextarray.length; i++){
		Draw_Chart(interfacetextarray[i],"Combined");
		Draw_Chart(interfacetextarray[i],"Quality");
	}
}

function changeChart(e){
	value = e.value * 1;
	name = e.id.substring(0, e.id.indexOf("_"));
	SetCookie(e.id,value);
	if(e.id.indexOf("Combined") != -1){
		Draw_Chart(name,"Combined");
	}
	else if(e.id.indexOf("Quality") != -1){
		Draw_Chart(name,"Quality");
	}
}

function SettingHint(hintid){
	var tag_name = document.getElementsByTagName('a');
	for (var i=0;i<tag_name.length;i++){
		tag_name[i].onmouseout=nd;
	}
	hinttext="My text goes here";
	if(hintid == 1) hinttext="Interface not enabled";
	return overlib(hinttext, CENTER);
}

function BuildInterfaceTable(name){
	var charthtml = '<div style="line-height:10px;">&nbsp;</div>';
	charthtml+='<table width="100%" border="1" align="center" cellpadding="4" cellspacing="0" bordercolor="#6b8fa3" class="FormTable" id="table_interfaces_'+name+'">';
	charthtml+='<thead class="collapsible-jquery" id="'+name+'">';
	charthtml+='<tr>';
	charthtml+='<td colspan="2">'+name+' (click to expand/collapse)</td>';
	charthtml+='</tr>';
	charthtml+='</thead>';
	charthtml+='<tr>';
	charthtml+='<td colspan="2" align="center" style="padding: 0px;">';
	charthtml+='<table width="100%" border="1" align="center" cellpadding="4" cellspacing="0" bordercolor="#6b8fa3" class="FormTable">';
	charthtml+='<thead class="collapsible-jquery" id="resulttable_'+name+'">';
	charthtml+='<tr><td colspan="2">Last 10 speedtest results (click to expand/collapse)</td></tr>';
	charthtml+='</thead>';
	charthtml+='<tr>';
	charthtml+='<td colspan="2" align="center" style="padding: 0px;">';
	charthtml+='<table width="100%" border="1" align="center" cellpadding="4" cellspacing="0" bordercolor="#6b8fa3" class="FormTable StatsTable">';
	var nodata="";
	var objdataname = window["DataTimestamp_"+name];
	if(typeof objdataname === 'undefined' || objdataname === null){nodata="true"}
	else if(objdataname.length == 0){nodata="true"}
	else if(objdataname.length == 1 && objdataname[0] == ""){nodata="true"}
	
	if(nodata == "true"){
		charthtml+='<tr>';
		charthtml+='<td colspan="6" class="nodata">';
		charthtml+='No data to display';
		charthtml+='</td>';
		charthtml+='</tr>';
	}
	else{
		charthtml+='<col style="width:120px;">';
		charthtml+='<col style="width:75px;">';
		charthtml+='<col style="width:65px;">';
		charthtml+='<col style="width:65px;">';
		charthtml+='<col style="width:65px;">';
		charthtml+='<col style="width:65px;">';
		charthtml+='<col style="width:80px;">';
		charthtml+='<col style="width:80px;">';
		charthtml+='<col style="width:135px;">';
		charthtml+='<thead>';
		charthtml+='<tr>';
		charthtml+='<th class="keystatsnumber">Time</th>';
		charthtml+='<th class="keystatsnumber">Download<br />(Mbps)</th>';
		charthtml+='<th class="keystatsnumber">Upload<br />(Mbps)</th>';
		charthtml+='<th class="keystatsnumber">Latency<br />(ms)</th>';
		charthtml+='<th class="keystatsnumber">Jitter<br />(ms)</th>';
		charthtml+='<th class="keystatsnumber">Packet<br />Loss (%)</th>';
		charthtml+='<th class="keystatsnumber">Download<br />Data (MB)</th>';
		charthtml+='<th class="keystatsnumber">Upload<br />Data (MB)</th>';
		charthtml+='<th class="keystatsnumber">Result URL</th>';
		charthtml+='</tr>';
		charthtml+='</thead>';
		
		for(i = 0; i < objdataname.length; i++){
			charthtml+='<tr>';
			charthtml+='<td>'+moment.unix(window["DataTimestamp_"+name][i]).format('YYYY-MM-DD HH:mm:ss')+'</td>';
			charthtml+='<td>'+window["DataDownload_"+name][i]+'</td>';
			charthtml+='<td>'+window["DataUpload_"+name][i]+'</td>';
			charthtml+='<td>'+window["DataLatency_"+name][i]+'</td>';
			charthtml+='<td>'+window["DataJitter_"+name][i]+'</td>';
			charthtml+='<td>'+window["DataPktLoss_"+name][i].replace("null","N/A")+'</td>';
			charthtml+='<td>'+window["DataDataDownload_"+name][i]+'</td>';
			charthtml+='<td>'+window["DataDataUpload_"+name][i]+'</td>';
			if(window["DataResultURL_"+name][i] != ""){
				charthtml+='<td><a href="'+window["DataResultURL_"+name][i]+'" target="_blank">Speedtest result URL</a></td>';
			}
			else{
				charthtml+='<td>No result URL</td>';
			}
			charthtml+='</tr>';
		};
	}
	charthtml+='</table>';
	charthtml+='</td>';
	charthtml+='</tr>';
	charthtml+='</table>';
	charthtml+='<div style="line-height:10px;">&nbsp;</div>';
	charthtml+='<table width="100%" border="1" align="center" cellpadding="4" cellspacing="0" bordercolor="#6b8fa3" class="FormTable">';
	charthtml+='<thead class="collapsible-jquery" id="table_charts">';
	charthtml+='<tr>';
	charthtml+='<td>Tables and Charts (click to expand/collapse)</td>';
	charthtml+='</tr>';
	charthtml+='</thead>';
	charthtml+='<tr><td align="center" style="padding: 0px;">';
	charthtml+='<table width="100%" border="1" align="center" cellpadding="4" cellspacing="0" bordercolor="#6b8fa3" class="FormTable">';
	charthtml+='<thead class="collapsible-jquery" id="'+name+'_ChartCombined">';
	charthtml+='<tr>';
	charthtml+='<td colspan="2">Bandwidth (click to expand/collapse)</td>';
	charthtml+='</tr>';
	charthtml+='</thead>';
	charthtml+='<tr class="even">';
	charthtml+='<th width="40%">Period to display</th>';
	charthtml+='<td>';
	charthtml+='<select style="width:125px" class="input_option" onchange="changeChart(this)" id="' + name + '_Period_Combined">';
	charthtml+='<option value=0>Last 24 hours</option>';
	charthtml+='<option value=1>Last 7 days</option>';
	charthtml+='<option value=2>Last 30 days</option>';
	charthtml+='</select>';
	charthtml+='</td>';
	charthtml+='</tr>';
	charthtml+='<tr>';
	charthtml+='<td colspan="2" align="center" style="padding: 0px;">';
	charthtml+='<div style="background-color:#2f3e44;border-radius:10px;width:730px;height:500px;padding-left:5px;"><canvas id="divLineChart_'+name+'_Combined" height="500" /></div>';
	charthtml+='</td>';
	charthtml+='</tr>';
	charthtml+='</table>';
	charthtml+='<div style="line-height:10px;">&nbsp;</div>';
	charthtml+='<table width="100%" border="1" align="center" cellpadding="4" cellspacing="0" bordercolor="#6b8fa3" class="FormTable">';
	charthtml+='<thead class="collapsible-jquery" id="'+name+'_ChartQuality">';
	charthtml+='<tr>';
	charthtml+='<td colspan="2">Quality (click to expand/collapse)</td>';
	charthtml+='</tr>';
	charthtml+='</thead>';
	charthtml+='<tr class="even">';
	charthtml+='<th width="40%">Period to display</th>';
	charthtml+='<td>';
	charthtml+='<select style="width:125px" class="input_option" onchange="changeChart(this)" id="' + name + '_Period_Quality">';
	charthtml+='<option value=0>Last 24 hours</option>';
	charthtml+='<option value=1>Last 7 days</option>';
	charthtml+='<option value=2>Last 30 days</option>';
	charthtml+='</select>';
	charthtml+='</td>';
	charthtml+='</tr>';
	charthtml+='<tr>';
	charthtml+='<td colspan="2" align="center" style="padding: 0px;">';
	charthtml+='<div style="background-color:#2f3e44;border-radius:10px;width:730px;height:500px;padding-left:5px;"><canvas id="divLineChart_'+name+'_Quality" height="500" /></div>';
	charthtml+='</td>';
	charthtml+='</tr>';
	charthtml+='</table>';
	charthtml+='</td>';
	charthtml+='</tr>';
	charthtml+='</table>';
	charthtml+='</td>';
	charthtml+='</tr>';
	charthtml+='</table>';
	return charthtml;
}

function AutomaticInterfaceEnableDisable(forminput){
	var inputname = forminput.name;
	var inputvalue = forminput.value;
	var prefix = inputname.substring(0,inputname.lastIndexOf('_'));
	
	if(inputvalue == "false"){
		for (var i = 0; i < interfacescomplete.length; i++){
			$j('#'+prefix+'_iface_enabled_'+interfacescomplete[i].toLowerCase()).prop("disabled",true);
			$j('#'+prefix+'_iface_enabled_'+interfacescomplete[i].toLowerCase()).addClass("disabled");
			$j('#'+prefix+'_usepreferred_'+interfacescomplete[i].toLowerCase()).prop("disabled",true);
			$j('#'+prefix+'_usepreferred_'+interfacescomplete[i].toLowerCase()).addClass("disabled");
			$j('#changepref_'+interfacescomplete[i].toLowerCase()).prop("disabled",true);
			$j('#changepref_'+interfacescomplete[i].toLowerCase()).addClass("disabled");
		}
		$j('input[name='+prefix+'_testfrequency]').prop("disabled",true);
		$j('input[name='+prefix+'_testfrequency]').addClass("disabled");
	}
	else if(inputvalue == "true"){
		for (var i = 0; i < interfacescomplete.length; i++){
			if(interfacesdisabled.includes(interfacescomplete[i]) == false){
				$j('#'+prefix+'_iface_enabled_'+interfacescomplete[i].toLowerCase()).prop("disabled",false);
				$j('#'+prefix+'_iface_enabled_'+interfacescomplete[i].toLowerCase()).removeClass("disabled");
				$j('#'+prefix+'_usepreferred_'+interfacescomplete[i].toLowerCase()).prop("disabled",false);
				$j('#'+prefix+'_usepreferred_'+interfacescomplete[i].toLowerCase()).removeClass("disabled");
				$j('#changepref_'+interfacescomplete[i].toLowerCase()).prop("disabled",false);
				$j('#changepref_'+interfacescomplete[i].toLowerCase()).removeClass("disabled");
			}
		}
		$j('input[name='+prefix+'_testfrequency]').prop("disabled",false);
		$j('input[name='+prefix+'_testfrequency]').removeClass("disabled");
	}
}

function AutoBWEnableDisable(forminput){
	var inputname = forminput.name;
	var inputvalue = forminput.value;
	var prefix = inputname.substring(0,inputname.indexOf('_'));
	
	if(inputvalue == "false"){
		$j('input[name^='+prefix+'_autobw_ulimit]').addClass("disabled");
		$j('input[name^='+prefix+'_autobw_ulimit]').prop("disabled",true);
		$j('input[name^='+prefix+'_autobw_llimit]').addClass("disabled");
		$j('input[name^='+prefix+'_autobw_llimit]').prop("disabled",true);
		$j('input[name^='+prefix+'_autobw_sf]').addClass("disabled");
		$j('input[name^='+prefix+'_autobw_sf]').prop("disabled",true);
		$j('input[name^='+prefix+'_autobw_threshold]').addClass("disabled");
		$j('input[name^='+prefix+'_autobw_threshold]').prop("disabled",true);
	}
	else if(inputvalue == "true"){
		$j('input[name^='+prefix+'_autobw_ulimit]').removeClass("disabled");
		$j('input[name^='+prefix+'_autobw_ulimit]').prop("disabled",false);
		$j('input[name^='+prefix+'_autobw_llimit]').removeClass("disabled");
		$j('input[name^='+prefix+'_autobw_llimit]').prop("disabled",false);
		$j('input[name^='+prefix+'_autobw_sf]').removeClass("disabled");
		$j('input[name^='+prefix+'_autobw_sf]').prop("disabled",false);
		$j('input[name^='+prefix+'_autobw_threshold]').removeClass("disabled");
		$j('input[name^='+prefix+'_autobw_threshold]').prop("disabled",false);
	}
}

function Toggle_ChangePrefServer(forminput){
	var inputname = forminput.name;
	var inputvalue = forminput.checked;
	
	var ifacename = inputname.split("_")[1];
	
	if(inputvalue == true){
		document.formScriptActions.action_script.value="start_spdmerlinserverlist_"+ifacename;
		document.formScriptActions.submit();
		showhide("imgServerList_"+ifacename, true);
		setTimeout(get_spdtestservers_file, 2000, ifacename);
	}
	else{
		$j("#spdmerlin_preferredserver_"+ifacename)[0].style.display = "none";
		$j("#spdmerlin_preferredserver_"+ifacename).prop("disabled",true);
		$j("#spdmerlin_preferredserver_"+ifacename).addClass("disabled");
	}
}

function Toggle_ScheduleFrequency(forminput){
	var inputname = forminput.name;
	var inputvalue = forminput.value;
	
	Calculate_SecondMinute();
	
	if(inputvalue == "halfhourly"){
		document.form.second_minute.style.display = "";
		$j("#span_second_minute")[0].style.display = "";
	}
	else{
		document.form.second_minute.style.display = "none";
		$j("#span_second_minute")[0].style.display = "none";
	}
}

function Change_SpdTestInterface(forminput){
	var inputname = forminput.name;
	var inputvalue = forminput.value;
	
	GenerateManualSpdTestServerPrefSelect();
	Toggle_SpdTestServerPref(document.form.spdtest_serverpref);
}

function Toggle_SpdTestServerPref(forminput){
	var inputname = forminput.name;
	var inputvalue = forminput.value;
	
	if(inputvalue == "onetime"){
		document.formScriptActions.action_script.value="start_spdmerlinserverlistmanual_" + document.form.spdtest_enabled.value;
		document.formScriptActions.submit();
		for (var i = 0; i < interfacescomplete.length; i++){
			$j('#spdtest_enabled_'+interfacescomplete[i].toLowerCase()).prop("disabled",true);
			$j('#spdtest_enabled_'+interfacescomplete[i].toLowerCase()).addClass("disabled");
		}
		$j.each($j("input[name=spdtest_serverpref]"), function(){
			$j(this).prop("disabled",true);
			$j(this).addClass("disabled");
		});
		showhide("rowmanualserverprefselect", true);
		showhide("imgManualServerList", true);
		
		if(document.form.spdtest_enabled.value == "All"){
			$j.each($j("select[name^=spdtest_serverprefselect]"), function(){
				$j(this).empty();
			});
		}
		else{
			$j('select[name=spdtest_serverprefselect]').empty();
		}
		setTimeout(get_manualspdtestservers_file, 2000);
	}
	else{
		showhide("rowmanualserverprefselect", false);
		if(document.form.spdtest_enabled.value == "All"){
			$j.each($j("select[name^=spdtest_serverprefselect]"), function(){
				showhide(this.id,false);
			});
			$j.each($j("span[id^=spdtest_serverprefselectspan]"), function(){
				showhide(this.id,false);
			});
		}
		else{
			showhide("spdtest_serverprefselect",false);
		}
		showhide("imgManualServerList", false);
	}
}

function GenerateManualSpdTestServerPrefSelect(){
	$j("#rowmanualserverprefselect").remove();
	var serverprefhtml = '<tr class="even" id="rowmanualserverprefselect" style="display:none;">';
	serverprefhtml += '<th width="40%">Choose a server</th><td class="settingvalue"><img id="imgManualServerList" style="display:none;vertical-align:middle;" src="images/InternetScan.gif"/>';
	
	if(document.form.spdtest_enabled.value == "All"){
		for (var i = 0; i < interfacescomplete.length; i++){
			if(interfacesdisabled.includes(interfacescomplete[i]) == false){
				var interfacename = interfacescomplete[i].toLowerCase();
				serverprefhtml += '<span style="width:50px;display:none;" id="spdtest_serverprefselectspan_'+interfacename+'">'+interfacescomplete[i]+':</span><select name="spdtest_serverprefselect_'+interfacename+'" id="spdtest_serverprefselect_'+interfacename+'" style="display:none;max-width:415px;"></select><br />';
			}
		}
	}
	else{
		serverprefhtml += '<select name="spdtest_serverprefselect" id="spdtest_serverprefselect" style="display:none;"></select>';
	}
	
	serverprefhtml += '</td></tr>';
	$j("#rowmanualserverpref").after(serverprefhtml);
}

function Validate_All(){
	var validationfailed = false;
	if(! Validate_ScheduleRange(document.form.spdmerlin_schedulestart)) validationfailed=true;
	if(! Validate_ScheduleRange(document.form.spdmerlin_scheduleend)) validationfailed=true;
	if(! Validate_ScheduleMinute(document.form.spdmerlin_minute)) validationfailed=true;
	
	if(! Validate_PercentRange(document.form.spdmerlin_autobw_sf_down)) validationfailed=true;
	if(! Validate_PercentRange(document.form.spdmerlin_autobw_sf_up)) validationfailed=true;
	if(! Validate_PercentRange(document.form.spdmerlin_autobw_threshold_down)) validationfailed=true;
	if(! Validate_PercentRange(document.form.spdmerlin_autobw_threshold_up)) validationfailed=true;
	
	if(validationfailed){
		alert("Validation for some fields failed. Please correct invalid values and try again.");
		return false;
	}
	else{
		return true;
	}
}

function Validate_PercentRange(forminput){
	var inputname = forminput.name;
	var inputvalue = forminput.value*1;
	
	if(inputvalue > 100 || inputvalue < 0 || forminput.value.length < 1){
		$j(forminput).addClass("invalid");
		return false;
	}
	else{
		$j(forminput).removeClass("invalid");
		return true;
	}
}

function Validate_ScheduleRange(forminput){
	var inputname = forminput.name;
	var inputvalue = forminput.value*1;
	
	if(inputvalue > 23 || inputvalue < 0 || forminput.value.length < 1){
		$j(forminput).addClass("invalid");
		return false;
	}
	else{
		$j(forminput).removeClass("invalid");
		return true;
	}
}

function Validate_ScheduleMinute(forminput){
	var inputname = forminput.name;
	var inputvalue = forminput.value*1;
	
	if(inputvalue > 59 || inputvalue < 0 || forminput.value.length < 1){
		document.form.second_minute.value = "";
		$j(forminput).addClass("invalid");
		return false;
	}
	else{
		Calculate_SecondMinute();
		$j(forminput).removeClass("invalid");
		return true;
	}
}

function Calculate_SecondMinute(){
	if (document.form.spdmerlin_testfrequency.value == "halfhourly"){
		document.form.second_minute.value= document.form.spdmerlin_minute.value*1 + 30;
		if(document.form.second_minute.value > 59){
			document.form.second_minute.value = document.form.second_minute.value*1 - 60;
		}
	}
}

function AddEventHandlers(){
	$j(".collapsible-jquery").click(function(){
		$j(this).siblings().toggle("fast",function(){
			if($j(this).css("display") == "none"){
				SetCookie($j(this).siblings()[0].id,"collapsed");
			}
			else{
				SetCookie($j(this).siblings()[0].id,"expanded");
			}
		})
	});
	
	$j(".collapsible-jquery").each(function(index,element){
		if(GetCookie($j(this)[0].id,"string") == "collapsed"){
			$j(this).siblings().toggle(false);
		}
		else{
			$j(this).siblings().toggle(true);
		}
	});
}

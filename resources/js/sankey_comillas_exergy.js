
		
$( document ).ready(function() { // Initialization Code
		
            //Initializing Global Variables
			var currentYear = 2013,
                initialYear = 2007,
                finalYear = 2013,
				initialSankeyWidth = $(window).width() - 70,
				initialSankeyHeight = $(window).height() - $("#top").height() - $("#footer").height() - 100 -30,
				sankeyWidth = initialSankeyWidth,
				sankeyHeight = initialSankeyHeight,
				SankeyNodeWidth = 20,
				SankeyNodePadding = 15,
				SankeyLayoutIteractions = 32,
				SankeyLayoutIteractionsOnUpdate = 1,
				barChartWidth = 400,
				barChartHeight = 200,
				pieChartRadius = 75,
				pieChartArcTweenDuration = 2000;
				pieChartTextTweenDuration = 1000,
				pieChartTextOffset = 14,
				pieChartMargin = 60,
				transitionDurations = 1000,
				mouseOverDelay = 1000;
			
			var svg = null,
				sankey = null,
				path = null,
				link = null,
				node = null;
				sankeyRedraw = null,
				showEnergySource = false,
				barChartTopLeftx = null,
				barChartTopLefty = null;
				
			


		    	function visitPage(){
        		window.location='http://www.example.com';
    			}
			
			// Year buttons code
			$.each([ 2007, 2008, 2009, 2010, 2011, 2012, 2013 ], function( index, value ) {
				$("#Button"+value).mouseover(function( event ) {
					$(".selected").removeClass("selected");
					$("#Button"+value).addClass("selected");
					currentYear = value;
					if (sankeyRedraw==1) {
						createSankey(sankeyData);
						sankeyRedraw = 0;
					} else	{					
						updateSankey(json,currentYear);
					}
				});
			});
			
			// Checkbox Show Energy Source Colors on Sankey
			$('#checkbox :checkbox').click(function() {
				var $this = $(this);
				if ($this.is(':checked')) {
					showEnergySource = true;
					sankeyData = sankeyEnergySourcesData;
					createSankey(sankeyData);
				} else {
					showEnergySource = false;
					sankeyData = data;
					createSankey(sankeyData);
				}
			});
			
			var zoomSlider = document.getElementById("sliderBar");
				zoomSlider.addEventListener("change",function(ev){  
					var zoom = ev.currentTarget.value;
					document.getElementById("zoomValue").innerHTML = zoom + "%";  
					sankeyWidth = zoom / 100 * initialSankeyWidth;
					sankeyHeight = zoom / 100 * initialSankeyHeight;				
					$("#chart").width(function(){return sankeyWidth;});
					$("#chart").height(function(){return sankeyHeight;});
					d3.select("svg")
						.attr("width", sankeyWidth)
						.attr("height", sankeyHeight);
					updateSankey(json,currentYear);
				},true);
		
			//Loading Sankey Data
            
			var dataTemp = $.ajax({
				type: 'GET',
				url: 'data/Data_exergy24_2013.json',
				dataType: 'json',
				success: function() { },
				data: {},
				async: false
			});
            console.log(dataTemp);
			
            var data = dataTemp.responseJSON
			console.log(data);
			var sankeyEnergySourcesData = {};
			CreateSankeyEnergyExtraLinks(sankeyEnergySourcesData,data);
			
			var formatNumber = d3.format(",.0f"), format = function(d) { return formatNumber(d) ; }, color = d3.scale.category20();
			
			//Creating Sankey
			sankeyData = data;
			createSankey(sankeyData);
			
			// FUNCTIONS CODE //
			
			// Create Sankey Function
			function createSankey(data) {
				
				d3.select("svg").remove();
						
				svg = d3.select(".chart")
					.append("svg")
					.attr("width", sankeyWidth)
					.attr("height", sankeyHeight+30);
				
				json = new Object();
				json.nodes = data.nodes;
				json.links = data.links;
				computeNodeSizesForAllYears();
				ChangeActiveSankeyYear(json,currentYear);

				sankey = d3.sankey()
					.size([sankeyWidth, sankeyHeight])
					.nodeWidth(SankeyNodeWidth)
					.nodePadding(SankeyNodePadding)
					.nodes(json.nodes)
					.links(json.links)
					.layout(SankeyLayoutIteractions);

				path = sankey.link();				
				
				var timer;
				 
				//Initialize link variable and draw paths
				link = svg.append("g")
					.selectAll(".link")
					.data(json.links)
					.enter()
					.append("path")
					.attr("class", "link")
					.attr("stroke-opacity","0.2")
					.attr("stroke", function (d) { return d.color; })
					.attr("d", path)
					.style("stroke-width", function(d) { return Math.max(1, d.dy); })
					.on("mouseover",
						function(d){					  
							d3.select(this).attr("stroke-opacity", ".5")
								.each(function(d) { 
								if(showEnergySource==false)	{
									try { 
									if(typeof d.EnergySources[0].value=="undefined"){
										return; 
										} else {
											d3.select(this).selectAll("title").remove();	
											pieData = d.EnergySources; 
											centerX = d3.mouse(this)[0];
											centerY = d3.mouse(this)[1];
											timer = setTimeout( function(){	
												createPieChart(d,pieData); 
												d3.selectAll(".node").selectAll("text").style("opacity", ".5");
												d3.selectAll(".node").selectAll("rect").style("opacity", ".5");
											}, mouseOverDelay );
										}
									} catch (e) {} 
								}
                                });
                                d3.select(this).select("title").remove();
                                if(typeof d.energySource=="undefined"){
                                    d3.select(this).append("title").text(d.source.name + " products demanded by " + d.target.name + "\n" + d.yearlyValue[currentYear-initialYear].toFixed(3) + " EJ"); 
                                } else {
                                    d3.select(this).append("title").text(d.source.name + "  products demanded by " + d.target.name + "\n" + "Primary Energy: " + d.energySource + "\n" + d.yearlyValue[currentYear-initialYear].toFixed(3) + " EJ"); 
                                  }
                                 
							}
						)
					.on("mouseout", function() {
						clearTimeout(timer);
						d3.selectAll("#pieChart").remove();	
						d3.selectAll(".link").attr("stroke-opacity", ".2");
						d3.selectAll(".node").selectAll("text").style("opacity", "1");
						d3.selectAll(".node").selectAll("rect").style("opacity", "1");
						}
					);
				
                //Initialize node variable
				node = svg.append("g")
					.selectAll(".node")
					.data(json.nodes)
					.enter()
					.append("g")
					.attr("class", "node")
					.attr("transform",  function(d) { return "translate(" + d.x + "," + d.y + ")";  }  )
					.call(d3.behavior.drag()
						  .origin(function(d) { return d; } )
						  .on("dragstart", function() { this.parentNode.appendChild(this); } )
						  .on("drag", 
							 function(d){d3.select(this)
								.attr("transform", "translate(" + d.x + "," + (d.y = Math.max(0, Math.min(sankeyHeight - d.dy, d3.event.y))) + ")");
								sankey.relayout();
								link.attr("d", path);
								sankeyRedraw = 1;								
								} 
							)
						)
					.on("mouseover",
						function(d){
							d3.select(this).each(function(d) { console.log(d); barData = [];	for (var i=0;i<(finalYear-initialYear+1);i++) { var element = { label: i+initialYear  , value: d.Size[i]}; barData.push(element); }});
							var selectedNode = this;
//								selectedNode.sourceLinks = [];
//								selectedNode.targetLinks = [];
//								links.forEach(function(link) {
//										var source = link.source,
//											target = link.target;
//										if (typeof source === "number") source = link.source = json.nodes[link.source];
//										if (typeof target === "number") target = link.target = json.nodes[link.target];
//										source.sourceLinks.push(link);
//										target.targetLinks.push(link);
//									});
							timer = setTimeout( function(){
								d3.selectAll(".node").selectAll("text").style("opacity", ".5");
								d3.selectAll(".node").selectAll("rect").style("opacity", ".5");
								d3.select(selectedNode).selectAll("text").style("opacity", "1");
								d3.select(selectedNode).selectAll("rect").style("opacity", "1");
//								d3.select(selectedNode.sourceLinks).attr("stroke-opacity", "1");
								createBarChart(d,barData);	
								d3.select(selectedNode).selectAll("text")
								.attr("text-anchor", "start")
								.transition()
								.duration(transitionDurations)
								.attr("x", function() { return barChartTopLeftx - d.x;})
								.attr("y", function() { return barChartTopLefty - d.y - 20; } );
							
							}, mouseOverDelay );
						}
						)
					.on("mouseout", function() {
						clearTimeout(timer);
						d3.selectAll(".node").selectAll("text").style("opacity", "1");
						d3.selectAll(".node").selectAll("rect").style("opacity", "1");
						d3.selectAll("#barChart").remove();
						d3.select(this).selectAll("text")
						.transition()
						.duration(transitionDurations)
						.attr("x", -6)
						.attr("y", function(d) { return d.dy / 2; } )
						.attr("dy", ".35em")
						.attr("text-anchor", "end")
						.filter(function(d) { return d.x < sankeyWidth / 2; } )
						.attr("x", 6 + sankey.nodeWidth())
						.attr("text-anchor", "start");
					}) ;	
							
				//node rectangle
				node.append("rect")
					.attr("height", function(d) { return d.dy; } )
					.attr("width", sankey.nodeWidth())
					.style("fill", function (d) { return d.color; } )
					.style("stroke", function(d) { return d3.rgb(d.color).darker(2); } );
					
				// node title
				node.append("text")
					.attr("x", -6)
					.attr("y", function(d) { return d.dy / 2; } )
					.attr("dy", ".35em")
					.attr("text-anchor", "end")
					.attr("transform", null)
					.text(function(d) { return d.name; } )
					.filter(function(d) { return d.x < sankeyWidth / 2; } )
					.attr("x", 6 + sankey.nodeWidth())
					.attr("text-anchor", "start");
					
				updateSankey(json,currentYear); // makes a small animation at start and assures that the links will not move while changing years 
				
			}; // End of create Sankey Function

			// Change "value" property on obj.links for referring to the active year
			function ChangeActiveSankeyYear(obj,year) {			
				for (var property in obj.links) {
					if (obj.links.hasOwnProperty(property)) {
						propertyRoot = property;
						obj.links[propertyRoot].value = obj.links[propertyRoot].yearlyValue[year-initialYear];
						for (var property in obj.links[propertyRoot].EnergySources) {
							obj.links[propertyRoot].EnergySources[property].value = obj.links[propertyRoot].EnergySources[property].yearlyValue[year-initialYear];
						}
					}
				}	
			};
			
			// Compute node sizes for all years for use in bar graphs
			function computeNodeSizesForAllYears() {
				json.nodes.forEach(function(node) {
					node.Size = [];
				});             
				for (var count=0;count<(finalYear-initialYear+1);count++) { 
					ChangeActiveSankeyYear(json,count+initialYear);
					json.nodes.forEach(function(node) {
						node.sourceLinks = [];
						node.targetLinks = [];
					});	
					json.links.forEach(function(link) {
						var source = link.source,
							target = link.target;
						if (typeof source === "number") source = link.source = json.nodes[link.source];
						if (typeof target === "number") target = link.target = json.nodes[link.target];
						source.sourceLinks.push(link);
						target.targetLinks.push(link);
					});
					json.nodes.forEach(function(node) {
						node.Size.push( Math.max(d3.sum(node.sourceLinks,valueX), d3.sum(node.targetLinks,valueX)) );
					});
				};
				function valueX(link) {
					return link.value;
				}
			};
			
			// Update Sankey Function
			function updateSankey(json,year) {
				
				ChangeActiveSankeyYear(json,year);
					
				sankey = d3.sankey()
					.size([sankeyWidth, sankeyHeight])
					.nodeWidth(SankeyNodeWidth)
					.nodePadding(SankeyNodePadding)
					.nodes(json.nodes)
					.links(json.links)
					.layout(SankeyLayoutIteractionsOnUpdate);
			
				svg.selectAll(".link")
					.data(json.links)
					.transition()
					.duration(transitionDurations)
					.attr("class", "link")
					.attr("stroke", function (d) { return d.color; })
					.attr("d", path)
					.style("stroke-width", function(d) { return Math.max(1, d.dy); });

				
				svg.selectAll(".node")
					.data(json.nodes)
					.transition()
					.duration(transitionDurations)
					.attr("transform",  function(d) { return "translate(" + d.x + "," + d.y + ")";  }  );

				node.selectAll("rect")
					.transition()
					.duration(transitionDurations)
					.attr("height", function(d) { return d.dy; } )
					.attr("width", sankey.nodeWidth())
					.style("fill", function (d) { return d.color; } )
					.style("stroke", function(d) { return d3.rgb(d.color).darker(2); } );
					
				node.selectAll("text")
					.transition()
					.duration(transitionDurations)
					.attr("x", -6)
					.attr("y", function(d) { return d.dy / 2; } )
					.attr("dy", ".35em")
					.attr("text-anchor", "end")
					.attr("transform", null)
					.text(function(d) { return d.name; } )
					.filter(function(d) { return d.x < sankeyWidth / 2; } )
					.attr("x", 6 + sankey.nodeWidth())
					.attr("text-anchor", "start");
					
			};	//End of Update Sankey Function
			
			// Function to create Link Pie Chart
			function createPieChart(linkData,pieData) {
			
			
				//timer = setTimeout( function(){
						

				totalLinkValue = linkData.value;
				
				if (centerX - pieChartRadius - pieChartMargin < 0)
					centerX = pieChartRadius + pieChartMargin;
				else if (centerX + pieChartRadius + pieChartMargin > sankeyWidth) 
					centerX = sankeyWidth - pieChartRadius - pieChartMargin
					
				if (centerY + pieChartRadius + pieChartMargin > sankeyHeight)
					centerY = sankeyHeight - pieChartRadius - pieChartMargin;	
				else if (centerY - pieChartRadius - pieChartMargin - 60 < 0)
					centerY = pieChartRadius + pieChartMargin + 60;
							
				var arc = d3.svg.arc()
					.outerRadius(pieChartRadius);

				var pie = d3.layout.pie()
					//.sort(null)
					.value(function(d) { return d.value; });

				pieData.sort(function(a, b) {return b.value - a.value;});

				var arcs = svg.selectAll("g.arc")
					.data(pie(pieData))
					.enter().append("g")
					.attr("class", "arc")
					.attr("id", "pieChart");
					
				arcs.append("path")
					.attr("fill", function(d) { return d.data.color; })
					.attr("transform", "translate(" + centerX + "," + centerY + ")")
					.transition()
					.ease("bounce")
					.duration(pieChartArcTweenDuration)
					.attrTween("d", tweenPie)
					.transition()
					.ease("elastic")
					.delay(function(d, i) { return pieChartArcTweenDuration + i * 50; })
					.duration(750)
					.attrTween("d", tweenDonut);
					
					
				function tweenPie(b) {
                  b.innerRadius = 0;
                  var i = d3.interpolate({startAngle: 0, endAngle: 0}, b);
				  return function(t) { return arc(i(t)); };
				}

				function tweenDonut(b) {
				  b.innerRadius = pieChartRadius * .6;
				  var i = d3.interpolate({innerRadius: 0}, b);
				  return function(t) { return arc(i(t)); };
				}
				
				
				//Center text 
				var center_text = svg.append("g")
					.attr("id", "pieChart")
					.attr("transform", "translate(" + centerX + "," + centerY + ")");
  
				var totalLabel = center_text.append("text")
					.transition()
					.delay(function() { return pieChartArcTweenDuration + 500;})
					.attr("dy", -15)
					.attr("text-anchor", "middle") 
					.text("TOTAL:")
					;
					
				var totalValue = center_text.append("text")
					.transition()
					.delay(function() { return pieChartArcTweenDuration + 500;})
					.attr("dy", 5)
					.attr("text-anchor", "middle") 
					.text(function() { return totalLinkValue; });
					
				var totalUnit = center_text.append("text")
					.transition()
					.delay(function() { return pieChartArcTweenDuration + 500;})
					.attr("dy", 25)
					.attr("text-anchor", "middle") 
					.text("EJ");	
					
				//Title text 
				var pieChartTitleY = centerY - pieChartRadius - pieChartMargin - 20;
				
				var title_text = svg.append("g")
					.attr("id", "pieChart")
					.attr("class", "pieChartTitle")
					.attr("transform", "translate(" + centerX + "," + pieChartTitleY + ")");
  
				var titleLabel = title_text.append("text")
					.attr("text-anchor", "middle") 
					.text("Primary Energy Participation:")
					;
				
				var titleLabel2 = title_text.append("text")
					.attr("text-anchor", "middle") 
					.attr("dy", 14)
					.text(function(){ return linkData.source.name + " products demanded by " + linkData.target.name})
					;					

				//Energy Source Labels 
				var label_group = svg.append("g")
					.attr("id", "pieChart")
					.attr("transform", "translate(" + centerX + "," + centerY + ")");
				
				//Tick mark
				lines = label_group.selectAll("line").data(pie(pieData));
				
				lines.enter().append("line")
				  .attr("x1", 0)
				  .attr("x2", 0)
				  .attr("y1", -pieChartRadius-3)
				  .attr("y2", -pieChartRadius-8)
				  .attr("stroke", "gray")
				  .transition()
				  .duration(pieChartTextTweenDuration)
				  .attr("transform", function(d) {
					return "rotate(" + (d.startAngle+d.endAngle)/2 * (180/Math.PI) + ")";
				  });
				  
				//Percentage Text (add only if greater than last 5% if not add others - ~x.00% - Cola, Hydro,...)
				valueLabels = label_group.selectAll("text").data(pie(pieData));

				var processedText="",processedValue=0,processedPercentage=0;
				
				valueLabels.enter().append("text")
				  .attr("transform", function(d) { return "translate(" + Math.cos(((d.startAngle+d.endAngle - Math.PI)/2)) * (pieChartRadius+pieChartTextOffset) + "," + Math.sin((d.startAngle+d.endAngle - Math.PI)/2) * (pieChartRadius+pieChartTextOffset) + ")"; })
				  .attr("dy", function(d){ if (d.startAngle > (95/100)*2*Math.PI) return -13; else if ((d.startAngle+d.endAngle)/2 > Math.PI/2 && (d.startAngle+d.endAngle)/2 < Math.PI*1.5 ) { return 5; } else { return -17; } })
				  .attr("text-anchor", function(d){ if (( (d.startAngle+d.endAngle)/2 < Math.PI )||(d.startAngle > (95/100)*2*Math.PI)){ return "beginning"; } else { return "end"; } })
				  .text(function(d,i){ 
						if((d.startAngle > (95/100)*2*Math.PI) && (i < pieData.length - 1)) {
							if (processedText=="")
								processedText = "Others: ";
							processedText= processedText + d.data.name + " ,"; 
						} else if (d.startAngle > (95/100)*2*Math.PI){
							return processedText + d.data.name;;
						} else {
							return d.data.name;
						}
					})
				  .transition().duration(pieChartTextTweenDuration).attrTween("transform", textTween)
				;
								
				valueLabels.enter().append("text")
				  .attr("transform", function(d) { return "translate(" + Math.cos(((d.startAngle+d.endAngle - Math.PI)/2)) * (pieChartRadius+pieChartTextOffset) + "," + Math.sin((d.startAngle+d.endAngle - Math.PI)/2) * (pieChartRadius+pieChartTextOffset) + ")"; })
				  .attr("dy", function(d){ if (d.startAngle > (95/100)*2*Math.PI) return 0;  else if ((d.startAngle+d.endAngle)/2 > Math.PI/2 && (d.startAngle+d.endAngle)/2 < Math.PI*1.5 ) { return 17; } else { return -5; } })
				  .attr("text-anchor", function(d){ if (( (d.startAngle+d.endAngle)/2 < Math.PI )||(d.startAngle > (95/100)*2*Math.PI)){ return "beginning"; } else { return "end"; } })
				  .transition().delay(pieChartTextTweenDuration)
				  .text(function(d,i){ 
					if(d.startAngle > (95/100)*2*Math.PI && i < pieData.length - 1) {
							processedValue = processedValue + d.data.value;
							processedPercentage = processedPercentage + (d.value/totalLinkValue)*100;
						} else if (d.startAngle > (95/100)*2*Math.PI){
							return (processedPercentage + (d.value/totalLinkValue)*100).toFixed(1) + "% - " + (processedValue + d.data.value).toFixed(3) + " EJ" ;
						} else {
							return (processedPercentage + (d.value/totalLinkValue)*100).toFixed(1) + "% - " + (processedValue + d.data.value).toFixed(3) + " EJ" ;
						}
					});
				 
				function textTween(d, i) {
				  var a = 0;
				  var b = (d.startAngle + d.endAngle - Math.PI)/2;
				  var fn = d3.interpolateNumber(a, b);
				  return function(t) { var val = fn(t);	return "translate(" + Math.cos(val) * (pieChartRadius+pieChartTextOffset) + "," + Math.sin(val) * (pieChartRadius+pieChartTextOffset) + ")"; };
				}  
				
				//}, mouseOverDelay );
		
			};
			
			
			// Function to create Node Bar Chart
			function createBarChart(d,data) {
		
				barChartTopLeftx = d.x + d.dx + 90;
				barChartTopLefty = d.y + ( d.dy - barChartHeight )/2;
					
				if (barChartTopLeftx+barChartWidth > sankeyWidth)
					barChartTopLeftx = d.x - barChartWidth - 20;
							
				if (barChartTopLefty - 20 < 0)
					barChartTopLefty = 30;
					
				if (barChartTopLefty+barChartHeight > sankeyHeight)
					barChartTopLefty = sankeyHeight - barChartHeight -20;

				AxisX = barChartTopLefty + barChartHeight;
							
				var x = d3.scale.ordinal()
					.rangeRoundBands([0, barChartWidth], .1);

				var y = d3.scale.linear()
					.range([barChartHeight, 0]);

				var xAxis = d3.svg.axis()
					.scale(x)
					.orient("bottom");

				var yAxis = d3.svg.axis()
					.scale(y)
					.orient("left");
							
				x.domain(data.map(function(d) { return d.label; }));
				y.domain([0, d3.max(data, function(d) { return d.value; })]);
							
				var barChart = svg.append("g")
					.selectAll(".node")
					.data(data)
					.enter()
					.append("rect")
					.attr("id", "barChart")
					.attr("class", function(d) { if( currentYear == d.label) return "barChartSeclectedBar"; else return "barChartBars";  })
					.attr("x", function(d) { return barChartTopLeftx + x(d.label); })
					.attr("width", x.rangeBand())
					.attr("y", function(d) { return AxisX; })
					.attr("height", function(d) { if (- y(d.value)<0) return 0; else return - y(d.value); })
					.transition()
					.duration(transitionDurations)
					.attr("y", function(d) { return barChartTopLefty + y(d.value); })
					.attr("height", function(d) { return barChartHeight - y(d.value); });
					
				svg.append("g")
					.selectAll(".node")
					.data(data)
					.enter()
					.append("text")
					.text(0) 
					.attr("x", function(d) { return barChartTopLeftx + x(d.label) + x.rangeBand()/2; })
					.attr("y", function(d) { return AxisX + 15; })
					.attr("id", "barChart")
					.attr("class", "barChartValues")
					.transition()
					.duration(transitionDurations)
					.tween("text", function(d) {
						var i = d3.interpolate(this.textContent, d.value),
							prec = (d + "").split("."),
							round = (prec.length > 1) ? Math.pow(10, prec[1].length) : 1;
						return function(t) {
							this.textContent = Math.round(i(t) * Math.max(round,100)) / Math.max(round,100);
						};
					})
					.attr("x", function(d) { return barChartTopLeftx + x(d.label) + x.rangeBand() / 2 ; })
					.attr("y", function(d) { if (barChartTopLefty + y(d.value) + 15 > AxisX) return  barChartTopLefty + y(d.value) - 5; else return barChartTopLefty + y(d.value) + 15 ; }) ; 

				svg.append("g")
					.attr("id", "barChart")
					.attr("class", "x barChartAxis")
					.attr("transform", "translate(" + barChartTopLeftx + "," + AxisX + ")")
					.call(xAxis);

				svg.append("g")
					.attr("id", "barChart")
					.attr("class", "y barChartAxis")
					.attr("transform", "translate(" + barChartTopLeftx + "," + barChartTopLefty + ")")
					.call(yAxis)
					.append("text")
					.attr("transform", "rotate(-90)")
					.attr("y", 6)
					.attr("dy", ".71em")
					.style("text-anchor", "end")
					.text("EJ");		
					
			}; // End of Create Bar Chart Function

			
			function CreateSankeyEnergyExtraLinks(finalData,originalData) {
				finalData.nodes = data.nodes;
				finalData['links'] = [];
				resultObj = {};
				originalData.links.forEach(function(link) {
					if (typeof link.EnergySources!="undefined"){
						source = link.source;
						target = link.target;
						link.EnergySources.forEach(function(ESources) {
							resultObj = {};
							resultObj.source = source;
							resultObj.target = target;
							resultObj.color = ESources.color;
							resultObj.energySource = ESources.name;
							resultObj.yearlyValue = ESources.yearlyValue;
							finalData.links.push(resultObj);
						});
					} else {
						resultObj = {};
						resultObj.source = link.source;
						resultObj.target = link.target;
						resultObj.color = link.color;
						resultObj.yearlyValue = link.yearlyValue;
						finalData.links.push(resultObj);
					}
				});
			};
				
				
			// Resize Sankey on Window Resize
			window.onresize = function() {	
				sankeyWidth = $(window).width() - 100;
				sankeyHeight = $(window).height() - $("#top").height() - $("#footer").height() - 120;
				d3.select("svg")
					.attr("width", sankeyWidth)
					.attr("height", sankeyHeight);
				updateSankey(json,currentYear);
			};

		});	// End of initialization code
		
	
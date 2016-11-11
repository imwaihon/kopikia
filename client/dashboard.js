import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import { Meteor } from 'meteor/meteor';

// TODO(waihon): Eventually switch this over to server side handling.
import { Vendors, Orders, Menus } from '/lib/collections.js'

import './dashboard.html';

var Highcharts = require('highcharts/highstock');

Template.vendorStatusDashboard.helpers({
  // Real time chart for hour-by-hour sales.
  'createStatusChart1'() {
    // Gather data:
    // Use Meteor.defer() to craete chart after DOM is ready:
    Meteor.defer(function() {
      Meteor.call('vendor.analytics.getSalesToday', {vendorId: Meteor.userId()}, function(error, res) {
        var hours = ['12am', '1am', '2am', '3am', '4am', '5am', '6am', '7am', '8am', '9am', '10am', '11am', '12pm',
         '1pm', '2pm', '3pm', '4pm', '5pm', '6pm', '7pm', '8pm', '9pm', '10pm', '11pm'];
        var volume = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
        if (res) {
          var data = res.result;
          for (var i=0; i<data.length; i++) {
            index = (data[i]._id+8)%24;
            volume[index] = data[i].sum_price;
          }
          console.log(data, hours, volume);
        }

        Highcharts.chart('statusChart1', {
          chart: {
              type: 'column'
          },
          title: {
              text: 'Today\'s Realtime Sales Volume'
          },
          xAxis: {
              categories:hours,
              crosshair: true
          },
          yAxis: {
              min: 0,
              title: {
                  text: 'Sales volume (S$)'
              }
          },
          legend: {
              enabled: false
          },
          tooltip: {
              headerFormat: '<span style="font-size:10px">{point.key}</span><table>',
              pointFormat: '<tr><td style="color:{series.color};padding:0">{series.name}: </td>' +
                  '<td style="padding:0"><b>S${point.y:.2f}</b></td></tr>',
              footerFormat: '</table>',
              shared: true,
              useHTML: true
          },
          plotOptions: {
              column: {
                  pointPadding: 0.2,
                  borderWidth: 0
              }
          },
          series: [{
              name: "Sales",
              data: volume
          }]
        });
      });
    });
  }
});

Template.vendorReportDashboard.helpers({
  'createForecastChart1'() {
    // Gather data:
    // Use Meteor.defer() to craete chart after DOM is ready:
    Meteor.defer(function() {
      // Create standard Highcharts chart with options:
      var colors = colors = Highcharts.getOptions().colors;
      var name = 'Yesterday Sales Breakdown';
      var categories = ['Milk Tea', 'Green Tea', 'Special'];
      var data = [{
              y: 135,
              color: colors[0],
              drilldown: {
                  name: 'Milk Tea',
                  categories: ['Hazelnut', 'Honey', 'Ice Cream', 'Chocolate'],
                  data: [60, 35, 25, 15],
                  color: colors[0],
                  x: 'Milk Tea'
              }
          }, {
              y: 80,
              color: colors[1],
              drilldown: {
                  name: 'Green Tea',
                  categories: ['Oolong', 'Wintermelon', 'Blue Coral'],
                  data: [40, 33, 7],
                  color: colors[1]
              }
          }, {
              y: 50,
              color: colors[2],
              drilldown: {
                  name: 'Special',
                  categories: ['Chocolate Milk', 'Bandung', 'Milo Dinosaur', 'Oreo Flurry'],
                  data: [17, 13, 10, 4],
                  color: colors[2]
              }
          }];
      var chart = Highcharts.chart('forecastChart1', {chart: {
          type: 'column'
        },
        title: {
          text: name
        },
        xAxis: {
            categories: categories
        },
        yAxis: {
          min: 0,
          title: {
            text: 'Drinks Sold'
          },
          stackLabels: {
            enabled: true,
            style: {
              fontWeight: 'bold',
              color: (Highcharts.theme && Highcharts.theme.textColor) || 'gray'
            }
          }
        },
        legend: {
          align: 'right',
          x: -30,
          verticalAlign: 'top',
          y: 25,
          floating: true,
          backgroundColor: (Highcharts.theme && Highcharts.theme.background2) || 'white',
          borderColor: '#CCC',
          borderWidth: 1,
          shadow: false
        },
        tooltip: {
            formatter: function() {
                var point = this.point,
                    s = this.x +': <b>'+ this.y +' drinks sold</b><br/>';
                if (point.drilldown) {
                    s += 'Click to view '+ point.category +' breakdown';
                } else {
                    s += 'Click to return';
                }
                return s;
            }
        },
        plotOptions: {
            series: {
                cursor: 'pointer',
                point: {
                    events: {
                        click: function() {
                            var drilldown = this.drilldown;
                            var options;
                            if (drilldown) { // drill down
                                options = {
                                    'name': drilldown.name,
                                    'categories': drilldown.categories,
                                    'data': drilldown.data,
                                    'color': drilldown.color,
                                    'type': 'column'
                                };
                            } else { // restore
                                options = {
                                    'name': name,
                                    'categories': categories,
                                    'data': data,
                                    'type': 'column'
                                };
                            }
                            setChart(options);
                        }
                    }
                },
                dataLabels: {
                    enabled: true,
                    color: 'black',
                    style: {
                        fontWeight: 'bold'
                    },
                    formatter: function() {
                        return this.y;
                    }
                }
            }
        },

        series: [{
            type: 'column',
            name: name,
            data: data,
            color: 'white'
        }],
      });

      function setChart(options) {
          chart.series[0].remove(false);
          chart.addSeries({
              type: options.type,
              name: options.name,
              data: options.data,
              color: options.color || 'white'
          }, false);
          chart.xAxis[0].setCategories(options.categories, false);
          chart.redraw();
      }
    });

  },

  'createForecastChart2'() {
      Meteor.defer(function() {
    	  // Chart data here
    		days = ["5 Nov", "6 Nov", "7 Nov", "8 Nov", "9 Nov"]
        demand = [95, 108, 87, 216, 135]
        dishes = ["Chicken Rice", "Duck Rice", "Roasted Chicken Rice", "Braised Egg", "Beancurd"]
        day0dd = [50,30,10,2,3]
        day1dd = [40,50,10,5,3]
        day2dd = [20,30,10,7,12]
        day3dd = [120,50,10,12,24]
        day4dd = [50,30,40,12,13]

        // Create the chart
        Highcharts.chart('forecastChart2', {
            chart: {
                type: 'column'
            },
            title: {
                text: 'Demand forecast for next 5 days'
            },
            subtitle: {
                text: 'Click the columns to view breakdown of demand by dish.'
            },
            xAxis: {
                type: 'category'
            },
            yAxis: {
                title: {
                    text: 'Total number of servings to prepare'
                }

            },
            legend: {
                enabled: false
            },
            plotOptions: {
                series: {
                    borderWidth: 0,
                    dataLabels: {
                        enabled: true,
                        format: '{point.y}'
                    }
                }
            },

            tooltip: {
                headerFormat: '<span style="font-size:11px">{series.name}</span><br>',
                pointFormat: '<span style="color:{point.color}">{point.name}</span>: <b>{point.y}</b> servings<br/>'
            },

            series: [{
                name: 'Demand forecast',
                colorByPoint: true,
                data: [{
                    name: days[0],
                    y: demand[0],
                    drilldown: days[0]+" Demand Breakdown"
                }, {
                    name: days[1],
                    y: demand[1],
                    drilldown: days[1]+" Demand Breakdown"
                }, {
                    name: days[2],
                    y: demand[2],
                    drilldown: days[2]+" Demand Breakdown"
                }, {
                    name: days[3],
                    y: demand[3],
                    drilldown: days[3]+" Demand Breakdown"
                }, {
                    name: days[4],
                    y: demand[4],
                    drilldown: days[4]+" Demand Breakdown"
                }]
            }],
            drilldown: {
                series: [{
                    name: days[0]+" Demand Breakdown",
                    id: days[0]+" Demand Breakdown",
                    data: [
                        [
                            dishes[0],
                            day0dd[0]
                        ],
                        [
                            dishes[1],
                            day0dd[1]
                        ],
                        [
                            dishes[2],
                            day0dd[2]
                        ],
                        [
                            dishes[3],
                            day0dd[3]
                        ],
                        [
                            dishes[4],
                            day0dd[4]
                        ]
                    ]
                }, {
                    name: days[1]+" Demand Breakdown",
                    id: days[1]+" Demand Breakdown",
                    data: [
                        [
                            dishes[0],
                            day1dd[0]
                        ],
                        [
                            dishes[1],
                            day1dd[1]
                        ],
                        [
                            dishes[2],
                            day1dd[2]
                        ],
                        [
                            dishes[3],
                            day1dd[3]
                        ],
                        [
                            dishes[4],
                            day1dd[4]
                        ]
                    ]
                }, {
                    name: days[2]+" Demand Breakdown",
                    id: days[2]+" Demand Breakdown",
                    data: [
                        [
                            dishes[0],
                            day2dd[0]
                        ],
                        [
                            dishes[1],
                            day2dd[1]
                        ],
                        [
                            dishes[2],
                            day2dd[2]
                        ],
                        [
                            dishes[3],
                            day2dd[3]
                        ],
                        [
                            dishes[4],
                            day2dd[4]
                        ]
                    ]
                }, {
                    name: days[3]+" Demand Breakdown",
                    id: days[3]+" Demand Breakdown",
                    data: [
                        [
                            dishes[0],
                            day3dd[0]
                        ],
                        [
                            dishes[1],
                            day3dd[1]
                        ],
                        [
                            dishes[2],
                            day3dd[2]
                        ],
                        [
                            dishes[3],
                            day3dd[3]
                        ],
                        [
                            dishes[4],
                            day3dd[4]
                        ]
                    ]
                }, {
                    name: days[4]+" Demand Breakdown",
                    id: days[4]+" Demand Breakdown",
                    data: [
                        [
                            dishes[0],
                            day4dd[0]
                        ],
                        [
                            dishes[1],
                            day4dd[1]
                        ],
                        [
                            dishes[2],
                            day4dd[2]
                        ],
                        [
                            dishes[3],
                            day4dd[3]
                        ],
                        [
                            dishes[4],
                            day4dd[4]
                        ]
                    ]
                }]
            }
        });
      });
  }
});

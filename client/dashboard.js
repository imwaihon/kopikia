import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import { Meteor } from 'meteor/meteor';

// TODO(waihon): Eventually switch this over to server side handling.
import { Vendors, Orders, Menus } from '/lib/collections.js'

import moment from 'moment';

import './dashboard.html';

var Highcharts = require('highcharts/highstock');

Template.vendorStatusDashboard.onCreated(function () {
  this.autorun(function () {
    Meteor.call('vendor.analytics.metric.todayRevenue', {vendorId: Meteor.userId()}, function(error, res) {

      Session.set('metricDataTodayRevenue', res);
    });
    Meteor.call('vendor.analytics.metric.todayCustomers', {vendorId: Meteor.userId()}, function(error, res) {

      Session.set('metricDataTodayCustomers', res);
    });
    Meteor.call('vendor.analytics.metric.todayOnlineCustomers', {vendorId: Meteor.userId()}, function(error, res) {

      Session.set('metricDataTodayOnlineCustomers', res);
    });
  });
});

Template.vendorStatusDashboard.helpers({
  'todayRevenueMetric'() {
    return Session.get('metricDataTodayRevenue');
  },
  'todayCustomersMetric'() {
    return Session.get('metricDataTodayCustomers');
  },
  'todayOnlineCustomersMetric'() {
    return Session.get('metricDataTodayOnlineCustomers');
  },
  // chart for hour-by-hour sales.
  'createStatusChart1'() {
    // Gather data:
    // Use Meteor.defer() to craete chart after DOM is ready:
    Meteor.defer(function() {
      Meteor.call('vendor.analytics.getSalesToday', {vendorId: Meteor.userId()}, function(error, res) {
        var hours = ['12am', '1am', '2am', '3am', '4am', '5am', '6am', '7am', '8am', '9am', '10am', '11am', '12pm',
         '1pm', '2pm', '3pm', '4pm', '5pm', '6pm', '7pm', '8pm', '9pm', '10pm', '11pm'];
        var volume = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
        var customers = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
        if (res) {
          var data = res.result;
          for (var i=0; i<data.length; i++) {
            index = (data[i]._id+8)%24;
            volume[index] = data[i].sum_price;
            customers[index] = data[i].count;
          }
          console.log(data, hours, volume);
        }

        Highcharts.chart('statusChart1', {
          chart: {
              zoomType: 'xy'
          },
          title: {
              text: ''
          },
          xAxis: [{
              categories:hours,
              crosshair: true
          }],
          yAxis: [{
              min: 0,
              title: {
                  text: 'Sales volume (S$)'
              }
          },{
              min: 0,
              title: {
                  text: 'Number of Customers'
              },
              opposite: true
          }],
          legend: {
              enabled: false
          },
          tooltip: {
              headerFormat: '<span style="font-size:10px">{point.key}</span><table>',
              pointFormat: '<tr><td style="color:{series.color};padding:0">{series.name}: </td>' +
                  '<td style="padding:0"><b>{point.y:.2f}</b></td></tr>',
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
              type: 'column',
              data: volume,
          },{
              name: "Customers",
              type: 'spline',
              yAxis: 1,
              data: customers,
          }]
        });
      });
    });
  }
});

Template.vendorReportDashboard.helpers({
  'createReportChart1'() {
    Meteor.defer(function() {
      Meteor.call('vendor.analytics.getSalesLastFourWeeks', {vendorId: Meteor.userId()}, function(error, res) {
        var days = [];
        var volume = [];
        var customers = [];
        if (res) {
          var data = res.result;
          for (var i=0; i<data.length; i++) {
            days.push(moment(data[i]._id,'DDD').format('MMM DD'));
            volume.push(data[i].sum_price);
            customers.push(data[i].count);
          }
        }

        Highcharts.chart('reportChart1', {
          chart: {
              zoomType: 'xy'
          },
          title: {
              text: ''
          },
          xAxis: [{
              categories:days,
              crosshair: true
          }],
          yAxis: [{
              min: 0,
              title: {
                  text: 'Sales volume (S$)'
              }
          },{
              min: 0,
              title: {
                  text: 'Number of Customers'
              },
              opposite: true
          }],
          legend: {
              enabled: false
          },
          tooltip: {
              headerFormat: '<span style="font-size:10px">{point.key}</span><table>',
              pointFormat: '<tr><td style="color:{series.color};padding:0">{series.name}: </td>' +
                  '<td style="padding:0"><b>{point.y:.2f}</b></td></tr>',
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
              type: 'column',
              data: volume,
          },{
              name: "Customers",
              type: 'spline',
              yAxis: 1,
              data: customers,
          }]
        });
      });
    });
  },

  'createReportChart2'() {
    Meteor.defer(function() {
      Meteor.call('vendor.analytics.menuBreakdown', {vendorId: Meteor.userId()}, function(error, res) {
        var total = 0;
        var foodList = [];
        if (res) {
          var data = res.result;
          for (var i=0; i<data.length; i++) {
            total += data[i].sum_price;
          }

          for (var i=0; i<data.length; i++) {
            console.log(data[i].sum_price, total);
            foodList.push([data[i]._id, Number(((data[i].sum_price/total)*100).toFixed(2))]);
          }
        }

        // Create the chart
        chart = new Highcharts.Chart({
            chart: {
                renderTo: 'reportChart2',
                type: 'pie'
            },
            title: {
                text: ''
            },
            yAxis: {
                title: {
                    text: 'Total percent sales share'
                }
            },
            plotOptions: {
                pie: {
                    shadow: false
                }
            },
            tooltip: {
                formatter: function() {
                    return '<b>'+ this.point.name +'</b>: '+ this.y +' %';
                }
            },
            series: [{
                name: 'Food',
                data: foodList,
                size: '100%',
                innerSize: '70%',
                showInLegend:false,
                dataLabels: {
                    enabled: true
                }
            }]
        });
      });
    });
  },

  'createReportChart3'() {
    // HARD-CODED data
    // Gather data:
    // Use Meteor.defer() to craete chart after DOM is ready:
    Meteor.defer(function() {
      // Create standard Highcharts chart with options:
      var colors = colors = Highcharts.getOptions().colors;
      var categories = ["5 Nov", "6 Nov", "7 Nov", "8 Nov", "9 Nov"];

      var data = [{
              y: 95,
              color: colors[0],
              drilldown: {
                  name: '5 Nov',
                  categories: ["Chicken Rice", "Duck Rice", "Roasted Chicken Rice", "Braised Egg", "Beancurd"],
                  data: [50,30,10,2,3],
                  color: colors[0],
                  x: 'Milk Tea'
              }
          }, {
              y: 108,
              color: colors[1],
              drilldown: {
                  name: '6 Nov',
                  categories: ["Chicken Rice", "Duck Rice", "Roasted Chicken Rice", "Braised Egg", "Beancurd"],
                  data: [40,50,10,5,3],
                  color: colors[1]
              }
          }, {
              y: 87,
              color: colors[2],
              drilldown: {
                  name: '7 Nov',
                  categories: ["Chicken Rice", "Duck Rice", "Roasted Chicken Rice", "Braised Egg", "Beancurd"],
                  data: [20,30,10,7,12],
                  color: colors[2]
              }
          }, {
              y: 216,
              color: colors[3],
              drilldown: {
                  name: '8 Nov',
                  categories: ["Chicken Rice", "Duck Rice", "Roasted Chicken Rice", "Braised Egg", "Beancurd"],
                  data: [120,50,10,12,24],
                  color: colors[3]
              }
          }, {
              y: 135,
              color: colors[4],
              drilldown: {
                  name: '9 Nov',
                  categories: ["Chicken Rice", "Duck Rice", "Roasted Chicken Rice", "Braised Egg", "Beancurd"],
                  data: [50,30,40,12,13],
                  color: colors[4]
              }
          }];
      var chart = Highcharts.chart('reportChart3', {chart: {
          type: 'column'
        },
        title: {
          text: ''
        },
        xAxis: {
            categories: categories
        },
        yAxis: {
          min: 0,
          title: {
            text: 'Estimated Preparation Servings'
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
                    s = this.x +': <b>'+ this.y +'</b><br/>';
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
            showInLegend: false,
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


});

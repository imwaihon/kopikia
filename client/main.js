import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import { Meteor } from 'meteor/meteor';

// TODO(waihon): Eventually switch this over to server side handling.
import { Vendors, Orders, Menus } from '/lib/collections.js'

import './main.html';

import { Orders } from '../lib/collections.js';

// Highcharts API
var Highcharts = require('highcharts/highstock');


Template.sidebar.events({
    'click #logout': function(event) {
        event.preventDefault();
        Meteor.logout();

    },
    'click #dashboard': function(event) {
        event.preventDefault();
        FlowRouter.go('/dashboard');
    },
    'click #menu': function(event) {
        event.preventDefault();
        FlowRouter.go('/');
    },
    'click #pos': function(event) {
        event.preventDefault();
        FlowRouter.go('/pos');
    },
    'click #orders': function(event) {
        event.preventDefault();
        FlowRouter.go('/orders');
    },
});

Template.vendorDashboard.helpers({
  'createSalesChart'() {
    // Gather data:
    // Use Meteor.defer() to craete chart after DOM is ready:
    // default last 12 hours' servings for all dishes of the vendor
    Meteor.defer(function() {
      // TODO(waihon): Make data actually calculated from our stored order data.
      var categories = [
                  '0800',
                  '0900',
                  '1000',
                  '1100',
                  '1200',
                  '1300',
                  '1400',
                  '1500',
                  '1600',
                  '1700',
                  '1800',
                  '1900',
                  '2000',
                  '2100',
                  '2200'
      ];

      var chickenRiceData = [49, 71, 106, 129, 144, 176, 135, 148, 216, 194, 95, 54, 49, 36, 30];
      var duckRiceData = [83, 78, 98, 93, 106, 84, 105, 104, 91, 83, 106, 92, 50, 48, 39];

      // Create standard Highcharts chart with options:
      var chart1 = Highcharts.chart('chart1', {
        chart: {
          type: 'bar'
        },
        title: {
          text: 'Servings Sold by Hour'
        },
        xAxis: {
          categories: categories,
          crosshair: true
        },
        yAxis: {
          min: 0,
          title: {
            text: 'Servings'
          }
        },
        tooltip: {
          headerFormat: '<span style="font-size:10px">{point.key}</span><table>',
          pointFormat: '<tr><td style="color:{series.color};padding:0">{series.name}: </td>' +
            '<td style="padding:0"><b>{point.y:.1f} mm</b></td></tr>',
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
          name: 'Chicken Rice',
          data: chickenRiceData

        }, {
          name: 'Duck Rice',
          data: duckRiceData

        }]
      });

      // TODO(waihon): Make a actual real time chart.
      Meteor.setInterval( function() {
        categories.push(categories.shift());
        chickenRiceData.push(chickenRiceData.shift());
        duckRiceData.push(duckRiceData.shift());
        chart1.series[0].update(chickenRiceData, true);
        chart1.series[1].update(duckRiceData, true);

        chart1.redraw();
      }, 2500 );
    });
  },

  'createChart2'() {
    // Gather data:
    // Use Meteor.defer() to craete chart after DOM is ready:
    Meteor.defer(function() {
      // Create standard Highcharts chart with options:
      Highcharts.chart('chart2', {chart: {
          type: 'column'
        },
        title: {
          text: 'Daily Sales Breakdown'
        },
        xAxis: {
            categories: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
        },
        yAxis: {
          min: 0,
          title: {
            text: 'Total drink consumption'
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
          headerFormat: '<b>{point.x}</b><br/>',
          pointFormat: '{series.name}: {point.y}<br/>Total: {point.stackTotal}'
        },
        plotOptions: {
          column: {
            stacking: 'normal',
            dataLabels: {
              enabled: true,
              color: (Highcharts.theme && Highcharts.theme.dataLabelsColor) || 'white'
            }
          }
        },
        series: [{
          name: 'Iced Milo',
          data: [5, 3, 4, 7, 2, 9, 11]
        }, {
          name: 'Kopi-O',
          data: [2, 2, 3, 2, 1, 7, 12]
        }, {
          name: 'Kopi-C',
          data: [3, 4, 4, 2, 5, 8, 11]
        }]
      });
    });
  },

  'createChart3'() {
    // Gather data:
    // Use Meteor.defer() to craete chart after DOM is ready:
    Meteor.defer(function() {
      // Create standard Highcharts chart with options:
      Highcharts.chart('chart3', {
        chart: {
          plotBackgroundColor: null,
          plotBorderWidth: null,
          plotShadow: false,
          type: 'pie'
        },
        title: {
          text: 'Best Selling Food January, 2015 to May, 2015'
        },
        tooltip: {
          pointFormat: '{series.name}: <b>{point.percentage:.1f}%</b>'
        },
        plotOptions: {
          pie: {
              allowPointSelect: true,
              cursor: 'pointer',
              dataLabels: {
                  enabled: false
              },
              showInLegend: true
          }
        },
        series: [{
            name: 'Food',
            colorByPoint: true,
            data: [{
                name: 'Char Kway Teow',
                y: 56.33
            }, {
                name: 'Fried Carrot Cake',
                y: 24.03
            }, {
                name: 'Rojak',
                y: 10.38
            }, {
                name: 'Beancurd',
                y: 4.77
            }, {
                name: 'Nasi Lemak',
                y: 0.91
            }, {
                name: 'You Tiao',
                y: 0.2
            }]
        }]
      });
    });
  }
});





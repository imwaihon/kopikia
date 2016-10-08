import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import { Meteor } from 'meteor/meteor';

import './main.html';

var Highcharts = require('highcharts/highstock');

Template.home.events({
    'click .logout': function(event){
        event.preventDefault();
        Meteor.logout();
    }
});

// Template.body.helpers({
//   createChart: function () {
//     // Gather data: 
//     // Use Meteor.defer() to craete chart after DOM is ready:
//     Meteor.defer(function() {
//       // Create standard Highcharts chart with options:
//       Highcharts.chart('chart', {
//     chart: {
//       type: 'column'
//     },
//     title: {
//       text: 'Servings Sold by Hour (Monday)'
//     },
//     xAxis: {
//       categories: [
//         '0800',
//         '0900',
//         '1000',
//         '1100',
//         '1200',
//         '1300',
//         '1400',
//         '1500',
//         '1600',
//         '1700',
//         '1800',
//         '1900',
//         '2000',
//         '2100',
//         '2200'
//       ],
//       crosshair: true
//     },
//     yAxis: {
//       min: 0,
//       title: {
//         text: 'Servings'
//       }
//     },
//     tooltip: {
//       headerFormat: '<span style="font-size:10px">{point.key}</span><table>',
//       pointFormat: '<tr><td style="color:{series.color};padding:0">{series.name}: </td>' +
//         '<td style="padding:0"><b>{point.y:.1f} mm</b></td></tr>',
//       footerFormat: '</table>',
//       shared: true,
//       useHTML: true
//     },
//     plotOptions: {
//       column: {
//         pointPadding: 0.2,
//         borderWidth: 0
//       }
//     },
//     series: [{
//       name: 'Chicken Rice',
//       data: [49.9, 71.5, 106.4, 129.2, 144.0, 176.0, 135.6, 148.5, 216.4, 194.1, 95.6, 54.4, 49.7, 36.0, 30.8]

//     }, {
//       name: 'Duck Rice',
//       data: [83.6, 78.8, 98.5, 93.4, 106.0, 84.5, 105.0, 104.3, 91.2, 83.5, 106.6, 92.3, 50.0, 48.7, 39.0]

//     }]
//   });
// });
// }
// });

Template.body.helpers({
  createChart: function () {
    // Gather data: 
    // Use Meteor.defer() to craete chart after DOM is ready:
    Meteor.defer(function() {
      // Create standard Highcharts chart with options:
      Highcharts.chart('chart', {chart: {
            type: 'column'
        },
        title: {
            text: 'Stacked column chart'
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
      }
    });
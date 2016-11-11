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
              tickInterval: 1,
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
              tickInterval: 1,
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
  }
});

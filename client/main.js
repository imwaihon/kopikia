import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import { Meteor } from 'meteor/meteor';


// TODO(waihon): Eventually switch this over to server side handling.
import { Vendors, Orders, Menus } from '/lib/collections.js'

import './main.html';


// Highcharts API
var Highcharts = require('highcharts/highstock');


Template.sidebar.events({
    'click #logout': function(event) {
        event.preventDefault();
        Meteor.logout();

    },
    'click #statusDashboard': function(event) {
        event.preventDefault();
        FlowRouter.go('/status-dashboard');
    },
    'click #reportDashboard': function(event) {
        event.preventDefault();
        FlowRouter.go('/report-dashboard');
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


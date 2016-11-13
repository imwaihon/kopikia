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

        // Hack to fix a bug.
        $('#statusDashboard').addClass('active');
        $('#reportDashboard').removeClass('active');
        $('#menu').removeClass('active');
        $('#pos').removeClass('active');
        $('#orders').removeClass('active');
    },
    'click #reportDashboard': function(event) {
        event.preventDefault();
        FlowRouter.go('/report-dashboard');

        // Hack to fix a bug.
        $('#statusDashboard').removeClass('active');
        $('#reportDashboard').addClass('active');
        $('#menu').removeClass('active');
        $('#pos').removeClass('active');
        $('#orders').removeClass('active');
    },
    'click #menu': function(event) {
        event.preventDefault();
        FlowRouter.go('/');

        // Hack to fix a bug.
        $('#statusDashboard').removeClass('active');
        $('#reportDashboard').removeClass('active');
        $('#menu').addClass('active');
        $('#pos').removeClass('active');
        $('#orders').removeClass('active');
    },
    'click #pos': function(event) {
        event.preventDefault();
        FlowRouter.go('/pos');

        // Hack to fix a bug.
        $('#statusDashboard').removeClass('active');
        $('#reportDashboard').removeClass('active');
        $('#menu').removeClass('active');
        $('#pos').addClass('active');
        $('#orders').removeClass('active');
    },
    'click #orders': function(event) {
        event.preventDefault();
        FlowRouter.go('/orders');

        // Hack to fix a bug.
        $('#statusDashboard').removeClass('active');
        $('#reportDashboard').removeClass('active');
        $('#menu').removeClass('active');
        $('#pos').removeClass('active');
        $('#orders').addlass('active');
    },
});

import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import { Meteor } from 'meteor/meteor';

import './main.html';

import { Orders } from '../lib/collections.js';

Template.home.events({
    'click .logout': function(event){
        event.preventDefault();
        Meteor.logout();
    }
});

Meteor.methods({
	'vendor.getSaleTrend': function(start, end, menu, scale, unit) {
		// should return result in format {menuId: [number of order]}
		// extract the date range into sub range
		date_range = [];
		start = moment(start);
		end = moment(end);
		temp_start = start;
		while (temp_start < end) {
			date_range.push([temp_start, temp_start.add(scale, unit)]);
			temp_start = temp_start.add(scale, unit);
		}

		// extract the menu record based on date range
		temp_result = {};
		var menuId;
		for (menuId in menu) {
			temp_result[menuId] = Orders.find({'menuId' : menuId, 'orderTime' : {$gte:start, $lte:end}}, {'orderNum':1, 'orderTime':1}).fetch();
		}

		// finalize order amount based on sub range
		result = {};
		var menuId;
		for (menuId in menu) {
			result[menuId] = new Uint8Array(date_range.length);

			var item;
			for (item in temp_result['menuId']){
				for (i=0; i<date_range.length; i++){
					if (moment(item['orderTime']) < date_range[i][1] && moment(item['orderTime'] > date_range[i][0])) {
						result[menuId] = result[menuId] + item['orderNum'];
					}
				}
			}
		}

		return result;
	},

	'vendor.getMenuServings': function(start, end, menu) {
		temp_result = {};
		var menuId;
		for (menuId in menu) {
			temp_result[menuId] = Orders.find({'menuId' : menuId, 'orderTime' : {$gte:start, $lte:end}}, {'orderNum':1).fetch();
		}

		result = {};
		var menuId;
		total = 0
		for (menuId in menu) {
			result[menuId] = 0;
			for (i=0;i<temp_result[menuId].length;i++){
				result[menuId] = result[menuId] + temp_result[menuId][i]['orderNum'];
			}

			total = total + result[menuId]
		}

		return result;
	},
});



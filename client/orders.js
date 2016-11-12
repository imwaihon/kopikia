import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import { Meteor } from 'meteor/meteor';

// TODO(waihon): Eventually switch this over to server side handling.
import { Vendors, Orders, Menus } from '/lib/collections.js'

import './orders.html';

Template.vendorOrders.helpers({
  'orderList'() {
    var orders = Orders.find({
      vendorId: Meteor.userId(),
      orderResolved: false,
    }).fetch();

    for (var i=0; i<orders.length; i++) {
      orders[i].formattedTotalPrice = orders[i].totalPrice.toFixed(2);

      if (orders[i].isVendor) {
        orders[i].formattedOrderType = 'Onsite';
        orders[i].formattedOrderColor = 'orange';
      } else {
        orders[i].formattedOrderType = 'Online';
        orders[i].formattedOrderColor = 'green';
      }
    }

    return orders;
  }
});

Template.vendorOrders.events({
  'click .completeOrder': function(event, instance) {
    event.preventDefault();
    Meteor.call('vendor.completeOrder',{ vendorId: Meteor.userId(), orderId: event.currentTarget.getAttribute('data-itemid')}, function(err, res) {
      console.log(res);
    });
  },
});

import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import { Meteor } from 'meteor/meteor';

// TODO(waihon): Eventually switch this over to server side handling.
import { Vendors, Orders, Menus } from '/lib/collections.js'

import './main.html';

function magicallyCreateFilledMenuThen(thenFunction) {
  Meteor.call('vendor.createMenu', { name: "best menu" }, (err, res) => {
    var userId = Meteor.userId();
    var menu = Menus.findOne({ vendorId: userId });
    Meteor.call('vendor.addMenuItem', {
      itemId: "miloid",
      menuId: menu._id,
      vendorId: userId,
      category: "Drinks",
      name: "Milo",
      description: "milo",
      price: 1.50
    }, (err, res) => {
      Meteor.call('vendor.addMenuItem', {
        itemId: "coffeeid",
        menuId: menu._id,
        vendorId: userId,
        category: "Drinks",
        name: "Coffee",
        description: "coffee",
        price: 1.20
      }, (err, res) => {
        Meteor.call('vendor.addMenuItem', {
          itemId: "milkteaid",
          menuId: menu._id,
          vendorId: userId,
          category: "Drinks",
          name: "Milk Tea",
          description: "milk tea",
          price: 1.30
        }, (err, res) => {
          Meteor.call('vendor.addMenuItem', {
            itemId: "bandungid",
            menuId: menu._id,
            vendorId: userId,
            category: "Drinks",
            name: "Bandung",
            description: "bandung",
            price: 1.70
          }, (err, res) => {
            thenFunction();
          });
        });
      });
    });
  });
}

Template.vendorHome.events({
    'click .logout': function(event) {
        event.preventDefault();
        Meteor.logout();
    },
    'click #createMenu': function(event) {
      event.preventDefault();
      magicallyCreateFilledMenuThen(function() {
        FlowRouter.go('/menu');
      });
    }
});

Template.vendorHome.onRendered(function () {

});

Template.vendorMenu.events({
    'click .logout': function(event) {
        event.preventDefault();
        Meteor.logout();
    },
});

Template.vendorMenu.helpers({
  'menuItems'() {
    var menu = Menus.findOne({
      vendorId: Meteor.userId()
    });

    if (menu) {
      return menu.items;
    }
  }
});

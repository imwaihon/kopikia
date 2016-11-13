import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import { Meteor } from 'meteor/meteor';

// TODO(waihon): Eventually switch this over to server side handling.
import { Vendors, Orders, Menus } from '/lib/collections.js'

import './menus.html';

// Create a local mongo collection for reactiveness.
var LocalSelectedItems = new Mongo.Collection(null);

Template.vendorMenu.onCreated(function () {
  var self = this;

  this.autorun(function () {
    self.menuObj = Menus.findOne({
      vendorId: Meteor.userId()
    });
  });
});

Template.vendorMenu.events({
  'click #addMenuItem': function(event, instance) {
    event.preventDefault();
    $('#addMenuItemModal').modal({
        onDeny    : function(){
        },
        onApprove : function() {
          var id = 'none';
          if (instance.menuObj) {
            id = instance.menuObj._id;
          }
          console.log(id);
          Meteor.call('vendor.addMenuItem',
            {
              menuId: id,
              name: $('#addMenuItemForm').form('get value', 'item-name'),
              description: $('#addMenuItemForm').form('get value', 'item-description'),
              price: $('#addMenuItemForm').form('get value', 'item-price'),
              imageSource: $('#editMenuItemForm').form('get value', 'item-imagesource'),
            },
            (err, res) => {
              console.log(res);
            }
          );
        }
      })
      .modal('show')
    ;
  },
  'click .editMenuItem': function(event, instance) {
    event.preventDefault();
    $('#editMenuItemForm').form('set value', 'item-name', event.currentTarget.getAttribute('data-itemName'));
    $('#editMenuItemForm').form('set value', 'item-description', event.currentTarget.getAttribute('data-itemDescription'));
    $('#editMenuItemForm').form('set value', 'item-price', event.currentTarget.getAttribute('data-itemPrice'));
    $('#editMenuItemForm').form('set value', 'item-imagesource', event.currentTarget.getAttribute('data-itemImagesource'));

    $('#editMenuItemModal').modal({
        onDeny    : function(){
        },
        onApprove : function(element) {
          if (element.hasClass('deleteMenuItem')) {
              Meteor.call('vendor.deleteMenuItem',
                {
                  itemId: new Meteor.Collection.ObjectID(event.currentTarget.getAttribute('data-itemid')),
                  menuId: instance.menuObj._id,
                },
                (err, res) => {
                  console.log(res);
                }
              );
          } else {
            Meteor.call('vendor.editMenuItem',
              {
                itemId: new Meteor.Collection.ObjectID(event.currentTarget.getAttribute('data-itemid')),
                menuId: instance.menuObj._id,
                name: $('#editMenuItemForm').form('get value', 'item-name'),
                description: $('#editMenuItemForm').form('get value', 'item-description'),
                price: $('#editMenuItemForm').form('get value', 'item-price'),
                imageSource: $('#editMenuItemForm').form('get value', 'item-imagesource'),
              },
              (err, res) => {
                console.log(res);
              }
            );
          }
        }
      })
      .modal('show')
    ;
  },
});

Template.vendorMenu.helpers({
  'menuItems'() {
    var menu = Menus.findOne({
      vendorId: Meteor.userId()
    });

    if (menu) {
      console.log(menu);
      for (var i=0; i<menu.items.length; i++) {
        menu.items[i].formattedPrice = menu.items[i].price.toFixed(2);
      }
      return menu.items;
    }
  }
});

Template.vendorPOS.onCreated(function () {
  var self = this;

  this.autorun(function () {
    self.menuObj = Menus.findOne({
      vendorId: Meteor.userId()
    });
  });
});

Template.vendorPOS.onRendered(function() {
  var selectedItemsHeight = 500;
  if (window.innerHeight > 500) {
    selectedItemsHeight = window.innerHeight;
  }

  $('#selectedItemsList')
  .css('height', selectedItemsHeight * 0.75)
  .css('overflow', 'scroll');
});

Template.vendorPOS.events({
  'click .menu-card': function(event, instance) {
    event.preventDefault();

    var found = LocalSelectedItems.findOne({ itemId: new Meteor.Collection.ObjectID(event.currentTarget.getAttribute('data-itemid')) });
    if (found) {
      LocalSelectedItems.update(
        { itemId: new Meteor.Collection.ObjectID(event.currentTarget.getAttribute('data-itemid')) },
        { $inc: { quantity: 1 } }
      );
    } else {
      LocalSelectedItems.insert(
        instance.menuObj.items[event.currentTarget.getAttribute('data-itemindex')]
      );
    }
  },
  'click .deleteItem': function(event, instance) {
    event.preventDefault();
    LocalSelectedItems.remove({ itemId: new Meteor.Collection.ObjectID(event.currentTarget.getAttribute('data-itemid')) });
  },
  'click #makeSale': function(event, instance) {
    event.preventDefault();
    $('#makeSaleModal').modal({
        onDeny    : function(){
        },
        onApprove : function() {
          $('#saleProcessingLoader').addClass('active');
          Meteor.call('vendor.makeOrder',
            {
              menuId: instance.menuObj._id,
              vendorId: Meteor.userId(),
              items: LocalSelectedItems.find().fetch()
            },
            (err, res) => {
              console.log(res);
              // TODO(waihon) return some kind of 'sale successful' notif
              LocalSelectedItems.remove({});
              $('#saleProcessingLoader').removeClass('active');
            }
          );
        }
      })
      .modal('show')
    ;
  }
});

Template.vendorPOS.helpers({
  'menuItems'() {
    var menu = Menus.findOne({
      vendorId: Meteor.userId()
    });

    if (menu) {
      console.log(menu);
      for (var i=0; i<menu.items.length; i++) {
        menu.items[i].formattedPrice = menu.items[i].price.toFixed(2);
      }
      return menu.items;
    }
  },

  'selectedItems'() {
    var selectedItems = LocalSelectedItems.find().fetch();

    if (selectedItems) {
      for (var i=0; i<selectedItems.length; i++) {
        selectedItems[i].formattedPrice = selectedItems[i].price.toFixed(2);
      }
      return selectedItems;
    }
  },

  'selectedItemsPrice'() {
    var items = LocalSelectedItems.find().fetch();

    if (items && items.length > 0) {
      $('#makeSale').removeClass('disabled');
      // TODO(waihon): use a actual money package, not float/number.
      return '$' + items.map( el => Number(el.price * el.quantity) )
        .reduce(function add(a, b) {
          return a + b;
        }).toFixed(2);
    } else {
      $('#makeSale').addClass('disabled');
      return '$0.00';
    }
  }
});

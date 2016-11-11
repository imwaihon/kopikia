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
  'click #createMenu': function(event) {
    event.preventDefault();
    magicallyCreateFilledMenuThen(function() {
      FlowRouter.go('/menu');
    });
  },
  'click #addMenuItem': function(event, instance) {
    event.preventDefault();
    $('#addMenuItemModal').modal({
        onDeny    : function(){
        },
        onApprove : function() {
          Meteor.call('vendor.addMenuItem',
            {
              menuId: instance.menuObj._id,
              vendorId: Meteor.userId(),
              name: $('#addMenuItemForm').form('get value', 'item-name'),
              description: $('#addMenuItemForm').form('get value', 'item-description'),
              price: $('#addMenuItemForm').form('get value', 'item-price'),
            },
            (err, res) => {
              console.log(res);
            }
          );
        }
      })
      .modal('show')
    ;
  }
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
  .css('height', selectedItemsHeight * 0.8)
  .css('overflow', 'scroll');
});

Template.vendorPOS.events({
  'click .menu-card': function(event, instance) {
    event.preventDefault();
    LocalSelectedItems.insert(
      instance.menuObj.items[event.currentTarget.getAttribute('data-itemid')]);
  },
  'click #makeSale': function(event, instance) {
    event.preventDefault();
    $('#makeSaleModal').modal({
        onDeny    : function(){
        },
        onApprove : function() {
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
      return menu.items;
    }
  },

  'selectedItems'() {
    return LocalSelectedItems.find().fetch();
  },

  'selectedItemsPrice'() {
    var items = LocalSelectedItems.find().fetch();

    if (items && items.length > 0) {
      $('#makeSale').removeClass('disabled');
      // TODO(waihon): use a actual money package, not float/number.
      return '$' + items.map( el => Number(el.price) )
        .reduce(function add(a, b) {
          return a + b;
        }).toFixed(2);
    } else {
      $('#makeSale').addClass('disabled');
      return '$0.00';
    }
  }
});

function magicallyCreateFilledMenuThen(thenFunction) {
  Meteor.call('vendor.createMenu', { name: "best menu" }, (err, res) => {
    var userId = Meteor.userId();
    var menu = Menus.findOne({ vendorId: userId });
    Meteor.call('vendor.addMenuItem', {
      menuId: menu._id,
      vendorId: userId,
      category: "Drinks",
      name: "Ice Milo",
      description: "with cream and ice blended",
      price: 1.80,
      imageSource: "http://g2.onsono.com/1/250/cal/1500/1500/ice-blended-chocolate.jpg"
    }, (err, res) => {
      Meteor.call('vendor.addMenuItem', {
        menuId: menu._id,
        vendorId: userId,
        category: "Drinks",
        name: "Hot Coffee",
        description: "coffee",
        price: 1.30,
        imageSource: "http://www.phuketcoffeeshop.com/wp-content/uploads/2011/06/2_macchiato.jpg"
      }, (err, res) => {
        Meteor.call('vendor.addMenuItem', {
          menuId: menu._id,
          vendorId: userId,
          category: "Drinks",
          name: "Ice Lemon Tea",
          description: "Ice Lemon Tea",
          price: 1.30,
          imageSource: "https://3.imimg.com/data3/TU/AV/MY-4000560/ice-tea-250x250.jpg"
        }, (err, res) => {
          Meteor.call('vendor.addMenuItem', {
            menuId: menu._id,
            vendorId: userId,
            category: "Food",
            name: "Garlic Toast",
            description: "2 pieces",
            price: 1.80,
            imageSource: "http://ukcdn.ar-cdn.com/recipes/originalxl/e0fcd2d0-1105-46f5-b65c-f7d118ee8969.jpg"
          },(err, res) => {
            Meteor.call('vendor.addMenuItem', {
              menuId: menu._id,
              vendorId: userId,
              category: "Food",
              name: "Chicken Rice",
              description: "Tasty white chicken rice",
              price: 2.50,
              imageSource: "https://s3-media2.fl.yelpcdn.com/bphoto/QjeNA_VKPZ2ZKDtAys5NeA/ls.jpg"
            },(err, res) => {
              Meteor.call('vendor.addMenuItem', {
                menuId: menu._id,
                vendorId: userId,
                category: "Food",
                name: "Roti Prata",
                description: "3 pieces of Plain Roti prata with curry source",
                price: 3.00,
                imageSource: "https://s3-media1.fl.yelpcdn.com/bphoto/4HQou29lLMxHe3RHtl9K3w/ls.jpg"
              },(err, res) => {
                Meteor.call('vendor.addMenuItem', {
                  menuId: menu._id,
                  vendorId: userId,
                  category: "Food",
                  name: "Tom Yum Noodle soup",
                  description: "with seafood",
                  price: 5.00,
                  imageSource: "http://6998ec567c1ba0e4d1df-35f536080503e7803921781ced385773.r35.cf2.rackcdn.com/styles/250square/rcf/9599c3fdda52393c7501e6b9f6838e3b.jpg?itok=X0mBlnEW"
                }, (err, res) => {
                  thenFunction();
                });
              });
            });
          });
        });
      });
    });
  });
}

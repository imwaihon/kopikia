import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import { Meteor } from 'meteor/meteor';

// TODO(waihon): Eventually switch this over to server side handling.
import { Vendors, Orders, Menus } from '/lib/collections.js'

import './menus.html';

// Create a local mongo collection for reactiveness.
var LocalSelectedItems = new Mongo.Collection(null);

Template.vendorMenu.events({
  'click #createMenu': function(event) {
    event.preventDefault();
    magicallyCreateFilledMenuThen(function() {
      FlowRouter.go('/menu');
    });
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

  $('#posCards')
  .css('height', selectedItemsHeight);

  $('#selectedItemsList')
  .css('height', selectedItemsHeight * 0.75)
  .css('overflow', 'scroll');

  // Allows for the right bar to 'stick' and not scroll with the rest of the
  // cards.
  $('.ui.sticky')
  .sticky({
    context: '#posCards'
  });
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
      return '$' + items.map( el => el.price )
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
      name: "Milo",
      description: "milo",
      price: 1.50,
      imageSource: "http://i3.mirror.co.uk/incoming/article6485860.ece/ALTERNATES/s615b/Coffee.jpg"
    }, (err, res) => {
      Meteor.call('vendor.addMenuItem', {
        menuId: menu._id,
        vendorId: userId,
        category: "Drinks",
        name: "Coffee",
        description: "coffee",
        price: 1.20,
        imageSource: "http://gallery.yopriceville.com/var/resizes/Free-Clipart-Pictures/Coffee-PNG/Coffee_Cup_with_Sugar_Cubes.png?m=1399672800"
      }, (err, res) => {
        Meteor.call('vendor.addMenuItem', {
          menuId: menu._id,
          vendorId: userId,
          category: "Drinks",
          name: "Milk Tea",
          description: "milk tea",
          price: 1.30,
          imageSource: "https://static.menutabapp.com/img/original/2015/01/20/21222d4408377e8a6c1a9871f7050d75.jpeg"
        }, (err, res) => {
          Meteor.call('vendor.addMenuItem', {
            menuId: menu._id,
            vendorId: userId,
            category: "Drinks",
            name: "Bandung",
            description: "bandung",
            price: 1.70,
            imageSource: "https://upload.wikimedia.org/wikipedia/commons/a/ab/Bandung_Drinks.jpg"
          }, (err, res) => {
            thenFunction();
          });
        });
      });
    });
  });
}

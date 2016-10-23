import { Meteor } from 'meteor/meteor';
import { Vendors, Orders, Menus } from '/lib/collections.js'

Meteor.startup(() => {
  // code to run on server at startup

  // Remove all data from mongoDB at startup
  Vendors.remove({});
  Orders.remove({});
  Menus.remove({});
});

Meteor.methods({
  // TODO(waihon): disallow creating more menus if already 1 exist.
  'vendor.createMenu'({ name }) {
    const menuState = {
      vendorId: this.userId,
      name: name,
      items: []
    };

    Menus.insert(menuState);

    return { success: true };
  },

  'vendor.addMenuItem'({ menuId, category, name, description, price, imageSource }) {
    const menuItemState = {
      itemId: new Meteor.Collection.ObjectID(),
      vendorId: this.userId,
      menuId: menuId,
      category: category,
      name: name,
      description: description,
      price: price,
      imageSource: imageSource
    };

    Menus.update(
      {
        _id: menuId,
        vendorId: this.userId,
      },
      {
        $push: {
          "items": menuItemState
        }
      }
    );

    return { success: true };
  },

  'vendor.editMenuItem'({ itemId, menuId, category, name, description, price }) {
    const menuItemState = {
      vendorId: this.userId,
      menuId: menuId,
      category: category,
      name: name,
      description: description,
      price: price
    };

    Menus.update(
      {
        _id: menuId,
        vendorId: this.userId,
        "items.itemId": itemId
      },
      {
        $set: menuItemState
      }
    );

    return { success: true };
  },

  // TODO(waihon): Eventually do some caluculations server-sided.
  'vendor.makeOrder'({ menuId, vendorId, userId, items }) {
    var totalPrice = 0;
    for (var i=0; i<items.length; i++) {
      totalPrice += items[i].price;
    }
    const orderState = {
      menuId: menuId,
      vendorId: vendorId,
      userId: this.userId,
      orderTime: Date.now(),
      items: items,
      isVendor: true,
      totalPrice: totalPrice,
      paymentResolved: true
    };

    Orders.insert(orderState);

    return orderState;
  },

  'customer.makeOrder'({ menuId, vendorId, userId, items, totalPrice }) {
    const orderState = {
      menuId: menuId,
      vendorId: vendorId,
      userId: this.userId,
      orderTime: Date.now(),
      items: items,
      isVendor: false,
      totalPrice: totalPrice,
      paymentResolved: true
    };

    Orders.insert(orderState);
  },

  'customer.checkout'() {

  },

  'vendor.analytics.'() {

  }
});

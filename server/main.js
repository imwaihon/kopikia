import { Meteor } from 'meteor/meteor';
import { Vendors, Orders, Menus } from '/lib/collections.js'

Meteor.startup(() => {
  // code to run on server at startup
});

Meteor.methods({
  'vendor.createMenu'({ name }) {
    const menuState = {
      vendorId: this.userId,
      name: name,
      items: []
    };

    Menus.insert(menuState);

    return { success: true };
  },

  'vendor.addMenuItem'({ menuId, category, name, description, price }) {
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
      categoryId: categoryId,
      name: name,
      description: description,
      price: price
    };

    Menus.update(
      {
        _id: menuId,
        vendorId: this.userId,
        "items._id": itemId
      },
      {
        $set: menuItemState
      }
    );
  },
  'vendor.makeOrder'({ menuId, fields }) {

  },

  'customer.makeOrder'({ menuId, fields }) {

  },
  'customer.checkout'() {

  },

  'vendor.analytics.'() {

  }
});

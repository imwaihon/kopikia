import { Mongo } from 'meteor/mongo';

export const Vendors = new Mongo.Collection('vendors');
export const Orders = new Mongo.Collection('orders');
export const Menus = new Mongo.Collection('menus');

VendorsSchema = new SimpleSchema({
  name: {
    type: String
  },
  userId: {
    type: String
  }
});

Vendors.schema = VendorsSchema;

ItemsSchema = new SimpleSchema({
  vendorId: {
    type: String
  },
  menuId: {
    type: String
  },
  category: {
    type: String
  },
  name: {
    type: String
  },
  description: {
    type: String
  },
  price: {
    type: Number
  }
});

MenusSchema = new SimpleSchema({
  vendorId: {
    type: String
  },
  name: {
    type: String
  },
  items: {
    type: [ItemsSchema]
  }
});

Menus.schema = MenusSchema;

OrdersSchema = new SimpleSchema({
  orderNum: {
    type: String
  },
  menuId: {
    type: String
  },
  vendorId: {
    type: String
  },
  userId: {
    type: String
  },
  orderTime: {
    type: Date
  },
  items: {
    type: [ItemsSchema]
  },
  isManual: {
    type: Boolean
  },
  totalPrice: {
    type: Number
  }
});

Orders.schema = OrdersSchema;

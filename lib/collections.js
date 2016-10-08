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
  name: {
    type: String
  },
  description: {
    type: String
  },
  category: {
    type: String
  },
  price: {
    type: Number
  }
});

CategorySchema = new SimpleSchema({
  category: {
    type: String
  },
  items: {
    type: [ItemsSchema]
  }
});

MenusSchema = new SimpleSchema({
  vendorId: {
    type: String
  },
  categories: {
    type: [CategorySchema]
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

import { Mongo } from 'meteor/mongo';

export const Vendors = new Mongo.Collection('vendors');
export const Orders = new Mongo.Collection('orders');
export const Menus = new Mongo.Collection('menus');
export const Customers = new Mongo.Collection('customers')


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
  },
  imageSource: {
    type: String
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
  isVendor: {
    type: Boolean
  },
  totalPrice: {
    type: Number
  },
  paymentResolved: {
    type: Boolean
  }
});

Orders.schema = OrdersSchema;


CustomersSchema = new SimpleSchema({
  firstName: {
    type: String
  },
  sirName: {
    type: String
  },
  userId: {
    type: String
  },
  email: {
    type: String
  },
  firstVisitDate: {
    type: Date
  },
  latestVisitDate: {
    type: Date
  },
  numVisits: {
    type: Number
  },
  numRevenue: {
    type: Boolean
  }
});

Customers.schema = CustomersSchema;

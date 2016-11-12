import { Meteor } from 'meteor/meteor';
import { Vendors, Orders, Menus, Customers } from '/lib/collections.js'
import moment from 'moment';

Meteor.startup(() => {
  // code to run on server at startup

  // Remove all data from mongoDB at startup
  Vendors.remove({});
  Orders.remove({});
  Menus.remove({});

  // Populate with Test Data and Account: test-dev@kopikia.com
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

  'vendor.addMenuItem'({ menuId, name, description, price, imageSource }) {
    const menuItemState = {
      itemId: new Meteor.Collection.ObjectID(),
      vendorId: this.userId,
      menuId: menuId,
      name: name,
      description: description,
      price: price,
      quantity: 1,
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

  'vendor.editMenuItem'({ itemId, menuId, name, description, price }) {
    const menuItemState = {
      vendorId: this.userId,
      menuId: menuId,
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
        $set: {
          "items.$.name": menuItemState.name,
          "items.$.description": menuItemState.description,
          "items.$.price": menuItemState.price,
        }
      }
    );

    return { success: true };
  },

  'vendor.deleteMenuItem'({ itemId, menuId }) {
    Menus.update(
      {
        _id: menuId,
        vendorId: this.userId,
      },
      { $pull: { items: { itemId: itemId } } }
    );

    return { success: true };
  },

  // TODO(waihon): Eventually do some caluculations server-sided.
  'vendor.makeOrder'({ menuId, vendorId, userId, items }) {
    var totalPrice = 0;
    for (var i=0; i<items.length; i++) {
      totalPrice += items[i].price * items[i].quantity;
      // TODO(waihon): Don't do this in real life. Store as 1000s or use Currency Object.
      items[i].totalPrice = (items[i].price * items[i].quantity).toFixed(2);
    }
    const orderState = {
      menuId: menuId,
      vendorId: vendorId,
      userId: this.userId,
      orderTime: moment().toDate(),
      items: items,
      isVendor: true,
      totalPrice: totalPrice,
      orderResolved: false
    };

    Orders.insert(orderState);

    return orderState;
  },

  'customer.makeOrder'({ menuId, vendorId, userId, items, totalPrice }) {
    const orderState = {
      menuId: menuId,
      vendorId: vendorId,
      userId: this.userId,
      orderTime: moment().toDate(),
      items: items,
      isVendor: false,
      totalPrice: totalPrice,
      orderResolved: false
    };

    Orders.insert(orderState);

    return orderState;
  },

  'vendor.completeOrder'({ vendorId, orderId }) {
    Orders.update({
      _id: orderId,
      vendorId: vendorId,
    },
    { $set: { orderResolved: true } });

    return { success: true };
  },

  'vendor.analytics.getSalesToday'({ vendorId }) {
    var start = moment().utcOffset('+08:00').startOf('day').toDate();
    var end = moment().utcOffset('+08:00').endOf('day').toDate();

    var menuId = Menus.findOne({ vendorId: vendorId})._id;

    var aggregate = Orders.aggregate([
      {$match:{ 'menuId': menuId, 'orderTime': {$gte:start, $lt:end} }},
      {$project: { "orderTime":1, "totalPrice": 1, }},
      {$group:{ _id: { $hour : "$orderTime" }, sum_price: {$sum: "$totalPrice"}, count: {$sum: 1} }}
    ]);

    return {result: aggregate};
  },

  'vendor.analytics.metric.todayRevenue'({ vendorId }) {
    // this function will return the revenue made so far in this working day
    var start = moment().utcOffset('+08:00').startOf('day').toDate();
    var end = moment().utcOffset('+08:00').endOf('day').toDate();

    today_orders = Orders.find({
      'vendorId': vendorId,
      'orderTime': {$gte:start, $lt:end}
    }).fetch();

    // total revenue
    var total_revenue = 0;
    for (i=0; i < today_orders.length; i++){
      total_revenue = total_revenue + today_orders[i]["totalPrice"];
    }
    return total_revenue.toFixed(2);
  },

  'vendor.analytics.metric.todayCustomers'({ vendorId }) {
    // number of customers today
    // this function will return the revenue made so far in this working day
    var start = moment().utcOffset('+08:00').startOf('day').toDate();
    var end = moment().utcOffset('+08:00').endOf('day').toDate();

    today_orders = Orders.find({
      'vendorId': vendorId,
      'orderTime': {$gte:start, $lt:end}
    }).fetch();

    return today_orders.length;
  },

  'vendor.analytics.metric.todayOnlineCustomers'({ vendorId }) {
    // number of online customers today
    // this function will return the revenue made so far in this working day
    var start = moment().utcOffset('+08:00').startOf('day').toDate();
    var end = moment().utcOffset('+08:00').endOf('day').toDate();

    today_orders = Orders.find({
      'vendorId': vendorId,
      'orderTime': {$gte:start, $lt:end},
      'isVendor': false
    }).fetch();

    return today_orders.length;
  },

  'vendor.analytics.menuBreakdown'({ vendorId }) {
    // Last 4 weeks, pie chart
    var start = moment().utcOffset('+08:00').startOf('day').subtract(4,'w').toDate();
    var end = moment().utcOffset('+08:00').startOf('day').toDate();

    var aggregate = Orders.aggregate([
      {$match:{ 'vendorId': vendorId, 'orderTime': {$gte:start, $lt:end} }},
      {$unwind: '$items'},
      {$group:{ _id: "$items.name", sum_price: {$sum: "$items.totalPrice"} }},
      {$sort: { sum_price: -1 } }
    ]);

    return { result: aggregate };
  },

  'vendor.analytics.getSalesLastFourWeeks'({ vendorId }) {
    // get sales volume information for past 4 weeks
    var start = moment().utcOffset('+08:00').startOf('day').subtract(4,'w').toDate();
    var end = moment().utcOffset('+08:00').startOf('day').toDate();

    var aggregate = Orders.aggregate([
      {$match:{ 'vendorId': vendorId, 'orderTime': {$gte:start, $lt:end} }},
      {$project: { "orderTime": 1, "totalPrice": 1, }},
      {$group: { _id: { $dayOfYear : "$orderTime" }, sum_price: {$sum: "$totalPrice"}, count: {$sum: 1} }},
      {$sort: { "orderTime": 1 }}
    ]);

    return {result: aggregate};
  },
});

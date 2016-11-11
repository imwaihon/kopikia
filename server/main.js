import { Meteor } from 'meteor/meteor';
import { Vendors, Orders, Menus, Customers } from '/lib/collections.js'
import moment from 'moment';

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
      orderTime: moment().toDate(),
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
      orderTime: moment().toDate(),
      items: items,
      isVendor: false,
      totalPrice: totalPrice,
      paymentResolved: true
    };

    Orders.insert(orderState);
  },

  'customer.checkout'() {

  },

  'vendor.analytics.getSalesToday'({ vendorId }) {
    var start = moment().utcOffset('+08:00').startOf('day').toDate(); // set to 12:00 am today SGT
    var end = moment().utcOffset('+08:00').endOf('day').toDate(); // set to 23:59 pm today SGT

    var menuId = Menus.findOne({ vendorId: vendorId})._id;

    var aggregate = Orders.aggregate([
      {$match:{ 'menuId': menuId, 'orderTime': {$gte:start, $lt:end} }},
      {$project: { "orderTime":1, "totalPrice": 1, }},
      {$group:{ _id: { $hour : "$orderTime" }, sum_price: {$sum: "$totalPrice"}, count: {$sum: 1} }}
    ]);

    return {result: aggregate};
  },

  'vendor.analytics.getSaleTrend'({ start, end, menu, scale, unit }) {
    // should return result in format {menuId: [number of order]}
    // extract the date range into sub range
    date_range = [];
    start = moment(start);
    end = moment(end);
    temp_start = start;
    while (temp_start < end) {
      date_range.push([temp_start, temp_start.add(scale, unit)]);
      temp_start = temp_start.add(scale, unit);
    }

    // extract the menu record based on date range
    temp_result = {};
    var menuId;
    for (menuId in menu) {
      temp_result[menuId] = Orders.find({'menuId' : menuId, 'orderTime' : {$gte:start, $lte:end}}, {'orderNum':1, 'orderTime':1}).fetch();
    }

    // finalize order amount based on sub range
    result = {};
    var menuId;
    for (menuId in menu) {
      result[menuId] = new Uint8Array(date_range.length);

      var item;
      for (item in temp_result['menuId']){
        for (i=0; i<date_range.length; i++){
          if (moment(item['orderTime']) < date_range[i][1] && moment(item['orderTime'] > date_range[i][0])) {
            result[menuId] = result[menuId] + item['orderNum'];
          }
        }
      }
    }

    return result;

  },

  'vendor.analytics.getMenuServings'({ start, end, menu }) {
    temp_result = {};
    var menuId;
    for (menuId in menu) {
      temp_result[menuId] = Orders.find({'menuId' : menuId, 'orderTime' : {$gte:start, $lte:end}}, {'orderNum':1}).fetch();
    }

    result = {};
    var menuId;
    total = 0
    for (menuId in menu) {
      result[menuId] = 0;
      for (i=0;i<temp_result[menuId].length;i++){
        result[menuId] = result[menuId] + temp_result[menuId][i]['orderNum'];
      }

      total = total + result[menuId];
    }

    return result;
  },

  'vendor.analytics.customerProfile'({ start, end, indicator }) {
    // this function is to extract the customers' demographic data
    // such as the revenue the customers contributed, time of visits
    temp_result = {};
    if (start == null || end == null) {
      query = Customers.find({}).fetch();
    } else {
      query = Customers.find({'firstVisitDate' : { $gte : start, $lte : end }}).fetch();
    }

    if ( indicator == 'revenue' ){
      result = {};
      var item;
      for (item in query) {
        result[item['userId']] = item['numRevenue'];
      }
    } else if (indicator == 'visits'){
      result = {};
      var item;
      for (item in query) {
        result[item['userId']] = item['numVisits'];
      }
    } else {
      result = {};
    }

    return result;
  },

  'vendor.analytics.today_revenue'({ vendorId }){
    // this funciton will return the revenue made so far in this working day
    var date = new Date();

    date.setHours(0,0,0,0);
    var start = date.getTime();

    today_orders = Orders.find({'vendorId' : vendorId, 'orderTime' : {$gte:start}}).fetch();

    // total revenue
    var total_revenue = 0;
    for (i=0; i < today_orders.length; i++){
      total_revenue = total_revenue + today_orders[i]["totalPrice"];
    }
    return total_revenue;
  },

  'vendor.analytics.today_customers'({ vendorId }){
    // number of customers today
    var date = new Date();
    date.setHours(0,0,0,0);
    var start = date.getTime();

    today_orders = Orders.find({'vendorId' : vendorId, 'orderTime' : {$gte:start}}).fetch();

    return today_orders.length;
  },

  'vendor.analytics.online_customers'({ vendorId }){
    // number of online customers today
    var date = new Date();
    date.setHours(0,0,0,0);
    var start = date.getTime();

    today_orders = Orders.find({'vendorId' : vendorId, 'orderTime' : {$gte:start}, 'isVendor':false}).fetch();

    return today_orders.length;
  }
});

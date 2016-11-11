import { Meteor } from 'meteor/meteor';
import { Vendors, Orders, Menus, Customers } from '/lib/collections.js'

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

  'vendor.analytics.hot_stats'({ vendorId, stat_type }){
    // this funciton will return the revenue made so far in this working day
    var date = new Date();
    var dd = date.getDate();
    var mm = date.getMonth();
    var year = date.getFullYear();
    var start = new Date(year, mm, dd);

    today_orders = Orders.find({'vendorId' : vendorId, 'orderTime' : {$gte:moment(start)}}).fetch();

    if ( stat_type == 1 ){
      // total revenue
      var total_revenue = 0;
      var order;
      for ( order in today_orders ){
        total_revenue = total_revenue + order['totalPrice'];
      }
      return total_revenue;
    } else if ( stat_type == 2 ){
      // best dish
      var dist = {};
      var order;
      for ( order in today_orders ){
        var items = order['items'];
        for (i=0; i<items.length; i++){
          if (item['name'] in dist){
            dist[item['name']] += 1;
          } else {
            dist[item['name']] = 1;
          }
        }
      }
      var max_order = 0;
      var max_order_dish;
      for (var key in dist){
        if (dist[key] > max_order){
          max_order = dist[key];
          max_order_dish = key;
        }
      }
      
      return max_order_dish;
    } else {
      // number of customers
      return orders.length;
    }
  }
});





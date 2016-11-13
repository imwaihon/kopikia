import { Meteor } from 'meteor/meteor';
import { Vendors, Orders, Menus, Customers } from '/lib/collections.js'
import { Accounts } from 'meteor/accounts-base'
import moment from 'moment';

Meteor.startup(() => {
  // code to run on server at startup

  // Remove all data from mongoDB at startup
  Vendors.remove({});
  Orders.remove({});
  Menus.remove({});
  Meteor.users.remove({});

  // Populate with Test Data and Account: testdev@kopikia.com
  var testdataid = Accounts.createUser({
    username: 'testdev-kopikia',
    email: 'testdev@kopikia.com',
    password: 'test123'
  });

  populateTestData(testdataid);
});

Meteor.methods({
  'vendor.addMenuItem'({ menuId, name, description, price, imageSource }) {
    // TODO(waihon): disallow creating more menus if already 1 exist.
    var exist = Menus.findOne({
      vendorId: this.userId,
    });

    if (!exist) {
      const menuState = {
        vendorId: this.userId,
        items: []
      };

      Menus.insert(menuState);

      var newlyCreated = Menus.findOne({
        vendorId: this.userId,
      });

      menuId = newlyCreated._id;
    }

    const menuItemState = {
      itemId: new Meteor.Collection.ObjectID(),
      vendorId: this.userId,
      menuId: menuId,
      name: name,
      description: description,
      price: Number(price),
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

    return { success: true, menuId: menuId };
  },

  'vendor.editMenuItem'({ itemId, menuId, name, description, price, imageSource }) {
    const menuItemState = {
      vendorId: this.userId,
      menuId: menuId,
      name: name,
      description: description,
      price: Number(price),
      imageSource: imageSource
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
          "items.$.imageSource": menuItemState.imageSource
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
      items[i].totalPrice = Number((items[i].price * items[i].quantity).toFixed(2));
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

function populateTestData(userId) {

  // Create Menu
  const menuState = {
    vendorId: userId,
    items: []
  };
  Menus.insert(menuState);

  var menu = Menus.findOne({
    vendorId: userId
  });

  // Add hard-coded example items with pictures
  var icedtehcino =
  {
    itemId: new Meteor.Collection.ObjectID(),
    quantity: 1,
    menuId: menu._id,
    vendorId: userId,
    name: "Ice Teh Cino",
    description: "Iced Teh Cino",
    price: 1.80,
    imageSource: "http://i.imgur.com/tk5MEME.jpg"
  };

  var milo =
  {
    itemId: new Meteor.Collection.ObjectID(),
    quantity: 1,
    menuId: menu._id,
    vendorId: userId,
    name: "Milo Dinosaur",
    description: "Milo Dinosaur from Singapore with Ice",
    price: 1.80,
    imageSource: "http://i.imgur.com/ExF1Z9n.jpg?1"
  };

  var kuih =
  {
    itemId: new Meteor.Collection.ObjectID(),
    quantity: 1,
    menuId: menu._id,
    vendorId: userId,
    name: "Kuih Ketayap",
    description: "Kuih",
    price: 1.30,
    imageSource: "http://i.imgur.com/kMsCjl1.jpg"
  };

  var lemontea =
  {
    itemId: new Meteor.Collection.ObjectID(),
    quantity: 1,
    menuId: menu._id,
    vendorId: userId,
    name: "Ice Lemon Tea",
    description: "Ice Lemon Tea",
    price: 1.30,
    imageSource: "https://3.imimg.com/data3/TU/AV/MY-4000560/ice-tea-250x250.jpg"
  };

  var kayatoast = {
    itemId: new Meteor.Collection.ObjectID(),
    quantity: 1,
    menuId: menu._id,
    vendorId: userId,
    name: "Kaya Toast",
    description: "Nonya Kaya, 2 pcs",
    price: 1.80,
    imageSource: "http://ukcdn.ar-cdn.com/recipes/originalxl/e0fcd2d0-1105-46f5-b65c-f7d118ee8969.jpg"
  };

  var nasigoreng = {
    itemId: new Meteor.Collection.ObjectID(),
    quantity: 1,
    menuId: menu._id,
    vendorId: userId,
    name: "Nasi Goreng",
    description: "Rice with Chicken",
    price: 3.00,
    imageSource: "http://i.imgur.com/UJUDxCP.jpg"
  };

  var meerebus = {
    itemId: new Meteor.Collection.ObjectID(),
    quantity: 1,
    menuId: menu._id,
    vendorId: userId,
    name: "Mee Rebus",
    description: "Traditional Malay noodles with gravy",
    price: 3.50,
    imageSource: "http://i.imgur.com/MKV9ri7.jpg"
  };

  var nasilemak = {
    itemId: new Meteor.Collection.ObjectID(),
    quantity: 1,
    menuId: menu._id,
    vendorId: userId,
    name: "Nasi Lemak",
    description: "Traditional Malay rice",
    price: 3.00,
    imageSource: "http://i.imgur.com/Fom5dlO.jpg"
  };

  var satay = {
    itemId: new Meteor.Collection.ObjectID(),
    quantity: 1,
    menuId: menu._id,
    vendorId: userId,
    name: "Satay",
    description: "Traditional Malay Skewers",
    price: 1.50,
    imageSource: "http://i.imgur.com/E1j0PZa.jpg"
  };

  var tauhugoreng = {
    itemId: new Meteor.Collection.ObjectID(),
    quantity: 1,
    menuId: menu._id,
    vendorId: userId,
    name: "Tauhu Goreng",
    description: "",
    price: 1.70,
    imageSource: "http://i.imgur.com/fPSr8RN.jpg"
  };

  // set variables for convenience
  var menuId = menu._id;

  Menus.update({_id: menuId,vendorId: userId,},{$push: {"items": milo}});
  Menus.update({_id: menuId,vendorId: userId,},{$push: {"items": kuih}});
  Menus.update({_id: menuId,vendorId: userId,},{$push: {"items": lemontea}});
  Menus.update({_id: menuId,vendorId: userId,},{$push: {"items": kayatoast}});
  Menus.update({_id: menuId,vendorId: userId,},{$push: {"items": nasigoreng}});
  Menus.update({_id: menuId,vendorId: userId,},{$push: {"items": meerebus}});
  Menus.update({_id: menuId,vendorId: userId,},{$push: {"items": nasilemak}});
  Menus.update({_id: menuId,vendorId: userId,},{$push: {"items": satay}});
  Menus.update({_id: menuId,vendorId: userId,},{$push: {"items": tauhugoreng}});

  // Helper function to create lots of dummy/test orders.
  function makeTestOrder(menuId, vendorId, time, numberOfTimes, isOnline, isResolved, items) {
    var totalPrice = 0;
    for (var i=0; i<items.length; i++) {
      totalPrice += items[i].price * 1; // set quantity to 1 for testing.
      // TODO(waihon): Again, Don't do this in real life. Store as 1000s or use Currency Object.
      items[i].totalPrice = Number((items[i].price * items[i].quantity).toFixed(2));
    }

    for (var i=0; i<numberOfTimes; i++) {
      const orderState = {
        menuId: menuId,
        vendorId: vendorId,
        userId: vendorId,
        orderTime: time,
        items: items,
        isVendor: !isOnline,
        totalPrice: totalPrice,
        orderResolved: isResolved // usually true
      };

      Orders.insert(orderState);
    }
  }
  // 'Today''s data
  makeTestOrder(menuId, userId, moment().utcOffset('+08:00').startOf('day').add(7, 'h').toDate(), 5, true, true, [milo, lemontea]);
  makeTestOrder(menuId, userId, moment().utcOffset('+08:00').startOf('day').add(8, 'h').toDate(), 5, true, true, [milo, lemontea]);
  makeTestOrder(menuId, userId, moment().utcOffset('+08:00').startOf('day').add(9, 'h').toDate(), 5, true, true, [milo, lemontea]);
  makeTestOrder(menuId, userId, moment().utcOffset('+08:00').startOf('day').add(10, 'h').toDate(), 5, true, true, [milo, lemontea]);
  makeTestOrder(menuId, userId, moment().utcOffset('+08:00').startOf('day').add(11, 'h').toDate(), 5, true, true, [milo, lemontea]);
  makeTestOrder(menuId, userId, moment().utcOffset('+08:00').startOf('day').add(12, 'h').toDate(), 5, true, true, [milo, lemontea]);
  makeTestOrder(menuId, userId, moment().utcOffset('+08:00').startOf('day').add(13, 'h').toDate(), 5, true, true, [milo, lemontea]);
  makeTestOrder(menuId, userId, moment().utcOffset('+08:00').startOf('day').add(14, 'h').toDate(), 5, true, true, [milo, lemontea]);
  makeTestOrder(menuId, userId, moment().utcOffset('+08:00').startOf('day').add(15, 'h').toDate(), 5, true, true, [milo, lemontea]);
  makeTestOrder(menuId, userId, moment().utcOffset('+08:00').startOf('day').add(16, 'h').toDate(), 5, true, true, [milo, lemontea]);
  makeTestOrder(menuId, userId, moment().utcOffset('+08:00').startOf('day').add(17, 'h').toDate(), 5, true, true, [milo, lemontea]);
  makeTestOrder(menuId, userId, moment().utcOffset('+08:00').startOf('day').add(18, 'h').toDate(), 5, true, true, [milo, lemontea]);
  makeTestOrder(menuId, userId, moment().utcOffset('+08:00').startOf('day').add(19, 'h').toDate(), 5, true, true, [milo, lemontea]);
  makeTestOrder(menuId, userId, moment().utcOffset('+08:00').startOf('day').add(20, 'h').toDate(), 5, true, true, [milo, lemontea]);
  makeTestOrder(menuId, userId, moment().utcOffset('+08:00').startOf('day').add(21, 'h').toDate(), 5, true, true, [milo, lemontea]);
  makeTestOrder(menuId, userId, moment().utcOffset('+08:00').startOf('day').add(22, 'h').toDate(), 2, true, false, [milo, lemontea]);

  makeTestOrder(menuId, userId, moment().utcOffset('+08:00').startOf('day').add(7, 'h').toDate(), 5, false, true, [kuih, meerebus, nasigoreng]);
  makeTestOrder(menuId, userId, moment().utcOffset('+08:00').startOf('day').add(8, 'h').toDate(), 5, false, true, [kuih, meerebus, nasigoreng]);
  makeTestOrder(menuId, userId, moment().utcOffset('+08:00').startOf('day').add(9, 'h').toDate(), 5, false, true, [kuih, meerebus, nasigoreng]);
  makeTestOrder(menuId, userId, moment().utcOffset('+08:00').startOf('day').add(10, 'h').toDate(), 7, false, true, [kuih, meerebus, nasigoreng]);
  makeTestOrder(menuId, userId, moment().utcOffset('+08:00').startOf('day').add(11, 'h').toDate(), 9, false, true, [kuih, meerebus, nasigoreng]);
  makeTestOrder(menuId, userId, moment().utcOffset('+08:00').startOf('day').add(12, 'h').toDate(), 12, false, true, [kuih, meerebus, nasigoreng]);
  makeTestOrder(menuId, userId, moment().utcOffset('+08:00').startOf('day').add(13, 'h').toDate(), 11, false, true, [kuih, meerebus, nasigoreng]);
  makeTestOrder(menuId, userId, moment().utcOffset('+08:00').startOf('day').add(14, 'h').toDate(), 10, false, true, [kuih, meerebus, nasigoreng]);
  makeTestOrder(menuId, userId, moment().utcOffset('+08:00').startOf('day').add(15, 'h').toDate(), 8, false, true, [kuih, meerebus, nasigoreng]);
  makeTestOrder(menuId, userId, moment().utcOffset('+08:00').startOf('day').add(16, 'h').toDate(), 7, false, true, [kuih, meerebus, nasigoreng]);
  makeTestOrder(menuId, userId, moment().utcOffset('+08:00').startOf('day').add(17, 'h').toDate(), 6, false, true, [kuih, meerebus, nasigoreng]);
  makeTestOrder(menuId, userId, moment().utcOffset('+08:00').startOf('day').add(18, 'h').toDate(), 9, false, true, [kuih, meerebus, nasigoreng]);
  makeTestOrder(menuId, userId, moment().utcOffset('+08:00').startOf('day').add(19, 'h').toDate(), 14, false, true, [kuih, meerebus, nasigoreng]);
  makeTestOrder(menuId, userId, moment().utcOffset('+08:00').startOf('day').add(20, 'h').toDate(), 16, false, true, [kuih, meerebus, nasigoreng]);
  makeTestOrder(menuId, userId, moment().utcOffset('+08:00').startOf('day').add(21, 'h').toDate(), 4, false, true, [kuih, meerebus, nasigoreng]);
  makeTestOrder(menuId, userId, moment().utcOffset('+08:00').startOf('day').add(22, 'h').toDate(), 2, false, false, [kuih, meerebus, nasigoreng]);


  // 'Historical' data, I will just use 1 time since it doesnt affect our graphs. Give a varied distribution.
  for (var i=1; i<=28; i++) {
    var variation = Math.floor((Math.random() * 20) + 1);
    makeTestOrder(menuId, userId, moment().utcOffset('+08:00').startOf('day').subtract(i, 'd').add(7, 'h').toDate(), 45+variation, true, true, [milo]);
    makeTestOrder(menuId, userId, moment().utcOffset('+08:00').startOf('day').subtract(i, 'd').add(7, 'h').toDate(), 60+variation, true, true, [kuih]);
    makeTestOrder(menuId, userId, moment().utcOffset('+08:00').startOf('day').subtract(i, 'd').add(7, 'h').toDate(), 35+variation, false, true, [meerebus]);
    makeTestOrder(menuId, userId, moment().utcOffset('+08:00').startOf('day').subtract(i, 'd').add(7, 'h').toDate(), 25+variation, false, true, [nasigoreng]);
    makeTestOrder(menuId, userId, moment().utcOffset('+08:00').startOf('day').subtract(i, 'd').add(7, 'h').toDate(), 50+variation, false, true, [kayatoast]);
    makeTestOrder(menuId, userId, moment().utcOffset('+08:00').startOf('day').subtract(i, 'd').add(7, 'h').toDate(), 43+variation, false, true, [lemontea]);
  }
}

// Routes for dynamically loading the app.
FlowRouter.route( '/', {
  action: function() {
    Tracker.autorun(function() {
      if (!Meteor.userId()) {
        BlazeLayout.render( 'appLayout', {
          main: 'auth',
        });
      } else {
        // TODO(waihon): Render between customer/vendor mode.
        BlazeLayout.render( 'appLayout', {
          main: 'vendorHome',
        });
      }
    });
  },
});

FlowRouter.route( '/menu', {
  action: function() {
    Tracker.autorun(function() {
      if (!Meteor.userId()) {
        BlazeLayout.render( 'appLayout', {
          main: 'auth',
        });
      } else {
        // TODO(waihon): Render between customer/vendor mode.
        BlazeLayout.render( 'appLayout', {
          main: 'vendorMenu',
        });
      }
    });
  },
});

FlowRouter.route( '/dashboard', {
  action: function() {
    Tracker.autorun(function() {
      if (!Meteor.userId()) {
        BlazeLayout.render( 'appLayout', {
          main: 'auth',
        });
      } else {
        // TODO(waihon): Render between customer/vendor mode.
        BlazeLayout.render( 'appLayout', {
          main: 'vendorDashboard',
        });
      }
    });
  },
});

FlowRouter.route( '/checkout', {
  action: function() {
    Tracker.autorun(function() {
      if (!Meteor.userId()) {
        BlazeLayout.render( 'appLayout', {
          main: 'auth',
        });
      } else {
        // TODO(waihon): Render between customer/vendor mode.
        BlazeLayout.render( 'appLayout', {
          main: 'customerCheckout',
        });
      }
    });
  },
});

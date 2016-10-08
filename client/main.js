import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import { Meteor } from 'meteor/meteor';

import './main.html';


Template.home.events({
    'click .logout': function(event){
        event.preventDefault();
        Meteor.logout();
    }
});
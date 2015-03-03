
var _ = require('underscore');
var moment = require('moment');
var superagent = require('superagent');
var spawn = require('child_process').spawn;
var temporal = require('temporal');

function playAlert() {
  spawn('powershell.exe',['-c', '(New-Object', 'Media.SoundPlayer', '"C:\\Windows\\Media\\Alarm01.wav"', ').PlaySync()']);
}

function logOutput(msg) {
  var now = moment().format('YYYY-MM-DD HH:mm:ss');
  console.log(now + ' ' + msg);
}

function updateDeals(current_deals, new_deals) {
  if(new_deals.seasoned.id !== current_deals.seasoned.id) {
    logOutput('New Seasoned Deal -> ' + new_deals.seasoned.title);
    current_deals.seasoned = new_deals.seasoned;
  }
  
  if(new_deals.fresh.id !== current_deals.fresh.id) {
    logOutput('New Fresh Deal -> ' + new_deals.fresh.title);
    current_deals.fresh = new_deals.fresh;
  }
}

function alertForWatchList(deals, watch_list) {
  var seasonedAlert = false;
  var freshAlert = false;

  _.each(watch_list, function(elem) {
    seasonedAlert = seasonedAlert || deals.seasoned.title.toLowerCase().indexOf(elem.toLowerCase()) >= 0;
    freshAlert = freshAlert || deals.fresh.title.toLowerCase().indexOf(elem.toLowerCase()) >= 0;
  });

  if(seasonedAlert) {
    logOutput('Seasoned deal is on watch list!'); 
  } 
  
  if(freshAlert) {
    logOutput('Fresh deal is on watch list!');
  }

  if(seasonedAlert || freshAlert) {
    playAlert();
  }
}

function fetchDeals(current_deals, watch_list) {
  superagent
    .get('http://www.gog.com/doublesomnia/getdeals')
    .set('Accept', 'application/json')
    .end(function(res) {
      if(res.ok) {
        var new_deals = { 
          seasoned: res.body.oldschool,
          fresh: res.body.fresh
        };

        updateDeals(current_deals, new_deals);
        alertForWatchList(current_deals, watch_list);

      } else {
        if(res.text.indexOf('overcapacity.jpg') > 0) {
          logOutput('Over Capacity!');
        } else {
          logOutput('Error! ' + res.text);
        }
      }
    });
}


function pollDeals(watch_list) {
  var watch_deals = watch_list || [];
  var current_deals = {
    seasoned: { id: 0 }, 
    fresh: { id: 0 }
  }

  fetchDeals(current_deals, watch_deals);
  temporal.loop(90000, function() {
    fetchDeals(current_deals, watch_deals);
  });
}

pollDeals(['wasteland','grimrock']);


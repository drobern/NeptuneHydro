var express = require('express');
var favicon = require('serve-favicon');
var app = express();
var querystring = require("querystring");
var url = require("url");
var http = require("http");

var https = require('https');
var fs = require('fs');
var request = require('request');
var moment = require('moment');
var _mysql = require('mysql');

var HOST = '192.168.223.58';
var PORT = 3306;
var MYSQL_USER = 'mysql';
var MYSQL_PASS = 'Must0ng11';
var DATABASE = 'stats';

var mysql = _mysql.createConnection({
    host: HOST,
    port: PORT,
    user: MYSQL_USER,
    password: MYSQL_PASS,
});

var interval =  60 * 50 * 50; // secs

setInterval(query, interval);
  
function query(){
  var data = mysql.query('select 1 from hydro', function selectCb(err, results, fields) {
    if (err) {
       throw err;
       response.end();
    }
  });
};


app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.use(express.static(__dirname + '/public'));
function calculateRatio(name) {
  switch(name) {
    case 'Dave':
      ratio=.29785;
      break;
    case 'Wojtek':
      ratio=.45029;
      break;
    case 'Peter':
      ratio=.12593;
      break;
    case 'Calvin':
      ratio=.12593
      break;
    case 'All':
      ratio=1
      break;
  }
  return ratio;
}

function convertMonth(hold_month) {
  switch(hold_month) {
            case 'January':
              request_month='01';
              break;
            case 'February':
              request_month='02';
              break;
            case 'March':
              request_month='03';
              break;
            case 'April':
              request_month='04';
              break;
            case 'May':
              request_month='05';
              break;
            case 'June':
              request_month='06';
              break;
            case 'July':
              request_month='07';
              break;
            case 'August':
              request_month='08';
              break;
            case 'September':
              request_month='09';
              break;
            case 'October':
              request_month='10';
              break;
            case 'November':
              request_month='11';
              break;
            case 'December':
              request_month='12';
              break;
            }

            return request_month;
}

app.get('/index',function(req,res){
  if (req.query.name) {
    name= req.query.name;
    month=req.query.month;
    year=req.query.year;
  } else {
    name = "All";
    var d = new Date();
    month = d.getMonth();
    year = null;
  }
  var done = function(gd, cd, pd, ld, total, month) {
    console.log ("THE MONTH: "+month);
    res.render("index", {gd: gd, cd: cd, pd: pd, ld: ld, total: total, name: name, month: month}); 
  }
  graphdata(name, month, year, done);
});

app.get('/',function(req,res){
  var done = function(gd, cd, pd, ld, total, month) {
    res.render("index", {gd: gd, cd: cd, pd: pd, ld: ld, total: total, name: "All", month: month}); 
  }
  var d = new Date();
  var m = d.getMonth();
  graphdata("All", m, null, done);
});

app.get('/profile',function(req,res){
   month=req.query.month;
   res.render("profile", {month: month}); 
});

app.get('/payment',function(req,res){
  var d = new Date();
  month = d.getMonth();
  var done = function(gd, cd, pd, ld) {
    res.render("payment", {gd: gd, cd: cd, pd: pd, ld: ld, month: month}); 
  }
  graphpay(done);
});

var graphdata = function(name, month, year, done) {
  var graphData = {};
  graphData.cols = [];
  graphData.rows = [];
  var total = 0;
  var totaloffPeakCost = 0;
  var totalmidPeakCost = 0;
  var totalonPeakCost = 0;
  var a = 0;
  graphData.cols[0] = {"date":"","label":"DATE","type":"string"};
  graphData.cols[1] = {"offPeakUsage":"","label":"Off Peak Usage","type":"number"};
  graphData.cols[2] = {"offPeakCost":"","label":"Off Peak Cost","type":"number"};
  graphData.cols[3] = {"midPeakUsage":"","label":"Mid Peak Usage","type":"number"};
  graphData.cols[4] = {"midPeakCost":"","label":"Mid Peak Cost","type":"number"};
  graphData.cols[5] = {"onPeakUsage":"","label":"On Peak Usage","type":"number"};
  graphData.cols[6] = {"onPeakCost":"","label":"On Peak Cost","type":"number"};
  graphData.cols[7] = {"totalCost":"","label":"Total Cost","type":"number"};

  var chartData = {};
  chartData.cols = [];
  chartData.rows = [];
  chartData.cols[0] = {"date":"","label":"Day","type":"string"};
  chartData.cols[1] = {"totalCost":"","label":"Total Cost","type":"number"};

  var pieData = {};
  pieData.cols = [];
  pieData.rows = [];
  pieData.cols[0] = {"id":"","label":"Range","type":"string"};
  pieData.cols[1] = {"id":"","label":"Total","type":"number"};

  var lineData = {};
  lineData.cols = [];
  lineData.rows = [];
  lineData.cols[0] = {"id":"","label":"Day","type":"string"};
  lineData.cols[1] = {"id":"","label":"Off Peak","type":"number"};
  lineData.cols[2] = {"id":"","label":"On Peak","type":"number"};
  lineData.cols[3] = {"id":"","label":"Mid Peak","type":"number"};
  
  if (typeof month == "string") {
    var realmonth = convertMonth(month);
  } else {
    if (month < 10) {
      var realmonth = "0"+month.toString();
    } else {
      var realmonth = month.toString();
    }
  }
  console.log("NAME: "+name+" MONTH: "+realmonth);
  mysql.query('use ' + DATABASE);
  var data = mysql.query('select * from hydro where date like "%/'+realmonth+'%"', function selectCb(err, results, fields) {
    if (err) {
       throw err;
       response.end();
    }
    for (var i in results) {
      var hydro = results[i];
      var tdate = moment(hydro.date, "DD-MM-YYYY");
      var date = moment(tdate).format("MMMM Do YYYY");
      var ratio = calculateRatio(name);
      var offPeakUsage = (hydro.offPeakUsage * ratio).toFixed(2);
      var offPeakCost = (hydro.offPeakCost * ratio).toFixed(2);
      var midPeakUsage = (hydro.midPeakUsage * ratio).toFixed(2);
      var midPeakCost = (hydro.midPeakCost * ratio).toFixed(2);
      var onPeakUsage = (hydro.onPeakUsage * ratio).toFixed(2);
      var onPeakCost = (hydro.onPeakCost * ratio).toFixed(2);
      var totalCost = parseFloat((hydro.offPeakCost * ratio) + (hydro.midPeakCost* ratio) + (hydro.onPeakCost* ratio)).toFixed(2);
      totaloffPeakCost = (parseFloat(totaloffPeakCost) + parseFloat(hydro.offPeakCost * ratio)).toFixed(2);
      totalmidPeakCost = (parseFloat(totalmidPeakCost) + parseFloat(hydro.midPeakCost * ratio)).toFixed(2);
      totalonPeakCost = (parseFloat(totalonPeakCost) + parseFloat(hydro.onPeakCost * ratio)).toFixed(2);
      total = (parseFloat(total) + parseFloat(totalCost)).toFixed(2);
      console.log("TOTAL: "+total+" TOTAL COST: "+totalCost);
      graphData.rows[a] = {"c":[{"v":date,"f":null},{"v":offPeakUsage,"f":offPeakUsage+"KW/h"},{"v":offPeakCost,"f":"$"+offPeakCost},{"v":midPeakUsage,"f":midPeakUsage+"KW/h"},{"v":midPeakCost,"f":"$"+midPeakCost},{"v":onPeakUsage,"f":onPeakUsage+"KW/h"},{"v":onPeakCost,"f":"$"+onPeakCost},{"v":totalCost,"f":"$"+totalCost}]};
      chartData.rows[a] = {"c":[{"v":date,"f":null},{"v":parseFloat(totalCost),"f":null}]};
      lineData.rows[a] = {"c":[{"v":date,"f":null},{"v":offPeakCost,"f":null},{"v":onPeakCost,"f":null},{"v":midPeakCost,"f":null}]};
      a++;
    }
    //console.log("OFF PEAK: "+totaloffPeakCost+" MID PEAK: "+totalmidPeakCost+" ON PEAK: "+totalonPeakCost);
    pieData.rows[0]  = {"c":[{"v":"Off Peak","f":null},{"v":parseFloat(totaloffPeakCost),"f":null}]};
    pieData.rows[1]  = {"c":[{"v":"On Peak","f":null},{"v":parseFloat(totalonPeakCost),"f":null}]};
    pieData.rows[2]  = {"c":[{"v":"Mid Peak","f":null},{"v":parseFloat(totalmidPeakCost),"f":null}]};
   // console.log("THE PIE: "+JSON.stringify(pieData,null,2,true)); 
   // console.log("THE LINE: "+JSON.stringify(lineData,null,2,true)); 
    done(graphData, chartData, pieData, lineData, total, realmonth);
  });
};

var graphpay = function(done) {
  var graphData = {};
  graphData.cols = [];
  graphData.rows = [];
  var total = 0;
  var hdate = "";
  var totaloffPeakCost = 0;
  var totalmidPeakCost = 0;
  var totalonPeakCost = 0;
  var a = 0; var x = 0; var y = 0;
  graphData.cols[0] = {"date":"","label":"DATE","type":"string"};
  graphData.cols[1] = {"name":"","label":"NAME","type":"string"};
  graphData.cols[2] = {"amount":"","label":"PAID","type":"number"};
  graphData.cols[3] = {"balance":"","label":"BALANCE","type":"number"};

  var chartData = {};
  chartData.cols = [];
  chartData.rows = [];
  chartData.cols[0] = {"name":"","label":"Name","type":"string"};
  chartData.cols[1] = {"balance":"","label":"Balance","type":"number"};

  var pieData = {};
  pieData.cols = [];
  pieData.rows = [];
  pieData.cols[0] = {"id":"","label":"Name","type":"string"};
  pieData.cols[1] = {"id":"","label":"Balance","type":"number"};

  var lineData = {};
  lineData.cols = [];
  lineData.rows = [];
  lineData.cols[0] = {"id":"","label":"Month","type":"string"};
  lineData.cols[1] = {"id":"","label":"Dave","type":"number"};
  lineData.cols[2] = {"id":"","label":"Wojtek","type":"number"};
  lineData.cols[3] = {"id":"","label":"Peter","type":"number"};
  lineData.cols[4] = {"id":"","label":"Calvin","type":"number"};
  
  mysql.query('use ' + DATABASE);
  var data = mysql.query('select * from payment', function selectCb(err, results, fields) {
    if (err) {
       throw err;
       response.end();
    }
    for (var i in results) {
      var payment = results[i];
      var tdate = moment(payment.date, "DD-MM-YYYY");
      var date = moment(tdate).format("MMMM Do YYYY");
      if (payment.date == hdate) {
        switch(payment.name) {
          case 'Dave':
            var dave = payment.balance;
            break; 
          case 'Wojtek':
            var wojtek = payment.balance;
            break;
          case 'Peter':
            var peter = payment.balance;
            break;
          case 'Calvin':
            var calvin = payment.balance;
            break;
        } 
        if (x == 3) {
          lineData.rows[y] = {"c":[{"v":date,"f":null},{"v":dave,"f":"$"+dave},{"v":wojtek,"f":"$"+wojtek},{"v":peter,"f":"$"+peter},{"v":calvin,"f":"$"+calvin}]};
          x = 0;
          y++;
        } else {
          x++;
        }
      } else {
        hdate = payment.date;
        switch(payment.name) {
          case 'Dave':
            var dave = payment.balance;
            break; 
          case 'Wojtek':
            var wojtek = payment.balance;
            break;
          case 'Peter':
            var peter = pyament.balance;
            break;
          case 'Calvin':
            var calvin = payment.balance;
            break;
        }
        x++;
      }
      graphData.rows[a] = {"c":[{"v":date,"f":null},{"v":payment.name,"f":null},{"v":payment.amount,"f":"$"+payment.amount},{"v":payment.balance,"f":"$"+payment.balance}]};
      chartData.rows[a] = {"c":[{"v":payment.name,"f":null},{"v":payment.balance,"f":null}]};
      pieData.rows[a] = {"c":[{"v":payment.name,"f":null},{"v":payment.balance,"f":null}]};
      a++;
    }
    done(graphData, chartData, pieData, lineData);
  });
};



app.listen(3000);
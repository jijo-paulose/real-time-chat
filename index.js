var express = require("express");
var morgan = require('morgan');
var app = express();
var port = 3100;
app.use(express.static(__dirname + '/public'));
var io = require('socket.io').listen(app.listen(port));
var mongoose = require('mongoose');
process.env.NODE_ENV =  'development';
console.log("Server Initialized. please open: http://localhost:"+port);



mongoose.connect('mongodb://localhost/realtimechat', function(err){
  if(err) {
    console.log(err);
    console.log("Can't  Connect to Mongodb ")
  } else {
    console.log('Connected to Mongodb!');
  }
});

//if default port doesnt work please try changing the port like this
// mongoose.connect('mongodb://localhost/chatapp:portno') 

var chat_table = mongoose.Schema({
  nick_name: String,
  location: String,
  message: String,
  created: {type: Date, default: Date.now}
});

var Msg = mongoose.model('Message', chat_table);

var users = [];
app.set('views', __dirname + '/views');
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');
app.get("/", function(req, res){
    res.render("index");
});

    if (process.env.NODE_ENV === 'development') {
      app.use(morgan('combined'));
    } else if (process.env.NODE_ENV === 'production') {
      app.use(compress());
    }

io.sockets.on('connection', function (socket) {
    if(users.length>0){
      var msg = Msg.find({});
      msg.sort('-created').limit(2).exec(function(error,data){
        if(!error){
          socket.emit('all_message', data);
        }
      })
    }

    socket.on('new_user', function (data) {
        socket.user_details = data;
        users.push(socket.user_details);
        var data = {
          'users':users,
          'current_user':socket.user_details,
          'status':'joined',
          'count':users.length
        }
        io.sockets.emit('user_joined', data);
    });

    socket.on('msg_sent', function (data) {
        var data={
          message :data.message,
          nick_name : socket.user_details.nick_name
        }
        var message = new Msg({
            message: data.message, 
            nick_name: data.nick_name,
            location:socket.user_details.location
          });
        message.save(function(err){
          if(!err)
            io.sockets.emit('new_message', data);
        });
    });

    socket.on('disconnect', function (data) {
      if(typeof socket.user_details!='undefined'){
        users.splice(users.indexOf(socket.user_details.nick_name),1)
        var data = {
          'users':users,
          'current_user':socket.user_details,
          'status':'left',
          'count':users.length
        }
        io.sockets.emit('user_joined', data);
      }
    });
});
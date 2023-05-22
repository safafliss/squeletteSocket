var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var mongoose = require("mongoose");
var mongoConfig = require("./config/mongoConfig.json");
const http = require("http");
const bodyParser = require('body-parser');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
//var entityRoutes = require("./routes/entityRoutes");
var msgRouter = require("./routes/msgRoutes");
var Msg = require("./models/msgModel");

var app = express();
app.use(express.json());

mongoose.connect(mongoConfig.uri,{ 
  useNewUrlParser: true ,
  useUnifiedTopology: true
  }).then(()=>{
      console.log("DB connected");
  }).catch(err=>{
      console.log(err);
  })

const server = http.createServer(app);
server.listen(3000, ()=> console.log("server is run")); 
const io = require("socket.io")(server);


// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'twig');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);
//app.use('/entity', entityRoutes);
app.use('/msg', msgRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});



let num_users_online = 0;

io.on("connection", function(socket) {
  console.log ("User Connected..");

  //let the clients know how many online users are there:
  io.emit('updateNumUsersOnline', ++num_users_online);

  socket.broadcast.emit('msg', 'A new user has joined the chat');

  socket.on('disconnect', () => {
    console.log('user disconnected');
    io.emit('userDisconnected', 'A user has left the chat');
    //*
    io.emit('updateNumUsersOnline', --num_users_online);
  });

  socket.on("msg",(data)=>{
    io.emit("msg",data)
  })


  socket.on('msg', (x,y) => {
    const message = new Msg({ 
        pseudo:x,
        content:y });
    message.save().then(() => {
        io.emit('message', x,y);
    })
  })


  socket.on('typing', (data) => {
    socket.broadcast.emit('typing', data);
  });

  
  // socket.on('stoptyping', (data) => {
  //   socket.broadcast.emit('stoptyping', data);
  // });
});


module.exports = app;

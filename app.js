var express = require('express');
var path = require('path');
const bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const cors = require('cors');
const errorHandler = require('./_middleware/error-handler');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var accountRouter = require('./modules/accounts/accounts.controller');
var servicesRouter = require('./modules//services/services.controller');
var walletRouter = require('./modules/wallet/wallet.controller');
var bankRouter = require('./modules/banks/banks.controller');
var bankAccountRouter = require('./modules/bankAccounts/bankAccounts.controller')

var app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json());

app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
  });

  var corsOption = {
    origin: "*",
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
    exposedHeaders: ['x-auth-token']
  };
  app.use(cors(corsOption));
  
app.options('*', cors());



app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/accounts',accountRouter);
app.use('/service', servicesRouter);
app.use('/wallet', walletRouter);
app.use('/bank', bankRouter);
app.use('/bankAccount', bankAccountRouter);

// swagger docs route
app.use('/api-docs', require('./_helpers/swagger'));

// global error handler
app.use(errorHandler);

// start server
const port = process.env.NODE_ENV === 'production' ? (process.env.PORT || 80) : 4000;
app.listen(port, () => {
    console.log('Server listening on port ' + port);
});

module.exports = app;

const path = require('path');
const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');

// router from different folders
// used for middleware declarations
const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');

const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const viewRouter = require('./routes/viewRoutes');

const app = express();

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views')); // 自動創造前往 views 的路徑

// 1) Global Middleware

// use for static content   from folders not from the routes
// app.use(express.static(`${__dirname}/public`));
app.use(express.static(path.join(__dirname, 'public')));

// Set security HTTP headers
app.use(
  helmet({
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        baseUri: ["'self'"],
        fontSrc: ["'self'", 'https:', 'data:'],
        imgSrc: ["'self'", 'data:', 'https:'],
        scriptSrc: [
          "'self'",
          'https://cdnjs.cloudflare.com/ajax/libs/axios/1.2.3/axios.min.js',
          'https://unpkg.com/leaflet@1.9.3/dist/',
          'https://tile.openstreetmap.org',
          'https://cdn.jsdelivr.net/npm/axios/dist/',
          'https://cdn.jsdelivr.net/npm/axios/dist/axios.min.js',
        ],
        objectSrc: ["'none'"],
        styleSrc: ["'self'", 'https:', "'unsafe-inline'"],
        upgradeInsecureRequests: [],
      },
    },
  })
); // 必須放在最前面才可以 head才能被設置
app.use(helmet.crossOriginResourcePolicy({ policy: 'cross-origin' }));

// set helmet policy for xss white list
// app.use(
//   helmet.contentSecurityPolicy({
//     directives: {
//       defaultSrc: ["'self'"],
//       baseUri: ["'self'"],
//       fontSrc: ["'self'", 'https:', 'data:'],
//       imgSrc: ["'self'", 'data:', 'https:'],
//       scriptSrc: [
//         "'self'",
//         'https://cdnjs.cloudflare.com/ajax/libs/axios/1.2.2/axios.min.js',
//         'https://unpkg.com/leaflet@1.9.3/dist/',
//         'https://tile.openstreetmap.org',
//       ],
//       objectSrc: ["'none'"],
//       styleSrc: ["'self'", 'https:', "'unsafe-inline'"],
//       upgradeInsecureRequests: [],
//     },
//   })
// );

// node.js 的 HTTP 請求記錄器中間件
// Development logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// define how many requests per IP we allow in certain amount of time
// 可幫助 防止 denial of service and brute force attacks
// Limit requests from same API
const limiter = rateLimit({
  max: 100, // 100個請求
  windowMs: 60 * 60 * 100, // time window 例如每小時100個請求
  message: '這個IP發送過多『request』! 請一個小時後重試',
});

app.use('/api', limiter);

// body parser, reading data from body into req.body

// 不使用這個 回傳回來的就不會是 json檔(middleware)
app.use(express.json({ limit: '10kb' })); // 設置接受檔案大小
app.use(
  express.urlencoded({
    extended: true,
    limit: '10kb',
  })
);
app.use(cookieParser());

// Data sanitization 數據清理 NoSql query injection  => 在假設擁有密碼的情況下不知道email email: {$gt: ""} 就能登入某一個用戶
// 這個middleware 會做查看request body, the request query string, Request.params, 然後過濾掉 所有 ＄符號 及 .dot
app.use(mongoSanitize());
// Data sanitization against XSS
// 清除來自用戶的 惡意html代碼
app.use(xss());

// Prevent parameter pollution
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsQuantity',
      'ratingsAverage',
      'maxGroupSize',
      'difficulty',
      'price',
    ],
  })
);

// 自己練習寫的 middleware，可以處理TimeStamp
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  //console.log(req.headers);
  //console.log(req.cookies);
  next();
});

// 2) route handlers

// 3) routes
// middleware

app.use('/', viewRouter);
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);

// 先前的 middleware 線路都走完 剩下沒有設置的部分 會來到這裡
app.all('*', (req, res, next) => {
  // 基於error 自己延伸的error 功能
  // 新增 err 給下一個 middleware
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// middleware error handler
// 偵測 middleware err
app.use(globalErrorHandler);

// 輸出 app 給server 使用
module.exports = app;

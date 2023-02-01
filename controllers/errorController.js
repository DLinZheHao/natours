// globalErrorHandler (err,...) err 優先代表 專門處理middleware的 ErrorHandler

const AppError = require('./../utils/appError');

// 線路輸入錯誤 error處理 ()
const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}`;
  //console.log('123');
  return new AppError(message, 400);
};

// 重複名稱 error處理 ()
const handleDuplicateFieldsDB = (err) => {
  //const value = err.errmsg.match(/(["'])(?:(?=(\\?))\2.)*?\1/);
  const value = err.keyValue.name;
  //console.log(value);
  const message = `Duplicate field value: [${value}] Please use another value!`;
  return new AppError(message, 400);
};

// 未按照資料規定 error處理 ()
const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message);
  const message = `Invalid input data. ${errors.join('. ')}`;
  return new AppError(message, 400);
};

const handleJWTError = () => new AppError('Invalid token. 請重新登入！', 401);

const handleJWTExpiredError = () =>
  new AppError('Invalid token. token has expired! 請重新登入', 401);
// 對使用者及開發者 需要看到的資訊進行 分離式處理

// 開發者模式 錯誤訊息
const sendErrorDev = (err, req, res) => {
  // API
  if (req.originalUrl.startsWith('/api')) {
    return res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack,
    });
  } else {
    // Render Website
    return res.status(err.statusCode).render('error', {
      title: '好吧！好像有些問題正在發生！',
      msg: err.message,
    });
  }
};

// 使用者模式 錯誤訊息
const sendErrorProd = (err, req, res) => {
  if (req.originalUrl.startsWith('/api')) {
    // Operational, trusted error: send message to client
    if (err.isOperational) {
      return res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
      });
      // Programming or other unknown error: don't leak error details
    }

    // Render Website
    return res.status(500).json({
      status: 'error',
      message: 'Something went very wrong!',
    });
  }

  if (err.isOperational) {
    console.log(err);
    return res.status(err.statusCode).render('error', {
      title: 'Something went wrong!',
      msg: err.message,
    });
  }

  console.log('ERROR Happening!', err);
  return res.status(err.statusCode).render('error', {
    title: 'Something went wrong!',
    msg: 'Please try later!',
  });
};

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, req, res);
  } else if (process.env.NODE_ENV === 'production') {
    let error = Object.assign(err); // 完整一模一樣的複製
    // console.log(error);
    // let error = {...err} 這段會使 會丟失克隆本體的屬性
    //console.log('test:' + err);
    // 可以對已知可能會發生的錯誤 進行錯誤 message專門處理 ()
    if (error.name === 'CastError') error = handleCastErrorDB(error);
    if (error.code === 11000) error = handleDuplicateFieldsDB(error);
    if (error.name === 'ValidationError')
      error = handleValidationErrorDB(error);
    if (error.name === 'JsonWebTokenError') error = handleJWTError();
    if (error.name === 'TokenExpiredError') error = handleJWTExpiredError();

    sendErrorProd(error, req, res);
  }
};

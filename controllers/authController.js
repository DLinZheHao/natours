const crypto = require('crypto');
const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const sendEmail = require('./../utils/email');
const { findOne } = require('./../models/userModel');

// 登入憑證生成 （單純的jwt使用方式)
const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ), // 使瀏覽器或客戶端 將在cookie過期後將其刪除
    //secure: true, // cookie 只會加密連結上 https
    httpOnly: true, // 避免 cross-site scripting attacks 接收cookie and store it 然後將其與每個請求一起自動發送
  };

  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;

  // 第一個參數為 cookie的名稱， 第二個參數為 想要在cookie中發送的數據, 第三個 cookie 的 option
  // cookie 定義的方式
  res.cookie('jwt', token, cookieOptions);

  // Remove password from output
  user.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user,
    },
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  // 這樣的方式創建會有 每個人都可以創造管理員的問題
  // const newUser = await User.create(req.body);

  // 改成這樣 就能只讓用戶 輸入 我們指定需要的資料
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.password,
    role: req.body.role,
    //passwordChangeAt: req.body.passwordChangeAt,
  });

  createSendToken(newUser, 201, res);
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // 1) Check if email and password exist
  if (!email || !password) {
    // 使 login function 直接結束
    return next(new AppError('請輸入正確的『電子信箱』或『密碼』', 400));
  }
  // 2) Check if user exist && password is correct

  // select 從Database中 簡單地選擇幾個字段  被消失的password就可以重新出現
  const user = await User.findOne({ email }).select('+password');

  //
  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('『電子郵件』或『密碼不正確』', 401));
  }
  // 3) If everything is OK , send token to client
  createSendToken(user, 200, res);
});

exports.logout = (req, res) => {
  // 第一個參數為 cookie的名稱， 第二個參數為 想要在cookie中發送的數據, 第三個 cookie 的 option
  res.cookie('jwt', 'logged_Out', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });
  res.status(200).json({
    status: 'success',
  });
};

// 使用者登入  Only render the pages, no errors!
exports.isLoggedIn = async (req, res, next) => {
  if (req.cookies.jwt) {
    //token = req.cookies.jwt;
    try {
      // 1) 驗證登入token
      const decoded = await promisify(jwt.verify)(
        req.cookies.jwt,
        process.env.JWT_SECRET
      );

      // 2) 檢查用戶是否還存在
      const currentUser = await User.findById(decoded.id);
      if (!currentUser) {
        return next();
      }

      // 3) 檢查用戶是否最近更改過密碼
      if (currentUser.changedPasswordAfter(decoded.iat)) {
        return next();
      }

      // 這裡有確實有一個登入用戶
      res.locals.user = currentUser;
      return next();
    } catch (err) {
      return next();
    }
  }
  next();
};

// 使用者登入及狀態 驗證
exports.protect = catchAsync(async (req, res, next) => {
  // 1) 實際獲得token 並確定 存在
  let token;
  // console.log(req.headers.authorization);
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  // console.log(token);
  if (!token) {
    return next(new AppError('使用者沒有進行登入，請先登入'), 401);
  }

  // 2) validate token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
  // decoded format
  // { id: '63ba352f1b0093cff9f9b2a9', iat: 1673230489, exp: 1681006489 }

  // 3) 如果驗證成功, 需要確認正在訪問線路的user 是否還存在
  // await => 如果上面的decode 失敗 底下這邊的程式就不會運作 因為上面的沒有完成 promise 失敗 await 會等不到東西
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(new AppError('這個token的使用者已經不存在'), 401);
  }
  // 4) 檢查 如果user 在 JWT 發出後 更改了密碼
  // false Promise { false }

  if (currentUser.changedPasswordAfter(decoded.iat)) {
    return next(new AppError('用戶最近已更改過密碼！請重新登入', 401));
  }

  // 給予權限 進入被保護的 route （會送出保密資料的線路）
  req.user = currentUser;
  res.locals.user = currentUser;
  next();
});

// 限制 權限的功能
// 注意通常無法 傳遞參數到 middleware
// create the wrapper function 再返回 像要創建的middleware function
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    // roles ['admin', 'lead-guide']  // 假設當前為 role = 'user' roles 陣列沒有包含 所以無法使用
    // req.user 從上面程式檢查 token 完成搜尋儲存的 在router 已經運行過 protect  當前document 有req.user 被純存下來 因此可以使用
    if (!roles.includes(req.user.role)) {
      return next(new AppError('沒有權限進行此操作', 403));
    }
    next();
  };
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  // 1) Get user based on POSTed email
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError('沒有使用這個電子郵件的用戶', 404));
  }
  // 2) Generate the random reset token
  const resetToken = user.createPasswordResetToken();
  // 對 token passwordResetExpires 進行儲存 user userDocument
  // 停用所有的驗證器 存在於schema
  await user.save({ validateBeforeSave: false });

  // 3) Send it to user's email
  const resetURL = `${req.protocol}://${req.get(
    'host'
  )}/api/v1/users/resetPassword/${resetToken}`;

  const message = `忘記密碼了嗎？ 送出 PATCH request with your new password and passwordConfirm to: ${resetURL}.\n如果你沒有忘記你的密碼, 請無視這封郵件！ `;

  try {
    await sendEmail({
      email: user.email,
      subject: '你的密碼重設token (10分鐘後過期)', // email title
      message,
    });
    res.status(200).json({
      status: 'success',
      message: 'Token 已發送至電子信箱！',
    });
  } catch (err) {
    //console.log(err);
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(new AppError('在發送電子郵件中發生錯誤！請稍後再嘗試', 500));
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  // 1) Get user based on the token  根據令牌獲取用戶

  // token 加密形式都是這樣
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  // 如果找不到使用者，基本上不會返回任何東西
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  // 找不到使用者匹配的 token 或是 不符合時限  => token 無效 或是 已經過期
  // 2) 在令牌沒有過期的前提下，並且有一個用戶，重新設置新的密碼
  if (!user) {
    return next(new AppError('Token 『無效』或『已過期』', 400));
  }

  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;

  await user.save();

  // 3) 更新 changePasswordAt property for the user
  // 以使用 middleware 進行處理

  // 4) 讓用戶登入，送JWT到客戶端
  createSendToken(user, 200, res);
});

// 此功能與 與protect一起使用 擁有user 的狀態 => 重設密碼
exports.updatePassword = catchAsync(async (req, res, next) => {
  // 只適用於登入用戶 同時也需要用戶知道自己的密碼
  // 基於安全使用的原則 在更新密碼前需輸入當前密碼 才可以
  const { passwordCurrent, password, passwordConfirm } = req.body;
  const { id } = req.user;
  // 1) Get user from collection 因為已經登入 所以會有user
  const user = await User.findById(id).select('+password');

  // 2) Check if Posted current password is correct
  // 要在輸入一次密碼
  if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
    return next(new AppError('驗證密碼輸入失敗！', 401));
  }
  // 3) If so , update the password
  user.password = password;
  user.passwordConfirm = passwordConfirm;
  await user.save();
  // 如果使用 findOneByIdAndUpdate 檔案處理的middleware都將不起作用 且驗證器那些也將不管用

  // 4) Log user in, send Jwt
  createSendToken(user, 200, res);
});

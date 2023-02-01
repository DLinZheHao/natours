const crypto = require('crypto');
const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, '請輸入用戶名稱'],
  },
  email: {
    type: String,
    required: [true, '請輸入電子信箱'],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, '請輸入一個有效的電子信箱'],
  },
  photo: {
    type: String,
    default: 'default.jpg',
  },
  role: {
    type: String,
    enum: {
      values: ['user', 'guide', 'lead-guide', 'admin'],
      message: '難度只能設定成: user, guide, lead-guide, admin',
    },
    default: 'user',
  },
  // 注意！永遠不要明文儲存密碼在資料庫之中
  password: {
    type: String,
    required: [true, '請輸入密碼'],
    minLength: 8,
    select: false,
  },
  passwordConfirm: {
    type: String,
    required: [true, '請確認輸入密碼是否一致'],
    validate: {
      //驗證器只在資料 create or save 時作用
      validator: function (el) {
        return el == this.password;
      },
      message: '輸入密碼不一致，請重新輸入密碼！',
    },
  },
  passwordChangeAt: {
    type: Date,
  },
  passwordResetToken: {
    type: String,
  },
  passwordResetExpires: {
    type: Date,
  },
  active: {
    type: Boolean,
    default: true,
    select: false,
  },
});

// middleware 處理 userSchema 資料狀態
userSchema.pre('save', async function (next) {
  // Only run this function if password was actually modified
  // isModified 看的是 對比整個document 前後是否有變化
  // 初始資料丟進來的時候 isModified 被認為是修改過 0 -> 1
  /// 沒有進行過 (新的）密碼加密
  if (!this.isModified('password')) return next();

  // 有關bcrypt 加密 salt
  // 第一種 ： 手動生成 salt , 隨機字串將會被添加到我們的密碼之中
  // 為了讓其簡單一些 可以簡單傳遞一個成本參數 下面的數字越大 該過程的CPU密集程度越高
  // Hash the password with cost of 12
  this.password = await bcrypt.hash(this.password, 12);

  // require 代表必須輸入 並不代表 需要持久保存
  // delete this.passwordConfirm field
  this.passwordConfirm = undefined;
  next();
});

userSchema.pre('save', function (next) {
  // isModified 看的是 對比整個document 前後是否有變化
  // 創造新的文件 也算是修改密碼(0 -> 1)的概念
  // 如果我們沒有修改密碼屬性 不要操作 passwordChangeAt
  // 如果沒有修改密碼 或是 文件是新創的
  if (!this.isModified('password') || this.isNew) return next();

  // 重要！！ 有時會發生保存到數據庫 比 發佈Json Web Token慢一些  導致 Jwt 已經創建時 passwordChangeAt 才在他之後創建成功
  // 會造成功能問題！！ 因此自定義 減去一小段時間 避免這種問題
  this.passwordChangeAt = Date.now() - 1000;

  next();
});

userSchema.pre(/^find/, function (next) {
  // this points to the current query
  this.find({ active: { $ne: false } });
  next();
});

// instance method 基本是一個方法 gonna be available on all documents of a certain collections
userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};
// 檢查密碼改變的問題 passwordChangeAt 可以檢查用戶是否有更改密碼 如果沒有這項屬性 代表 用戶從來沒有更改過密碼
userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  // 如果有這個屬性 代表有更改過密碼
  if (this.passwordChangeAt) {
    //console.log('enter');
    const changedTimestamp = parseInt(this.passwordChangeAt.getTime() / 1000);
    // 2023-01-09T00:00:00.000Z 1673232302

    // 假設token 發行在 100  但後來 在 200 的 地方更改了密碼
    return JWTTimestamp < changedTimestamp; // 100 < 200 代表令牌過期  300 > 200 代表令牌是在更改密碼後發行的
  }

  // False means NOT changed
  return false;
};

// 生成用戶重新設置密碼的token
userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');

  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  //console.log({ resetToken }, this.passwordResetToken);

  // 設定 token 過期時間 (目前為十分鐘)
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

const User = mongoose.model('User', userSchema);

module.exports = User;

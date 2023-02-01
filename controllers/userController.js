//const AppError = require('../utils/appError');
const multer = require('multer');
const sharp = require('sharp');
const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const factory = require('./handlerFactory');

// 檔案上傳後 不要直接儲存到記憶體中 盡量使用buffer
// const multerStorage = multer.diskStorage({
//   // 可以訪問當前request file 回調函數(類似next)
//   destination: (req, file, cb) => {
//     cb(null, 'public/img/users');
//   },
//   filename: (req, file, cb) => {
//     // user-767676abc76ba-33232376764.jpeg
//     const ext = file.mimetype.split('/')[1];
//     // 在沒有任何錯誤的情況下（null） 執行
//     cb(null, `user-${req.user.id}-${Date.now()}.${ext}`);
//   },
// });

// buffer
const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('上傳檔案不是圖片(image)！請上傳正確圖檔。', 400), false);
  }
};

// 如果不給任何目的地 就只會在內存中儲存 不會儲存在任何地方
// dest ： 檔案上傳得的目的地
const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

exports.uploadUserPhoto = upload.single('photo');

exports.resizeUserPhoto = (req, res, next) => {
  if (!req.file) {
    return next();
  }

  req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;

  sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/users/${req.file.filename}`);

  next();
};

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) {
      newObj[el] = obj[el];
    }
  });
  return newObj;
};

exports.deleteMe = catchAsync(async (req, res, next) => {
  //  { active: false } 只是要更新的內容
  await User.findByIdAndUpdate(req.user.id, { active: false });

  res.status(204).json({
    status: 'success',
    data: null,
  });
});

// get user id
exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};

exports.updateMe = catchAsync(async (req, res, next) => {
  // console.log(req.file);
  // console.log(req.body);
  // 1) Create error if user POST password data
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError('這條線路不提供密碼更新！ 請使用use/updateMyPassword', 400)
    );
  }
  // 2) filtered out unwanted fields names that are not allowed update
  // 為何不直接設置更新資料為req.body ? 因為這樣用戶可以輸入 role, token 之類隱密的 特殊資料 不安全！！
  const filteredBody = filterObj(req.body, 'name', 'email');
  if (req.file) filteredBody.photo = req.file.filename;

  // 3) Update user document
  const updateUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    // findByIdAndUpdate 會略過所有驗證器
    new: true,
    runValidators: true, // 避免更新資料中有未符合規定之資訊 => 不可能存在的電子信箱
  });

  // const user = await User.findById(req.user.id);
  // user.name = req.body.name;
  // await user.save();  // 用此方式儲存 會有schema require 的問題發生 因為更新資料並不含password or passwordConfirm

  res.status(200).json({
    status: 'success',
    data: {
      user: updateUser,
    },
  });
});

exports.createUser = (req, res) => {
  res.status(500).json({
    status: 'err',
    message: 'This route is not defined! Please use /signup instead.',
  });
};

exports.getAllUsers = factory.getAll(User);
exports.getUser = factory.getOne(User);

// Do NOT update passwords with this
exports.updateUser = factory.updateOne(User); // for admin update date is not the password
exports.deleteUser = factory.deleteOne(User); // for admin actually delete user

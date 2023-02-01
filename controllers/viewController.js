const { crossOriginResourcePolicy } = require('helmet');
const bodyParser = require('body-parser');
const AppError = require('../utils/appError');
const Tour = require('./../models/tourModel');
const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');
const { urlencoded } = require('body-parser');

exports.getOverview = catchAsync(async (req, res, next) => {
  // 1) Get tour data from collection
  let tours;
  tours = await Tour.find();

  if (req.tours) {
    tours = req.tours;
  }
  // console.log(tours);
  // 2) Build template

  // 3) Render that template using tour data from 1)

  res.status(200).render('overview', {
    title: 'All Tours',
    tours: tours,
  });
});

exports.getTour = catchAsync(async (req, res, next) => {
  // 1) get the data, for the requested tour (including reviews{need auto populate} and guides )
  const tour = await Tour.findOne({ slug: req.params.slug }).populate({
    path: 'reviews',
    fields: 'review rating user',
  });

  if (!tour) {
    return next(new AppError('沒有該項tour資料', 404));
  }
  // 2) Build template

  // 3) Render template using data from 1
  res.status(200).render('tour', {
    title: `${tour.name} Tour`,
    tour,
  });
});

exports.getLogin = (req, res) => {
  res.status(200).render('login', {
    title: '登入帳號',
  });
};

exports.getSignUp = (req, res) => {
  res.status(200).render('signup', {
    title: '註冊',
  });
};

exports.getAccount = (req, res) => {
  res.status(200).render('account', {
    title: 'Your account',
  });
};

exports.updateUserData = catchAsync(async (req, res, next) => {
  const updatedUser = await User.findByIdAndUpdate(
    req.user.id,
    {
      name: req.body.name,
      email: req.body.email,
    },
    {
      new: true, // 得到更新後的文件存在user
      runValidators: true,
    }
  );

  res.status(200).render('account', {
    title: 'Your account',
    user: updatedUser,
  });
});

exports.search_PageData = catchAsync(async (req, res, next) => {
  const keyword = req.query.keyword;
  const regex = new RegExp(`${keyword}`, 'i');
  const tours = await Tour.find({ name: { $regex: regex } });
  //console.log(`Data:${keyword}`);
  req.tours = tours;
  req.keyword = keyword;

  res.status(200).render('overview', { tours: tours, keyword: keyword });
});

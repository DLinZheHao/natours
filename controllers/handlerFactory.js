const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const APIFeatures = require('./../utils/apiFeatures');

exports.deleteOne = (Model) =>
  catchAsync(async (req, res, next) => {
    // 記住刪除東西時 不要回傳數據給客戶端
    const doc = await Model.findByIdAndDelete(req.params.id);
    // 沒有找到匹配的目標都會返回null
    if (!doc) {
      // return 立即使功能跳出(不進行到下一行,不跳出可能會造成多重res的問題 ) 到 錯誤處理區域
      // 進入 global middleware : globalErrorHandler
      return next(new AppError('No document found with that ID', 404));
    }
    res.status(204).json({
      status: 'success',
      data: null,
    });
  });

exports.updateOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!doc) {
      // return 立即使功能跳出(不進行到下一行,不跳出可能會造成多重res的問題 ) 到 錯誤處理區域
      // 進入 global middleware : globalErrorHandler
      return next(new AppError('No document found with that ID', 404));
    }
    res.status(200).json({
      status: 'success',
      data: {
        data: doc,
      },
    });
  });

exports.createOne = (Model) =>
  catchAsync(async (req, res, next) => {
    // const newTour = new Tour({});
    // newTour.save();
    // 等於上面的方法 create => promise

    const doc = await Model.create(req.body);

    res.status(201).json({
      status: 'success',
      date: {
        data: doc,
      },
    });
  });

exports.getOne = (Model, popOptions) =>
  catchAsync(async (req, res, next) => {
    let query = Model.findById(req.params.id);

    if (popOptions) query = query.populate(popOptions);
    const doc = await query;

    // 利用id 搜尋文件  (新增) reference populate
    //const doc = await Model.findById(req.params.id).populate('reviews');
    if (!doc) {
      // return 立即使功能跳出(不進行到下一行,不跳出可能會造成多重res的問題 ) 到 錯誤處理區域
      // 進入 global middleware : globalErrorHandler
      return next(new AppError('No document found with that ID', 404));
    }
    res.status(200).json({
      status: 'success',
      data: {
        data: doc,
      },
    });
  });

exports.getAll = (Model) =>
  catchAsync(async (req, res, next) => {
    //console.log(req.query);
    // 建立 Query

    // nested route 如果有的話,filter就會自動填入條件 沒有則會傳入空對象
    let filter = {};
    if (req.params.tourId) filter = { tour: req.params.tourId };

    // execute query
    const features = new APIFeatures(Model.find(filter), req.query)
      .filter()
      .sort()
      .limitFields()
      .pagination();
    //  features.query.explain() 可以看到 為了查詢訪問文件的次數
    const doc = await features.query;

    // send response
    res.status(200).json({
      status: 'success',
      results: doc.length,
      data: {
        data: doc,
      },
    });
  });

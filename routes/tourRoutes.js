const express = require('express');
const tourController = require('./../controllers/tourController');
const authController = require('./../controllers/authController');
// const reviewController = require('./../controllers/reviewController');
// const {getAllTours, createTour, ..} = require('./../controllers/tourController');
const reviewRouter = require('./../routes/reviewRoutes');
const router = express.Router();

//       /tour/{ID of tour}/reviews/{reviews_id}
// POST /tour/234234/reviews -> nested route 嵌套路由 // 他們很有意義，當資源之間有著清晰的父子關係
// GET /tour/234234/reviews

// mergeParams  每當找到這樣的URL時 便使用reviewRouter
router.use('/:tourId/reviews', reviewRouter);

// File 檢查 ID （不能超過現有數量)
// router.param('id', tourController.checkID);

router
  .route('/top-5-cheap')
  .get(tourController.aliasTopTours, tourController.getAllTours);

router.route('/tour-status').get(tourController.getTourStats);
router
  .route('/monthly-plan/:year')
  .get(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide', 'guide'),
    tourController.getMonthlyPlan
  );

router
  .route('/tours-within/:distance/center/:latlng/unit/:unit')
  .get(tourController.getToursWithin);

router.route('/distances/:latlng/unit/:unit').get(tourController.getDistances);

router
  .route('/')
  // 如果 驗證沒有通過 就不會執行 下一個動作  => 沒有登入的用戶不能 使用其功能
  // .get(authController.protect, tourController.getAllTours)
  .get(tourController.getAllTours)
  .post(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.createTour
  );

router
  .route('/:id')
  .get(tourController.getTour)
  .patch(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.updateTour
  )
  .delete(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.deleteTour
  );

module.exports = router;

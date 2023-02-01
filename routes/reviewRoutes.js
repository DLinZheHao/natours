const express = require('express');
const reviewController = require('./../controllers/reviewController');
const Review = require('./../models/reviewModel');
const authController = require('./../controllers/authController');

// 在 router 中我們可以指定一些選項
// 在default下，每個route 只能訪問他們具體路由的參數，在原先的線路上並沒有tourID  並且在另一個route上
// 為了訪問該parameters 需要physically merge the parameters
const router = express.Router({ mergeParams: true });

router.use(authController.protect);

// nested routes
// POST /tour/234234/reviews
// GET /tour/234234/reviews
// POST /reviews
router
  .route('/')
  .get(reviewController.getAllReviews)
  .post(
    authController.restrictTo('user'),
    reviewController.setTourUserIds,
    reviewController.createReview
  );

router
  .route('/:id')
  .get(reviewController.getReview)
  .patch(
    authController.restrictTo('user', 'admin'),
    reviewController.updateReview
  )
  .delete(
    authController.restrictTo('user', 'admin'),
    reviewController.deleteReview
  );

module.exports = router;

const express = require('express');
const bodyParser = require('body-parser');
const viewsController = require('./../controllers/viewController');
const authController = require('./../controllers/authController');
const router = express.Router();

// template engine
//router.use(authController.isLoggedIn);

// front page search
router.get(
  '/search',
  authController.isLoggedIn,
  viewsController.search_PageData
);

router.get('/', authController.isLoggedIn, viewsController.getOverview);
router.get('/tours/:slug', authController.isLoggedIn, viewsController.getTour);

// Sign Up
router.get('/signup', authController.isLoggedIn, viewsController.getSignUp);

// login
router.get('/login', authController.isLoggedIn, viewsController.getLogin);

// user page 只有登入時才能使用
router.get('/me', authController.protect, viewsController.getAccount);

router.post(
  '/submit-user-data',
  authController.protect,
  viewsController.updateUserData
);

module.exports = router;

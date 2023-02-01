// review => review /rating / createAt / ref to tour (p) / ref to user (p)

const mongoose = require('mongoose');
const validator = require('validator');
const User = require('./userModel');
const Tour = require('./tourModel');

const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, '評論不能是空白的！'],
    },
    rating: {
      type: Number,
      required: [true, '評價不能是空白的！'],
      min: [1, '評價最少要有1'],
      max: [5, '評價最高到5'],
    },
    createAt: {
      type: Date,
      default: Date.now(),
    },
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: 'Tour',
      required: [true, '評價必須屬於一個tour.'],
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, '評價必須屬於一個User'],
    },
  },
  {
    // By default virtual property 不會從document轉為json 如果想要被自動轉換就必須將此狀態開啟
    toJSON: { virtuals: true },
    // By default virtual property 不會被console.log 在結果, 如果想要被打印出來就必須將此狀態開啟
    toObject: { virtuals: true },
  }
);

reviewSchema.index({ tour: 1, user: 1 }, { unique: true });
//reviewSchema.createIndexes({ tour: 1, user: 1 }, { unique: true });

reviewSchema.pre(/^find/, function (next) {
  // this.populate({
  //   path: 'tour',
  //   select: 'name',
  // }).populate({
  //   path: 'user',
  //   select: 'name photo',
  // });

  this.populate({
    path: 'user',
    select: 'name photo',
  });
  next();
});

// model 的靜態 function 宣告方法
reviewSchema.statics.calcAverageRating = async function (tourId) {
  const stats = await this.aggregate([
    {
      $match: { tour: tourId },
    },
    {
      $group: {
        _id: '$tour',
        nRating: { $sum: 1 },
        avgRating: { $avg: '$rating' },
      },
    },
  ]);
  // console.log(stats);
  // stats[
  //   {
  //     _id: [ new ObjectId("63c689a4275686181bd1c4f2") ],
  //     nRating: 3,
  //     avgRating: 3
  //   }
  // ]
  if (stats.length > 0) {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: stats[0].nRating,
      ratingsAverage: stats[0].avgRating,
    });
  } else {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: 0,
      ratingsAverage: 4.5,
    });
  }
};

reviewSchema.post('save', function () {
  // this points to current review
  // 超級重要 ！！ 如何在model還沒建造前呼叫function
  this.constructor.calcAverageRating(this.tour);
});

// reviewSchema.pre(/^findOneAnd/, async function (next) {
//   const r = await this.findOne();
//   console.log(r);
// });

// after hook method
reviewSchema.post(/^findOneAnd/, async function (doc) {
  //console.log(doc);
  await doc.constructor.calcAverageRating(doc.tour);
});

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;

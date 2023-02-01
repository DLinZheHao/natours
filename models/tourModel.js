const mongoose = require('mongoose');
const slugify = require('slugify');
const validator = require('validator');
const User = require('./userModel');
// What is validation ?
// 每個字串都採用正確的格式，以及必填字段，同時擁有sanitization（消毒)機制 確保輸入資料乾淨 沒有惡意代碼
// standard: 永遠不接受來自用戶的原樣貌資料
const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A tour must have a name'],
      unique: true,
      trim: true,
      maxLength: [40, 'A tour name must have less or equal then 40 characters'],
      minLength: [10, 'A tour name must have more or equal then 10 characters'],
      // npm validator
      //validate: [validator.isAlpha, 'Tour name must only contain characters'],
      // 中文 英文 數字 驗證器
      validate: {
        validator: function (val) {
          const reg = RegExp(/^[\u4E00-\u9FA5A-Za-z0-9]+$/);

          return reg.test(this.val);
        },
        // mongoose 用法 值等於上面的 val
        message: `存在不應該出現的符號`,
      },
    },
    slug: String,
    duration: {
      type: Number,
      required: [true, 'A tour must have a duration'],
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'A tour must have a max group size'],
    },
    difficulty: {
      type: String,
      required: [true, 'A tour must have a difficulty'],
      // 這個只能作用在 string
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: '難度只能設定成：easy,medium,difficult',
      },
    },
    // 每次向遊覽添加新評論時，或者當評論被更新或刪除時，評價的平均值將會變動
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'Rating must be above 1.0'],
      max: [5, 'Rating must be below 5.0'],
      set: (val) => Math.round(val * 10) / 10, // 4.666 四捨五入-> 4.7  //  set 這個函數每次的都會運行，
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    price: {
      type: Number,
      required: [true, 'A tour must have a price'],
    },
    //  自定義 validation
    priceDiscount: {
      type: Number,
      validate: {
        // 驗證器： true 不會發生事情 false 送出error & message
        validator: function (val) {
          // this only points to current doc on NEW document create
          return val < this.price; // 100 < 200 true  250 < 200 false
        },
        // mongoose 用法 值等於上面的 val
        message: `折價的價格超過一般價格: ({VALUE})`,
      },
    },
    summary: {
      type: String,
      // 用於修剪字串 去除所有頭尾的空白
      trim: true,
      required: [true, 'A tour must have a description'],
    },
    description: {
      type: String,
      trim: true,
    },
    imageCover: {
      type: String,
      required: [true, 'A tour must have a cover image'],
    },
    images: [String],
    createdAt: {
      type: Date,
      default: Date.now(),
      // 避免資料被送出
      select: false,
    },
    startDates: [Date],
    secretTour: {
      type: Boolean,
      default: false,
    },
    // how to create embedded documents
    startLocation: {
      // GeoJSON
      type: {
        //subfield
        type: String,
        default: 'Point',
        enum: ['Point'],
      },
      coordinates: [Number],
      address: String,
      description: String,
    },
    locations: [
      {
        type: {
          type: String,
          default: 'Point',
          enum: ['Point'],
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number,
      },
    ],
    // pre('save')  在儲存時 搜尋 guides embedded 進 guides 中
    // guides: Array,

    // references: use populate 基本上替換我們引用的字段，實際相關的數據 populate process always happens in a query
    guides: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
      },
    ],
    // 子引用範例
    // reviews: [
    //   {
    //     type: mongoose.Schema.ObjectId,
    //     ref: 'Review',
    //   },
    // ],
  },
  {
    // By default virtual property 不會從document轉為json 如果想要被自動轉換就必須將此狀態開啟
    toJSON: { virtuals: true },
    // By default virtual property 不會被console.log 在結果, 如果想要被打印出來就必須將此狀態開啟
    toObject: { virtuals: true },
  }
);
// 1升序 0降序
// tourSchema.index({ price: 1 });
tourSchema.index({ price: 1, ratingsAverage: -1 });
tourSchema.index({ slug: 1 });
tourSchema.index({ startLocation: '2dsphere' });
// 建立虛擬 property  get 用來處理虛擬property
// virtual properties 不能用於 query , technically virtual properties was not part of database
tourSchema.virtual('durationWeeks').get(function () {
  return this.duration / 7;
});

// Virtual populate  (子引用) 虛擬填充 不會有無限增長的問題 // 在tourController getOne 那邊填充
tourSchema.virtual('reviews', {
  ref: 'Review', //
  foreignField: 'tour', // 儲存對 當前模型引用的位置（reviewModel.tour) => 在別的模組出現的稱呼
  localField: '_id', // local model的稱呼
});

// mongoose 四種 middleware : document, query, aggregate, model  middleware
// post middleware are executed after the hooked method and all of its pre middleware have completed.

// Document Middleware: 此函數將會在實際文檔之前被調用, runs before .save() and .create(){only this two}, but not include insertMany()
// pre save hook
tourSchema.pre('save', function (next) {
  this.slug = slugify(this.name, { lower: true });
  next();
}); // 在實際事件之前運行

// embedded methods
// tourSchema.pre('save', async function (next) {
//   // 因為返回的都是Promise  所以這是一個充滿 promise 的陣列
//   const guidesPromises = this.guides.map(async (id) => await User.findById(id));
//   // use Promise.all 等待所有結果出現
//   this.guides = await Promise.all(guidesPromises);
//   next();
// });

// Query Middleware
// 使用情境： 特殊隱藏的高級服務 或是內部才知道的 旅行內容

// tourSchema.pre('find', function (next) {
tourSchema.pre(/^find/, function (next) {
  this.find({ secretTour: { $ne: true } });
  this.start = Date.now();
  next();
});

tourSchema.pre(/^find/, function (next) {
  // this alway points to the current query
  this.populate({
    path: 'guides',
    select: '-__v -passwordChangedAt',
  });
  next();
});

// post middleware are executed after the hooked method and all of its pre middleware have completed.
// eslint-disable-next-line prefer-arrow-callback
tourSchema.post(/^find/, function (docs, next) {
  console.log(`Quick look spent time: ${Date.now() - this.start} milliseconds`);
  next();
});

// Aggregation Middleware 准許我們添加 hook 在aggregation 發生之前或之後
// tourSchema.pre('aggregate', function (next) {
//   this.pipeline().unshift({
//     $match: { secretTour: { $ne: true } },
//   });
//   console.log(this.pipeline());
//   next();
// });

const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;

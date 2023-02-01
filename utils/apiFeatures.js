class APIFeatures {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
  }

  filter() {
    // 1A) Filtering 去除 特定功能字段
    const queryObj = { ...this.queryString };
    const excludedFields = ['page', 'sort', 'limit', 'fields'];
    excludedFields.forEach((el) => delete queryObj[el]);

    // 1B) Advance filtering example: price[gte] = 500
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);

    // 處理過後的數據形態
    // {difficulty: 'easy', duration:{$gte: 5}}
    // 近來的數據形態
    // {difficulty: 'easy', duration:{gte: '5'}}
    // gte, gt, lte, lt

    // let query = Tour.find(JSON.parse(queryStr));
    this.query = this.query.find(JSON.parse(queryStr));

    return this;
  }

  sort() {
    // 2) Sorting example: ?sort=-price,createdAt
    if (this.queryString.sort) {
      // 近來資料型態: ?sort=-price,createdAt  =>  -price created  (符合sort function 輸入型態)
      const sortBy = this.queryString.sort.split(',').join(' ');
      console.log(sortBy);
      this.query = this.query.sort(sortBy);
    } else {
      // 預設 排列方式
      this.query = this.query.sort('-createdAt');
    }
    return this;
  }

  limitFields() {
    // 3) Field limiting
    if (this.queryString.fields) {
      const fields = this.queryString.fields.split(',').join(' ');
      // 只會選擇 範圍內的字
      // console.log(fields);
      this.query = this.query.select(fields);
    } else {
      // 前面加一個 - 可以變成除外
      this.query = this.query.select('-__v');
    }
    return this;
  }

  pagination() {
    // 4) pagination 分頁
    const page = this.queryString.page * 1 || 1;
    const limit = this.queryString.limit * 1 || 100;
    const skip = (page - 1) * limit;

    // example : page=2&limit=10, 1-10, page 1, 11-20, page 2, 21-30 page 3
    this.query = this.query.skip(skip).limit(limit);

    // 只會發生在 有query page 查詢時
    // if (this.queryString.page) {
    //   const numberTours = await Tour.countDocuments();
    //   if (skip >= numberTours) {
    //     // 創建 Error 給catch捕捉
    //     throw new Error('This page does not exist');
    //   }
    // }
    return this;
  }
}

module.exports = APIFeatures;

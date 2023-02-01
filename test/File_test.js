// controller section
//////////////////////////////////////////////////////////
// 測試用
// const tours = JSON.parse(
//   fs.readFileSync(`${__dirname}/../dev-data/data/tours-simple.json`)
// );

// File 測試用
//////////////////////////////////////////////////////////
// exports.checkBody = (req, res, next) => {
//   console.log('work');
//   // !req.body.name  !req.body.price  hasOwnProperty('name')
//   if (!req.body.name || !req.body.price) {
//     return res.status(400).json({
//       status: 'Bad Request',
//       message: 'JSON file format was not right!',
//     });
//   }
//   next();
// };
//////////////////////////////////////////////////////////

// File 測試用
//////////////////////////////////////////////////////////
// exports.checkID = (req, res, next, val) => {
//   console.log(`Tour id is :${val}`);
//   if (req.params.id * 1 > tours.length) {
//     return res.status(404).json({
//       status: 'error',
//       message: 'Invalid Id',
//     });
//   }
//   next();
// };
//////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////

//////////////////////////////////////////////////////////
// gettour()
// File 測試用
//////////////////////////////////////////////////////////
//console.log(req.params);
//console.log(tours);
// const tour = tours.find((el) => el.id === id);
// //   if (id > tours.length) {
// res.status(200).json({
//   status: 'success',
//   data: {
//     tour,
//   },
// });
//////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////

//////////////////////////////////////////////////////////
// create a new tour
// File 測試用
//////////////////////////////////////////////////////////
//console.log(req.body);
// const newId = tours[tours.length - 1].id + 1;
// const newTour = Object.assign({ id: newId }, req.body);
// // console.log(newId);
// tours.push(newTour);
// fs.writeFile(
//   `${__dirname}/../dev-data/data/tours-simple.json`,
//   JSON.stringify(tours),
//   (err) => {
//     res.status(201).json({
//       status: 'success',
//       date: {
//         tour: newTour,
//       },
//     });
//   }
// );
//////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////

// 像sql語法的使用方式
// const tours = await Tour.find()
//   .where('duration')
//   .equals(5)
//   .where('difficulty')
//   .equals('easy');

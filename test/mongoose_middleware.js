// moogoose 四種 middleware : document, query, aggregate, model  middleware

// Reference
////////////////////////////////////////////////////////////////
// Document middleware: 此函數將會在實際文檔之前被調用, runs before .save() and .create(){only this two}, but not include insertMany()
// pre save hook
// tourSchema.pre('save', (next) => {
//   console.log('Will save document....');
//   next();
// });

// tourSchema.post('save', (doc, next) => {
//   console.log(doc);
//   next();
// });
////////////////////////////////////////////////////////////////

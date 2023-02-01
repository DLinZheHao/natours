const mongoose = require('mongoose');
const dotenv = require('dotenv');

// 最後安全網
process.on('uncaughtException', (err) => {
  console.log(err.name, err.message);
  console.log('Unhandled Rejection! Shutting down... ');
  process.exit(1);
});

dotenv.config({ path: './config.env' });

const app = require('./app');

mongoose.set('strictQuery', true);

const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);
// Database 的連接 屬於 express之外
//mongoose.connect(local_host, { useNewUrlParser: true });
mongoose
  //.connect(process.env.DATABASE_LOCAL)//
  .connect(DB, {
    useNewUrlParser: true,
  })
  .then(() => {
    //console.log(con.connections);
    console.log('DB connection successfully established');
  });

//console.log(app.get('env'));
//console.log(process.env);

const port = process.env.PORT;
const server = app.listen(port, (req, res) => {
  console.log(`App running on port ${port} ....`);
});

// unhandled rejection
// 可能發生程式以外的 問題 例如 databse 連接問題
process.on('unhandledRejection', (err) => {
  console.log(err.name, err.message);
  console.log('Unhandled Rejection! Shutting down... ');
  server.close(() => {
    process.exit(1);
  });
});

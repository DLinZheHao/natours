// 所有操作性的問題 都會利用這個 AppError 進行錯誤創建
class AppError extends Error {
  constructor(message, statusCode) {
    // 呼叫父級 Error 只接受訊息 這邊父級就已經接收到message 不需要再設置一次
    super(message);

    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    // constructor function 如果有被調用 那麼這個function call 就不會出現在stack trace 污染log
    Error.captureStackTrace(this, this.constructor);
  }
}
module.exports = AppError;

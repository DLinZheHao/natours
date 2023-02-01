module.exports = (fn) => {
  // 返回 async function 中 執行的 req,res next
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};

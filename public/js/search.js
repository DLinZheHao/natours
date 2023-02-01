import { showAlert } from './alerts';
export const search_tour = async (keyword) => {
  try {
    console.log(keyword);
    const res = await axios({
      method: 'GET',
      url: 'http://127.0.0.1:3000/search',
      data: {
        keyword: keyword,
      },
    });
    if (res.data.status === 'success') {
      showAlert('success', '搜尋成功');
    }
  } catch (err) {
    showAlert('error', '搜尋失敗');
  }
};

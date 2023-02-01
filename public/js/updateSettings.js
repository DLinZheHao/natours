// updateData
import { showAlert } from './alerts';
export const updateSettings = async (data, type) => {
  // type is either 'password' or 'data'
  try {
    const url =
      type === 'password'
        ? 'http://127.0.0.1:3000/api/v1/users/updateMyPassword'
        : 'http://127.0.0.1:3000/api/v1/users/updateMe';

    const res = await axios({
      method: 'PATCH',
      url,
      data,
    });

    if (res.data.status === 'success') {
      showAlert('success', `${type.toUpperCase()} 更改完成！`);
      console.log('有成功');
      //   window.setTimeout(() => {
      //     location.assign('/me');
      //   }, 500);
    }
  } catch (err) {
    showAlert('error', err.response.data.message);
  }
};

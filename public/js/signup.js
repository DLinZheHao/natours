import { showAlert } from './alerts';
export const signup = async (data) => {
  try {
    const res = await axios({
      method: 'POST',
      url: 'http://127.0.0.1:3000/api/v1/users/signup',
      data: {
        name: data[0],
        email: data[1],
        password: data[2],
        passwordConfirm: data[3],
      },
    });
    console.log('send');
    if (res.data.status === 'success') {
      showAlert('success', '註冊成功');
      window.setTimeout(() => {
        location.assign('/');
      }, 500);
    }
  } catch (err) {
    showAlert('error', err.response.data.message);
    //console.log(err.response.data);
  }
};

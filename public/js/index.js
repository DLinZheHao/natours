import '@babel/polyfill';
import { login, logout } from './login';
import { displayMap } from './mapbox';
import { signup } from './signup';
import { updateSettings } from './updateSettings';
import { search_tour } from './search';
// DOM element
const mapBox = document.getElementById('map');
const loginForm = document.querySelector('#login');
const signupForm = document.querySelector('#signup');
const logOutBtn = document.querySelector('.nav__el--logout');
const updateForm = document.querySelector('.form-user-data');
const updatePasswordForm = document.querySelector('.form-user-settings');

// 首頁搜尋功能 尚未實裝
const searchForm = document.querySelector('#search_form');

// if (searchForm) {
//   searchForm.addEventListener('submit', (e) => {
//     e.preventDefault();
//     const keyword = document.getElementById('keyword').value.trim();
//     search_tour(keyword);
//   });
// }

if (mapBox) {
  const locations = JSON.parse(mapBox.dataset.locations);
  displayMap(locations);
}

if (loginForm) {
  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    // Value
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    login(email, password);
  });
}

if (signupForm) {
  signupForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const passwordConfirm = document.getElementById('passwordConfirm').value;
    const data = [name, email, password, passwordConfirm];

    signup(data);
  });
}

if (logOutBtn) {
  logOutBtn.addEventListener('click', logout);
}

if (updateForm) {
  updateForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;

    updateSettings({ name, email }, 'data');
  });
}

if (updatePasswordForm) {
  updatePasswordForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    document.querySelector('.btn--save-password').textContent = 'Updating...';
    const passwordCurrent = document.getElementById('password-current').value;
    const password = document.getElementById('password').value;
    const passwordConfirm = document.getElementById('password-confirm').value;

    await updateSettings(
      { passwordCurrent, password, passwordConfirm },
      'password'
    );

    document.querySelector('.btn--save-password').textContent = 'Save password';
    document.getElementById('password-current').value = '';
    document.getElementById('password').value = '';
    document.getElementById('password-confirm').value = '';
  });
}

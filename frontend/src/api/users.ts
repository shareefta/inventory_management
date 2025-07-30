import axios from 'axios';

import { UserProps } from 'src/sections/user/user-table-row';

const BASE_URL = 'https://razaworld.uk/api/accounts/users/';
const CREATE_URL = 'https://razaworld.uk/api/accounts/create/';
const ME_URL = 'https://razaworld.uk/api/accounts/me/';

function authHeaders() {
  const token = localStorage.getItem('token');
  return {
    Authorization: `Bearer ${token}`,
  };
}

export async function getUsers(): Promise<UserProps[]> {
  const response = await axios.get(BASE_URL, {
    headers: authHeaders(),
  });
  return response.data;
}

export async function createUser(data: Omit<UserProps, 'id'> & { password: string }) {
  const response = await axios.post(CREATE_URL, data, {
    headers: authHeaders(),
  });

  window.dispatchEvent(new Event('user-update'));
  return response.data;
}

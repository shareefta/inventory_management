import axios from 'axios';

const API_URL = 'https://razaworld.uk/api/accounts/login/';

export const login = async (username: string, password: string) => {
  try {
    const response = await axios.post(API_URL, { username, password });
    return response.data;
  } catch (error: any) {
    throw error.response?.data || { detail: 'Unknown error during login' };
  }
};


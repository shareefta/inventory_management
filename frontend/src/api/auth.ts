import axios from 'axios';

const API_URL = 'http://143.110.191.99/api/accounts/login/';

export const login = async (username: string, password: string) => {
  try {
    const response = await axios.post(API_URL, { username, password });
    return response.data;
  } catch (error: any) {
    throw error.response?.data || { detail: 'Unknown error during login' };
  }
};


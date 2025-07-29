import axios from 'axios';

const BACKEND_BARCODE_LOOKUP_URL = 'https://razaworld.uk/api/products/external_barcode/';

export async function fetchFromBarcodeLookup(barcode: string) {
  try {
    const response = await axios.get(BACKEND_BARCODE_LOOKUP_URL, {
      params: { barcode },
    });
    return response.data;
  } catch (error) {
    console.error('External API error:', error);
    throw error;
  }
}

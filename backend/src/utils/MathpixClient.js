import pkg from 'node-fetch';
const { FormData } = pkg;

export default class MathpixClient {
  constructor({ appId, appKey }) {
    if (!appId || !appKey) {
      throw new Error('Mathpix credentials must be provided');
    }
    this.appId = appId;
    this.appKey = appKey;
    this.apiUrl = 'https://api.mathpix.com/v3/pdf';
  }

  // Accepts a Buffer and filename, returns Mathpix API response
  async uploadPdf(buffer, originalname, options = {}) {
    const form = new FormData();
    form.append('file', buffer, originalname);
    form.append('options_json', JSON.stringify({
      conversion_formats: { docx: true, "tex.zip": true },
      math_inline_delimiters: ["$", "$"],
      rm_spaces: true,
      ...options
    }));

    const response = await fetch(this.apiUrl, {
      method: 'POST',
      headers: {
        'app_id': this.appId,
        'app_key': this.appKey
      },
      body: form
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Mathpix API error: ${errorText}`);
    }

    return await response.json();
  }
}

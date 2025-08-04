import fetch, { FormData, fileFromSync } from 'node-fetch';

const scanController = () => {
  const form = new FormData();
    form.append('file', fileFromSync('../../../QstoTest.pdf'));
    form.append('options_json', '{"conversion_formats": {"docx": true, "tex.zip": true}, "math_inline_delimiters": ["$", "$"], "rm_spaces": true}');

    fetch('https://api.mathpix.com/v3/pdf', {
      method: 'POST',
      headers: {
        'app_id': process.env.MATHPIX_API_ID,
        'app_key': process.env.MATHPIX_API_KEY
      },
      body: form
  });
}

export default scanController
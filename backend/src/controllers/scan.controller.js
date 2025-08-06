import fetch, { FormData, fileFromSync } from 'node-fetch';

const scanPdf = (req, res) => {


    const form = new FormData();
    form.append('file', fileFromSync('cs229-notes5.pdf'));
    form.append('options_json', '{"conversion_formats": {"docx": true, "tex.zip": true}, "math_inline_delimiters": ["$", "$"], "rm_spaces": true}');

    const pdfId = fetch('https://api.mathpix.com/v3/pdf', {
    method: 'POST',
    headers: {
        'app_id': process.env.MATHPIX_API_ID,
        'app_key': process.env.MATHPIX_API_KEY
    },
    body: form
    });

    console.log(pdfId)
}

/*
import fetch from 'node-fetch';

fetch('https://api.mathpix.com/v3/pdf', {
  method: 'POST',
  headers: {
    'app_id': 'APP_ID',
    'app_key': 'APP_KEY',
    'Content-Type': 'application/json'
  },
  // body: '{ "url": "https://cdn.mathpix.com/examples/cs229-notes1.pdf", "conversion_formats": {"docx": true, "tex.zip": true}}',
  body: JSON.stringify({
    'url': 'https://cdn.mathpix.com/examples/cs229-notes1.pdf',
    'conversion_formats': {
      'docx': true,
      'tex.zip': true
    }
  })
});
*/

/*
curl --location --request GET 'https://api.mathpix.com/v3/pdf/{pdf_id}.mmd' \
--header 'app_key: APP_KEY' \
--header 'app_id: APP_ID' > {pdf_id}.mmd

curl --location --request GET 'https://api.mathpix.com/v3/pdf/{pdf_id}.docx' \
--header 'app_key: APP_KEY' \
--header 'app_id: APP_ID' > {pdf_id}.docx

curl --location --request GET 'https://api.mathpix.com/v3/pdf/{pdf_id}.tex' \
--header 'app_key: APP_KEY' \
--header 'app_id: APP_ID' > {pdf_id}.tex.zip

curl --location --request GET 'https://api.mathpix.com/v3/pdf/{pdf_id}.html' \
--header 'app_key: APP_KEY' \
--header 'app_id: APP_ID' > {pdf_id}.html

curl --location --request GET 'https://api.mathpix.com/v3/pdf/{pdf_id}.lines.json' \
--header 'app_key: APP_KEY' \
--header 'app_id: APP_ID' > {pdf_id}.lines.json

curl --location --request GET 'https://api.mathpix.com/v3/pdf/{pdf_id}.lines.mmd.json' \
--header 'app_key: APP_KEY' \
--header 'app_id: APP_ID' > {pdf_id}.lines.mmd.json

curl --location --request GET 'https://api.mathpix.com/v3/pdf/{pdf_id}.pptx' \
--header 'app_key: APP_KEY' \
--header 'app_id: APP_ID' > {pdf_id}.pptx
*/
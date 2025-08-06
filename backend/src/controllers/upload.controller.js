import pkg from 'node-fetch'
const { FormData, fileFromSync } = pkg

const upload = async(req, res) => {
  const pdf_file = req.file
  const form = new FormData()
  try {
    form.append('file', fileFromSync(pdf_file.path));
    form.append('options_json', '{ "math_inline_delimiters": ["$", "$"], "rm_spaces": true}');
    const response = await fetch('https://api.mathpix.com/v3/pdf', {
    method: 'POST',
    headers: {
      'app_id': process.env.MATHPIX_API_ID,
      'app_key': process.env.MATHPIX_API_KEY
    },
    body: form
    });

    console.log(response);

    res.status(200)
    
  } catch (error) {
    console.error(error);
    res.status(500)
    console.error(error);
    
  }
}

export ( upload )
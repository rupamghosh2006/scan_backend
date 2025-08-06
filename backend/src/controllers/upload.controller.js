import axios from 'axios';
import FormData from 'form-data';
import * as fs from 'fs';

const upload = async (req, res) => {
  const pdf_file = req.file
  
  try {
    const form = new FormData();
    form.append('file', fs.readFileSync(pdf_file.path), pdf_file.path);
    form.append('options_json', '{ "math_inline_delimiters": ["$", "$"], "rm_spaces": true}');

    const response = await axios.post(
      'https://api.mathpix.com/v3/pdf',
      form,
      {
        headers: {
          ...form.getHeaders(),
          'app_id': process.env.MATHPIX_API_ID,
          'app_key': process.env.MATHPIX_API_KEY
        }
      }
    )

    const responseData = await response.data
    console.log(responseData)
    
    res.status(200).json({
      success: true,
      message: "PDF processed successfully",
      data: responseData
    })
    
  } catch (error) {
    console.error(error)
    
    // Send proper error response
    res.status(500).json({
      success: false,
      message: "Failed to process PDF",
      error: error.message
    })
  }
}

export { upload }
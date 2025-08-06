import { fileFromSync } from "node-fetch"

const PDF_LINK = 'https://api.mathpix.com/v3/pdf'

const upload = async (req, res) => {
  const pdf_file = req.file
  
  try {
    const form = new FormData()
    form.append('file', fileFromSync(pdf_file.path))
    form.append('options_json', '{"conversion_formats": {"docx": true, "tex.zip": true}, "math_inline_delimiters": ["$", "$"], "rm_spaces": true}')

    const response = await fetch(PDF_LINK, {
      method: 'POST',
      headers: {
        'app_id': process.env.MATHPIX_API_ID,
        'app_key': process.env.MATHPIX_API_KEY
      },
      body: form
    })
    
    const responseData = await response.json()
    
    console.log(responseData)
    
    res.status(200).json({
      success: true,
      message: "PDF File processed to Mathpix",
    })
    
  } catch (error) {
    console.error(error.message)
    res.status(500).json({
      success: false,
      message: "Failed to upload PDF to Mathpix",
      error: error.message
    })
  }
}

export { upload }
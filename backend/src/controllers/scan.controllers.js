/// MOSTLY VIBE CODED :) but check from line 43, 64. Thats imp dos
import FormData from 'form-data';

const scanpdf = async (req, res) => {
  try {
    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No PDF file uploaded"
      });
    }

    const pdfFile = req.file;
    
    // Validate file type
    if (pdfFile.mimetype !== 'application/pdf') {
      return res.status(400).json({
        success: false,
        message: "Please upload a valid PDF file"
      });
    }

    // Create form data for Mathpix API
    const formData = new FormData();
    formData.append('file', pdfFile.buffer, {
      filename: pdfFile.originalname,
      contentType: 'application/pdf'
    });

    // Add options for Mathpix API
    const options = {
      conversion_formats: {
        docx: true,
        "tex.zip": true
      },
      math_inline_delimiters: ["$", "$"],
      rm_spaces: true
    };
    
    formData.append('options_json', JSON.stringify(options));


    /*
    MATHPIX cURL TUTORIAL FROM DOC
    curl --location --request POST 'https://api.mathpix.com/v3/pdf' \
      --header 'app_id: APP_ID' \
      --header 'app_key: APP_KEY' \
      --form 'file=@"cs229-notes5.pdf"' \
      --form 'options_json="{\"conversion_formats\": {\"docx\": true, \"tex.zip\": true}, \"math_inline_delimiters\": [\"$\", \"$\"], \"rm_spaces\": true}"'
    */

    // Make request to Mathpix API using fetch
    const mathpixResponse = await fetch('https://api.mathpix.com/v3/pdf', {
      method: 'POST',
      headers: {
        'app_id': process.env.MATHPIX_APP_ID,
        'app_key': process.env.MATHPIX_APP_KEY,
        ...formData.getHeaders()
      },
      body: formData
    });

    // Check if the response is successful (CHECK THIS...)
    if (!mathpixResponse.ok) {
      const errorData = await mathpixResponse.json().catch(() => ({}));
      return res.status(mathpixResponse.status).json({
        success: false,
        message: "Mathpix API error",
        error: errorData
      });
    }

    // Parse the response data
    const responseData = await mathpixResponse.json();

    // Return success response
    return res.status(200).json({
      success: true,
      message: "PDF processed successfully",
      data: responseData,
      fileInfo: {
        filename: pdfFile.originalname,
        size: pdfFile.size,
        mimetype: pdfFile.mimetype
      }
    });

  } catch (error) {
    console.error('Error processing PDF:', error);
    
    // Handle network or other errors
    return res.status(500).json({
      success: false,
      message: "Internal server error while processing PDF",
      error: error.message
    });
  }
};

export { scanpdf };
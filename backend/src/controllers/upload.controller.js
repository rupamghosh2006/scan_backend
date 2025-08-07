import axios from 'axios';
import FormData from 'form-data';
import * as fs from 'fs';
import path from 'path';

const upload = async (req, res) => {
    const pdf_file = req.file;
    
    try {
        const form = new FormData();
        form.append('file', fs.readFileSync(pdf_file.path), pdf_file.path);
        form.append('options_json', '{ "math_inline_delimiters": ["$", "$"], "rm_spaces": true}');
        
        // Upload PDF
        const postResponse = await axios.post(
            'https://api.mathpix.com/v3/pdf',
            form,
            {
                headers: {
                    ...form.getHeaders(),
                    'app_id': process.env.MATHPIX_API_ID,
                    'app_key': process.env.MATHPIX_API_KEY
                }
            }
        );
        
        const pdf_id = postResponse.data.pdf_id;
        fs.rmSync(pdf_file.path);
        
        console.log(`PDF uploaded successfully. PDF ID: ${pdf_id}`);
        
        // Poll for completion {Polling is necessary because PDF processing takes time - it's not instant. ~Claude beloved :3}
        const maxAttempts = 30; // Maximum polling attempts
        const pollInterval = 2000; // 2 seconds between polls
        let attempts = 0;
        let isComplete = false;
        
        while (!isComplete && attempts < maxAttempts) {
            attempts++;
            console.log(`Checking processing status... Attempt ${attempts}`);
            
            try {
                const statusResponse = await axios.get(
                    `https://api.mathpix.com/v3/pdf/${pdf_id}`,
                    {
                        headers: {
                            'app_id': process.env.MATHPIX_API_ID,
                            'app_key': process.env.MATHPIX_API_KEY
                        }
                    }
                );
                
                const status = statusResponse.data.status;
                console.log(`Status: ${status}`);
                
                if (status === 'completed') {
                    isComplete = true;
                    
                    // Get the processed data
                    const resultResponse = await axios.get(
                        `https://api.mathpix.com/v3/pdf/${pdf_id}.mmd`,
                        {
                            headers: {
                                'app_id': process.env.MATHPIX_API_ID,
                                'app_key': process.env.MATHPIX_API_KEY
                            }
                        }
                    );
                    const mmdFilename = `${pdf_id}.mmd`;
                    
                    const publicDir = path.join(process.cwd(), 'public/temp');
                    const mmdPath = path.join(publicDir, mmdFilename);
                    fs.writeFileSync(mmdPath, resultResponse.data);
                    
                    console.log(`Files saved:`);
                    console.log(`MMD: ${mmdPath}`);
                    
                    res.status(200).json({
                        success: true,
                        message: "PDF processed successfully",
                        data: {
                            pdf_id: pdf_id,
                            status: status,
                            json_file: jsonFilename,
                            json_path: jsonPath,
                            mmd_file: mmdFilename,
                            mmd_path: mmdPath,
                            processing_time: `${attempts * pollInterval / 1000} seconds`
                        }
                    });
                    
                } else if (status === 'error' || status === 'failed') {
                    throw new Error(`PDF processing failed with status: ${status}`);
                } else {
                    // Still processing, wait before next poll
                    await new Promise(resolve => setTimeout(resolve, pollInterval));
                }
                
            } catch (pollError) {
                console.error(`Error checking status: ${pollError.message}`);
                // Continue polling unless it's a critical error
                if (pollError.response?.status === 404) {
                    throw new Error('PDF not found - may have expired');
                }
                await new Promise(resolve => setTimeout(resolve, pollInterval));
            }
        }
        
        if (!isComplete) {
            throw new Error(`PDF processing timeout after ${maxAttempts * pollInterval / 1000} seconds`);
        }
        
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Failed to process PDF",
            error: error.message
        });
    }
};

export { upload };
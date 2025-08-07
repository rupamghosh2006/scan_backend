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
        
        const response = await axios.get(
            `https://api.mathpix.com/v3/pdf/${pdf_id}/stream`,
            {
                headers: {
                    'app_id': process.env.MATHPIX_API_ID,
                    'app_key': process.env.MATHPIX_API_KEY
                },
                responseType: 'stream'
            }
        );
        
        if (response.status === 200) {
            console.log("Connected to the stream!");
            
            let allData = [];
            let allText = '';
            
            // Create Promise to handle streaming
            const streamData = await new Promise((resolve, reject) => {
                let buffer = '';
                
                response.data.on('data', (chunk) => {
                    buffer += chunk.toString();
                    
                    // Process complete lines
                    let lines = buffer.split('\n');
                    buffer = lines.pop(); // Keep incomplete line in buffer
                    
                    for (const line of lines) {
                        if (line.trim()) {
                            try {
                                const data = JSON.parse(line);
                                allData.push(data);
                                if (data.text) {
                                    allText += data.text;
                                }
                            } catch (jsonError) {
                                console.log(`Failed to decode line: ${line}`);
                            }
                        }
                    }
                });
                
                response.data.on('end', () => {
                    // Process any remaining data in buffer
                    if (buffer.trim()) {
                        try {
                            const data = JSON.parse(buffer);
                            allData.push(data);
                            if (data.text) {
                                allText += data.text;
                            }
                        } catch (jsonError) {
                            console.log(`Failed to decode final line: ${buffer}`);
                        }
                    }
                    
                    resolve({ allData, allText });
                });
                
                response.data.on('error', (error) => {
                    reject(error);
                });
            });
            
            // Save to JSON file
            const jsonFilename = `pdf_${pdf_id}_${Date.now()}.json`;
            const jsonPath = path.join(process.cwd(), 'uploads', jsonFilename);
            
            // Ensure uploads directory exists
            const uploadsDir = path.dirname(jsonPath);
            if (!fs.existsSync(uploadsDir)) {
                fs.mkdirSync(uploadsDir, { recursive: true });
            }
            
            // Save JSON data
            fs.writeFileSync(jsonPath, JSON.stringify(streamData.allData, null, 2));
            
            // Optionally save as markdown/text file
            const mmdFilename = `pdf_${pdf_id}_${Date.now()}.mmd`;
            const mmdPath = path.join(process.cwd(), 'uploads', mmdFilename);
            fs.writeFileSync(mmdPath, streamData.allText);
            
            console.log(`Saved JSON to: ${jsonPath}`);
            console.log(`Saved text to: ${mmdPath}`);
            
            res.status(200).json({
                success: true,
                message: "PDF processed successfully",
                data: {
                    pdf_id: pdf_id,
                    json_file: jsonFilename,
                    json_path: jsonPath,
                    mmd_file: mmdFilename,
                    mmd_path: mmdPath,
                    total_chunks: streamData.allData.length
                }
            });
            
        } else {
            throw new Error(`Failed to connect to stream: ${response.status}`);
        }
        
    } catch (error) {
        console.error(error);
        // Send proper error response
        res.status(500).json({
            success: false,
            message: "Failed to process PDF",
            error: error.message
        });
    }
};

export { upload };
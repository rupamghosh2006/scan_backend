import axios from 'axios';
import FormData from 'form-data';
import * as fs from 'fs';
import path from 'path';

function extractQuestionsImproved(text) {
    const questions = [];
    
    // More sophisticated regex patterns for Bengali mathematical text
    const questionPattern = /(\d+)\.\s*([^(]+?)(?=\s*\([A-D]\))/g;
    const optionPattern = /\([A-D]\)\s*([^(]+?)(?=\s*\([A-D]\)|\s*\d+\.|$)/g;
    
    // Split into sections and process each
    const sections = text.split(/(?=\d+\.\s)/);
    
    for (const section of sections) {
        if (!section.trim()) continue;
        
        const lines = section.split('\n').map(l => l.trim()).filter(l => l.length > 0);
        if (lines.length === 0) continue;
        
        // Find question number and text
        const firstLine = lines[0];
        const qMatch = firstLine.match(/^(\d+)\.\s*(.+)/);
        
        if (!qMatch) continue;
        
        let questionText = qMatch[2];
        let currentLineIndex = 1;
        
        // Continue collecting question text until we hit options
        while (currentLineIndex < lines.length && !lines[currentLineIndex].match(/^\([A-D]\)/)) {
            if (!lines[currentLineIndex].match(/^\d+\./) && 
                !lines[currentLineIndex].includes('\\') &&
                !lines[currentLineIndex].includes('স্তম্ভ')) {
                questionText += ' ' + lines[currentLineIndex];
            }
            currentLineIndex++;
        }
        
        // Extract options
        const options = [];
        const remainingText = lines.slice(currentLineIndex).join(' ');
        
        const optionMatches = [...remainingText.matchAll(/\([A-D]\)\s*([^(]+?)(?=\s*\([A-D]\)|$)/g)];
        
        if (optionMatches.length >= 4) {
            for (let i = 0; i < 4; i++) {
                options.push(optionMatches[i][1].trim());
            }
            
            // Clean question text
            questionText = questionText
                .replace(/\s+/g, ' ')
                .replace(/হলে\s*নীচের\s*কোন্টি/g, 'হলে নীচের কোনটি')
                .trim();
            
            questions.push({
                question: questionText,
                diagram: null, // No diagrams in this text format
                options: options
            });
        }
    }
    
    return questions;
}

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
        const maxAttempts = 5; // Maximum polling attempts
        const pollInterval = 3000; // 2 seconds between polls
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
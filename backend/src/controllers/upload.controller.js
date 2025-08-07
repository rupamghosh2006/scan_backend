import axios from 'axios';
import FormData from 'form-data';
import * as fs from 'fs';

function extractQuestionsImproved(text) {
    const questions = [];
    
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
                diagram: null,
                options: options
            });
        }
    }
    
    return questions;
}

// Helper function to determine if file is an image
function isImageFile(mimetype) {
    const imageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    return imageTypes.includes(mimetype);
}

// Process PDF file
const processPDF = async (file) => {
    const form = new FormData();
    form.append('file', fs.readFileSync(file.path), file.path);
    form.append('options_json', '{ "math_inline_delimiters": ["$", "$"], "rm_spaces": true}');
    
    // Upload PDF to Mathpix
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
    console.log(`PDF uploaded successfully. PDF ID: ${pdf_id}`);
    
    // Poll for completion
    const maxAttempts = 5;
    const pollInterval = 7000;
    let attempts = 0;
    let isComplete = false;
    
    while (!isComplete && attempts < maxAttempts) {
        attempts++;
        console.log(`Checking PDF processing status... Attempt ${attempts}`);
        
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
        console.log(`PDF Status: ${status}`);
        
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
            
            return {
                content: resultResponse.data,
                id: pdf_id,
                processingTime: `${attempts * pollInterval / 1000} seconds`
            };
            
        } else if (status === 'error' || status === 'failed') {
            throw new Error(`PDF processing failed with status: ${status}`);
        } else {
            await new Promise(resolve => setTimeout(resolve, pollInterval));
        }
    }
    
    if (!isComplete) {
        throw new Error(`PDF processing timeout after ${maxAttempts * pollInterval / 1000} seconds`);
    }
};

// Process Image file
const processImage = async (file) => {
    const form = new FormData();
    form.append('file', fs.readFileSync(file.path), file.originalname);
    form.append('options_json', JSON.stringify({
        math_inline_delimiters: ["$", "$"],
        rm_spaces: true
    }));
    
    // Upload image to Mathpix
    const response = await axios.post(
        'https://api.mathpix.com/v3/text',
        form,
        {
            headers: {
                ...form.getHeaders(),
                'app_id': process.env.MATHPIX_API_ID,
                'app_key': process.env.MATHPIX_API_KEY
            }
        }
    );
    
    console.log('Image processed successfully');
    
    return {
        content: response.data.text || response.data.latex || '',
        id: `img_${Date.now()}`,
        processingTime: '1 second'
    };
};

const upload = async (req, res) => {
    const uploadedFile = req.file;
    
    if (!uploadedFile) {
        return res.status(400).json({
            success: false,
            message: "No file uploaded"
        });
    }
    
    try {
        let result;
        let fileType;
        
        // Determine file type and process accordingly
        if (uploadedFile.mimetype === 'application/pdf') {
            fileType = 'pdf';
            result = await processPDF(uploadedFile);
        } else if (isImageFile(uploadedFile.mimetype)) {
            fileType = 'image';
            result = await processImage(uploadedFile);
        } else {
            throw new Error('Unsupported file type');
        }
        
        // Clean up uploaded file
        fs.rmSync(uploadedFile.path);
        
        // Extract questions from the content
        const extractedQuestions = extractQuestionsImproved(result.content);
        
        console.log(`Extracted ${extractedQuestions.length} questions from ${fileType}`);
        
        // Send JSON response with extracted questions
        res.status(200).json({
            success: true,
            message: `${fileType.toUpperCase()} processed and questions extracted successfully`,
            data: {
                file_type: fileType,
                pdf_id: result.id, // Keep this name for backwards compatibility
                total_questions: extractedQuestions.length,
                questions: extractedQuestions,
                processing_time: result.processingTime,
                original_filename: uploadedFile.originalname
            }
        });
        
    } catch (error) {
        console.error('Upload error:', error);
        
        // Clean up file if it still exists
        if (uploadedFile && fs.existsSync(uploadedFile.path)) {
            fs.rmSync(uploadedFile.path);
        }
        
        res.status(500).json({
            success: false,
            message: "Failed to process file",
            error: error.message
        });
    }
};

export { upload };
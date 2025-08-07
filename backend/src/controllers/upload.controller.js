import axios from 'axios';
import FormData from 'form-data';
import * as fs from 'fs';

import { extractQuestionsImproved, cleanMathpixContent } from '../utils/mmdHandling.js';

// Helper function to determine if file is an image
function isImageFile(mimetype) {
    const imageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    return imageTypes.includes(mimetype);
}

// Process PDF file
const processPDF = async (file) => {
    const form = new FormData();
    form.append('file', fs.readFileSync(file.path), file.path);
    form.append('options_json', JSON.stringify({
        math_inline_delimiters: ["$", "$"],
        rm_spaces: true
    }));
    
    try {
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
        
        // Poll for completion with exponential backoff
        const maxAttempts = 6;
        const baseInterval = 5000; // Start with 5 seconds
        let attempts = 0;
        let totalWaitTime = 0;
        
        while (attempts < maxAttempts) {
            attempts++;
            const waitTime = Math.min(baseInterval * Math.pow(1.5, attempts - 1), 15000); // Max 15 seconds
            
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
                    processingTime: `${totalWaitTime / 1000} seconds`,
                    attempts: attempts
                };
                
            } else if (status === 'error' || status === 'failed') {
                throw new Error(`PDF processing failed with status: ${status}`);
            }
            
            // Wait before next attempt (except on last attempt)
            if (attempts < maxAttempts) {
                console.log(`Waiting ${waitTime / 1000} seconds before next check...`);
                await new Promise(resolve => setTimeout(resolve, waitTime));
                totalWaitTime += waitTime;
            }
        }
        
        throw new Error(`PDF processing timeout after ${totalWaitTime / 1000} seconds and ${maxAttempts} attempts`);
        
    } catch (error) {
        if (error.response) {
            console.error('Mathpix API Error:', error.response.status, error.response.data);
            throw new Error(`Mathpix API Error: ${error.response.status} - ${error.response.data?.error || error.message}`);
        }
        throw error;
    }
};

// Process Image file
const processImage = async (file) => {
    const form = new FormData();
    form.append('file', fs.readFileSync(file.path), file.originalname);
    form.append('options_json', JSON.stringify({
        "math_inline_delimiters": ["$", "$"],
        "rm_spaces": true,
        "data_options": {
            "include_table_html": true,
            "include_tsv": true
        }
    }));
    
    try {
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
            processingTime: '1 second',
            confidence: response.data.confidence || null
        };
        
    } catch (error) {
        if (error.response) {
            console.error('Mathpix API Error:', error.response.status, error.response.data);
            throw new Error(`Mathpix API Error: ${error.response.status} - ${error.response.data?.error || error.message}`);
        }
        throw error;
    }
};

// Generate extraction statistics
function generateExtractionStats(questions) {
    const stats = {
        total_questions: questions.length,
        question_types: {},
        questions_with_options: 0,
        questions_without_options: 0,
        average_options_per_question: 0,
        problematic_questions: []
    };
    
    let totalOptions = 0;
    
    questions.forEach((q, index) => {
        const type = q.type || 'unknown';
        stats.question_types[type] = (stats.question_types[type] || 0) + 1;
        
        if (q.options && q.options.length > 0) {
            stats.questions_with_options++;
            totalOptions += q.options.length;
            
            // Check for incomplete multiple choice
            if (q.type === 'multiple_choice' && q.options.length < 4) {
                stats.problematic_questions.push({
                    questionNumber: q.questionNumber || index + 1,
                    issue: 'incomplete_options',
                    optionCount: q.options.length
                });
            }
        } else {
            stats.questions_without_options++;
        }
        
        // Check for other potential issues
        if (q.question.length < 20) {
            stats.problematic_questions.push({
                questionNumber: q.questionNumber || index + 1,
                issue: 'very_short_question',
                length: q.question.length
            });
        }
    });
    
    stats.average_options_per_question = stats.questions_with_options > 0 
        ? (totalOptions / stats.questions_with_options).toFixed(1)
        : 0;
    
    return stats;
}

const upload = async (req, res) => {
    const uploadedFile = req.file;
    const startTime = Date.now();
    
    if (!uploadedFile) {
        return res.status(400).json({
            success: false,
            message: "No file uploaded"
        });
    }
    
    console.log(`Processing ${uploadedFile.mimetype} file: ${uploadedFile.originalname}`);
    
    try {
        let result;
        let fileType;
        
        // Validate file size (optional - adjust as needed)
        const maxSizeBytes = 50 * 1024 * 1024; // 50MB
        if (uploadedFile.size > maxSizeBytes) {
            throw new Error(`File too large. Maximum size is ${maxSizeBytes / (1024 * 1024)}MB`);
        }
        
        // Determine file type and process accordingly
        if (uploadedFile.mimetype === 'application/pdf') {
            fileType = 'pdf';
            result = await processPDF(uploadedFile);
        } else if (isImageFile(uploadedFile.mimetype)) {
            fileType = 'image';
            result = await processImage(uploadedFile);
        } else {
            throw new Error(`Unsupported file type: ${uploadedFile.mimetype}`);
        }
        
        // Clean up uploaded file immediately after processing
        try {
            fs.rmSync(uploadedFile.path);
        } catch (cleanupError) {
            console.warn('Warning: Could not clean up uploaded file:', cleanupError.message);
        }
        
        // Clean and extract questions from the content
        console.log(`Cleaning Mathpix content (${result.content.length} characters)`);
        const cleanedContent = cleanMathpixContent(result.content);
        console.log(`Content cleaned (${cleanedContent.length} characters)`);
        
        const extractedQuestions = extractQuestionsImproved(cleanedContent);
        
        // Generate comprehensive statistics
        const extractionStats = generateExtractionStats(extractedQuestions);
        
        // Enhanced logging
        console.log(`\n=== EXTRACTION SUMMARY ===`);
        console.log(`File: ${uploadedFile.originalname} (${fileType})`);
        console.log(`Processing time: ${result.processingTime}`);
        console.log(`Questions extracted: ${extractedQuestions.length}`);
        console.log(`Question types: ${Object.keys(extractionStats.question_types).join(', ')}`);
        console.log(`With options: ${extractionStats.questions_with_options}, Without: ${extractionStats.questions_without_options}`);
        
        if (extractionStats.problematic_questions.length > 0) {
            console.log(`⚠️  ${extractionStats.problematic_questions.length} questions may need review`);
        }
        console.log(`=========================\n`);
        
        // Calculate total processing time
        const totalTime = Date.now() - startTime;
        
        // Send comprehensive JSON response
        res.status(200).json({
            success: true,
            message: `${fileType.toUpperCase()} processed and ${extractedQuestions.length} questions extracted successfully`,
            data: {
                // File info
                file_info: {
                    type: fileType,
                    original_filename: uploadedFile.originalname,
                    file_size: uploadedFile.size,
                    mime_type: uploadedFile.mimetype
                },
                
                // Processing info
                processing_info: {
                    mathpix_id: result.id,
                    mathpix_processing_time: result.processingTime,
                    total_processing_time: `${(totalTime / 1000).toFixed(1)} seconds`,
                    attempts: result.attempts || 1,
                    confidence: result.confidence || null
                },
                
                // Content info
                content_info: {
                    original_content_length: result.content.length,
                    cleaned_content_length: cleanedContent.length,
                    cleaning_applied: result.content.length !== cleanedContent.length
                },
                
                // Questions data
                questions: extractedQuestions,
                
                // Statistics
                extraction_stats: extractionStats
            }
        });
        
    } catch (error) {
        console.error('Upload processing error:', error);
        
        // Clean up file if it still exists
        if (uploadedFile && fs.existsSync(uploadedFile.path)) {
            try {
                fs.rmSync(uploadedFile.path);
            } catch (cleanupError) {
                console.error('Error cleaning up file after failure:', cleanupError);
            }
        }
        
        // Return detailed error information
        res.status(500).json({
            success: false,
            message: "Failed to process file",
            error: {
                type: error.constructor.name,
                message: error.message,
                details: error.response?.data || null
            },
            file_info: uploadedFile ? {
                original_filename: uploadedFile.originalname,
                mime_type: uploadedFile.mimetype,
                file_size: uploadedFile.size
            } : null
        });
    }
};

export { upload };
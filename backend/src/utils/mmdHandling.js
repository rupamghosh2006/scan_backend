// Enhanced functions for parsing mathematical content with embedded options

function cleanMathpixContent(text) {
    return text
        // Remove HTML/CSS artifacts that Mathpix sometimes includes
        .replace(/<span[^>]*class="katex[^"]*"[^>]*>.*?<\/span>/gs, '')
        .replace(/<span[^>]*>.*?<\/span>/gs, '')
        .replace(/<math[^>]*>.*?<\/math>/gs, '')
        .replace(/=<span.*?<\/span>/gs, '')
        
        // Clean up specific artifacts
        .replace(/=<spanclass="katex−display">.*?<\/span>/gs, '')
        .replace(/class="[^"]*"/g, '')
        .replace(/style="[^"]*"/g, '')
        .replace(/aria−hidden="true"/g, '')
        .replace(/mathbackground="[^"]*"/g, '')
        .replace(/width="[^"]*"/g, '')
        .replace(/height="[^"]*"/g, '')
        
        // Remove broken HTML tags and entities
        .replace(/<[^>]*>/g, '')
        .replace(/&[a-zA-Z0-9#]+;/g, '')
        
        // Fix spacing between text and mathematical expressions
        .replace(/(\w)(\$\\vec\{)/g, '$1 $2') // Specific fix for vectors
        .replace(/(\w)(\$[^$]*\$)/g, '$1 $2') // General: word followed by complete math expression
        .replace(/(\$[^$]*\$)(\w)/g, '$1 $2') // General: complete math expression followed by word
        .replace(/field\$\\vec\{B\}\$/g, 'field $\\vec{B}$') // Specific examples
        .replace(/element\$\\vec\{I\}\$/g, 'element $\\vec{I}$')
        .replace(/distance\$\\vec\{r\}\$/g, 'distance $\\vec{r}$')
        .replace(/current\$i\$/g, 'current $i$')
        
        // Clean up mathematical expressions
        .replace(/\$\s*\$\s*/g, ' ') // Remove empty math delimiters
        .replace(/\$([^$]*)\$/g, '$$$1$$') // Ensure proper math delimiters
        
        // Fix common OCR/parsing errors
        .replace(/−/g, '-') // Replace unicode minus with regular hyphen
        .replace(/\s+/g, ' ') // Normalize whitespace
        .replace(/\n\s*\n\s*\n+/g, '\n\n') // Remove excessive line breaks
        
        // Clean up table formatting
        .replace(/\\hline\s*/g, '\\hline\n')
        .replace(/\\\\\s*\\hline/g, '\\\\\n\\hline')
        
        .trim();
}

// Enhanced function to extract mathematical options
function extractMathematicalOptions(text) {
    const options = [];
    
    // Pattern 1: Look for (a), (b), (c), (d) patterns in LaTeX
    const mathPattern1 = /\(([abcdABCD])\)\s*([^()]*?)(?=\s*\([abcdABCD]\)|$)/g;
    let matches = [...text.matchAll(mathPattern1)];
    
    if (matches.length >= 4) {
        for (let i = 0; i < 4; i++) {
            if (matches[i] && matches[i][2]) {
                options.push(matches[i][2].trim());
            }
        }
        return options;
    }
    
    // Pattern 2: Look for mathematical expressions with option markers
    const mathPattern2 = /\$([^$]*?)\$\s*\(([abcdABCD])\)/g;
    matches = [...text.matchAll(mathPattern2)];
    
    if (matches.length >= 4) {
        for (let i = 0; i < 4; i++) {
            if (matches[i] && matches[i][1]) {
                options.push(`$${matches[i][1].trim()}$`);
            }
        }
        return options;
    }
    
    // Pattern 3: Extract from structured mathematical text
    const structuredPattern = /(?:^|[^\\a-zA-Z])(\\\w+\{[^}]*\}(?:\{[^}]*\})*)\s*\(([abcdABCD])\)/g;
    matches = [...text.matchAll(structuredPattern)];
    
    if (matches.length >= 4) {
        for (let i = 0; i < 4; i++) {
            if (matches[i] && matches[i][1]) {
                options.push(matches[i][1].trim());
            }
        }
        return options;
    }
    
    // Pattern 4: Split by common mathematical separators and look for options
    const parts = text.split(/(?=\([abcdABCD]\))/);
    for (const part of parts) {
        const optMatch = part.match(/^\(([abcdABCD])\)\s*(.*)$/);
        if (optMatch && options.length < 4) {
            options.push(optMatch[2].trim());
        }
    }
    
    return options.slice(0, 4);
}

// Enhanced function to separate question from options in mathematical text
function separateQuestionFromOptions(text) {
    const cleanedText = cleanMathpixContent(text);
    
    // Remove question number at the beginning
    const textWithoutNumber = cleanedText.replace(/^\s*\d+\.\s*/, '');
    
    // Find the first occurrence of an option pattern
    const firstOptionMatch = textWithoutNumber.match(/\([abcdABCD]\)/);
    
    if (firstOptionMatch) {
        const optionStartIndex = textWithoutNumber.indexOf(firstOptionMatch[0]);
        const questionPart = textWithoutNumber.substring(0, optionStartIndex).trim();
        const optionsPart = textWithoutNumber.substring(optionStartIndex).trim();
        
        const options = extractMathematicalOptions(optionsPart);
        
        return {
            question: questionPart,
            options: options
        };
    }
    
    // If no clear option pattern found, try to extract from the entire text
    const options = extractMathematicalOptions(textWithoutNumber);
    if (options.length > 0) {
        // Remove option parts from question
        let questionText = textWithoutNumber;
        options.forEach((option, index) => {
            const optionLetter = String.fromCharCode(97 + index); // a, b, c, d
            const patterns = [
                new RegExp(`\\(${optionLetter}\\)\\s*${option.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'gi'),
                new RegExp(`\\(${optionLetter.toUpperCase()}\\)\\s*${option.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'gi')
            ];
            patterns.forEach(pattern => {
                questionText = questionText.replace(pattern, '').trim();
            });
        });
        
        return {
            question: questionText,
            options: options
        };
    }
    
    return {
        question: textWithoutNumber,
        options: []
    };
}

// Main parsing function for frontend use
function parseQuestionAndOptions(text) {
    const result = separateQuestionFromOptions(text);
    
    // Post-process question for better formatting
    let cleanQuestion = result.question
        .replace(/field\$\\vec\{B\}\$/g, 'field $\\vec{B}$')
        .replace(/element\$\\vec\{I\}\$/g, 'element $\\vec{I}$')
        .replace(/distance\$\\vec\{r\}\$/g, 'distance $\\vec{r}$')
        .replace(/current\$i\$/g, 'current $i$')
        .replace(/(\w)\$([^$]+)\$/g, '$1 $$2$') // General fix for word+math
        .replace(/\s+/g, ' ')
        .trim();
    
    // Ensure we have exactly 4 options (pad with empty strings if needed)
    while (result.options.length < 4) {
        result.options.push('');
    }
    
    return {
        question: cleanQuestion,
        options: result.options.slice(0, 4)
    };
}

// Enhanced question extraction with better mathematical content handling
function extractQuestionsImproved(text) {
    const questions = [];
    
    // First, clean the entire text
    const cleanedText = cleanMathpixContent(text);
    
    // Pre-process text to handle edge cases
    const preprocessedText = cleanedText
        .replace(/\\section\*\{[^}]*\}/g, '')
        .replace(/\r\n/g, '\n')
        .replace(/\s+(?=[।])/g, '')
        .replace(/यমি/g, 'যদি')
        .replace(/यদি/g, 'যদি')
        .replace(/तারে/g, 'তারে')
        .replace(/तবে/g, 'তবে');
    
    const sections = preprocessedText.split(/(?=\n?\s*\d+\.\s+)/);
    
    for (const section of sections) {
        if (!section.trim()) continue;
        
        const lines = section.split('\n').map(l => l.trim()).filter(l => l.length > 0);
        if (lines.length === 0) continue;
        
        const firstLine = lines[0];
        const qMatch = firstLine.match(/^(\d+)\.\s*(.+)/);
        
        if (!qMatch) continue;
        
        const questionNumber = parseInt(qMatch[1]);
        let questionText = qMatch[2];
        let currentLineIndex = 1;
        
        // Detect special content types
        const hasTabular = section.includes('\\begin{tabular}');
        const hasColumnMatching = section.includes('স্তম্ভ A') || section.includes('স্তম্ভ B');
        const hasFillInBlank = section.includes('_____') || questionText.includes('=') && questionText.includes('।');
        
        // Build complete question text
        const fullSectionText = lines.join(' ');
        
        // Use the enhanced separation function
        const parsed = separateQuestionFromOptions(fullSectionText);
        
        if (parsed.question) {
            questionText = parsed.question;
        }
        
        let options = parsed.options;
        
        // If no options found, try fallback methods
        if (options.length === 0) {
            const remainingLines = lines.slice(currentLineIndex);
            const remainingText = remainingLines.join(' ');
            
            const standardOptions = [...remainingText.matchAll(/\([A-D]\)\s*([^(]+?)(?=\s*\([A-D]\)|$)/g)];
            
            if (standardOptions.length >= 4) {
                for (let i = 0; i < 4; i++) {
                    options.push(standardOptions[i][1].trim());
                }
            }
        }
        
        // Final cleaning of question text with proper spacing
        questionText = questionText
            .replace(/\s+/g, ' ')
            .replace(/হলে\s*নীচের\s*কোন্টি/g, 'হলে নীচের কোনটি')
            .replace(/\s*।\s*/g, '।')
            .replace(/\s*=\s*/g, '=')
            .replace(/\$\s+/g, '$')
            .replace(/\s+\$/g, '$')
            // Additional spacing fixes for mathematical content
            .replace(/(\w)(\$)/g, '$1 $2')
            .replace(/(\$)(\w)/g, '$1 $2')
            .trim();
        
        const questionType = determineQuestionType(questionText, options, hasTabular, hasColumnMatching, hasFillInBlank);
        
        const questionObj = {
            questionNumber: questionNumber,
            question: questionText,
            diagram: null,
            options: options.length > 0 ? options : null,
            type: questionType,
            metadata: {
                hasTabular: hasTabular,
                hasColumnMatching: hasColumnMatching,
                hasFillInBlank: hasFillInBlank,
                optionCount: options.length,
                rawSectionLength: section.length
            }
        };
        
        questions.push(questionObj);
    }
    
    return questions;
}

function determineQuestionType(questionText, options, hasTabular, hasColumnMatching, hasFillInBlank) {
    if (hasColumnMatching) {
        return 'column_matching';
    } else if (hasTabular && !hasColumnMatching) {
        return 'multiple_choice_with_table';
    } else if (hasFillInBlank || (options && options.length === 0)) {
        return 'fill_in_blank';
    } else if (options && options.length === 4) {
        return 'multiple_choice';
    } else if (options && options.length > 0 && options.length < 4) {
        return 'incomplete_multiple_choice';
    } else {
        return 'other';
    }
}

export { 
    extractQuestionsImproved, 
    cleanMathpixContent, 
    extractMathematicalOptions,
    separateQuestionFromOptions,
    parseQuestionAndOptions 
};

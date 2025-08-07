// Add this function to your utils/mmdHandling.js file

function cleanMathpixContent(text) {
    return text
        // Remove HTML/CSS artifacts that Mathpix sometimes includes
        .replace(/<span[^>]*class="katex[^"]*"[^>]*>.*?<\/span>/gs, '')
        .replace(/<span[^>]*>.*?<\/span>/gs, '')
        .replace(/<math[^>]*>.*?<\/math>/gs, '')
        .replace(/=<span.*?<\/span>/gs, '')
        
        // Clean up specific artifacts you mentioned
        .replace(/=<spanclass="katex−display">.*?<\/span>/gs, '')
        .replace(/class="[^"]*"/g, '')
        .replace(/style="[^"]*"/g, '')
        .replace(/aria−hidden="true"/g, '')
        .replace(/mathbackground="[^"]*"/g, '')
        .replace(/width="[^"]*"/g, '')
        .replace(/height="[^"]*"/g, '')
        
        // Remove broken HTML tags
        .replace(/<[^>]*>/g, '')
        .replace(/&[a-zA-Z0-9#]+;/g, '') // Remove HTML entities
        
        // Clean up mathematical expressions
        .replace(/\$\s*\$\s*/g, ' ') // Remove empty math delimiters
        .replace(/\$([^$]*)\$/g, '$$$1$$') // Ensure proper math delimiters
        
        // Fix common OCR/parsing errors
        .replace(/−/g, '-') // Replace unicode minus with regular hyphen
        .replace(/\s+/g, ' ') // Normalize whitespace
        .replace(/\n\s*\n\s*\n+/g, '\n\n') // Remove excessive line breaks
        
        // Clean up table formatting
        .replace(/\\hline\s*/g, '\\hline\n') // Proper line breaks after hline
        .replace(/\\\\\s*\\hline/g, '\\\\\n\\hline') // Fix table row endings
        
        .trim();
}

function cleanTableContent(tableText) {
    return tableText
        // Fix table structure
        .replace(/\\begin\{tabular\}\{[^}]*\}/g, (match) => {
            // Ensure proper table column definition
            const columnDef = match.includes('|l|l|') ? '{|l|l|}' : '{|c|c|}';
            return `\\begin{tabular}${columnDef}`;
        })
        
        // Clean cell content
        .replace(/\s*&\s*/g, ' & ') // Normalize cell separators
        .replace(/\\\\\s*/g, ' \\\\\n') // Proper row endings
        
        // Remove HTML artifacts within cells
        .replace(/\[[a-z]\]\s*\$([^$]*)\$/g, '[$1] $$2$$') // Fix option formatting
        .replace(/\[([iv]+)\]/g, '[$1]') // Ensure proper option numbering
        
        .trim();
}

// Enhanced question extraction with content cleaning
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
        while (currentLineIndex < lines.length) {
            const currentLine = lines[currentLineIndex];
            
            if (currentLine.match(/^\([A-D]\)/)) {
                break;
            }
            
            if (currentLine.match(/^\d+\.\s/)) {
                break;
            }
            
            if (currentLine.length > 0) {
                if (hasTabular || hasColumnMatching) {
                    questionText += '\n' + currentLine;
                } else if (currentLine.includes('\\') && 
                          (currentLine.includes('begin') || 
                           currentLine.includes('end') || 
                           currentLine.includes('&') || 
                           currentLine.includes('\\\\'))) {
                    questionText += '\n' + currentLine;
                } else if (currentLine.includes('$') ||
                          currentLine.includes('=') ||
                          currentLine.includes('হয়') ||
                          currentLine.includes('হলে') ||
                          currentLine.includes('তবে') ||
                          currentLine.includes('তারে') ||
                          /[০-৯]/.test(currentLine) ||
                          /^[A-D]/.test(currentLine.replace(/[()]/g, ''))) {
                    questionText += ' ' + currentLine;
                }
            }
            currentLineIndex++;
        }
        
        // Clean table content specifically
        if (hasTabular) {
            const tabularMatch = section.match(/\\begin\{tabular\}.*?\\end\{tabular\}/s);
            if (tabularMatch) {
                const cleanedTable = cleanTableContent(tabularMatch[0]);
                if (!questionText.includes(cleanedTable)) {
                    questionText = questionText.replace(tabularMatch[0], cleanedTable);
                }
            }
        }
        
        // Extract options
        const options = [];
        const remainingLines = lines.slice(currentLineIndex);
        const remainingText = remainingLines.join(' ');
        
        const standardOptions = [...remainingText.matchAll(/\([A-D]\)\s*([^(]+?)(?=\s*\([A-D]\)|$)/g)];
        
        if (standardOptions.length >= 4) {
            for (let i = 0; i < 4; i++) {
                options.push(standardOptions[i][1].trim());
            }
        } else {
            for (const line of remainingLines) {
                const lineOptions = [...line.matchAll(/\([A-D]\)\s*([^(]+?)(?=\s*\([A-D]\)|$)/g)];
                for (const match of lineOptions) {
                    if (options.length < 4) {
                        options.push(match[1].trim());
                    }
                }
            }
            
            if (hasColumnMatching && options.length === 0) {
                const lastLine = remainingLines[remainingLines.length - 1];
                if (lastLine && lastLine.includes('[i]') && lastLine.includes('[ii]')) {
                    const matchingOptions = [...lastLine.matchAll(/\([A-D]\)\s*([^(]+?)(?=\s*\([A-D]\)|$)/g)];
                    for (let i = 0; i < Math.min(4, matchingOptions.length); i++) {
                        options.push(matchingOptions[i][1].trim());
                    }
                }
            }
        }
        
        // Final cleaning of question text
        questionText = questionText
            .replace(/\s+/g, ' ')
            .replace(/হলে\s*নীচের\s*কোন্টি/g, 'হলে নীচের কোনটি')
            .replace(/\s*।\s*/g, '।')
            .replace(/\s*=\s*/g, '=')
            .replace(/\$\s+/g, '$')
            .replace(/\s+\$/g, '$')
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

export { extractQuestionsImproved, cleanMathpixContent, cleanTableContent };
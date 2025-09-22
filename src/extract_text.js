
const fs = require('fs');

function extractTextFromJson(inputFile, outputFile) {
    try {
        console.log('Reading JSON file...');
        const jsonData = JSON.parse(fs.readFileSync(inputFile, 'utf8'));
        
        console.log(`Found ${jsonData.length} messages`);
        
        const textMessages = [];
        
        jsonData.forEach((message, index) => {
            if (message.text && message.text.trim()) {
                textMessages.push({
                    number: index + 1,
                    id: message.id,
                    date: message.date,
                    text: message.text.trim()
                });
            }
        });
        
        console.log(`Extracted ${textMessages.length} text messages`);
        
        // Сохраняем в JSON формате
        fs.writeFileSync(outputFile, JSON.stringify(textMessages, null, 2), 'utf8');
        
        // Также создаем простой текстовый файл
        const textOnlyFile = outputFile.replace('.json', '.txt');
        const textContent = textMessages.map((msg, index) => 
            `${index + 1}. [${msg.date}] ${msg.text}`
        ).join('\n\n');
        
        fs.writeFileSync(textOnlyFile, textContent, 'utf8');
        
        console.log(`Saved to: ${outputFile}`);
        console.log(`Text-only saved to: ${textOnlyFile}`);
        
        return textMessages;
        
    } catch (error) {
        console.error('Error:', error.message);
    }
}

// Если запускается напрямую
if (require.main === module) {
    const inputFile = process.argv[2] || '1.json';
    const outputFile = process.argv[3] || 'extracted_text.json';
    
    console.log(`Input: ${inputFile}`);
    console.log(`Output: ${outputFile}`);
    
    extractTextFromJson(inputFile, outputFile);
}

module.exports = { extractTextFromJson };
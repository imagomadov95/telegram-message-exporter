const fs = require('fs');

function convertToMarkdown(inputFile, outputFile) {
    try {
        console.log('Reading text file...');
        const content = fs.readFileSync(inputFile, 'utf8');
        
        const lines = content.split('\n');
        let markdownContent = '# Экспортированные сообщения из Telegram\n\n';
        
        let currentMessage = '';
        let messageNumber = 0;
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            
            // Проверяем, начинается ли строка с номера и даты
            const messageHeaderMatch = line.match(/^(\d+)\. \[([\d-T:.Z]+)\] (.+)$/);
            
            if (messageHeaderMatch) {
                // Если есть предыдущее сообщение, добавляем его
                if (currentMessage) {
                    markdownContent += currentMessage + '\n\n---\n\n';
                }
                
                messageNumber = messageHeaderMatch[1];
                const date = new Date(messageHeaderMatch[2]).toLocaleString('ru-RU');
                const text = messageHeaderMatch[3];
                
                currentMessage = `## Сообщение ${messageNumber}\n\n**Дата:** ${date}\n\n${text}`;
            } else if (line && currentMessage) {
                // Добавляем продолжение сообщения
                currentMessage += '\n\n' + line;
            }
        }
        
        // Добавляем последнее сообщение
        if (currentMessage) {
            markdownContent += currentMessage + '\n\n---\n\n';
        }
        
        // Добавляем информацию в конец
        markdownContent += `\n\n---\n\n*Всего сообщений: ${messageNumber}*\n`;
        markdownContent += `*Дата экспорта: ${new Date().toLocaleString('ru-RU')}*\n`;
        
        fs.writeFileSync(outputFile, markdownContent, 'utf8');
        console.log(`Markdown file saved to: ${outputFile}`);
        console.log(`Total messages converted: ${messageNumber}`);
        
    } catch (error) {
        console.error('Error:', error.message);
    }
}

// Если запускается напрямую
if (require.main === module) {
    const inputFile = process.argv[2] || 'extracted_messages.txt';
    const outputFile = process.argv[3] || 'messages.md';
    
    console.log(`Input: ${inputFile}`);
    console.log(`Output: ${outputFile}`);
    
    convertToMarkdown(inputFile, outputFile);
}

module.exports = { convertToMarkdown };
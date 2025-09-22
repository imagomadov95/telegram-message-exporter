import { ExtractedTextMessage } from '../models/types';
import { ITextProcessor } from '../models/interfaces';
export declare class TextProcessor implements ITextProcessor {
    extractTextFromJson(inputFile: string, outputFile: string): ExtractedTextMessage[];
    convertToMarkdown(inputFile: string, outputFile: string): void;
}
//# sourceMappingURL=text-processor.d.ts.map
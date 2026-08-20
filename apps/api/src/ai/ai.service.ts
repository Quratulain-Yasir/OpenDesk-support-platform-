import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface MessageForAi {
  content: string;
  isCustomer: boolean; 
}

@Injectable()
export class AiService {
  private apiKey: string | undefined;
  private logger = new Logger(AiService.name);

  constructor(private configService: ConfigService) {
    this.apiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (!this.apiKey) {
      this.logger.warn('GEMINI_API_KEY not set — AI suggest will not work.');
    }
  }

  async suggestReply(subject: string, description: string, messages: MessageForAi[]): Promise<string> {
    if (!this.apiKey) {
      throw new Error('AI service not configured');
    }

    
    const conversationText = messages
      .map((m) => `${m.isCustomer ? 'Customer' : 'Agent'}: ${m.content}`)
      .join('\n');
 
    const prompt = `You are a helpful customer support agent. Based on the ticket below, write a professional, concise reply to the customer.

Ticket Subject: ${subject}
Customer's original message: ${description}

Conversation so far:
${conversationText || '(No replies yet)'}

Write ONLY the reply text — no greeting like "Here's a draft" and no explanation. Just the reply itself, ready to send to the customer.`;

  
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${this.apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      this.logger.error(`Gemini API error: ${errorBody}`);
      throw new Error('Failed to generate AI suggestion');
    }

    const data = await response.json();

 
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      throw new Error('AI returned an empty response');
    }

    return text.trim();
  }
}
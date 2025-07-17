import { GoogleGenerativeAI } from '@google/generative-ai';

const API_KEY = 'AIzaSyDUbqnMyc5qrfBuvHBgui8H0ySfSHSB-kE';
const genAI = new GoogleGenerativeAI(API_KEY);

export class GeminiService {
  constructor() {
    this.model = genAI.getGenerativeModel({ 
      model: 'gemini-1.5-flash',
      generationConfig: {
        temperature: 0.7,
        topK: 1,
        topP: 1,
        maxOutputTokens: 1024,
      },
    });
  }

  async getChatResponse(message, context = '') {
    try {
      const prompt = `You are a helpful UPS shipping and sustainability assistant. Help users with shipping questions, carbon footprint information, and eco-friendly shipping tips.

Context: ${context}
User question: ${message}

Provide helpful, accurate information about UPS services, carbon emissions, and sustainable shipping practices. Keep responses concise and actionable (under 200 words).`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text();
      
    } catch (error) {
      // Simple fallback for any API issues
      return this.getFallbackResponse(message, context);
    }
  }

  getFallbackResponse(message, context) {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('shipping') || lowerMessage.includes('delivery') || lowerMessage.includes('cost')) {
      return `Here are UPS shipping recommendations:

• **UPS Ground**: Most economical and eco-friendly option
• **UPS 2nd Day Air**: Faster delivery with moderate cost  
• **UPS Next Day Air**: Fastest option for urgent shipments

💡 **Tip**: Use ups.com shipping calculator for exact rates and transit times.`;
    }
    
    if (lowerMessage.includes('carbon') || lowerMessage.includes('environment') || lowerMessage.includes('eco') || lowerMessage.includes('sustain')) {
      return `🌱 **Eco-Friendly Shipping Tips**:

• Choose UPS Ground (up to 75% fewer emissions than air)
• Consolidate shipments to reduce delivery frequency
• Use UPS carbon neutral shipping when available
• Select UPS Access Points to reduce residential delivery attempts
• Use recyclable packaging materials

Learn more at ups.com/sustainability`;
    }
    
    if (lowerMessage.includes('track') || lowerMessage.includes('status')) {
      return `📦 **Package Tracking**:

• Visit ups.com and enter your tracking number
• Use the UPS Mobile app for real-time updates
• Sign up for UPS My Choice for delivery alerts

Need help? Visit a UPS Store or Customer Center near you.`;
    }
    
    return `I can help you with:

🚚 **Shipping**: Get rates, transit times, and shipping options
🌱 **Sustainability**: Learn about eco-friendly shipping practices  
📦 **Tracking**: Track packages and manage deliveries

For immediate assistance, visit ups.com or call 1-800-PICK-UPS.`;
  }

  async getShippingAdvice(originCity, destCity, packageWeight, carbonFootprint) {
    const context = `Shipping from ${originCity} to ${destCity}, package weight: ${packageWeight}lbs, estimated carbon footprint: ${carbonFootprint}kg CO2e`;
    const message = 'What are some eco-friendly shipping tips for this shipment?';
    return this.getChatResponse(message, context);
  }

  async getSustainabilityTips(userEmissions, shipmentCount) {
    const context = `User has generated ${userEmissions}kg CO2e from ${shipmentCount} shipments`;
    const message = 'How can I reduce my shipping carbon footprint?';
    return this.getChatResponse(message, context);
  }
}

export const geminiService = new GeminiService();

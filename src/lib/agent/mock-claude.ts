// ============================================
// MOCK CLAUDE API - Intelligent Simulation
// ============================================
// This simulates Claude API responses for demo purposes
// Can be swapped with real Anthropic SDK when API key is available

interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface StreamChunk {
  type: 'content_block_delta' | 'message_start' | 'message_delta' | 'message_stop';
  delta?: {
    type: string;
    text?: string;
  };
}

export class MockClaudeAPI {
  private async* simulateStreaming(fullResponse: string): AsyncGenerator<string> {
    // Simulate realistic streaming by breaking response into chunks
    const words = fullResponse.split(' ');
    let buffer = '';

    for (const word of words) {
      buffer += word + ' ';

      // Send chunks of 3-5 words at a time
      if (buffer.split(' ').length >= 3 + Math.random() * 2) {
        yield buffer;
        buffer = '';
        // Add realistic delay
        await new Promise(resolve => setTimeout(resolve, 50 + Math.random() * 100));
      }
    }

    // Send remaining buffer
    if (buffer.trim()) {
      yield buffer;
    }
  }

  async createMessageStream(params: {
    model: string;
    messages: Message[];
    max_tokens: number;
    temperature?: number;
  }): Promise<AsyncGenerator<string>> {
    const userMessage = params.messages.find(m => m.role === 'user')?.content || '';
    const systemPrompt = params.messages.find(m => m.role === 'system')?.content || '';

    // Analyze the ticket to generate intelligent response
    const response = await this.analyzeTicket(userMessage, systemPrompt);

    return this.simulateStreaming(response);
  }

  private async analyzeTicket(userMessage: string, systemPrompt: string): Promise<string> {
    // Extract ticket details
    const subjectMatch = userMessage.match(/Ticket Subject:\s*(.+)/);
    const bodyMatch = userMessage.match(/Ticket Body:\s*(.+?)(?=Ticket Category:|Codebase Context:|$)/s);
    const categoryMatch = userMessage.match(/Ticket Category:\s*(.+)/);

    const subject = subjectMatch?.[1]?.trim() || '';
    const body = bodyMatch?.[1]?.trim() || '';
    const category = categoryMatch?.[1]?.trim() || '';

    // Generate logs and resolution based on category and content
    const logs: string[] = [];
    let resolution = '';

    // Common analysis steps
    logs.push('LOG: Analyzing ticket context and category...');
    logs.push('LOG: Scanning codebase structure for relevant modules...');

    // Category-specific intelligent analysis
    if (category === 'returns' || subject.toLowerCase().includes('return') || body.toLowerCase().includes('refund')) {
      logs.push('LOG: Identified return/refund request. Checking return policy...');
      logs.push('LOG: Analyzing order schema in src/lib/db/schema.sql...');
      logs.push('LOG: Reviewing return processing logic in order management...');
      logs.push('LOG: Verified return window: 30 days from purchase date.');

      resolution = `RESOLUTION: Thank you for reaching out about your return request.

I've reviewed your order and our return policy. You're eligible for a full refund within 30 days of purchase. Here's what will happen next:

1. **Return Authorization**: I've initiated a return authorization for your order. You'll receive an email with a prepaid return shipping label within the next hour.

2. **Return Process**:
   - Package the item in its original packaging (if possible)
   - Attach the return label to the package
   - Drop it off at any authorized shipping location

3. **Refund Timeline**: Once we receive and inspect the item (typically 3-5 business days), your refund will be processed to your original payment method. Please allow 5-7 business days for the refund to appear in your account.

4. **Tracking**: You'll receive email updates at each step of the return process.

If you have any questions or need assistance, please don't hesitate to reach out. We're here to help!

Best regards,
Cosmic Commerce Support Team`;

    } else if (category === 'technical' || subject.toLowerCase().includes('error') || body.toLowerCase().includes('not working')) {
      logs.push('LOG: Technical issue detected. Analyzing error patterns...');
      logs.push('LOG: Checking error logging system in src/lib/error-logger.ts...');
      logs.push('LOG: Reviewing API endpoints and middleware configuration...');
      logs.push('LOG: Cross-referencing with recent system changes...');

      resolution = `RESOLUTION: Thank you for reporting this technical issue.

I've investigated the problem and identified the root cause:

**Issue Analysis**: The error appears to be related to a temporary synchronization issue between our frontend and backend systems during a recent update.

**Resolution Steps Taken**:
1. Cleared the affected cache entries
2. Reset your session state
3. Verified all API endpoints are functioning correctly
4. Confirmed data integrity in our database

**What You Should Do**:
1. Clear your browser cache and cookies for our site
2. Log out completely and log back in
3. Try the operation again

The issue should now be resolved. If you continue to experience problems, please try these additional steps:
- Use a different browser or incognito/private mode
- Check if any browser extensions might be interfering
- Ensure your browser is up to date

If the problem persists after trying these steps, please reply with:
- The exact error message you're seeing
- Your browser and version
- Screenshots if possible

We apologize for the inconvenience and appreciate your patience!

Best regards,
Cosmic Commerce Support Team`;

    } else if (category === 'billing' || category === 'payment' || subject.toLowerCase().includes('payment') || body.toLowerCase().includes('charged')) {
      logs.push('LOG: Payment/billing inquiry detected...');
      logs.push('LOG: Checking Stripe integration in src/app/api/payment-intent/route.ts...');
      logs.push('LOG: Reviewing payment processing logs...');
      logs.push('LOG: Verifying transaction records...');

      resolution = `RESOLUTION: Thank you for contacting us about your payment concern.

I've thoroughly reviewed your account and transaction history:

**Payment Status**: I've verified your payment records in our system and cross-referenced them with our payment processor (Stripe).

**What I Found**:
- Your payment was processed successfully
- The transaction is showing as completed in our system
- Your order is confirmed and being prepared for shipment

**Regarding Your Concern**:
If you were charged multiple times or see an unexpected amount, please note:
- You may see a temporary authorization hold that will drop off within 3-5 business days
- The final charge will match your order total
- Any authorization holds beyond the actual order amount will be automatically released

**Receipt**: A detailed receipt has been sent to your email address on file.

**Next Steps**:
If you still see discrepancies after 5 business days, or if you have questions about specific charges, please reply with:
- Your order number
- The amount you were charged
- A screenshot of the charge (if possible)

We're committed to ensuring billing transparency and accuracy. Thank you for your business!

Best regards,
Cosmic Commerce Support Team`;

    } else if (category === 'account' || subject.toLowerCase().includes('account') || body.toLowerCase().includes('login')) {
      logs.push('LOG: Account-related inquiry identified...');
      logs.push('LOG: Checking authentication system in src/lib/auth/auth-service.ts...');
      logs.push('LOG: Reviewing user session management...');
      logs.push('LOG: Verifying account security protocols...');

      resolution = `RESOLUTION: Thank you for reaching out about your account.

I've reviewed your account status and here's what I found:

**Account Status**: Your account is active and in good standing.

**Security Check**: I've verified that:
- Your account credentials are secure
- No unauthorized access attempts detected
- All recent login activity appears normal

**If You're Having Login Issues**:
1. **Password Reset**: Click "Forgot Password" on the login page to receive a reset link
2. **Email Verification**: Ensure you're using the email address registered with your account
3. **Browser Issues**: Try clearing cookies/cache or use a different browser

**Account Security Tips**:
- Use a strong, unique password
- Enable two-factor authentication (if available)
- Regularly review your account activity
- Never share your password with anyone

**Need Additional Help?**
If you need to:
- Update your email address
- Change account settings
- Review recent orders
- Delete your account

Please let me know, and I'll be happy to assist further!

Best regards,
Cosmic Commerce Support Team`;

    } else if (category === 'shipping' || subject.toLowerCase().includes('shipping') || body.toLowerCase().includes('delivery')) {
      logs.push('LOG: Shipping/delivery inquiry detected...');
      logs.push('LOG: Checking order fulfillment system...');
      logs.push('LOG: Reviewing shipping integration and tracking...');
      logs.push('LOG: Analyzing delivery timeframes...');

      resolution = `RESOLUTION: Thank you for your inquiry about shipping.

I've checked the status of your order and here's what I found:

**Order Status**: Your order has been processed and is currently being prepared for shipment.

**Shipping Details**:
- **Estimated Delivery**: 3-5 business days from shipment date
- **Shipping Method**: Standard Ground Shipping
- **Tracking**: You'll receive a tracking number via email once your order ships (typically within 24-48 hours)

**What Happens Next**:
1. **Packing**: Your items are being carefully packed (current stage)
2. **Shipment**: Your order will ship within 1-2 business days
3. **Tracking**: You'll receive an email with tracking information
4. **Delivery**: Estimated delivery within 3-5 business days after shipment

**Track Your Order**:
Once shipped, you can track your package at any time by:
- Clicking the tracking link in your shipment confirmation email
- Logging into your account and viewing order history
- Using the tracking number on the carrier's website

**Shipping Address**: Please verify that your shipping address is correct in your account. If you need to make changes, please let me know immediately!

If you have any questions or special delivery instructions, don't hesitate to reach out!

Best regards,
Cosmic Commerce Support Team`;

    } else if (category === 'product' || subject.toLowerCase().includes('product') || body.toLowerCase().includes('question about')) {
      logs.push('LOG: Product inquiry detected...');
      logs.push('LOG: Analyzing product catalog and specifications...');
      logs.push('LOG: Checking inventory and product details...');

      resolution = `RESOLUTION: Thank you for your interest in our products!

I'm happy to help answer your product question.

**Product Information**:
I've reviewed our product catalog and can provide you with detailed information about the item you're asking about.

**Key Features**:
- High-quality construction and materials
- Detailed specifications available on the product page
- Customer reviews and ratings to help with your decision

**Availability**:
- Currently in stock
- Ready to ship within 1-2 business days
- Multiple payment options available

**Additional Resources**:
- **Product Page**: View detailed specifications, images, and customer reviews
- **Size Guide**: Check our sizing information to ensure the perfect fit
- **FAQ**: Common questions answered in our help center

**Need More Details?**
If you have specific questions about:
- Compatibility
- Dimensions or specifications
- Usage instructions
- Warranty information

Please let me know what specific information you're looking for, and I'll provide detailed answers!

**Special Offers**: Don't forget to check for any current promotions or bundle deals that might apply to your purchase.

Thank you for considering Cosmic Commerce for your purchase!

Best regards,
Cosmic Commerce Support Team`;

    } else {
      // General/other category
      logs.push('LOG: Processing general support inquiry...');
      logs.push('LOG: Analyzing customer intent and sentiment...');
      logs.push('LOG: Preparing comprehensive response...');

      resolution = `RESOLUTION: Thank you for contacting Cosmic Commerce Support.

I've carefully reviewed your inquiry and I'm here to help!

**Your Request**: ${subject}

I understand you're reaching out about this matter, and I want to ensure you receive the best possible assistance.

**How I Can Help**:
I've analyzed your message and our system records. To provide you with the most accurate and helpful solution, I may need a bit more information:

1. **Order Details**: If this relates to a specific order, please provide the order number
2. **Timeline**: When did you first notice this issue?
3. **Details**: Any additional context that might help me assist you better

**What I've Already Checked**:
- Your account status and history
- Recent system updates that might be relevant
- Our policies and procedures related to your inquiry

**Next Steps**:
Please provide any additional details, and I'll ensure this matter is resolved quickly and to your satisfaction.

Alternatively, if your request is urgent, you can:
- Call our support line: 1-800-COSMIC-1
- Use our live chat feature on the website
- Visit our comprehensive Help Center at cosmic.com/help

We're committed to providing excellent customer service and appreciate your patience!

Best regards,
Cosmic Commerce Support Team`;
    }

    // Combine logs and resolution
    return logs.join('\n') + '\n' + resolution;
  }

  // Method to match Anthropic SDK interface
  async messages_create(params: {
    model: string;
    messages: Message[];
    max_tokens: number;
    temperature?: number;
    stream?: boolean;
  }) {
    if (params.stream) {
      return this.createMessageStream(params);
    }

    // Non-streaming response (not used in our case, but for completeness)
    const userMessage = params.messages.find(m => m.role === 'user')?.content || '';
    const systemPrompt = params.messages.find(m => m.role === 'system')?.content || '';
    const fullResponse = await this.analyzeTicket(userMessage, systemPrompt);

    return {
      content: [{ type: 'text', text: fullResponse }],
      role: 'assistant',
      model: params.model,
    };
  }
}

// Export singleton instance
export const mockClaude = new MockClaudeAPI();

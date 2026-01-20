export interface ParsedMessage {
  timestamp: Date;
  sender: string;
  message: string;
  isFromLead: boolean;
}

export interface ParsedChat {
  leadPhone: string;
  messages: ParsedMessage[];
  dateRange: {
    from: Date;
    to: Date;
  };
  leadMessageCount: number;
  myMessageCount: number;
}

/**
 * Parses a WhatsApp chat export text and extracts messages
 * Format: [H:MM AM/PM, M/D/YYYY] Sender: Message
 */
export function parseWhatsAppChat(text: string, mySenderName: string = "Miwebya"): ParsedChat | null {
  const lines = text.split('\n');
  const messages: ParsedMessage[] = [];
  let leadPhone: string | null = null;
  
  // Regex to match WhatsApp message format
  // [2:55 PM, 1/18/2026] +1 (714) 438-9132: Message text
  const messageRegex = /^\[(\d{1,2}:\d{2}\s(?:AM|PM)),\s(\d{1,2}\/\d{1,2}\/\d{4})\]\s(.+?):\s(.+)$/;
  
  let currentMessage: ParsedMessage | null = null;
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    if (!trimmedLine) continue;
    
    const match = trimmedLine.match(messageRegex);
    
    if (match) {
      // Save previous message if exists
      if (currentMessage) {
        messages.push(currentMessage);
      }
      
      const [, time, date, sender, messageText] = match;
      
      // Parse date and time
      const [month, day, year] = date.split('/').map(Number);
      const [hourMin, period] = time.split(' ');
      const [hourStr, minStr] = hourMin.split(':');
      let hour = parseInt(hourStr);
      const minute = parseInt(minStr);
      
      // Convert to 24-hour format
      if (period === 'PM' && hour !== 12) {
        hour += 12;
      } else if (period === 'AM' && hour === 12) {
        hour = 0;
      }
      
      const timestamp = new Date(year, month - 1, day, hour, minute);
      
      // Check if sender is not "Miwebya" (case insensitive)
      const isFromLead = sender.toLowerCase() !== mySenderName.toLowerCase();
      
      // Extract lead phone (first non-Miwebya sender we find)
      if (isFromLead && !leadPhone) {
        leadPhone = sender;
      }
      
      currentMessage = {
        timestamp,
        sender,
        message: messageText,
        isFromLead
      };
    } else if (currentMessage) {
      // This is a continuation of the previous message (multiline)
      currentMessage.message += '\n' + trimmedLine;
    }
  }
  
  // Don't forget the last message
  if (currentMessage) {
    messages.push(currentMessage);
  }
  
  if (!leadPhone || messages.length === 0) {
    return null;
  }
  
  // Calculate stats
  const leadMessageCount = messages.filter(m => m.isFromLead).length;
  const myMessageCount = messages.filter(m => !m.isFromLead).length;
  
  const sortedMessages = [...messages].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  
  return {
    leadPhone,
    messages: sortedMessages,
    dateRange: {
      from: sortedMessages[0].timestamp,
      to: sortedMessages[sortedMessages.length - 1].timestamp
    },
    leadMessageCount,
    myMessageCount
  };
}

/**
 * Normalizes a phone number by removing all non-digit characters
 */
export function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, '');
}

/**
 * Parse bulk items text to extract individual items with quantities
 * This matches the backend parsing logic
 */

export interface ParsedItem {
  name: string;
  quantity: number;
}

export function parseBulkItemsText(bulkText: string): ParsedItem[] {
  if (!bulkText || !bulkText.trim()) return [];
  
  const lines = bulkText.split('\n').filter(line => line.trim().length > 0);
  const items: ParsedItem[] = [];
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    if (!trimmedLine) continue;
    
    let itemName = trimmedLine;
    let quantity = 1; // Default quantity
    
    // Pattern 1: "Item Name (Quantity)" (e.g., "Milk (1L)")
    const pattern1 = /^(.+?)\s*\((\d+(?:\.\d+)?)\s*(kg|g|l|ml|packet|pcs?|pieces?|nos?|numbers?)?\)$/i;
    const match1 = pattern1.exec(trimmedLine);
    if (match1) {
      itemName = match1[1].trim();
      quantity = Math.round(parseFloat(match1[2]) || 1);
    } else {
      // Pattern 2: "Item Name: Quantity" (e.g., "Onions: 500g")
      const pattern2 = /^(.+?)\s*:\s*(\d+(?:\.\d+)?)\s*(kg|g|l|ml|packet|pcs?|pieces?|nos?|numbers?)?$/i;
      const match2 = pattern2.exec(trimmedLine);
      if (match2) {
        itemName = match2[1].trim();
        quantity = Math.round(parseFloat(match2[2]) || 1);
      } else {
        // Pattern 3: "Item Name - Quantity" (e.g., "Tomatoes - 1kg")
        const pattern3 = /^(.+?)\s*-\s*(\d+(?:\.\d+)?)\s*(kg|g|l|ml|packet|pcs?|pieces?|nos?|numbers?)?$/i;
        const match3 = pattern3.exec(trimmedLine);
        if (match3) {
          itemName = match3[1].trim();
          quantity = Math.round(parseFloat(match3[2]) || 1);
        } else {
          // Pattern 4: "Item Name Quantity" (e.g., "Rice 2kg", "Tomatoes 1kg")
          // This should be last as it's the most general
          const pattern4 = /^(.+?)\s+(\d+(?:\.\d+)?)\s*(kg|g|l|ml|packet|pcs?|pieces?|nos?|numbers?)?$/i;
          const match4 = pattern4.exec(trimmedLine);
          if (match4) {
            itemName = match4[1].trim();
            quantity = Math.round(parseFloat(match4[2]) || 1);
          }
          // If no pattern matches, use the whole line as item name with quantity 1
        }
      }
    }
    
    if (itemName && itemName.length > 0) {
      items.push({
        name: itemName,
        quantity: quantity
      });
    }
  }
  
  return items;
}

/**
 * Format bulk items text for display
 */
export function formatBulkItemsText(bulkText: string): string {
  if (!bulkText || !bulkText.trim()) return '';
  
  // Add line numbers and format for better readability
  const lines = bulkText.split('\n').filter(line => line.trim().length > 0);
  return lines.map((line, index) => `${index + 1}. ${line.trim()}`).join('\n');
}

/**
 * Get a preview of bulk items text (first few lines)
 */
export function getBulkItemsPreview(bulkText: string, maxLines: number = 3): string {
  if (!bulkText || !bulkText.trim()) return '';
  
  const lines = bulkText.split('\n').filter(line => line.trim().length > 0);
  const previewLines = lines.slice(0, maxLines);
  const hasMore = lines.length > maxLines;
  
  let preview = previewLines.join('\n');
  if (hasMore) {
    preview += `\n... and ${lines.length - maxLines} more items`;
  }
  
  return preview;
}

// Frontend Response Interceptor - Convert string decimals to numbers
// This can be used in your frontend to automatically convert string decimals to numbers

/**
 * Recursively converts string numbers that look like decimals to actual numbers
 * @param obj - The object to process
 * @returns The object with string decimals converted to numbers
 */
export function convertStringDecimalsToNumbers(obj: unknown): unknown {
  if (obj === null || obj === undefined) {
    return obj;
  }

  // Handle arrays
  if (Array.isArray(obj)) {
    return obj.map(convertStringDecimalsToNumbers);
  }

  // Handle plain objects
  if (typeof obj === 'object' && obj.constructor === Object) {
    const converted: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      converted[key] = convertStringDecimalsToNumbers(value);
    }
    return converted;
  }

  // Handle strings that look like numbers
  if (typeof obj === 'string') {
    // Check if string is a valid number (including decimals)
    const trimmed = obj.trim();
    if (trimmed !== '' && !isNaN(Number(trimmed))) {
      const num = Number(trimmed);
      // Only convert if it's a finite number (not NaN, Infinity, etc.)
      if (Number.isFinite(num)) {
        return num;
      }
    }
  }

  // Return primitive values as-is
  return obj;
}

/**
 * More targeted conversion that only converts known decimal fields
 * @param obj - The object to process
 * @param decimalFields - Array of field names that should be converted from string to number
 */
function convertSpecificDecimalFields(obj: unknown, decimalFields: string[]): unknown {
  if (obj === null || obj === undefined) {
    return obj;
  }

  // Handle arrays
  if (Array.isArray(obj)) {
    return obj.map(item => convertSpecificDecimalFields(item, decimalFields));
  }

  // Handle plain objects
  if (typeof obj === 'object' && obj.constructor === Object) {
    const converted: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      if (decimalFields.includes(key) && typeof value === 'string') {
        // Convert this specific field if it's a valid number string
        const trimmed = value.trim();
        if (trimmed !== '' && !isNaN(Number(trimmed))) {
          const num = Number(trimmed);
          if (Number.isFinite(num)) {
            converted[key] = num;
            continue;
          }
        }
      }
      // Recursively process nested objects
      converted[key] = convertSpecificDecimalFields(value, decimalFields);
    }
    return converted;
  }

  return obj;
}

// List of fields that are known to be decimal fields that come as strings
const DECIMAL_FIELDS = [
  'price',
  'size_cm', 
  'weight_kg',
  'deposit_amount',
  'amount',
  'cost',
  'total',
  'subtotal',
  'tax',
  'discount'
];

/**
 * Enhanced fetch wrapper that automatically converts decimal fields
 * Use this instead of regular fetch for API calls
 */
export async function fetchWithDecimalConversion(
  input: RequestInfo | URL, 
  init?: RequestInit
): Promise<Response> {
  const response = await fetch(input, init);
  
  // Clone the response so we can modify it
  const clonedResponse = response.clone();
  
  // Check if response is JSON
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    try {
      const data = await clonedResponse.json();
      const convertedData = convertSpecificDecimalFields(data, DECIMAL_FIELDS);
      
      // Create a new response with converted data
      const convertedResponse = new Response(JSON.stringify(convertedData), {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers
      });
      
      return convertedResponse;
    } catch {
      // If JSON parsing fails, return original response
      return response;
    }
  }
  
  return response;
}

/**
 * Utility to convert response data after fetch
 * Use this if you prefer to convert data manually
 */
export function convertResponseDecimals(data: unknown): unknown {
  return convertSpecificDecimalFields(data, DECIMAL_FIELDS);
}

/**
 * Convert decimals for a specific data type with known fields
 */
export function convertBikeDecimals(bike: unknown): unknown {
  return convertSpecificDecimalFields(bike, ['price', 'size_cm', 'weight_kg', 'deposit_amount']);
}

export function convertTransactionDecimals(transaction: unknown): unknown {
  return convertSpecificDecimalFields(transaction, ['amount', 'total', 'subtotal', 'tax']);
}

// Special base64 handling for UTF-8 characters
export const encodeBase64 = (input: string): string => {
  try {
    // Use TextEncoder for proper UTF-8 handling
    const encoder = new TextEncoder();
    const bytes = encoder.encode(input);
    
    // Convert to base64
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  } catch (error) {
    console.error('Encoding error:', error);
    return '';
  }
};

export const decodeBase64 = (input: string): string => {
  try {
    // Decode base64
    const binary = atob(input.trim());
    
    // Convert to UTF-8
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    
    // Use TextDecoder for proper UTF-8 handling
    const decoder = new TextDecoder();
    return decoder.decode(bytes);
  } catch (error) {
    console.error('Decoding error:', error);
    return '';
  }
};

export const encodeFileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        // Extract the base64 part from data URL
        const base64String = reader.result.split(',')[1];
        resolve(base64String);
      } else {
        reject(new Error('Failed to read file as base64'));
      }
    };
    reader.onerror = () => reject(new Error('Error reading file'));
    reader.readAsDataURL(file);
  });
};

export const isBase64 = (str: string): boolean => {
  try {
    // Check if it's a valid base64 string
    const regex = /^[A-Za-z0-9+/=]+$/;
    return regex.test(str) && str.length % 4 === 0;
  } catch (e) {
    return false;
  }
};

export const getCodeSnippet = (type: 'encode' | 'decode', language: string, input: string): string => {
  const escapedInput = input.replace(/"/g, '\\"').replace(/'/g, "\\'");
  
  switch (language) {
    case 'javascript':
      if (type === 'encode') {
        return `// JavaScript Base64 Encode (UTF-8 safe)
const encoder = new TextEncoder();
const bytes = encoder.encode("${escapedInput}");
let binary = '';
const len = bytes.byteLength;
for (let i = 0; i < len; i++) {
  binary += String.fromCharCode(bytes[i]);
}
const base64 = btoa(binary);
console.log(base64); // Output: ${encodeBase64(input)}`;
      } else {
        return `// JavaScript Base64 Decode (UTF-8 safe)
const binary = atob("${escapedInput}");
const bytes = new Uint8Array(binary.length);
for (let i = 0; i < binary.length; i++) {
  bytes[i] = binary.charCodeAt(i);
}
const decoder = new TextDecoder();
const text = decoder.decode(bytes);
console.log(text);`;
      }
    
    case 'python':
      if (type === 'encode') {
        return `# Python Base64 Encode (UTF-8 safe)
import base64
text = "${escapedInput}"
encoded = base64.b64encode(text.encode('utf-8'))
print(encoded.decode('ascii'))  # Output: ${encodeBase64(input)}`;
      } else {
        return `# Python Base64 Decode (UTF-8 safe)
import base64
encoded = "${escapedInput}"
decoded = base64.b64decode(encoded)
print(decoded.decode('utf-8'))`;
      }
    
    case 'php':
      if (type === 'encode') {
        return `<?php
// PHP Base64 Encode (UTF-8 safe)
$text = "${escapedInput}";
$encoded = base64_encode($text);
echo $encoded; // Output: ${encodeBase64(input)}
?>`;
      } else {
        return `<?php
// PHP Base64 Decode (UTF-8 safe)
$encoded = "${escapedInput}";
$decoded = base64_decode($encoded);
echo $decoded;
?>`;
      }
      
    default:
      return 'Language not supported';
  }
};

// Utility to download base64 data as a file
export const downloadBase64AsFile = (base64Data: string, fileName: string = 'decoded-file', mimeType?: string): void => {
  try {
    // Decode the base64 data
    const binary = atob(base64Data);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    
    // Detect mime type if not provided
    let detectedMimeType = mimeType;
    if (!detectedMimeType) {
      // Simple file type detection based on magic numbers
      if (bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF) {
        detectedMimeType = 'image/jpeg';
      } else if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47) {
        detectedMimeType = 'image/png';
      } else if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46) {
        detectedMimeType = 'image/gif';
      } else if (bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46) {
        detectedMimeType = 'application/pdf';
      } else {
        detectedMimeType = 'application/octet-stream';
      }
    }

    // Create blob and download
    const blob = new Blob([bytes], { type: detectedMimeType });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    
    // Add appropriate extension based on mime type
    let fileNameWithExt = fileName;
    if (detectedMimeType === 'image/jpeg' && !fileName.toLowerCase().endsWith('.jpg') && !fileName.toLowerCase().endsWith('.jpeg')) {
      fileNameWithExt += '.jpg';
    } else if (detectedMimeType === 'image/png' && !fileName.toLowerCase().endsWith('.png')) {
      fileNameWithExt += '.png';
    } else if (detectedMimeType === 'image/gif' && !fileName.toLowerCase().endsWith('.gif')) {
      fileNameWithExt += '.gif';
    } else if (detectedMimeType === 'application/pdf' && !fileName.toLowerCase().endsWith('.pdf')) {
      fileNameWithExt += '.pdf';
    }
    
    a.download = fileNameWithExt;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
  } catch (error) {
    console.error('Error downloading file:', error);
    throw new Error('Failed to download file');
  }
};

// Utility to save encoded data as a text file
export const saveBase64AsTextFile = (base64Data: string, fileName: string = 'encoded'): void => {
  const blob = new Blob([base64Data], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = `${fileName}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

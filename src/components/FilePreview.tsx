
import { useState, useEffect } from 'react';
import { Progress } from "@/components/ui/progress";

interface FilePreviewProps {
  data: string;
}

const FilePreview = ({ data }: FilePreviewProps) => {
  const [preview, setPreview] = useState<string | null>(null);
  const [fileType, setFileType] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!data) return;

    setLoading(true);
    setError(null);

    try {
      // Try to decode the Base64 string
      const binaryData = atob(data);
      
      // Check if this is a binary file or an image by looking at first few bytes
      const bytes = new Uint8Array(binaryData.length);
      for (let i = 0; i < binaryData.length; i++) {
        bytes[i] = binaryData.charCodeAt(i);
      }

      // Simple file type detection based on magic numbers
      let mimeType = 'application/octet-stream';
      
      // Check for common file signatures
      if (bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF) {
        mimeType = 'image/jpeg';
      } else if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47) {
        mimeType = 'image/png';
      } else if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46) {
        mimeType = 'image/gif';
      } else if (bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46) {
        mimeType = 'application/pdf';
      } else if (bytes[0] === 0x3C && (bytes[1] === 0x3F || bytes[1] === 0x21)) {
        // Likely XML, HTML, or SVG
        if (binaryData.includes('<svg')) {
          mimeType = 'image/svg+xml';
        } else {
          mimeType = 'text/html';
        }
      } else {
        // Check if it's readable text
        try {
          const text = new TextDecoder().decode(bytes);
          const isPrintable = text.split('').every(char => char.charCodeAt(0) >= 32 || [9, 10, 13].includes(char.charCodeAt(0)));
          if (isPrintable) {
            mimeType = 'text/plain';
          }
        } catch (e) {
          // Not text
        }
      }

      setFileType(mimeType);
      
      if (mimeType.startsWith('image/')) {
        setPreview(`data:${mimeType};base64,${data}`);
      } else if (mimeType === 'application/pdf') {
        setPreview(`data:${mimeType};base64,${data}`);
      } else if (mimeType === 'text/plain' || mimeType === 'text/html') {
        try {
          const text = atob(data);
          setPreview(text);
        } catch (e) {
          setError('Failed to decode text content.');
        }
      } else {
        setPreview(null);
        setFileType('binary');
      }
    } catch (e) {
      setError('Invalid Base64 data or unsupported file format.');
      setFileType(null);
      setPreview(null);
    } finally {
      setLoading(false);
    }
  }, [data]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <p className="text-sm text-muted-foreground mb-2">Analyzing file...</p>
        <Progress value={40} className="w-full max-w-sm" />
      </div>
    );
  }

  if (error) {
    return <div className="p-4 text-destructive">{error}</div>;
  }

  if (!preview) {
    return <div className="p-4 text-muted-foreground">No preview available for this file type.</div>;
  }

  if (fileType?.startsWith('image/')) {
    return (
      <div className="flex flex-col items-center p-4">
        <img 
          src={preview} 
          alt="Decoded image" 
          className="max-w-full max-h-96 object-contain rounded-md" 
        />
        <span className="mt-2 text-xs text-muted-foreground">{fileType}</span>
      </div>
    );
  }

  if (fileType === 'application/pdf') {
    return (
      <div className="flex flex-col items-center p-4">
        <object 
          data={preview} 
          type="application/pdf" 
          className="w-full h-96 border rounded"
        >
          <p>PDF preview not available. <a 
            href={preview} 
            download="decoded.pdf" 
            className="text-primary hover:underline"
          >
            Download PDF
          </a></p>
        </object>
        <span className="mt-2 text-xs text-muted-foreground">{fileType}</span>
      </div>
    );
  }

  // Text content
  return (
    <div className="p-4 w-full">
      <div className="bg-muted p-4 rounded-md overflow-auto max-h-96 whitespace-pre-wrap text-sm">
        {preview}
      </div>
      <span className="mt-2 text-xs text-muted-foreground block">{fileType}</span>
    </div>
  );
};

export default FilePreview;

import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { ArrowRight, ArrowLeft, Clipboard, Copy, Download, File, Upload, Save, Image } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { encodeBase64, decodeBase64, encodeFileToBase64, isBase64, downloadBase64AsFile, saveBase64AsTextFile } from "@/lib/base64Utils";
import FilePreview from "./FilePreview";
import { useHistory } from "@/lib/historyContext";
import LanguageSelector from "./LanguageSelector";

export default function EncoderDecoder() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<"encode" | "decode" | "image-encode" | "image-decode">("encode");
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [originalFileName, setOriginalFileName] = useState<string | null>(null);
  const [isFileInput, setIsFileInput] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  const { toast } = useToast();
  const { addToHistory } = useHistory();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // Process input when it changes or tab changes
  useEffect(() => {
    const processData = async () => {
      if (!input) {
        setOutput("");
        return;
      }
      
      if (activeTab === "encode") {
        const encoded = encodeBase64(input);
        setOutput(encoded);
      } else if (activeTab === "decode") {
        // Decode mode
        if (isBase64(input)) {
          const decoded = decodeBase64(input);
          setOutput(decoded);
        }
      }
    };
    
    processData();
  }, [input, activeTab]);

  const handleTabChange = (value: string) => {
    setActiveTab(value as "encode" | "decode" | "image-encode" | "image-decode");
    setInput("");
    setOutput("");
    setFileName(null);
    setOriginalFileName(null);
    setIsFileInput(false);
    setImageFile(null);
    setImagePreview(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    setFileName(null); // Clear filename when typing
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setInput(text);
      setFileName(null);
      toast({
        description: "Content pasted from clipboard",
        duration: 2000
      });
    } catch (err) {
      toast({
        description: "Failed to read from clipboard",
        variant: "destructive",
        duration: 2000
      });
    }
  };

  const handleCopy = async () => {
    if (!output) return;
    try {
      await navigator.clipboard.writeText(output);
      toast({
        description: "Copied to clipboard",
        duration: 2000
      });
    } catch (err) {
      toast({
        description: "Failed to copy to clipboard",
        variant: "destructive",
        duration: 2000
      });
    }
  };

  const handleDownload = () => {
    if (!output) return;
    if (activeTab === "encode" || activeTab === "image-encode") {
      // For encoded content, it's base64 text, save as .txt file
      saveBase64AsTextFile(output, originalFileName ? `${originalFileName}-encoded` : "encoded");
      toast({
        description: "Encoded file downloaded as text file",
        duration: 2000
      });
    } else if (isBase64(input)) {
      // For decoded content from base64
      try {
        downloadBase64AsFile(input, originalFileName || "decoded-file");
        toast({
          description: "File downloaded",
          duration: 2000
        });
      } catch (err) {
        toast({
          description: "Failed to download file",
          variant: "destructive",
          duration: 3000
        });
      }
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setOriginalFileName(file.name);
    setIsFileInput(true);
    try {
      const base64String = await encodeFileToBase64(file);
      if (activeTab === "encode") {
        setInput(`[File: ${file.name}]`);
        setOutput(base64String);

        // Add to history with reduced data for files
        if (file.size < 1048576) {
          // Only add to history if file is smaller than 1MB
          addToHistory({
            input: `File: ${file.name} (${formatFileSize(file.size)})`,
            output: file.size < 102400 ? base64String : `[Base64 Content - ${formatFileSize(file.size)}]`,
            type: "encode"
          });
        }
      }
      toast({
        description: `File loaded: ${file.name}`,
        duration: 2000
      });
    } catch (err) {
      toast({
        description: "Error processing file",
        variant: "destructive",
        duration: 3000
      });
    }

    // Reset the file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Handle image file select for image encode tab
  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    
    setImageFile(file);
    setFileName(file.name);
    setOriginalFileName(file.name);
    
    try {
      // Create image preview
      const reader = new FileReader();
      reader.onload = (e) => {
        if (typeof e.target?.result === 'string') {
          setImagePreview(e.target.result);
          
          // Extract the base64 part
          const base64String = e.target.result.split(',')[1];
          setOutput(base64String);
          
          // Add to history with reduced data for images
          if (file.size < 1048576) {
            // Only add to history if image is smaller than 1MB
            addToHistory({
              input: `Image: ${file.name} (${formatFileSize(file.size)})`,
              output: file.size < 102400 ? base64String : `[Base64 Image - ${formatFileSize(file.size)}]`,
              type: "encode"
            });
          }
        }
      };
      reader.readAsDataURL(file);
      
      toast({
        description: `Image loaded: ${file.name}`,
        duration: 2000
      });
    } catch (err) {
      toast({
        description: "Error processing image",
        variant: "destructive",
        duration: 3000
      });
    }
    
    // Reset the input
    if (imageInputRef.current) {
      imageInputRef.current.value = "";
    }
  };

  // Handle text file select for image decode tab
  const handleTextFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    try {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (typeof e.target?.result === 'string') {
          const content = e.target.result;
          setInput(content);
          
          if (isBase64(content)) {
            // Try to decode and show as image
            setImagePreview(`data:image/jpeg;base64,${content}`);
            
            // Add to history
            addToHistory({
              input: `Text file: ${file.name}`,
              output: `[Decoded Image]`,
              type: "decode"
            });
          } else {
            toast({
              description: "File does not contain valid Base64 data",
              variant: "destructive",
              duration: 3000
            });
          }
        }
      };
      reader.readAsText(file);
      
      setFileName(file.name);
      
      toast({
        description: `Text file loaded: ${file.name}`,
        duration: 2000
      });
    } catch (err) {
      toast({
        description: "Error processing file",
        variant: "destructive",
        duration: 3000
      });
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    
    if (activeTab === "image-encode" && !file.type.startsWith('image/')) {
      toast({
        description: "Please drop an image file",
        variant: "destructive",
        duration: 3000
      });
      return;
    }
    
    if (activeTab === "image-decode" && file.type !== 'text/plain') {
      toast({
        description: "Please drop a text file with Base64 data",
        variant: "destructive",
        duration: 3000
      });
      return;
    }
    
    setFileName(file.name);
    setOriginalFileName(file.name);
    
    if (activeTab === "encode") {
      setIsFileInput(true);
      try {
        const base64String = await encodeFileToBase64(file);
        setInput(`[File: ${file.name}]`);
        setOutput(base64String);

        // Add to history with reduced data for files
        if (file.size < 1048576) {
          // Only add to history if file is smaller than 1MB
          addToHistory({
            input: `File: ${file.name} (${formatFileSize(file.size)})`,
            output: file.size < 102400 ? base64String : `[Base64 Content - ${formatFileSize(file.size)}]`,
            type: "encode"
          });
        }
        toast({
          description: `File loaded: ${file.name}`,
          duration: 2000
        });
      } catch (err) {
        toast({
          description: "Error processing file",
          variant: "destructive",
          duration: 3000
        });
      }
    } else if (activeTab === "image-encode" && file.type.startsWith('image/')) {
      setImageFile(file);
      try {
        // Create image preview
        const reader = new FileReader();
        reader.onload = (e) => {
          if (typeof e.target?.result === 'string') {
            setImagePreview(e.target.result);
            
            // Extract the base64 part
            const base64String = e.target.result.split(',')[1];
            setOutput(base64String);
            
            // Add to history with reduced data for images
            if (file.size < 1048576) {
              // Only add to history if image is smaller than 1MB
              addToHistory({
                input: `Image: ${file.name} (${formatFileSize(file.size)})`,
                output: file.size < 102400 ? base64String : `[Base64 Image - ${formatFileSize(file.size)}]`,
                type: "encode"
              });
            }
          }
        };
        reader.readAsDataURL(file);
        
        toast({
          description: `Image loaded: ${file.name}`,
          duration: 2000
        });
      } catch (err) {
        toast({
          description: "Error processing image",
          variant: "destructive",
          duration: 3000
        });
      }
    } else if (activeTab === "image-decode") {
      try {
        const reader = new FileReader();
        reader.onload = (e) => {
          if (typeof e.target?.result === 'string') {
            const content = e.target.result;
            setInput(content);
            
            if (isBase64(content)) {
              // Try to decode and show as image
              setImagePreview(`data:image/jpeg;base64,${content}`);
              
              // Add to history
              addToHistory({
                input: `Text file: ${file.name}`,
                output: `[Decoded Image]`,
                type: "decode"
              });
            } else {
              toast({
                description: "File does not contain valid Base64 data",
                variant: "destructive",
                duration: 3000
              });
            }
          }
        };
        reader.readAsText(file);
        
        toast({
          description: `Text file loaded: ${file.name}`,
          duration: 2000
        });
      } catch (err) {
        toast({
          description: "Error processing file",
          variant: "destructive",
          duration: 3000
        });
      }
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  };

  const handleProcess = () => {
    if (!input) return;
    if (activeTab === "encode") {
      // Only add text-based encodings to history
      if (!fileName) {
        const encoded = encodeBase64(input);
        setOutput(encoded);

        // Add to history
        addToHistory({
          input,
          output: encoded,
          type: "encode"
        });
      }
    } else if (activeTab === "decode") {
      if (isBase64(input)) {
        const decoded = decodeBase64(input);
        setOutput(decoded);

        // Add to history
        addToHistory({
          input,
          output: decoded,
          type: "decode"
        });
      } else {
        toast({
          description: "Invalid Base64 input",
          variant: "destructive",
          duration: 3000
        });
      }
    }
  };

  const handleLanguageSample = (sample: string) => {
    setInput(sample);
    setFileName(null);
  };

  const renderTextTabs = () => (
    <>
      <Card className="w-full">
        <CardContent className="p-4">
          <div className="flex justify-between items-center mb-2">
            <Label htmlFor="input" className="text-base font-medium">
              {activeTab === "encode" ? t('textEncoder.input') : t('textDecoder.input')}
            </Label>
            <div className="flex items-center gap-2">
              {activeTab === "encode" && <LanguageSelector onSelectLanguage={handleLanguageSample} />}
              <Button variant="outline" size="sm" onClick={handlePaste} title={t('common.paste')}>
                <Clipboard className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">{t('common.paste')}</span>
              </Button>
            </div>
          </div>
          
          <div className={`w-full relative drop-zone ${isDragging ? "active" : ""}`} onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}>
            <Textarea 
              id="input" 
              placeholder={activeTab === "encode" ? t('textEncoder.placeholder') : t('textDecoder.placeholder')} 
              className="min-h-[200px] font-mono text-sm" 
              value={input} 
              onChange={handleInputChange} 
            />
            
            {isDragging && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/90 border-2 border-dashed border-primary rounded-md">
                <p className="text-center">
                  <Upload className="h-8 w-8 mx-auto mb-2 text-primary" />
                  {t('common.file')}
                </p>
              </div>
            )}
          </div>
          
          <div className="flex flex-wrap gap-2 mt-3">
            <Button onClick={handleProcess} className="gap-1.5">
              {activeTab === "encode" ? (
                <>
                  <ArrowRight className="h-4 w-4" /> 
                  {t('textEncoder.encodeButton')}
                </>
              ) : (
                <>
                  <ArrowLeft className="h-4 w-4" /> 
                  {t('textDecoder.decodeButton')}
                </>
              )}
            </Button>
            
            <Button variant="outline" onClick={() => fileInputRef.current?.click()} className="gap-1.5">
              <File className="h-4 w-4" />
              {t('common.upload')}
            </Button>
            
            <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileSelect} />
          </div>
          
          {fileName && (
            <div className="mt-2 text-sm text-muted-foreground">
              {t('common.file')}: {fileName}
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Output Section */}
      <Card className="w-full">
        <CardContent className="p-4">
          <div className="flex justify-between items-center mb-2">
            <Label htmlFor="output" className="text-base font-medium">
              {activeTab === "encode" ? t('textEncoder.output') : t('textDecoder.output')}
            </Label>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleCopy} disabled={!output} title={t('common.copy')}>
                <Copy className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">{t('common.copy')}</span>
              </Button>
              
              <Button variant="outline" size="sm" onClick={handleDownload} disabled={!output && !isBase64(input)} title={t('common.download')}>
                <Download className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">{t('common.download')}</span>
              </Button>
            </div>
          </div>
          
          {activeTab === "decode" && isBase64(input) ? (
            <FilePreview data={input} />
          ) : (
            <Textarea 
              id="output" 
              className="min-h-[200px] font-mono text-sm" 
              placeholder={activeTab === "encode" ? t('textEncoder.resultPlaceholder') : t('textDecoder.resultPlaceholder')} 
              value={output} 
              readOnly 
            />
          )}

          {isFileInput && activeTab === "encode" && output && (
            <div className="mt-2 text-sm">
              
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );

  const renderImageEncodeTabs = () => (
    <>
      <Card className="w-full">
        <CardContent className="p-4">
          <div className="flex justify-between items-center mb-2">
            <Label className="text-base font-medium">
              {t('imageEncoder.input')}
            </Label>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => imageInputRef.current?.click()}>
                <Image className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">{t('imageEncoder.selectImage')}</span>
              </Button>
            </div>
          </div>
          
          <div 
            className={`w-full relative drop-zone min-h-[200px] border border-dashed border-muted-foreground rounded-md ${isDragging ? "border-primary" : ""}`} 
            onDragOver={handleDragOver} 
            onDragLeave={handleDragLeave} 
            onDrop={handleDrop}
          >
            {imagePreview ? (
              <div className="flex flex-col items-center justify-center p-4">
                <img 
                  src={imagePreview} 
                  alt="Image preview" 
                  className="max-w-full max-h-[300px] object-contain" 
                />
                <p className="text-sm text-muted-foreground mt-2">
                  {fileName && `${t('common.file')}: ${fileName}`}
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-[200px]">
                <Image className="h-12 w-12 text-muted-foreground mb-2" />
                <p className="text-muted-foreground">
                  {t('imageEncoder.dropImage')}
                </p>
              </div>
            )}
          </div>
          
          <input 
            type="file" 
            ref={imageInputRef} 
            className="hidden" 
            accept="image/*" 
            onChange={handleImageSelect} 
          />
        </CardContent>
      </Card>
      
      <Card className="w-full">
        <CardContent className="p-4">
          <div className="flex justify-between items-center mb-2">
            <Label className="text-base font-medium">
              {t('imageEncoder.output')}
            </Label>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleCopy} disabled={!output} title={t('common.copy')}>
                <Copy className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">{t('common.copy')}</span>
              </Button>
              
              <Button variant="outline" size="sm" onClick={handleDownload} disabled={!output} title={t('common.download')}>
                <Download className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">{t('common.download')}</span>
              </Button>
            </div>
          </div>
          
          <Textarea 
            className="min-h-[200px] font-mono text-sm" 
            placeholder={t('imageEncoder.resultPlaceholder')} 
            value={output} 
            readOnly 
          />
        </CardContent>
      </Card>
    </>
  );

  const renderImageDecodeTabs = () => (
    <>
      <Card className="w-full">
        <CardContent className="p-4">
          <div className="flex justify-between items-center mb-2">
            <Label className="text-base font-medium">
              {t('imageDecoder.input')}
            </Label>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                <File className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">{t('imageDecoder.uploadText')}</span>
              </Button>
              <Button variant="outline" size="sm" onClick={handlePaste} title={t('common.paste')}>
                <Clipboard className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">{t('common.paste')}</span>
              </Button>
            </div>
          </div>
          
          <div 
            className={`w-full relative drop-zone ${isDragging ? "active" : ""}`} 
            onDragOver={handleDragOver} 
            onDragLeave={handleDragLeave} 
            onDrop={handleDrop}
          >
            <Textarea 
              placeholder={t('imageDecoder.placeholder')} 
              className="min-h-[200px] font-mono text-sm" 
              value={input} 
              onChange={handleInputChange} 
            />
            
            {isDragging && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/90 border-2 border-dashed border-primary rounded-md">
                <p className="text-center">
                  <Upload className="h-8 w-8 mx-auto mb-2 text-primary" />
                  {t('imageDecoder.dropText')}
                </p>
              </div>
            )}
          </div>
          
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept="text/plain" 
            onChange={handleTextFileSelect} 
          />
          
          {fileName && (
            <div className="mt-2 text-sm text-muted-foreground">
              {t('common.file')}: {fileName}
            </div>
          )}
        </CardContent>
      </Card>
      
      <Card className="w-full">
        <CardContent className="p-4">
          <div className="flex justify-between items-center mb-2">
            <Label className="text-base font-medium">
              {t('imageDecoder.output')}
            </Label>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleDownload} 
                disabled={!isBase64(input)} 
                title={t('common.download')}
              >
                <Download className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">{t('common.download')}</span>
              </Button>
            </div>
          </div>
          
          {isBase64(input) ? (
            <div className="flex justify-center p-4">
              {imagePreview ? (
                <img 
                  src={imagePreview} 
                  alt="Decoded image" 
                  className="max-w-full max-h-[300px] object-contain" 
                />
              ) : (
                <div className="p-4 text-muted-foreground">
                  {t('imageDecoder.noValidImage')}
                </div>
              )}
            </div>
          ) : (
            <div className="p-4 text-center text-muted-foreground">
              {t('imageDecoder.enterValidData')}
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );

  return (
    <div className="w-full flex-1">
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="encode" className="text-sm">
            <ArrowRight className="h-4 w-4 mr-1" />
            {t('encode.tabs.textEncode')}
          </TabsTrigger>
          <TabsTrigger value="decode" className="text-sm">
            <ArrowLeft className="h-4 w-4 mr-1" />
            {t('encode.tabs.textDecode')}
          </TabsTrigger>
          <TabsTrigger value="image-encode" className="text-sm">
            <Image className="h-4 w-4 mr-1" />
            {t('encode.tabs.imageEncode')}
          </TabsTrigger>
          <TabsTrigger value="image-decode" className="text-sm">
            <Image className="h-4 w-4 mr-1" />
            {t('encode.tabs.imageDecode')}
          </TabsTrigger>
        </TabsList>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
          {activeTab === "encode" || activeTab === "decode" 
            ? renderTextTabs()
            : activeTab === "image-encode" 
              ? renderImageEncodeTabs() 
              : renderImageDecodeTabs()
          }
        </div>
      </Tabs>
    </div>
  );
}


import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Code, Copy } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getCodeSnippet } from "@/lib/base64Utils";
import { useToast } from "@/hooks/use-toast";

interface CodeSnippetProps {
  input: string;
  type: 'encode' | 'decode';
}

// Maximum input length for code snippets to prevent performance issues
const MAX_SNIPPET_INPUT_LENGTH = 500;

export default function CodeSnippet({
  input,
  type
}: CodeSnippetProps) {
  const [language, setLanguage] = useState<string>("javascript");
  const { toast } = useToast();

  // Truncate long inputs for code snippets
  const truncatedInput = input.length > MAX_SNIPPET_INPUT_LENGTH 
    ? input.substring(0, MAX_SNIPPET_INPUT_LENGTH) + '...' 
    : input;

  const copyToClipboard = async () => {
    const code = getCodeSnippet(type, language, truncatedInput);
    try {
      await navigator.clipboard.writeText(code);
      toast({
        description: "Code copied to clipboard",
        duration: 2000
      });
    } catch (err) {
      toast({
        description: "Failed to copy code",
        variant: "destructive",
        duration: 2000
      });
    }
  };

  if (!input) return null;
  
  return (
    <Card className="p-4">
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center">
          <Code className="h-5 w-5 mr-2" />
          <h3 className="font-medium">Code Snippet</h3>
        </div>
        <div className="flex items-center gap-2">
          <Select value={language} onValueChange={setLanguage}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Language" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="javascript">JavaScript</SelectItem>
              <SelectItem value="python">Python</SelectItem>
              <SelectItem value="php">PHP</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" size="sm" onClick={copyToClipboard}>
            <Copy className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline">Copy</span>
          </Button>
        </div>
      </div>
      
      <div className="bg-muted p-4 rounded-md overflow-x-auto">
        <pre className="text-sm whitespace-pre-wrap">
          <code>{getCodeSnippet(type, language, truncatedInput)}</code>
        </pre>
      </div>
    </Card>
  );
}

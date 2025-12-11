import { useState, useRef, useEffect, ChangeEvent, KeyboardEvent, ClipboardEvent } from "react";

interface ChatInputProps {
  onSendMessage: (message: string, files: File[]) => void;
  isEmpty?: boolean;
}

function ChatInput({ onSendMessage }: ChatInputProps) {
  const [inputValue, setInputValue] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${Math.min(textarea.scrollHeight, window.innerHeight * 0.35)}px`;
    }
  }, [inputValue]);

  useEffect(() => {
    if (selectedFiles.length === 0) {
      setPreviews([]);
      return;
    }

    const newPreviews = selectedFiles.map((file) => 
      file.type.startsWith("image/") ? URL.createObjectURL(file) : ""
    );

    setPreviews(newPreviews);

    return () => {
      newPreviews.forEach((url) => {
        if (url) URL.revokeObjectURL(url);
      });
    };
  }, [selectedFiles]);

  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
  };

  const handlePaste = (e: ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData.items;
    const pastedFiles: File[] = [];

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf("image") !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          pastedFiles.push(file);
        }
      }
    }

    if (pastedFiles.length > 0) {
      e.preventDefault();
      setSelectedFiles(prev => [...prev, ...pastedFiles]);
    }
  };

  const handleSend = () => {
    if (inputValue.trim() === "" && selectedFiles.length === 0) return;
    onSendMessage(inputValue.trim(), selectedFiles);
    setInputValue("");
    setSelectedFiles([]);
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handlePaperclipClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = ''; 
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setSelectedFiles(prev => [...prev, ...Array.from(files)]);
    }
  };

  const removeFile = (indexToRemove: number) => {
    setSelectedFiles(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  return (
    <div className="input-container w-75 mx-auto">
      <div 
        className="d-flex flex-column p-2 border rounded-3 bg-white shadow-sm w-100" 
        style={{ backgroundColor: 'var(--input-background)', borderColor: 'var(--input-border)' }}
      >
        <input
          type="file"
          multiple 
          ref={fileInputRef}
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />
        
        {selectedFiles.length > 0 && (
          <div className="file-chips-container">
            {selectedFiles.map((file, index) => {
              const isImage = file.type.startsWith('image/');
              const previewUrl = previews[index];

              return (
                <div 
                  key={index} 
                  className="file-chip"
                  title={file.name}
                  style={{ 
                    backgroundColor: isImage ? 'transparent' : '#303134'
                  }} 
                >
                  {isImage && previewUrl ? (
                    <img 
                      src={previewUrl} 
                      alt="preview" 
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                    />
                  ) : (
                    <i className="bi bi-file-earmark-text-fill" style={{ fontSize: '24px', color: '#9aa0a6' }}></i>
                  )}

                  <button 
                    onClick={() => removeFile(index)} 
                    className="btn-close-file-absolute"
                    style={{
                      top: '2px',
                      right: '2px',
                      backgroundColor: 'rgba(0,0,0,0.5)',
                      color: 'white',
                      width: '18px',
                      height: '18px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    <i className="bi bi-x" style={{ fontSize: '14px' }}></i>
                  </button>
                </div>
              );
            })}
          </div>
        )}

        <textarea
          ref={textareaRef}
          className="form-control border-0 shadow-none p-2"
          placeholder="Ask anything"
          value={inputValue}
          onChange={handleChange}
          onPaste={handlePaste} // <--- Added here
          onKeyDown={handleKeyDown}
          rows={1}
          style={{
            resize: "none",
            backgroundColor: "transparent",
            flexGrow: 1,
            color: 'var(--input-text)',
            maxHeight: '35vh',
            overflowY: 'auto'
          }}
        />

        <div className="d-flex justify-content-between align-items-center pt-2">
           <button 
             className="chat-file-button" 
             onClick={handlePaperclipClick} 
             style={{ backgroundColor: 'transparent', border: 'none', padding: 0, cursor: 'pointer', width: '2.5rem', height: '2.5rem', display: 'flex', justifyContent: 'center', alignItems: 'center' }}
           >
             <i className="bi bi-paperclip" style={{ fontSize: '1.5rem', color: '#888888' }}></i>
           </button>

           <button 
             className="chat-send-button" 
             onClick={handleSend} 
             disabled={inputValue.trim() === "" && selectedFiles.length === 0}
             style={{ 
               width: '2.5rem', 
               height: '2.5rem', 
               padding: 0, 
               display: 'flex', 
               justifyContent: 'center', 
               alignItems: 'center', 
               backgroundColor: 'transparent', 
               border: 'none', 
               borderRadius: '50%', 
               cursor: 'pointer', 
               outline: 'none',
               opacity: (inputValue.trim() === "" && selectedFiles.length === 0) ? 0.5 : 1
             }}
           >
             <i className="bi bi-arrow-up-circle-fill" style={{ color: '#ffffff', fontSize: '2.5rem' }}></i>
           </button>
        </div>
      </div>
    </div>
  );
}

export default ChatInput;
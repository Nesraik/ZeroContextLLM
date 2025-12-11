import { useRef, useState, useEffect } from 'react';
import './App.css'; 
import ChatInput from './components/ChatInput';
import ChatMessages from './components/ChatMessage';
import { v4 as uuidv4 } from 'uuid';
import TopNavigationBar from './components/TopNavigationBar';
import Sidebar from './components/SideBar';
import ModelInformation from './components/ModelInformation';
import SettingsSidebar from './components/SettingsSidebar';

export interface Message {
  text: string;
  sender: 'user' | 'bot';
  images?: string[]; 
}

interface MessageDict{
  role: string,
  content: string | any[]
}

function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [messagedict, setMessageDict] = useState<MessageDict[]>([]);
  const [currentView, setCurrentView] = useState('model-information');
  const [hasModels, setHasModels] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isBotTyping, setIsBotTyping] = useState(false);
  const sessionRef = useRef(uuidv4());
  const sessionId = sessionRef.current;

  const checkModelsAvailability = async () => {
    try {
      const response = await fetch(import.meta.env.VITE_MODEL_CONFIG_ENDPOINT);
      if (response.ok) {
        const data = await response.json();
        setHasModels(data.length > 0); 
      }
    } catch (err) {
      console.error("Error checking models:", err);
    }
  };

  useEffect(() => {
    checkModelsAvailability();
    if (currentView === 'model-information') {
      const interval = setInterval(checkModelsAvailability, 2000);
      return () => clearInterval(interval);
    }
  }, [currentView]);

  const [runSettings, setRunSettings] = useState({
    model: '',
    temperature: 1.0,
    maxTokens: 512,
    topP: 1,
    reasoningEffort: 'none'
  });

  const handleNavigate = (view: string) => {
    setCurrentView(view);
    setIsSettingsOpen(false); 
  };
  
  const handleSendMessage = async (text: string, files: File[]) => {
    if (!runSettings.model) {
      alert("Configure your model in settings first.");
      setIsSettingsOpen(true);
      return;
    }

    const imageUrls = files
      .filter(file => file.type.startsWith('image/'))
      .map(file => URL.createObjectURL(file));

    const newUserMessage: Message = { 
      text, 
      sender: 'user', 
      images: imageUrls 
    };
    
    setMessages(prev => [...prev, newUserMessage]);
    
    setMessages(prev => [...prev, { text: '', sender: 'bot' }]);
    setIsBotTyping(true);

    try {
      let selectedModelConfig = null;
      
      const modelsResponse = await fetch(import.meta.env.VITE_MODEL_CONFIG_ENDPOINT);
      if (modelsResponse.ok) {
         const modelsData = await modelsResponse.json();
         selectedModelConfig = modelsData.find((m: any) => m.model === runSettings.model);
      }

      if (!selectedModelConfig) throw new Error(`Configuration for model '${runSettings.model}' not found.`);

      const formData = new FormData();
      formData.append('user_prompt', text);
      formData.append('messages', JSON.stringify(messagedict)); 
      formData.append('session_id', sessionId);
      formData.append('model_name', runSettings.model);
      formData.append('temperature', String(runSettings.temperature));
      formData.append('max_tokens', String(runSettings.maxTokens));
      formData.append('top_p', String(runSettings.topP));
      formData.append('reasoning_effort', runSettings.reasoningEffort);
      formData.append('base_url', selectedModelConfig.baseUrl); 
      formData.append('api_key', selectedModelConfig.apiKey);
      files.forEach((file) => formData.append('files', file));

      const response = await fetch(import.meta.env.VITE_MODEL_REQUEST_ENDPOINT, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok || !response.body) {
        throw new Error('Backend response was not ok');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let botResponseAccumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        botResponseAccumulated += chunk;

        setMessages(prevMessages => {
          const newMessages = [...prevMessages];
          const lastMsgIndex = newMessages.length - 1;
          if (newMessages[lastMsgIndex].sender === 'bot') {
            newMessages[lastMsgIndex] = {
              ...newMessages[lastMsgIndex],
              text: botResponseAccumulated
            };
          }
          return newMessages;
        });
      }
      
      const newHistory: MessageDict[] = [
        ...messagedict,
        { role: 'user', content: text }, 
        { role: 'assistant', content: botResponseAccumulated }
      ];
      setMessageDict(newHistory);

    } catch (error) {
      console.error("Error:", error);
      setMessages(prevMessages => {
        const newMessages = [...prevMessages];
        const lastMsgIndex = newMessages.length - 1;
        newMessages[lastMsgIndex] = {
           text: "Failed to get response. " + (error instanceof Error ? error.message : ""),
           sender: 'bot'
        };
        return newMessages;
      });
    } finally {
      setIsBotTyping(false);
    }
  };

  const isChatEmpty = messages.length === 0;

  const getPageTitle = (view: string) => {
    switch (view) {
      case 'playground': return 'Playground';
      case 'model-information': return 'Model Information';
      default: return 'Playground';
    }
  };

  return (
    <div className="app-layout">
      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)}
        currentView={currentView}
        onNavigate={handleNavigate}
        hasModelSelected={hasModels} 
      />

      <div className="main-content relative">
        <TopNavigationBar 
          onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} 
          onSettingsClick={
               currentView === 'playground' 
                 ? () => setIsSettingsOpen(!isSettingsOpen) 
                 : undefined 
             }
          title={getPageTitle(currentView)}
        />
        
        <div className="content-area">          
          {currentView === 'playground' && (
             <>
              <ChatMessages messages={messages} isBotTyping={isBotTyping} />
             </>
          )}

          {currentView === 'model-information' && (
             <ModelInformation />
          )}
        </div>

        {currentView === 'playground' && (
          <ChatInput 
            onSendMessage={handleSendMessage} 
            isEmpty={isChatEmpty}
          />
        )}
      </div>

      <SettingsSidebar 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
        settings={runSettings}
        onSettingsChange={setRunSettings}
      />
    </div>
  )
}

export default App;
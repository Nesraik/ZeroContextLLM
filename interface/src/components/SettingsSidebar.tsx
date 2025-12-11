import React, { useState, useEffect, useRef } from 'react';
import './SettingsSidebar.css';

export interface RunSettings {
  model: string;
  temperature: number;
  maxTokens: number;
  topP: number;
  reasoningEffort: string;
}

interface SettingsSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  settings: RunSettings;
  onSettingsChange: (settings: RunSettings) => void;
}

interface ModelConfig {
  model: string;
  baseUrl: string;
  apiKey: string;
}

const SettingsSidebar = ({ isOpen, onClose, settings, onSettingsChange }: SettingsSidebarProps) => {
  
  const [modelList, setModelList] = useState<ModelConfig[]>([]);
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsModelDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch models when sidebar opens
  useEffect(() => {
    if (isOpen) {
      const fetchModels = async () => {
        try {
          const response = await fetch(import.meta.env.VITE_MODEL_CONFIG_ENDPOINT);
          if (response.ok) {
            const data = await response.json();
            setModelList(data);

            if (data.length > 0) {
              const currentExists = data.some((m: ModelConfig) => m.model === settings.model);
              if (!settings.model || !currentExists) {
                onSettingsChange({ ...settings, model: data[0].model });
              }
            }
          }
        } catch (error) {
          console.error("Failed to load models:", error);
          setModelList([]);
        }
      };
      fetchModels();
    }
  }, [isOpen]);

  const updateSetting = (key: keyof RunSettings, value: any) => {
    onSettingsChange({ ...settings, [key]: value });
  };

  const handleNumberChange = (
    e: React.ChangeEvent<HTMLInputElement>, 
    key: keyof RunSettings,
    max: number
  ) => {
    let val = parseFloat(e.target.value);
    if (isNaN(val)) val = 0;
    if (val > max) val = max; 
    updateSetting(key, val);
  };

  return (
    <div className={`settings-sidebar ${isOpen ? 'open' : ''}`}>
      
      <div className="settings-header">
        <span className="settings-title">Model Configuration</span>
      </div>

      <div className="settings-content">
        
        <div className="setting-control" ref={dropdownRef}>
           <label>Model</label>
           
           <div className="custom-select-container">
             <div 
               className={`custom-select-trigger ${isModelDropdownOpen ? 'active' : ''} ${modelList.length === 0 ? 'disabled' : ''}`} 
               onClick={() => { if (modelList.length > 0) setIsModelDropdownOpen(!isModelDropdownOpen); }}
             >
               <span>{settings.model || (modelList.length === 0 ? "No model found" : "Select Model")}</span>
               
               {modelList.length > 0 && (
                 <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ transform: isModelDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: '0.2s' }}><path d="M6 9l6 6 6-6"/></svg>
               )}
             </div>

             {isModelDropdownOpen && (
               <div className="custom-options-list">
                 {modelList.map((config, index) => (
                   <div 
                     key={index} 
                     className={`custom-option ${settings.model === config.model ? 'selected' : ''}`}
                     onClick={() => {
                       updateSetting('model', config.model);
                       setIsModelDropdownOpen(false);
                     }}
                   >
                     {config.model}
                   </div>
                 ))}
               </div>
             )}
           </div>
        </div>

        <div className="setting-control">
          <label>Temperature</label>
          <div className="slider-row">
            <input 
              type="range" min="0" max="2" step="0.1" 
              value={settings.temperature}
              onChange={(e) => updateSetting('temperature', parseFloat(e.target.value))}
              className="slider"
            />
            <input 
              type="number" className="number-input"
              value={settings.temperature} min="0" max="2" step="0.01"
              onChange={(e) => handleNumberChange(e, 'temperature', 2)}
            />
          </div>
        </div>

        <div className="setting-control">
          <label>Max output tokens</label>
          <div className="slider-row">
            <input 
              type="range" min="1" max="8192" step="1" 
              value={settings.maxTokens}
              onChange={(e) => updateSetting('maxTokens', parseInt(e.target.value))}
              className="slider"
            />
            <input 
              type="number" className="number-input"
              value={settings.maxTokens} min="1" max="8192" step="1"
              onChange={(e) => handleNumberChange(e, 'maxTokens', 8192)}
            />
          </div>
        </div>

        <div className="setting-control">
          <label>Top P</label>
          <div className="slider-row">
            <input 
              type="range" min="0" max="1" step="0.01" 
              value={settings.topP}
              onChange={(e) => updateSetting('topP', parseFloat(e.target.value))}
              className="slider"
            />
             <input 
              type="number" className="number-input"
              value={settings.topP} min="0" max="1" step="0.01"
              onChange={(e) => handleNumberChange(e, 'topP', 1)}
            />
          </div>
        </div>

        <div className="setting-control">
           <label>Reasoning effort</label>
           <select 
             className="dropdown"
             value={settings.reasoningEffort}
             onChange={(e) => updateSetting('reasoningEffort', e.target.value)}
           >
             <option value="high">High</option>
             <option value="medium">Medium</option>
             <option value="low">Low</option>
             <option value="none">None</option>
           </select>
        </div>

      </div>
    </div>
  );
};

export default SettingsSidebar;
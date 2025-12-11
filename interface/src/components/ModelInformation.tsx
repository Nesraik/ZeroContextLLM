import React, { useState, useEffect, useRef } from 'react';
import './ModelInformation.css';

interface ModelConfig {
  model: string;
  baseUrl: string;
  apiKey: string;
  lastUpdated: string;
}

const ModelInformation = () => {
  const [configs, setConfigs] = useState<ModelConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [activeMenuIndex, setActiveMenuIndex] = useState<number | null>(null);
  
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  
  const menuRef = useRef<HTMLDivElement>(null);

  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    model: '',
    baseUrl: '',
    apiKey: ''
  });

  useEffect(() => {
    const fetchModels = async () => {
      try {
        const response = await fetch(import.meta.env.VITE_MODEL_CONFIG_ENDPOINT);
        if (response.ok) {
          const data = await response.json();
          setConfigs(data);
        }
      } catch (error) {
        console.error("Failed to connect to backend:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchModels();
  }, []);

  const saveToBackend = async (updatedConfigs: ModelConfig[]) => {
    try {
      await fetch(import.meta.env.VITE_MODEL_CONFIG_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedConfigs),
      });
    } catch (error) {
      console.error("Failed to save changes:", error);
    }
  };

  // Close menu if clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActiveMenuIndex(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const openAddModal = () => {
    setEditingIndex(null); 
    setFormData({ model: '', baseUrl: '', apiKey: '' }); 
    setShowModal(true);
  };

  const handleRowAction = (action: string, index: number) => {
    setActiveMenuIndex(null); 
    
    if (action === 'modify') {
      const config = configs[index];
      setFormData({
        model: config.model,
        baseUrl: config.baseUrl,
        apiKey: config.apiKey
      });
      setEditingIndex(index); 
      setShowModal(true);   
    } 
    else if (action === 'delete') {
      const newConfigs = configs.filter((_, i) => i !== index);
      setConfigs(newConfigs);
      saveToBackend(newConfigs);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

 const handleSaveModel = () => {
    if (!formData.model || !formData.baseUrl) return;

    const timestamp = new Date().toISOString().split('T')[0];
    let newConfigs;

    if (editingIndex !== null) {
      newConfigs = [...configs];
      newConfigs[editingIndex] = { ...formData, lastUpdated: timestamp };
    } else {
      // ADD NEW ROW
      const newConfig: ModelConfig = { ...formData, lastUpdated: timestamp };
      newConfigs = [...configs, newConfig];
    }

    // Update State & Backend
    setConfigs(newConfigs);
    saveToBackend(newConfigs);

    // Reset UI
    setShowModal(false); 
    setFormData({ model: '', baseUrl: '', apiKey: '' });
    setEditingIndex(null);
  };

  return (
    <div className="model-information-container">

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>{editingIndex !== null ? 'Modify Model' : 'Add New Model'}</h3>
            
            <div className="form-group">
              <label>Model Name</label>
              <input 
                type="text" 
                name="model" 
                value={formData.model} 
                onChange={handleInputChange} 
                placeholder="e.g. GPT-4o" 
              />
            </div>
            
            <div className="form-group">
              <label>Base URL</label>
              <input 
                type="text" 
                name="baseUrl" 
                value={formData.baseUrl} 
                onChange={handleInputChange} 
                placeholder="https://api.openai.com/v1" 
              />
            </div>
            
            <div className="form-group">
              <label>API Key</label>
              <input 
                type="password" 
                name="apiKey" 
                value={formData.apiKey} 
                onChange={handleInputChange} 
                placeholder="sk-..." 
              />
            </div>
            
            <div className="modal-actions">
              <button className="cancel-btn" onClick={() => setShowModal(false)}>
                Cancel
              </button>
              <button className="confirm-btn" onClick={handleSaveModel}>
                {editingIndex !== null ? 'Save Changes' : 'Add Model'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="table-wrapper">
        
        <div className="table-header sticky-header">
          <div className="col">Model</div>
          <div className="col">Base URL</div>
          <div className="col">API Key</div>
          <div className="col">Last Updated</div>
          
          <div className="action-col">
            <button 
              className="add-model-btn" 
              onClick={openAddModal}
              title="Add New Model"
            >
               <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                 <line x1="12" y1="5" x2="12" y2="19"></line>
                 <line x1="5" y1="12" x2="19" y2="12"></line>
               </svg>
            </button>
          </div>
        </div>

        {isLoading ? (
           <div className="empty-state">Loading...</div>
        ) : configs.length > 0 ? (
          configs.map((config, index) => (
            <div key={index} className="table-row">
              <div className="col">{config.model}</div>
              <div className="col">{config.baseUrl}</div>
              <div className="col" style={{ fontFamily: 'monospace', color: '#666' }}>••••••••••••••••</div>
              <div className="col">{config.lastUpdated}</div>
              
              <div className="action-col" ref={activeMenuIndex === index ? menuRef : null}>
                <button 
                  className={`kebab-menu-btn ${activeMenuIndex === index ? 'active' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveMenuIndex(activeMenuIndex === index ? null : index);
                  }}
                >
                   <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                     <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
                   </svg>
                </button>

                {activeMenuIndex === index && (
                  <div className="action-dropdown row-dropdown">
                    <button onClick={() => handleRowAction('modify', index)}>
                      Modify model
                    </button>
                    <button onClick={() => handleRowAction('delete', index)} className="danger">
                      Delete model
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="empty-state">
             <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="1">
               <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" />
             </svg>
             <p>No Model found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ModelInformation;
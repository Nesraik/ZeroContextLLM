import React from 'react';
import './Sidebar.css';

interface SidebarProps {
  isOpen: boolean 
  onClose: () => void;
  currentView: string;
  onNavigate: (view: string) => void;
  hasModelSelected: boolean; 
}

const Sidebar = ({ isOpen, onClose, currentView, onNavigate, hasModelSelected }: SidebarProps) => {
  const handleNavClick = (viewName: string) => {
    onNavigate(viewName);
  }

  return (
    <>
      <div 
        className={`sidebar-overlay ${isOpen ? 'active' : ''}`} 
        onClick={onClose}
      />

      <div className={`sidebar-container ${isOpen ? 'open' : ''}`}>
        
        <div className="sidebar-header">
          <span className="sidebar-logo">ZeroContext LLM</span>
        </div>

        <nav className="sidebar-nav">
          <a href="#" 
             className={`nav-item ${currentView === 'playground' ? 'active' : ''} ${!hasModelSelected ? 'disabled' : ''}`}
             onClick={(e) => {
               e.preventDefault(); 
               if (hasModelSelected) {
                 handleNavClick('playground');
               }
             }}
          >
            <span className="icon">💬</span> Playground
          </a>
          
          <a href="#" 
             className={`nav-item ${currentView === 'model-information' ? 'active' : ''}`}
             onClick={(e) => {
                e.preventDefault();
                handleNavClick('model-information');
             }}
          >
            <span className="icon">🔧</span> Model Information
          </a>
        </nav>

      </div>
    </>
  );
};

export default Sidebar;
import React from 'react';

interface TopBarProps{
    onMenuClick?: () => void;
    onSettingsClick?: () => void;
    title: string;
}

const TopNavigationBar = ({onMenuClick, onSettingsClick,  title}: TopBarProps) => {
  return (
    <div className="top-bar">
     
      <div className="bar-left">
        <button className="bar-btn" onClick={onMenuClick}>
          
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
        </button>
        <span className="bar-title">{title}</span>
      </div>


      <div className="bar-right">
        {onSettingsClick && (
          <button className="bar-btn" onClick={onSettingsClick}>
             <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
               <path d="M12 20a8 8 0 1 0 0-16 8 8 0 0 0 0 16Z"/>
               <path d="M12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z"/>
               <path d="M12 2v2"/><path d="M12 22v-2"/>
               <path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/>
               <path d="M2 12h2"/><path d="M22 12h-2"/>
               <path d="m4.93 19.07 1.41-1.41"/><path d="m17.66 6.34 1.41-1.41"/>
             </svg>
          </button>
        )}
      </div>
    </div>
  );
};

export default TopNavigationBar;
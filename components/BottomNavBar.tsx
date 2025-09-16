
import React from 'react';
import { HomeIcon, SearchIcon, PlusSquareIcon, MessageSquareIcon, UserCircleIcon } from './icons';

type View = 'home' | 'search' | 'create' | 'chats' | 'profile';

interface BottomNavBarProps {
  activeView: View;
  onNavigate: (view: View) => void;
}

const NavItem: React.FC<{
  icon: React.ElementType;
  label: string;
  isActive: boolean;
  onClick: () => void;
}> = ({ icon: Icon, label, isActive, onClick }) => {
  const activeClass = 'text-sky-400';
  const inactiveClass = 'text-slate-400 hover:text-slate-200';
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center gap-1 w-full transition-colors ${isActive ? activeClass : inactiveClass}`}
      aria-label={label}
    >
      <Icon className="w-6 h-6" />
      <span className="text-xs font-medium">{label}</span>
    </button>
  );
};

const BottomNavBar: React.FC<BottomNavBarProps> = ({ activeView, onNavigate }) => {
  return (
    <footer className="fixed bottom-0 left-0 right-0 h-16 bg-slate-800/80 backdrop-blur-lg border-t border-slate-700 z-50">
      <nav className="h-full w-full max-w-lg mx-auto flex items-stretch justify-around">
        <NavItem
          icon={HomeIcon}
          label="Home"
          isActive={activeView === 'home'}
          onClick={() => onNavigate('home')}
        />
        <NavItem
          icon={SearchIcon}
          label="Search"
          isActive={activeView === 'search'}
          onClick={() => onNavigate('search')}
        />
        <NavItem
          icon={PlusSquareIcon}
          label="Create"
          isActive={activeView === 'create'}
          onClick={() => onNavigate('create')}
        />
         <NavItem
          icon={MessageSquareIcon}
          label="Chats"
          isActive={activeView === 'chats'}
          onClick={() => onNavigate('chats')}
        />
         <NavItem
          icon={UserCircleIcon}
          label="Profile"
          isActive={activeView === 'profile'}
          onClick={() => onNavigate('profile')}
        />
      </nav>
    </footer>
  );
};

export default BottomNavBar;

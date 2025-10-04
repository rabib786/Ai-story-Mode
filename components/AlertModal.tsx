
import React from 'react';
import { XIcon, InfoIcon } from './icons';

interface AlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
}

const AlertModal: React.FC<AlertModalProps> = ({ isOpen, onClose, title, message }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-black/90 w-full max-w-md rounded-xl shadow-2xl flex flex-col border border-zinc-800 backdrop-blur-xl animate-fade-in-scale"
        onClick={e => e.stopPropagation()}
      >
        <header className="flex items-center justify-between p-4 border-b border-zinc-800">
          <h2 className="text-xl font-bold text-slate-200">{title}</h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-sky-400 transition-colors rounded-full hover:bg-zinc-900">
            <XIcon className="w-6 h-6" />
          </button>
        </header>
        
        <div className="p-6">
            <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-sky-900/50 flex items-center justify-center border border-sky-500/30">
                    <InfoIcon className="w-6 h-6 text-sky-400" />
                </div>
                <p className="text-slate-300">{message}</p>
            </div>
        </div>
        
        <footer className="p-4 bg-zinc-950/50 border-t border-zinc-800 flex justify-end items-center gap-3 rounded-b-xl">
            <button
                onClick={onClose}
                className="bg-sky-600 hover:bg-sky-500 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-300"
            >
                OK
            </button>
        </footer>
      </div>
    </div>
  );
};

export default AlertModal;

import React, { useState } from 'react';
import { XIcon, PlusIcon, Trash2Icon, EditIcon, CheckIcon } from './icons';

interface MemoryBankModalProps {
  onClose: () => void;
  memories: string[];
  onUpdateMemories: (updatedMemories: string[]) => void;
}

const MemoryBankModal: React.FC<MemoryBankModalProps> = ({ onClose, memories, onUpdateMemories }) => {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editText, setEditText] = useState('');
  const [newMemoryText, setNewMemoryText] = useState('');

  const handleStartEdit = (index: number, text: string) => {
    setEditingIndex(index);
    setEditText(text);
  };

  const handleSaveEdit = () => {
    if (editingIndex === null) return;
    const updatedMemories = [...memories];
    updatedMemories[editingIndex] = editText.trim();
    onUpdateMemories(updatedMemories.filter(m => m)); // Remove empty strings
    setEditingIndex(null);
    setEditText('');
  };

  const handleDelete = (index: number) => {
    const updatedMemories = memories.filter((_, i) => i !== index);
    onUpdateMemories(updatedMemories);
  };

  const handleAddMemory = () => {
    if (!newMemoryText.trim()) return;
    const updatedMemories = [...memories, newMemoryText.trim()];
    onUpdateMemories(updatedMemories);
    setNewMemoryText('');
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
      <div
        className="w-full max-w-2xl h-full max-h-[80vh] bg-black/80 backdrop-blur-xl text-slate-200 flex flex-col rounded-xl shadow-2xl border border-zinc-800 animate-fade-in-scale"
        onClick={e => e.stopPropagation()}
      >
        <header className="flex items-center justify-between p-4 border-b border-zinc-800 flex-shrink-0">
          <h2 className="text-xl font-bold text-cyan-400">Memory Bank</h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white transition-colors rounded-full hover:bg-zinc-900">
            <XIcon className="w-6 h-6" />
          </button>
        </header>

        <div className="flex-grow overflow-y-auto p-6 space-y-4">
          {memories.length > 0 ? (
            memories.map((memory, index) => (
              <div key={index} className="bg-zinc-950 p-3 rounded-lg flex items-center justify-between gap-3 group">
                {editingIndex === index ? (
                  <input
                    type="text"
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    className="flex-grow bg-zinc-800 text-white rounded p-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    autoFocus
                    onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit()}
                  />
                ) : (
                  <p className="flex-grow text-slate-300">{memory}</p>
                )}
                <div className="flex items-center gap-2">
                  {editingIndex === index ? (
                    <button onClick={handleSaveEdit} className="p-2 text-green-400 hover:bg-zinc-900 rounded-full"><CheckIcon className="w-5 h-5"/></button>
                  ) : (
                    <button onClick={() => handleStartEdit(index, memory)} className="p-2 text-slate-400 hover:text-sky-400 hover:bg-zinc-900 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"><EditIcon className="w-5 h-5"/></button>
                  )}
                  <button onClick={() => handleDelete(index)} className="p-2 text-slate-400 hover:text-red-400 hover:bg-zinc-900 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"><Trash2Icon className="w-5 h-5"/></button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center text-slate-500 py-8">
              <p>No memories recorded yet.</p>
              <p className="text-sm">The AI will add key events here as the story progresses.</p>
            </div>
          )}
        </div>

        <footer className="p-4 border-t border-zinc-800 flex-shrink-0">
          <div className="flex gap-2">
            <input
              type="text"
              value={newMemoryText}
              onChange={(e) => setNewMemoryText(e.target.value)}
              placeholder="Manually add a new memory..."
              className="flex-grow bg-zinc-950 border border-zinc-800 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              onKeyDown={(e) => e.key === 'Enter' && handleAddMemory()}
            />
            <button
              onClick={handleAddMemory}
              className="bg-sky-600 hover:bg-sky-500 text-white font-bold p-3 rounded-lg transition-colors flex-shrink-0 disabled:bg-slate-600"
              disabled={!newMemoryText.trim()}
            >
              <PlusIcon className="w-6 h-6"/>
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default MemoryBankModal;
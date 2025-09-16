
import React from 'react';
import { ActiveChat } from '../types';
import { Trash2Icon } from './icons';

interface ChatsScreenProps {
  chats: ActiveChat[];
  onResumeChat: (chat: ActiveChat) => void;
  onDeleteChat: (chatId: string) => void;
}

// A simple utility to format time since a timestamp
const timeSince = (date: number): string => {
  const seconds = Math.floor((new Date().getTime() - date) / 1000);
  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + " years ago";
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + " months ago";
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + " days ago";
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + " hours ago";
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + " minutes ago";
  return "Just now";
};


const ChatsScreen: React.FC<ChatsScreenProps> = ({ chats, onResumeChat, onDeleteChat }) => {
  return (
    <div className="w-full max-w-5xl mx-auto animate-fade-in">
      <div className="text-center mb-8">
        <h1 className="text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-sky-400">
          Ongoing Chats
        </h1>
        <p className="text-slate-400 mt-2">Resume one of your active adventures.</p>
      </div>

      {chats.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {chats.map((chat) => (
            <div key={chat.id} className="bg-slate-800 rounded-lg border border-slate-700 flex flex-col group relative">
              <div className="p-4">
                <div className="flex items-start gap-4">
                  <img
                    src={chat.userCharacter.portrait}
                    alt={chat.userCharacter.name}
                    className="w-16 h-16 rounded-md object-cover flex-shrink-0 border-2 border-slate-600"
                  />
                  <div>
                    <h3 className="text-lg font-bold text-purple-400 line-clamp-1" title={chat.scenario.name}>
                      {chat.scenario.name}
                    </h3>
                    <p className="text-sm text-slate-300">
                      as {chat.userCharacter.name}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Last played: {timeSince(chat.lastUpdate)}
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-auto p-4 border-t border-slate-700/50">
                 <button
                    onClick={() => onResumeChat(chat)}
                    className="w-full text-center font-semibold text-white bg-sky-600 hover:bg-sky-500 rounded-md py-2 transition-colors"
                  >
                    Resume Adventure
                  </button>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation(); // Prevent card click
                  onDeleteChat(chat.id);
                }}
                title="Delete chat"
                className="absolute top-2 right-2 p-1.5 text-slate-400 bg-slate-800/50 hover:text-red-400 transition-all rounded-full"
              >
                <Trash2Icon className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 px-6 bg-slate-800/50 rounded-lg border-2 border-dashed border-slate-700">
            <h3 className="text-xl font-bold text-slate-400">No Active Chats</h3>
            <p className="text-slate-500 mt-2">Start a new adventure from the Home screen to see it here.</p>
        </div>
      )}
    </div>
  );
};

export default ChatsScreen;

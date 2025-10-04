

import React from 'react';
import { ActiveChat } from '../types';
import { Trash2Icon, UserIcon } from './icons';

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

const ChatCard = React.memo(({ chat, onResumeChat, onDeleteChat }: { chat: ActiveChat, onResumeChat: (chat: ActiveChat) => void, onDeleteChat: (chatId: string) => void }) => (
    <div
      onClick={() => onResumeChat(chat)}
      className="bg-zinc-950 rounded-lg border border-zinc-800 flex flex-col group relative overflow-hidden transform transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-sky-900/10 hover:border-sky-800/50 cursor-pointer"
    >
        <div className="relative h-24">
            <img 
              src={chat.scenario.image || `https://source.unsplash.com/random/400x200?${chat.scenario.tags[0]}`} 
              alt={chat.scenario.name}
              className="w-full h-full object-cover"
              loading="lazy"
              crossOrigin="anonymous" referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
        </div>
        <div className="relative p-4 pt-14 flex flex-col flex-grow">
            <div className="absolute left-4 -top-10">
              {chat.userCharacter.portrait ? (
                  <img src={chat.userCharacter.portrait} alt={chat.userCharacter.name} className="w-20 h-20 rounded-md object-cover border-4 border-zinc-950" loading="lazy" crossOrigin="anonymous" referrerPolicy="no-referrer" />
              ) : (
                  <div className="w-20 h-20 rounded-md bg-black flex items-center justify-center border-4 border-zinc-950"><UserIcon className="w-10 h-10 text-zinc-700" /></div>
              )}
            </div>

            <h3 className="text-lg font-bold text-cyan-400 line-clamp-1" title={chat.scenario.name}>
                {chat.scenario.name}
            </h3>
            <p className="text-sm text-slate-400 truncate">
                as {chat.userCharacter.name}
            </p>
            <p className="text-xs text-slate-500 mt-auto pt-4">
                Last played: {timeSince(chat.lastUpdate)}
            </p>
        </div>

        <button
            onClick={(e) => {
              e.stopPropagation();
              onDeleteChat(chat.id);
            }}
            title="Delete chat"
            className="absolute top-2 right-2 p-1.5 text-slate-400 bg-black/50 hover:text-red-400 transition-all rounded-full opacity-0 group-hover:opacity-100 z-10"
        >
            <Trash2Icon className="w-4 h-4" />
        </button>
    </div>
));


const ChatsScreen: React.FC<ChatsScreenProps> = ({ chats, onResumeChat, onDeleteChat }) => {
  return (
    <div className="w-full max-w-5xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-sky-500">
          Ongoing Chats
        </h1>
        <p className="text-slate-400 mt-2">Pick up an adventure right where you left off.</p>
      </div>

      {chats.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {chats.map((chat) => (
            <ChatCard
                key={chat.id}
                chat={chat}
                onResumeChat={onResumeChat}
                onDeleteChat={onDeleteChat}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 px-6 bg-zinc-950/50 rounded-lg border-2 border-dashed border-zinc-800">
            <h3 className="text-xl font-bold text-slate-400">No Active Chats</h3>
            <p className="text-slate-500 mt-2">Start a new adventure from the Home screen to see it here.</p>
        </div>
      )}
    </div>
  );
};

export default ChatsScreen;
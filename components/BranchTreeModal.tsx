import React, { useMemo } from 'react';
import { ActiveChat } from '../types';
import { CHAT_HISTORY_PREFIX } from '../constants/storageKeys';

interface BranchTreeModalProps {
  currentChat: ActiveChat;
  allChats: ActiveChat[];
  onClose: () => void;
  onResumeChat: (chat: ActiveChat) => void;
}

const BranchTreeModal: React.FC<BranchTreeModalProps> = ({ currentChat, allChats, onClose, onResumeChat }) => {

  // Find all chats in the same tree
  const rootId = currentChat.rootChatId || currentChat.id;
  const treeChats = useMemo(() => {
    return allChats.filter(c => (c.rootChatId || c.id) === rootId);
  }, [allChats, rootId]);

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-3xl h-[80vh] flex flex-col">
        <div className="flex justify-between items-center p-4 border-b border-zinc-800">
          <h2 className="text-xl font-bold text-slate-100">Branching Timeline</h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-white">&times;</button>
        </div>

        <div className="p-4 overflow-y-auto flex-grow flex flex-col items-center gap-4 relative">
          <p className="text-sm text-zinc-500 mb-4 text-center">
             (Visualizing branches for root: {rootId})<br/>
             Select a branch to resume playing from its latest state.
          </p>

          <div className="flex flex-col items-center gap-4 relative w-full">
            {treeChats.map((chat) => {
              const isCurrent = chat.id === currentChat.id;

              // Try to read how many messages it has to show progress
              let msgCount = 0;
              try {
                const historyRaw = localStorage.getItem(CHAT_HISTORY_PREFIX + chat.id);
                if (historyRaw) {
                    const parsed = JSON.parse(historyRaw);
                    msgCount = parsed.length;
                }
              } catch(e) {}

              return (
                <div
                    key={chat.id}
                    className={`w-full max-w-md p-4 rounded-xl border relative ${isCurrent ? 'border-sky-500 bg-sky-950/30' : 'border-zinc-700 bg-zinc-800/50 hover:border-zinc-500'} flex flex-col gap-2`}
                >
                    <div className="flex justify-between items-center">
                        <span className="font-bold text-slate-200">
                            {isCurrent ? "Current Branch" : "Alternate Branch"}
                        </span>
                        <span className="text-xs text-zinc-500">{msgCount} turns</span>
                    </div>
                    {chat.parentId && (
                        <div className="text-xs text-slate-400">
                            Forked from {chat.parentId.substring(0,8)}...
                        </div>
                    )}
                    <div className="text-xs text-zinc-500">
                        Updated: {new Date(chat.lastUpdate).toLocaleString()}
                    </div>

                    {!isCurrent && (
                        <button
                            onClick={() => { onResumeChat(chat); onClose(); }}
                            className="mt-2 w-full bg-zinc-700 hover:bg-zinc-600 text-white py-2 rounded-lg text-sm transition-colors"
                        >
                            Resume this branch
                        </button>
                    )}
                </div>
              );
            })}
          </div>

        </div>
      </div>
    </div>
  );
};

export default BranchTreeModal;

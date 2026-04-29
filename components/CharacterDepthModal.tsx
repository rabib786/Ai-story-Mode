import React, { useState } from 'react';
import { ActiveChat, CharacterArc, RelationshipState } from '../types';

interface CharacterDepthModalProps {
  chat: ActiveChat;
  onClose: () => void;
  onUpdateChat: (chat: ActiveChat) => void;
}

const CharacterDepthModal: React.FC<CharacterDepthModalProps> = ({ chat, onClose, onUpdateChat }) => {
  const [arcs, setArcs] = useState<Record<string, CharacterArc>>(chat.characterArcs || {});
  const [relationships, setRelationships] = useState<Record<string, Record<string, RelationshipState>>>(chat.relationshipMatrix || {});

  const [activeTab, setActiveTab] = useState<'arcs' | 'relationships'>('arcs');

  const handleSave = () => {
    onUpdateChat({ ...chat, characterArcs: arcs, relationshipMatrix: relationships });
    onClose();
  };

  const addGoal = (charName: string) => {
    setArcs(prev => ({
      ...prev,
      [charName]: {
        ...(prev[charName] || { goals: [], conflict: '', growthCheckpoints: [] }),
        goals: [...(prev[charName]?.goals || []), '']
      }
    }));
  };

  const updateGoal = (charName: string, index: number, value: string) => {
      setArcs(prev => {
          const charArc = { ...(prev[charName] || { goals: [], conflict: '', growthCheckpoints: [] }) };
          charArc.goals = [...charArc.goals];
          charArc.goals[index] = value;
          return { ...prev, [charName]: charArc };
      });
  };

  const updateConflict = (charName: string, value: string) => {
      setArcs(prev => ({
          ...prev,
          [charName]: {
              ...(prev[charName] || { goals: [], conflict: '', growthCheckpoints: [] }),
              conflict: value
          }
      }));
  }

  const addCheckpoint = (charName: string) => {
    setArcs(prev => ({
      ...prev,
      [charName]: {
        ...(prev[charName] || { goals: [], conflict: '', growthCheckpoints: [] }),
        growthCheckpoints: [...(prev[charName]?.growthCheckpoints || []), '']
      }
    }));
  };

  const updateCheckpoint = (charName: string, index: number, value: string) => {
      setArcs(prev => {
          const charArc = { ...(prev[charName] || { goals: [], conflict: '', growthCheckpoints: [] }) };
          charArc.growthCheckpoints = [...charArc.growthCheckpoints];
          charArc.growthCheckpoints[index] = value;
          return { ...prev, [charName]: charArc };
      });
  };


  const updateRelationship = (charA: string, charB: string, field: 'level' | 'label', value: string | number) => {
      setRelationships(prev => {
          const currentRel = prev[charA]?.[charB] || { targetCharacterId: charB, level: 0, label: '', history: [] };
          return {
              ...prev,
              [charA]: {
                  ...(prev[charA] || {}),
                  [charB]: { ...currentRel, [field]: value }
              }
          };
      });
  };

  // Ensure all characters from scenario and user are represented
  const allCharacters = [chat.userCharacter.name, ...chat.scenario.characters.map(c => c.name)];

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-4 border-b border-zinc-800">
          <h2 className="text-xl font-bold text-slate-100">Character Depth</h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-white">&times;</button>
        </div>

        <div className="flex p-2 border-b border-zinc-800 space-x-2">
            <button
                className={`px-4 py-2 rounded-lg ${activeTab === 'arcs' ? 'bg-sky-600/20 text-sky-400' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'}`}
                onClick={() => setActiveTab('arcs')}
            >Character Arcs</button>
            <button
                className={`px-4 py-2 rounded-lg ${activeTab === 'relationships' ? 'bg-sky-600/20 text-sky-400' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'}`}
                onClick={() => setActiveTab('relationships')}
            >Relationships Matrix</button>
        </div>

        <div className="p-4 overflow-y-auto flex-grow space-y-6">
          {activeTab === 'arcs' && allCharacters.map(charName => {
              const arc = arcs[charName] || { goals: [], conflict: '', growthCheckpoints: [] };
              return (
                  <div key={charName} className="bg-zinc-800/50 p-4 rounded-xl border border-zinc-700/50 space-y-3">
                      <h3 className="font-bold text-lg text-white">{charName}</h3>

                      <div>
                          <label className="block text-sm text-zinc-400 mb-1">Core Conflict</label>
                          <input
                              type="text"
                              value={arc.conflict}
                              onChange={(e) => updateConflict(charName, e.target.value)}
                              className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-white"
                              placeholder="Internal or external conflict..."
                          />
                      </div>

                      <div>
                          <div className="flex justify-between items-center mb-1">
                            <label className="text-sm text-zinc-400">Goals</label>
                            <button onClick={() => addGoal(charName)} className="text-xs text-sky-400 hover:text-sky-300">+ Add</button>
                          </div>
                          <div className="space-y-2">
                              {arc.goals.map((goal, idx) => (
                                  <input
                                    key={idx}
                                    type="text"
                                    value={goal}
                                    onChange={(e) => updateGoal(charName, idx, e.target.value)}
                                    className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm"
                                    placeholder="Goal..."
                                  />
                              ))}
                          </div>
                      </div>

                      <div>
                          <div className="flex justify-between items-center mb-1">
                            <label className="text-sm text-zinc-400">Growth Checkpoints</label>
                            <button onClick={() => addCheckpoint(charName)} className="text-xs text-sky-400 hover:text-sky-300">+ Add</button>
                          </div>
                          <div className="space-y-2">
                              {arc.growthCheckpoints.map((cp, idx) => (
                                  <input
                                    key={idx}
                                    type="text"
                                    value={cp}
                                    onChange={(e) => updateCheckpoint(charName, idx, e.target.value)}
                                    className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm"
                                    placeholder="Checkpoint..."
                                  />
                              ))}
                          </div>
                      </div>
                  </div>
              );
          })}

          {activeTab === 'relationships' && (
              <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                      <thead>
                          <tr>
                              <th className="p-2 border border-zinc-700 bg-zinc-800 text-zinc-300">Target &#8594;<br/>Source &#8595;</th>
                              {allCharacters.map(c => <th key={c} className="p-2 border border-zinc-700 bg-zinc-800 text-zinc-300">{c}</th>)}
                          </tr>
                      </thead>
                      <tbody>
                          {allCharacters.map(charA => (
                              <tr key={charA}>
                                  <th className="p-2 border border-zinc-700 bg-zinc-800 text-zinc-300">{charA}</th>
                                  {allCharacters.map(charB => {
                                      if (charA === charB) return <td key={charB} className="p-2 border border-zinc-700 bg-zinc-900 text-center text-zinc-600">-</td>;
                                      const rel = relationships[charA]?.[charB] || { level: 0, label: '' };
                                      return (
                                          <td key={charB} className="p-2 border border-zinc-700 bg-zinc-950">
                                              <input
                                                  type="number"
                                                  value={rel.level}
                                                  onChange={e => updateRelationship(charA, charB, 'level', parseInt(e.target.value) || 0)}
                                                  className="w-full bg-transparent text-white border-b border-zinc-800 mb-1"
                                                  placeholder="Lv (-100/100)"
                                              />
                                              <input
                                                  type="text"
                                                  value={rel.label}
                                                  onChange={e => updateRelationship(charA, charB, 'label', e.target.value)}
                                                  className="w-full bg-transparent text-xs text-sky-400"
                                                  placeholder="Label (e.g. Trust)"
                                              />
                                          </td>
                                      )
                                  })}
                              </tr>
                          ))}
                      </tbody>
                  </table>
              </div>
          )}
        </div>

        <div className="p-4 border-t border-zinc-800 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-slate-300 hover:text-white transition-colors">Cancel</button>
          <button onClick={handleSave} className="bg-sky-600 hover:bg-sky-500 text-white px-4 py-2 rounded-lg transition-colors shadow-lg shadow-sky-900/20">Save Changes</button>
        </div>
      </div>
    </div>
  );
};

export default CharacterDepthModal;

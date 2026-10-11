import React, { useState } from 'react';
import { AlertCircle, Award, Shield, X } from 'lucide-react';
import { ArbiterIncident, Player, Tournament } from '../types/chess';

interface IncidentModalProps {
  isOpen: boolean;
  onClose: () => void;
  tournament: Tournament;
  defaultBoardNumber?: number;
  defaultWhiteId?: string;
  defaultBlackId?: string | null;
  onSaveIncident: (incident: ArbiterIncident) => void;
}

export const IncidentModal: React.FC<IncidentModalProps> = ({
  isOpen,
  onClose,
  tournament,
  defaultBoardNumber,
  defaultWhiteId,
  defaultBlackId,
  onSaveIncident,
}) => {
  const [roundNumber, setRoundNumber] = useState(tournament.currentRound || 1);
  const [boardNumber, setBoardNumber] = useState(defaultBoardNumber || 1);
  const [incidentType, setIncidentType] = useState<ArbiterIncident['type']>('illegal_move');
  const [description, setDescription] = useState('');
  const [fideArticleCited, setFideArticleCited] = useState('Article 7.5.5');
  const [decision, setDecision] = useState('1st illegal move: +2 minutes awarded to opponent; position restored.');

  if (!isOpen) return null;

  const handleTypeChange = (type: ArbiterIncident['type']) => {
    setIncidentType(type);
    switch (type) {
      case 'illegal_move':
        setFideArticleCited(tournament.timeControlCategory === 'blitz' ? 'Appendix B.3' : 'Article 7.5.5');
        setDecision(tournament.timeControlCategory === 'blitz' ? 'Illegal move in Blitz: +1 min awarded to opponent; King moved legally.' : '1st illegal move: +2 min awarded to opponent; position restored.');
        break;
      case 'touch_move':
        setFideArticleCited('Article 4.3');
        setDecision('Touch-Move enforced: Player touched piece intentionally without saying "j’adoube", obligated to move touched piece.');
        break;
      case 'default_time':
        setFideArticleCited('Article 6.7.1');
        setDecision('Player failed to appear before default time expired. Game declared lost by forfeit (1F-0 or 0-1F).');
        break;
      case 'device_violation':
        setFideArticleCited('Article 11.3.2.1');
        setDecision('Electronic device/phone detected active in tournament hall. Game immediately forfeited for the player.');
        break;
      case 'draw_claim':
        setFideArticleCited('Article 9.2');
        setDecision('Threefold repetition verified on scoresheet. Game declared drawn immediately (1/2-1/2).');
        break;
      case 'conduct_warning':
        setFideArticleCited('Article 11.5');
        setDecision('Formal Arbiter warning issued for distraction/conduct breach. Second infraction results in penalty.');
        break;
      default:
        setFideArticleCited('FIDE Laws of Chess');
        setDecision('Arbiter discretion applied.');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const involved: string[] = [];
    if (defaultWhiteId) involved.push(defaultWhiteId);
    if (defaultBlackId) involved.push(defaultBlackId);

    const newInc: ArbiterIncident = {
      id: `inc-${Date.now()}`,
      roundNumber,
      boardNumber,
      playerIds: involved,
      type: incidentType,
      description: description || `Arbiter ruling on board ${boardNumber}`,
      fideArticleCited,
      decision,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
    };

    onSaveIncident(newInc);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-bold text-slate-100">Log Chief Arbiter Ruling / Incident</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 font-medium mb-1">Round</label>
              <input
                type="number"
                min={1}
                max={tournament.totalRounds}
                value={roundNumber}
                onChange={(e) => setRoundNumber(parseInt(e.target.value, 10))}
                className="w-full p-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-400 font-medium mb-1">Board Number</label>
              <input
                type="number"
                min={1}
                value={boardNumber}
                onChange={(e) => setBoardNumber(parseInt(e.target.value, 10))}
                className="w-full p-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-400 font-medium mb-1">Incident Category</label>
            <select
              value={incidentType}
              onChange={(e) => handleTypeChange(e.target.value as ArbiterIncident['type'])}
              className="w-full p-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100"
            >
              <option value="illegal_move">Illegal Move (Article 7.5 / Appendix B)</option>
              <option value="touch_move">Touch-Move Dispute (Article 4)</option>
              <option value="default_time">Default Time Forfeit / No-Show (Article 6.7)</option>
              <option value="device_violation">Mobile Phone / Electronic Device (Article 11.3)</option>
              <option value="draw_claim">Draw Claim (Threefold Repetition / 50 moves)</option>
              <option value="conduct_warning">Conduct / Distraction Warning (Article 11.5)</option>
              <option value="other">Other Administrative Ruling</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-400 font-medium mb-1">Incident Description</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. White moved Knight while King in check, or player arrived 8 minutes late..."
              className="w-full p-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 placeholder:text-slate-500"
            />
          </div>

          <div className="grid grid-cols-1 gap-3">
            <div>
              <label className="block text-slate-400 font-medium mb-1">FIDE Article Cited</label>
              <input
                type="text"
                value={fideArticleCited}
                onChange={(e) => setFideArticleCited(e.target.value)}
                className="w-full p-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 font-mono text-amber-400"
              />
            </div>
            <div>
              <label className="block text-slate-400 font-medium mb-1">Arbiter Decision / Penalty</label>
              <input
                type="text"
                value={decision}
                onChange={(e) => setDecision(e.target.value)}
                className="w-full p-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg text-slate-400 hover:text-slate-200 bg-slate-950 border border-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 font-semibold text-slate-950 bg-amber-500 hover:bg-amber-400 rounded-lg shadow-sm"
            >
              Record in Arbiter Log
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

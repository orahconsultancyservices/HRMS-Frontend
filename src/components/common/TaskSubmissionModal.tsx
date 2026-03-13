// src/components/common/TaskSubmissionModal.tsx
// Enhanced Task Submission Modal with Profile Comment Support

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload, MessageSquare, CheckCircle, AlertCircle,
  X, Info, Send, ChevronDown
} from 'lucide-react';
import { useSubmitTaskProgress } from '../../hooks/useTasks';

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

interface TaskSubmissionModalProps {
  task: {
    id: number;
    title: string;
    type: string;
    category: string;
    target: number;
    achieved: number;
    unit?: string;
    deadline: string;
  };
  employeeId: number;
  onClose: () => void;
  onSuccess?: () => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

const PROFILE_COMMENT_TEMPLATES = [
  'Met target consistently throughout the period.',
  'Exceeded expectations in client interactions.',
  'Encountered obstacles but maintained performance.',
  'New to role — learning curve accounted for.',
  'Collaborated effectively with cross-functional teams.',
  'Used innovative approach to achieve targets.',
  'Faced resource constraints beyond my control.',
  'Custom note…',
];

const formatDeadline = (d: string) => {
  const date = new Date(d);
  const today = new Date();
  const diff = Math.ceil((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (diff < 0)  return { label: `${Math.abs(diff)}d overdue`, color: 'text-red-600 bg-red-50' };
  if (diff === 0) return { label: 'Due today', color: 'text-amber-600 bg-amber-50' };
  return { label: `${diff}d left`, color: 'text-emerald-600 bg-emerald-50' };
};

// ─────────────────────────────────────────────────────────────────────────────
// MAIN MODAL COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

const TaskSubmissionModal = ({
  task, employeeId, onClose, onSuccess
}: TaskSubmissionModalProps) => {
  const submitMutation = useSubmitTaskProgress();

  const [achievedValue, setAchievedValue] = useState(0);
  const [notes, setNotes] = useState('');
  const [profileComment, setProfileComment] = useState('');
  const [profileCommentTemplate, setProfileCommentTemplate] = useState(PROFILE_COMMENT_TEMPLATES[0]);
  const [useCustomProfileComment, setUseCustomProfileComment] = useState(false);
  const [showProfileComment, setShowProfileComment] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const pct = task.target > 0 ? Math.min(((task.achieved + achievedValue) / task.target) * 100, 100) : 0;
  const dl = formatDeadline(task.deadline);
  const effectiveProfileComment = useCustomProfileComment ? profileComment : profileCommentTemplate;

  const handleSubmit = async () => {
    if (achievedValue <= 0) { setError('Count must be greater than 0.'); return; }
    setError('');
    setIsSubmitting(true);
    try {
      await submitMutation.mutateAsync({
        taskId: task.id,
        data: {
          employeeId,
          count: achievedValue,
          notes: [
            showProfileComment && effectiveProfileComment.trim()
              ? `Profile: ${effectiveProfileComment.trim()}`
              : '',
            notes.trim(),
          ].filter(Boolean).join(' | ') || undefined,
        },
      });
      setSuccess(true);
      setTimeout(() => { onSuccess?.(); onClose(); }, 1500);
    } catch (e: any) {
      setError(e?.response?.data?.message ?? e?.message ?? 'Submission failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92 }}
        className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-500 to-violet-600 p-5 sticky top-0 z-10 relative overflow-hidden">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-white/10 rounded-full" />
          <div className="relative flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Upload className="w-5 h-5 text-white" />
                <h3 className="text-lg font-bold text-white">Submit Progress</h3>
              </div>
              <p className="text-white/70 text-xs line-clamp-1">{task.title}</p>
            </div>
            <button onClick={onClose} className="p-1.5 hover:bg-white/10 rounded-xl cursor-pointer">
              <X className="w-5 h-5 text-white/70" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-5">

          {/* Task summary */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <p className="text-xs text-gray-400 mb-1">Type</p>
              <p className="text-sm font-bold text-gray-700 capitalize">{task.type}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <p className="text-xs text-gray-400 mb-1">Target</p>
              <p className="text-sm font-bold text-gray-700">{task.target.toLocaleString()} {task.unit}</p>
            </div>
            <div className={`rounded-xl p-3 text-center ${dl.color.includes('red') ? 'bg-red-50' : dl.color.includes('amber') ? 'bg-amber-50' : 'bg-emerald-50'}`}>
              <p className={`text-xs mb-1 ${dl.color.split(' ')[0]}`}>Deadline</p>
              <p className={`text-sm font-bold ${dl.color.split(' ')[0]}`}>{dl.label}</p>
            </div>
          </div>

          {/* Count input */}
          <div>
            <label className="text-sm font-bold text-gray-700 block mb-2">Count to Submit *</label>
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <input
                  type="number"
                  min={1}
                  value={achievedValue}
                  onChange={e => setAchievedValue(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-lg font-bold text-gray-800 focus:outline-none focus:border-indigo-400"
                />
                {task.unit && (
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-400 font-medium">{task.unit}</span>
                )}
              </div>
              <div className="flex flex-col gap-1">
                <button onClick={() => setAchievedValue(p => p + 1)} className="w-9 h-9 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center hover:bg-indigo-100 cursor-pointer font-bold">+</button>
                <button onClick={() => setAchievedValue(p => Math.max(0, p - 1))} className="w-9 h-9 bg-gray-100 text-gray-600 rounded-xl flex items-center justify-center hover:bg-gray-200 cursor-pointer font-bold">−</button>
              </div>
            </div>

            {/* Progress bar */}
            <div className="mt-3">
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-gray-400">Progress toward target</span>
                <span className="font-bold text-gray-700">{pct.toFixed(0)}%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.6, ease: 'easeOut' }}
                  className="h-3 rounded-full"
                  style={{ backgroundColor: pct >= 80 ? '#10B981' : pct >= 50 ? '#F59E0B' : '#6366F1' }}
                />
              </div>
              <p className={`text-xs mt-1 font-semibold ${pct >= 100 ? 'text-emerald-600' : pct >= 80 ? 'text-emerald-500' : pct >= 50 ? 'text-amber-600' : 'text-indigo-500'}`}>
                {pct >= 100 ? '✓ Target achieved!' : pct >= 80 ? 'On track' : pct >= 50 ? 'At risk' : 'Behind target'}
              </p>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="text-sm font-bold text-gray-700 block mb-1.5">
              Submission Notes <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Any context about this submission — challenges, highlights, blockers…"
              rows={3}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:border-indigo-400"
            />
          </div>

          {/* Profile Comment section */}
          <div className="border border-dashed border-gray-200 rounded-2xl overflow-hidden">
            <button
              onClick={() => setShowProfileComment(p => !p)}
              className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-indigo-500" />
                <span className="text-sm font-bold text-gray-700">Profile Comment</span>
                <span className="text-xs bg-indigo-50 text-indigo-600 border border-indigo-100 px-2 py-0.5 rounded-lg font-medium">
                  Appears on your profile
                </span>
              </div>
              <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showProfileComment ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
              {showProfileComment && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="px-4 pb-4 space-y-3 border-t border-dashed border-gray-100 pt-4">
                    <div className="flex items-start gap-2 text-xs text-indigo-700 bg-indigo-50 border border-indigo-100 p-2.5 rounded-xl">
                      <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                      This comment will appear on your employee profile and may be seen by team leads and management.
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-gray-600 block mb-1.5">Quick Template</label>
                      <select
                        value={profileCommentTemplate}
                        onChange={e => {
                          setProfileCommentTemplate(e.target.value);
                          setUseCustomProfileComment(e.target.value === 'Custom note…');
                        }}
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:border-indigo-400 cursor-pointer"
                      >
                        {PROFILE_COMMENT_TEMPLATES.map(t => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </div>

                    {useCustomProfileComment ? (
                      <div>
                        <label className="text-xs font-semibold text-gray-600 block mb-1.5">Your Comment</label>
                        <textarea
                          value={profileComment}
                          onChange={e => setProfileComment(e.target.value)}
                          placeholder="Write a note about your performance this period…"
                          rows={3}
                          maxLength={500}
                          className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:border-indigo-400"
                        />
                        <div className="flex justify-between mt-1">
                          <span className="text-xs text-gray-400">Max 500 characters</span>
                          <span className="text-xs text-gray-400">{profileComment.length}/500</span>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-gray-50 border border-gray-200 rounded-xl p-3">
                        <p className="text-sm text-gray-700 italic">"{profileCommentTemplate}"</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
              <p className="text-xs text-red-700">{error}</p>
            </div>
          )}

          {/* Success */}
          <AnimatePresence>
            {success && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                <CheckCircle className="w-4 h-4 text-emerald-500" />
                <p className="text-sm font-semibold text-emerald-700">Submission saved successfully!</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <motion.button
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              onClick={handleSubmit}
              disabled={isSubmitting || success}
              className="flex-1 py-3 bg-gradient-to-r from-indigo-500 to-violet-600 text-white rounded-xl font-semibold hover:shadow-lg transition cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSubmitting
                ? <><div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" /> Submitting…</>
                : success
                ? <><CheckCircle className="w-4 h-4" /> Submitted!</>
                : <><Send className="w-4 h-4" /> Submit Progress</>}
            </motion.button>
            <button onClick={onClose} disabled={isSubmitting}
              className="px-5 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition cursor-pointer disabled:opacity-50">
              Cancel
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default TaskSubmissionModal;
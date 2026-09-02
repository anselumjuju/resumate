'use client';

import React, { useState } from 'react';
import { useCandidateProfile } from '@/hooks/use-candidate-profile';
import { ProfileCategory, CertificationItem, AchievementItem } from '@/types/profile';

type CategoryMeta = {
  id: ProfileCategory;
  label: string;
  isStructured?: boolean;
  description: string;
};

const CATEGORIES: CategoryMeta[] = [
  {
    id: 'skills',
    label: 'Skills',
    description: 'Programming languages, frameworks, libraries, and core technical proficiencies.',
  },
  {
    id: 'tools',
    label: 'Tools',
    description: 'Developer platforms, CLI utilities, databases, CI/CD, and workflow tooling.',
  },
  {
    id: 'certifications',
    label: 'Certifications',
    isStructured: true,
    description: 'Official licenses, verified certifications, and credentials.',
  },
  {
    id: 'achievements',
    label: 'Achievements',
    isStructured: true,
    description: 'Key quantifiable career milestones, awards, and major project impacts.',
  },
];

export function CandidateProfilePanel() {
  const {
    profile,
    addSimpleItem,
    removeSimpleItem,
    editSimpleItem,
    addCertification,
    removeCertification,
    editCertification,
    addAchievement,
    removeAchievement,
    editAchievement,
  } = useCandidateProfile();

  const [activeCategory, setActiveCategory] = useState<ProfileCategory>('skills');

  // Simple Item Input State
  const [simpleInput, setSimpleInput] = useState('');
  const [editingSimpleIndex, setEditingSimpleIndex] = useState<number | null>(null);
  const [editingSimpleValue, setEditingSimpleValue] = useState('');

  // Structured Certification Input State
  const [certTitle, setCertTitle] = useState('');
  const [certDesc, setCertDesc] = useState('');
  const [certLink, setCertLink] = useState('');
  const [editingCertIndex, setEditingCertIndex] = useState<number | null>(null);

  // Structured Achievement Input State
  const [achTitle, setAchTitle] = useState('');
  const [achDesc, setAchDesc] = useState('');
  const [editingAchIndex, setEditingAchIndex] = useState<number | null>(null);

  const currentCategoryMeta = CATEGORIES.find((c) => c.id === activeCategory)!;

  // Simple item actions
  const handleAddSimple = () => {
    if (!simpleInput.trim()) return;
    const entries = simpleInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    entries.forEach((item) => addSimpleItem(activeCategory as 'skills' | 'tools', item));
    setSimpleInput('');
  };

  const handleSaveSimpleEdit = (index: number) => {
    if (editingSimpleValue.trim()) {
      editSimpleItem(activeCategory as 'skills' | 'tools', index, editingSimpleValue.trim());
    }
    setEditingSimpleIndex(null);
    setEditingSimpleValue('');
  };

  // Certification actions
  const handleAddCertification = () => {
    if (!certTitle.trim() || !certDesc.trim()) return;
    const newCert: CertificationItem = {
      title: certTitle.trim(),
      description: certDesc.trim(),
      ...(certLink.trim() ? { link: certLink.trim() } : {}),
    };

    if (editingCertIndex !== null) {
      editCertification(editingCertIndex, newCert);
      setEditingCertIndex(null);
    } else {
      addCertification(newCert);
    }

    setCertTitle('');
    setCertDesc('');
    setCertLink('');
  };

  const handleEditCertification = (idx: number, cert: CertificationItem) => {
    setCertTitle(cert.title);
    setCertDesc(cert.description);
    setCertLink(cert.link || '');
    setEditingCertIndex(idx);
  };

  // Achievement actions
  const handleAddAchievement = () => {
    if (!achTitle.trim() || !achDesc.trim()) return;
    const newAch: AchievementItem = {
      title: achTitle.trim(),
      description: achDesc.trim(),
    };

    if (editingAchIndex !== null) {
      editAchievement(editingAchIndex, newAch);
      setEditingAchIndex(null);
    } else {
      addAchievement(newAch);
    }

    setAchTitle('');
    setAchDesc('');
  };

  const handleEditAchievement = (idx: number, ach: AchievementItem) => {
    setAchTitle(ach.title);
    setAchDesc(ach.description);
    setEditingAchIndex(idx);
  };

  return (
    <div className='space-y-6 select-none'>
      {/* ── Category Pill Tabs ── */}
      <div className='grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-1 bg-white/5 rounded-xl border border-white/5'>
        {CATEGORIES.map((cat) => {
          const count =
            cat.id === 'skills'
              ? profile.skills?.length || 0
              : cat.id === 'tools'
              ? profile.tools?.length || 0
              : cat.id === 'certifications'
              ? profile.certifications?.length || 0
              : profile.achievements?.length || 0;

          return (
            <button
              key={cat.id}
              type='button'
              onClick={() => setActiveCategory(cat.id)}
              className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center justify-between transition-all ${
                activeCategory === cat.id
                  ? 'bg-accent text-black shadow-md'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}>
              <span>{cat.label}</span>
              <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-bold ${
                activeCategory === cat.id ? 'bg-black/20 text-black' : 'bg-white/10 text-white/40'
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Category Description Banner */}
      <div className='p-3.5 rounded-xl bg-white/[0.02] border border-white/5 flex items-start gap-3'>
        <div className='w-2 h-2 rounded-full bg-accent mt-1.5 shrink-0' />
        <div>
          <p className='text-xs text-white/80 font-medium'>
            {currentCategoryMeta.description}
          </p>
          <p className='text-[11px] text-white/40 mt-0.5'>
            Verified ground truth: AI tailoring will strictly guard against adding items not present in this list.
          </p>
        </div>
      </div>

      {/* ── Simple Items (Skills / Tools) ── */}
      {!currentCategoryMeta.isStructured && (
        <div className='space-y-4'>
          {/* Add Input Bar */}
          <div className='flex gap-2'>
            <input
              type='text'
              placeholder={`Add ${currentCategoryMeta.label.toLowerCase()} (separate with commas)…`}
              value={simpleInput}
              onChange={(e) => setSimpleInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddSimple();
                }
              }}
              className='flex-1 px-3.5 py-2 text-xs bg-white/5 border border-white/10 rounded-xl focus:border-accent/40 text-white placeholder:text-white/20 outline-none'
            />
            <button
              type='button'
              onClick={handleAddSimple}
              disabled={!simpleInput.trim()}
              className='px-4 py-2 bg-accent text-black text-xs font-bold rounded-xl hover:opacity-90 active:scale-95 transition-all shadow-md disabled:opacity-30'>
              Add
            </button>
          </div>

          {/* Item Badges Grid */}
          <div className='flex flex-wrap gap-2 pt-1'>
            {((activeCategory === 'skills' ? profile.skills : profile.tools) || []).map((item, index) => {
              const isEditing = editingSimpleIndex === index;

              if (isEditing) {
                return (
                  <div key={index} className='flex items-center gap-1.5 bg-white/10 border border-accent/40 rounded-lg p-1'>
                    <input
                      type='text'
                      value={editingSimpleValue}
                      onChange={(e) => setEditingSimpleValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveSimpleEdit(index);
                        if (e.key === 'Escape') setEditingSimpleIndex(null);
                      }}
                      className='bg-transparent text-xs text-white px-2 py-0.5 outline-none font-medium w-28'
                      autoFocus
                    />
                    <button
                      onClick={() => handleSaveSimpleEdit(index)}
                      className='px-2 py-0.5 bg-accent text-black text-[10px] font-bold rounded'>
                      ✓
                    </button>
                  </div>
                );
              }

              return (
                <div
                  key={index}
                  className='group flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#18181d] border border-white/8 hover:border-white/20 transition-all text-xs font-medium text-white/90'>
                  <span>{item}</span>
                  <button
                    type='button'
                    onClick={() => {
                      setEditingSimpleIndex(index);
                      setEditingSimpleValue(item);
                    }}
                    className='opacity-0 group-hover:opacity-100 p-0.5 text-white/40 hover:text-white transition-opacity'
                    title='Edit'>
                    <svg className='w-3 h-3' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z' />
                    </svg>
                  </button>
                  <button
                    type='button'
                    onClick={() => removeSimpleItem(activeCategory as 'skills' | 'tools', index)}
                    className='opacity-0 group-hover:opacity-100 p-0.5 text-white/40 hover:text-red-400 transition-opacity'
                    title='Remove'>
                    <svg className='w-3 h-3' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M6 18L18 6M6 6l12 12' />
                    </svg>
                  </button>
                </div>
              );
            })}

            {((activeCategory === 'skills' ? profile.skills : profile.tools) || []).length === 0 && (
              <div className='w-full py-8 text-center rounded-xl bg-white/[0.01] border border-dashed border-white/10'>
                <p className='text-xs text-white/30'>No {currentCategoryMeta.label.toLowerCase()} added yet.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Structured Items: Certifications ── */}
      {activeCategory === 'certifications' && (
        <div className='space-y-5'>
          {/* Add / Edit Form */}
          <div className='p-4 rounded-xl bg-[#121215] border border-white/8 space-y-3'>
            <span className='text-xs font-bold text-white uppercase tracking-wider block'>
              {editingCertIndex !== null ? 'Edit Certification' : 'Add Certification'}
            </span>

            <input
              type='text'
              placeholder='Certification Title (e.g. AWS Certified Solutions Architect)…'
              value={certTitle}
              onChange={(e) => setCertTitle(e.target.value)}
              className='w-full px-3.5 py-2 text-xs bg-white/5 border border-white/10 rounded-xl focus:border-accent/40 text-white placeholder:text-white/20 outline-none'
            />

            <textarea
              placeholder='Description / Authority / Credential ID…'
              value={certDesc}
              onChange={(e) => setCertDesc(e.target.value)}
              rows={2}
              className='w-full px-3.5 py-2 text-xs bg-white/5 border border-white/10 rounded-xl focus:border-accent/40 text-white placeholder:text-white/20 outline-none resize-none'
            />

            <input
              type='url'
              placeholder='Credential URL / Verification Link (Optional)…'
              value={certLink}
              onChange={(e) => setCertLink(e.target.value)}
              className='w-full px-3.5 py-2 text-xs bg-white/5 border border-white/10 rounded-xl focus:border-accent/40 text-white placeholder:text-white/20 outline-none'
            />

            <div className='flex items-center justify-end gap-2 pt-1'>
              {editingCertIndex !== null && (
                <button
                  type='button'
                  onClick={() => {
                    setEditingCertIndex(null);
                    setCertTitle('');
                    setCertDesc('');
                    setCertLink('');
                  }}
                  className='px-3.5 py-1.5 text-xs text-white/60 hover:text-white'>
                  Cancel
                </button>
              )}
              <button
                type='button'
                onClick={handleAddCertification}
                disabled={!certTitle.trim() || !certDesc.trim()}
                className='px-4 py-1.5 bg-accent text-black text-xs font-bold rounded-xl hover:opacity-90 active:scale-95 transition-all shadow-md disabled:opacity-30'>
                {editingCertIndex !== null ? 'Save Certification' : 'Add Certification'}
              </button>
            </div>
          </div>

          {/* Cards List */}
          <div className='space-y-2.5'>
            {(profile.certifications || []).map((cert, index) => (
              <div
                key={index}
                className='p-3.5 rounded-xl bg-[#121215] border border-white/8 hover:border-white/15 transition-all flex items-start justify-between gap-4'>
                <div className='space-y-1 min-w-0'>
                  <div className='flex items-center gap-2'>
                    <h4 className='text-xs font-bold text-white truncate'>{cert.title}</h4>
                    {cert.link && (
                      <a
                        href={cert.link}
                        target='_blank'
                        rel='noreferrer'
                        className='text-[10px] text-accent hover:underline flex items-center gap-0.5 shrink-0'>
                        <span>Link</span>
                        <svg className='w-2.5 h-2.5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                          <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14' />
                        </svg>
                      </a>
                    )}
                  </div>
                  <p className='text-xs text-white/60 leading-relaxed'>{cert.description}</p>
                </div>

                <div className='flex items-center gap-1 shrink-0'>
                  <button
                    onClick={() => handleEditCertification(index, cert)}
                    className='p-1.5 text-white/40 hover:text-white rounded hover:bg-white/5 transition-colors'
                    title='Edit'>
                    <svg className='w-3.5 h-3.5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z' />
                    </svg>
                  </button>
                  <button
                    onClick={() => removeCertification(index)}
                    className='p-1.5 text-white/40 hover:text-red-400 rounded hover:bg-red-500/10 transition-colors'
                    title='Remove'>
                    <svg className='w-3.5 h-3.5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M6 18L18 6M6 6l12 12' />
                    </svg>
                  </button>
                </div>
              </div>
            ))}

            {(profile.certifications || []).length === 0 && (
              <div className='py-8 text-center rounded-xl bg-white/[0.01] border border-dashed border-white/10'>
                <p className='text-xs text-white/30'>No certifications added yet.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Structured Items: Achievements ── */}
      {activeCategory === 'achievements' && (
        <div className='space-y-5'>
          {/* Add / Edit Form */}
          <div className='p-4 rounded-xl bg-[#121215] border border-white/8 space-y-3'>
            <span className='text-xs font-bold text-white uppercase tracking-wider block'>
              {editingAchIndex !== null ? 'Edit Achievement' : 'Add Achievement'}
            </span>

            <input
              type='text'
              placeholder='Achievement Title (e.g. Scaled Database Architecture)…'
              value={achTitle}
              onChange={(e) => setAchTitle(e.target.value)}
              className='w-full px-3.5 py-2 text-xs bg-white/5 border border-white/10 rounded-xl focus:border-accent/40 text-white placeholder:text-white/20 outline-none'
            />

            <textarea
              placeholder='Details with measurable metrics (e.g. reduced query latency by 45%, handled 10M daily events)…'
              value={achDesc}
              onChange={(e) => setAchDesc(e.target.value)}
              rows={2}
              className='w-full px-3.5 py-2 text-xs bg-white/5 border border-white/10 rounded-xl focus:border-accent/40 text-white placeholder:text-white/20 outline-none resize-none'
            />

            <div className='flex items-center justify-end gap-2 pt-1'>
              {editingAchIndex !== null && (
                <button
                  type='button'
                  onClick={() => {
                    setEditingAchIndex(null);
                    setAchTitle('');
                    setAchDesc('');
                  }}
                  className='px-3.5 py-1.5 text-xs text-white/60 hover:text-white'>
                  Cancel
                </button>
              )}
              <button
                type='button'
                onClick={handleAddAchievement}
                disabled={!achTitle.trim() || !achDesc.trim()}
                className='px-4 py-1.5 bg-accent text-black text-xs font-bold rounded-xl hover:opacity-90 active:scale-95 transition-all shadow-md disabled:opacity-30'>
                {editingAchIndex !== null ? 'Save Achievement' : 'Add Achievement'}
              </button>
            </div>
          </div>

          {/* Cards List */}
          <div className='space-y-2.5'>
            {(profile.achievements || []).map((ach, index) => (
              <div
                key={index}
                className='p-3.5 rounded-xl bg-[#121215] border border-white/8 hover:border-white/15 transition-all flex items-start justify-between gap-4'>
                <div className='space-y-1 min-w-0'>
                  <h4 className='text-xs font-bold text-white truncate'>{ach.title}</h4>
                  <p className='text-xs text-white/60 leading-relaxed'>{ach.description}</p>
                </div>

                <div className='flex items-center gap-1 shrink-0'>
                  <button
                    onClick={() => handleEditAchievement(index, ach)}
                    className='p-1.5 text-white/40 hover:text-white rounded hover:bg-white/5 transition-colors'
                    title='Edit'>
                    <svg className='w-3.5 h-3.5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z' />
                    </svg>
                  </button>
                  <button
                    onClick={() => removeAchievement(index)}
                    className='p-1.5 text-white/40 hover:text-red-400 rounded hover:bg-red-500/10 transition-colors'
                    title='Remove'>
                    <svg className='w-3.5 h-3.5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M6 18L18 6M6 6l12 12' />
                    </svg>
                  </button>
                </div>
              </div>
            ))}

            {(profile.achievements || []).length === 0 && (
              <div className='py-8 text-center rounded-xl bg-white/[0.01] border border-dashed border-white/10'>
                <p className='text-xs text-white/30'>No achievements added yet.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import React, { useState } from 'react';
import { useCandidateProfile } from '@/hooks/use-candidate-profile';
import { ProfileCategory } from '@/types/profile';

type CategoryMeta = {
  id: ProfileCategory;
  label: string;
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
];

export function CandidateProfilePanel() {
  const {
    profile,
    addSimpleItem,
    removeSimpleItem,
    editSimpleItem,
  } = useCandidateProfile();

  const [activeCategory, setActiveCategory] = useState<ProfileCategory>('skills');

  // Simple Item Input State
  const [simpleInput, setSimpleInput] = useState('');
  const [editingSimpleIndex, setEditingSimpleIndex] = useState<number | null>(null);
  const [editingSimpleValue, setEditingSimpleValue] = useState('');

  const currentCategoryMeta = CATEGORIES.find((c) => c.id === activeCategory)!;

  // Simple item actions
  const handleAddSimple = () => {
    if (!simpleInput.trim()) return;
    const entries = simpleInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    entries.forEach((item) => addSimpleItem(activeCategory, item));
    setSimpleInput('');
  };

  const handleSaveSimpleEdit = (index: number) => {
    if (editingSimpleValue.trim()) {
      editSimpleItem(activeCategory, index, editingSimpleValue.trim());
    }
    setEditingSimpleIndex(null);
    setEditingSimpleValue('');
  };

  const currentItems = (activeCategory === 'skills' ? profile.skills : profile.tools) || [];

  return (
    <div className='space-y-6 select-none'>
      {/* ── Category Pill Tabs (2 Clean Tabs) ── */}
      <div className='grid grid-cols-2 gap-1.5 p-1 bg-white/5 rounded-xl border border-white/5'>
        {CATEGORIES.map((cat) => {
          const count = cat.id === 'skills' ? profile.skills?.length || 0 : profile.tools?.length || 0;

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
              <span
                className={`px-1.5 py-0.2 rounded-md text-[10px] font-bold ${
                  activeCategory === cat.id ? 'bg-black/20 text-black' : 'bg-white/10 text-white/40'
                }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Category Description Banner */}
      <div className='p-3.5 rounded-xl bg-white/2 border border-white/5 flex items-start gap-3'>
        <div className='w-2 h-2 rounded-full bg-accent mt-1.5 shrink-0' />
        <div>
          <p className='text-xs text-white/80 font-medium'>
            {currentCategoryMeta.description}
          </p>
          <p className='text-[11px] text-white/40 mt-0.5'>
            Verified ground truth: AI tailoring strictly guards against adding items not present in this list.
          </p>
        </div>
      </div>

      {/* ── Items List & Input ── */}
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
            className='flex-1 px-3.5 py-2 text-xs bg-white/5 border border-white/10 rounded-xl focus:border-accent/40 text-white placeholder:text-white/20 outline-none min-w-0'
          />
          <button
            type='button'
            onClick={handleAddSimple}
            disabled={!simpleInput.trim()}
            className='px-4 py-2 bg-accent text-black text-xs font-bold rounded-xl hover:opacity-90 active:scale-95 transition-all shadow-md disabled:opacity-30 shrink-0'>
            Add
          </button>
        </div>

        {/* Item Badges Grid */}
        <div className='flex flex-wrap gap-2 pt-1'>
          {currentItems.map((item, index) => {
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
                  onClick={() => removeSimpleItem(activeCategory, index)}
                  className='opacity-0 group-hover:opacity-100 p-0.5 text-white/40 hover:text-red-400 transition-opacity'
                  title='Remove'>
                  <svg className='w-3 h-3' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M6 18L18 6M6 6l12 12' />
                  </svg>
                </button>
              </div>
            );
          })}

          {currentItems.length === 0 && (
            <div className='w-full py-8 text-center rounded-xl bg-white/1 border border-dashed border-white/10'>
              <p className='text-xs text-white/30'>No {currentCategoryMeta.label.toLowerCase()} added yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

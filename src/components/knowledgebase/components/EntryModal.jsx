import React, { useState } from 'react';
import { FiX, FiXCircle } from 'react-icons/fi';
import katex from 'katex';
import { CONSTANTS } from '../constants';
import { fileUtils } from '../utils';

export function EntryModal({ entry, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    title: entry?.title || '',
    content: entry?.content || '',
    type: entry?.type || CONSTANTS.ENTRY_TYPES.NOTE,
    category: entry?.category || '',
    difficulty: entry?.difficulty || CONSTANTS.DIFFICULTY_LEVELS.BEGINNER,
    duration: entry?.duration || '',
    tags: entry?.tags || [],
    images: entry?.images || [],
    formulas: entry?.formulas || [],
    modules: entry?.modules || []
  });
  const [tagInput, setTagInput] = useState('');
  const [formulaInput, setFormulaInput] = useState('');
  const [moduleInput, setModuleInput] = useState({ title: '', duration: '' });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    const validFiles = files.filter(file => 
      CONSTANTS.ALLOWED_FILE_TYPES.includes(file.type) && 
      file.size <= CONSTANTS.MAX_FILE_SIZE
    );

    for (const file of validFiles) {
      try {
        const compressed = await fileUtils.compressImage(file);
        const dataURL = await fileUtils.readFileAsDataURL(compressed);
        setFormData(prev => ({
          ...prev,
          images: [...prev.images, {
            id: Date.now().toString(),
            dataURL,
            name: file.name,
            size: compressed.size
          }]
        }));
      } catch (error) {
        
      }
    }
  };

  const removeImage = (imageId) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter(img => img.id !== imageId)
    }));
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const removeTag = (tag) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }));
  };

  const addFormula = () => {
    if (formulaInput.trim()) {
      setFormData(prev => ({
        ...prev,
        formulas: [...prev.formulas, {
          id: Date.now().toString(),
          latex: formulaInput.trim()
        }]
      }));
      setFormulaInput('');
    }
  };

  const removeFormula = (formulaId) => {
    setFormData(prev => ({
      ...prev,
      formulas: prev.formulas.filter(f => f.id !== formulaId)
    }));
  };

  const addModule = () => {
    if (moduleInput.title.trim() && moduleInput.duration.trim()) {
      setFormData(prev => ({
        ...prev,
        modules: [...prev.modules, {
          id: Date.now().toString(),
          title: moduleInput.title.trim(),
          duration: moduleInput.duration.trim(),
          completed: false
        }]
      }));
      setModuleInput({ title: '', duration: '' });
    }
  };

  const removeModule = (moduleId) => {
    setFormData(prev => ({
      ...prev,
      modules: prev.modules.filter(m => m.id !== moduleId)
    }));
  };

  const isLearningContent = ['course', 'tutorial', 'video', 'article'].includes(formData.type);

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
      <div className="glass-card rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-white mb-6">
            {entry ? 'Edit Entry' : 'Create New Entry'}
          </h2>

          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white"
                  >
                    <option value={CONSTANTS.ENTRY_TYPES.NOTE} className="bg-[#0a0a0f]">Note</option>
                    <option value={CONSTANTS.ENTRY_TYPES.FORMULA} className="bg-[#0a0a0f]">Formula</option>
                    <option value={CONSTANTS.ENTRY_TYPES.STRATEGY} className="bg-[#0a0a0f]">Strategy</option>
                    <option value={CONSTANTS.ENTRY_TYPES.OBSERVATION} className="bg-[#0a0a0f]">Observation</option>
                    <option value={CONSTANTS.ENTRY_TYPES.COURSE} className="bg-[#0a0a0f]">Course</option>
                    <option value={CONSTANTS.ENTRY_TYPES.TUTORIAL} className="bg-[#0a0a0f]">Tutorial</option>
                    <option value={CONSTANTS.ENTRY_TYPES.ARTICLE} className="bg-[#0a0a0f]">Article</option>
                    <option value={CONSTANTS.ENTRY_TYPES.VIDEO} className="bg-[#0a0a0f]">Video</option>
                  </select>
                </div>

                {isLearningContent && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Category</label>
                      <select
                        value={formData.category}
                        onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white"
                      >
                        <option value="" className="bg-[#0a0a0f]">Select category...</option>
                        <option value={CONSTANTS.LEARNING_CATEGORIES.TECHNICAL_ANALYSIS} className="bg-[#0a0a0f]">Technical Analysis</option>
                        <option value={CONSTANTS.LEARNING_CATEGORIES.FUNDAMENTAL_ANALYSIS} className="bg-[#0a0a0f]">Fundamental Analysis</option>
                        <option value={CONSTANTS.LEARNING_CATEGORIES.RISK_MANAGEMENT} className="bg-[#0a0a0f]">Risk Management</option>
                        <option value={CONSTANTS.LEARNING_CATEGORIES.TRADING_PSYCHOLOGY} className="bg-[#0a0a0f]">Trading Psychology</option>
                        <option value={CONSTANTS.LEARNING_CATEGORIES.MARKET_STRUCTURE} className="bg-[#0a0a0f]">Market Structure</option>
                        <option value={CONSTANTS.LEARNING_CATEGORIES.STRATEGY_DEVELOPMENT} className="bg-[#0a0a0f]">Strategy Development</option>
                        <option value={CONSTANTS.LEARNING_CATEGORIES.PORTFOLIO_MANAGEMENT} className="bg-[##0a0a0f]">Portfolio Management</option>
                        <option value={CONSTANTS.LEARNING_CATEGORIES.ALGORITHMIC_TRADING} className="bg-[#0a0a0f]">Algorithmic Trading</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Difficulty</label>
                      <select
                        value={formData.difficulty}
                        onChange={(e) => setFormData(prev => ({ ...prev, difficulty: e.target.value }))}
                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white"
                      >
                        <option value={CONSTANTS.DIFFICULTY_LEVELS.BEGINNER} className="bg-[#0a0a0f]">Beginner</option>
                        <option value={CONSTANTS.DIFFICULTY_LEVELS.INTERMEDIATE} className="bg-[#0a0a0f]">Intermediate</option>
                        <option value={CONSTANTS.DIFFICULTY_LEVELS.ADVANCED} className="bg-[#0a0a0f]">Advanced</option>
                        <option value={CONSTANTS.DIFFICULTY_LEVELS.EXPERT} className="bg-[#0a0a0f]">Expert</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Duration</label>
                      <input
                        type="text"
                        value={formData.duration}
                        onChange={(e) => setFormData(prev => ({ ...prev, duration: e.target.value }))}
                        placeholder="e.g., 2 hours, 45 min"
                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400"
                      />
                    </div>
                  </>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Title</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Content</label>
                <textarea
                  required
                  rows={6}
                  value={formData.content}
                  onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>

              {/* Course Modules */}
              {formData.type === CONSTANTS.ENTRY_TYPES.COURSE && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Course Modules</label>
                  {formData.modules.map((module, index) => (
                    <div key={module.id} className="flex items-center gap-2 mb-2 p-3 bg-white/5 rounded-lg border border-white/10">
                      <div className="flex-1">
                        <p className="font-medium text-white">{module.title}</p>
                        <p className="text-sm text-gray-400">{module.duration}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeModule(module.id)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <FiXCircle />
                      </button>
                    </div>
                  ))}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={moduleInput.title}
                      onChange={(e) => setModuleInput(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Module title"
                      className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400"
                    />
                    <input
                      type="text"
                      value={moduleInput.duration}
                      onChange={(e) => setModuleInput(prev => ({ ...prev, duration: e.target.value }))}
                      placeholder="Duration"
                      className="w-24 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400"
                    />
                    <button
                      type="button"
                      onClick={addModule}
                      className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                    >
                      Add
                    </button>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Tags</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                    placeholder="Add tag..."
                    className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400"
                  />
                  <button
                    type="button"
                    onClick={addTag}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map(tag => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-sm border border-emerald-500/30"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="hover:text-emerald-300"
                      >
                        <FiX />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Images</label>
                <input
                  type="file"
                  multiple
                  accept={CONSTANTS.ALLOWED_FILE_TYPES.join(',')}
                  onChange={handleImageUpload}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-emerald-600 file:text-white hover:file:bg-emerald-700"
                />
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {formData.images.map(image => (
                    <div key={image.id} className="relative group">
                      <img
                        src={image.dataURL}
                        alt={image.name}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(image.id)}
                        className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <FiX />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">LaTeX Formulas</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={formulaInput}
                    onChange={(e) => setFormulaInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addFormula())}
                    placeholder="Enter LaTeX formula..."
                    className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400"
                  />
                  <button
                    type="button"
                    onClick={addFormula}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                  >
                    Add
                  </button>
                </div>
                <div className="space-y-2">
                  {formData.formulas.map(formula => (
                    <div key={formula.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10">
                      <div className="text-white" dangerouslySetInnerHTML={{ __html: katex.renderToString(formula.latex, { throwOnError: false }) }} />
                      <button
                        type="button"
                        onClick={() => removeFormula(formula.id)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <FiX />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 border border-white/10 rounded-lg hover:bg-white/5 text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
              >
                {entry ? 'Update' : 'Create'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}



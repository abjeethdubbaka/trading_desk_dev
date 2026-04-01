import React, { useState } from 'react';
import { FiCheckCircle, FiXCircle } from 'react-icons/fi';

export function RuleModal({ item, categories, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    type: item?.type || 'do',
    category: item?.category || 'risk-management',
    title: item?.title || '',
    description: item?.description || '',
    priority: item?.priority || 'medium',
    examples: item?.examples || [''],
    tags: item?.tags || []
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = {
      ...formData,
      title: formData.title.trim(),
      description: formData.description.trim(),
      examples: formData.examples.filter(ex => ex.trim() !== ''),
      icon: formData.type === 'do' ? FiCheckCircle : FiXCircle
    };
    
    if (item) {
      onSave({ ...item, ...data });
    } else {
      onSave(data);
    }
  };

  const addExample = () => {
    setFormData(prev => ({
      ...prev,
      examples: [...prev.examples, '']
    }));
  };

  const updateExample = (index, value) => {
    setFormData(prev => ({
      ...prev,
      examples: prev.examples.map((ex, i) => i === index ? value : ex)
    }));
  };

  const removeExample = (index) => {
    setFormData(prev => ({
      ...prev,
      examples: prev.examples.filter((_, i) => i !== index)
    }));
  };

  const addTag = (tag) => {
    const nextTag = tag.trim().toLowerCase();
    if (nextTag && !formData.tags.includes(nextTag)) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, nextTag]
      }));
    }
  };

  const removeTag = (tag) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }));
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
      <div className="glass-card rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-white mb-6">
            {item ? 'Edit Rule' : 'Add New Rule'}
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
                    <option value="do" className="bg-[#0a0a0f]">Do</option>
                    <option value="dont" className="bg-[#0a0a0f]">Don't</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Priority</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value }))}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white"
                  >
                    <option value="high" className="bg-[#0a0a0f]">High</option>
                    <option value="medium" className="bg-[#0a0a0f]">Medium</option>
                    <option value="low" className="bg-[#0a0a0f]">Low</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white"
                >
                  {categories.map(category => (
                    <option key={category.value} value={category.value} className="bg-[#0a0a0f]">
                      {category.label}
                    </option>
                  ))}
                </select>
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
                <label className="block text-sm font-medium text-gray-300 mb-1">Description</label>
                <textarea
                  required
                  rows={4}
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Examples</label>
                {formData.examples.map((example, index) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={example}
                      onChange={(e) => updateExample(index, e.target.value)}
                      placeholder="Enter an example..."
                      className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400"
                    />
                    {formData.examples.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeExample(index)}
                        className="px-3 py-2 text-red-400 border border-red-500/30 rounded-lg hover:bg-red-500/20"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addExample}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                >
                  Add Example
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Tags</label>
                <div className="flex flex-wrap gap-2 mb-2">
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
                        <FiXCircle className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
                <input
                  type="text"
                  placeholder="Add tags (press Enter)"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ',') {
                      e.preventDefault();
                      addTag(e.target.value);
                      e.target.value = '';
                    }
                  }}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400"
                />
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
                {item ? 'Update' : 'Create'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}



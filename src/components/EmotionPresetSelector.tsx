/**
 * Emotion Preset Selector Component
 * Allows users to select scenario-based emotion presets for audiobook narration
 */

import React, { useState, useEffect } from 'react';
import { emotionPresetsService, ScenarioPreset } from '@/services';
import { Search, ChevronDown, BookOpen, MessageSquare, Zap, Sun } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface EmotionPresetSelectorProps {
  selectedPresetId?: string;
  onPresetSelect: (preset: ScenarioPreset) => void;
  category?: ScenarioPreset['category'] | 'all';
  className?: string;
}

const CATEGORY_ICONS = {
  narration: <BookOpen className="w-4 h-4" />,
  dialogue: <MessageSquare className="w-4 h-4" />,
  action: <Zap className="w-4 h-4" />,
  atmosphere: <Sun className="w-4 h-4" />,
};

const CATEGORY_LABELS = {
  narration: '叙述',
  dialogue: '对话',
  action: '动作',
  atmosphere: '氛围',
};

export const EmotionPresetSelector: React.FC<EmotionPresetSelectorProps> = ({
  selectedPresetId,
  onPresetSelect,
  category = 'all',
  className = '',
}) => {
  const [presets, setPresets] = useState<ScenarioPreset[]>([]);
  const [filteredPresets, setFilteredPresets] = useState<ScenarioPreset[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<typeof category>(category);
  const [expandedPreset, setExpandedPreset] = useState<string | null>(null);

  useEffect(() => {
    loadPresets();
  }, []);

  useEffect(() => {
    filterPresets();
  }, [presets, searchQuery, selectedCategory]);

  const loadPresets = async () => {
    try {
      setLoading(true);
      const response = await emotionPresetsService.getAllPresets();
      if (response.data) {
        setPresets(response.data);
      }
    } catch (error) {
      console.error('Failed to load emotion presets:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterPresets = () => {
    let filtered = [...presets];

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter((p) => p.category === selectedCategory);
    }

    // Filter by search query
    if (searchQuery) {
      filtered = emotionPresetsService.searchPresets(searchQuery, filtered);
    }

    setFilteredPresets(filtered);
  };

  const handlePresetClick = (preset: ScenarioPreset) => {
    onPresetSelect(preset);
    setExpandedPreset(expandedPreset === preset.id ? null : preset.id);
  };

  if (loading) {
    return (
      <div className={`emotion-preset-selector ${className}`}>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      </div>
    );
  }

  return (
    <div className={`emotion-preset-selector ${className}`}>
      {/* Search Bar */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="搜索情感预设..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
            selectedCategory === 'all'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          全部
        </button>
        {(['narration', 'dialogue', 'action', 'atmosphere'] as const).map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              selectedCategory === cat
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {CATEGORY_ICONS[cat]}
            {CATEGORY_LABELS[cat]}
          </button>
        ))}
      </div>

      {/* Presets List */}
      <div className="space-y-2">
        <AnimatePresence mode="popLayout">
          {filteredPresets.map((preset) => {
            const isSelected = selectedPresetId === preset.id;
            const isExpanded = expandedPreset === preset.id;

            return (
              <motion.div
                key={preset.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <div
                  onClick={() => handlePresetClick(preset)}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50 shadow-sm'
                      : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                  }`}
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {CATEGORY_ICONS[preset.category]}
                        <span className="text-sm font-bold text-gray-900">{preset.name}</span>
                      </div>
                      <p className="text-xs text-gray-600">{preset.description}</p>
                    </div>
                    <motion.div
                      animate={{ rotate: isExpanded ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
                    </motion.div>
                  </div>

                  {/* Expanded Content */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="pt-3 mt-3 border-t border-gray-200">
                          {/* Example Text */}
                          <div className="mb-3">
                            <p className="text-xs font-medium text-gray-700 mb-1">示例文本</p>
                            <p className="text-sm text-gray-600 italic bg-gray-50 p-2 rounded">
                              "{preset.exampleText}"
                            </p>
                          </div>

                          {/* Usage Tags */}
                          <div className="mb-3">
                            <p className="text-xs font-medium text-gray-700 mb-1">适用场景</p>
                            <div className="flex flex-wrap gap-1">
                              {preset.usage.map((usage) => (
                                <span
                                  key={usage}
                                  className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full"
                                >
                                  {usage}
                                </span>
                              ))}
                            </div>
                          </div>

                          {/* Emotion Parameters */}
                          <div>
                            <p className="text-xs font-medium text-gray-700 mb-2">情感参数</p>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              {Object.entries(preset.emotion).map(([key, value]) =>
                                value !== null && value !== undefined ? (
                                  <div
                                    key={key}
                                    className="flex justify-between items-center bg-gray-50 p-2 rounded"
                                  >
                                    <span className="text-gray-600">{key}</span>
                                    <span className="font-mono font-medium text-gray-900">
                                      {value.toFixed(2)}
                                    </span>
                                  </div>
                                ) : null
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* No Results */}
      {filteredPresets.length === 0 && (
        <div className="text-center py-8">
          <p className="text-sm text-gray-500">没有找到匹配的情感预设</p>
        </div>
      )}
    </div>
  );
};

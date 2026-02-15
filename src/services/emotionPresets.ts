/**
 * Emotion Presets API Service
 * Provides scenario-based emotion presets for audiobook narration
 */

import { apiClient } from './api';

export interface EmotionParameters {
  happiness?: number;
  sadness?: number;
  anger?: number;
  fear?: number;
  surprise?: number;
  neutral?: number;
  energy?: number;
  tempo?: number;
  pitch?: number;
  volume?: number;
}

export interface ScenarioPreset {
  id: string;
  name: string;
  category: 'narration' | 'dialogue' | 'action' | 'atmosphere';
  description: string;
  emotion: EmotionParameters;
  exampleText: string;
  usage: string[];
}

class EmotionPresetsService {
  /**
   * Get all emotion presets
   */
  async getAllPresets() {
    return apiClient.get<ScenarioPreset[]>('/emotion-presets');
  }

  /**
   * Get presets by category
   */
  async getPresetsByCategory(category: ScenarioPreset['category']) {
    return apiClient.get<ScenarioPreset[]>(`/emotion-presets/category/${category}`);
  }

  /**
   * Get a specific preset by ID
   */
  async getPresetById(id: string) {
    return apiClient.get<ScenarioPreset>(`/emotion-presets/${id}`);
  }

  /**
   * Get recommended preset based on text analysis
   */
  async getRecommendedPreset(text: string) {
    return apiClient.get<ScenarioPreset>('/emotion-presets/recommend', { params: { text } });
  }

  /**
   * Helper: Search presets by keyword
   */
  searchPresets(query: string, presets: ScenarioPreset[]): ScenarioPreset[] {
    const lowerQuery = query.toLowerCase();
    return presets.filter(
      (preset) =>
        preset.name.toLowerCase().includes(lowerQuery) ||
        preset.description.toLowerCase().includes(lowerQuery) ||
        preset.usage.some((usage) => usage.toLowerCase().includes(lowerQuery))
    );
  }

  /**
   * Helper: Get preset IDs by category
   */
  getPresetIdsByCategory(category: ScenarioPreset['category'], presets: ScenarioPreset[]): string[] {
    return presets.filter((p) => p.category === category).map((p) => p.id);
  }

  /**
   * Helper: Format emotion parameters for API call
   */
  formatEmotionForAPI(emotion: EmotionParameters): Record<string, number> {
    const formatted: Record<string, number> = {};
    for (const [key, value] of Object.entries(emotion)) {
      if (value !== undefined) {
        formatted[key] = value;
      }
    }
    return formatted;
  }

  /**
   * Helper: Validate emotion parameters
   */
  validateEmotion(emotion: EmotionParameters): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    const validRanges = {
      happiness: [0, 1],
      sadness: [0, 1],
      anger: [0, 1],
      fear: [0, 1],
      surprise: [0, 1],
      neutral: [0, 1],
      energy: [0.5, 2],
      tempo: [0.5, 2],
      pitch: [-6, 6],
      volume: [0, 2],
    };

    for (const [key, value] of Object.entries(emotion)) {
      if (value !== undefined) {
        const range = validRanges[key as keyof typeof validRanges];
        if (range && (value < range[0] || value > range[1])) {
          errors.push(`${key} must be between ${range[0]} and ${range[1]}`);
        }
      }
    }

    return { valid: errors.length === 0, errors };
  }
}

export const emotionPresetsService = new EmotionPresetsService();

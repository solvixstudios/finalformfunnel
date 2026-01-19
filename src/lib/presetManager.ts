/**
 * Preset Manager - Save and load form/offer/shipping configurations locally
 */

export interface Preset {
  id: string;
  name: string;
  description: string;
  type: "form" | "offers" | "shipping";
  data: any;
  createdAt: number;
  updatedAt: number;
}

export interface PresetCategory {
  form: Preset[];
  offers: Preset[];
  shipping: Preset[];
}

const STORAGE_KEY = "solvix_fff_presets_v1";
const MAX_PRESETS_PER_TYPE = 20;

class PresetManager {
  private presets: PresetCategory;

  constructor() {
    this.presets = this.loadPresets();
  }

  /**
   * Load all presets from localStorage
   */
  private loadPresets(): PresetCategory {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        return {
          form: data.form || [],
          offers: data.offers || [],
          shipping: data.shipping || [],
        };
      }
    } catch (e) {
      console.error("[PresetManager] Error loading presets:", e);
    }

    return { form: [], offers: [], shipping: [] };
  }

  /**
   * Save presets to localStorage
   */
  private save(): boolean {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.presets));
      return true;
    } catch (e) {
      console.error("[PresetManager] Error saving presets:", e);
      return false;
    }
  }

  /**
   * Create a new preset
   */
  savePreset(
    type: "form" | "offers" | "shipping",
    name: string,
    data: any,
    description: string = ""
  ): Preset | null {
    if (!name || !name.trim()) {
      console.error("[PresetManager] Preset name is required");
      return null;
    }

    if (this.presets[type].length >= MAX_PRESETS_PER_TYPE) {
      console.error(
        `[PresetManager] Maximum ${MAX_PRESETS_PER_TYPE} ${type} presets allowed`
      );
      return null;
    }

    const preset: Preset = {
      id: `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: name.trim(),
      description: description.trim(),
      type,
      data: JSON.parse(JSON.stringify(data)), // Deep clone
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    this.presets[type].push(preset);
    this.save();

    return preset;
  }

  /**
   * Update an existing preset
   */
  updatePreset(presetId: string, updates: Partial<Preset>): Preset | null {
    const allPresets = [
      ...this.presets.form,
      ...this.presets.offers,
      ...this.presets.shipping,
    ];
    const preset = allPresets.find((p) => p.id === presetId);

    if (!preset) {
      console.error("[PresetManager] Preset not found:", presetId);
      return null;
    }

    if (updates.name) preset.name = updates.name.trim();
    if (updates.description) preset.description = updates.description.trim();
    if (updates.data) preset.data = JSON.parse(JSON.stringify(updates.data));

    preset.updatedAt = Date.now();

    this.save();
    return preset;
  }

  /**
   * Delete a preset
   */
  deletePreset(presetId: string): boolean {
    const type = presetId.split("_")[0] as "form" | "offers" | "shipping";
    const index = this.presets[type].findIndex((p) => p.id === presetId);

    if (index === -1) {
      console.error("[PresetManager] Preset not found:", presetId);
      return false;
    }

    this.presets[type].splice(index, 1);
    this.save();
    return true;
  }

  /**
   * Get a preset by ID
   */
  getPreset(presetId: string): Preset | null {
    const allPresets = [
      ...this.presets.form,
      ...this.presets.offers,
      ...this.presets.shipping,
    ];
    return allPresets.find((p) => p.id === presetId) || null;
  }

  /**
   * Get all presets of a specific type
   */
  getPresetsByType(type: "form" | "offers" | "shipping"): Preset[] {
    return this.presets[type].sort((a, b) => b.updatedAt - a.updatedAt);
  }

  /**
   * Get all presets
   */
  getAllPresets(): PresetCategory {
    return {
      form: this.getPresetsByType("form"),
      offers: this.getPresetsByType("offers"),
      shipping: this.getPresetsByType("shipping"),
    };
  }

  /**
   * Clear all presets
   */
  clearAll(): boolean {
    try {
      localStorage.removeItem(STORAGE_KEY);
      this.presets = { form: [], offers: [], shipping: [] };
      return true;
    } catch (e) {
      console.error("[PresetManager] Clear failed:", e);
      return false;
    }
  }

  /**
   * Get storage size info
   */
  getStorageInfo(): {
    formCount: number;
    offersCount: number;
    shippingCount: number;
    totalCount: number;
    sizeEstimate: string;
  } {
    const totalCount =
      this.presets.form.length +
      this.presets.offers.length +
      this.presets.shipping.length;
    const sizeEstimate = `${(JSON.stringify(this.presets).length / 1024).toFixed(
      2
    )} KB`;

    return {
      formCount: this.presets.form.length,
      offersCount: this.presets.offers.length,
      shippingCount: this.presets.shipping.length,
      totalCount,
      sizeEstimate,
    };
  }
}

// Export singleton instance
export const presetManager = new PresetManager();

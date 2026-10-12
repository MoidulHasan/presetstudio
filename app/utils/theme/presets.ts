import type { Preset } from '@primeuix/themes/types'
import type { BasePresetName } from './types'

type PresetModule = { default: Preset }

const loaders: Record<BasePresetName, () => Promise<PresetModule>> = {
  aura: () => import('@primeuix/themes/aura'),
  lara: () => import('@primeuix/themes/lara'),
  nora: () => import('@primeuix/themes/nora'),
  material: () => import('@primeuix/themes/material'),
}

/** Lazily loads a base preset so the preview only ships the presets it uses. */
export async function loadBasePreset(name: BasePresetName): Promise<Preset> {
  return (await loaders[name]()).default
}

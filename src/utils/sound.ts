/**
 * Sound utility for playing audio effects
 */

// Cache audio instances to avoid recreating them on each play
const audioCache: Record<string, HTMLAudioElement> = {};

// Sound effect file paths
const SOUND_EFFECTS = {
  SUCCESS: "/SoundEffects/soundeffect_success.mp3",
  ERROR: "/SoundEffects/soundeffect_error.mp3",
};

/**
 * Plays a sound effect
 * @param soundType - The type of sound to play (success or error)
 * @param enabled - Whether sound is enabled in the app settings
 */
export const playSound = (
  soundType: "success" | "error",
  enabled: boolean = true
): void => {
  // Only proceed with playing sound if enabled is not strictly false
  // This ensures any non-false value (including undefined or null) defaults to true
  // while explicit false values will disable sound
  if (enabled === false) {
    return;
  }

  try {
    const soundPath =
      soundType === "success" ? SOUND_EFFECTS.SUCCESS : SOUND_EFFECTS.ERROR;

    // Create or retrieve cached audio element
    if (!audioCache[soundPath]) {
      audioCache[soundPath] = new Audio(soundPath);
    }

    const audio = audioCache[soundPath];

    // Reset the audio to the beginning if it's already playing
    audio.currentTime = 0;

    // Play the sound
    audio.play().catch((err) => {
      console.warn(`Failed to play sound effect: ${err.message}`);
    });
  } catch (error) {
    console.warn("Error playing sound effect:", error);
  }
};

/**
 * Preloads sound effects for better performance
 */
export const preloadSoundEffects = (): void => {
  try {
    Object.values(SOUND_EFFECTS).forEach((path) => {
      if (!audioCache[path]) {
        audioCache[path] = new Audio(path);
      }
    });
  } catch (error) {
    console.warn("Error preloading sound effects:", error);
  }
};

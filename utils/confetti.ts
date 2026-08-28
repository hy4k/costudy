import confetti from 'canvas-confetti';

/**
 * Standard celebratory confetti burst for successful form submissions and actions.
 */
export const triggerConfetti = (options?: confetti.Options) => {
  try {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.65 },
      colors: ['#0f766e', '#10b981', '#38bdf8', '#fbbf24', '#f43f5e', '#a855f7'],
      zIndex: 99999,
      disableForReducedMotion: true,
      ...options,
    });
  } catch (e) {
    console.warn('Confetti animation failed:', e);
  }
};

/**
 * Cannon blast from both corners - ideal for goal achievements, rank promotions, and test completions!
 */
export const triggerGoalAchievementConfetti = () => {
  try {
    const count = 200;
    const defaults = {
      origin: { y: 0.7 },
      zIndex: 99999,
      disableForReducedMotion: true,
    };

    const fire = (particleRatio: number, opts: confetti.Options) => {
      confetti({
        ...defaults,
        ...opts,
        particleCount: Math.floor(count * particleRatio),
      });
    };

    fire(0.25, {
      spread: 26,
      startVelocity: 55,
      colors: ['#10b981', '#34d399', '#059669'],
    });

    fire(0.2, {
      spread: 60,
      colors: ['#f59e0b', '#fbbf24', '#d97706'],
    });

    fire(0.35, {
      spread: 100,
      decay: 0.91,
      scalar: 0.8,
      colors: ['#0284c7', '#38bdf8', '#0ea5e9'],
    });

    fire(0.1, {
      spread: 120,
      startVelocity: 25,
      decay: 0.92,
      scalar: 1.2,
      colors: ['#8b5cf6', '#ec4899', '#f43f5e'],
    });

    fire(0.1, {
      spread: 120,
      startVelocity: 45,
      colors: ['#10b981', '#fbbf24', '#38bdf8'],
    });
  } catch (e) {
    console.warn('Goal achievement confetti failed:', e);
  }
};

/**
 * Star & sparkle burst for badges, store redemption, and streak milestones!
 */
export const triggerStarConfetti = () => {
  try {
    const defaults = {
      spread: 360,
      ticks: 60,
      gravity: 0.4,
      decay: 0.94,
      startVelocity: 30,
      shapes: ['star'] as confetti.Shape[],
      colors: ['#FFE400', '#FFBD00', '#E89400', '#FFCA6C', '#FDFFB8'],
      zIndex: 99999,
      disableForReducedMotion: true,
    };

    confetti({
      ...defaults,
      particleCount: 40,
      scalar: 1.2,
    });

    confetti({
      ...defaults,
      particleCount: 25,
      scalar: 0.75,
    });
  } catch (e) {
    console.warn('Star confetti failed:', e);
  }
};

// Transition tokens for route-aware animations
export const transitionTokens = {
  forward: {
    duration: 300, // ms
    easing: 'ease-out',
    distance: 30, // px slide from right
  },
  backward: {
    duration: 300,
    easing: 'ease-out',
    distance: -30, // slide from left
  },
  peer: {
    duration: 200,
    easing: 'ease-in-out',
    // cross‑fade, no translation
    distance: 0,
  },
  reducedMotion: {
    duration: 0,
    easing: 'linear',
    distance: 0,
  },
};

export type TransitionKind = keyof typeof transitionTokens;

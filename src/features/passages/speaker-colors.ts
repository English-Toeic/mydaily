const PALETTE = [
  "text-sky-600 dark:text-sky-400",
  "text-violet-600 dark:text-violet-400",
  "text-emerald-600 dark:text-emerald-400",
  "text-orange-600 dark:text-orange-400",
  "text-pink-600 dark:text-pink-400",
];

export const speakerColor = (speakers: string[], name: string | null) =>
  name ? PALETTE[Math.max(0, speakers.indexOf(name)) % PALETTE.length] : "";
import { nanoid } from "nanoid";

export const TIMERS = [
  {
    start: Date.now(),
    description: "Timer 1",
    isActive: true,
    id: nanoid(),
  },
  {
    start: Date.now() - 5000,
    end: Date.now() - 3000,
    duration: 2000,
    description: "Timer 0",
    isActive: false,
    id: nanoid(),
  },
];

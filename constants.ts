
export const NOTES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

export const CONCERT_PITCH = 440; // A4

export const getNoteFromFrequency = (frequency: number) => {
  const n = 12 * Math.log2(frequency / CONCERT_PITCH) + 69;
  const roundedN = Math.round(n);
  const noteIndex = roundedN % 12;
  const octave = Math.floor(roundedN / 12) - 1;
  
  // Calculate standard frequency for this note
  const standardFreq = CONCERT_PITCH * Math.pow(2, (roundedN - 69) / 12);
  
  // Calculate cents difference
  // cents = 1200 * log2(f_measured / f_target)
  const cents = 1200 * Math.log2(frequency / standardFreq);

  return {
    note: NOTES[noteIndex],
    octave,
    cents,
    frequency,
    standardFreq
  };
};

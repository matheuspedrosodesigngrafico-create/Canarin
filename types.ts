
export interface NoteData {
  name: string;
  frequency: number;
  octave: number;
}

export interface TuningResult {
  note: string;
  octave: number;
  cents: number;
  frequency: number;
  diff: number;
}

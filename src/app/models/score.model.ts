/**
 * Score Model - Represents a single golf round score
 */
export interface Score {
  id: string;                    // Unique identifier (UUID)
  courseName: string;            // Golf course name (user-entered)
  teeColor: string;              // Tee color (White, Blue, Black, Red, Gold, etc.)
  scoreValue: number;            // Total strokes
  holeCount: number;             // 9 or 18 holes
  courseRating: number;          // Course rating (user-entered or default 72.0)
  slopeRating: number;           // Slope rating (user-entered or default 113)
  handicapDifferential: number;  // Calculated via USGA formula
  date: Date;                    // When the round was played
  createdAt: Date;               // When the score was entered
  notes?: string;                // Optional user notes
}

/**
 * App State Model - Manages all stored scores and handicap index
 */
export interface AppState {
  scores: Score[];               // Array of all score records
  handicapIndex: number;         // Calculated from last 8 of 20 scores
  lastUpdated: Date;             // When handicap was last recalculated
}

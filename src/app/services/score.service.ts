import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Score, AppState } from '../models/score.model';

@Injectable({
  providedIn: 'root'
})
export class ScoreService {
  private readonly STORAGE_KEY = 'handicapper_scores';
  private appState: AppState = {
    scores: [],
    handicapIndex: 0,
    lastUpdated: new Date()
  };

  private appStateSubject = new BehaviorSubject<AppState>(this.appState);
  public appState$: Observable<AppState> = this.appStateSubject.asObservable();

  constructor() {
    this.loadFromStorage();
  }

  private canUseStorage(): boolean {
    return typeof localStorage !== 'undefined';
  }

  /**
   * Load scores from localStorage on app init
   */
  private loadFromStorage(): void {
    if (!this.canUseStorage()) {
      return;
    }

    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        this.appState.scores = parsed.scores.map((s: any) => ({
          ...s,
          date: new Date(s.date),
          createdAt: new Date(s.createdAt)
        }));
        this.recalculateHandicapIndex();
      }
    } catch (error) {
      console.error('Error loading scores from storage:', error);
      this.appState.scores = [];
    }
  }

  /**
   * Save scores to localStorage
   */
  private saveToStorage(): void {
    if (!this.canUseStorage()) {
      return;
    }

    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.appState));
    } catch (error) {
      console.error('Error saving scores to storage:', error);
    }
  }

  /**
   * Add a new score and recalculate handicap index
   */
  addScore(score: Omit<Score, 'id' | 'handicapDifferential' | 'createdAt'>): Score {
    const handicapDifferential = this.calculateDifferential(
      score.scoreValue,
      score.courseRating,
      score.slopeRating
    );

    const newScore: Score = {
      ...score,
      id: this.generateId(),
      handicapDifferential,
      createdAt: new Date()
    };

    this.appState.scores.push(newScore);
    this.recalculateHandicapIndex();
    this.saveToStorage();
    this.appStateSubject.next(this.appState);

    return newScore;
  }

  /**
   * Update an existing score
   */
  updateScore(id: string, updates: Partial<Omit<Score, 'id' | 'createdAt'>>): Score | null {
    const index = this.appState.scores.findIndex(s => s.id === id);
    if (index === -1) return null;

    const existingScore = this.appState.scores[index];
    const handicapDifferential = updates.scoreValue !== undefined || updates.courseRating !== undefined || updates.slopeRating !== undefined
      ? this.calculateDifferential(
          updates.scoreValue ?? existingScore.scoreValue,
          updates.courseRating ?? existingScore.courseRating,
          updates.slopeRating ?? existingScore.slopeRating
        )
      : existingScore.handicapDifferential;

    const updatedScore: Score = {
      ...existingScore,
      ...updates,
      handicapDifferential,
      id
    };

    this.appState.scores[index] = updatedScore;
    this.recalculateHandicapIndex();
    this.saveToStorage();
    this.appStateSubject.next(this.appState);

    return updatedScore;
  }

  /**
   * Delete a score by ID
   */
  deleteScore(id: string): boolean {
    const index = this.appState.scores.findIndex(s => s.id === id);
    if (index === -1) return false;

    this.appState.scores.splice(index, 1);
    this.recalculateHandicapIndex();
    this.saveToStorage();
    this.appStateSubject.next(this.appState);

    return true;
  }

  /**
   * Get all scores
   */
  getScores(): Score[] {
    return [...this.appState.scores].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  /**
   * Get a score by ID
   */
  getScore(id: string): Score | undefined {
    return this.appState.scores.find(s => s.id === id);
  }

  /**
   * Get current handicap index
   */
  getHandicapIndex(): number {
    return this.appState.handicapIndex;
  }

  /**
   * Calculate USGA handicap differential
   * Formula: (Score - Course Rating) × 113 / Slope Rating
   */
  private calculateDifferential(score: number, courseRating: number, slopeRating: number): number {
    const differential = ((score - courseRating) * 113) / slopeRating;
    return Math.round(differential * 10) / 10; // Round to 1 decimal place
  }

  /**
   * Recalculate handicap index from scores
   * USGA Standard: Average of lowest 8 differentials from last 20 scores
   */
  private recalculateHandicapIndex(): void {
    if (this.appState.scores.length === 0) {
      this.appState.handicapIndex = 0;
      return;
    }

    // Sort by date (newest first) and take last 20
    const recentScores = this.appState.scores
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 20);

    if (recentScores.length === 0) {
      this.appState.handicapIndex = 0;
      return;
    }

    // Get number of scores to average: min(8, number of scores)
    const scoresToAverage = Math.min(8, recentScores.length);

    // Sort by differential (lowest first) and take the best (lowest) scores
    const lowestDifferentials = recentScores
      .map(s => s.handicapDifferential)
      .sort((a, b) => a - b)
      .slice(0, scoresToAverage);

    // Calculate average
    const average = lowestDifferentials.reduce((a, b) => a + b, 0) / scoresToAverage;

    // Round to 1 decimal place
    this.appState.handicapIndex = Math.round(average * 10) / 10;
    this.appState.lastUpdated = new Date();
  }

  /**
   * Generate a unique ID
   */
  private generateId(): string {
    return `score_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Clear all scores (for testing)
   */
  clearAll(): void {
    this.appState.scores = [];
    this.appState.handicapIndex = 0;
    if (this.canUseStorage()) {
      localStorage.removeItem(this.STORAGE_KEY);
    }
    this.appStateSubject.next(this.appState);
  }
}

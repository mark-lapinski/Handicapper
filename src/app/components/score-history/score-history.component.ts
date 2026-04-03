import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ScoreService } from '../../services/score.service';
import { Score, AppState } from '../../models/score.model';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-score-history',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './score-history.component.html',
  styleUrls: ['./score-history.component.css']
})
export class ScoreHistoryComponent implements OnInit {
  appState$: Observable<AppState>;
  scores: Score[] = [];
  sortBy: 'date' | 'score' | 'differential' = 'date';
  filterTeeColor: string = 'All';
  uniqueTeeColors: Set<string> = new Set();

  constructor(private scoreService: ScoreService) {
    this.appState$ = this.scoreService.appState$;
  }

  ngOnInit(): void {
    this.appState$.subscribe(state => {
      this.scores = this.scoreService.getScores();
      this.extractUniqueTeeColors();
      this.applySorting();
    });
  }

  extractUniqueTeeColors(): void {
    this.uniqueTeeColors.clear();
    this.scores.forEach(score => {
      this.uniqueTeeColors.add(score.teeColor || 'Unknown');
    });
  }

  applySorting(): void {
    let sorted = [...this.scores];

    // Apply filter
    if (this.filterTeeColor !== 'All') {
      sorted = sorted.filter(s => s.teeColor === this.filterTeeColor);
    }

    // Apply sorting
    switch (this.sortBy) {
      case 'date':
        sorted.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        break;
      case 'score':
        sorted.sort((a, b) => a.scoreValue - b.scoreValue);
        break;
      case 'differential':
        sorted.sort((a, b) => a.handicapDifferential - b.handicapDifferential);
        break;
    }

    this.scores = sorted;
  }

  onSortChange(sortBy: 'date' | 'score' | 'differential'): void {
    this.sortBy = sortBy;
    this.applySorting();
  }

  onFilterChange(teeColor: string): void {
    this.filterTeeColor = teeColor;
    this.applySorting();
  }

  onDelete(id: string, event: Event): void {
    event.preventDefault();
    if (confirm('Are you sure you want to delete this score?')) {
      this.scoreService.deleteScore(id);
    }
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }

  getTeeColorClass(color: string): string {
    return `tee-${color.toLowerCase()}`;
  }
}

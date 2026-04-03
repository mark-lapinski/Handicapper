import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ScoreService } from '../../services/score.service';
import { AppState, Score } from '../../models/score.model';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  appState$: Observable<AppState>;
  recentScores: Score[] = [];
  handicapIndex: number = 0;
  hasScores: boolean = false;

  constructor(private scoreService: ScoreService) {
    this.appState$ = this.scoreService.appState$;
  }

  ngOnInit(): void {
    this.appState$.subscribe(state => {
      this.handicapIndex = state.handicapIndex;
      this.recentScores = this.scoreService.getScores().slice(0, 5);
      this.hasScores = state.scores.length > 0;
    });
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }

  formatScore(score: Score): string {
    return `${score.scoreValue || 'N/A'} (${score.teeColor || 'White'})`;
  }
}

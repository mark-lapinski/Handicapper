import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { ScoreService } from '../../services/score.service';
import { Score } from '../../models/score.model';

@Component({
  selector: 'app-score-edit',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule],
  templateUrl: './score-edit.component.html',
  styleUrls: ['./score-edit.component.css']
})
export class ScoreEditComponent implements OnInit {
  form: FormGroup;
  isSubmitting = false;
  errorMessage: string | null = null;
  scoreId: string | null = null;
  score: Score | null = null;
  isLoading = true;

  constructor(
    private fb: FormBuilder,
    private scoreService: ScoreService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.form = this.fb.group({
      courseName: ['', [Validators.required, Validators.minLength(2)]],
      teeColor: ['White', Validators.required],
      scoreValue: ['', [Validators.required, Validators.min(18), Validators.max(200)]],
      holeCount: [18, Validators.required],
      courseRating: ['', [Validators.required, Validators.min(40), Validators.max(90)]],
      slopeRating: ['', [Validators.required, Validators.min(55), Validators.max(155)]],
      date: ['', Validators.required],
      notes: ['']
    });
  }

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      this.scoreId = params.get('id');
      if (this.scoreId) {
        const score = this.scoreService.getScore(this.scoreId);
        if (score) {
          this.score = score;
          this.populateForm(score);
          this.isLoading = false;
        } else {
          this.errorMessage = 'Score not found';
          this.isLoading = false;
        }
      }
    });
  }

  private populateForm(score: Score): void {
    const dateString = new Date(score.date).toISOString().split('T')[0];
    this.form.patchValue({
      courseName: score.courseName,
      teeColor: score.teeColor,
      scoreValue: score.scoreValue,
      holeCount: score.holeCount,
      courseRating: score.courseRating,
      slopeRating: score.slopeRating,
      date: dateString,
      notes: score.notes || ''
    });
  }

  get courseName() {
    return this.form.get('courseName');
  }

  get scoreValue() {
    return this.form.get('scoreValue');
  }

  get courseRating() {
    return this.form.get('courseRating');
  }

  get slopeRating() {
    return this.form.get('slopeRating');
  }

  get date() {
    return this.form.get('date');
  }

  onSubmit(): void {
    if (this.form.invalid || !this.scoreId) {
      this.errorMessage = 'Please fill in all required fields correctly';
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = null;

    try {
      const formValue = this.form.value;
      this.scoreService.updateScore(this.scoreId, {
        courseName: formValue.courseName,
        teeColor: formValue.teeColor,
        scoreValue: parseInt(formValue.scoreValue),
        holeCount: parseInt(formValue.holeCount),
        courseRating: parseFloat(formValue.courseRating),
        slopeRating: parseFloat(formValue.slopeRating),
        date: new Date(formValue.date),
        notes: formValue.notes || undefined
      });

      this.router.navigate(['/history']);
    } catch (error) {
      this.errorMessage = 'Error updating score. Please try again.';
      console.error('Error updating score:', error);
    } finally {
      this.isSubmitting = false;
    }
  }

  onCancel(): void {
    this.router.navigate(['/history']);
  }
}

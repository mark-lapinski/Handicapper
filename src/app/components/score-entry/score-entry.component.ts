import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ScoreService } from '../../services/score.service';
import { UsgaLookupService } from '../../services/usga-lookup.service';

@Component({
  selector: 'app-score-entry',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule],
  templateUrl: './score-entry.component.html',
  styleUrls: ['./score-entry.component.css']
})
export class ScoreEntryComponent {
  form: FormGroup;
  isSubmitting = false;
  errorMessage: string | null = null;
  isLookupLoading = false;
  lookupErrorMessage: string | null = null;
  lookupStatusMessage: string | null = null;

  constructor(
    private fb: FormBuilder,
    private scoreService: ScoreService,
    private usgaLookupService: UsgaLookupService,
    private router: Router
  ) {
    this.form = this.fb.group({
      country: ['United States', [Validators.required, Validators.minLength(2)]],
      courseName: ['', [Validators.required, Validators.minLength(2)]],
      city: [''],
      state: [''],
      teeColor: ['White', Validators.required],
      gender: ['Men', Validators.required],
      scoreValue: ['', [Validators.required, Validators.min(18), Validators.max(200)]],
      holeCount: [18, Validators.required],
      courseRating: ['', [Validators.required, Validators.min(40), Validators.max(90)]],
      slopeRating: ['', [Validators.required, Validators.min(55), Validators.max(155)]],
      date: ['', Validators.required],
      notes: ['']
    });
  }

  runLookup(): void {
    const raw = this.form.getRawValue();
    const courseName = String(raw.courseName ?? '').trim();

    if (!courseName) {
      this.form.get('courseName')?.markAsTouched();
      this.lookupErrorMessage = 'Course name is required before lookup.';
      return;
    }

    this.isLookupLoading = true;
    this.lookupErrorMessage = null;
    this.lookupStatusMessage = null;

    this.usgaLookupService.lookup({
      country: String(raw.country ?? '').trim() || 'United States',
      courseName,
      city: String(raw.city ?? '').trim() || undefined,
      state: String(raw.state ?? '').trim() || undefined,
      teeColor: String(raw.teeColor ?? 'White'),
      holeCount: Number(raw.holeCount ?? 18),
      gender: String(raw.gender ?? 'Men')
    }).subscribe({
      next: (response) => {
        if (response.kind === 'ratings' && response.matches.length > 0) {
          const match = response.matches[0];
          this.form.patchValue({
            teeColor: match.tee || raw.teeColor,
            courseRating: match.courseRating,
            slopeRating: match.slopeRating
          });
          this.lookupStatusMessage = 'Lookup complete. Course rating and slope were filled in.';
          return;
        }

        this.lookupErrorMessage = response.question ?? 'Lookup needs more information to continue.';
      },
      error: () => {
        this.lookupErrorMessage = 'Unable to run lookup right now. Please try again.';
      }
    }).add(() => {
      this.isLookupLoading = false;
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
    if (this.form.invalid) {
      this.errorMessage = 'Please fill in all required fields correctly';
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = null;

    try {
      const formValue = this.form.value;
      const courseName = this.buildCourseDisplayName(formValue.courseName, formValue.city, formValue.state);
      this.scoreService.addScore({
        courseName,
        teeColor: formValue.teeColor,
        scoreValue: parseInt(formValue.scoreValue),
        holeCount: parseInt(formValue.holeCount),
        courseRating: parseFloat(formValue.courseRating),
        slopeRating: parseFloat(formValue.slopeRating),
        date: new Date(formValue.date),
        notes: formValue.notes || undefined
      });

      this.router.navigate(['/']);
    } catch (error) {
      this.errorMessage = 'Error saving score. Please try again.';
      console.error('Error adding score:', error);
    } finally {
      this.isSubmitting = false;
    }
  }

  onCancel(): void {
    this.router.navigate(['/']);
  }

  private buildCourseDisplayName(courseName: string, city: string, state: string): string {
    const trimmedName = courseName.trim();
    const trimmedCity = (city ?? '').trim();
    const trimmedState = (state ?? '').trim();
    const location = [trimmedCity, trimmedState].filter((value) => value.length > 0).join(', ');

    if (!location) {
      return trimmedName;
    }

    return `${trimmedName} - ${location}`;
  }
}

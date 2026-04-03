import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { UsgaLookupResponse, UsgaLookupService } from '../../services/usga-lookup.service';

@Component({
  selector: 'app-course-lookup',
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './course-lookup.component.html',
  styleUrl: './course-lookup.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CourseLookupComponent {
  protected readonly isLoading = signal(false);
  protected readonly isSubmittingAnswer = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly result = signal<UsgaLookupResponse | null>(null);
  protected readonly question = signal<string | null>(null);
  protected readonly responseId = signal<string | null>(null);

  protected readonly form;

  constructor(
    private readonly fb: FormBuilder,
    private readonly usgaLookupService: UsgaLookupService
  ) {
    this.form = this.fb.group({
      country: ['United States', [Validators.required, Validators.minLength(2)]],
      courseName: ['', [Validators.required, Validators.minLength(2)]],
      city: [''],
      state: [''],
      teeColor: ['White', Validators.required],
      holeCount: [18, Validators.required],
      gender: ['Men', Validators.required],
      followupAnswer: ['']
    });
  }

  protected runLookup(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();

    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.result.set(null);
    this.question.set(null);
    this.responseId.set(null);
    this.form.patchValue({ followupAnswer: '' });

    this.usgaLookupService.lookup({
      country: (value.country ?? '').trim(),
      courseName: (value.courseName ?? '').trim(),
      city: (value.city ?? '').trim() || undefined,
      state: (value.state ?? '').trim() || undefined,
      teeColor: value.teeColor ?? 'White',
      holeCount: Number(value.holeCount ?? 18),
      gender: value.gender ?? 'Men'
    }).subscribe({
      next: (response) => {
        this.applyResponse(response);
      },
      error: () => {
        this.errorMessage.set('Unable to query OpenAI lookup. Please try again.');
      },
      complete: () => {
        this.isLoading.set(false);
      }
    });
  }

  protected submitFollowupAnswer(): void {
    const answer = (this.form.get('followupAnswer')?.value as string | null)?.trim() ?? '';
    const responseId = this.responseId();

    if (!answer || !responseId) {
      this.errorMessage.set('Please enter an answer and try again.');
      return;
    }

    this.isSubmittingAnswer.set(true);
    this.errorMessage.set(null);
    const selectedTee = (this.form.get('teeColor')?.value as string | null) ?? 'White';

    this.usgaLookupService.respond(responseId, answer, selectedTee).subscribe({
      next: (response) => {
        this.applyResponse(response);
      },
      error: () => {
        this.errorMessage.set('Unable to submit follow-up answer. Please try again.');
      },
      complete: () => {
        this.isSubmittingAnswer.set(false);
      }
    });
  }

  private applyResponse(response: UsgaLookupResponse): void {
    if (response.kind === 'ratings') {
      this.result.set(response);
      this.question.set(null);
      this.responseId.set(null);
      return;
    }

    this.result.set(null);
    this.question.set(response.question);
    this.responseId.set(response.responseId);
  }
}

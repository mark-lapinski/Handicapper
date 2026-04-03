import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface UsgaLookupQuery {
  country: string;
  courseName: string;
  city?: string;
  state?: string;
  teeColor: string;
  holeCount: number;
  gender: string;
}

interface OpenAIResponsesRequest {
  model: string;
  input: string;
  previous_response_id?: string;
}

interface OpenAIResponsesResponse {
  id?: string;
  output_text?: string;
  output?: Array<{
    id?: string;
    type?: string;
    content?: Array<{
      type?: string;
      text?: string;
    }>;
  }>;
}

export interface UsgaLookupMatch {
  tee: string;
  courseRating: number;
  slopeRating: number;
}

export interface UsgaLookupResponse {
  kind: 'ratings' | 'question';
  matches: UsgaLookupMatch[];
  question: string | null;
  responseId: string | null;
  responseText: string;
}

@Injectable({
  providedIn: 'root'
})
export class UsgaLookupService {
  private readonly http = inject(HttpClient);
  private readonly endpoint = 'https://api.openai.com/v1/responses';
  private readonly apiKey = '';

  lookup(query: UsgaLookupQuery): Observable<UsgaLookupResponse> {
    const input = [
      `course name: ${query.courseName}, City: ${query.city ?? ''}, State: ${query.state ?? ''}`,
      `Country: ${query.country}`,
      `Selected tee: ${query.teeColor}`,
      `Holes: ${query.holeCount}`,
      `Gender: ${query.gender}`,
      'When known, return JSON only in this shape:',
      '{"courseName":"...","tees":[{"tee":"White","courseRating":69.4,"slopeRating":124}]}.',
      'If only one tee is known, still return it in tees[].',
      'If unavailable, ask one concise follow-up question.'
    ].join(' ');

    return this.executeLookup(input, undefined, query.teeColor);
  }

  respond(responseId: string, answer: string, selectedTee: string): Observable<UsgaLookupResponse> {
    return this.executeLookup(answer, responseId, selectedTee);
  }

  private executeLookup(input: string, previousResponseId?: string, selectedTee?: string): Observable<UsgaLookupResponse> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${this.apiKey}`
    });

    const body: OpenAIResponsesRequest = {
      model: 'gpt-5',
      input,
      previous_response_id: previousResponseId
    };

    return this.http.post<OpenAIResponsesResponse>(this.endpoint, body, { headers }).pipe(
      map((response) => {
        const responseText = this.extractResponseText(response);
        const parsed = this.parseRatings(responseText, selectedTee);

        if (parsed) {
          return {
            kind: 'ratings',
            matches: [{
              tee: parsed.tee,
              courseRating: parsed.courseRating,
              slopeRating: parsed.slopeRating
            }],
            question: null,
            responseId: null,
            responseText
          };
        }

        return {
          kind: 'question',
          matches: [],
          question: responseText,
          responseId: this.extractResponseId(response),
          responseText
        };
      })
    );
  }

  private extractResponseText(response: OpenAIResponsesResponse): string {
    if (response.output_text && response.output_text.trim()) {
      return response.output_text.trim();
    }

    const text = response.output
      ?.flatMap((item) => item.content ?? [])
      .map((item) => item.text ?? '')
      .find((value) => value.trim().length > 0);

    return (text ?? '').trim();
  }

  private extractResponseId(response: OpenAIResponsesResponse): string | null {
    if (response.id && response.id.trim()) {
      return response.id;
    }

    const id = response.output?.map((item) => item.id ?? '').find((value) => value.trim().length > 0);
    return id || null;
  }

  private parseRatings(responseText: string, selectedTee?: string): { courseRating: number; slopeRating: number; tee: string } | null {
    const fromJson = this.parseRatingsFromJson(responseText, selectedTee);
    if (fromJson) {
      return fromJson;
    }

    const courseRatingSlopeMatch = responseText.match(/Course\s*rating:\s*([0-9]+(?:\.[0-9]+)?)\s*(?:[\r\n,;|]|\s-\s|\s+)+\s*Slope:\s*([0-9]+(?:\.[0-9]+)?)/i);
    if (courseRatingSlopeMatch) {
      return {
        courseRating: Number(courseRatingSlopeMatch[1]),
        slopeRating: Number(courseRatingSlopeMatch[2]),
        tee: selectedTee ?? 'Requested Tee'
      };
    }

    return null;
  }

  private parseRatingsFromJson(responseText: string, selectedTee?: string): { courseRating: number; slopeRating: number; tee: string } | null {
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return null;
    }

    try {
      const parsed = JSON.parse(jsonMatch[0]) as Record<string, unknown>;

      const directCourseRating = Number(parsed['courseRating']);
      const directSlopeRating = Number(parsed['slopeRating']);
      if (Number.isFinite(directCourseRating) && Number.isFinite(directSlopeRating)) {
        return {
          courseRating: directCourseRating,
          slopeRating: directSlopeRating,
          tee: selectedTee ?? 'Requested Tee'
        };
      }

      const tees = Array.isArray(parsed['tees']) ? parsed['tees'] as Array<Record<string, unknown>> : [];
      if (tees.length === 0) {
        return null;
      }

      const normalizedSelectedTee = (selectedTee ?? '').trim().toLowerCase();
      const selectedMatch = tees.find((item) => {
        const tee = String(item['tee'] ?? '').trim().toLowerCase();
        return normalizedSelectedTee.length > 0 && tee === normalizedSelectedTee;
      });

      const candidate = selectedMatch ?? tees[0];
      const candidateTee = String(candidate['tee'] ?? selectedTee ?? 'Requested Tee');
      const candidateCourseRating = Number(candidate['courseRating']);
      const candidateSlopeRating = Number(candidate['slopeRating']);

      if (!Number.isFinite(candidateCourseRating) || !Number.isFinite(candidateSlopeRating)) {
        return null;
      }

      return {
        tee: candidateTee,
        courseRating: candidateCourseRating,
        slopeRating: candidateSlopeRating
      };
    } catch {
      return null;
    }
  }
}

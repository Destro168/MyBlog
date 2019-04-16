import {
  Injectable
} from '@angular/core';
import {
  HttpClient,
  HttpErrorResponse
} from '@angular/common/http';

import {
  catchError
} from 'rxjs/operators';
import {
  throwError
} from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class HttpService {
  configUrl = 'http://localhost:3000/api/posts/technical';

  constructor(private http: HttpClient) {}

  getPostsAll() {
    return this.http.get(this.configUrl);
  }

  getPostsLast30Days(dataObj) {
    const finalUrl = this.configUrl + '?date_start=' + dataObj.date_start + '&date_end=' + dataObj.date_end;
    return this.http.get(finalUrl);
  }

  private handleError(error: HttpErrorResponse) {
    if (error.error instanceof ErrorEvent) {
      // A client-side or network error occurred. Handle it accordingly.
      console.error('An error occurred:', error.error.message);
    } else {
      // The backend returned an unsuccessful response code.
      // The response body may contain clues as to what went wrong,
      console.error(
        `Backend returned code ${error.status}, ` +
        `body was: ${error.error}`);
    }
    // return an observable with a user-facing error message
    return throwError(
      'Something bad happened; please try again later.');
  }

  doPost(content) {
    return this.http.post<any>(this.configUrl, content);
  }
}

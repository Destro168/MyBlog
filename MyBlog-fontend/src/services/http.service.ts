import {
  Injectable
} from '@angular/core';
import {
  HttpClient,
  HttpErrorResponse,
  HttpHeaders
} from '@angular/common/http';

import {
  throwError
} from 'rxjs';

import {
  catchError
} from 'rxjs/operators';

/**
 * This function returns the backend url based on the app's load location (local or glitch).
 */
const G_GET_BACKEND_PREFIX = () => {
  const matchLength = window.location.href.match('localhost');
  let length: number;

  (matchLength) ? (length = matchLength.length) : length = 0;

  return (length > 0) ? 'http://localhost:3000' : 'https://technoob.glitch.me';
};

@Injectable({
  providedIn: 'root',
})
export class HttpService {
  backendPrefix = G_GET_BACKEND_PREFIX();
  configUrl = this.backendPrefix + '/api/posts';
  registerUrl = this.backendPrefix + '/register';
  loginUrl = this.backendPrefix + '/login';
  logoutUrl = this.backendPrefix + '/logout';
  authCheckUrl = this.backendPrefix + '/authCheck';

  G_OPTIONS = {
    withCredentials: true
  };

  constructor(private http: HttpClient) {}

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

  getPosts(date_start, date_end) {
    const finalUrl = this.configUrl + '?date_start=' + date_start + '&date_end=' + date_end;
    return this.http.get(finalUrl, this.G_OPTIONS);
  }

  /**
   * Performs post operation using content object.
   * @param content Object containing a post to save.
   */
  doPost(content) {
    return this.http.post < any > (this.configUrl, content, this.G_OPTIONS);
  }

  doRegister(registrationCredentials) {
    return this.http.post < any > (this.registerUrl, registrationCredentials, this.G_OPTIONS);
  }

  doLogin(loginCredentials) {
    return this.http.post < any > (this.loginUrl, loginCredentials, this.G_OPTIONS)
      .pipe(
        catchError(this.handleError)
      );
  }

  doLogout() {
    return this.http.get < any > (this.logoutUrl, this.G_OPTIONS)
      .pipe(
        catchError(this.handleError)
      );
  }

  doAuthCheck() {
    return this.http.get < any > (this.authCheckUrl, this.G_OPTIONS)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Performs put operation using content object.
   * @param postDataObject Object with keys id (a mongoDB id reference) and postDataObject (content to set key id to)
   */
  doPut(id, postObject) {
    return this.http.put(this.configUrl + '/' + id, postObject, this.G_OPTIONS);
  }

  /**
   * Performs delete operation using content object.
   * @param content An object containing an id.
   */
  doDelete(id) {
    return this.http.delete(this.configUrl + '/' + id, this.G_OPTIONS);
  }
}

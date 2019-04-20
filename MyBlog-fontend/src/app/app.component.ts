import {
  HttpService
} from './../services/http.service';
import {
  Component,
  OnInit
} from '@angular/core';

// Global variable containing all months.
const G_MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  // The text stored in #textareaNewPost
  public formContent = '';

  // Array of post data. Must remain synchronized with postDataObject. postDataObject depends on this variable.
  public postDataArray = [];

  // Post data object. Must remain synchronized with postDataObject. Is dependent on postDataArray.
  public postDataObject = {};
  public allYears = [];

  // A variable storing the current visibility of any given tab on the view for this component.
  public tabVisibility = {
    1: true,
    2: false
  };

  // Constructor -> Activates service httpService.
  constructor(private httpService: HttpService) {}

  /**
   * Lifecycle method that retrieves all post content after DOM is rendered and displays it using methods
   * defined in this component class.
   */
  ngOnInit() {
    this.doGetPostDataAll();
  }

  /**********************************************************
   * Helper functions.
   **********************************************************/

  /**
   * A function that returns formatted time.
   * @param date A date object.
   * @returns Returns a date object formatted as hours and minutes wtih padded 0 if necessary.
   */
  public getFormattedTime(date): string {

    // Sub-helper function to return a formatted unit of time.
    const getFormattedTimeUnit = (timeUnit) => {
      let x = timeUnit.toString();

      if (x.length === 1) {
        x = '0'.concat(x);
      }

      return x;
    };

    // Return a string formed of formatted units of time.
    return getFormattedTimeUnit(date.getHours()) + ':' +
      getFormattedTimeUnit(date.getMinutes()) + ':' +
      getFormattedTimeUnit(date.getSeconds());
  }

  /**
   * Returns the keys of an object. Primarily used on HTML page because Angular throughs error
   *  when Object.keys() is called directly in view layer.
   * @param obj Any object.
   */
  public getKeys = (obj) => (obj) ? Object.keys(obj) : [];

  /**
   * Same as getKeys, but returns keys reversed.
   * @param obj Any object.
   */
  public getReversedKeys = (obj) => (obj) ? Object.keys(obj).reverse() : [];

  public getFormattedTimeAndContent = (dayData) => '[' + this.getFormattedTime(dayData['date']) + ']: ' + dayData['content'];

  /**********************************************************
   * Functions that manage post data,the content used
   *  in the app component view.
   **********************************************************/

  /**
   * This function updates the postDataArray variable with the data in arg x.
   * @param x An array of data retrieved from the backend that is converted into a usable array of data.
   * Note: x is Usually acquired from a 'get' call in the restful function section.
   */
  private updatePostData(x) {
    const tempPostDataArray = [];

    for (let i = 0; i < x.length; i++) {
      const date = new Date(x[i].date);

      tempPostDataArray.push({
        _id: x[i]['_id'],
        date: date,
        time: this.getFormattedTime(date),
        content: x[i]['content'],
        displayMode: 'view'
      });
    }

    this.postDataArray = tempPostDataArray;
    this.syncPostDataObject();
  }

  /**
   * Function that sets postDataObject to values in postDataArray.
   * Unless a custom operation modifiers postDataArray directly,
   * this must be called after postDataArray is modified to keep the
   * two variables synchronized.
   */
  private syncPostDataObject() {
    const x = {};
    const y = this.postDataArray;
    let year, month, day;

    for (let i = 0; i < y.length; i++) {
      year = y[i].date.getFullYear();
      month = G_MONTHS[y[i].date.getMonth()];
      day = y[i].date.getDate();

      if (!x[year]) {
        x[year] = {};
      }

      if (!x[year][month]) {
        x[year][month] = {};
      }

      if (!x[year][month][day]) {
        x[year][month][day] = [];
      }

      x[year][month][day].push({
        _id: y[i]['_id'],
        time: y[i]['time'],
        content: y[i]['content'],
        displayMode: y[i]['displayMode']
      });
    }

    this.postDataObject = x;
  }

  /**********************************************************
   * Functions that handle the display of the component.
   **********************************************************/

  /**
   * This function sets a tab visible or invisible.
   * @param tabArg A number that dictates which tab to make visible.
   */
  private setTabVisibility(tabArg) {
    let tabCount = Object.keys(this.tabVisibility).length;

    while (tabCount > 0) {
      this.tabVisibility[tabCount] = false;
      tabCount--;
    }

    this.tabVisibility[tabArg] = true;
  }

  private getAllYears(formattedPostData) {
    const x = [];

    formattedPostData.forEach(v => {
      if (x.indexOf(v.date.getFullYear()) === -1) {
        x.push(v.date.getFullYear());
      }
    });

    return x;
  }

  public filterYearOfData(formattedPostData, year) {
    return formattedPostData.filter(v => v['year'] === year);
  }

  public getFilteredData(year, month, day) {
    return this.postDataArray.filter(v =>
        G_MONTHS[v.date.getMonth()] === month && v.date.getFullYear() === year && v.date.getDate() === parseInt(day, 10)
      )
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .reverse();
  }

  public setAllPostsEdit = () => {
    this.postDataArray.forEach(v => v['displayMode'] = 'edit');
  }
  public setAllPostsView = () => {
    this.postDataArray.forEach(v => v['displayMode'] = 'view');
  }

  public performSave(dayData) {
    this.doPutEditPost(dayData['content'], dayData['_id']);
    dayData['displayMode'] = 'view';
  }


  /**********************************************************
   * Functions that access RESTFUL API endpoints.
   **********************************************************/

  /**
   * Perform a PUT operation to edit the content of a post.
   * @param content Some string of text.
   * @param id A mongoDB id that references a record.
   */
  public doPutEditPost(content: string, id: number) {
    if (content === '' || !id) {
      console.log('Bad form content:', content, id);
      return;
    }

    this.httpService.doPut(id, {
        postObject: {
          content: content
        }
      })
      .subscribe(v => {
        // Don't need to do anything special since content is data-bind. Just log success.
        this.syncPostDataObject();
        console.log('Successfully performed the put operation!');
      });
  }

  /**
   * Perform a DELETE operation to delete a post.
   * @param id A mongoDB id that references a record.
   */
  public doDeleteRemovePost(id: number) {
    if (!id) {
      console.log('Bad form content:', id);
      return;
    }

    this.httpService.doDelete(id)
      .subscribe(v => {
        // We're going to remove the element from our allPostData arrays.
        for (let i = 0; i < this.postDataArray.length; i++) {
          if (this.postDataArray[i]._id === id) {
            this.postDataArray.splice(i, 1);
            break;
          }
        }

        // Update post data object to match new postDataArray.
        this.syncPostDataObject();
      });
  }

  /**
   * Perform a POST operation to submit a new post.
   */
  public doPostOnSubmit() {
    if (this.formContent === '') {
      console.log('Bad form content');
      return;
    }

    this.httpService.doPost({
        content: this.formContent
      })
      .subscribe(v => {
        const x = v.post;
        const date = new Date(x['created_on']);

        this.postDataArray.push({
          _id: x['_id'],
          date: date,
          time: this.getFormattedTime(date),
          content: x['content'],
          displayMode: 'view'
        });

        // Synchronize post data object with post data array.
        this.syncPostDataObject();

        this.allYears = this.getAllYears(this.postDataArray);
        this.formContent = '';
      });

    return;
  }

  /**
   * Perform a get operation to retrieve all post data.
   */
  public doGetPostDataAll() {
    this.httpService.getPostsAll()
      .subscribe((data: []) => {
        const temp = [];

        data.forEach(v => temp.push({
          _id: v['_id'],
          content: v['content'],
          date: v['created_on']
        }));

        this.updatePostData(temp);
        this.allYears = this.getAllYears(this.postDataArray);
      });
  }

  /**
   * Perform a get operation to get all posts within the last 30 days.
   */
  public doGetPostData30Days() {
    const x = new Date();

    this.httpService.getPostsLast30Days({
        date_start: x.setTime(x.getTime() - 2592000000),
        date_end: new Date()
      })
      .subscribe((data: []) => {
        const temp = [];

        data.forEach(v => temp.push({
          _id: v['_id'],
          content: v['content'],
          date: v['created_on']
        }));

        this.updatePostData(temp);
        this.allYears = this.getAllYears(this.postDataArray);
      });
  }
}

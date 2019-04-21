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

const getUserStrFromDate = (date) => date.getMonth() + 1 + '/' + date.getDate() + '/' + date.getFullYear();

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  // Constructor -> Activates service httpService.
  constructor(private httpService: HttpService) {}

  public filterSettings = {
    date_start_str: getUserStrFromDate(new Date(this.getOneDayAgo())),
    date_end_str: getUserStrFromDate(new Date(this.getSuperFuture()))
  };

  // The text stored in #textareaNewPost
  public formContent = '';

  // Array of post data. Must remain synchronized with postDataObject. postDataObject depends on this variable.
  public postDataArray = [];

  // Post data object. Must remain synchronized with postDataObject. Is dependent on postDataArray.
  public filteredPostDataObject = {};
  public allYears = [];

  // A variable storing the current visibility of any given tab on the view for this component.
  public tabVisibility = {
    1: true,
    2: false
  };


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
    let sign = 'AM';
    let hours = date.getHours();

    if (hours > 13) {
      hours -= 12;
      sign = 'PM';
    }

    // Sub-helper function to return a formatted unit of time.
    const getFormattedTimeUnit = (timeUnit) => {
      let x = timeUnit.toString();

      if (x.length === 1) {
        x = '0'.concat(x);
      }

      return x;
    };

    // Return a string formed of formatted units of time.
    return getFormattedTimeUnit(hours) + ':' +
      getFormattedTimeUnit(date.getMinutes()) + ':' +
      getFormattedTimeUnit(date.getSeconds()) + ' ' + sign;
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

  public getFormattedCategory = (str) => {
    return str.substring(0, 1).toUpperCase() + str.substring(1, str.length);
  }

  public getOneDayAgo() {
    const x = new Date();
    return x.setTime(x.getTime() - 86400000);
  }

  public get30DaysAgo() {
    const x = new Date();
    return x.setTime(x.getTime() - 2592000000);
  }

  public getSuperFuture() {
    return new Date(9999, 11, 31);
  }

  public getDateFromUserStr = (date_str) => {
    const dateData = date_str.split('/').map(v => parseInt(v, 10));
    return new Date(dateData[2], (dateData[0] - 1), dateData[1]);
  }

  public getFormattedDay(day: number) {
    switch (day) {
      case 1:
        return day.toString().concat('st');
      case 2:
        return day.toString().concat('nd');
      case 3:
        return day.toString().concat('rd');
      default:
        return day.toString().concat('th');
    }
  }

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
        category: x[i]['category'],
        content: x[i]['content'],
        displayMode: 'view'
      });
    }

    this.postDataArray = tempPostDataArray;
    this.syncFilterDataObject();
  }

  /**
   * Function that sets postDataObject to values in postDataArray.
   * Unless a custom operation modifiers postDataArray directly,
   * this must be called after postDataArray is modified to keep the
   * two variables synchronized.
   */
  private syncFilterDataObject() {
    const x = {};
    const y = this.postDataArray;
    let date, year, month, day;

    const filterStartDate = this.getDateFromUserStr(this.filterSettings.date_start_str).getTime();
    const filterEndDate = this.getDateFromUserStr(this.filterSettings.date_end_str).getTime();

    for (let i = 0; i < y.length; i++) {
      date = y[i].date;

      if (date.getTime() >= filterStartDate && date.getTime() <= filterEndDate) {
        year = date.getFullYear();
        month = G_MONTHS[date.getMonth()];
        day = date.getDate();

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
    }

    this.filteredPostDataObject = x;
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
        this.syncFilterDataObject();
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
        this.syncFilterDataObject();
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
          category: x['category'],
          content: x['content'],
          displayMode: 'view'
        });

        // Synchronize post data object with post data array.
        this.syncFilterDataObject();

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
          category: v['category'],
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
    this.httpService.getPostsLast30Days({
        date_start: this.get30DaysAgo(),
        date_end: new Date()
      })
      .subscribe((data: []) => {
        const temp = [];

        data.forEach(v => temp.push({
          _id: v['_id'],
          category: v['category'],
          content: v['content'],
          date: v['created_on']
        }));

        this.updatePostData(temp);
        this.allYears = this.getAllYears(this.postDataArray);
      });
  }
}

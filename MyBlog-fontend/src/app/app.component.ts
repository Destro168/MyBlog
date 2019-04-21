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
const getLongUserStrFromDate = (date) => date.getMonth() + 1 + '/' + date.getDate() + '/' + date.getFullYear() + '/' +
  date.getHours() + '/' + date.getMinutes() + '/' + date.getSeconds();

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  // Constructor -> Activates service httpService.
  constructor(private httpService: HttpService) {}

  public G_CATEGORY_ARRAY = ['General', 'Roleplaying', 'Personal', 'Work', 'Programming'];
  public G_FILTER_SETTING_ALL = 'All';

  // TODO CATEGORY:  Add a category field.
  public filterSettings = {
    date_start_str: getUserStrFromDate(new Date(this.get30DaysAgo())),
    date_end_str: getUserStrFromDate(new Date(this.getSuperFuture())),
    resultLimit: 5,
    page_index: 0,
    category: this.G_FILTER_SETTING_ALL
  };

  public filteredPostDataObjectSize = 0;

  // The text stored in #textareaNewPost
  // TODO, MAKE INTO OBJECT.
  public formContent = '';
  public formCategory = this.G_CATEGORY_ARRAY[0];

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
    this.doGetPostData();
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

  public getLongDateFromUserStr = (date_str) => {
    const dateData = date_str.split('/').map(v => parseInt(v, 10));
    return new Date(dateData[2], (dateData[0] - 1), dateData[1], dateData[3], dateData[4], dateData[5]);
  }


  public getFormattedDay(day: number) {
    switch (day) {
      case 1:
      case 21:
        return day.toString().concat('st');
      case 2:
      case 22:
        return day.toString().concat('nd');
      case 3:
      case 23:
        return day.toString().concat('rd');
      default:
        return day.toString().concat('th');
    }
  }

  public getPaginationIndexes() {
    const arr = [];
    let i = 0;

    for (i = 0; i < Math.floor((this.filteredPostDataObjectSize - 1) / this.filterSettings.resultLimit) + 1; i++) {
      arr.push(i);
    }

    return arr;
  }

  /**********************************************************
   * Functions that manage post data, the content used
   *  in the app component view.
   **********************************************************/

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

    this.filteredPostDataObjectSize = 0;

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
          content: y[i]['content'],
          displayMode: y[i]['displayMode']
        });

        this.filteredPostDataObjectSize++;
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
        G_MONTHS[v.date.getMonth()] === month &&
        v.date.getFullYear() === year &&
        v.date.getDate() === parseInt(day, 10) &&
        (this.filterSettings.category === this.G_FILTER_SETTING_ALL || v.category === this.filterSettings.category)
      )
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .reverse()
      .slice(
        this.filterSettings.page_index * this.filterSettings.resultLimit,
        this.filterSettings.page_index * this.filterSettings.resultLimit + this.filterSettings.resultLimit
      );
  }

  public setAllPostsEdit = () => {
    this.postDataArray.forEach(v => v['displayMode'] = 'edit');
  }
  public setAllPostsView = () => {
    this.postDataArray.forEach(v => v['displayMode'] = 'view');
  }

  public performSave(dayData) {
    this.doPutEditPost(dayData);
    dayData['displayMode'] = 'view';
  }

  public getFilterList() {
    return [this.G_FILTER_SETTING_ALL, ...this.G_CATEGORY_ARRAY];
  }

  /**********************************************************
   * Functions that access RESTFUL API endpoints.
   **********************************************************/

  /**
   * Perform a PUT operation to edit the content of a post.
   * @param content Some string of text.
   * @param id A mongoDB id that references a record.
   */
  public doPutEditPost(dayData) {
    const content = dayData['content'];
    const category = dayData['category'];
    const id = dayData['_id'];
    const dateFromUserStr = this.getLongDateFromUserStr(dayData['date_str']);

    if (content === '' || !id) {
      console.log('Bad form content:', dayData);
      return;
    }

    // The values for the postObject MUST match RESTFUL API specifications.
    this.httpService.doPut(id, {
        postObject: {
          content: content,
          category: category,
          created_on: dateFromUserStr
        }
      })
      .subscribe(v => {
        // Update post object's date to match user date.
        dayData['date'] = dateFromUserStr;

        // Sync
        this.syncFilterDataObject();
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
        content: this.formContent,
        category: this.formCategory
      })
      .subscribe(v => {
        const x = v.post;
        const postDate = new Date(x['created_on']);

        this.postDataArray.push({
          _id: x['_id'],
          date: postDate,
          date_str: getLongUserStrFromDate(postDate),
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
   * Perform a GET operation to get all posts using filter settings to limit results.
   */
  public doGetPostData() {
    this.httpService.getPosts(
        this.getDateFromUserStr(this.filterSettings.date_start_str),
        this.getDateFromUserStr(this.filterSettings.date_end_str),
        this.filterSettings.category
      )
      .subscribe((data: []) => {
        const temp = [];

        data.forEach(v => temp.push({
          _id: v['_id'],
          date: new Date(v['created_on']),
          date_str: getLongUserStrFromDate(new Date(v['created_on'])),
          category: v['category'],
          content: v['content'],
          displayMode: 'view'
        }));

        this.postDataArray = temp;
        this.syncFilterDataObject();
        this.allYears = this.getAllYears(this.postDataArray);
      });
  }
}

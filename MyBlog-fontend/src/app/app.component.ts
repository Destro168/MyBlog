import {
  HttpService
} from './../services/http.service';
import {
  Component,
  OnInit
} from '@angular/core';

const G_MONTHS = ['January', 'February', 'March', 'April',
  'May', 'June', 'July', 'August', 'September',
  'October', 'November', 'December'
];

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  formContent = '';
  submitted = false;

  allPostData = [];
  allPostData2 = {};
  public allYears = [];

  tabVisibility = {
    1: true,
    2: false
  };

  pageMode = 'edit';

  constructor(private httpService: HttpService) {
  }

  ngOnInit() {
    this.doGetPostDataAll();
  }

  private setTabVisibility(tabArg) {
    let tabCount = Object.keys(this.tabVisibility).length;

    while (tabCount > 0) {
      this.tabVisibility[tabCount] = false;
      tabCount--;
    }

    this.tabVisibility[tabArg] = true;
  }

  private get30DaysAgo() {
    const x = new Date();
    x.setTime(x.getTime() - 2592000000);
    return x;
  }

  private getFormattedTime(date) {
    let hours = date.getHours().toString();
    let minutes = date.getMinutes().toString();

    if (hours.length === 1) {
      hours = '0'.concat(hours);
    }

    if (minutes.length === 1) {
      minutes = '0'.concat(minutes);
    }

    return hours + ':' + minutes;
  }

  private updatePostData(x) {
    const obj1 = [];
    const obj2 = {};

    for (let i = 0; i < x.length; i++) {
      const date = new Date(x[i].date);

      obj1.push({
        _id: x[i]['_id'],
        year: date.getFullYear(),
        month: G_MONTHS[date.getMonth()],
        day: date.getDate(),
        time: this.getFormattedTime(date),
        content: x[i]['content'],
        timeAndContent: '[' + this.getFormattedTime(date) + ']: ' + x[i]['content']
      });

      if (!obj2[date.getFullYear()]) {
        obj2[date.getFullYear()] = {};
      }

      if (!obj2[date.getFullYear()][G_MONTHS[date.getMonth()]]) {
        obj2[date.getFullYear()][G_MONTHS[date.getMonth()]] = {};
      }

      if (!obj2[date.getFullYear()][G_MONTHS[date.getMonth()]][date.getDate()]) {
        obj2[date.getFullYear()][G_MONTHS[date.getMonth()]][date.getDate()] = [];
      }

      obj2[date.getFullYear()][G_MONTHS[date.getMonth()]][date.getDate()].push({
        time: this.getFormattedTime(date),
        content: x[i]['content'],
        timeAndContent: '[' + this.getFormattedTime(date) + ']: ' + x[i]['content']
      });
    }

    this.allPostData = obj1;
    this.allPostData2 = obj2;
  }

  private getKeys(obj) {
    return Object.keys(obj);
  }

  private getAllYears(formattedPostData) {
    const x = [];

    formattedPostData.forEach(v => {
      if (x.indexOf(v['year']) === -1) {
        x.push(v['year']);
      }
    });

    return x;
  }

  public filterYearOfData(formattedPostData, year) {
    return formattedPostData.filter(v => v['year'] === year);
  }

  public getFilteredData(year, month, day) {
    return this.allPostData.filter(v => v['month'] === month && v['year'] === year && v['day'] === parseInt(day, 10));
  }

  public doPutEditPost(content, id: number) {
    if (content === '' || !id) {
      console.log('Bad form content:', content, id);
      return;
    }

    console.log(content);
    console.log(id);
  }

  public doDeleteRemovePost(id: number) {
    console.log(id);
  }

  public doPostOnSubmit() {
    if (this.formContent === '') {
      console.log('Bad form content');
      return;
    }

    this.submitted = true;

    this.httpService.doPost({
        content: this.formContent
      })
      .subscribe(v => {
        const x = v.post;
        const date = new Date(x['created_on']);

        this.allPostData.push({
          _id: x['_id'],
          year: date.getFullYear(),
          month: G_MONTHS[date.getMonth()],
          day: date.getDate(),
          time: this.getFormattedTime(date),
          content: x['content'],
          timeAndContent: '[' + this.getFormattedTime(date) + ']: ' + x['content']
        });

        if (!this.allPostData2[date.getFullYear()]) {
          this.allPostData2[date.getFullYear()] = {};
        }

        if (!this.allPostData2[date.getFullYear()][G_MONTHS[date.getMonth()]]) {
          this.allPostData2[date.getFullYear()][G_MONTHS[date.getMonth()]] = {};
        }

        if (!this.allPostData2[date.getFullYear()][G_MONTHS[date.getMonth()]][date.getDate()]) {
          this.allPostData2[date.getFullYear()][G_MONTHS[date.getMonth()]][date.getDate()] = [];
        }

        this.allPostData2[date.getFullYear()][G_MONTHS[date.getMonth()]][date.getDate()].push({
          time: this.getFormattedTime(date),
          content: x['content'],
          timeAndContent: '[' + this.getFormattedTime(date) + ']: ' + x['content']
        });

        this.allYears = this.getAllYears(this.allPostData);

        console.log(x, this.allPostData);
      });

      return;
  }

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
        this.allYears = this.getAllYears(this.allPostData);

        /*
        console.log('Test 1:' + this.allYears);
        console.log('Test 2:' + JSON.stringify(this.filterYearOfData(this.allPostData, 2019)));
        console.log('Test 3:' + JSON.stringify(this.getAllMonths(this.filterYearOfData(this.allPostData, 2019))));
        console.log('Test 4:' + JSON.stringify(this.filterMonthOfData(this.filterYearOfData(this.allPostData, 2019), 'April')));
        */
      });
  }

  public doGetPostData30Days() {
    this.httpService.getPostsLast30Days({
        date_start: this.get30DaysAgo(),
        date_end: new Date()
      })
      .subscribe((data: []) => {
        const temp = [];

        data.forEach(v => temp.push({
          _id: v['_id'],
          content: v['content'],
          date: v['created_on']
        }));

        this.allPostData = this.getAllYears(temp);
        this.allYears = this.getAllYears(this.allPostData);
      });
  }
}

export class DateHelper {
  private tempDay: number;

  now: Date;
  year: number;
  month: number;
  date: number;
  day: number;
  offset: number;
  today: Date;
  weekday: Date;
  monthday: Date;
  yearday: Date;

  constructor() {
    this.now = new Date();
    this.year = this.now.getFullYear();
    this.month = this.now.getMonth();
    this.date = this.now.getDate();
    this.tempDay = this.now.getDay();
    this.day = this.tempDay === 0 ? 7 : this.tempDay;
    this.offset = -this.now.getTimezoneOffset() / 60;
    this.today = this.getToday(this.year, this.month, this.date);
    this.weekday = this.getWeekday(this.year, this.month, this.date, this.day);
    this.monthday = this.getMonthday(this.year, this.month);
    this.yearday = this.getYearday(this.year);
  }

  private getToday(year: number, month: number, date: number): Date {
    return new Date(year, month, date, this.offset);
  }

  private getWeekday(year: number, month: number, date: number, day: number): Date {
    return new Date(year, month, date - day + 1, this.offset);
  }

  private getMonthday(year: number, month: number): Date {
    return new Date(year, month, 1, this.offset);
  }

  private getYearday(year: number): Date {
    return new Date(year, 1, 1, this.offset);
  }
}

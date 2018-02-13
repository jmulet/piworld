
const config = require('../server.config');

function withoutTime(d) {
    var date = new Date(d);
    date.setHours(0, 0, 0, 0);
    return date;
}

// This function parses a string like dd/mm/yyyy to a date object
function parseDate(str) {
    let splitter = "/";
    if(str.indexOf("-") > 0){
        splitter = "-";
    }
    const p = str.split(splitter);
    return new Date(p[2], p[1] - 1, p[0], 12);
}

config.HOLIDAY_INTERVALS = config.HOLIDAY_INTERVALS || [];
config.HOLIDAY_INTERVALS.forEach((e, k) => {
    if (!Array.isArray(e)) {
         e = [e, e];
         config.HOLIDAY_INTERVALS[k] = e;
    }
    e.forEach((x, i) => {
        if (typeof (x) === 'string') {
            e[i] = withoutTime(parseDate(x));
        }
    });
});

console.log(config.HOLIDAY_INTERVALS);

// Comprova si el dia date1 is holiday (nolectiu)
function isHoliday(date1) {
    // Diumenge o dissabte
    if (date1.getDay() === 6 || date1.getDay() === 0) {
        return true;
    }
    const date1nt = withoutTime(date1).getTime();
    // Ara mira si el dia esta dins un interval no lectiu
    for(let i=0; i<config.HOLIDAY_INTERVALS.length; i++) {
        e = config.HOLIDAY_INTERVALS[i];
        if (e[0].getTime() <= date1nt && date1nt <= e[1].getTime()) {
            return true;
        }
    }
    return false;
}

function addDays(d, n) {
    return new Date(d.getTime() + n * 1000 * 60 * 60 * 24);
}

function tomorrow(d) {
    return addDays(d, 1);
}

// Calcula el nombre de dies no lectius entre date1 i date2
function holidaysBetween(date1, date2) {
    let n = 0;
    let d = new Date(date1);
    const lastTime = date2.getTime();
    while (d.getTime() < lastTime) {
        n += isHoliday(d) ? 1 : 0;
        d = tomorrow(d);
    }
    return n;
}

// Calcula el nombre de dies lectius entre date1 i date2
function workDaysBetween(date1, date2) {
    let n = 0;
    let d = new Date(date1);
    d.setHours(0, 0, 0, 0);
    
    const d2 = new Date(date2);
    d2.setHours(0, 0, 0, 0);
    const lastTime = d2.getTime();

    while (d.getTime() < lastTime) {
        n += !isHoliday(d) ? 1 : 0;
        d = tomorrow(d);
    }
    return n;
}

module.exports = {
    parseDate,
    isHoliday,
    addDays,
    tomorrow,
    withoutTime,
    holidaysBetween,
    workDaysBetween
}
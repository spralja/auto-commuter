

class ICalendarDate {
    /**
     * Constructs a ICalendarDate from a Date and a tzid string
     * @param date
     * @param tzid if 'UTC' then sets UTC to true and tzid to undefined, otherwise tzid
     */
    constructor(date, tzid) {
        if(tzid === 'UTC') {
            this.UTC = true;
            tzid = undefined;
        }

        this.tzid = tzid;

        this.date = date;
    }

    /**
     * Creates an ICalendar date fomr string
     * @param text
     * @returns {ICalendarDate}
     */
    static fromText(text) {
        text = text.split(':');
        let UTC, tzid;
        if(text.length === 1) {
            [text] = text;
            if(text[text.length - 1] === 'Z') UTC = true;
            print(`1: ${typeof text}`);
        }

        print(text.length);
        print(text);

        if(text.length === 2) {
            tzid = text[0].split('=')[1];
            [, text] = text;
            print(`2: ${typeof text}`);
        }

        print(typeof text);
        let year = text.substring(0, 4);
        let month = text.substring(4, 6);
        let day = text.substring(6, 8);
        let hour = text.substring(9, 11);
        let minute = text.substring(11, 13);
        let second = text.substring(13, 15);
        let date = new Date(year, month, day, hour, minute, second);

        return new ICalendarDate(date, UTC ? 'UTC' : tzid);
    }


    toICS(property) {
        let ICS = [property];
        if(this.tzid) {
            ICS = [`${property};tzid=${this.tzid}`];
        }

        ICS.push(`${this.date.getFullYear()}${this.date.getMonth()}${this.date.getDate()}T${this.date.getHours()}${this.date.getMinutes()}${this.date.getHours()}`);
        ICS = [ICS.join(':'), this.UTC ? 'Z' : ''];
        ICS = ICS.join('');
        return ICS;
    }
}

class Component {
    /**
     * Abstract constructor for iCalendar components
     * @param {Object} data
     */
    constructor(data) {
        if(this.constructor === Component) {
            throw 'Component is an abstract class and cannot be instantiated.';
        }

        this.data = data;
        this.datafy();
    }

    /**
     * Splits an ical string into an array where each element is a property: value
     * @param {String} text
     * @returns {Array[String]}
     */
    static linefy(text) {
        // Turns a ical-string (text) into an array of lines and returns it
        let lines = [];
        let curr_line = [];

        for(let i = 0; i < text.length; ++i) {
            if(text[i] === '\r' && text[i + 1] === '\n') {
                ++i;
                if(text[i + 1] === ' ') {
                    curr_line.push('\r\n');
                    continue;
                }
                lines.push(curr_line.join(''))
                curr_line = [];
                continue;
            }

            curr_line.push(text[i]);
        }

        return lines;
    }

    /**
     * Splits a property string into key value pairs
     * @param {string} line the line to be split
     * @returns {[string, string]}
     */
    static splitfy(line) {
        //splits a line into a key, value pair and returns them
        let key = [];
        let value = []
        let is_value = false
        for(const char of line) {
            if (is_value) {
                value.push(char);
                continue;
            }
            if (char === ':' || char === ';') {
                is_value = true;
                continue;
            }

            key.push(char);
        }

        key = key.join('');
        value = value.join('');

        return [key, value];
    }

    /**
     * Parses key value pairs if they have special parsing requirements
     * Like for example dates
     */
    datafy() {
        //modifies a dictionary, where all the values tied to some common keys (ical properties) are
        //to some more useful javascript objects (instead of strings)
        for(const [key, value] of Object.entries(this.data)) {
            let datafy = Component.#datafiable[key];
            if(datafy && this.data[key].constructor !== datafy) {
                this.data[key] = datafy.fromText(value);
            }
        }
    }

    /**
     * Object with fields for each iCalendar data-type which requires special parsing
     * @type {object}
     */
    static #datafiable = {
        'DTSTART': ICalendarDate,
        'DTEND': ICalendarDate,
        'DTSTAMP': ICalendarDate,
        'CREATED': ICalendarDate,
        'LAST-MODIFIED': ICalendarDate,
    }

    /**
     * Converts the object into an iCalendar string
     * @returns {string}
     */
    toICS() {
        let ICS = [];
        for(const element of Object.entries(this.data)) {
            const [key, value] = element;
            if(typeof value !== 'string') ICS.push(value.toICS(key));
            else ICS.push(element.join(':'));
        }

        return ICS.join('\r\n');
    }
}


class Calendar extends Component {
    /**
     * Constructs an icalendar object from an iCalendar text file
     * @param text
     * @returns {Calendar}
     */
    static fromText(text) {
        let data = {};
        let events = [];
        let lines = Calendar.linefy(text);
        if(lines[0] !== 'BEGIN:VCALENDAR')
            throw 'Not a VCALENDAR!';


        if(lines[lines.length - 1] !== 'END:VCALENDAR')
            throw 'VCALENDAR not terminated!';

        lines = lines.slice(1, -2);

        let is_event = false;
        let event_lines = ['BEGIN:VEVENT'];
        for(const line of lines) {
            print(line);
            if(line === 'BEGIN:VEVENT') {
                is_event = true;
                continue;
            }

            if(line === 'END:VEVENT') {
                is_event = false;
                event_lines.push('END:VEVENT\r\n');
                events.push(Event.fromText(event_lines.join('\r\n')));
                event_lines = ['BEGIN:VEVENT'];
                continue;
            }

            if(is_event) {
                event_lines.push(line);
                continue;
            }

            let [key, value] = this.splitfy(line)
            data[key] = value;
        }

        let calendar = new Calendar(data);
        calendar.events = events;

        return calendar;
    }

    /**
     * Adds an event to the calendar
     * @param event
     */
    addEvent(event) {
        this.events.push(event);
    }

    /**
     * Converts the object into an iCalendar string
     * @returns {string}
     */
    toICS() {
        let ICS = ['BEGIN:VCALENDAR', super.toICS()];
        for (const event of this.events) ICS.push(event.toICS());
        ICS.push('END:VCALENDAR');

        return ICS.join('\r\n');
    }
}


class Event extends Component {
    /**
     * Constructs an Event object from iCalendar text
     * @param {String} text
     * @returns {Event}
     */
    static fromText(text) {
        let data = {};
        let lines = Event.linefy(text);
        if(lines[0] !== 'BEGIN:VEVENT')
            throw 'Not a VEVENT!';

        if(lines[lines.length - 1] !== 'END:VEVENT')
            throw 'VEVENT not terminated!';

        lines = lines.slice(1, -1);

        for (const line of lines) {
            let [key, value] = this.splitfy(line);
            data[key] = value;
        }

        return new Event(data);
    }

    /**
     * Converts the object into an iCalendar string
     * @returns {string}
     */
    toICS() {
        let ICS = ['BEGIN:VEVENT', super.toICS(), 'END:VENVET'];

        return ICS.join('\r\n');
    }
}




class UIDGenerator {
    /**
     * Constructs an UIDGenerator with the specified domain
     * @param domain
     */
    constructor(domain) {
        this.domain = domain;
    }

    /**
     * Generates an UID based on a random string and the domain
     * @returns {string} UID
     */
    generate() {
        let randomString = '';
        let chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+-';
        for(let i = 0; i < 64; i++) {
            randomString += chars[Math.floor(Math.random() * chars.length)];
        }

        return [randomString, this.domain].join('@');
    }
}

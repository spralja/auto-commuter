

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
            let datafy = this.#datafiable[key];
            if(datafy) {
                this.data[key] = new datafy(value);
            }
        }
    }

    /**
     * Object with fields for each iCalendar data-type which requires special parsing
     * @type {object}
     */
    #datafiable = {
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


class ICalendarDate {
    constructor(data) {
        data = data.split(':');
        if(data.length === 1) {
            [data] = data;
            if(data[data.length - 1] === 'Z') this.UTC = true;
            print(`1: ${typeof data}`);
        }

        print(data.length);
        print(data);

        if(data.length === 2) {
            this.tzid = data[0].split('=')[1];
            [, data] = data;
            print(`2: ${typeof data}`);
        }

        print(typeof data);
        let year = data.substring(0, 4);
        let month = data.substring(4, 6);
        let day = data.substring(6, 8);
        let hour = data.substring(9, 11);
        let minute = data.substring(11, 13);
        let second = data.substring(13, 15);
        this.date = new Date(year, month, day, hour, minute, second);
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

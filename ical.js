/**
 * Assumptions: the users time zone is the same as the time zone of the calendar
 * Reason: It is difficult to convert the ICAL tzid strings into time zones in javascript without
 * external packages
 * Problems: If the user is using an VPN located in timezone that is not equivalent to
 * 'Europe/Copenhagen' the service won't work correctly
 *
 * RFC5545 ICalendar
 */

class ICalendarDate {
    /**
     * Constructs a ICalendarDate from a Date and a tzid string
     * If timezone is provided it is assumed to be the same as the user
     * date is always stored as UTC
     * @param date
     * @param UTC true if UTC
     */
    constructor(date, UTC) {
        if(UTC) this.date = date
        else {
            this.date = new Date();
            this.date.setTime(date.getTime() + date.getTimezoneOffset()*60*1000);
        }
    }

    /**
     * Creates an ICalendar date fomr string
     * @param text
     * @returns {ICalendarDate}
     */
    static fromText(text) {
        text = text.split(':');

        let UTC = false;

        if(text.length === 2) [, text] = text;
        else {
            [text] = text;
            UTC = true;
        }

        let year = text.substring(0, 4);
        let month = +text.substring(4, 6) - 1;
        let day = text.substring(6, 8);
        let hour = text.substring(9, 11);
        let minute = text.substring(11, 13);
        let second = text.substring(13, 15);
        let date = new Date(year, month, day, hour, minute, second);

        return new ICalendarDate(date, UTC);
    }

    /**
     * Converts date to ICS
     * @param property
     * @returns {string}
     */
    toICS(property) {
        let year = this.date.getFullYear().toString();
        let month = (this.date.getMonth() + 1).toString().padStart(2, '0');
        let day = this.date.getDate().toString().padStart(2, '0');
        let hour = this.date.getHours().toString().padStart(2, '0');
        let minute = this.date.getMinutes().toString().padStart(2, '0');
        let second = this.date.getSeconds().toString().padStart(2, '0');
        let date = [year, month, day].join('');
        let time = [hour, minute, second].join('');

        return `${property}:${date}T${time}Z`;
    }
}

/**
 * Abstract Component Class
 * This should be the superclass of all ICAL objects
 */
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
        // Converts non-trivial string ICAL value data types to js ICAL objects
        this.datafy();
    }

    /**
     * Splits an ical string into an array where each element is a property: value
     * @param {String} text
     * @returns {Array[String]}
     */
    static linefy(text) {
        // the array of all the lines of the provided text (according to the ICAL standard)
        let lines = [];
        // the current line being parsed
        let curr_line = [];

        for(let i = 0; i < text.length; ++i) {
            //The lines in .ics files is split into lines by \r\n characters, but
            // if the next line starts with a space, it is considered the same property, and as such
            // the same line
            if(text[i] === '\r' && text[i + 1] === '\n') {
                // If the character following \r is \n you it is skipped
                ++i;
                // If the next character is a space a separate line is not created, instead the line
                // is folded
                if(text[i + 1] === ' ') {
                    // \r\n were never pushed to the curr_line array, so now they are
                    curr_line.push('\r\n');
                    // skips the rest of the code, because the line is folded
                    continue;
                }
                // the curr_line array is converted to a string and pushed as a string to the lines
                // arrays
                lines.push(curr_line.join(''))
                // curr_line is cleared
                curr_line = [];
                // skips the next part because the \r\n characters are to be ignored
                continue;
            }

            // pushes the current character to the curr_line array
            curr_line.push(text[i]);
        }

        // returns an array converted from the ICAL text
        // (essentially the text is split by \r\n, with special considerations for line folding)
        return lines;
    }

    /**
     * Splits a property string into key value pairs
     * @param {string} line the line to be split
     * @returns {[string, string]}
     */
    static splitfy(line) {
        // the key of the current line bing parsed
        let key = [];
        // the value of the current line being parsed
        let value = []
        // a boolean variable that is true if the key was successfully parsed
        // i.e. it's true if the rest of the line is to be parsed as the property value
        let is_value = false
        // iterate over all the characters in the line
        for(const char of line) {
            // if the value is being parsed
            if (is_value) {
                // push the rest of the strings characters is sufficient
                value.push(char);
                continue;
            }
            // the line is to be split between a key and a value, by the ':' or ';' characters
            if (char === ':' || char === ';') {
                // the key has been finished parsing, and as such, now the value will be parsed
                is_value = true;
                // ':'/';' are not part of the key or the value, so they are ignored
                continue;
            }

            // push the current character to the key array
            key.push(char);
        }

        // convert the array to a string
        key = key.join('');
        // convert the array to a string
        value = value.join('');

        // return the key, value pair
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
            // datafy is the class that is to be used to parse the special property
            let datafy = Component.#datafiable[key];
            // if datafy is defined and if the special property is not already an instance of the
            // special class
            if(datafy && this.data[key].constructor !== datafy) {
                // instantiate the special property with the appropriate class
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
        // the array all the property: value pairs are pushed to
        let ICS = [];
        for(const element of Object.entries(this.data)) {
            // the element key, value pair is unpacked
            const [key, value] = element;
            // if the value is not a string we have to use the value's method toICS instead of
            // just pushing the string itself
            // the key which is the name of the property must also be passed to the toICS method
            // because a special value data type can be used by several properties
            // (e.g. DTSTART and DTEND)
            // specifically the property must be passed because if DATE-TIME value data type
            // properties have a time zone the property name is connected with a ';' instead of ':'
            if(typeof value !== 'string') ICS.push(value.toICS(key));
            // otherwise just push the key: value pair onto the array
            else ICS.push(element.join(':'));
        }

        // before returning we convert the array to a string
        return ICS.join('\r\n');
    }
}


class Calendar extends Component {
    constructor(data) {
        super(data);
        this.events = [];
    }
    /**
     * Constructs an icalendar object from an iCalendar text file
     * @param text
     * @returns {Calendar}
     */
    static fromText(text) {
        // the data object to be passed to the Calendar constructor
        let data = {};
        // the array of events to be passed to assigned to the Calendar object
        let events = [];
        // split the lines by new lines, with special considerations
        let lines = Calendar.linefy(text);
        // ICalendar Calendar object must start like this
        if(lines[0] !== 'BEGIN:VCALENDAR')
            // alert the user to this requirement (the .ics file might be of the incorrect format
            // or the wrong file was provided
            throw 'Not a VCALENDAR!';

        // Icalendar Calendar objects must be terminated
        if(lines[lines.length - 1] !== 'END:VCALENDAR')
            // alert the user
            throw 'VCALENDAR not terminated!';

        // removes the 'BEGIN:VCALENDAR', and 'END:VCALENDAR' from the lines, because they aren't data
        lines = lines.slice(1, -1);

        // Boolean variable that is true, if currently an event is being parsed
        let is_event = false;
        // Event's must begin with 'BEGIN:VEVENT'
        let event_lines = ['BEGIN:VEVENT'];
        // Iterate over the lines
        for(const line of lines) {
            // If the current line is 'BEGIN:VEVENT' we should start to parse an event
            if(line === 'BEGIN:VEVENT') {
                // set the variable to true, because an event is being parsed
                is_event = true;
                // skip adding the line to data, because the event is separately handled
                continue;
            }

            // If 'END:VEVENT' is encountered the event is terminated
            if(line === 'END:VEVENT') {
                // we are no longer parsing an event, so this variable is set to false
                is_event = false;
                // Add the terminating line to the event_liens
                event_lines.push('END:VEVENT\r\n');
                // Pass the event_lines array converted to a string to the Event's fromText method
                // generating an Event object from the text
                events.push(Event.fromText(event_lines.join('\r\n')));
                // Reset the event_lines array
                event_lines = ['BEGIN:VEVENT'];
                // the rest should be skipped
                continue;
            }

            // IF an event is currently being parsed
            if(is_event) {
                // Simply push the line to the event_lines array
                event_lines.push(line);
                // the rest should be skipped
                continue;
            }

            // Splits the line into a key, value pair
            let [key, value] = this.splitfy(line)
            // assign the key, value pair to the data
            data[key] = value;
        }

        // Instantiate an ICalendar object wit the data
        let calendar = new Calendar(data);
        // Assign the events array to the calendar
        calendar.events = events;

        // return the newly instantiated calendar
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
        // ICalendar objects start with this, simply appends the superclasses return value of
        // the toICS method (which converts the object's data to .ics)
        let ICS = ['BEGIN:VCALENDAR', super.toICS()];
        // iterate through events and append the ical string returned by the event object
        for (const event of this.events) ICS.push(event.toICS());
        // make sure the calendar is terminated
        ICS.push('END:VCALENDAR');

        // convert the array to a string representing the ical file
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
        // the data object, to be passed to the constructor of the Event
        let data = {};
        // splits the lines based on new lines, with special considerations
        let lines = Event.linefy(text);
        // all events must begin with 'BEGIN:VEVENT'
        if(lines[0] !== 'BEGIN:VEVENT')
            // alerts the user
            throw 'Not a VEVENT!';

        // all events must be terminated
        if(lines[lines.length - 1] !== 'END:VEVENT')
            // alerts the user
            throw 'VEVENT not terminated!';

        // removes 'BEGIN:VEVENT' and 'END:VEVENT' from the array, because they are not data
        lines = lines.slice(1, -1);

        // iterates through the lines
        for (const line of lines) {
            // unpacks the return value of the splitfy method, which returns a key, value pair
            let [key, value] = this.splitfy(line);
            // assigns the key, value pair to the data object
            data[key] = value;
        }

        // Instantiates and returns the new Event object
        return new Event(data);
    }

    /**
     * Converts the object into an iCalendar string
     * @returns {string}
     */
    toICS() {
        // Simply begin with 'BEGIN:VEVENT', followed by the representation of the Event's data,
        // following by 'END:VEVENT'
        let ICS = ['BEGIN:VEVENT', super.toICS(), 'END:VEVENT'];

        // Converts the array to a string
        return ICS.join('\r\n');
    }
}




class UIDGenerator {
    /**
     * Constructs an UIDGenerator with the specified domain
     * @param domain
     */
    constructor(domain) {
        // the domain to be appended to the UUID
        this.domain = domain;
    }

    /**
     * Generates an UID based on a random string and the domain
     * @returns {string} UID
     */
    generate() {
        // define an empty string
        let randomString = '';
        // the characters that can be used for the UUID (~base-64)
        let chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+-';
        // iterate 64 times, to generate 64 characters
        for(let i = 0; i < 64; i++) {
            // append the random character to the string
            randomString += chars[Math.floor(Math.random() * chars.length)];
        }

        // return the random string appended wit the domain
        return [randomString, this.domain].join('@');
    }
}

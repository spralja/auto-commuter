

class Component {
    constructor(_text) {
        if(this.constructor === Component) {
            throw 'Component is an abstract class and cannot be instantiated.';
        }
    }

    linefy(text) {
        // Turns a ical-string (text) into an array of lines and returns it
        this.data = {};
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

    splitfy(line) {
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

    datafy(dict) {
        for(const [key, value] of Object.entries(dict)) {
            let datafy = this.datafiable[key];
            if(datafy !== undefined) {
                dict[key] = datafy(value);
            }
        }
    }

    #valueToDate(value) {
        value = value.split(':');
        if(value.length === 2) value = [value[1]];
        value = value[0];
        let year = value.substring(0, 4);
        let month = value.substring(4, 6);
        let day = value.substring(6, 8);
        let hour = value.substring(9, 11);
        let minute = value.substring(11, 13);
        let second = value.substring(13, 15);
        return new Date(year, month, day, hour, minute, second);
    }

    datafiable = {
        'DTSTART': this.#valueToDate,
        'DTEND': this.#valueToDate,
    }
}

class Calendar extends Component {
    constructor(text) {
        super(text);

        let lines = this.linefy(text);

        if(lines[0] !== 'BEGIN:VCALENDAR') {
            throw 'Not a VCALENDAR!';
        }

        if(lines[lines.length - 1] !== 'END:VCALENDAR') {
            throw 'VCALENDAR not terminated!';
        }

        lines.splice(1, -2);

        this.events = [];
        let is_event = false;
        let event_lines = [];
        for(const line of lines) {
            if(line === 'BEGIN:VEVENT') {
                is_event = true;
                continue;
            }

            if(line === 'END:VEVENT') {
                is_event = false;
                this.events.push(new Event(event_lines.join('\r\n')))
                event_lines = [];
                continue;
            }

            if(is_event) {
                event_lines.push(line);
                continue;
            }

            let [key, value] = this.splitfy(line)
            this.data[key] = value;
        }

        this.datafy(this.data);
    }
}

class Event extends Component {
    constructor(text) {
        super(text);
        let lines = this.linefy(text);

        for (const line of lines) {
            let [key, value] = this.splitfy(line);
            this.data[key] = value;
        }

        this.datafy(this.data);
    }
}

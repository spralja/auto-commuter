

class Calendar {
    constructor(text) {
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

        if(lines[0] !== 'BEGIN:VCALENDAR') {
            throw 'Not a VCALENDAR!';
        }

        if(lines[lines.length - 1] !== 'END:VCALENDAR') {
            throw 'VCALENDAR not terminated!'
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
            print(key);
            value = value.join('');
            this.data[key] = value;
        }
    }

    get getData() {
        return this.data;
    }

    get getEvents() {
        return this.events;
    }
}

class Event {
    constructor(text) {
        this.data = {};
        let lines = [];
        let curr_line = [];

        for(let i = 0; i < text.length; ++i) {
            if(text[i] === '\r' && text[i + 1] === '\n') {
                ++i;
                if (text[i + 1] === ' ') {
                    curr_line.push('\r\n');
                    continue;
                }

                lines.push(curr_line.join(''))
                curr_line = [];
                continue;
            }

            curr_line.push(text[i]);
        }
        print("New event:")
        for(const line of lines) {
            print(line);
            print("");
        } print("");

        for(const line of lines) {
            let key = [];
            let value = []
            let is_value = false
            for(const char of line) {
                if(is_value) {
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
            this.data[key] = value;
        }

    }

    get getData() {
        return this.data;
    }
}


const Controller = {
    /**
     * Converts a rejseplanen trip object into an iCalendar event object
     * @param trip
     * @returns {Event}
     */
    tripToEvent(trip) {
        let firstLeg = trip['Leg'][0];
        let lastLeg = trip['Leg'][trip['Leg'].length - 1];
        let [startDate, startTime] = [firstLeg['Origin'].date, firstLeg['Origin'].time];
        let [endDate, endTime] = [lastLeg['Destination'].date, lastLeg['Destination'].time];
        let dtstart = RejseplanenClient.joinDate(startDate, startTime);
        dtstart = new ICalendarDate(dtstart)
        let dtend = RejseplanenClient.joinDate(endDate, endTime);
        dtend = new ICalendarDate(dtend);

        let UID_GENERATOR = new UIDGenerator('spralja.test');
        let uid = UID_GENERATOR.generate();

        let dtstamp = new Date(Date());
        dtstamp = new ICalendarDate(dtstamp, 'UTC');

        return new Event({
            'DTSTART': dtstart,
            'DTEND': dtend,
            'UID': uid,
            'DTSTAMP': dtstamp,
            'SUMMARY': 'Commute',
            'DESCRIPTION': this.tripToDescription(trip),
        });
    },

    /**
     * Creates an event description based on iCalendar files that can be downloaded on rejseplanen's website
     * (in English)
     * @param trip
     * @returns {string}
     */
    tripToDescription(trip) {
        let description = [];
        for(const leg of trip['Leg'])
            description.push(this.legToDescription(leg));

        return `Details:\r\n ${description.join('\r\n \r\n ')}\r\n Duration: ????`;
    },

    /**
     * Creates a Description of the Leg (also based on rejseplanen's)
     * @param leg
     * @returns {string}
     */
    legToDescription(leg) {
        return [
            ` ${leg.type}`,
            `Departure ${leg['Origin'].time} ${leg['Origin'].name}`,
            `Arrival ${leg['Origin'].time} ${leg['Origin'].name}`,
        ].join('\r\n ');
    }
}


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
        dtstart = new ICalendarDate(dtstart, 'Europe/Copenhagen')
        let dtend = RejseplanenClient.joinDate(endDate, endTime);
        dtend = new ICalendarDate(dtend, 'Europe/Copenhagen');

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

        return `Details:\r\n ${description.join('\r\n \r\n ')}\r\n Duration: ${this.tripToDuration(trip)}`;
    },

    /**
     * Returns the duration string of the trip
     * @param trip
     * @return {string}
     */
    tripToDuration(trip) {
        let first_leg = trip['Leg'][0];
        let last_leg = trip['Leg'][trip['Leg'].length - 1];

        let start_time = RejseplanenClient.joinDate(first_leg['Origin'].date, first_leg['Origin'].time);
        let end_time = RejseplanenClient.joinDate(last_leg['Destination'].date, last_leg['Destination'].time);

        let duration = (end_time.getTime() - start_time.getTime())/(60*1000);

        let minute = (duration % 60).toString().padStart(2, '0');
        let hour = ((duration - (duration % 60))/60).toString();

        // H:MM
        return `${hour}:${minute}`;
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
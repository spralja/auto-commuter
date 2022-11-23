/**
 * Assumptions: The user is using a modern calendar system that supports html in the event description
 * specifically <br>
 * Reason: There is some trouble with integrating p5.js file writing with ics, this means that it
 * is difficult to correctly format the description with line breaks
 */

const Controller = {
    /**
     * Converts a rejseplanen trip object into an iCalendar event object
     * @param trip
     * @returns {Event}
     */
    tripToEvent(trip) {
        // get the first leg of the trip
        let firstLeg = trip['Leg'][0];
        // get the last leg of the trip
        let lastLeg = trip['Leg'][trip['Leg'].length - 1];
        // declares two variables startDate and startTime, from the legs
        let [startDate, startTime] = [firstLeg['Origin'].date, firstLeg['Origin'].time];
        let [endDate, endTime] = [lastLeg['Destination'].date, lastLeg['Destination'].time];
        // convert the rejseplanen date, time to a js Date object
        let dtstart = RejseplanenClient.joinDate(startDate, startTime);

        // convert the js Date object to an ICalendarDate object
        dtstart = new ICalendarDate(dtstart)
        
        // convert the rejseplanen date, time to a js Date object
        let dtend = RejseplanenClient.joinDate(endDate, endTime);
        // convert the js Date object to an ICalendarDate object
        dtend = new ICalendarDate(dtend);

        // Create and UUID generator with a given domain, to generate Universal Unique Identifiers
        let UID_GENERATOR = new UIDGenerator('spralja.test');
        // Generate a random UUID
        let uid = UID_GENERATOR.generate();

        // Define dtstamp as the current time
        let dtstamp = new Date(Date());
        // Convert the js Date object to an ICalendarDate object
        dtstamp = new ICalendarDate(dtstamp, 'UTC');

        // Returns a new Event object with the specified properties
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
        // push the description of each leg, onto the description array
        for(const leg of trip['Leg'])
            description.push(this.legToDescription(leg));

        // returns the final formatted string
        return `Details:<br> ${description.join('<br> <br> ')}<br> Duration: ${this.tripToDuration(trip)}`;
    },

    /**
     * Returns the duration string of the trip
     * @param trip
     * @return {string}
     */
    tripToDuration(trip) {
        // the First leg of the trip
        let first_leg = trip['Leg'][0];
        // the Last leg of the trip
        let last_leg = trip['Leg'][trip['Leg'].length - 1];
        // the start time of the trip
        let start_time = RejseplanenClient.joinDate(first_leg['Origin'].date, first_leg['Origin'].time);
        // the end time of the trip
        let end_time = RejseplanenClient.joinDate(last_leg['Destination'].date, last_leg['Destination'].time);
        // the duration of the trip
        let duration = (end_time.getTime() - start_time.getTime())/(60*1000);
        // the hour of the duration
        let hour = ((duration - (duration % 60))/60).toString();
        // the minute of the duration
        let minute = (duration % 60).toString().padStart(2, '0');
        // H:MM
        return `${hour}:${minute}`;
    },

    /**
     * Creates a Description of the Leg (also based on rejseplanen's)
     * @param leg
     * @returns {string}
     */
    legToDescription(leg) {
        // returns a description of the leg
        return [
            ` ${leg.type}`,
            `Departure ${leg['Origin'].time} ${leg['Origin'].name}`,
            `Arrival ${leg['Destination'].time} ${leg['Destination'].name}`,
        ].join('<br> ');
    }
}
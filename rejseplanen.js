/**
 * Assumptions: the User in a time zone equivalent to Europe/Copenhagen
 * Reason: The Rejseplanen API expects times in CET, and it is difficult to convert the users time zone
 * mostly because of DST
 * Problems: VPN
 */

class RejseplanenClient {
    constructor(base_url, xml) {
        // assigns the base_url to the instance
        this.base_url = base_url;
        // if xml is true 'format=json' is omitted, because by default the Rejseplanen API uses xml
        this.format = (xml ? '' : '&format=json');
    }

    request(service, options) {
        // an array of the options provided for the service
        let options_array = [];
        // iterate over the key, value pairs in the options object
        for(const [key, value] of Object.entries(options)) {
            // adds the option to the options_array as a formatted string
            options_array.push(`${key}=${value}`);
        }

        // joins the options with an ampersand
        let options_string = options_array.join('&');

        // formats the final url
        let url = `${this.base_url}/${service}?${options_string}${this.format}`
        print(`requesting: ${url}`); // prints the url that is being requested
        // Declare an empty instance of a request
        let xmlHttp = new XMLHttpRequest();
        // defines the request parameters
        xmlHttp.open('GET', url, false);
        // does not send a body
        xmlHttp.send(null);
        // returns the parsed json object
        return JSON.parse(xmlHttp.responseText);
    }

    location(input) {
        // defines the service of the request
        let service = 'location';
        // return the response of the Rejseplanen API
        return this.request(service, {'input': input});
    }

    /**
     * :)
     * @param options options
     * @param datetime in UTC
     * @param arrival true or false
     * @returns {*}
     */
    trip(options, datetime, arrival) {
        // Defines the service of the request
        let service = 'trip';
        
        let UTCTime = new Date();
        UTCTime.setTime(datetime.getTime() - datetime.getTimezoneOffset()*60*1000);
        // unpacks the converted datetime, into the options object (the datetime is converted to
        // the representation expected by the Rejseplanen API)
        [options['date'], options['time']] = this.#splitDate(UTCTime);
        
        // Sets the 'searchForArrival' to the appropriate value
        // By default Rejseplanen responds with a list of trips that start after the selected datetime
        // by setting searchForArrival to 1, instead Rejseplanen will send trips that end before the
        // selected datetime
        options['searchForArrival'] = arrival ? 1 : 0;

        // Define the response of the Rejseplanen API, the 'TripList' is automatically retrieved
        let response = this.request(service, options)['TripList'];

        // If the Rejseplanen API responds with an error we should raise an exception
        // One of the reasons for an exception like this is some wrong format, or for example
        // searching for trips mor than ~1 week before today, or more than several times after
        if(response['error'] !== undefined) {
            // alert the user of the error
            throw response['error'];
        }

        // return the TripList
        return response;

        /*
         required:
         originId || originCoordX, originCoordY, originCoordName;
         destId || destCoordX, destCoordY, destCoordName

         optional:
         viaId, date=now, time=now, searchForArrival=0
         useTog=1, useBus=1, useMetro=1
         useBicycle=1 ~=> maxWalkingDistanceDep=2000, maxWalkingDistanceDest=2000
        */


    }

    departureBoard() {
        let service = 'departureBoard';
        /*
         required:
         id; date, time || offsetTime (minutes)

         optional
         useTog, useBus, useMetro

         */
    }

    arrivalBoard() {
        let service = 'arrivalBoard';
        /*
         required:
         id; date, time || offsetTime (minutes)

         optional:
         useTog, useBus, useMetro

         */
    }

    multiDepartureBoard() {
        let service = 'multiDepartureBoard';
        /*
         required:
         id1, [id2, id3, ..., id10]; date, time || offsetTime (minutes0

         optional:
         useTog, useBus, useMetro
         */
    }

    stopsNearby() {
        let service = 'stopsNearby';
        /*
         required:
         coordX, coordY, maxRadius, maxNumber
         */
    }

    journeyDetail() {
        let service = 'journeyDetail';
        //TODO
    }

    /**
     * Converts an js Date object into the representation the Rejseplanen API expects
     * @param datetime
     * @returns {string[]}
     */
    #splitDate(datetime) {
        // The day of the month of the datetime, this must be appended by a leading 0
        let day = datetime.getDate().toString().padStart(2, '0'); //dd
        // The month of the datetime, must be appended by a leading 0
        let month = (datetime.getMonth() + 1).toString().padStart(2, '0');//MM
        // the last 2 digits of the year of the datetime, must be appended by a leading 0
        let year = (datetime.getFullYear() % 100).toString().padStart(2, '0');//yy
        // the hour of the datetime, must be appended by a leading 0
        let hour = datetime.getHours().toString().padStart(2, '0');//hh
        // the minute of the datetime, must be appended by a leading 0
        let minute = datetime.getMinutes().toString().padStart(2, '0');//mm

        // creates a string representing the date of the datetime
        let date = [day, month, year].join('.'); //dd.MM.yy
        // creates a string representing the time of the datetime
        let time = [hour, minute].join('.'); //hh.mm

        // returns the date, time pair
        return [date, time];
    }

    /**
     * Converts a Rejseplanen API date to a js Date object
     * @param date the date as a string
     * @param time the time as a string
     * @returns {Date}
     */
    static joinDate(date, time) {
        // declare the datetime object to be returned
        let datetime = new Date();
        // Split the date string by '.'
        let [day, month, year] = date.split('.');
        // convert the year to an int, and append 2000, because the year in the Rejseplanen API
        // is represented as the last two digits
        // The rejseplanen API is to be used in the 21st century
        year = +year + 2000;
        // Converts the month to an int, and appends 1, because the month in Date is 0-indexed
        month = +month - 1;
        // Converts the month to an int
        day = +day;

        // Set the year of the Date object
        datetime.setFullYear(year);
        // Set the month of the Date object
        datetime.setMonth(month);
        // Set the day (of the month) of the Date object
        datetime.setDate(day);

        // Split the time string by ':'
        let [hour, minute] = time.split(':');
        //convert hour and minute to ints
        hour = +hour
        minute = +minute

        //set the hour of the Date object
        datetime.setHours(hour);
        //set the minute of the Minute object
        datetime.setMinutes(minute);

        // return the datetime object
        return datetime;
    }
}

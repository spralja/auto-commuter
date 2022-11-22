

class RejseplanenClient {
    constructor(base_url, xml) {
        this.base_url = base_url;
        this.format = (xml ? '' : '&format=json');
    }

    request(service, options) {
        let options_array = [];
        for(const [key, value] of Object.entries(options)) {
            options_array.push(`${key}=${value}`);
        }

        let options_string = options_array.join('&');

        let url = `${this.base_url}/${service}?${options_string}${this.format}`
        print(`requesting: ${url}`);
        let xmlHttp = new XMLHttpRequest();
        xmlHttp.open('GET', url, false);
        xmlHttp.send(null);
        return JSON.parse(xmlHttp.responseText);
    }

    location(input) {
        let service = 'location';
        return this.request(service, {'input': input});
    }

    trip(options, datetime, arrival) {
        let service = 'trip';
        [options['date'], options['time']] = this.#splitDate(datetime);
        options['searchForArrival'] = arrival ? 1 : 0;

        let response = this.request(service, options)['TripList'];

        if(response['error'] !== undefined) {
            throw response['error'];
        }

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

    #splitDate(datetime) {
        let day = datetime.getDate().toString().padStart(2, '0');
        let month = (datetime.getMonth() + 1).toString().padStart(2, '0');
        let year = (datetime.getFullYear() % 100).toString().padStart(2, '0');
        let hour = datetime.getHours().toString().padStart(2, '0');
        let minute = datetime.getMinutes().toString().padStart(2, '0');
        let date = [day, month, year].join('.');
        let time = [hour, minute].join('.');

        return [date, time];
    }

    static joinDate(date, time) {
        let datetime = new Date();

        let [day, month, year] = date.split('.');
        year = +year + 2000;
        month = +month - 1;
        day = +day;

        datetime.setFullYear(year);
        datetime.setMonth(month);
        datetime.setDate(day);

        let [hour, minute] = time.split(':');
        hour = +hour
        minute = +minute

        datetime.setHours(hour);
        datetime.setMinutes(minute);

        return datetime;
    }
}
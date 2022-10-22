

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
        let service = 'trip'
        let splitDate = this.#splitDate(datetime);
        if(splitDate) [options['date'], options['time']] = splitDate;
        options['searchForArrival'] = arrival ? 1 : 0;

        return this.request(service, options);

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
        if(!datetime) return;
        let date = [datetime.getDate(), datetime.getMonth() + 1, datetime.getFullYear() % 100].join('.');
        let time = [datetime.getHours(), datetime.getMinutes()].join('.');

        return [date, time];
    }

    joinDate(date, time) {
        let datetime = new Date();
        let [year, month, day] = date.split('.');
        datetime.setFullYear(2000 + year);
        datetime.setMonth(-1 + month);
        datetime.setDate(day);

        let [hour, minute] = time.split(':');
        datetime.setHours(+hour);
        datetime.setMinutes(+minute);

        return datetime;
    }
}
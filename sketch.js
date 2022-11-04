let departure_text, departure_prompt, departure_button;
let destination_text, destination_prompt, destination_button;

let departure_location_x, departure_location_y, departure_location_name;
let destination_location_x, destination_location_y, destination_location_name;

let generate_calendar_button;

let input;

let rejseplanen_client = new RejseplanenClient('http://xmlopen.rejseplanen.dk/bin/rest.exe');

let calendar;

function setup() {
  createCanvas(windowWidth, windowHeight);

  input = createFileInput(handleFile);
  input.position(0, 0);

  departure_text = createElement('h4', 'Departure:')
  departure_text.position(10, 100);

  departure_prompt = createInput();
  departure_prompt.position(departure_text.x + 90, 120);
  departure_prompt.size(400, departure_prompt.height)

  departure_button = createButton('submit');
  departure_button.position(departure_prompt.x + departure_prompt.width, 120);
  departure_button.size(departure_button.width, departure_prompt.height);
  departure_button.mousePressed(submit_departure);

  destination_text = createElement('h4', 'Destination:');
  destination_text.position(10, 130);

  destination_prompt = createInput();
  destination_prompt.position(destination_text.x + 90, 150)
  destination_prompt.size(400, destination_prompt.height)

  destination_button = createButton('submit');
  destination_button.position(destination_prompt.x + destination_prompt.width, destination_prompt.y);
  destination_button.size(destination_button.width, destination_prompt.height);
  destination_button.mousePressed(submit_destination);

  generate_calendar_button = createButton('generate calendar');
  generate_calendar_button.position(10, 200);
  generate_calendar_button.mousePressed(generate_calendar);
}

function submit_departure() {
  if(!departure_prompt.value()) throw 'Departure field cannot be empty!';

  let departure = departure_prompt.value();

  let response = rejseplanen_client.location(departure);

  let location = response['LocationList']['CoordLocation'][0];

  departure_prompt.value(location.name);

  departure_location_x = location.x;
  departure_location_y = location.y;
  departure_location_name = location.name.split(' ').join('%20');

  //print(departure_location_x);
  //print(departure_location_y);
}

function submit_destination() {
  if(!destination_prompt.value()) throw 'Destination field cannot be empty!';

  let destination = destination_prompt.value();

  let response = rejseplanen_client.location(destination);

  let location = response['LocationList']['CoordLocation'][0];

  destination_prompt.value(location.name);

  destination_location_x = location.x;
  destination_location_y = location.y;
  destination_location_name = location.name.split(' ').join('%20');

  //print(destination_location_x);
  //print(destination_location_y);
}

function generate_calendar() {
  if(!departure_location_name) submit_departure();

  if(!destination_location_name) submit_destination();

  if(!calendar) throw 'You must upload a calendar!'
  let arrival_trips = [];
  let departures_trips = [];
  let options = {
    'originCoordX': departure_location_x,
    'originCoordY': departure_location_y,
    'originCoordName': departure_location_name,
    'destCoordX': destination_location_x,
    'destCoordY': destination_location_y,
    'destCoordName': destination_location_name,
  }

  for(const event of calendar.events) {
    arrival_trips.push(rejseplanen_client.trip(options, event['DTSTART'], true)['TripList']['Trip'][0]);
    departures_trips.push(rejseplanen_client.trip(options, event['DTEND'])['TripList']['Trip'][0]);
  }

  let new_calendar = new Calendar({'PRODID': 'spralja.test', 'VERSION': '2.0'});

  for(const trip of arrival_trips) {
    new_calendar.addEvent(Controller.tripToEvent(trip))
  }

  for(const trip of departures_trips) {
    new_calendar.addEvent(Controller.tripToEvent(trip));
  }

  print(new_calendar.toICS());
}



let ical;

function draw() {
  if (ical === undefined) return;

  //print(ical);
}

function handleFile(file) {
  calendar = Calendar.fromText(file.data);
  print(calendar);
  //print(calendar);
  //print(calendar.toICS());
  /*
  let client = new RejseplanenClient('http://xmlopen.rejseplanen.dk/bin/rest.exe');
  let rtext = client.request('location', {input: 'Trekroner'});
  print(rtext);

  if(!navigator.geolocation) {
    console.log('Geolocation is not supported by your browser');

  } else {
    navigator.geolocation.getCurrentPosition(success, error)
  }*/
}

function success(position) {
  //print(position.coords.latitude);
  //print(position.coords.longitude);
}

function error() {
  throw 'Unable to retrieve your location!';
}
let departure_text, departure_prompt, departure_button;
let destination_text, destination_prompt, destination_button;

let departure_location_x, departure_location_y, departure_location_name;
let destination_location_x, destination_location_y, destination_location_name;

let generate_calendar_button;

let input;

let rejseplanen_client = new RejseplanenClient('http://xmlopen.rejseplanen.dk/bin/rest.exe');

let calendar;

var lastRequestTime = 0;
var timerActive = false;
var lastRequestedInput = ""

function setup() {
  createCanvas(windowWidth, windowHeight);

  input = createFileInput(handleFile);
  input.position(0, 0);

  departure_text = createElement('h4', 'Departure:')
  departure_text.position(10, 100);

  departure_prompt = createInput().attribute('placeholder', 'hint');
  departure_prompt.position(departure_text.x, departure_text.y + 40);
  departure_prompt.size(200, departure_prompt.height);
  departure_prompt.input(suggest_departure);


 // departure_picker.changed(select_departure);

  departure_button = createButton('Submit');
  departure_button.position(departure_prompt.x + departure_prompt.width, departure_prompt.y);
  departure_button.size(departure_button.width, departure_prompt.height);
  departure_button.mousePressed(submit_departure);

  destination_text = createElement('h4', 'Destination:');
  destination_text.position(departure_text.x + 600, 100);

  destination_prompt = createInput();
  destination_prompt.position(destination_text.x, destination_text.y + 40)
  destination_prompt.size(200, destination_prompt.height);
  destination_prompt.input(suggest_destination);

  destination_picker = createSelect();
  destination_picker.position(destination_prompt.x,destination_prompt.y+40,);
  destination_picker.changed(select_destination);


  destination_button = createButton('submit');
  destination_button.position(destination_prompt.x + destination_prompt.width, destination_prompt.y);
  destination_button.size(destination_button.width, destination_prompt.height);
  destination_button.mousePressed(submit_destination);

  generate_calendar_button = createButton('generate calendar');
  generate_calendar_button.position(10, 300);
  generate_calendar_button.mousePressed(generate_calendar);


}

function suggest_departure() {
  let initialInput = departure_prompt.value();
  if (millis() - lastRequestTime > 3000) {

    if (lastRequestedInput != "") {
      departure_picker.remove();
    }
    lastRequestedInput = departure_prompt.value;
    if (initialInput != lastRequestedInput) {

      print(lastRequestTime)
      print("Initial:" + initialInput)
      print("Last requaeted: " + lastRequestedInput)
      lastRequestTime = millis()
      lastRequestedInput = initialInput

      let response = rejseplanen_client.location(initialInput);
      let location_stops = response['LocationList']['StopLocation']
      let location_coors = response['LocationList']['CoordLocation'];
      let location = location_stops.concat(location_coors);
      // print(location_coors)
      departure_picker = createSelect()
      departure_picker.position(departure_prompt.x, departure_prompt.y + 25);
      var i = 0;
      while (i < 5) {
        departure_picker.option(location[i].name);
        i++;
      }
    }
  }
}


//function to display a selected location from the dropdown in the prompt
function select_departure(){
  let selected = departure_picker.selected();
  departure_prompt.value(selected);
}

function suggest_destination() {


  let destination = destination_prompt.value();
  let response = rejseplanen_client.location(destination);
  let location_stops = response['LocationList']['StopLocation']
  let location_coors = response['LocationList']['CoordLocation'];
  let location = location_stops.concat(location_coors);
  var i = 0;
  while (i < 30) {
    destination_picker.option(location[i].name);
    i++;
  }
}

function select_destination(){
  let selected = destination_picker.selected();
  destination_prompt.value(selected);
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

//function removeOptions() {
 // var i, L = departure_picker.options.length - 1;
 // for(i = L; i >= 0; i--) {
   // departure_picker.remove(i);
  //}
//}

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
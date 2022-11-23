let departure_text, departure_prompt, departure_button;
let destination_text, destination_prompt, destination_button;

let departure_location_x, departure_location_y, departure_location_name;
let destination_location_x, destination_location_y, destination_location_name;

let departure_picker,destination_picker

let generate_calendar_button;

let input;

let rejseplanen_client = new RejseplanenClient('https://xmlopen.rejseplanen.dk/bin/rest.exe');

let calendar;

var lastRequestTime_departure = 0;
var lastRequestedInput_departure = "";

var lastRequestTime_destination = 0;
var lastRequestedInput_destination = "";

var picked_departure = false;
var picked_destination = false;

function setup() {
  createCanvas(windowWidth, windowHeight);

  input = createFileInput(handleFile);
  input.position(0, 0);

  departure_text = createElement('h4', 'Departure:')
  departure_text.position(10, 100);

  textStyle(ITALIC);
  departure_prompt = createInput().attribute('placeholder','ex. Roskilde St.');
  departure_prompt.position(departure_text.x, departure_text.y + 40);
  departure_prompt.size(200, departure_prompt.height);

  departure_button = createButton('Submit');
  departure_button.position(departure_prompt.x + departure_prompt.width, departure_prompt.y);
  departure_button.size(departure_button.width, departure_prompt.height);
  departure_button.mousePressed(submit_departure);

  destination_text = createElement('h4', 'Destination:');
  destination_text.position(departure_text.x + 600, 100);

  destination_prompt = createInput().attribute('placeholder','ex. RUC');
  destination_prompt.position(destination_text.x, destination_text.y + 40)
  destination_prompt.size(200, destination_prompt.height);


  destination_button = createButton('submit');
  destination_button.position(destination_prompt.x + destination_prompt.width, destination_prompt.y);
  destination_button.size(destination_button.width, destination_prompt.height);
  destination_button.mousePressed(submit_destination);

  generate_calendar_button = createButton('generate calendar');
  generate_calendar_button.position(10, 300);
  generate_calendar_button.mousePressed(generate_calendar);


}

function draw() {

 departure_prompt.input(input_departure);
 suggest_departure();


 destination_prompt.input(input_destination);
 suggest_destination();

  if (ical === undefined) return;

  //print(ical);
}

function input_departure(){
  lastRequestTime_departure = millis();
  picked_departure = false;
}

function input_destination(){
  lastRequestTime_destination = millis();
  picked_destination = false;
}

function suggest_departure() {
  let initialInput = departure_prompt.value();
  if (millis() - lastRequestTime_departure > 1000 && initialInput != lastRequestedInput_departure && (picked_departure==false)) {

    if (lastRequestedInput_departure != "") {
      departure_picker.remove();
    }
    lastRequestedInput_departure = departure_prompt.value;
    lastRequestedInput_departure = initialInput;

    if (initialInput == 0) {
      departure_picker.remove();
    } else {
      let response = rejseplanen_client.location(initialInput);
      let location_stops = response["LocationList"]["StopLocation"];
      let location_coors = response["LocationList"]["CoordLocation"];
      let location = location_stops.concat(location_coors);

      departure_picker = createSelect();
      departure_picker.position(departure_prompt.x, departure_prompt.y + 25);
      departure_picker.size(departure_prompt.width, 25)
      var i = 0;
      while (i < 5) {
        departure_picker.option(location[i].name);
        i++;
      }
      departure_picker.changed(select_departure);
    }
  }
}

function suggest_destination() {
  let initialInput = destination_prompt.value();
  if (millis() - lastRequestTime_destination > 1000 && initialInput != lastRequestedInput_destination && (picked_destination == false)) {

    if (lastRequestedInput_destination != "") {
      destination_picker.remove();
    }
    lastRequestedInput_destination = destination_prompt.value;
    lastRequestedInput_destination = initialInput;

    if (initialInput == 0) {
      destination_picker.remove();
    } else {
      let response = rejseplanen_client.location(initialInput);
      let location_stops = response["LocationList"]["StopLocation"];
      let location_coors = response["LocationList"]["CoordLocation"];
      let location = location_stops.concat(location_coors);

      destination_picker = createSelect();
      destination_picker.position(destination_prompt.x,destination_prompt.y+25);
      destination_picker.size(destination_prompt.width, 25);

      var i = 0;
      while (i < 5) {
        destination_picker.option(location[i].name);
        i++;
      }
      destination_picker.changed(select_destination);
    }
  }
}


//function to display a selected location from the dropdown in the prompt
function select_departure(){
  let selected = departure_picker.selected();
  departure_prompt.value(selected);
  picked_departure = true;
  departure_picker.remove();
}

function select_destination(){
  let selected = destination_picker.selected();
  destination_prompt.value(selected);
  picked_destination = true;
  destination_picker.remove();
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
    let start_time = event.data['DTSTART'].date;
    let end_time = event.data['DTEND'].date;

    let arrival_request = rejseplanen_client.trip(options, start_time, true);
    let departure_request = rejseplanen_client.trip(options, end_time);

    arrival_trips.push(arrival_request['Trip'][0]);
    departures_trips.push(departure_request['Trip'][0]);
  }

  let new_calendar = new Calendar({'PRODID': 'spralja.test', 'VERSION': '2.0'});

  for(const trip of arrival_trips) {
    new_calendar.addEvent(Controller.tripToEvent(trip))
  }

  for(const trip of departures_trips) {
    new_calendar.addEvent(Controller.tripToEvent(trip));
  }

  let writer = createWriter('commute-calendar.ics');
  writer.write([new_calendar.toICS()]);
  writer.close();
}



let ical;



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


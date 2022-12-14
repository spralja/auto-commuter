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

var pickerOptionsDeparture = []
var pickerOptionsDestination = []



function setup() {
  createCanvas(windowWidth, windowHeight);

  input = createFileInput(handleFile);
  input.position(0, 0);

  departure_text = createElement('h4', 'Departure:')
  departure_text.position(10, 100);

  departure_prompt = createInput().attribute('placeholder','ex. Frederiksgade');
  departure_prompt.position(departure_text.x, departure_text.y + 40);
  departure_prompt.size(200, departure_prompt.height);

  destination_text = createElement('h4', 'Destination:');
  destination_text.position(departure_text.x + 600, 100);

  destination_prompt = createInput().attribute('placeholder','ex. RUC');
  destination_prompt.position(destination_text.x, destination_text.y + 40)
  destination_prompt.size(200, destination_prompt.height);

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

}

//This function is called every time when input in departure prompt changes. It resets time of a last requested time
// and makes boolean picked_departure = false, meaning that departure is not yet selected.
function input_departure(){
  lastRequestTime_departure = millis();
  picked_departure = false;
}

//Duplicate of the input_departure(), just for destination
function input_destination(){
  lastRequestTime_destination = millis();
  picked_destination = false;
}

// In this function a request to Rejseplanen is sent 1 sec after last change in departure prompt
// and each time dropdown departure_picker with 5 matching results is generated
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
      let location = response["LocationList"]["CoordLocation"];

      departure_picker = createSelect();
      departure_picker.position(departure_prompt.x, departure_prompt.y + 25);
      departure_picker.size(departure_prompt.width, 25)
      departure_picker.option('select')
      var i = 0;

      pickerOptionsDeparture = []

      if (location === undefined ){
        departure_picker.option('no options')
        return;
      }
      if(! Array.isArray(location)) location = [location];
      while (i < 5) {
        if(i >= location.length){
          break
        }
        departure_picker.option(location[i].name);
        pickerOptionsDeparture.push(new pickerOptionDeparture(location[i].name, location[i].x, location[i].y));
        i++;
      }
      //when a selected option changes in departure picker, selected_departure() is called
      departure_picker.changed(select_departure);
    }
  }
}


//function to display a selected location from the dropdown in the prompt and declare x and y of the selected address.
//when option is selected, the dropdown departure_picker is removed.
function select_departure(){
  let selected = departure_picker.selected();
  let chosenOption = getPickerOptionDeparture(selected);
  departure_location_x = chosenOption.x;
  departure_location_y = chosenOption.y;
  //replacing spaces with %20, because url can't contain space and request is not going to be sent (in generate_calendar) fxn
  departure_location_name = chosenOption.name.split(' ').join('%20');

  departure_prompt.value(selected);

  print("x " + departure_location_x);
  print("y " + departure_location_y);
  print(departure_location_name);

  picked_departure = true;
  departure_picker.remove();
}

//function to get information of the selected option (name, x and y). Called on line 133.
function getPickerOptionDeparture(selected) {
    var i = 0
    while (i < 5) {
      if (selected == pickerOptionsDeparture[i].name) {
        return (pickerOptionsDeparture[i])
      }
      i++
  }
}

//this class with a constructor is used to store x and y of addresses in the dropdown departure_picker (line 119)
class pickerOptionDeparture {
  constructor(name, x, y) {
    this.name = name;
    this.x = x;
    this.y = y;
  }
}

//following functions are duplicates for destination (of departure)

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
      let location = response["LocationList"]["CoordLocation"];

      destination_picker = createSelect();
      destination_picker.position(destination_prompt.x,destination_prompt.y+25);
      destination_picker.size(destination_prompt.width, 25);
      destination_picker.option('select')


      pickerOptionDeparture = [];
      var i = 0;
      if (location === undefined ){
        destination_picker.option('no options')
        return;
      }

      if(! Array.isArray(location)) location = [location];
      while (i < 5) {

        if(i >= location.length){
          break
        }
        destination_picker.option(location[i].name);
        pickerOptionsDestination.push(new pickerOptionDestination(location[i].name, location[i].x, location[i].y));
        i++;
      }
      destination_picker.input(select_destination);
    }
  }
}

function select_destination(){
  let selected = destination_picker.selected();
  destination_prompt.value(selected);

  let chosenOption = getPickerOptionDestination(selected);
  destination_location_x = chosenOption.x;
  destination_location_y = chosenOption.y;
  destination_location_name = chosenOption.name.split(' ').join('%20');

  print("x " + destination_location_x);
  print("y " + destination_location_y);
  print(destination_location_name);


  picked_destination = true;
  destination_picker.remove();
}

function getPickerOptionDestination(selected) {
  if (pickerOptionsDestination != []) {
    var i = 0
    while (i < 5) {
      if (selected = pickerOptionsDestination[i].name) {
        return (pickerOptionsDestination[i])
      }
      i++
    }
  }
}
class pickerOptionDestination {
  constructor(name, x, y) {
    this.name = name;
    this.x = x;
    this.y = y;
  }
}




//generation of the calendar
function generate_calendar() {
  if(!departure_location_name) {
    alert('You must choose a departure (refresh page)')
    throw 'choose a departure!';
  }

  if(!destination_location_name) {
    alert('You must choose a destination (Refresh page)')
    throw 'choose a destination';
  }

  if(!calendar) {
    alert('You must upload a calendar (Refresh page)')
    throw 'You must upload a calendar!'
  }
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


let departure_text, departure_prompt, departure_button;
let destination_text, destination_prompt, destination_button;

let departure_location_x, departure_location_y;
let destination_location_x, destination_location_y;

let input;

let rejseplanen_client = new RejseplanenClient('http://xmlopen.rejseplanen.dk/bin/rest.exe');

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
  destination_button.mousePressed(destination_submit);

}

function submit_departure() {
  let departure = departure_prompt.value();
  let response = rejseplanen_client.request(
      'location',
      {'input': departure}
  )

  let location = response['LocationList']['CoordLocation'][0];

  departure_prompt.value(location.name);

  departure_location_x = location.x;
  departure_location_y = location.y;

  print(departure_location_x);
  print(departure_location_y);
}

function destination_submit() {
  let destination = destination_prompt.value();
  let response = rejseplanen_client.request(
      'location',
      {'input': destination}
  )

  let location = response['LocationList']['CoordLocation'][0];

  departure_prompt.value(location.name);

  destination_location_x = location.x;
  destination_location_y = location.y;

  print(destination_location_x);
  print(destination_location_y);
}

let ical;

function draw() {
  if (ical === undefined) return;

  print(ical);
}

function handleFile(file) {
  let calendar = new Calendar(file.data);
  print(calendar);
  let client = new RejseplanenClient('http://xmlopen.rejseplanen.dk/bin/rest.exe');
  let rtext = client.request('location', {input: 'Trekroner'});
  print(rtext);

  if(!navigator.geolocation) {
    console.log('Geolocation is not supported by your browser');

  } else {
    navigator.geolocation.getCurrentPosition(success, error)
  }
}

function success(position) {
  print(position.coords.latitude);
  print(position.coords.longitude);
}

function error() {
  print('Unable to retrive your location');
}
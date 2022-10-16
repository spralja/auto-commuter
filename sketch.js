let webcals_prompt, button, greeting;

function setup() {
  createCanvas(windowWidth, windowHeight);

  webcals_prompt = createInput();
  webcals_prompt.position(20, 65);

  button = createButton('submit');
  button.position(webcals_prompt.x + webcals_prompt.width, 65);
  button.mousePressed(greet);

  greeting = createElement('h2', 'Course webcal files:');
  greeting.position(20, 5);

  textAlign(CENTER);
  textSize(50);

  input = createFileInput(handleFile);
  input.position(0, 0);
}

let ical;

function greet() {
  webcals = webcals_prompt.value().split(';')
  print(webcals);
  httpGet(webcals[0], 'text', false, function(response) {
    ical = response;
  });
}

function draw() {
  if (ical === undefined) return;

  print(ical);
}

function handleFile(file) {
  //print(file.data);
  let cal = ICAL.Component.fromString(file.data);
  print(cal)
  //let calendar = new Calendar(file.data);
  //print(calendar);
  /*
  print(file.data.split('\r\n'));
  curr = -1;
  events = [];
  is_event = false;
  for(const line of file.data.split('\r\n')) {
    if(line === 'BEGIN:VEVENT') {
      is_event = true;
      ++curr;
      continue;
    }

    if(!is_event) continue;
    if(line === 'END:VEVENT') {
      is_event = false;
      continue;
    }

    if(events[curr] === undefined) events[curr] = []
    events[curr].push(line)
    print(line);
  }

  print();
  print(events);*/
}

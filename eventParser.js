import * as fs from "node:fs/promises";

async function parseEvent(eventFolder) {
  /*
   * read event definition from event.json
   */
  let eventDefinition = await fs
    .readFile(`${eventFolder}/definition.json`, "utf-8")
    .then((data) => JSON.parse(data));
  console.log(eventDefinition);

  const handlerModulePath = `${eventFolder}/${eventDefinition.start.module}`;
  console.log("handler module path", handlerModulePath);

  const handlerModule = await import(handlerModulePath);
  const startHandler = handlerModule[eventDefinition.start.function];
  return {
    name: eventDefinition.name,
    start: startHandler,
  };
}

async function readEvents(eventsPath) {
  /*
   * read events from defitinion.json under each folder under `events`
   */
  const eventFolders = await fs.readdir(eventsPath);
  console.log(eventFolders);
  for (const eventFolder of eventFolders) {
    parseEvent(`${eventsPath}/${eventFolder}`);
  }
}

readEvents("./events");

import * as fs from 'node:fs/promises';
export { EventParser, EventDefinition };
export { EventDependencyParser, EventNode };

class EventDefinition {
    constructor(name, id, start) {
        this.name = name;
        this.id = id;
        this.start = {
            module: start.module,
            function: start.function,
        };
    }
}

class Event {
    constructor(name, eventDefinition, children) {
        this.name = name;
        this.definition = eventDefinition;
        this.children = children;
    }
}

class EventNode {
    constructor(id, children) {
        this.id = id;
        this.children = children;
    }
}

class EventParser {
    static async readEventDefinition(eventFolder) {
        /*
         * read event definition from event.json
         */
        let eventDefinition = await fs
            .readFile(`${eventFolder}/definition.json`, 'utf-8')
            .then((data) => JSON.parse(data));
        return new EventDefinition(
            eventDefinition.name,
            eventDefinition.id,
            eventDefinition.start,
        );
    }

    static buildEventFromDefinition(eventDefinition) {
        // const handlerModulePath = `${eventFolder}/${eventDefinition.start.module}`;

        // const handlerModule = await import(handlerModulePath);
        // const startHandler = handlerModule[eventDefinition.start.function];
        return new Event(eventDefinition.name, eventDefinition, []);
    }
}

class EventDependencyParser {
    static async readEventDependencies(dependenciesFilePath) {
        /*
         * read event dependencies from dependencies.json
         */
        let eventDependencies = await fs
            .readFile(dependenciesFilePath, 'utf-8')
            .then((data) => JSON.parse(data));
        return eventDependencies;
    }

    static buildEventDependencyGraph(eventDependencies) {
        /*
         * build event dependency graph
         */
        const eventNodes = new Map();
        for (const [eventKey, eventAttributes] of Object.entries(
            eventDependencies,
        )) {
            if (!eventNodes.has(eventKey)) {
                const eventNode = new EventNode(eventKey, new Array());
                eventNodes.set(eventKey, eventNode);
            }
            const eventNode = eventNodes.get(eventKey);
            for (const childEventKey of eventAttributes.children) {
                if (!eventNodes.has(childEventKey)) {
                    eventNodes.set(
                        childEventKey,
                        new EventNode(childEventKey, new Array()),
                    );
                }
                eventNode.children.push(eventNodes.get(childEventKey));
            }
        }
        return eventNodes;
    }

    static findEventDependenciesRoot(eventNodes) {
        const inDegree = new Map();
        eventNodes.forEach((eventNode) => {
            if (!inDegree.has(eventNode)) {
                inDegree.set(eventNode, 0);
            }
            for (const child of eventNode.children) {
                if (!inDegree.has(child)) {
                    inDegree.set(child, 0);
                }
                inDegree.set(child, inDegree.get(child) + 1);
            }
        });
        const zeroIndegree = [];
        for (const [eventKey, inDegreeCount] of inDegree) {
            if (inDegreeCount === 0) {
                zeroIndegree.push(eventKey);
            }
        }
        if (zeroIndegree.length === 0) {
            throw new Error(
                `No root event found. Please check dependencies.json`,
            );
        } else if (zeroIndegree.length > 1) {
            throw new Error(
                `More than one root event found. Please check dependencies.json`,
            );
        } else {
            return zeroIndegree[0];
        }
    }

    static validateEventDependencies(root, eventNodes) {
        /*
         * validate event dependencies
         */
        const visited = new Set();
        let queue = [root.id];
        while (queue.length > 0) {
            let newQueue = [];
            for (const eventKey of queue) {
                if (visited.has(eventKey)) {
                    throw new Error(
                        `Event ${eventKey} is defined more than once`,
                    );
                }
                visited.add(eventKey);
                const eventNode = eventNodes.get(eventKey);
                for (const child of eventNode.children) {
                    newQueue.push(child.id);
                }
            }
            queue = newQueue;
        }
    }

    static validateEventExistences(events, eventNodes) {
        const validEventKeys = new Set();
        events.forEach((event) => validEventKeys.add(event.id));
        for (const eventKey of eventNodes.keys()) {
            if (!events.has(eventKey)) {
                throw new Error(
                    `Event ${eventKey} is defined in dependencies.json but not in events folder`,
                );
            }
        }
    }
}

async function parseEvents(eventsPath) {
    /*
     * read events from defitinion.json under each folder under `events`
     */
    const eventFiles = await fs.readdir(eventsPath);
    const events = [];
    let dependencies;
    for (const file of eventFiles) {
        let stat;
        stat = await fs.stat(`${eventsPath}/${file}`);
        if (stat.isDirectory()) {
            const eventDefinition = await parseEvent(`${eventsPath}/${file}`);
            events.push(eventDefinition);
        } else if (stat.isFile() && file === 'dependencies.json') {
            dependencies = await parseEventDependencies(
                `${eventsPath}/${file}`,
            );
        }
    }
    return {
        events,
        dependencies,
    };
}

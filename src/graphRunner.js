import appConfig from "config";
import { generateEventGraph } from "./eventParser.js";

const eventsRoot = appConfig.get("eventsRoot");

const {root, graph, events} = await generateEventGraph(eventsRoot);
console.log(root);
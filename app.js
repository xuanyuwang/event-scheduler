import reduxTookit from "@reduxjs/toolkit";
const { createSlice, configureStore } = reduxTookit;

const Events = {
  "event 1": {
    name: "event 1",
    startEvent: () => {
      console.log("event 1 started");
    },
  },
  "event 2": {
    name: "event 2",
    startEvent: () => {
      console.log("event 2 started");
    },
  },
};

const EventDependencies = {
  "event 1": ["event 2"],
};

const coreSlice = createSlice({
  name: "core",
  initialState: {},
  reducers: {
    fireEvents: (state, action) => {
      const { eventID } = action.payload;
      const nextEvents = EventDependencies[eventID];
      for (const nextEvent of nextEvents) {
        Events[nextEvent].startEvent();
      }
    },
  },
});

const { fireEvents } = coreSlice.actions;

const store = configureStore({
  reducer: coreSlice.reducer,
});

store.dispatch(fireEvents({ eventID: "event 1" }));

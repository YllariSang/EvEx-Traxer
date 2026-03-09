import { Event } from "../types";

const EVENTS_KEY = "events_storage";

export const storage = {
  // Get all events
  getEvents: (): Event[] => {
    const data = localStorage.getItem(EVENTS_KEY);
    return data ? JSON.parse(data) : [];
  },

  // Get a single event by ID
  getEvent: (id: string): Event | null => {
    const events = storage.getEvents();
    return events.find((e) => e.id === id) || null;
  },

  // Add a new event
  addEvent: (event: Event): void => {
    const events = storage.getEvents();
    events.push(event);
    
    try {
      localStorage.setItem(EVENTS_KEY, JSON.stringify(events));
    } catch (error) {
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        throw new Error('Storage quota exceeded. Try reducing image sizes or removing some images.');
      }
      throw error;
    }
  },

  // Update an existing event
  updateEvent: (id: string, updatedEvent: Event): void => {
    const events = storage.getEvents();
    const index = events.findIndex((e) => e.id === id);
    
    if (index !== -1) {
      // Get the current user from localStorage
      const userEmail = localStorage.getItem("userEmail") || "admin";
      
      // Create edit log entry
      const editLogEntry = {
        timestamp: new Date().toISOString(),
        user: userEmail,
        action: "Updated event",
        changes: "Event details modified",
      };
      
      // Add edit log entry to the updated event
      updatedEvent.editLog = [...(updatedEvent.editLog || []), editLogEntry];
      
      events[index] = updatedEvent;
      
      try {
        localStorage.setItem(EVENTS_KEY, JSON.stringify(events));
      } catch (error) {
        if (error instanceof DOMException && error.name === 'QuotaExceededError') {
          throw new Error('Storage quota exceeded. Try reducing image sizes or removing some images.');
        }
        throw error;
      }
    }
  },

  // Delete an event
  deleteEvent: (id: string): void => {
    const events = storage.getEvents();
    const filtered = events.filter((e) => e.id !== id);
    localStorage.setItem(EVENTS_KEY, JSON.stringify(filtered));
  },
};

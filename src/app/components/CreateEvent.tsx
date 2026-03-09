import { useState } from "react";
import { useNavigate, Link } from "react-router";
import { ArrowLeft } from "lucide-react";
import { storage } from "../lib/storage";
import { Event } from "../types";

export function CreateEvent() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    dateTime: "",
    poc: "",
    description: "",
    expectedAttendees: 0,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newEvent: Event = {
      id: crypto.randomUUID(),
      ...formData,
      expenses: {
        transpo: 0,
        mealAllowance: 0,
        customExpenses: [],
      },
      activities: {
        giveaway: "",
        selling: "",
        boothItems: "",
        sample: "",
        eventFlow: "",
      },
      products: [],
      editLog: [],
    };

    try {
      storage.addEvent(newEvent);
      navigate(`/event/${newEvent.id}`);
    } catch (error) {
      console.error('Error creating event:', error);
      if (error instanceof Error) {
        alert(`Failed to create event: ${error.message}`);
      } else {
        alert('Failed to create event. Please try again.');
      }
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "number" ? Number(value) : value,
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Events
        </Link>

        <div className="bg-white rounded-lg shadow-sm p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Create New Event</h1>
          <p className="text-gray-600 mb-8">Fill in the event details below</p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Event Name *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter event name"
              />
            </div>

            <div>
              <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
                Address of Event *
              </label>
              <input
                type="text"
                id="address"
                name="address"
                required
                value={formData.address}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter event address"
              />
            </div>

            <div>
              <label htmlFor="dateTime" className="block text-sm font-medium text-gray-700 mb-2">
                Date and Time of Event *
              </label>
              <input
                type="datetime-local"
                id="dateTime"
                name="dateTime"
                required
                value={formData.dateTime}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label htmlFor="poc" className="block text-sm font-medium text-gray-700 mb-2">
                Point of Contact (PoC) *
              </label>
              <input
                type="text"
                id="poc"
                name="poc"
                required
                value={formData.poc}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter PoC name"
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Description of Event
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter event description"
              />
            </div>

            <div>
              <label htmlFor="expectedAttendees" className="block text-sm font-medium text-gray-700 mb-2">
                Expected Attendees/Foot Traffic *
              </label>
              <input
                type="number"
                id="expectedAttendees"
                name="expectedAttendees"
                required
                min="0"
                value={formData.expectedAttendees}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter expected number of attendees"
              />
            </div>

            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Create Event
              </button>
              <Link
                to="/dashboard"
                className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium text-gray-700"
              >
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router";
import { ArrowLeft, Printer } from "lucide-react";
import { storage } from "../lib/storage";
import { Event } from "../types";
import { format } from "date-fns";

export default function PrintEvent() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [event, setEvent] = useState<Event | null>(null);

  useEffect(() => {
    if (id) {
      const foundEvent = storage.getEvent(id);
      if (foundEvent) {
        setEvent(foundEvent);
        // Update page title for printing
        document.title = `Event Report - ${foundEvent.name}`;
      } else {
        navigate("/dashboard");
      }
    }
    
    // Cleanup: restore original title when component unmounts
    return () => {
      document.title = "Event Tracker";
    };
  }, [id, navigate]);

  if (!event) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  const handlePrint = () => {
    window.print();
  };

  const totalExpenses =
    event.expenses.transpo +
    event.expenses.mealAllowance +
    event.expenses.customExpenses.reduce((sum, exp) => sum + exp.amount, 0);

  return (
    <div className="min-h-screen bg-white">
      {/* Print Controls - Hidden when printing */}
      <div className="print:hidden bg-gray-100 border-b px-4 py-3 flex justify-between items-center">
        <Link
          to={`/event/${id}`}
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Event
        </Link>
        <button
          onClick={handlePrint}
          className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Printer className="w-5 h-5" />
          Print
        </button>
      </div>

      {/* Printable Content */}
      <div className="max-w-[210mm] mx-auto p-8 print:p-12">
        {/* Event Information */}
        <section className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4 border-b border-gray-300 pb-2">
            Event Information
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-500">Event Name</p>
              <p className="text-gray-900 font-medium">{event.name}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Date & Time</p>
              <p className="text-gray-900">{event.dateTime && !isNaN(new Date(event.dateTime).getTime()) ? format(new Date(event.dateTime), "MMMM d, yyyy 'at' h:mm a") : "No date set"}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Address</p>
              <p className="text-gray-900">{event.address}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Point of Contact</p>
              <p className="text-gray-900">{event.poc}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Expected Attendees</p>
              <p className="text-gray-900">{event.expectedAttendees}</p>
            </div>
            {event.description && (
              <div className="col-span-2">
                <p className="text-sm font-medium text-gray-500">Description</p>
                <p className="text-gray-900">{event.description}</p>
              </div>
            )}
          </div>
        </section>

        {/* Marketing Expenses */}
        <section className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4 border-b border-gray-300 pb-2">
            Marketing Expenses
          </h2>
          <table className="w-full border border-gray-300">
            <thead className="bg-gray-100">
              <tr>
                <th className="border border-gray-300 px-4 py-2 text-left">Expense Type</th>
                <th className="border border-gray-300 px-4 py-2 text-right">Quantity</th>
                <th className="border border-gray-300 px-4 py-2 text-right">Unit Price</th>
                <th className="border border-gray-300 px-4 py-2 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-gray-300 px-4 py-2">Transportation</td>
                <td className="border border-gray-300 px-4 py-2 text-right">-</td>
                <td className="border border-gray-300 px-4 py-2 text-right">-</td>
                <td className="border border-gray-300 px-4 py-2 text-right">₱{event.expenses.transpo.toFixed(2)}</td>
              </tr>
              <tr>
                <td className="border border-gray-300 px-4 py-2">Meal Allowance</td>
                <td className="border border-gray-300 px-4 py-2 text-right">-</td>
                <td className="border border-gray-300 px-4 py-2 text-right">-</td>
                <td className="border border-gray-300 px-4 py-2 text-right">₱{event.expenses.mealAllowance.toFixed(2)}</td>
              </tr>
              {event.expenses.customExpenses.map((expense) => (
                <tr key={expense.id}>
                  <td className="border border-gray-300 px-4 py-2">{expense.name}</td>
                  <td className="border border-gray-300 px-4 py-2 text-right">{expense.quantity || 1}</td>
                  <td className="border border-gray-300 px-4 py-2 text-right">₱{(expense.unitPrice || 0).toFixed(2)}</td>
                  <td className="border border-gray-300 px-4 py-2 text-right">₱{(expense.amount || 0).toFixed(2)}</td>
                </tr>
              ))}
              <tr className="font-bold bg-gray-50">
                <td className="border border-gray-300 px-4 py-2" colSpan={3}>Total Expenses</td>
                <td className="border border-gray-300 px-4 py-2 text-right">₱{totalExpenses.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
        </section>

        {/* Activities */}
        <section className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4 border-b border-gray-300 pb-2">
            Activities
          </h2>
          <div className="space-y-3">
            {event.activities.giveaway && (
              <div>
                <p className="text-sm font-medium text-gray-500">Giveaway</p>
                <p className="text-gray-900">{event.activities.giveaway}</p>
              </div>
            )}
            {event.activities.selling && (
              <div>
                <p className="text-sm font-medium text-gray-500">Selling</p>
                <p className="text-gray-900">{event.activities.selling}</p>
              </div>
            )}
            {event.activities.boothItems && (
              <div>
                <p className="text-sm font-medium text-gray-500">Booth Items</p>
                <p className="text-gray-900">{event.activities.boothItems}</p>
              </div>
            )}
            {event.activities.sample && (
              <div>
                <p className="text-sm font-medium text-gray-500">Sample</p>
                <p className="text-gray-900">{event.activities.sample}</p>
              </div>
            )}
            {event.activities.eventFlow && (
              <div>
                <p className="text-sm font-medium text-gray-500">Event Flow</p>
                <p className="text-gray-900">{event.activities.eventFlow}</p>
              </div>
            )}
          </div>
        </section>

        {/* Products */}
        {event.products.length > 0 && (
          <section className="mb-8 break-inside-avoid">
            <h2 className="text-xl font-bold text-gray-900 mb-4 border-b border-gray-300 pb-2">
              Products
            </h2>
            <table className="w-full border border-gray-300 text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border border-gray-300 px-2 py-2 text-left">Image</th>
                  <th className="border border-gray-300 px-2 py-2 text-left">Product</th>
                  <th className="border border-gray-300 px-2 py-2 text-left">Variant/Scent</th>
                  <th className="border border-gray-300 px-2 py-2 text-left">Size</th>
                  <th className="border border-gray-300 px-2 py-2 text-right">Price</th>
                  <th className="border border-gray-300 px-2 py-2 text-right">QTY</th>
                  <th className="border border-gray-300 px-2 py-2 text-right">Sold QTY</th>
                  <th className="border border-gray-300 px-2 py-2 text-center">Sold</th>
                </tr>
              </thead>
              <tbody>
                {event.products.map((product) => (
                  <tr key={product.id} className={product.sold ? "bg-green-50" : ""}>
                    <td className="border border-gray-300 px-2 py-2">
                      {product.image ? (
                        <img
                          src={product.image}
                          alt={product.product}
                          className="w-12 h-12 object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-gray-200 flex items-center justify-center text-xs text-gray-400">
                          No img
                        </div>
                      )}
                    </td>
                    <td className="border border-gray-300 px-2 py-2">{product.product}</td>
                    <td className="border border-gray-300 px-2 py-2">{product.variant}</td>
                    <td className="border border-gray-300 px-2 py-2">{product.size}</td>
                    <td className="border border-gray-300 px-2 py-2 text-right">₱{product.price.toFixed(2)}</td>
                    <td className="border border-gray-300 px-2 py-2 text-right">{product.qty}</td>
                    <td className="border border-gray-300 px-2 py-2 text-right">{product.soldQty || 0}</td>
                    <td className="border border-gray-300 px-2 py-2 text-center">
                      {product.sold ? "✓" : ""}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}
      </div>
    </div>
  );
}

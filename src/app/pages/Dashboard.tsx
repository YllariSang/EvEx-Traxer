import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router";
import { logout } from "../utils/auth";
import { storage } from "../lib/storage";
import { Event } from "../types";
import { Plus, LogOut, Calendar, MapPin, Users, Trash2, Printer, FileDown, Upload, FileSpreadsheet } from "lucide-react";
import { format } from "date-fns";
import * as XLSX from "xlsx";
import { StorageWarning } from "../components/StorageWarning";

export default function Dashboard() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = () => {
    setLoading(true);
    const fetchedEvents = storage.getEvents();
    setEvents(fetchedEvents);
    setLoading(false);
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleCreateEvent = () => {
    navigate("/create");
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this event?")) {
      storage.deleteEvent(id);
      loadEvents();
    }
  };

  const downloadTemplate = () => {
    // Create a blank template workbook
    const wb = XLSX.utils.book_new();

    // Event Information Sheet
    const eventInfoData = [
      ["EVENT INFORMATION"],
      [],
      ["INSTRUCTIONS:"],
      ["- Fill in the information next to each label"],
      ["- For Date & Time, use format: YYYY-MM-DD HH:MM (e.g., 2026-06-15 14:00)"],
      ["- For Expected Attendees, enter a number"],
      [],
      [],
      ["Event Name", ""],
      ["Address", ""],
      ["Date & Time", ""],
      ["Point of Contact", ""],
      ["Expected Attendees", ""],
      ["Description", ""],
    ];
    const wsEventInfo = XLSX.utils.aoa_to_sheet(eventInfoData);
    XLSX.utils.book_append_sheet(wb, wsEventInfo, "Event Information");

    // Expenses Sheet
    const expensesData = [
      ["MARKETING EXPENSES"],
      [],
      ["INSTRUCTIONS:"],
      ["- Transportation and Meal Allowance: Enter total amount in the Amount column"],
      ["- For custom expenses: Add new rows with expense name, quantity, unit price, and amount"],
      ["- You can remove the ₱ symbol or leave it - the system will parse both"],
      ["- Amount will be calculated as Quantity × Unit Price"],
      [],
      [],
      ["Expense Type", "Quantity", "Unit Price", "Amount"],
      ["Transportation", "-", "-", "0"],
      ["Meal Allowance", "-", "-", "0"],
      ["", "", "", ""],
    ];
    const wsExpenses = XLSX.utils.aoa_to_sheet(expensesData);
    XLSX.utils.book_append_sheet(wb, wsExpenses, "Expenses");

    // Activities Sheet
    const activitiesData = [
      ["ACTIVITIES"],
      [],
      ["INSTRUCTIONS:"],
      ["- Fill in descriptions for each activity type"],
      ["- Leave blank if not applicable"],
      [],
      [],
      ["Activity Type", "Description"],
      ["Giveaway", ""],
      ["Selling", ""],
      ["Booth Items", ""],
      ["Sample", ""],
      ["Event Flow", ""],
    ];
    const wsActivities = XLSX.utils.aoa_to_sheet(activitiesData);
    XLSX.utils.book_append_sheet(wb, wsActivities, "Activities");

    // Products Sheet
    const productsData = [
      ["PRODUCTS"],
      [],
      ["INSTRUCTIONS:"],
      ["- Add one product per row"],
      ["- Price should be numeric (₱ symbol optional)"],
      ["- QTY = total quantity, Sold QTY = quantity sold"],
      ["- Sold column: Use 'Yes' or 'No'"],
      [],
      [],
      ["Product", "Variant/Scent", "Size", "Price", "QTY", "Sold QTY", "Sold"],
      ["", "", "", "0", "0", "0", "No"],
    ];
    const wsProducts = XLSX.utils.aoa_to_sheet(productsData);
    XLSX.utils.book_append_sheet(wb, wsProducts, "Products");

    // Generate filename
    const fileName = `Event_Template_${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
    
    // Write file
    XLSX.writeFile(wb, fileName);
  };

  const importFromExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = evt.target?.result;
        const workbook = XLSX.read(data, { type: "binary" });

        // Helper function to find sheet by name (case-insensitive, flexible)
        const findSheet = (names: string[]) => {
          const sheetNames = workbook.SheetNames;
          for (const name of names) {
            const found = sheetNames.find(
              (sn) => sn.toLowerCase().includes(name.toLowerCase())
            );
            if (found) return workbook.Sheets[found];
          }
          return null;
        };

        // Helper function to find field value (case-insensitive, flexible)
        const findFieldValue = (data: any[][], fieldNames: string[]) => {
          for (const row of data) {
            if (row[0] && row.length >= 2) {
              const fieldStr = String(row[0]).toLowerCase().trim();
              
              // Skip title/header rows (all caps, no second column value, or too short)
              if (fieldStr === fieldStr.toUpperCase() && fieldStr.length < 20) continue;
              if (fieldStr.includes("instruction")) continue;
              
              for (const fieldName of fieldNames) {
                const searchTerm = fieldName.toLowerCase();
                // More precise matching: field should start with or exactly match the search term
                if (fieldStr === searchTerm || fieldStr.startsWith(searchTerm)) {
                  // Ensure we always return a string
                  return row[1] !== undefined && row[1] !== null ? String(row[1]) : "";
                }
              }
            }
          }
          return "";
        };

        // Helper function to parse currency/numeric values
        const parseAmount = (str: any) => {
          if (!str) return 0;
          const cleaned = String(str).replace(/[₱,\s]/g, "");
          return parseFloat(cleaned) || 0;
        };

        // Helper function to parse date
        const parseDate = (dateStr: any) => {
          if (!dateStr || dateStr === "No date set" || dateStr === "") return "";
          
          try {
            // Handle Excel date serial numbers
            if (typeof dateStr === 'number') {
              const excelEpoch = new Date(1899, 11, 30);
              const parsedDate = new Date(excelEpoch.getTime() + dateStr * 86400000);
              if (!isNaN(parsedDate.getTime())) {
                return parsedDate.toISOString().slice(0, 16);
              }
            }
            
            // Handle string dates
            const parsedDate = new Date(dateStr);
            if (!isNaN(parsedDate.getTime())) {
              return parsedDate.toISOString().slice(0, 16);
            }
          } catch (e) {
            console.error("Error parsing date:", e);
          }
          
          return "";
        };

        // Initialize event with defaults
        const newEvent: Event = {
          id: crypto.randomUUID(),
          name: "",
          address: "",
          dateTime: "",
          poc: "",
          description: "",
          expectedAttendees: 0,
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

        // Parse Event Information sheet (flexible sheet name matching)
        const eventInfoSheet = findSheet(["Event Information", "Event Info", "Event", "Info"]);
        if (eventInfoSheet) {
          const eventInfoData = XLSX.utils.sheet_to_json(eventInfoSheet, { header: 1 }) as any[][];
          
          newEvent.name = findFieldValue(eventInfoData, ["Event Name", "Name", "Event"]);
          newEvent.address = findFieldValue(eventInfoData, ["Address", "Location", "Venue"]);
          newEvent.poc = findFieldValue(eventInfoData, ["Point of Contact", "POC", "Contact", "Contact Person"]);
          newEvent.description = findFieldValue(eventInfoData, ["Description", "Details", "Info"]);
          
          const dateValue = findFieldValue(eventInfoData, ["Date & Time", "Date and Time", "DateTime", "Date", "Time"]);
          newEvent.dateTime = parseDate(dateValue);
          
          const attendeesValue = findFieldValue(eventInfoData, ["Expected Attendees", "Attendees", "Expected", "Participants"]);
          newEvent.expectedAttendees = parseAmount(attendeesValue);
        }

        // Parse Expenses sheet (flexible sheet name matching)
        const expensesSheet = findSheet(["Expenses", "Marketing Expenses", "Costs", "Budget"]);
        if (expensesSheet) {
          const expensesData = XLSX.utils.sheet_to_json(expensesSheet, { header: 1 }) as any[][];
          
          expensesData.forEach((row, index) => {
            // Skip header rows, instruction rows, and empty rows (rows 0-9 in template)
            if (index < 10 || !row[0]) return;
            
            const expenseType = String(row[0]).trim();
            const expenseTypeLower = expenseType.toLowerCase();
            const quantity = row[1];
            const unitPriceStr = row[2];
            const amountStr = row[3];

            // Skip instruction rows and total rows
            if (expenseTypeLower.includes("instruction") || expenseTypeLower.includes("total")) return;

            if (expenseTypeLower.includes("transportation") || expenseTypeLower.includes("transpo")) {
              newEvent.expenses.transpo = parseAmount(amountStr);
            } else if (expenseTypeLower.includes("meal") || expenseTypeLower.includes("allowance")) {
              newEvent.expenses.mealAllowance = parseAmount(amountStr);
            } else if (expenseType) {
              // Custom expense
              newEvent.expenses.customExpenses.push({
                id: crypto.randomUUID(),
                name: expenseType,
                quantity: parseAmount(quantity) || 1,
                unitPrice: parseAmount(unitPriceStr),
                amount: parseAmount(amountStr),
              });
            }
          });
        }

        // Parse Activities sheet (flexible sheet name matching)
        const activitiesSheet = findSheet(["Activities", "Activity", "Event Activities"]);
        if (activitiesSheet) {
          const activitiesData = XLSX.utils.sheet_to_json(activitiesSheet, { header: 1 }) as any[][];
          
          newEvent.activities.giveaway = findFieldValue(activitiesData, ["Giveaway", "Giveaways"]);
          newEvent.activities.selling = findFieldValue(activitiesData, ["Selling", "Sales", "Sell"]);
          newEvent.activities.boothItems = findFieldValue(activitiesData, ["Booth Items", "Booth", "Items"]);
          newEvent.activities.sample = findFieldValue(activitiesData, ["Sample", "Samples", "Sampling"]);
          newEvent.activities.eventFlow = findFieldValue(activitiesData, ["Event Flow", "Flow", "Program", "Schedule"]);
        }

        // Parse Products sheet (flexible sheet name matching)
        const productsSheet = findSheet(["Products", "Product", "Items", "Inventory"]);
        if (productsSheet) {
          const productsData = XLSX.utils.sheet_to_json(productsSheet, { header: 1 }) as any[][];
          
          productsData.forEach((row, index) => {
            // Skip header rows, instruction rows, and empty rows (rows 0-9 in template)
            if (index < 10 || !row[0]) return;
            
            const [product, variant, size, priceStr, qty, soldQty, soldStr] = row;
            const productStr = String(product).trim();
            
            // Skip instruction rows and header rows
            if (productStr.toLowerCase().includes("instruction") || 
                productStr.toLowerCase().includes("product")) return;
            
            if (productStr) {
              newEvent.products.push({
                id: crypto.randomUUID(),
                product: productStr,
                variant: variant ? String(variant) : "",
                size: size ? String(size) : "",
                price: parseAmount(priceStr),
                qty: parseAmount(qty),
                soldQty: parseAmount(soldQty),
                sold: soldStr ? String(soldStr).toLowerCase().includes("yes") : false,
                image: "",
              });
            }
          });
        }

        // Validate that at least event name is provided
        if (!newEvent.name || newEvent.name.trim() === "") {
          alert("Please provide at least an Event Name in the Excel file.");
          return;
        }

        // Save the imported event
        storage.addEvent(newEvent);
        loadEvents();
        
        // Show success message
        alert(`Event "${newEvent.name}" imported successfully!`);
      } catch (error) {
        console.error("Error importing Excel file:", error);
        alert("Error importing Excel file. Please make sure the file format is correct.");
      }
    };

    reader.readAsBinaryString(file);
    // Reset the input so the same file can be imported again
    e.target.value = "";
  };

  const exportEventToExcel = (event: Event) => {
    // Create workbook
    const wb = XLSX.utils.book_new();

    // Event Information Sheet - Match template format for import compatibility
    const eventInfoData = [
      ["EVENT INFORMATION"],
      [],
      ["INSTRUCTIONS:"],
      ["- Fill in the information next to each label"],
      ["- For Date & Time, use format: YYYY-MM-DD HH:MM (e.g., 2026-06-15 14:00)"],
      ["- For Expected Attendees, enter a number"],
      [],
      [],
      ["Event Name", event.name],
      ["Address", event.address],
      ["Date & Time", event.dateTime && !isNaN(new Date(event.dateTime).getTime()) ? format(new Date(event.dateTime), "yyyy-MM-dd HH:mm") : ""],
      ["Point of Contact", event.poc],
      ["Expected Attendees", event.expectedAttendees],
      ["Description", event.description],
    ];
    const wsEventInfo = XLSX.utils.aoa_to_sheet(eventInfoData);
    XLSX.utils.book_append_sheet(wb, wsEventInfo, "Event Information");

    // Expenses Sheet - Match template format for import compatibility
    const totalExpenses =
      event.expenses.transpo +
      event.expenses.mealAllowance +
      event.expenses.customExpenses.reduce((sum, exp) => sum + exp.amount, 0);

    const expensesData = [
      ["MARKETING EXPENSES"],
      [],
      ["INSTRUCTIONS:"],
      ["- Transportation and Meal Allowance: Enter total amount in the Amount column"],
      ["- For custom expenses: Add new rows with expense name, quantity, unit price, and amount"],
      ["- You can remove the ₱ symbol or leave it - the system will parse both"],
      ["- Amount will be calculated as Quantity × Unit Price"],
      [],
      [],
      ["Expense Type", "Quantity", "Unit Price", "Amount"],
      ["Transportation", "-", "-", event.expenses.transpo],
      ["Meal Allowance", "-", "-", event.expenses.mealAllowance],
      ...event.expenses.customExpenses.map((exp) => [
        exp.name,
        exp.quantity || 1,
        exp.unitPrice || 0,
        exp.amount || 0,
      ]),
    ];
    const wsExpenses = XLSX.utils.aoa_to_sheet(expensesData);
    XLSX.utils.book_append_sheet(wb, wsExpenses, "Expenses");

    // Activities Sheet - Match template format for import compatibility
    const activitiesData = [
      ["ACTIVITIES"],
      [],
      ["INSTRUCTIONS:"],
      ["- Fill in descriptions for each activity type"],
      ["- Leave blank if not applicable"],
      [],
      [],
      ["Activity Type", "Description"],
      ["Giveaway", event.activities.giveaway || ""],
      ["Selling", event.activities.selling || ""],
      ["Booth Items", event.activities.boothItems || ""],
      ["Sample", event.activities.sample || ""],
      ["Event Flow", event.activities.eventFlow || ""],
    ];
    const wsActivities = XLSX.utils.aoa_to_sheet(activitiesData);
    XLSX.utils.book_append_sheet(wb, wsActivities, "Activities");

    // Products Sheet - Match template format for import compatibility
    const productsData = [
      ["PRODUCTS"],
      [],
      ["INSTRUCTIONS:"],
      ["- Add one product per row"],
      ["- Price should be numeric (₱ symbol optional)"],
      ["- QTY = total quantity, Sold QTY = quantity sold"],
      ["- Sold column: Use 'Yes' or 'No'"],
      [],
      [],
      ["Product", "Variant/Scent", "Size", "Price", "QTY", "Sold QTY", "Sold"],
      ...event.products.map((prod) => [
        prod.product,
        prod.variant,
        prod.size,
        prod.price,
        prod.qty,
        prod.soldQty || 0,
        prod.sold ? "Yes" : "No",
      ]),
    ];
    const wsProducts = XLSX.utils.aoa_to_sheet(productsData);
    XLSX.utils.book_append_sheet(wb, wsProducts, "Products");

    // Generate readable filename with event name and date
    // Keep spaces and basic punctuation for readability
    const sanitizedName = event.name
      .replace(/[<>:"/\\|?*]/g, '') // Remove only invalid filename characters
      .replace(/\s+/g, ' ') // Normalize multiple spaces to single space
      .trim()
      .slice(0, 50); // Limit length to 50 characters
    
    const dateStr = format(new Date(), 'yyyy-MM-dd');
    const fileName = `${sanitizedName} - ${dateStr}.xlsx`;
    
    // Write file
    XLSX.writeFile(wb, fileName);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading events...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Event & Expense Tracker</h1>
              <p className="text-sm text-gray-600 mt-1">Manage your events and marketing expenses</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">All Events</h2>
          <div className="flex gap-2">
            <button
              onClick={handleCreateEvent}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Create Event
            </button>
            <label
              htmlFor="importExcel"
              className="flex items-center gap-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors cursor-pointer"
            >
              <Upload className="w-5 h-5" />
              Import Excel
            </label>
            <input
              type="file"
              id="importExcel"
              className="hidden"
              accept=".xlsx, .xls"
              onChange={importFromExcel}
            />
            <button
              onClick={downloadTemplate}
              className="flex items-center gap-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
            >
              <FileSpreadsheet className="w-5 h-5" />
              Download Template
            </button>
          </div>
        </div>

        {events.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No events yet</h3>
            <p className="text-gray-600 mb-6">Get started by creating your first event</p>
            <button
              onClick={handleCreateEvent}
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Create Event
            </button>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {events.map((event) => (
              <div
                key={event.id}
                className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow border border-gray-200"
              >
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">{event.name}</h3>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex items-start gap-2 text-sm text-gray-600">
                      <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <span className="line-clamp-2">{event.address}</span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="w-4 h-4 flex-shrink-0" />
                      <span>
                        {event.dateTime && !isNaN(new Date(event.dateTime).getTime()) 
                          ? format(new Date(event.dateTime), "MMM d, yyyy 'at' h:mm a") 
                          : "No date set"}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Users className="w-4 h-4 flex-shrink-0" />
                      <span>{event.expectedAttendees} expected attendees</span>
                    </div>
                  </div>

                  {event.description && (
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">{event.description}</p>
                  )}

                  <div className="pt-4 border-t flex items-center gap-2">
                    <Link
                      to={`/event/${event.id}`}
                      className="flex-1 text-center bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
                    >
                      View Details
                    </Link>
                    <Link
                      to={`/event/${event.id}/print`}
                      className="p-2 text-gray-600 hover:bg-gray-100 rounded transition-colors"
                      title="Print"
                    >
                      <Printer className="w-5 h-5" />
                    </Link>
                    <button
                      onClick={() => handleDelete(event.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => exportEventToExcel(event)}
                      className="p-2 text-gray-600 hover:bg-gray-100 rounded transition-colors"
                      title="Export to Excel"
                    >
                      <FileDown className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
      <StorageWarning />
    </div>
  );
}
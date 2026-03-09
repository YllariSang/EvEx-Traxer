import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router";
import { ArrowLeft, Printer, Plus, Trash2, Save, Upload, FileDown } from "lucide-react";
import { storage } from "../lib/storage";
import { Event, CustomExpense, Product } from "../types";
import { EditLog } from "../components/EditLog";
import { StorageWarning } from "../components/StorageWarning";
import * as XLSX from "xlsx";
import { format } from "date-fns";
import { compressImage } from "../utils/imageCompression";

export default function EventDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [event, setEvent] = useState<Event | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (id) {
      loadEvent();
    }
  }, [id]);

  const loadEvent = () => {
    if (id) {
      const foundEvent = storage.getEvent(id);
      if (foundEvent) {
        setEvent(foundEvent);
      } else {
        navigate("/dashboard");
      }
    }
  };

  if (!event) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  const saveEvent = () => {
    if (id) {
      try {
        storage.updateEvent(id, event);
        setIsEditing(false);
        // Reload to get the updated edit log
        loadEvent();
      } catch (error) {
        console.error('Error saving event:', error);
        if (error instanceof Error) {
          alert(`Failed to save event: ${error.message}\n\nTip: Try removing or replacing some product images with smaller ones.`);
        } else {
          alert('Failed to save event. Please try again.');
        }
      }
    }
  };

  const exportToExcel = () => {
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

  const updateEventField = (field: keyof Event, value: any) => {
    setEvent((prev) => prev ? { ...prev, [field]: value } : null);
  };

  const updateExpense = (field: keyof Event["expenses"], value: any) => {
    setEvent((prev) =>
      prev
        ? {
            ...prev,
            expenses: {
              ...prev.expenses,
              [field]: value,
            },
          }
        : null
    );
  };

  const addCustomExpense = () => {
    const newExpense: CustomExpense = {
      id: crypto.randomUUID(),
      name: "",
      quantity: 1,
      unitPrice: 0,
      amount: 0,
    };
    setEvent((prev) =>
      prev
        ? {
            ...prev,
            expenses: {
              ...prev.expenses,
              customExpenses: [...prev.expenses.customExpenses, newExpense],
            },
          }
        : null
    );
  };

  const updateCustomExpense = (id: string, field: keyof CustomExpense, value: any) => {
    setEvent((prev) => {
      if (!prev) return null;
      
      const updatedExpenses = prev.expenses.customExpenses.map((exp) => {
        if (exp.id === id) {
          const updated = { ...exp, [field]: value };
          // Auto-calculate amount when quantity or unitPrice changes
          if (field === 'quantity' || field === 'unitPrice') {
            updated.amount = updated.quantity * updated.unitPrice;
          }
          return updated;
        }
        return exp;
      });

      return {
        ...prev,
        expenses: {
          ...prev.expenses,
          customExpenses: updatedExpenses,
        },
      };
    });
  };

  const deleteCustomExpense = (id: string) => {
    setEvent((prev) =>
      prev
        ? {
            ...prev,
            expenses: {
              ...prev.expenses,
              customExpenses: prev.expenses.customExpenses.filter(
                (exp) => exp.id !== id
              ),
            },
          }
        : null
    );
  };

  const updateActivity = (field: keyof Event["activities"], value: string) => {
    setEvent((prev) =>
      prev
        ? {
            ...prev,
            activities: {
              ...prev.activities,
              [field]: value,
            },
          }
        : null
    );
  };

  const addProduct = () => {
    const newProduct: Product = {
      id: crypto.randomUUID(),
      price: 0,
      product: "",
      variant: "",
      size: "",
      qty: 0,
      image: "",
      sold: false,
      soldQty: 0,
    };
    setEvent((prev) =>
      prev ? { ...prev, products: [...prev.products, newProduct] } : null
    );
  };

  const updateProduct = (id: string, field: keyof Product, value: any) => {
    setEvent((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        products: prev.products.map((prod) =>
          prod.id === id ? { ...prod, [field]: value } : prod
        ),
      };
    });
  };

  const deleteProduct = (id: string) => {
    setEvent((prev) =>
      prev
        ? { ...prev, products: prev.products.filter((prod) => prod.id !== id) }
        : null
    );
  };

  const handleImageUpload = async (productId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        // Compress the image before storing
        const compressedImage = await compressImage(file);
        updateProduct(productId, "image", compressedImage);
      } catch (error) {
        console.error('Error compressing image:', error);
        alert('Failed to process image. Please try a different image.');
      }
    }
  };

  const totalExpenses =
    event.expenses.transpo +
    event.expenses.mealAllowance +
    event.expenses.customExpenses.reduce((sum, exp) => sum + exp.amount, 0);

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Events
          </Link>
          <div className="flex gap-3">
            {isEditing ? (
              <button
                onClick={saveEvent}
                className="inline-flex items-center gap-2 bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                <Save className="w-5 h-5" />
                Save Changes
              </button>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Edit Event
              </button>
            )}
            <Link
              to={`/event/${id}/print`}
              className="inline-flex items-center gap-2 bg-gray-800 text-white px-6 py-2 rounded-lg hover:bg-gray-900 transition-colors"
            >
              <Printer className="w-5 h-5" />
              Print
            </Link>
            <button
              onClick={exportToExcel}
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <FileDown className="w-5 h-5" />
              Export to Excel
            </button>
          </div>
        </div>

        {/* Event Information */}
        <div className="bg-white rounded-lg shadow-sm p-8 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Event Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Event Name</label>
              <input
                type="text"
                value={event.name}
                onChange={(e) => updateEventField("name", e.target.value)}
                disabled={!isEditing}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-600"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
              <input
                type="text"
                value={event.address}
                onChange={(e) => updateEventField("address", e.target.value)}
                disabled={!isEditing}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-600"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date & Time</label>
              <input
                type="datetime-local"
                value={event.dateTime}
                onChange={(e) => updateEventField("dateTime", e.target.value)}
                disabled={!isEditing}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-600"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Point of Contact</label>
              <input
                type="text"
                value={event.poc}
                onChange={(e) => updateEventField("poc", e.target.value)}
                disabled={!isEditing}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-600"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Expected Attendees</label>
              <input
                type="number"
                value={event.expectedAttendees}
                onChange={(e) => updateEventField("expectedAttendees", Number(e.target.value))}
                disabled={!isEditing}
                min="0"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-600"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea
                value={event.description}
                onChange={(e) => updateEventField("description", e.target.value)}
                disabled={!isEditing}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-600"
                placeholder="Describe the event"
              />
            </div>
          </div>
        </div>

        {/* Expenses */}
        <div className="bg-white rounded-lg shadow-sm p-8 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Expenses</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Transportation</label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-gray-500">₱</span>
                <input
                  type="number"
                  value={event.expenses.transpo}
                  onChange={(e) => updateExpense("transpo", Number(e.target.value))}
                  disabled={!isEditing}
                  min="0"
                  step="0.01"
                  className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-600"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Meal Allowance</label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-gray-500">₱</span>
                <input
                  type="number"
                  value={event.expenses.mealAllowance}
                  onChange={(e) => updateExpense("mealAllowance", Number(e.target.value))}
                  disabled={!isEditing}
                  min="0"
                  step="0.01"
                  className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-600"
                />
              </div>
            </div>
          </div>

          <div className="mb-4">
            <div className="flex justify-between items-center mb-3">
              <label className="block text-sm font-medium text-gray-700">Custom Expenses</label>
              {isEditing && (
                <button
                  onClick={addCustomExpense}
                  className="inline-flex items-center gap-2 bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add Expense
                </button>
              )}
            </div>
            
            {event.expenses.customExpenses.length > 0 ? (
              <div className="space-y-3">
                {event.expenses.customExpenses.map((expense) => (
                  <div key={expense.id} className="flex gap-3 items-start bg-gray-50 p-3 rounded-lg">
                    <input
                      type="text"
                      value={expense.name}
                      onChange={(e) => updateCustomExpense(expense.id, "name", e.target.value)}
                      disabled={!isEditing}
                      placeholder="Expense name"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-transparent disabled:border-transparent"
                    />
                    <div className="w-24">
                      <input
                        type="number"
                        value={expense.quantity}
                        onChange={(e) => updateCustomExpense(expense.id, "quantity", Number(e.target.value))}
                        disabled={!isEditing}
                        min="0"
                        placeholder="Qty"
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-transparent disabled:border-transparent"
                      />
                    </div>
                    <div className="w-32">
                      <div className="relative">
                        <span className="absolute left-2 top-2 text-gray-500 text-sm">₱</span>
                        <input
                          type="number"
                          value={expense.unitPrice}
                          onChange={(e) => updateCustomExpense(expense.id, "unitPrice", Number(e.target.value))}
                          disabled={!isEditing}
                          min="0"
                          step="0.01"
                          placeholder="Unit price"
                          className="w-full pl-6 pr-2 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-transparent disabled:border-transparent"
                        />
                      </div>
                    </div>
                    <div className="w-32 px-3 py-2 bg-gray-100 rounded text-gray-700 font-medium">
                      ₱{expense.amount.toFixed(2)}
                    </div>
                    {isEditing && (
                      <button
                        onClick={() => deleteCustomExpense(expense.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No custom expenses added</p>
            )}
          </div>

          <div className="pt-4 border-t">
            <div className="flex justify-between items-center text-lg font-bold">
              <span>Total Expenses:</span>
              <span className="text-blue-600">₱{totalExpenses.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Activities */}
        <div className="bg-white rounded-lg shadow-sm p-8 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Activities</h2>
          <div className="grid grid-cols-1 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Giveaway</label>
              <textarea
                value={event.activities.giveaway}
                onChange={(e) => updateActivity("giveaway", e.target.value)}
                disabled={!isEditing}
                rows={2}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-600"
                placeholder="Describe giveaway activities"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Selling</label>
              <textarea
                value={event.activities.selling}
                onChange={(e) => updateActivity("selling", e.target.value)}
                disabled={!isEditing}
                rows={2}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-600"
                placeholder="Describe selling activities"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Booth Items</label>
              <textarea
                value={event.activities.boothItems}
                onChange={(e) => updateActivity("boothItems", e.target.value)}
                disabled={!isEditing}
                rows={2}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-600"
                placeholder="List booth items"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Sample</label>
              <textarea
                value={event.activities.sample}
                onChange={(e) => updateActivity("sample", e.target.value)}
                disabled={!isEditing}
                rows={2}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-600"
                placeholder="Describe sample activities"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Event Flow</label>
              <textarea
                value={event.activities.eventFlow}
                onChange={(e) => updateActivity("eventFlow", e.target.value)}
                disabled={!isEditing}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-600"
                placeholder="Describe the event flow"
              />
            </div>
          </div>
        </div>

        {/* Products Table */}
        <div className="bg-white rounded-lg shadow-sm p-8 mb-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Products</h2>
            {isEditing && (
              <button
                onClick={addProduct}
                className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Product
              </button>
            )}
          </div>

          {event.products.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Image</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Variant/Scent</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Size</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Qty</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sold</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sold Qty</th>
                    {isEditing && (
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {event.products.map((product) => (
                    <tr key={product.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {product.image ? (
                            <img
                              src={product.image}
                              alt={product.product}
                              className="w-16 h-16 object-cover rounded"
                            />
                          ) : (
                            <div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center text-gray-400 text-xs">
                              No image
                            </div>
                          )}
                          {isEditing && (
                            <label className="cursor-pointer">
                              <Upload className="w-5 h-5 text-blue-600" />
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => handleImageUpload(product.id, e)}
                                className="hidden"
                              />
                            </label>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="text"
                          value={product.product}
                          onChange={(e) => updateProduct(product.id, "product", e.target.value)}
                          disabled={!isEditing}
                          className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-transparent disabled:border-transparent"
                          placeholder="Product name"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="text"
                          value={product.variant}
                          onChange={(e) => updateProduct(product.id, "variant", e.target.value)}
                          disabled={!isEditing}
                          className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-transparent disabled:border-transparent"
                          placeholder="Variant"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="text"
                          value={product.size}
                          onChange={(e) => updateProduct(product.id, "size", e.target.value)}
                          disabled={!isEditing}
                          className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-transparent disabled:border-transparent"
                          placeholder="Size"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="relative">
                          <span className="absolute left-2 top-1 text-gray-500 text-sm">₱</span>
                          <input
                            type="number"
                            value={product.price}
                            onChange={(e) => updateProduct(product.id, "price", Number(e.target.value))}
                            disabled={!isEditing}
                            min="0"
                            step="0.01"
                            className="w-24 pl-6 pr-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-transparent disabled:border-transparent"
                          />
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          value={product.qty}
                          onChange={(e) => updateProduct(product.id, "qty", Number(e.target.value))}
                          disabled={!isEditing}
                          min="0"
                          className="w-20 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-transparent disabled:border-transparent"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={product.sold}
                          onChange={(e) => updateProduct(product.id, "sold", e.target.checked)}
                          disabled={!isEditing}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 disabled:opacity-50"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          value={product.soldQty}
                          onChange={(e) => updateProduct(product.id, "soldQty", Number(e.target.value))}
                          disabled={!isEditing}
                          min="0"
                          max={product.qty}
                          className="w-20 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-transparent disabled:border-transparent"
                        />
                      </td>
                      {isEditing && (
                        <td className="px-4 py-3">
                          <button
                            onClick={() => deleteProduct(product.id)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No products added yet</p>
          )}
        </div>

        {/* Edit Log */}
        <div className="mt-6">
          <EditLog editLog={event.editLog || []} />
        </div>
      </div>
    </div>
  );
}
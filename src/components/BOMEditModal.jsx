import React, { useState, useEffect } from "react";
import "./EditModal.css";

const BOMEditModal = ({ rowData, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    id: "",
    item_id: "",
    component_id: "",
    quantity: "",
    created_by: "",
    last_updated_by: "",
    createdAt: "",
    updatedAt: "",
  });
  const [errors, setErrors] = useState([]);

  useEffect(() => {
    if (rowData) {
      setFormData({
        id: rowData.id || "",
        item_id: rowData.item_id || "",
        component_id: rowData.component_id || "",
        quantity: rowData.quantity || "",
        created_by: rowData.created_by || "",
        last_updated_by: rowData.last_updated_by || "",
        createdAt: rowData.createdAt || "",
        updatedAt: rowData.updatedAt || "",
      });
    }
  }, [rowData]);

  const getStoredData = (key) => {
    const storedData = localStorage.getItem(key);
    return storedData ? JSON.parse(storedData) : [];
  };

  const validateData = () => {
    const errors = [];
    const storedItems = getStoredData("items");
    const sellItemIds = storedItems
      .filter((item) => item.type === "sell")
      .map((item) => item.id);
    const purchaseIds = storedItems
      .filter((item) => item.type === "purchase")
      .map((item) => item.id);
    const existingItems = storedItems.map((item) => item.id);
    const {
      id,
    item_id,
    component_id,
    quantity,
    created_by,
    last_updated_by,
    createdAt,
    updatedAt,
    }=formData;

    if (sellItemIds.includes(Number(component_id))) {
      errors.push(
        `Sell item (${component_id}) cannot be used as a component.`
      );
    }

    // Validate that the item_id is not a 'purchase' item
    if (purchaseIds.includes(Number(item_id))) {
      errors.push(
        `Purchase item (${item_id}) cannot be used as component.`
      );
    }

    // Validate duplicate item_id and component_id combinations

    if (item_id === component_id) {
      errors.push(
        ` item_id (${item_id}) cannot be the same as component_id (${component_id}).`
      );
    }

    // Validate the quantity is between 1 and 100
    const qty = parseInt(quantity, 10);
    if (isNaN(qty) || qty < 1 || qty > 100) {
      errors.push(
         `Quantity (${quantity}) should be between 1 and 100.`
      );
    }

    // Validate that the item_id exists in the stored items
    if (!existingItems.includes(Number(item_id))) {
      errors.push(
         `BOM cannot be created for item_id (${item_id}) not created yet.`
      );
    }

    return errors;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validateData();
    
    if (validationErrors.length > 0) {
      setErrors(validationErrors); // Display validation errors
    } else {
      setErrors([]);

        const response = await fetch(`https://api-assignment.inveesync.in/bom/${formData.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        });
  
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Failed to save changes: ${errorText}`);
        }
  
        const updatedData = await response.json();
        console.log("Successfully saved changes:", updatedData);
  
        onSave(); 
        alert("Changes saved successfully!");
        onClose(); 

    }
  };
  



  return (
    <div className="modal">
      <div className="modal-content">
        <h2>Edit BOM Item</h2>
        <form onSubmit={handleSubmit}>
          {errors.length > 0 && (
            <div className="error-messages">
              <ul>
                {errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          )}
          <label>
            Item ID:
            <input
              type="text"
              name="item_id"
              value={formData.item_id}
              onChange={handleInputChange}
              required
            />
          </label>

          <label>
            Component ID:
            <input
              type="text"
              name="component_id"
              value={formData.component_id}
              onChange={handleInputChange}
              required
            />
          </label>

          <label>
            Quantity:
            <input
              type="number"
              name="quantity"
              value={formData.quantity}
              onChange={handleInputChange}
              required
            />
          </label>

          <label>
            Created By:
            <input
              type="text"
              name="created_by"
              value={formData.created_by}
              onChange={handleInputChange}
              required
            />
          </label>

          <label>
            Last Updated By:
            <input
              type="text"
              name="last_updated_by"
              value={formData.last_updated_by}
              onChange={handleInputChange}
              required
            />
          </label>

          <label>
            Created At:
            <input
              type="datetime-local"
              name="createdAt"
              value={formData.createdAt ? new Date(formData.createdAt).toISOString().slice(0, 16) : ""}
              onChange={handleInputChange}
              required
            />
          </label>

          <label>
            Updated At:
            <input
              type="datetime-local"
              name="updatedAt"
              value={formData.updatedAt ? new Date(formData.updatedAt).toISOString().slice(0, 16) : ""}
              onChange={handleInputChange}
              required
            />
          </label>

          <div className="modal-actions">
            <button type="submit">Save</button>
            <button type="button" onClick={onClose}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BOMEditModal;

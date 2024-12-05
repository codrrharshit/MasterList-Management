import React, { useState, useEffect } from "react";
import "./EditModal.css"
const EditModal = ({ rowData, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    internal_item_name: "",
    type: "",
    uom: "",
    avg_weight_needed: false,
    scrap_type: "",
    min_buffer: "",
    max_buffer: "",
  });
  const [errors, setErrors] = useState([]);
  useEffect(() => {
    if (rowData) {
      setFormData({
        internal_item_name: rowData.internal_item_name || "",
        type: rowData.type || "",
        uom: rowData.uom || "",
        avg_weight_needed: rowData.additional_attributes__avg_weight_needed|| false,
        scrap_type: rowData.additional_attributes__scrap_type || "",
        min_buffer: rowData.min_buffer || "",
        max_buffer: rowData.max_buffer || "",
      });
    }
  }, [rowData]);


  const validateData = () => {
    const errors = [];
    const {
      internal_item_name,
      type,
      uom,
      avg_weight_needed,
      scrap_type,
      min_buffer,
      max_buffer,
    } = formData;

    // Test Case 1 - Empty internal_item_name
    if (!internal_item_name) {
      errors.push("'Internal Item Name' is mandatory.");
    }

    // Test Case 2 - Invalid type value
    if (!['sell', 'purchase', 'component'].includes(type)) {
      errors.push("'Type' must be one of 'sell', 'purchase', or 'component'.");
    }

    // Test Case 3 - Invalid UoM value (not kgs/nos)
    if (!['kgs', 'nos'].includes(uom)) {
      errors.push("'UoM' must be either 'kgs' or 'nos'.");
    }

    // Test Case 4 - Empty scrap_type for sell item
    if (type === "sell" && !scrap_type) {
      errors.push("'Scrap Type' is required for 'sell' items.");
    }

    // Test Case 5 - Min and Max Buffer checks
    if (min_buffer === "" || isNaN(min_buffer)) {
      errors.push("'Min Buffer' must be a valid number.");
    } else if (parseFloat(min_buffer) < 0) {
      errors.push("'Min Buffer' cannot be negative.");
    }

    if (max_buffer === "" || isNaN(max_buffer)) {
      errors.push("'Max Buffer' must be a valid number.");
    } else if (parseFloat(max_buffer) < parseFloat(min_buffer)) {
      errors.push("'Max Buffer' must be greater than or equal to 'Min Buffer'.");
    }

    // Test Case 6 - avg_weight_needed must be a boolean
    if (typeof avg_weight_needed != "boolean") {
      errors.push("'Avg Weight Needed' must be true or false.");
    }

    return errors;
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const validationErrors = validateData();
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
    } else {
      setErrors([]);
      onSave(formData); // Save the edited data
      onClose(); // Close the modal
    }
  };

  return (
    <div className="modal">
      <div className="modal-content">
        <h2>Edit Item</h2>
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
            Internal Item Name:
            <input
              type="text"
              name="internal_item_name"
              value={formData.internal_item_name}
              onChange={handleInputChange}
              required
            />
          </label>

          <label>
            Type:
            <select
              name="type"
              value={formData.type}
              onChange={handleInputChange}
              required
            >
              <option value="">Select</option>
              <option value="sell">Sell</option>
              <option value="purchase">Purchase</option>
              <option value="component">Component</option>
            </select>
          </label>

          <label>
            UoM:
            <select
              name="uom"
              value={formData.uom}
              onChange={handleInputChange}
              required
            >
              <option value="">Select</option>
              <option value="kgs">Kgs</option>
              <option value="nos">Nos</option>
            </select>
          </label>

          <label>
            Avg Weight Needed:
            <input
              type="checkbox"
              name="avg_weight_needed"
              checked={formData.avg_weight_needed}
              onChange={handleInputChange}
            />
          </label>

          {/* Show Scrap Type only if the type is "sell" */}
          {formData.type === "sell" && (
            <label>
              Scrap Type:
              <input
                type="text"
                name="scrap_type"
                value={formData.scrap_type}
                onChange={handleInputChange}
                required
              />
            </label>
          )}

          <label>
            Min Buffer:
            <input
              type="number"
              name="min_buffer"
              value={formData.min_buffer}
              onChange={handleInputChange}
            />
          </label>

          <label>
            Max Buffer:
            <input
              type="number"
              name="max_buffer"
              value={formData.max_buffer}
              onChange={handleInputChange}
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

export default EditModal;

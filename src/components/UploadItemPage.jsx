import React, { useEffect, useState } from "react";
import Papa from "papaparse";
// import ItemTable from "./ItemTable"; // Import your table component
import "./UploadItemPage.css";
import { Link } from "react-router-dom";

const UploadItemPage = ({ setItems, items }) => {
  const [csvData, setCsvData] = useState([]);
  const [csvErrors, setCsvErrors] = useState([]);
  const [singleEntry, setSingleEntry] = useState({
    internal_item_name: "",
    tenant_id: "",
    type: "",
    uom: "",
    additional_attributes__scrap_type: "",
    min_buffer: "",
    max_buffer: "",
    additional_attributes__avg_weight_needed: "false",
    createdAt: "",
    updatedAt: "",
    created_by: "system_user",
    last_updated_by: "system_user",
  });
  const [activeMode, setActiveMode] = useState("single");
  const [lastId, setLastId] = useState(0);

  // Handle CSV file upload
  
  const handleCSVUpload = (e) => {
    setCsvErrors([]);
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target.result;
        parseCSV(text);
      };
      reader.readAsText(file);
    }
  };

  // Parse the uploaded CSV
  const parseCSV = (data) => {
    Papa.parse(data, {
      complete: (result) => {
        const parsedData = result.data;
        console.log("Parsed Data: ", parsedData);
        const filteredData = result.data.filter((row) =>
          Object.values(row).some((value) => value !== "")
        );
        console.log(filteredData);
        const errors = validateData(filteredData);
        if (errors.length === 0) {
          setCsvData(filteredData); // Set valid CSV data
        } else {
          setCsvErrors(errors); // Set errors
          setCsvData([]); // Clear invalid data
        }
      },
      header: true, // Assumes the first row contains the headers
    });
  };
  // new Validation Logic
  const validateData = (data) => {
    const errors = [];
    const seenItems = new Set(); // Track unique internal_item_name + tenant combinations

    data.forEach((item, index) => {
      const {
        internal_item_name,
        tenant_id,
        type,
        uom,
        additional_attributes__scrap_type,
        min_buffer,
        max_buffer,
        additional_attributes__avg_weight_needed,
        createdAt,
        updatedAt,
      } = item;

      // 1. Duplicate internal_item_name + tenant combination
      const itemKey = `${internal_item_name}-${tenant_id}`;
      if (seenItems.has(itemKey)) {
        errors.push(
          `Row ${
            index + 1
          }: Duplicate 'internal_item_name' and 'tenant' combination.`
        );
      } else {
        seenItems.add(itemKey);
      }

      // 2. Missing 'tenant_id'
      if (!tenant_id || tenant_id === "NaN") {
        errors.push(`Row ${index + 1}: 'tenant_id' is mandatory.`);
      }

      // 3. Invalid UoM value (not 'kgs' or 'nos')
      if (uom && !["kgs", "nos"].includes(uom.toLowerCase())) {
        errors.push(
          `Row ${index + 1}: Invalid UoM value. Must be 'kgs' or 'nos'.`
        );
      }

      // 4. min_buffer is required for 'purchase' or 'sell' types
      if (
        (type === "sell" || type === "purchase") &&
        (!min_buffer || isNaN(min_buffer))
      ) {
        errors.push(
          `Row ${index + 1}: 'min_buffer' is required and must be numeric.`
        );
      }

      // 5. avg_weight_needed must be a boolean (true/false)
      const avgWeight = String(
        additional_attributes__avg_weight_needed
      ).toLowerCase();
      if (avgWeight !== "true" && avgWeight !== "false") {
        errors.push(
          `Row ${index + 1}: 'avg_weight_needed' must be 'true' or 'false'.`
        );
      }

      // 6. scrap_type is required for 'sell' items
      if (
        type === "sell" &&
        (!additional_attributes__scrap_type ||
          additional_attributes__scrap_type === "")
      ) {
        errors.push(
          `Row ${index + 1}: 'scrap_type' is required for sell items.`
        );
      }

      // 7. Check if internal_item_name is missing
      if (!internal_item_name || internal_item_name === "") {
        errors.push(`Row ${index + 1}: 'internal_item_name' is mandatory.`);
      }

      // 8. Validate type value
      if (type && !["sell", "purchase", "component"].includes(type)) {
        errors.push(
          `Row ${
            index + 1
          }: 'type' must be one of 'sell', 'purchase', or 'component'.`
        );
      }

      // 9. Buffer validation: must be numeric and positive
      if (min_buffer && parseFloat(min_buffer) < 0) {
        errors.push(`Row ${index + 1}: 'min_buffer' cannot be negative.`);
      }
      if (max_buffer && parseFloat(max_buffer) < 0) {
        errors.push(`Row ${index + 1}: 'max_buffer' cannot be negative.`);
      }

      if (
        max_buffer &&
        min_buffer &&
        parseFloat(max_buffer) < parseFloat(min_buffer)
      ) {
        errors.push(
          `Row ${
            index + 1
          }: 'max_buffer' must be greater than or equal to 'min_buffer'.`
        );
      }

      // 10. Date validation for 'createdAt' and 'updatedAt'
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/; // Strict YYYY-MM-DD format
      const isoDateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/; // ISO 8601 format

      if (
        createdAt &&
        !createdAt.match(dateRegex) &&
        !createdAt.match(isoDateRegex)
      ) {
        errors.push(
          `Row ${
            index + 1
          }: Invalid 'createdAt' format. Expected 'YYYY-MM-DD' or ISO 8601.`
        );
      }

      if (
        updatedAt &&
        !updatedAt.match(dateRegex) &&
        !updatedAt.match(isoDateRegex)
      ) {
        errors.push(
          `Row ${
            index + 1
          }: Invalid 'updatedAt' format. Expected 'YYYY-MM-DD' or ISO 8601.`
        );
      }
    });
    
    return errors;
  };

  

  const handleSingleEntryChange = (e) => {
    const { name, value } = e.target;
    setSingleEntry((prev) => ({ ...prev, [name]: value }));
  };

  const handleSingleEntrySubmit = () => {
    const newId = lastId + 1;
    const errors = validateData([singleEntry]);
    if (errors.length === 0) {
      const entryWithId = {
        ...singleEntry,
        id: newId, // Assign new ID
      };
      setItems((prev) => [...prev, entryWithId]);
      alert("Item added successfully!");
      setSingleEntry({
        id: newId + 1,
        internal_item_name: "",
        tenant_id: "",
        type: "",
        uom: "",
        additional_attributes__scrap_type: "",
        min_buffer: "",
        max_buffer: "",
        additional_attributes__avg_weight_needed: "false",
        createdAt: "",
        updatedAt: "",
      });
    } else {
      alert(`Please fix the errors:\n${errors.join("\n")}`);
    }
  };

  const downloadCSVTemplate = () => {
    const templateData = [
      {
        internal_item_name: "Sample Item",
        type: "sell",
        uom: "kgs",
        avg_weight_needed: "false",
        scrap_type: "Plastic",
        min_buffer: "10",
        max_buffer: "20",
        created_by: "admin",
        last_updated_by: "admin",
        createdAt: "2024-12-01",
        updatedAt: "2024-12-01",
      },
      {
        internal_item_name: "Enter your item name here",
        type: "Enter the type (sell/purchase/component)",
        uom: "Enter UoM (kgs/nos)",
        avg_weight_needed: "Enter true/false for weight needed",
        scrap_type: "Enter the scrap type if sell item, else leave blank",
        min_buffer: "Enter min buffer (numeric)",
        max_buffer:
          "Enter max buffer (numeric, greater than or equal to min buffer)",
        created_by: "Enter who created this item",
        last_updated_by: "Enter the person updating this item",
        createdAt: "Enter creation date (YYYY-MM-DD)",
        updatedAt: "Enter update date (YYYY-MM-DD)",
      },
    ];

    const csv = Papa.unparse(templateData);

    const link = document.createElement("a");
    link.href = "data:text/csv;charset=utf-8," + encodeURIComponent(csv);
    link.target = "_blank";
    link.download = "item_template_with_validation.csv";

    link.click();
  };

  const handleSubmit = () => {
    if (csvData.length > 0) {
      console.log("Submitting bulk data:", csvData);
      const maxIdInBulk = csvData.reduce(
        (maxId, item) => Math.max(maxId, parseInt(item.id || 0)),
        lastId
      );
      setItems((prevstate) => [...prevstate, ...csvData]);
      setLastId(maxIdInBulk);
      alert("Items uploaded successfully!");
    } else {
      alert("No valid data to submit. Please fix the errors in your CSV.");
    }
  };

 
  
  useEffect(() => {
    if (items.length > 0) {
      const maxId = items.reduce(
        (maxId, item) => Math.max(maxId, parseInt(item.id || 0)),
        0
      );
      setLastId(maxId);
    }
  }, [items]);
  const linkStyle = {
    display: 'inline-block',
    margin: '20px',
    padding: '10px 20px',
    backgroundColor: '#007bff',
    color: '#fff',
    textDecoration: 'none',
    borderRadius: '8px',
    textAlign: 'center'
  };

  return (
    <div>
      <Link to="/bom" style={linkStyle}>Go to BOM</Link>

      <h2>Upload Items</h2>

      {/* Mode Toggle Buttons */}
      <div className="toggle-buttons">
        <button
          onClick={() => setActiveMode("single")}
          className={activeMode === "single" ? "active" : ""}
        >
          Single Entry
        </button>
        <button
          onClick={() => setActiveMode("bulk")}
          className={activeMode === "bulk" ? "active" : ""}
        >
          Bulk Upload
        </button>
      </div>

      {/* Single Entry Form */}
      {activeMode === "single" && (
        <div className="form">
          <h3>Single Entry Form</h3>
          <div>
            <label>Internal Item Name</label>
            <input
              type="text"
              name="internal_item_name"
              value={singleEntry.internal_item_name}
              onChange={handleSingleEntryChange}
              placeholder="Enter the item name"
            />
          </div>
          <div>
            <label>Tenant ID</label>
            <input
              type="text"
              name="tenant_id"
              value={singleEntry.tenant_id}
              onChange={handleSingleEntryChange}
              placeholder="Enter the tenant ID"
            />
          </div>
          <div>
            <label>Type</label>
            <select
              name="type"
              value={singleEntry.type}
              onChange={handleSingleEntryChange}
            >
              <option value="">Select type</option>
              <option value="sell">Sell</option>
              <option value="purchase">Purchase</option>
              <option value="component">Component</option>
            </select>
          </div>
          <div>
            <label>Unit of Measure (UoM)</label>
            <select
              name="uom"
              value={singleEntry.uom}
              onChange={handleSingleEntryChange}
            >
              <option value="">Select UoM</option>
              <option value="kgs">Kilograms (kgs)</option>
              <option value="nos">Numbers (nos)</option>
            </select>
          </div>
          <div>
            <label>Scrap Type (for sell type)</label>
            <input
              type="text"
              name="additional_attributes__scrap_type"
              value={singleEntry.additional_attributes__scrap_type}
              onChange={handleSingleEntryChange}
              placeholder="Enter scrap type (if applicable)"
            />
          </div>
          <div>
            <label>Min Buffer</label>
            <input
              type="number"
              name="min_buffer"
              value={singleEntry.min_buffer}
              onChange={handleSingleEntryChange}
              placeholder="Enter minimum buffer"
            />
          </div>
          <div>
            <label>Max Buffer</label>
            <input
              type="number"
              name="max_buffer"
              value={singleEntry.max_buffer}
              onChange={handleSingleEntryChange}
              placeholder="Enter maximum buffer"
            />
          </div>
          <div>
            <label>Average Weight Needed</label>
            <select
              name="additional_attributes__avg_weight_needed"
              value={singleEntry.additional_attributes__avg_weight_needed}
              onChange={handleSingleEntryChange}
            >
              <option value="false">False</option>
              <option value="true">True</option>
            </select>
          </div>
          <div>
            <label>Created At</label>
            <input
              type="date"
              name="createdAt"
              value={singleEntry.createdAt}
              onChange={handleSingleEntryChange}
            />
          </div>
          <div>
            <label>Updated At</label>
            <input
              type="date"
              name="updatedAt"
              value={singleEntry.updatedAt.slice(0, 19)}
              onChange={handleSingleEntryChange}
            />
          </div>
          <button onClick={handleSingleEntrySubmit}>Add Item</button>
        </div>
      )}

      {activeMode === "bulk" && (
        <div className="bulk-upload-container">
          <input type="file" accept=".csv" onChange={handleCSVUpload} />
          <button onClick={handleSubmit}>Submit Bulk Data</button>
          <button onClick={downloadCSVTemplate}>Download CSV Template</button>
          {csvErrors.length > 0 && (
            <div style={{ color: "red" }}>
              <h3>CSV Errors</h3>
              <ul>
                {csvErrors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default UploadItemPage;

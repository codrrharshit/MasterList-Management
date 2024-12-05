import React, { useEffect, useState } from "react";
import Papa from "papaparse";
import "./UploadBom.css";
import { Link } from "react-router-dom";
const UploadBOMPage = ({ setBOMs, BOMs }) => {
  const [csvData, setCsvData] = useState([]);
  const [csvErrors, setCsvErrors] = useState([]);
  const [singleEntry, setSingleEntry] = useState({
    item_id: "",
    component_id: "",
    quantity: "",
    created_by: "system_user",
    last_updated_by: "system_user",
    createdAt: "",
    updatedAt: "",
  });
  const [activeMode, setActiveMode] = useState("single");
  const [lastId, setLastId] = useState(0);

  // Predefined lists for validation

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

  const parseCSV = (data) => {
    Papa.parse(data, {
      complete: (result) => {
        const parsedData = result.data.filter((row) =>
          Object.values(row).some((value) => value !== "")
        );
        const errors = validateData(parsedData);
        if (errors.length === 0) {
          setCsvData(parsedData);
        } else {
          setCsvErrors(errors);
          setCsvData([]);
        }
      },
      header: true,
    });
  };

  const getStoredData = (key) => {
    const storedData = localStorage.getItem(key);
    return storedData ? JSON.parse(storedData) : [];
  };

  const validateData = (data) => {
    const errors = [];
    const itemComponentPairs = new Set();
    const storedItems = getStoredData("items");
    const sellItemIds = storedItems
      .filter((item) => item.type === "sell")
      .map((item) => item.id);
    const purchaseIds = storedItems
      .filter((item) => item.type === "purchase")
      .map((item) => item.id);
    const existingItems = storedItems.map((item) => item.id);
    data.forEach((row, index) => {
      const { item_id, component_id, quantity } = row;

      // Validate that the component is not a 'sell' item
      if (sellItemIds.includes(component_id)) {
        errors.push(
          `Row ${
            index + 1
          }: Sell item (${component_id}) cannot be used as a component.`
        );
      }

      // Validate that the item_id is not a 'purchase' item
      if (purchaseIds.includes(item_id)) {
        errors.push(
          `Row ${
            index + 1
          }: Purchase item (${item_id}) cannot be used as component.`
        );
      }

      // Validate duplicate item_id and component_id combinations

      if (item_id === component_id) {
        errors.push(
          `Row ${
            index + 1
          }: item_id (${item_id}) cannot be the same as component_id (${component_id}).`
        );
      }

      // Validate the quantity is between 1 and 100
      const qty = parseInt(quantity, 10);
      if (isNaN(qty) || qty < 1 || qty > 100) {
        errors.push(
          `Row ${
            index + 1
          }: Quantity (${quantity}) should be between 1 and 100.`
        );
      }

      // Validate that the item_id exists in the stored items
      if (!existingItems.includes(item_id)) {
        errors.push(
          `Row ${
            index + 1
          }: BOM cannot be created for item_id (${item_id}) not created yet.`
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
      setBOMs((prev) => [...prev, entryWithId]);
      alert("BOM added successfully!");
      setSingleEntry({
        id: newId + 1,
        item_id: "",
        component_id: "",
        quantity: "",
        created_by: "system_user",
        last_updated_by: "system_user",
        createdAt: "",
        updatedAt: "",
      });
    } else {
      alert(`Please fix the errors:\n${errors.join("\n")}`);
    }
  };

  const handleSubmit = () => {
    if (csvData.length > 0) {
      console.log("Submitting bulk data:", csvData);
      const maxIdInBulk = csvData.reduce(
        (maxId, item) => Math.max(maxId, parseInt(item.id || 0)),
        lastId
      );
      setBOMs((prev) => [...prev, ...csvData]);
      alert("BOMs uploaded successfully!");
    } else {
      alert("No valid data to submit. Please fix the errors.");
    }
  };

  const downloadBOMTemplate = () => {
    // Define the BOM template headers
    const headers = [
      "id",
      "item_id",
      "component_id",
      "quantity",
      "created_by",
      "last_updated_by",
      "createdAt",
      "updatedAt",
    ];

    // Example row for better guidance in the template
    const exampleRow = [
      "1",
      "item123",
      "comp456",
      "10",
      "user1",
      "user2",
      "2024-12-05T12:00:00Z",
      "2024-12-05T12:30:00Z",
    ];

    // Combine headers and example row into CSV content
    const csvContent = [headers, exampleRow]
      .map((row) => row.join(","))
      .join("\n");

    // Create a Blob for the CSV content
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });

    // Create a link element to download the file
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "bom_template.csv";

    // Trigger the download
    document.body.appendChild(link);
    link.click();

    // Cleanup
    document.body.removeChild(link);
  };

  useEffect(() => {
    if (BOMs.length > 0) {
      const maxId = BOMs.reduce(
        (maxId, item) => Math.max(maxId, parseInt(item.id || 0)),
        0
      );
      setLastId(maxId);
    }
  }, [BOMs]);
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
        <Link to="/item" style={linkStyle}>Go to Items</Link>
      <h2>Upload BOM</h2>
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

      {activeMode === "single" && (
        <div className="form">
          <label>Item Id</label>
          <input
            type="text"
            name="item_id"
            value={singleEntry.item_id}
            onChange={handleSingleEntryChange}
            placeholder="Enter Item ID"
          />
          <label>Component ID</label>
          <input
            type="text"
            name="component_id"
            value={singleEntry.component_id}
            onChange={handleSingleEntryChange}
            placeholder="Enter Component ID"
          />

          <label>Quantity</label>
          <input
            type="number"
            name="quantity"
            value={singleEntry.quantity}
            onChange={handleSingleEntryChange}
            placeholder="Enter Quantity"
          />
          <label>Created At</label>
          <input
            type="date"
            name="createdAt"
            value={singleEntry.createdAt}
            onChange={handleSingleEntryChange}
          />
          <label>Updated At</label>
          <input
            type="date"
            name="updatedAt"
            value={singleEntry.updatedAt}
            onChange={handleSingleEntryChange}
          />

          <button onClick={handleSingleEntrySubmit}>Add BOM</button>
        </div>
      )}

      {activeMode === "bulk" && (
        <div className="bulk-upload-container">
          <input type="file" accept=".csv" onChange={handleCSVUpload} />
          <button onClick={handleSubmit}>Submit Bulk Data</button>
          <button onClick={downloadBOMTemplate}>Download BOM Template</button>
          {csvErrors.length > 0 && (
            <div className="errors" style={{ color: "red" }}>
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

export default UploadBOMPage;

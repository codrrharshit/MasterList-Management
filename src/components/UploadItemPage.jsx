import React, { useEffect, useState } from "react";
import Papa from "papaparse";
import "./UploadItemPage.css";
import { Link } from "react-router-dom";
import { useLocalStorage } from "../hooks/useLocalStorage";

const UploadItemPage = ({ setItems, items , Edit,Delete }) => {
  const [SingleEntryUpdate,setSingleEntryUpdate]=useState(0)
  const [CsvEntryUpdate,setCsvEntryUpdate]=useState(0)
  const [csvData, setCsvData] = useState([]);
  const [csvErrors, setCsvErrors] = useState([]);
  const [singleEntry, setSingleEntry] = useState({
    internal_item_name: "",
    tenant_id: "",
    item_description: "Sample Item",
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
    customer_item_name: "Customer ABC",
    is_deleted: false,
  
  });
  const [activeMode, setActiveMode] = useState("single");
  const [lastId, setLastId] = useState(0);
  const [Data,setData]=useLocalStorage('Data',[])

  useEffect(() => {
    fetch("https://api-assignment.inveesync.in/items")
      .then((response) => response.json())
      .then((data) => {
        console.log( data);
        setItems(data); 
        const maxId = data.reduce(
          (maxId, item) => Math.max(maxId, parseInt(item.id || 0)),
          0
        );
        setLastId(maxId);
      })
      .catch((error) => console.error("Error fetching data:", error));
  }, [SingleEntryUpdate,CsvEntryUpdate,Edit,Delete]);

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
    const errorData = []; // Array to collect rows with errors
    
    const seenItems = new Set(); // Track unique internal_item_name + tenant combinations
  
    data.forEach((item, index) => {
      const errors = []; // Array to collect errors for this row
      
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
          `Row ${index + 1}: Duplicate 'internal_item_name' and 'tenant' combination.`
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
      const avgWeight = String(additional_attributes__avg_weight_needed).toLowerCase();
      if (avgWeight !== "true" && avgWeight !== "false") {
        errors.push(
          `Row ${index + 1}: 'avg_weight_needed' must be 'true' or 'false'.`
        );
      }
  
      // 6. scrap_type is required for 'sell' items
      if (
        type === "sell" &&
        (!additional_attributes__scrap_type || additional_attributes__scrap_type === "")
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
          `Row ${index + 1}: 'type' must be one of 'sell', 'purchase', or 'component'.`
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
          `Row ${index + 1}: 'max_buffer' must be greater than or equal to 'min_buffer'.`
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
          `Row ${index + 1}: Invalid 'createdAt' format. Expected 'YYYY-MM-DD' or ISO 8601.`
        );
      }
  
      if (
        updatedAt &&
        !updatedAt.match(dateRegex) &&
        !updatedAt.match(isoDateRegex)
      ) {
        errors.push(
          `Row ${index + 1}: Invalid 'updatedAt' format. Expected 'YYYY-MM-DD' or ISO 8601.`
        );
      }
  
      // If there are any errors, add them to the errorData array along with the row data
      if (errors.length > 0) {
        errorData.push({ ...item, errors: errors.join(", ") });
      }
    });
    console.log(errorData);
  
    return errorData;
  };
  
  const generateCSV = (errorData) => {
    
    const header = ["id","internal_item_name","tenant_id","type","uom","max_buffer","created_by","last_updated_by","createdAt","updatedAt","additional_attributes__avg_weight_needed","additional_attributes__scrap_type","errors"];  // CSV header
    const rows = errorData.map(item => {
      return [
        item.id,
        item.internal_item_name,
        item.tenant_id,
        item.type,
        item.uom,  
        item.max_buffer,
        item.min_buffer,
        item.created_by,
        item.last_updated_by,
        item.createdAt,
        item.updatedAt,
        item.additional_attributes?.avg_weight_needed,
        item.additional_attributes?.scrap_type,
        item.errors
      ];
    });
    
    console.log(rows);
    // Convert the header and rows into a CSV string
    const csvContent = [
      header.join(","),  // Convert the header to a string
      ...rows.map(row => row.join(",")),  // Convert each row to a string
    ].join("\n");
  
    return csvContent;
  };
 const errorData = validateData(csvErrors); 
  const csvContent = generateCSV(errorData); 

  const downloadCSV = (csvContent, fileName = "error_report.csv") => {
    

    alert("There were errors in your CSV file. Please download the error report.");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    link.click();
  };
  

  const handleSingleEntryChange = (e) => {
    const { name, value } = e.target;
    setSingleEntry((prev) => ({ ...prev, [name]: value }));
  };

  const handleSingleEntrySubmit = async () => {
    const newId = lastId + 1;
    const errors = validateData([singleEntry]);
  
    if (errors.length === 0) {
      const entryWithId = {
        ...singleEntry,
        id: newId, 
        additional_attributes: {
          avg_weight_needed: singleEntry.additional_attributes__avg_weight_needed,
          scrap_type:singleEntry.additional_attributes__scrap_type,
        },
      };
      delete entryWithId.additional_attributes__avg_weight_needed;
      delete entryWithId.additional_attributes__scrap_type;
     
      const realData={...entryWithId,lastId:lastId}
      setData((prevstate)=>[...prevstate,realData])

        const response = await fetch("https://api-assignment.inveesync.in/items", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(entryWithId),
        });
  
        if (response.ok) {
          const result = await response.json(); // Get response data if needed
          alert("Item added successfully!");
          setSingleEntryUpdate((prevstate)=>prevstate+1)
          
  
          // Reset singleEntry with a new ID and empty fields
          setSingleEntry({
            id: newId + 1,
            internal_item_name: "",
            tenant_id: "",
            item_description: "Sample Item",
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
            customer_item_name: "Customer ABC",
            is_deleted: false,
          });
        } else {
          const errorData = await response.json();
          alert(`Failed to add item. Server responded with: ${errorData.message || response.statusText}`);
        }
      
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

  const handleSubmit = async () => {
    
    if (csvData.length > 0) {
      console.log("Submitting bulk data:", csvData);
  

    
      let currentId = lastId + 1;
      
      const transformedData = csvData.map((item) => {

        const transformedItem = {
          ...item,
          id: currentId,
          additional_attributes: {
            avg_weight_needed: item.additional_attributes__avg_weight_needed,
            scrap_type: item.additional_attributes__scrap_type,
          },
          item_description: "Sample Item",
          customer_item_name: "Customer ABC",
          is_deleted: false,
        };
        
        currentId++;
        delete transformedItem.additional_attributes__avg_weight_needed;
        delete transformedItem.additional_attributes__scrap_type;
        const realData={...transformedItem,lastId:lastId}
        setData((prevstate)=>[...prevstate,realData])
        return transformedItem;
      });
  
      // Post each item individually
      
        for (const item of transformedData) {
          const response = await fetch("https://api-assignment.inveesync.in/items", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(item),
          });
  
          if (!response.ok) {
            const errorData = await response.json();
            console.error(`Failed to upload item ID ${item.id}:`, errorData.message || response.statusText);
            alert(`Failed to upload item ID ${item.id}: ${errorData.message || response.statusText}`);
            return;
          }
        }
  
        // If all items succeed
       setCsvEntryUpdate((prevstate)=>prevstate+1)
        setLastId(currentId - 1);
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
              <button onClick={()=>downloadCSV(csvContent)}>DownLoad Error File</button>
            <h3>CSV Errors</h3>
            <ul>
              {csvErrors.map((item, index) => (
                <li key={index}>
                  {item.errors && item.errors.split(',').map((error, errorIndex) => (
                    <div key={errorIndex}>{error}</div>
                  ))}
                </li>
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

import React, { useEffect, useState } from "react";
import Papa from "papaparse";
import "./UploadBom.css";
import { Link } from "react-router-dom";
const UploadBOMPage = ({ setBOMs, BOMs,Edit,Delete }) => {
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
  const [SingleEntryUpdate,setSingleEntryUpdate]=useState(0)
  const [CsvEntryUpdate,setCsvEntryUpdate]=useState(0)
  const [activeMode, setActiveMode] = useState("single");
  const [lastId, setLastId] = useState(0);
  const [pendingJobs,setPendinJobs]=useState(0);

  useEffect(() => {
    fetch("https://api-assignment.inveesync.in/bom")
      .then((response) => response.json())
      .then((data) => {
        console.log( data);
        setBOMs(data); 
        const maxId = data.reduce(
          (maxId, item) => Math.max(maxId, parseInt(item.id || 0)),
          0
        );
        setLastId(maxId);
      })
      .catch((error) => console.error("Error fetching data:", error));
  }, [SingleEntryUpdate,CsvEntryUpdate,Edit,Delete]);

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
        console.log(data);
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
    const errorData = [];
    const itemComponentPairs = new Set();
    const storedItems = getStoredData("Data");
    const sellItemIds = storedItems
      .filter((item) => item.type === "sell")
      .map((item) => item.id);
    const purchaseIds = storedItems
      .filter((item) => item.type === "purchase")
      .map((item) => item.id);
    const existingItems = storedItems.map((item) => (item.id));
    console.log(existingItems);
    data.forEach((row, index) => {
      const errors=[]
      const { item_id, component_id, quantity } = row;

      // Validate that the component is not a 'sell' item
      if (sellItemIds.includes(Number(component_id))) {
        errors.push(
          `Row ${
            index + 1
          }: Sell item (${component_id}) cannot be used as a component.`
        );
      }

      // Validate that the item_id is not a 'purchase' item
      if (purchaseIds.includes(Number(item_id))) {
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
      if (!existingItems.includes(Number(item_id))) {
        errors.push(
          `Row ${
            index + 1
          }: BOM cannot be created for item_id (${item_id}) not created yet.`
        );
      }

      if (!Number(item_id) && sellItemIds.length > 0) {
        errors.push(
          `Row ${index + 1}: Sell item must have at least 1 valid item_id.`
        );
        setPendinJobs((prevstate)=>prevstate+1)
      }

      if (!Number(component_id) && purchaseIds.length > 0) {
        errors.push(
          `Row ${index + 1}: Purchase item must have at least 1 valid component_id.`
        );
        setPendinJobs((prevstate)=>prevstate+1)
      }

      if (errors.length > 0) {
        errorData.push({ ...row, errors: errors.join(", "),pendingJobs:pendingJobs});
      }
    });
    return errorData;
  };

  const generateCSV = (errorData) => {
    
    const header = ["id","item_id","component_id","quantity","created_by","last_updated_by","createdAt","updatedAt","errors","pendingJobs"];  // CSV header
    const rows = errorData.map(item => {
      return [
        item.id,
        item.item_id,
        item.component_id,
        item.quantity,
        item.created_by,  
        item.last_updated_by,
        item.createdAt,
        item.updatedAt,
        item.errors,
        item.pendingJobs,
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
        id: newId, // Assign new ID
      };
  

        const response = await fetch("https://api-assignment.inveesync.in/bom", {
          method: "POST", // HTTP method
          headers: {
            "Content-Type": "application/json", // Sending data in JSON format
          },
          body: JSON.stringify(entryWithId), // Send the entry data as a JSON string
        });
  
        if (response.ok) {
          // If the request is successful, update the BOMs state
          setSingleEntryUpdate((prevstate)=>prevstate+1)
          alert("BOM added successfully!");
          
          // Reset the singleEntry state after successful submission
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
          const errorData = await response.json(); // Get the error message from the API response
          alert(`Failed to add BOM: ${errorData.message || response.statusText}`);
          
        }
    
    } else {
      alert(`Please fix the errors:\n${errors.join("\n")}`)
      setSingleEntry({
        id: newId ,
        item_id: "",
        component_id: "",
        quantity: "",
        created_by: "system_user",
        last_updated_by: "system_user",
        createdAt: "",
        updatedAt: "",
      });;
    }
  };
  

  const handleSubmit = async () => {
    if (csvData.length > 0) {
      console.log("Submitting bulk data:", csvData);
  
      let currentId = lastId; // Start with the lastId
  
      
        for (const item of csvData) {
          currentId += 1; // Increment the ID for each item
  
          // Add the updated ID to the current item
          const itemWithId = { ...item, id: currentId.toString() };
  
          // Make POST request for each item
          const response = await fetch("https://api-assignment.inveesync.in/bom", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(itemWithId),
          });
  
          if (!response.ok) {
            const error = await response.text();
            console.error(`Failed to upload item ID ${currentId}:`, error);
            alert(`Failed to upload item ID ${currentId}: ${error}`);
            continue; // Skip to the next item on failure
          }
  
          const result = await response.json();
          console.log(`Successfully uploaded item ID ${currentId}:`, result);
  
          setCsvEntryUpdate((prevstate)=>prevstate+1)

        }
  
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

export default UploadBOMPage;

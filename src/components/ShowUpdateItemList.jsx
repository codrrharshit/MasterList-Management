import React, { useState } from "react";
import "./ShowUpdateItemList.css";

import EditModal from "./EditModal";

export default function ShowUpdateItemList({ items, setItems,setEdit ,setDelete}) {
  console.log(items);
  const [positions, setPositions] = useState({});
  const [rowId, setrowId] = useState("");
  const [selectedRowData, setSelectedRowData] = useState(null); 
  const [showModal, setShowModal] = useState(false); 

  const handleDelete = async (rowId) => {
    const itemToDelete = items.find(item => item.id === rowId);

    if (!itemToDelete) {
      alert("Item not found.");
      return;
    }
      // Confirm deletion before proceeding
      const confirmDelete = window.confirm("Are you sure you want to delete this item?");
      if (!confirmDelete) return;
  
      // Make a DELETE request to the API
      const response = await fetch(`https://api-assignment.inveesync.in/items/${rowId}`, {
        method: 'DELETE',
        headers: {
          "Content-Type": "application/json",
        },
      });
  
      if (response.ok) {
        // Optionally, if the API responds with a success message, you can log it
        const result = await response.json();
        setDelete((prevstate)=>prevstate+1)
        alert(`Item ${itemToDelete.internal_item_name } deleted successfully!`);
      } else {
        const errorData = await response.json();
        alert(`Failed to delete item. Server responded with: ${errorData.message || response.statusText}`);
      }
    
  };
  
  const handleEdit = (rowId) => {
    const selectedRow = items.find(item => item.id === rowId);
    setSelectedRowData(selectedRow); // Set the data to be edited
    setShowModal(true); // Open the modal
  };
  const handleSave = (editedData) => {
    setEdit((prevstate)=>prevstate+1)
    setShowModal(false); // Close the modal
  };
  return (
    <div>
     
      <h2>Item Table</h2>
      <table border="1" onClick={() => setPositions({})}>
        <thead>
          <tr>
            <th>ID</th>
            <th>Internal Item Name</th>
            <th>Type</th>
            <th>UoM</th>
            <th>Avg Weight Needed</th>
            <th>Scrap Type</th>
            <th>Min Buffer</th>
            <th>Max Buffer</th>
            <th>Created By</th>
            <th>Last Updated By</th>
            <th>Created At</th>
            <th>Updated At</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr
              key={item.id}
            >
              <td>{item.id}</td>
              <td>{item.internal_item_name}</td>
              <td>{item.type}</td>
              <td>{item.uom}</td>
              <td>
                {item.additional_attributes?.avg_weight_needed?"TRUE" : "FALSE" || "N/A"
                }
              </td>
              <td>{item.additional_attributes?.scrap_type||"N/A"}</td>
              <td>{item.min_buffer}</td>
              <td>{item.max_buffer}</td>
              <td>{item.created_by}</td>
              <td>{item.last_updated_by}</td>
              <td>{new Date(item.createdAt).toISOString()}</td>
              <td>{new Date(item.updatedAt).toISOString()}</td>
              <td>
                <button onClick={()=>handleEdit(item.id)}>Edit</button>
                <button onClick={()=>handleDelete(item.id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {showModal && selectedRowData && (
        <EditModal
          rowData={selectedRowData}
          onClose={() => setShowModal(false)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}

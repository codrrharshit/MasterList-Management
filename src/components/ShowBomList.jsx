import React, { useState } from "react";
import "./ShowUpdateItemList.css";
import BOMEditModal from "./BOMEditModal";

export default function ShowBomList({ setBOMs, BOMs, setEdit ,setDelete}) {
  const [selectedRowData, setSelectedRowData] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const handleDelete = async (rowId) => {

      const bomToDelete = BOMs.find((bom) => bom.id === rowId);
  
      if (!bomToDelete) {
        alert("BOM not found.");
        return;
      }
  
      // Confirm deletion before proceeding
      const confirmDelete = window.confirm(`Are you sure you want to delete the BOM with ID: ${rowId}?`);
      if (!confirmDelete) return;
  
      // Make a DELETE request to the API
      const response = await fetch(`https://api-assignment.inveesync.in/bom/${rowId}`, {
        method: 'DELETE',
        headers: {
          "Content-Type": "application/json",
        },
      });
  
      if (response.ok) {
        // Optionally, log the response if the API returns data
        const result = await response.json();
        console.log("BOM deleted successfully:", result);
  
        setDelete((prevstate)=>prevstate+1)
  

        alert(`BOM with ID: ${rowId} deleted successfully!`);
      } else {
        const errorData = await response.json();
        alert(`Failed to delete BOM. Server responded with: ${errorData.message || response.statusText}`);
      }
  
  };
  
  const handleEdit = (rowId) => {
    const selectedRow = BOMs.find((BOM) => BOM.id === rowId);
    setSelectedRowData(selectedRow); // Set the data to be edited
    setShowModal(true); // Open the modal
  };
  const handleSave = (editedData) => {
    setEdit((prevstate)=>prevstate+1)
    setShowModal(false); // Close the modal
  };

  return (
    <div>
      <h2>BOM Table</h2>
      <table border="1">
        <thead>
          <tr>
            <th>ID</th>
            <th>Item ID</th>
            <th>Component ID</th>
            <th>Quantity</th>
            <th>Created_BY</th>
            <th>Updated_By</th>
            <th>Created_At</th>
            <th>Updated_At</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {BOMs.map((BOM) => (
            <tr key={BOM.id}>
              <td>{BOM.id}</td>
              <td>{BOM.item_id}</td>
              <td>{BOM.component_id}</td>
              <td>{BOM.quantity}</td>
              <td>{BOM.created_by}</td>
              <td>{BOM.last_updated_by}</td>
              <td>{new Date(BOM.createdAt).toISOString()}</td>
              <td>{new Date(BOM.updatedAt).toISOString()}</td>
              <td>
                <button onClick={() => handleEdit(BOM.id)}>Edit</button>
                <button onClick={() => handleDelete(BOM.id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {showModal && selectedRowData && (
        <BOMEditModal
          rowData={selectedRowData}
          onClose={() => setShowModal(false)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}

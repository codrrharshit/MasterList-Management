import React, { useState } from "react";
import "./ShowUpdateItemList.css";

import EditModal from "./EditModal";

export default function ShowUpdateItemList({ items, setItems }) {
  console.log(items);
  const [positions, setPositions] = useState({});
  const [rowId, setrowId] = useState("");
  const [selectedRowData, setSelectedRowData] = useState(null); 
  const [showModal, setShowModal] = useState(false); 

  const handleDelete = (rowId)=>{
    setItems((prevstate)=>prevstate.filter((item)=> item.id!==rowId))
  }
  const handleEdit = (rowId) => {
    const selectedRow = items.find(item => item.id === rowId);
    setSelectedRowData(selectedRow); // Set the data to be edited
    setShowModal(true); // Open the modal
  };
  const handleSave = (editedData) => {
    const updatedItems = items.map(item =>
      item.id === editedData.id ? { ...item, ...editedData } : item
    );
    setItems(updatedItems); // Update the items state with the edited data
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
                {item.additional_attributes__avg_weight_needed ? "Yes" : "No"}
              </td>
              <td>{item.additional_attributes__scrap_type || "N/A"}</td>
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

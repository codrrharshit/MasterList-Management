import React, { useState } from "react";
import "./ShowUpdateItemList.css";
import BOMEditModal from "./BOMEditModal";

export default function ShowBomList({ setBOMs, BOMs }) {
  const [selectedRowData, setSelectedRowData] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const handleDelete = (rowId) => {
    setBOMs((prevstate) => prevstate.filter((BOM) => BOM.id !== rowId));
  };
  const handleEdit = (rowId) => {
    const selectedRow = BOMs.find((BOM) => BOM.id === rowId);
    setSelectedRowData(selectedRow); // Set the data to be edited
    setShowModal(true); // Open the modal
  };
  const handleSave = (editedData) => {
    const updatedItems = BOMs.map((BOM) =>
      BOM.id === editedData.id ? { ...BOM, ...editedData } : BOM
    );
    console.log(updatedItems);
    setBOMs(updatedItems); // Update the items state with the edited data
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

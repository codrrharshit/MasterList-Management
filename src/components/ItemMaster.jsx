import React, { useState } from 'react'
import UploadItemPage from './UploadItemPage'
import ShowUpdateItemList from './ShowUpdateItemList'
import { useLocalStorage } from '../hooks/useLocalStorage'

export default function ItemMaster() {
    const [items,setItems]=useLocalStorage("items",[])
    const [Edit,setEdit]=useState(0)
    const [Delete,setDelete]=useState(0)
  return (
   <>
   <UploadItemPage setItems={setItems} items={items} Edit={Edit} Delete={Delete} />
   <ShowUpdateItemList items={items} setItems={setItems} setEdit={setEdit} setDelete={setDelete} />
   </>
  )
}

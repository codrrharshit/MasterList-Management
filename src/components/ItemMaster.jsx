import React, { useState } from 'react'
import UploadItemPage from './UploadItemPage'
import ShowUpdateItemList from './ShowUpdateItemList'
import { useLocalStorage } from '../hooks/useLocalStorage'

export default function ItemMaster() {
    const [items,setItems]=useLocalStorage('items',[])
  return (
   <>
   <UploadItemPage setItems={setItems} items={items}/>
   <ShowUpdateItemList items={items} setItems={setItems} />
   </>
  )
}

import React, { useState } from 'react'
import UploadBOMPage from './UploadBom'
import ShowBomList from './ShowBomList';
import { useLocalStorage } from '../hooks/useLocalStorage';

export default function BomMaster() {
    const [BOMs,setBOMs]= useLocalStorage('BOMS',[])
    const [Edit,setEdit]=useState(0)
    const [Delete,setDelete]=useState(0)
    console.log(BOMs);
  return (
    <>
    <UploadBOMPage setBOMs={setBOMs} BOMs={BOMs} Edit={Edit} Delete={Delete}/>
    <ShowBomList setBOMs={setBOMs} BOMs={BOMs} setEdit={setEdit} setDelete={setDelete}/>
    </>
  )
}

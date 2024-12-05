import React, { useState } from 'react'
import UploadBOMPage from './UploadBom'
import ShowBomList from './ShowBomList';
import { useLocalStorage } from '../hooks/useLocalStorage';

export default function BomMaster() {
    const [BOMs,setBOMs]= useLocalStorage('BOMS',[])
    console.log(BOMs);
  return (
    <>
    <UploadBOMPage setBOMs={setBOMs} BOMs={BOMs}/>
    <ShowBomList setBOMs={setBOMs} BOMs={BOMs}/>
    </>
  )
}

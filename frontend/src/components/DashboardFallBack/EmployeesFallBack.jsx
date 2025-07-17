import React from 'react'
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

const EmployeesFallBack = () => (
 <div className="p-4">
 
     <div className="mb-4">
       <Skeleton height={80} width="100%" borderRadius={"15px"} />
     </div>

     <div className="d-flex gap-2 mb-4 flex-wrap">
       {[...Array(4)].map((_, i) => (
         <div key={i} style={{ flex: "1 1 200px" }}>
           <Skeleton height={30} width={230} borderRadius={"15px"}/>
         </div>
       ))}
     </div>
 

     <div className="d-flex gap-2 mb-5 flex-wrap">
       {[...Array(8)].map((_, i) => (
         <div key={i} style={{ flex: "1 1 200px"}}>
           <Skeleton height={190} width={260} borderRadius={"15px"}/>
         </div>
       ))}
     </div>

     <div className="d-flex mb-2 justify-content-center">
       {[...Array(8)].map((_, i) => (
         <div key={i} style={{ marginRight: "30px" }}>
           <Skeleton height={6} width={6} borderRadius={"50%"}/>
         </div>
       ))}
     </div>
 
    <div className="mb-4 mt-5">
       <Skeleton height={80} width="100%" borderRadius={"15px"}/>
     </div>

     <div className="d-flex gap-2 mb-4 flex-wrap">
       {[...Array(4)].map((_, i) => (
         <div key={i} style={{ flex: "1 1 200px" }}>
           <Skeleton height={30} width={230} borderRadius={"15px"}/>
         </div>
       ))}
     </div>
 

     <div className="d-flex gap-2 mb-4 flex-wrap">
       {[...Array(8)].map((_, i) => (
         <div key={i} style={{ flex: "1 1 200px" }}>
           <Skeleton height={190} width={260} borderRadius={"15px"}/>
         </div>
       ))}
     </div>

     <div className="d-flex mb-2 justify-content-center">
       {[...Array(8)].map((_, i) => (
         <div key={i} style={{ marginRight: "30px" }}>
           <Skeleton height={6} width={6} borderRadius={"50%"}/>
         </div>
       ))}
     </div>
     
   </div>
);

export default EmployeesFallBack
import React from 'react';

export default function OwnerStatsCard({title, value, icon}){
  return (
    <div className="card p-3 d-flex align-items-start" style={{minWidth:180}}>
      <div className="d-flex align-items-center w-100">
        <div style={{width:48, height:48, borderRadius:10, background:'#f8fafc', display:'flex', alignItems:'center', justifyContent:'center', marginRight:12}}>
          {icon}
        </div>
        <div>
          <div className="small text-muted">{title}</div>
          <div className="h4 fw-bold">{value}</div>
        </div>
      </div>
    </div>
  );
}

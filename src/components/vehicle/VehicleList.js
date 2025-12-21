import React from 'react';
import VehicleCard from './VehicleCard';

const VehicleList = ({ vehicles }) => (
  <div className="row justify-content-center">
    {vehicles.map(vehicle => (
      <div className="col-12 col-md-6 col-lg-3 mb-4" key={vehicle.id}>
        <div className="h-100">
          <VehicleCard vehicle={vehicle} />
        </div>
      </div>
    ))}
  </div>
);

export default VehicleList;

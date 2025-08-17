import React from 'react';
import VehicleCard from './VehicleCard';

const VehicleList = ({ vehicles }) => (
  <div className="row justify-content-center">
    {vehicles.map(vehicle => (
      <div className="col-12 col-md-6 col-lg-4 mb-4" key={vehicle.id}>
        <VehicleCard vehicle={vehicle} />
      </div>
    ))}
  </div>
);

export default VehicleList;

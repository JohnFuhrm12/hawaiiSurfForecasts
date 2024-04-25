import "leaflet-velocity/dist/leaflet-velocity.css";
import "leaflet-velocity/dist/leaflet-velocity.js";
import { forwardRef, useEffect } from 'react';
import { useMap } from 'react-leaflet/hooks';
import L from "leaflet";

const LeafletVelocity = forwardRef((props, ref) => {
    const map = useMap();
  
    useEffect(() => {
      if (!map) return;
  
      let mounted = true;
      let windLayer;
      let waterLayer;
      let windGlobalLayer;
  
      fetch("https://onaci.github.io/leaflet-velocity/wind-global.json")
        .then((response) => response.json())
        .then((data) => {
          if (!mounted) return;
  
          windGlobalLayer = L.velocityLayer({
            displayValues: true,
            displayOptions: {
              velocityType: "Water",
              position: "bottomleft",
              emptyString: "No water data"
            },
            data: data,
            maxVelocity: 30,
            velocityScale: 0.01 // arbitrary default 0.005
          });
  
          if (ref.current && windGlobalLayer)
            ref.current.addOverlay(windGlobalLayer, "Wind");
        })
        .catch((err) => console.log(err));
  
   return () => {
        mounted = false;
        if (ref.current) {
          ref.current.removeOverlay(windLayer);
        }
      };
    }, [map]);
  
    return null;
  });
  
  export default LeafletVelocity;
/** Script ACLs do not delete 
 read=nobody 
write=nobody
execute=anonymous 
  **/ 
 var factory = require("modules/predix/factory");

try {

  // get a token for clientId == parking2
  var predix = new factory.Predix({credentials:{clientId:"parking2", clientPassword:"parking2"}});
  
  // get an instance of ParkingManager
  var parkingManager = predix.getParkingManager();
  
  // Specify location of the parking slot
  var boundary1 = "32.123:-117";
  var boundary2 = "32.714983:-117.158012";

  // To simplify, just get the first 20 parking spots at this location (if any)
  var options = {
      "page":	0,
      "size": 20
  };
  
  // list all the parking spots within the above boundaries
  var result =  parkingManager.listParkingSpots(boundary1, boundary2, options);  
 
  // iterate through the list of parking spot and determine each parking spot availability
  var report = [];
  for (var i = 0; i < result.locations.length; i++) {
    
    var parkingSpot  =  result.locations[i];console.log(JSON.stringify(parkingSpot));
    report.push(findAvailability(parkingSpot));
  }
  
  return report;
}catch(exception){
  return exception;
}

/*
 * For a given parking spot, get first monitoring device. Ask the device for the last IN and OUT events
 * If OUT.timstamp > IN.timestamp, then this parking spot is free
 */
function findAvailability(parkingSpot) {
  
  // For simplicity, we only consider the first device (asset) that is monitoring the parking spot
  var assetList = parkingSpot.listParkingAssets();
  var asset = assetList[0];

  // Get first page of Vehicles In and Vehicle Out event since the last 48h for the given asset
  var endDate = new Date();
  var endTime = endDate.getTime();
  var startTime = endTime - (480 * 3600000);
  
  var options = {    
    "size":20,
    "page":0
  };
  
  var vIn = asset.listVehiculesIn(startTime, endTime, options);console.log("vIn - p1 " + JSON.stringify(vIn));
  var vOut = asset.listVehiculesOut(startTime, endTime, options);console.log("vOut - p1 " + JSON.stringify(vOut));
  
  var totalPagesIn = vIn ? vIn.page.totalPages : 1;
  var totalPagesOut = vOut ? vOut.page.totalPages : 1;
  
  // get last page of In and Out events, since events are sorted in ascending order
  var optionsIn = {    
    "size":20,
    "page":totalPagesIn - 1
  };
  
  var optionsOut = {    
    "size":20,
    "page":totalPagesOut - 1
  };
  
  vIn = asset.listVehiculesIn(startTime, endTime, optionsIn);console.log("vIn - p2 " + JSON.stringify(vIn));
  vOut = asset.listVehiculesOut(startTime, endTime, optionsOut);console.log("vOut - p2 " + JSON.stringify(vOut));
  
  // Get last know In event for the selected parking parking slot
  var lastEventIn = lastEvent(vIn, parkingSpot["location-uid"]);
  
  // get last know Out event for current parking
  var lastEventOut = lastEvent(vOut, parkingSpot["location-uid"]);
  
  return {
    
    spot: parkingSpot["location-uid"],
    location: parkingSpot.coordinates,
    lastIn: new Date(lastEventIn.timestamp), 
    lastOut: new Date(lastEventOut.timestamp),
    available: lastEventOut.timestamp > lastEventIn.timestamp
  };
}

function lastEvent(eventList, parkingId) {
  
  var lastEvent = null;
  for (var i = 0; eventList && i < eventList._embedded.events.length; i++) {
    lastEvent = eventList._embedded.events[i]["location-uid"] == parkingId ? eventList._embedded.events[i] : lastEvent;
  }
  
  return lastEvent ? lastEvent : {};
}			
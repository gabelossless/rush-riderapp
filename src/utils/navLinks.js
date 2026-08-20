/* ------------------------------------------------------------------ */
/*  Deep links that hand navigation off to the driver's own phone —    */
/*  Rush shows the pickup/dropoff, the driver's own Google Maps/Waze   */
/*  app does the turn-by-turn. Both are universal links: they open the */
/*  native app if installed, otherwise fall back to the web.           */
/* ------------------------------------------------------------------ */

export function googleMapsUrl({ lat, lng }) {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`
}

export function wazeUrl({ lat, lng }) {
  return `https://waze.com/ul?ll=${lat},${lng}&navigate=yes&zoom=17`
}

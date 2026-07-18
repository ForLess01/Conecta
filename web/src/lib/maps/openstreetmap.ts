const DEFAULT_CENTER = { latitude: -15.84, longitude: -70.021 };

export interface MapCoordinates {
  latitude: number;
  longitude: number;
}

export function buildOpenStreetMapEmbedUrl(coordinates?: MapCoordinates) {
  const center = coordinates ?? DEFAULT_CENTER;
  const span = coordinates ? 0.08 : 0.8;
  const params = new URLSearchParams({
    bbox: [
      center.longitude - span,
      center.latitude - span,
      center.longitude + span,
      center.latitude + span,
    ].join(","),
    layer: "mapnik",
  });

  if (coordinates) {
    params.set("marker", `${center.latitude},${center.longitude}`);
  }

  return `https://www.openstreetmap.org/export/embed.html?${params.toString()}`;
}

export function buildOpenStreetMapLink(coordinates?: MapCoordinates) {
  const center = coordinates ?? DEFAULT_CENTER;
  return `https://www.openstreetmap.org/?mlat=${center.latitude}&mlon=${center.longitude}#map=${coordinates ? 12 : 7}/${center.latitude}/${center.longitude}`;
}

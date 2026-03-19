# Mars SceneView Skill

Domain-specific patterns for configuring and working with ArcGIS SceneView on Mars.

---

## Mars Globe Initialization Pattern

```typescript
import Map from "@arcgis/core/Map.js";
import SceneView from "@arcgis/core/views/SceneView.js";
import ElevationLayer from "@arcgis/core/layers/ElevationLayer.js";
import TileLayer from "@arcgis/core/layers/TileLayer.js";
import SpatialReference from "@arcgis/core/geometry/SpatialReference.js";

// Note: In v5.0, prefer <arcgis-scene> web component over new SceneView().
// This pattern shows the programmatic equivalent for reference.

const marsElevation = new ElevationLayer({
  url: "https://astro.arcgis.com/arcgis/rest/services/OnMars/MDEM200M/ImageServer",
  copyright: "NASA, ESA, HRSC, Goddard Space Flight Center, USGS, Esri"
});

const marsImagery = new TileLayer({
  url: "https://astro.arcgis.com/arcgis/rest/services/OnMars/MDIM/MapServer",
  title: "Viking MDIM 2.1",
  copyright: "USGS Astrogeology Science Center, NASA, JPL, Esri"
});

const map = new Map({
  ground: { layers: [marsElevation] },
  layers: [marsImagery]
});

const view = new SceneView({
  container: "viewDiv",
  map: map,
  spatialReference: new SpatialReference({ wkid: 104971 }), // Mars_2000_Sphere
  camera: {
    position: { longitude: 77.45, latitude: 18.44, z: 500000 }, // Above Jezero
    heading: 0,
    tilt: 0
  }
});

await view.when();
```

## Key Gotchas

1. **`ground: "world-elevation"` is Earth-only** — always use an explicit ElevationLayer for Mars.
2. **`spatialReference` must be set on the SceneView**, not the Map. The Map inherits it from the view.
3. **The SDK auto-detects Mars from the CRS** and adjusts globe diameter + atmosphere. No manual config needed.
4. **Camera positions use Mars coordinates** — longitude/latitude are areocentric on Mars.
5. **`view.goTo()` works on Mars** — use it for camera fly-to animations.
6. **Daylight is buggy on Mars** — consider disabling `view.environment.lighting.directShadowsEnabled`.

## GeoJSON on Mars

GeoJSON loaded via `GeoJSONLayer` is auto-reprojected to the scene's Mars CRS if the GeoJSON coordinates are in standard lon/lat (which MMGIS data is). No manual projection needed.

```typescript
import GeoJSONLayer from "@arcgis/core/layers/GeoJSONLayer.js";

const traverseLayer = new GeoJSONLayer({
  url: "https://mars.nasa.gov/mmgis-maps/M20/Layers/json/M20_waypoints.json",
  title: "Perseverance Waypoints",
  renderer: { /* SimpleRenderer with rover color */ },
  spatialReference: new SpatialReference({ wkid: 104971 })
});
```

For in-memory GeoJSON (static data), create a Blob URL:

```typescript
const blob = new Blob([JSON.stringify(geojson)], { type: "application/json" });
const url = URL.createObjectURL(blob);
const layer = new GeoJSONLayer({ url, title: "Spirit Traverse" });
```

## Definition Expression for Animation

Filter waypoints by sol to create progressive reveal:

```typescript
layer.definitionExpression = `sol <= ${currentSol}`;
```

This is the core mechanism for the sol-by-sol animation.

## Elevation Querying on Mars

```typescript
const result = await view.ground.queryElevation(geometry, {
  returnSampleInfo: true
});
// result.geometry contains Z values sampled from Mars DEM
```

Works the same as Earth — the ground's ElevationLayer handles Mars terrain.

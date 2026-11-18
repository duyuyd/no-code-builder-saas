import React from "react";
import {Composition,registerRoot} from "remotion";
import {NuvoraVideoComposition} from "../components/video/NuvoraVideoComposition";

function VideoRoot(){
 return <Composition
  id="NuvoraDemo"
  component={NuvoraVideoComposition}
  durationInFrames={450}
  fps={30}
  width={1280}
  height={720}
  defaultProps={{projectName:"NuvoraCraft by NPTduy",pagePath:"/",nodes:[]}}
 />;
}
registerRoot(VideoRoot);

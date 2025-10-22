import RotatingEarth from "@/components/ui/wireframe-dotted-globe";

export default function EarthPlanet3D() {
  return (
    <div className="w-32 h-32">
      <RotatingEarth width={128} height={128} />
    </div>
  );
}

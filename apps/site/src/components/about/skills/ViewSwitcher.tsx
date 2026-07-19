import type { Skill } from "@/types";
import ListView from "./ListView";

export default function ViewSwitcher({ skills }: { skills: Skill }) {
  return (
    <div className="measure">
      <h3>My Skillset</h3>
      <div className="not-prose">
        <ListView skills={skills} />
      </div>
    </div>
  );
}

/**
 * Script to import workout history into the app format
 * Run this to convert your workout data into LiftEntry format
 */

import { LiftEntry } from '../utils/chat-log';

const workoutData = {
  "user_id": "Toji_Project",
  "lifts": {
    "push": {
      "seated_dumbbell_shoulder_press": [
        { "date": "Week 1", "weight_kg": 12, "reps": [10, 10] },
        { "date": "Week 2 (Tue Feb 3)", "weight_kg": 14, "reps": [10, 10, 10], "note": "Graduated" },
        { "date": "Week 3 (Thu Feb 12)", "weight_kg": 16, "reps": [7, 6, 6], "note": "New Baseline" }
      ],
      "incline_dumbbell_press": [
        { "date": "Week 1", "weight_kg": 14, "reps": [8, 9, 9, 8] },
        { "date": "Week 2 (Tue Feb 3)", "weight_kg": 14, "reps": [8, 10, 12], "note": "Sandbagged" },
        { "date": "Week 2 (Thu Feb 5)", "weight_kg": 16, "reps": [8, 8, 6] },
        { "date": "Week 3 (Thu Feb 12)", "weight_kg": 18, "reps": [5], "note": "Failed jump" },
        { "date": "Week 3 (Thu Feb 12)", "weight_kg": 16, "reps": [8, 6], "note": "Left shoulder stability failure" }
      ],
      "cable_lateral_raise": [
        { "date": "Week 1", "weight_kg": 3.4, "reps": [10, 8.5, 8], "note": "Behind Back" },
        { "date": "Week 2 (Tue Feb 3)", "weight_kg": 4.5, "reps": [12, 9, 9, 9], "note": "Front version" },
        { "date": "Week 3 (Thu Feb 12)", "weight_kg": 4.5, "reps": [9, 9, 9], "note": "Stalled/Fatigue" }
      ],
      "tricep_rope_pushdown": [
        { "date": "Week 1", "weight_kg": 17, "reps": [12, 11, 9] },
        { "date": "Week 2 (Tue Feb 3)", "weight_kg": 19.3, "reps": [10, 9, 10] },
        { "date": "Week 3 (Thu Feb 12)", "weight_kg": 19.3, "reps": [10, 10, 10] }
      ],
      "overhead_tricep_extension": [
        { "date": "Week 1", "weight_kg": 8, "reps": [9, 8, 9] },
        { "date": "Week 2 (Tue Feb 3)", "weight_kg": 10.2, "reps": [8, 10, 9] },
        { "date": "Week 3 (Thu Feb 12)", "weight_kg": 10.2, "reps": [10, 10, 10] }
      ],
      "assisted_dips": [
        { "date": "Week 1", "assist_kg": -14, "reps": [6, 6] },
        { "date": "Week 2 (Tue Feb 3)", "assist_kg": -14, "reps": [6, 4], "note": "Triceps fried early" }
      ]
    },
    "pull": {
      "lat_pulldown": [
        { "date": "Week 1 (Jan 20)", "weight_kg": 39, "reps": [10, 8, 7] },
        { "date": "Week 2 (Wed Feb 4)", "weight_kg": 52, "reps": [8, 8, 6], "note": "Grip limited" },
        { "date": "Week 3 (Sun Feb 8)", "weight_kg": 52, "reps": [10, 10], "note": "Still arm dominant" },
        { "date": "Week 3 (Correction)", "weight_kg": 45, "reps": [10], "note": "Paused reps" },
        { "date": "Week 3 (Fri Feb 13)", "weight_kg": 52, "reps": [8, 8, 8], "note": "Grip failure" }
      ],
      "diverging_seated_row": [
        { "date": "Week 1", "weight_kg": 45, "reps": [9, 8, 9], "note": "Too heavy/arms" },
        { "date": "Week 2", "weight_kg": 33, "reps": [8, 10, 10, 10], "note": "Too light" },
        { "date": "Week 3 (Sun Feb 8)", "weight_kg": 36, "reps": [10, 9, 8], "note": "Good form" },
        { "date": "Week 3 (Fri Feb 13)", "weight_kg": 41, "reps": [8, 8, 8], "note": "Cheat reps detected" }
      ],
      "face_pulls": [
        { "date": "Week 1", "weight_kg": 17, "reps": [12, 17, 15] },
        { "date": "Week 3 (Sun Feb 8)", "weight_kg": 19.3, "reps": [12, 12, 12, 11] },
        { "date": "Week 3 (Fri Feb 13)", "weight_kg": 23, "reps": [12, 10, 9] }
      ],
      "single_arm_db_row": [
        { "date": "Week 2", "weight_kg": 10, "reps": [14, 13] },
        { "date": "Week 3 (Sun Feb 8)", "weight_kg": 14, "reps": [11, 10, 9] },
        { "date": "Week 3 (Fri Feb 13)", "weight_kg": 18, "reps": [8, 7, 8] }
      ],
      "bicep_curls_incline": [
        { "date": "Week 1", "weight_kg": 8, "reps": [8, 4, 5] },
        { "date": "Week 2", "weight_kg": 10, "reps": [10, 9, 8] },
        { "date": "Week 3", "weight_kg": 10, "reps": [10, 10, 10], "note": "Volume PR" }
      ]
    },
    "legs": {
      "leg_press": [
        { "date": "Week 1 (Mon Jan 20)", "weight_kg": 59, "reps": [10, 11, 8] },
        { "date": "Week 2 (Mon Feb 2)", "weight_kg": 66, "reps": [10, 12, 12] },
        { "date": "Week 2 (Thu Feb 5)", "weight_kg": 73, "reps": [10, 11, 10] },
        { "date": "Week 3 (Wed Feb 11)", "weight_kg": 73, "reps": [6], "note": "Failed (Form correction depth)" }
      ],
      "leg_extension": [
        { "date": "Week 1", "weight_kg": 32, "reps": [15, 15] },
        { "date": "Week 2 (Mon Feb 2)", "weight_kg": 32, "reps": [10, 12, 12] },
        { "date": "Week 2 (Thu Feb 5)", "weight_kg": 39, "reps": [12, 12, 12] },
        { "date": "Week 3 (Wed Feb 11)", "weight_kg": 48.5, "reps": [10, 10, 10] }
      ],
      "rdl": [
        { "date": "Week 1", "weight_kg": 32, "reps": [10] },
        { "date": "Week 3 (Wed Feb 11)", "weight_kg": 40, "reps": [8, 8, 8], "note": "Sandbagged" }
      ]
    }
  }
};

// Parse date strings to timestamps
function parseDate(dateStr: string): number {
  const now = new Date('2026-02-14'); // Current date
  
  // Try to extract specific dates
  const dateMatch = dateStr.match(/(Mon|Tue|Wed|Thu|Fri|Sat|Sun) (Jan|Feb|Mar) (\d+)/);
  if (dateMatch) {
    const months: Record<string, number> = { Jan: 0, Feb: 1, Mar: 2 };
    const day = parseInt(dateMatch[3]);
    const month = months[dateMatch[2]];
    return new Date(2026, month, day).getTime();
  }
  
  // Week-based dates (estimate)
  if (dateStr.includes('Week 1')) return new Date('2026-01-20').getTime();
  if (dateStr.includes('Week 2')) return new Date('2026-02-03').getTime();
  if (dateStr.includes('Week 3')) return new Date('2026-02-10').getTime();
  
  return now.getTime();
}

// Convert to LiftEntry format
export function convertToLiftEntries(): LiftEntry[] {
  const entries: LiftEntry[] = [];
  
  for (const [category, exercises] of Object.entries(workoutData.lifts)) {
    for (const [exerciseName, sessions] of Object.entries(exercises)) {
      // Convert exercise name to readable format
      const name = exerciseName
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
      
      for (const session of sessions as any[]) {
        const reps = session.reps as number[];
        const sets = reps.length;
        const avgReps = Math.round(reps.reduce((a, b) => a + b, 0) / sets);
        
        entries.push({
          name,
          sets,
          reps: avgReps,
          weight: session.weight_kg ?? session.assist_kg,
          timestamp: parseDate(session.date)
        });
      }
    }
  }
  
  return entries.sort((a, b) => a.timestamp - b.timestamp);
}

// Generate the code to copy/paste into the Storage screen
export function generateImportCode(): string {
  const entries = convertToLiftEntries();
  return `
// Paste this into the "Insert mock data" button function in storage.tsx
const importedLifts = ${JSON.stringify(entries, null, 2)};
for (const lift of importedLifts) {
  await addLift(lift);
}
`;
}

// Output for console
console.log('=== CONVERTED LIFT ENTRIES ===');
console.log(JSON.stringify(convertToLiftEntries(), null, 2));
console.log('\n=== IMPORT CODE ===');
console.log(generateImportCode());
